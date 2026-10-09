import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import { 
  FileCheck2, 
  UploadCloud, 
  Calendar, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  Building, 
  Layers, 
  Plus, 
  X,
  FileSpreadsheet,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function ComplianceModule({ onDataChange }) {
  const { user } = useAuth();
  const { lang } = useLang();

  // Active Sub-tab inside Compliance
  const [activeSubTab, setActiveSubTab] = useState('reconcile'); // 'reconcile', 'tax', 'commitments'

  // Data states
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [systemTx, setSystemTx] = useState([]);
  const [statementEntries, setStatementEntries] = useState([]);
  const [taxWithholdings, setTaxWithholdings] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(false);

  // File Upload Staging
  const fileInputRef = useRef(null);
  const [uploadStatus, setUploadStatus] = useState('');

  // Tax Modal State
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [grossAmount, setGrossAmount] = useState('');
  const [tdsRate, setTdsRate] = useState('5');
  const [vdsRate, setVdsRate] = useState('7.5');
  const [mushakNum, setMushakNum] = useState('');

  // Commitment Modal State
  const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);
  const [commitTitle, setCommitTitle] = useState('');
  const [commitCategory, setCommitCategory] = useState('Payroll');
  const [commitAmount, setCommitAmount] = useState('');
  const [commitDay, setCommitDay] = useState('5');
  const [commitAccountId, setCommitAccountId] = useState('');

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (user && selectedAccountId) {
      loadAccountReconciliationData(selectedAccountId);
    }
  }, [user, selectedAccountId]);

  const loadInitialData = async () => {
    try {
      const { data: accData } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (accData && accData.length > 0) {
        setAccounts(accData);
        setSelectedAccountId(accData[0].id);
        if (!commitAccountId) setCommitAccountId(accData[0].id);
      }

      loadTaxData();
      loadCommitmentsData();
    } catch (err) {
      console.error('Error loading compliance baseline:', err);
    }
  };

  const loadAccountReconciliationData = async (accId) => {
    setLoading(true);
    try {
      // System Transactions for this Account
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('account_id', accId)
        .order('transaction_date', { ascending: false });
      if (txData) setSystemTx(txData);

      // Statement entries uploaded via CSV
      const { data: stData } = await supabase
        .from('statement_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('account_id', accId)
        .order('entry_date', { ascending: false });
      if (stData) setStatementEntries(stData);
    } catch (err) {
      console.error('Error loading account tx:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTaxData = async () => {
    const { data } = await supabase
      .from('tax_withholdings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setTaxWithholdings(data);
  };

  const loadCommitmentsData = async () => {
    const { data } = await supabase
      .from('recurring_commitments')
      .select('*')
      .eq('user_id', user.id)
      .order('due_day', { ascending: true });
    if (data) setCommitments(data);
  };

  // CSV Statement Parser (Standard Bank Statement: Date, Description, Amount, Type)
  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAccountId) return;

    setUploadStatus('Parsing statement entries...');
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);

        if (lines.length < 2) {
          setUploadStatus('Invalid or empty CSV file.');
          return;
        }

        const entriesToInsert = [];
        // Skip header line
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 3) {
            const entryDate = cols[0];
            const description = cols[1];
            const amount = parseFloat(cols[2]);
            const type = (cols[3] || '').toLowerCase() === 'credit' ? 'credit' : 'debit';

            if (!isNaN(amount) && entryDate) {
              entriesToInsert.push({
                user_id: user.id,
                account_id: selectedAccountId,
                entry_date: entryDate,
                description: description || 'Bank Entry',
                amount: Math.abs(amount),
                type: type,
                is_reconciled: false
              });
            }
          }
        }

        if (entriesToInsert.length > 0) {
          const { error } = await supabase.from('statement_entries').insert(entriesToInsert);
          if (error) throw error;
          setUploadStatus(`Successfully parsed and staged ${entriesToInsert.length} statement records.`);
          loadAccountReconciliationData(selectedAccountId);
        } else {
          setUploadStatus('No matching record patterns found.');
        }
      } catch (err) {
        setUploadStatus('Error processing CSV. Check format: Date, Description, Amount, Type');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  // Match and Reconcile System Transaction with Staged Bank Entry
  const handleReconcileMatch = async (txId, stId) => {
    try {
      await supabase
        .from('transactions')
        .update({ is_reconciled: true, statement_entry_id: stId })
        .eq('id', txId)
        .eq('user_id', user.id);

      await supabase
        .from('statement_entries')
        .update({ is_reconciled: true, matched_transaction_id: txId })
        .eq('id', stId)
        .eq('user_id', user.id);

      loadAccountReconciliationData(selectedAccountId);
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error('Reconciliation match failed:', err);
    }
  };

  // Add Bangladesh NBR Tax / VAT Record
  const handleSaveTax = async (e) => {
    e.preventDefault();
    if (!vendorName || !grossAmount) return;

    try {
      const gross = parseFloat(grossAmount);
      const tRate = parseFloat(tdsRate) || 0;
      const vRate = parseFloat(vdsRate) || 0;

      const tdsAmt = (gross * tRate) / 100;
      const vdsAmt = (gross * vRate) / 100;
      const net = gross - (tdsAmt + vdsAmt);

      await supabase.from('tax_withholdings').insert([{
        user_id: user.id,
        vendor_name: vendorName,
        gross_amount: gross,
        tds_rate: tRate,
        tds_amount: tdsAmt,
        vds_rate: vRate,
        vds_amount: vdsAmt,
        net_paid: net,
        mushak_number: mushakNum || null,
        status: 'pending_challan'
      }]);

      setIsTaxModalOpen(false);
      setVendorName('');
      setGrossAmount('');
      setMushakNum('');
      loadTaxData();
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error('Error saving tax log:', err);
    }
  };

  // Add Recurring Overhead Commitment (Payroll, Rent, Utility)
  const handleSaveCommitment = async (e) => {
    e.preventDefault();
    if (!commitTitle || !commitAmount || !commitAccountId) return;

    try {
      await supabase.from('recurring_commitments').insert([{
        user_id: user.id,
        account_id: commitAccountId,
        title: commitTitle,
        category: commitCategory,
        amount: parseFloat(commitAmount),
        due_day: parseInt(commitDay, 10),
        is_active: true
      }]);

      setIsCommitmentModalOpen(false);
      setCommitTitle('');
      setCommitAmount('');
      loadCommitmentsData();
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error('Error saving commitment:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Section Tab Switcher */}
      <div className="bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#E11D48] px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200">
            NBR Compliance & Reconciliation
          </span>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            {lang === 'bn' ? 'ট্যাক্স কমপ্লায়েন্স ও ব্যাংক সমন্বয়' : 'Tax Withholding & Bank Audit'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' ? 'দ্বৈত কলাম ব্যাংক রিকনসিলিয়েশন, ভ্যাট (Mushak 6.3) এবং নিয়মিত বিল পরিচালনা' : 'Audit statements, track TDS/VDS withholdings, and schedule monthly overheads'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('reconcile')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'reconcile' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Bank Match
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('tax')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'tax' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            TDS / VDS (NBR)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('commitments')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'commitments' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Recurring Commitments
          </button>
        </div>
      </div>

      {/* 2. SUB-TAB: DUAL-COLUMN RECONCILIATION */}
      {activeSubTab === 'reconcile' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="bg-white border border-[#F3D7D9] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 uppercase">Target Vault:</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
              >
                {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name} ({formatBDT(a.balance, lang)})</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
                id="csvUploadInput"
              />
              <label
                htmlFor="csvUploadInput"
                className="py-2 px-3.5 bg-rose-50 hover:bg-[#E11D48] text-[#E11D48] hover:text-white border border-rose-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Bank CSV</span>
              </label>
            </div>
          </div>

          {uploadStatus && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
              {uploadStatus}
            </div>
          )}

          {/* Dual Columns Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Left: System ERP Ledger */}
            <div className="bg-white border border-[#F3D7D9] rounded-3xl p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#E11D48]" />
                  <span>ERP Ledger Entries</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  {systemTx.filter(t => !t.is_reconciled).length} Unreconciled
                </span>
              </div>

              <div className="mt-4 flex-1 overflow-y-auto space-y-2 max-h-[500px]">
                {systemTx.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-12">No transactions recorded for this vault.</p>
                ) : (
                  systemTx.map((tx) => (
                    <div
                      key={tx.id}
                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                        tx.is_reconciled ? 'bg-emerald-50/50 border-emerald-200 opacity-60' : 'bg-slate-50/80 border-slate-100'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400">{tx.transaction_date}</span>
                          <span className="font-bold text-slate-800">{tx.category || tx.type}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 max-w-[200px]">{tx.notes || '—'}</p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-black text-slate-900 block">{formatBDT(tx.amount, lang)}</span>
                        {tx.is_reconciled ? (
                          <span className="text-[9px] font-black uppercase text-emerald-600 flex items-center gap-1 justify-end">
                            <CheckCircle2 className="w-3 h-3" /> Reconciled
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold uppercase text-amber-600">Pending Match</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Bank Statement Feed */}
            <div className="bg-white border border-[#F3D7D9] rounded-3xl p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <span>Bank Statement Staging Feed</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  {statementEntries.filter(s => !s.is_reconciled).length} Open Entries
                </span>
              </div>

              <div className="mt-4 flex-1 overflow-y-auto space-y-2 max-h-[500px]">
                {statementEntries.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-12">
                    No statement records uploaded. Upload bank CSV above.
                  </p>
                ) : (
                  statementEntries.map((st) => (
                    <div
                      key={st.id}
                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                        st.is_reconciled ? 'bg-emerald-50/50 border-emerald-200 opacity-60' : 'bg-slate-50/80 border-slate-100'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400">{st.entry_date}</span>
                          <span className="font-bold text-slate-800">{st.description}</span>
                        </div>
                        <span className={`text-[9px] font-black uppercase mt-0.5 inline-block ${
                          st.type === 'credit' ? 'text-emerald-600' : 'text-[#E11D48]'
                        }`}>
                          {st.type}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-black text-slate-900 block">{formatBDT(st.amount, lang)}</span>
                        {st.is_reconciled ? (
                          <span className="text-[9px] font-black uppercase text-emerald-600 flex items-center gap-1 justify-end">
                            <CheckCircle2 className="w-3 h-3" /> Matched
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 mt-1 justify-end">
                            {systemTx.filter(t => !t.is_reconciled && Number(t.amount) === Number(st.amount)).map(match => (
                              <button
                                key={match.id}
                                type="button"
                                onClick={() => handleReconcileMatch(match.id, st.id)}
                                className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold cursor-pointer hover:bg-emerald-700"
                              >
                                Auto-Match
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. SUB-TAB: TAX WITHHOLDINGS (AIT / TDS / VDS) */}
      {activeSubTab === 'tax' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white border border-[#F3D7D9] rounded-2xl p-4">
            <div>
              <h4 className="text-xs font-black uppercase text-slate-900">NBR Tax & VAT Ledger</h4>
              <p className="text-xs text-slate-500">Log Section 52 TDS and Mushak 6.3 VDS deductions</p>
            </div>
            <button
              type="button"
              onClick={() => setIsTaxModalOpen(true)}
              className="py-2 px-3.5 bg-[#E11D48] text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Challan Entry</span>
            </button>
          </div>

          <div className="bg-white border border-[#F3D7D9] rounded-3xl p-5 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Vendor / Supplier</th>
                  <th className="py-2.5 px-3">Gross Bill</th>
                  <th className="py-2.5 px-3">TDS Deducted</th>
                  <th className="py-2.5 px-3">VDS Deducted</th>
                  <th className="py-2.5 px-3">Net Disbursed</th>
                  <th className="py-2.5 px-3">Mushak 6.3</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {taxWithholdings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      No tax withholding entries recorded.
                    </td>
                  </tr>
                ) : (
                  taxWithholdings.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-mono text-slate-500">{tx.created_at?.substring(0, 10)}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{tx.vendor_name}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{formatBDT(tx.gross_amount, lang)}</td>
                      <td className="py-3 px-3 font-mono text-[#E11D48]">
                        -{formatBDT(tx.tds_amount, lang)} ({tx.tds_rate}%)
                      </td>
                      <td className="py-3 px-3 font-mono text-amber-600">
                        -{formatBDT(tx.vds_amount, lang)} ({tx.vds_rate}%)
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600">{formatBDT(tx.net_paid, lang)}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{tx.mushak_number || 'N/A'}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-700">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SUB-TAB: RECURRING COMMITMENTS */}
      {activeSubTab === 'commitments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white border border-[#F3D7D9] rounded-2xl p-4">
            <div>
              <h4 className="text-xs font-black uppercase text-slate-900">Scheduled Operational Commitments</h4>
              <p className="text-xs text-slate-500">Track monthly recurring payroll, rent, utilities, and vendor retainers</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCommitmentModalOpen(true)}
              className="py-2 px-3.5 bg-[#E11D48] text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Recurring Overhead</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {commitments.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-xs text-slate-400 font-bold bg-white rounded-3xl border border-[#F3D7D9]">
                No recurring overheads registered.
              </div>
            ) : (
              commitments.map((com) => (
                <div key={com.id} className="bg-white border border-[#F3D7D9] rounded-3xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-50 text-[#E11D48]">
                        {com.category}
                      </span>
                      <span className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Due Day: {com.due_day}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900 mt-3">{com.title}</h4>
                    <p className="text-xl font-mono font-black text-slate-950 mt-1">
                      {formatBDT(com.amount, lang)}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Status: Active</span>
                    <span className="text-[10px] font-mono text-emerald-600 font-bold">Monthly Schedule</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD TAX WITHHOLDING ENTRY */}
      {isTaxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsTaxModalOpen(false)}
              className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900 mb-1">Record NBR Tax / VAT Challan</h3>
            <p className="text-xs text-slate-500 mb-4">Calculate TDS Section 52 and VDS Mushak deductions.</p>

            <form onSubmit={handleSaveTax} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Vendor / Payee</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Logistics Ltd."
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Gross Bill Amount (৳ BDT)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={grossAmount}
                  onChange={(e) => setGrossAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">TDS Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tdsRate}
                    onChange={(e) => setTdsRate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">VDS Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vdsRate}
                    onChange={(e) => setVdsRate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Mushak 6.3 Challan No</label>
                <input
                  type="text"
                  placeholder="e.g. MUSHAK-6.3-99482"
                  value={mushakNum}
                  onChange={(e) => setMushakNum(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTaxModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#E11D48] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD RECURRING COMMITMENT */}
      {isCommitmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsCommitmentModalOpen(false)}
              className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900 mb-1">New Recurring Commitment</h3>
            <p className="text-xs text-slate-500 mb-4">Schedule recurring monthly expenses.</p>

            <form onSubmit={handleSaveCommitment} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Commitment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corporate Office Rent"
                  value={commitTitle}
                  onChange={(e) => setCommitTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={commitCategory}
                    onChange={(e) => setCommitCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
                  >
                    <option value="Payroll">Payroll</option>
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Server/SaaS">Server/SaaS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Due Day (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={commitDay}
                    onChange={(e) => setCommitDay(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Amount (৳ BDT)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={commitAmount}
                  onChange={(e) => setCommitAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Disbursing Vault</label>
                <select
                  value={commitAccountId}
                  onChange={(e) => setCommitAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name}</option>)}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCommitmentModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#E11D48] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Schedule Commitment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
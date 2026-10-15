import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import AddTransactionModal from './AddTransactionModal';
import { 
  FileSpreadsheet, 
  Printer, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search,
  Building2,
  Phone,
  MapPin,
  User
} from 'lucide-react';

export default function StatementsModule({ onDataChange }) {
  const { user, profile } = useAuth();
  const { lang } = useLang();

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);

  // Filters
  const [dateRangeMode, setDateRangeMode] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) loadStatementData();
  }, [user]);

  const loadStatementData = async () => {
    setLoading(true);
    try {
      const { data: accData } = await supabase
        .from('accounts')
        .select('id, account_name, account_type')
        .eq('user_id', user.id);
      if (accData) setAccounts(accData);

      const { data: txData, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });
      if (!error && txData) setTransactions(txData);
    } catch (err) {
      console.error('Error fetching statement entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAccountName = (accId) => {
    if (!accId) return 'General Vault';
    const found = accounts.find(a => a.id === accId);
    return found ? found.account_name : 'Vault Account';
  };

  const filteredData = transactions.filter((t) => {
    const tDate = t.transaction_date || t.created_at?.substring(0, 10);
    if (dateRangeMode === 'custom') {
      if (startDate && tDate < startDate) return false;
      if (endDate && tDate > endDate) return false;
    }
    if (selectedAccount !== 'all' && t.account_id !== selectedAccount) return false;
    if (selectedType !== 'all') {
      if (selectedType === 'inflow' && !['income', 'transfer_in'].includes(t.type)) return false;
      if (selectedType === 'outflow' && !['expense', 'transfer_out', 'project_expense'].includes(t.type)) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const notes = (t.notes || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();
      const acc = getAccountName(t.account_id).toLowerCase();
      if (!notes.includes(q) && !cat.includes(q) && !acc.includes(q)) return false;
    }
    return true;
  });

  const totalInflow = filteredData
    .filter((t) => ['income', 'transfer_in'].includes(t.type))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalOutflow = filteredData
    .filter((t) => ['expense', 'transfer_out', 'project_expense'].includes(t.type))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalInflow - totalOutflow;

  // EXCEL / CSV EXPORT WITH FULL USER METADATA LETTERHEAD
  const exportToExcel = () => {
    const orgName = "FinFlow Treasury ERP";
    const userName = profile?.full_name || user?.email?.split('@')[0] || 'User';
    const userPhone = profile?.phone || 'N/A';
    const userAddr = profile?.address || 'Dhaka, Bangladesh';

    const metadataRows = [
      [`"${orgName}"`],
      [`"Client / Account Holder: ${userName}"`],
      [`"Contact Phone: ${userPhone}"`],
      [`"Address: ${userAddr}"`],
      [`"Generated: ${new Date().toLocaleString()}"`],
      []
    ];

    const headers = ['Date', 'Account / Wallet', 'Type', 'Category', 'Notes / Particulars', 'Inflow (BDT)', 'Outflow (BDT)'];
    
    const dataRows = filteredData.map((t) => {
      const isInflow = ['income', 'transfer_in'].includes(t.type);
      const isOutflow = ['expense', 'transfer_out', 'project_expense'].includes(t.type);
      return [
        `"${t.transaction_date || t.created_at?.substring(0, 10)}"`,
        `"${getAccountName(t.account_id).replace(/"/g, '""')}"`,
        `"${t.type.toUpperCase()}"`,
        `"${(t.category || 'General').replace(/"/g, '""')}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
        isInflow ? Number(t.amount).toFixed(2) : '0.00',
        isOutflow ? Number(t.amount).toFixed(2) : '0.00'
      ];
    });

    dataRows.push([]);
    dataRows.push(['"TOTAL"', '""', '""', '""', '""', `"${totalInflow.toFixed(2)}"`, `"${totalOutflow.toFixed(2)}"`]);
    dataRows.push(['"NET MOVEMENT"', '""', '""', '""', '""', `"${netBalance.toFixed(2)}"`, '""']);

    const fullContent = [
      ...metadataRows.map(r => r.join(',')),
      headers.join(','),
      ...dataRows.map(r => r.join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + fullContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FinFlow_Statement_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Control Action Bar */}
      <div className="bg-white border border-[#F3D7D9] rounded-3xl p-5 shadow-xs print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#E11D48]" />
              <span>{lang === 'bn' ? 'অডিট ও হিসাব বিবরণী' : 'Treasury Statements & Audit'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn' ? 'সরাসরি আয়-ব্যয় রেকর্ড করুন এবং এক্সেল/পিডিএফ স্টেটমেন্ট তৈরি করুন' : 'Export statements with verified user letterhead'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAddTxOpen(true)}
              className="py-2.5 px-4 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'bn' ? 'আয় / ব্যয় যুক্ত করুন' : 'Record Income / Expense'}</span>
            </button>

            <button
              type="button"
              onClick={exportToExcel}
              className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel (CSV)</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="py-2.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date Scope</label>
            <select
              value={dateRangeMode}
              onChange={(e) => setDateRangeMode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold text-slate-800"
            >
              <option value="all">All Time Records</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {dateRangeMode === 'custom' && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Wallet</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
            >
              <option value="all">All Accounts</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search</label>
            <input
              type="text"
              placeholder="Particulars, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
            />
          </div>
        </div>
      </div>

      {/* PRINTABLE STATEMENT LETTERHEAD SHEET */}
      <div className="bg-white border border-[#F3D7D9] rounded-3xl p-6 sm:p-10 shadow-xs print:border-none print:shadow-none print:p-0">
        
        {/* Letterhead Header with Logo & User Contact Information */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white border border-[#F3D7D9] p-1.5 flex items-center justify-center shadow-xs">
                <img src="/logo.png" alt="FinFlow Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-950 tracking-tight">FinFlow Treasury</h1>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Liquidity & Audit Statement</p>
              </div>
            </div>

            {/* User Meta Information Block */}
            <div className="mt-4 space-y-1 text-xs text-slate-700">
              <p className="font-bold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Account Holder: <strong>{profile?.full_name || user?.email?.split('@')[0]}</strong></span>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Contact: <strong>{profile?.phone || 'N/A'}</strong></span>
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Address: <strong>{profile?.address || 'Dhaka, Bangladesh'}</strong></span>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs">
            <span className="px-3 py-1 rounded-full bg-rose-50 text-[#E11D48] font-black text-[10px] uppercase border border-rose-200">
              Official Audit Copy
            </span>
            <p className="text-slate-500 mt-2 font-mono">Date: {new Date().toLocaleDateString('en-GB')}</p>
            <p className="text-slate-500 font-mono">Entries: {filteredData.length}</p>
          </div>
        </div>

        {/* Ledger Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
            <span className="text-[10px] font-black uppercase text-emerald-800">Total Inflow</span>
            <p className="text-lg font-black font-mono text-emerald-600 mt-0.5">+{formatBDT(totalInflow, lang)}</p>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
            <span className="text-[10px] font-black uppercase text-[#E11D48]">Total Outflow</span>
            <p className="text-lg font-black font-mono text-[#E11D48] mt-0.5">-{formatBDT(totalOutflow, lang)}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-700">Net Movement</span>
            <p className={`text-lg font-black font-mono mt-0.5 ${netBalance >= 0 ? 'text-slate-950' : 'text-[#E11D48]'}`}>
              {netBalance >= 0 ? '+' : ''}{formatBDT(netBalance, lang)}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Account / Wallet</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Particulars / Notes</th>
                <th className="py-2.5 px-3 text-right">Inflow (BDT)</th>
                <th className="py-2.5 px-3 text-right">Outflow (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredData.map((t) => {
                const isInflow = ['income', 'transfer_in'].includes(t.type);
                return (
                  <tr key={t.id}>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{t.transaction_date || t.created_at?.substring(0, 10)}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{getAccountName(t.account_id)}</td>
                    <td className="py-2.5 px-3 uppercase text-[10px] font-black">{t.type}</td>
                    <td className="py-2.5 px-3 text-slate-700">{t.category || 'General'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.notes || '—'}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                      {isInflow ? `+${formatBDT(t.amount, lang)}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#E11D48]">
                      {!isInflow ? `-${formatBDT(t.amount, lang)}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 font-black text-sm">
                <td colSpan={5} className="py-3 px-3 uppercase text-[11px]">Net Totals</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-600">+{formatBDT(totalInflow, lang)}</td>
                <td className="py-3 px-3 text-right font-mono text-[#E11D48]">-{formatBDT(totalOutflow, lang)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Printable Signature Footers */}
        <div className="hidden print:flex items-center justify-between pt-20 mt-12 border-t border-slate-300 text-xs">
          <div>
            <div className="w-44 border-b border-slate-400 mb-1" />
            <p className="font-bold text-slate-700">Accountant / Prepared By</p>
          </div>
          <div className="text-right">
            <div className="w-44 border-b border-slate-400 mb-1 ml-auto" />
            <p className="font-bold text-slate-700">Authorized Treasury Auditor</p>
          </div>
        </div>

      </div>

      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        onTransactionAdded={() => {
          loadStatementData();
          if (onDataChange) onDataChange();
        }}
      />

    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import { 
  Printer, 
  Download, 
  Search, 
  Calendar, 
  Wallet, 
  RotateCcw,
  Building2 
} from 'lucide-react';

export default function StatementsModule() {
  const { user, profile } = useAuth();
  const { lang } = useLang();

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (user) loadStatementData();
  }, [user]);

  const loadStatementData = async () => {
    setLoading(true);

    // 1. Fetch Accounts
    const { data: accData } = await supabase
      .from('accounts')
      .select('id, account_name, account_type, balance')
      .eq('user_id', user.id);

    const accMap = {};
    if (accData) {
      setAccounts(accData);
      accData.forEach((a) => {
        accMap[a.id] = a;
      });
    }

    // 2. Project Expenses (Debits / Outflows)
    const { data: expData } = await supabase
      .from('project_expenses')
      .select('id, title, amount, expense_date, account_id, created_at')
      .eq('user_id', user.id);

    // 3. Debts (Credits / Debits)
    const { data: debtData } = await supabase
      .from('debts')
      .select('id, contact_name, amount, debt_type, status, created_at')
      .eq('user_id', user.id);

    const merged = [];

    // Parse Expenses
    if (expData) {
      expData.forEach((e) => {
        merged.push({
          id: `EXP-${e.id.substring(0, 8).toUpperCase()}`,
          rawId: e.id,
          title: `Project Expenditure: ${e.title}`,
          category: 'Project Expense',
          type: 'outflow',
          debit: Number(e.amount),
          credit: 0,
          date: e.expense_date || e.created_at.split('T')[0],
          accountName: accMap[e.account_id]?.account_name || 'Treasury Vault',
          accountId: e.account_id
        });
      });
    }

    // Parse Debts
    if (debtData) {
      debtData.forEach((d) => {
        const isRec = d.debt_type === 'receivable';
        merged.push({
          id: `REC-${d.id.substring(0, 8).toUpperCase()}`,
          rawId: d.id,
          title: isRec ? `Loan Recovery / Deposit: ${d.contact_name}` : `Debt Settlement / Payout: ${d.contact_name}`,
          category: isRec ? 'Receivable' : 'Payable',
          type: isRec ? 'inflow' : 'outflow',
          debit: isRec ? 0 : Number(d.amount),
          credit: isRec ? Number(d.amount) : 0,
          date: d.created_at.split('T')[0],
          accountName: isRec ? 'Institutional Inflow' : 'Direct Liability Payout',
          accountId: 'debt'
        });
      });
    }

    // Sort ascending by date to compute progressive running balance
    merged.sort((a, b) => new Date(a.date) - new Date(b.date));

    let progressiveBalance = 0;
    const computedList = merged.map((item) => {
      if (item.type === 'inflow') {
        progressiveBalance += item.credit;
      } else {
        progressiveBalance -= item.debit;
      }
      return {
        ...item,
        runningBalance: progressiveBalance
      };
    });

    computedList.reverse();
    setTransactions(computedList);
    setLoading(false);
  };

  // Filter logic
  const filteredList = transactions.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || t.type === selectedType;
    const matchesAccount = selectedAccountId === 'all' || t.accountId === selectedAccountId;
    
    let matchesDate = true;
    if (startDate && endDate) {
      matchesDate = t.date >= startDate && t.date <= endDate;
    } else if (startDate) {
      matchesDate = t.date >= startDate;
    } else if (endDate) {
      matchesDate = t.date <= endDate;
    }

    return matchesSearch && matchesType && matchesAccount && matchesDate;
  });

  const totalCredits = filteredList.reduce((sum, t) => sum + t.credit, 0);
  const totalDebits = filteredList.reduce((sum, t) => sum + t.debit, 0);
  const netMovement = totalCredits - totalDebits;

  const targetAccount = accounts.find(a => a.id === selectedAccountId);
  const selectedAccountTitle = targetAccount ? targetAccount.account_name : 'All Accounts';
  const currentVaultBalance = targetAccount 
    ? Number(targetAccount.balance) 
    : accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (filteredList.length === 0) return;
    const headers = ['Txn Date,Reference ID,Particulars / Narration,Account Name,Debit (BDT),Credit (BDT),Balance (BDT)\n'];
    const rows = filteredList.map((t) => 
      `"${t.date}","${t.id}","${t.title}","${t.accountName}","${t.debit > 0 ? t.debit : ''}","${t.credit > 0 ? t.credit : ''}","${t.runningBalance}"`
    );
    const blob = new Blob([headers.concat(rows.join('\n'))], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Statement_${selectedAccountTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedAccountId('all');
    setSelectedType('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6 pb-12">

      {/* ========================================================================= */}
      {/* 1. CLEAN OFFICIAL BANK STATEMENT (PRINT PREVIEW FORMAT)                   */}
      {/* ========================================================================= */}
      <div className="hidden print:block bg-white text-slate-900 font-sans p-2">
        {/* Top Header - Pure 'FinFlow Treasury' */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl">
              ৳
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                FinFlow Treasury
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Official Account Statement
              </p>
            </div>
          </div>

          <div className="text-right text-[10px] leading-tight">
            <p className="font-bold text-slate-900 uppercase">Statement Date</p>
            <p className="font-mono text-slate-700">{new Date().toLocaleString('en-GB')}</p>
            <p className="text-slate-500 mt-0.5">Currency: <strong>BDT (৳)</strong></p>
          </div>
        </div>

        {/* Customer & Account Details Grid */}
        <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg p-3.5 mb-5 bg-slate-50/50 text-[11px]">
          <div className="space-y-1">
            <p><span className="text-slate-500 font-medium">Account Holder:</span> <strong className="text-slate-900">{profile?.full_name || 'Treasury Administrator'}</strong></p>
            <p><span className="text-slate-500 font-medium">Email:</span> <span className="font-mono text-slate-800">{user?.email}</span></p>
            <p><span className="text-slate-500 font-medium">Phone:</span> <span className="font-mono text-slate-800">{profile?.phone || '+880 1621 110120'}</span></p>
            <p><span className="text-slate-500 font-medium">Address:</span> <span className="text-slate-800">{profile?.address || 'Dhaka, Bangladesh'}</span></p>
          </div>

          <div className="space-y-1 text-right">
            <p><span className="text-slate-500 font-medium">Account:</span> <strong className="text-slate-900">{selectedAccountTitle}</strong></p>
            <p><span className="text-slate-500 font-medium">Period:</span> <strong className="font-mono text-slate-900">{startDate || 'Start'} to {endDate || 'End'}</strong></p>
            <p><span className="text-slate-500 font-medium">Current Balance:</span> <strong className="font-mono text-indigo-700 text-xs">{formatBDT(currentVaultBalance, 'en')}</strong></p>
            <p><span className="text-slate-500 font-medium">Status:</span> <strong className="text-emerald-700 uppercase tracking-wider text-[10px]">Verified</strong></p>
          </div>
        </div>

        {/* Financial Summary Box */}
        <div className="grid grid-cols-3 gap-3 border border-slate-300 rounded-lg p-3 mb-5 text-center text-[10px]">
          <div>
            <span className="text-slate-500 uppercase font-bold tracking-wider">Total Deposit (+)</span>
            <p className="text-sm font-black text-emerald-700 font-mono mt-0.5">+{formatBDT(totalCredits, 'en')}</p>
          </div>
          <div className="border-x border-slate-300">
            <span className="text-slate-500 uppercase font-bold tracking-wider">Total Withdrawal (-)</span>
            <p className="text-sm font-black text-rose-700 font-mono mt-0.5">-{formatBDT(totalDebits, 'en')}</p>
          </div>
          <div>
            <span className="text-slate-500 uppercase font-bold tracking-wider">Net Movement</span>
            <p className={`text-sm font-black font-mono mt-0.5 ${netMovement >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
              {formatBDT(netMovement, 'en')}
            </p>
          </div>
        </div>

        {/* Ledger Table */}
        <table className="w-full text-left border-collapse text-[10px]">
          <thead>
            <tr className="bg-slate-200/80 border-y border-slate-400 text-slate-800 font-black uppercase text-[9px] tracking-wider">
              <th className="py-2 px-2.5">Date</th>
              <th className="py-2 px-2.5">Reference ID</th>
              <th className="py-2 px-2.5">Particulars</th>
              <th className="py-2 px-2.5">Account</th>
              <th className="py-2 px-2.5 text-right">Debit (৳)</th>
              <th className="py-2 px-2.5 text-right">Credit (৳)</th>
              <th className="py-2 px-2.5 text-right">Balance (৳)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-6 text-center text-slate-400">
                  No transactions recorded for this specified statement query.
                </td>
              </tr>
            ) : (
              filteredList.map((tx) => (
                <tr key={tx.id} className="leading-tight">
                  <td className="py-2 px-2.5 font-mono text-slate-700 whitespace-nowrap">{tx.date}</td>
                  <td className="py-2 px-2.5 font-mono text-slate-500 whitespace-nowrap font-semibold">{tx.id}</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">{tx.title}</td>
                  <td className="py-2 px-2.5 text-slate-700 whitespace-nowrap">{tx.accountName}</td>
                  <td className="py-2 px-2.5 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                    {tx.debit > 0 ? formatBDT(tx.debit, 'en') : '-'}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                    {tx.credit > 0 ? formatBDT(tx.credit, 'en') : '-'}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                    {formatBDT(tx.runningBalance, 'en')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Clean Footer (No Hash) */}
        <div className="mt-14 pt-4 border-t border-slate-300 flex items-end justify-between text-[9px] text-slate-500">
          <div className="space-y-1">
            <p><strong>System Generated Statement:</strong> Computer-generated ledger, no physical signature required.</p>
            <p>FinFlow Treasury • Architected by <strong>KOFS</strong></p>
          </div>

          <div className="text-center w-48">
            <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
            <p className="font-bold text-slate-800 uppercase tracking-wider">Authorized Signature</p>
            <p className="text-[8px] text-slate-400">FinFlow Treasury Management</p>
          </div>
        </div>
      </div>


      {/* ========================================================================= */}
      {/* 2. INTERACTIVE SCREEN UI (BROWSER / MOBILE VIEW)                         */}
      {/* ========================================================================= */}
      <div className="print:hidden space-y-6">
        
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 p-5 rounded-3xl shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase mb-1">
              <Building2 className="w-3 h-3" />
              <span>Official Banking Format</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 leading-tight">
              {lang === 'bn' ? 'অ্যাকাউন্ট স্টেটমেন্ট ও অডিট লেজার' : 'Account Statement & Audit Ledger'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn' ? 'প্রফেশনাল ব্যাংক স্টেটমেন্ট তৈরি ও প্রিন্ট করুন' : 'Generate verified banking statements with running balance'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'bn' ? 'প্রিন্ট / PDF সেভ করুন' : 'Print / Save PDF'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Account Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                {lang === 'bn' ? 'নির্দিষ্ট অ্যাকাউন্ট' : 'Filter by Account'}
              </label>
              <div className="relative">
                <Wallet className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                >
                  <option value="all">All Accounts (সবগুলো অ্যাকাউন্ট)</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                {lang === 'bn' ? 'শুরুর তারিখ (From Date)' : 'From Date'}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono transition"
                />
              </div>
            </div>

            {/* To Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                {lang === 'bn' ? 'শেষ তারিখ (To Date)' : 'To Date'}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono transition"
                />
              </div>
            </div>

            {/* Flow Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                {lang === 'bn' ? 'লেনদেনের ধরন' : 'Transaction Type'}
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              >
                <option value="all">All Movements (Credit & Debit)</option>
                <option value="inflow">Credit / Deposit (+)</option>
                <option value="outflow">Debit / Withdrawal (-)</option>
              </select>
            </div>
          </div>

          {/* Search Query & Reset */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'bn' ? 'টাইটেল বা রেফারেন্স দিয়ে খুঁজুন...' : 'Search narration or Txn ID...'}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 transition"
              />
            </div>

            {(startDate || endDate || selectedAccountId !== 'all' || selectedType !== 'all' || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ফিল্টার রিসেট' : 'Clear Filters'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Banking Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Selected Target</span>
            <h4 className="text-sm font-bold text-slate-800 truncate mt-0.5" title={selectedAccountTitle}>
              {selectedAccountTitle}
            </h4>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Deposit (Credit)</span>
            <p className="text-base font-black text-emerald-600 font-mono mt-0.5">
              +{formatBDT(totalCredits, lang)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Withdrawal (Debit)</span>
            <p className="text-base font-black text-rose-600 font-mono mt-0.5">
              -{formatBDT(totalDebits, lang)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Current Balance</span>
            <p className="text-base font-black text-indigo-700 font-mono mt-0.5">
              {formatBDT(currentVaultBalance, lang)}
            </p>
          </div>
        </div>

        {/* Interactive Screen Table */}
        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Ref ID</th>
                  <th className="py-3 px-4">Particulars</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4 text-right">Debit (৳)</th>
                  <th className="py-3 px-4 text-right">Credit (৳)</th>
                  <th className="py-3 px-4 text-right">Running Balance (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">Loading ledger statement...</td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      No transactions recorded under this date range or filter.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{tx.date}</td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">{tx.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{tx.title}</td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{tx.accountName}</td>
                      <td className="py-3 px-4 text-right font-black font-mono text-rose-600 whitespace-nowrap">
                        {tx.debit > 0 ? formatBDT(tx.debit, lang) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono text-emerald-600 whitespace-nowrap">
                        {tx.credit > 0 ? formatBDT(tx.credit, lang) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono text-slate-900 whitespace-nowrap">
                        {formatBDT(tx.runningBalance, lang)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
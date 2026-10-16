import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import { 
  Calendar, 
  Eye, 
  EyeOff, 
  ArrowRightLeft, 
  Plus, 
  ShieldCheck,
  FileSpreadsheet,
  BarChart3,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function OverviewCards({ 
  onOpenTransfer, 
  onOpenAddAccount, 
  refreshTrigger, 
  setActiveTab 
}) {
  const { user } = useAuth();
  const { lang } = useLang();

  // Accounting Period Month State (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [showBalance, setShowBalance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [monthInflow, setMonthInflow] = useState(0);
  const [monthOutflow, setMonthOutflow] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  // Histogram Data & Recent Activity
  const [histogramData, setHistogramData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    if (user) {
      calculateMonthlyMetrics();
    }
  }, [user, selectedMonth, refreshTrigger]);

  const calculateMonthlyMetrics = async () => {
    setLoading(true);
    try {
      // 1. Fetch Accounts
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('balance', { ascending: false });

      const fetchedAccounts = accountsData || [];
      setAccounts(fetchedAccounts);

      // 2. Fetch all Transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*, accounts(account_name)')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      const transactions = txData || [];
      setRecentTransactions(transactions.slice(0, 5));

      // Determine date bounds
      const [yearStr, monthStr] = selectedMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      const monthStartStr = `${yearStr}-${monthStr}-01`;
      const nextMonthYear = month === 12 ? year + 1 : year;
      const nextMonthVal = month === 12 ? 1 : month + 1;
      const nextMonthStr = `${nextMonthYear}-${String(nextMonthVal).padStart(2, '0')}-01`;

      let calculatedOpening = 0;
      let curMonthInflow = 0;
      let curMonthOutflow = 0;

      transactions.forEach((tx) => {
        const txDate = tx.transaction_date || tx.created_at?.substring(0, 10);
        const amount = Number(tx.amount) || 0;
        const isInflow = ['income', 'transfer_in'].includes(tx.type);
        const isOutflow = ['expense', 'transfer_out', 'project_expense'].includes(tx.type);

        if (txDate < monthStartStr) {
          if (isInflow) calculatedOpening += amount;
          if (isOutflow) calculatedOpening -= amount;
        } else if (txDate >= monthStartStr && txDate < nextMonthStr) {
          if (isInflow) curMonthInflow += amount;
          if (isOutflow) curMonthOutflow += amount;
        }
      });

      const calculatedClosing = calculatedOpening + curMonthInflow - curMonthOutflow;

      setOpeningBalance(calculatedOpening);
      setMonthInflow(curMonthInflow);
      setMonthOutflow(curMonthOutflow);
      setClosingBalance(calculatedClosing);

      // Build 6-Month Histogram
      const monthsArray = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(year, month - 1 - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const key = `${y}-${m}`;
        const label = d.toLocaleString('en-US', { month: 'short' });
        monthsArray.push({ key, label, inflow: 0, outflow: 0 });
      }

      transactions.forEach((tx) => {
        const txDate = tx.transaction_date || tx.created_at?.substring(0, 10);
        const txMonth = txDate?.substring(0, 7);
        const target = monthsArray.find((m) => m.key === txMonth);
        if (target) {
          const amt = Number(tx.amount) || 0;
          if (['income', 'transfer_in'].includes(tx.type)) {
            target.inflow += amt;
          } else if (['expense', 'transfer_out', 'project_expense'].includes(tx.type)) {
            target.outflow += amt;
          }
        }
      });

      setHistogramData(monthsArray);
    } catch (err) {
      console.error('Error computing overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const maskValue = (val) => {
    if (!showBalance) return '••••••••';
    return formatBDT(val, lang);
  };

  const maxBarValue = Math.max(
    ...histogramData.map((d) => Math.max(d.inflow, d.outflow)),
    1000
  );

  const totalVaultBalance = accounts.reduce((acc, curr) => acc + Number(curr.balance || 0), 0);

  return (
    <div className="space-y-6 select-none">
      
      {/* 1. TOP CARDS (HERO CRIMSON + HISTOGRAM) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* HERO CARD */}
        <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-[#BE123C] via-[#E11D48] to-[#9F1239] p-6 sm:p-8 text-white shadow-xl shadow-rose-950/15 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-52 h-52 bg-rose-950/20 rounded-full blur-xl pointer-events-none" />

          {/* Top Period & Eye */}
          <div className="relative z-10 pb-5 mb-6 border-b border-white/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 bg-black/20 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 shadow-inner">
              <Calendar className="w-4 h-4 text-rose-200 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-rose-200/90 leading-none">
                  Selected Accounting Period
                </span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer mt-0.5 tracking-tight font-sans [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>{accounts.length} Vaults</span>
              </span>

              <button
                type="button"
                onClick={() => setShowBalance(!showBalance)}
                className="px-3 py-1.5 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md border border-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {showBalance ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Show</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Balance Body */}
          <div className="relative z-10 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[11px] font-black uppercase tracking-wider text-rose-100">
                Monthly Adjusted Closing Balance
              </p>
            </div>
            
            <p className="text-xs text-rose-200 font-medium">
              Net Reserves as of {selectedMonth}
            </p>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black font-mono">৳</span>
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight">
                {maskValue(closingBalance)}
              </span>
            </div>
          </div>

          {/* Metrics */}
          <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-white/15">
            <div>
              <span className="text-[10px] font-black uppercase text-rose-200/90 block truncate">
                Carry Forward
              </span>
              <p className="text-sm sm:text-base font-black font-mono mt-0.5">
                {maskValue(openingBalance)}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-emerald-200 block truncate">
                Inflow
              </span>
              <p className="text-sm sm:text-base font-black font-mono text-emerald-300 mt-0.5">
                {showBalance ? `+${formatBDT(monthInflow, lang)}` : '••••••'}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-amber-200 block truncate">
                Outflow
              </span>
              <p className="text-sm sm:text-base font-black font-mono text-amber-300 mt-0.5">
                {showBalance ? `-${formatBDT(monthOutflow, lang)}` : '••••••'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="relative z-10 flex items-center gap-2.5 mt-6 pt-2">
            <button
              type="button"
              onClick={onOpenTransfer}
              className="py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs border border-white/20 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddAccount}
              className="py-2.5 px-4 rounded-xl bg-white hover:bg-rose-50 active:scale-95 text-[#BE123C] font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Vault</span>
            </button>
          </div>
        </div>

        {/* HISTOGRAM CARD */}
        <div className="rounded-3xl bg-white border border-[#F3D7D9] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#E11D48]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Cash Flow Histogram
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                Last 6 Months
              </span>
            </div>

            <div className="flex items-center gap-4 mt-3 text-[11px] font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Inflow</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                <span className="text-slate-600">Outflow</span>
              </div>
            </div>

            <div className="mt-5 pt-2 flex items-end justify-between gap-2 h-40 border-b border-slate-100 pb-2">
              {histogramData.map((d) => {
                const inflowHeight = maxBarValue > 0 ? (d.inflow / maxBarValue) * 100 : 0;
                const outflowHeight = maxBarValue > 0 ? (d.outflow / maxBarValue) * 100 : 0;
                const isSelected = d.key === selectedMonth;

                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setSelectedMonth(d.key)}
                    aria-pressed={isSelected}
                    aria-label={`${d.label}: inflow ${formatBDT(d.inflow, lang)}, outflow ${formatBDT(d.outflow, lang)}. Select month`}
                    className={`flex-1 min-w-0 flex flex-col items-center h-full justify-end group relative rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 ${isSelected ? 'bg-rose-50/70' : 'hover:bg-slate-50'}`}
                  >
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition bg-slate-900 text-white text-[9px] p-1.5 rounded-lg pointer-events-none whitespace-nowrap z-20 font-mono shadow-lg">
                      <p className="text-emerald-300">+{formatBDT(d.inflow, lang)}</p>
                      <p className="text-rose-300">-{formatBDT(d.outflow, lang)}</p>
                    </div>

                    <div className="flex items-end gap-1 w-full justify-center h-full pb-1">
                      <div 
                        style={{ height: `${Math.max(inflowHeight, 4)}%` }} 
                        className={`w-2.5 sm:w-3 rounded-t-md transition-all duration-500 ${
                          isSelected ? 'bg-emerald-500' : 'bg-emerald-400/80 hover:bg-emerald-500'
                        }`}
                      />
                      <div 
                        style={{ height: `${Math.max(outflowHeight, 4)}%` }} 
                        className={`w-2.5 sm:w-3 rounded-t-md transition-all duration-500 ${
                          isSelected ? 'bg-[#E11D48]' : 'bg-rose-400/80 hover:bg-[#E11D48]'
                        }`}
                      />
                    </div>

                    <span className={`text-[10px] mt-1 font-bold ${
                      isSelected ? 'text-[#E11D48] font-black' : 'text-slate-400'
                    }`}>
                      {d.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">
              Audit & Ledger
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('statements')}
              className="text-xs font-bold text-[#E11D48] hover:text-[#BE123C] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Full Statement</span>
            </button>
          </div>
        </div>

      </div>

      {/* 2. NICHER KHAT SECTION (EMPTY GAP FILLER: RECENT ACTIVITY + VAULT LIQUIDITY) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        
        {/* RECENT ACTIVITY LEDGER (2 Columns) */}
        <div className="lg:col-span-2 rounded-3xl bg-white border border-[#F3D7D9] p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#E11D48] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Recent Treasury Activity</h3>
                <p className="text-[11px] text-slate-400 font-medium">Real-time settlement stream</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('statements')}
              className="text-xs font-bold text-[#E11D48] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No recent transactions recorded in this period.
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const isInflow = ['income', 'transfer_in'].includes(tx.type);
                return (
                  <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 px-2 rounded-xl transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isInflow ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-[#E11D48]'
                      }`}>
                        {isInflow ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 line-clamp-1">
                          {tx.notes || tx.category || 'Direct Entry'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-bold text-slate-400">
                          <span>{tx.transaction_date}</span>
                          <span>•</span>
                          <span className="text-slate-600 font-mono">{tx.accounts?.account_name || 'Primary Vault'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-xs font-mono font-black ${
                        isInflow ? 'text-emerald-600' : 'text-[#E11D48]'
                      }`}>
                        {isInflow ? '+' : '-'}{showBalance ? formatBDT(tx.amount, lang) : '••••••'}
                      </p>
                      <span className="text-[9px] font-black uppercase text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded-md">
                        {tx.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* VAULT LIQUIDITY SHARE (1 Column) */}
        <div className="rounded-3xl bg-white border border-[#F3D7D9] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Vault Allocation</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Distribution by reserves</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('accounts')}
                className="text-xs font-bold text-[#E11D48] hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>

            {/* Account Progress Bars */}
            <div className="mt-4 space-y-4">
              {accounts.slice(0, 4).map((acc) => {
                const bal = Number(acc.balance || 0);
                const percent = totalVaultBalance > 0 ? Math.round((bal / totalVaultBalance) * 100) : 0;

                return (
                  <div key={acc.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 truncate max-w-[140px]">{acc.account_name}</span>
                      <span className="font-mono text-slate-900">
                        {showBalance ? formatBDT(bal, lang) : '••••••'}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                      <div 
                        style={{ width: `${percent}%` }}
                        className="h-full bg-gradient-to-r from-rose-500 to-[#E11D48] rounded-full transition-all duration-500"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>{acc.account_type || 'Reserve'}</span>
                      <span>{percent}% share</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Vaults Liquid</span>
            <span className="text-xs font-mono font-black text-slate-900">
              {showBalance ? formatBDT(totalVaultBalance, lang) : '••••••••'}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}

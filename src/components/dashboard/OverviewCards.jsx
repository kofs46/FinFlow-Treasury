import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import { 
  Repeat, 
  Plus, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Briefcase,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Eye,
  EyeOff,
  Clock,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export default function OverviewCards({ 
  onOpenTransfer, 
  onOpenAddAccount, 
  refreshTrigger,
  setActiveTab 
}) {
  const { user } = useAuth();
  const { lang } = useLang();

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // Privacy Toggle: Show or Hide Balance
  const [showBalance, setShowBalance] = useState(() => {
    return localStorage.getItem('finflow_show_balance') !== 'false';
  });

  // Selected Month (Format: YYYY-MM)
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  useEffect(() => {
    localStorage.setItem('finflow_show_balance', showBalance);
  }, [showBalance]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, refreshTrigger]);

  const loadDashboardData = async () => {
    try {
      const { data: accData } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (accData) setAccounts(accData);

      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: true });
      if (txData) setTransactions(txData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  // Monthly Balance Calculation with Auto-Adjustment / Carry Forward
  const calculateMonthMetrics = () => {
    let openingBalance = 0;
    let selectedMonthInflow = 0;
    let selectedMonthOutflow = 0;

    transactions.forEach((tx) => {
      const dateStr = String(tx.transaction_date || tx.created_at || '').substring(0, 10);
      const txMonth = dateStr.substring(0, 7);
      const amount = Number(tx.amount) || 0;

      const isInflow = ['income', 'transfer_in'].includes(tx.type);
      const isOutflow = ['expense', 'project_expense', 'transfer_out'].includes(tx.type);

      if (txMonth < selectedMonth) {
        // Carry forward from previous months
        if (isInflow) openingBalance += amount;
        if (isOutflow) openingBalance -= amount;
      } else if (txMonth === selectedMonth) {
        // Current selected month
        if (isInflow) selectedMonthInflow += amount;
        if (isOutflow) selectedMonthOutflow += amount;
      }
    });

    const netClosingBalance = openingBalance + selectedMonthInflow - selectedMonthOutflow;

    return {
      openingBalance,
      selectedMonthInflow,
      selectedMonthOutflow,
      netClosingBalance
    };
  };

  const {
    openingBalance,
    selectedMonthInflow,
    selectedMonthOutflow,
    netClosingBalance
  } = calculateMonthMetrics();

  // Weekly histogram data for selected month
  const generateChartData = () => {
    const weeks = [
      { name: lang === 'bn' ? 'সপ্তাহ ১' : 'W1 (1-7)', Inflow: 0, Outflow: 0 },
      { name: lang === 'bn' ? 'সপ্তাহ ২' : 'W2 (8-14)', Inflow: 0, Outflow: 0 },
      { name: lang === 'bn' ? 'সপ্তাহ ৩' : 'W3 (15-21)', Inflow: 0, Outflow: 0 },
      { name: lang === 'bn' ? 'সপ্তাহ ৪' : 'W4 (22+)', Inflow: 0, Outflow: 0 },
    ];

    transactions.forEach((tx) => {
      const dateStr = String(tx.transaction_date || tx.created_at || '').substring(0, 10);
      if (!dateStr.startsWith(selectedMonth)) return;

      const day = parseInt(dateStr.split('-')[2], 10) || 1;
      const amount = Number(tx.amount) || 0;
      const isInflow = ['income', 'transfer_in'].includes(tx.type);
      const isOutflow = ['expense', 'project_expense', 'transfer_out'].includes(tx.type);

      const weekIndex = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
      if (isInflow) weeks[weekIndex].Inflow += amount;
      if (isOutflow) weeks[weekIndex].Outflow += amount;
    });

    return weeks;
  };

  const histogramData = generateChartData();

  return (
    <div className="space-y-6">
      
      {/* 1. Month Selector & Privacy Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#F3D7D9] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#E11D48]" />
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block">
              {lang === 'bn' ? 'হিসাব নিরীক্ষা মাস' : 'Selected Accounting Period'}
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBalance(!showBalance)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            title="Toggle Balance Privacy"
          >
            {showBalance ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-[#E11D48]" />}
            <span>{showBalance ? (lang === 'bn' ? 'ব্যালেন্স লুকান' : 'Hide Balance') : (lang === 'bn' ? 'ব্যালেন্স দেখুন' : 'Show Balance')}</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Liquidity Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-[#881337] via-[#9F1239] to-[#E11D48] p-6 sm:p-7 text-white shadow-xl shadow-rose-950/20 border border-rose-400/30 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-[11px] font-black uppercase tracking-widest text-rose-100">
                  {lang === 'bn' ? 'মাসের সমন্বিত ক্লোজিং ব্যালেন্স' : 'MONTHLY ADJUSTED CLOSING BALANCE'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold text-rose-100">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>{accounts.length} {lang === 'bn' ? 'ওয়ালেট' : 'Vaults'}</span>
              </div>
            </div>

            <div className="mt-5">
              <span className="text-xs font-semibold text-rose-200/90 block mb-1">
                {lang === 'bn' ? `${selectedMonth} এর মোট সমন্বিত ফান্ড` : `Net Reserves as of ${selectedMonth}`}
              </span>
              <div className="flex items-baseline gap-2">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight text-white drop-shadow-sm">
                  {showBalance ? formatBDT(netClosingBalance, lang) : '৳ ••••••••'}
                </h1>
              </div>

              {/* Monthly Carry Forward & Adjustment Strip */}
              <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-rose-200 block uppercase font-bold">
                    {lang === 'bn' ? 'পূর্বের মাসের উদ্বৃত্ত' : 'Carry Forward (Opening)'}
                  </span>
                  <span className="font-mono font-bold text-white">
                    {showBalance ? formatBDT(openingBalance, lang) : '••••••'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-200 block uppercase font-bold">
                    {lang === 'bn' ? 'চলতি মাসের জমা' : 'Month Inflow'}
                  </span>
                  <span className="font-mono font-bold text-emerald-300">
                    {showBalance ? `+${formatBDT(selectedMonthInflow, lang)}` : '••••••'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-200 block uppercase font-bold">
                    {lang === 'bn' ? 'চলতি মাসের খরচ' : 'Month Outflow'}
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    {showBalance ? `-${formatBDT(selectedMonthOutflow, lang)}` : '••••••'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenTransfer}
                className="py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs flex items-center gap-2 backdrop-blur-md border border-white/20 shadow-sm transition cursor-pointer"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ফান্ড ট্রান্সফার' : 'Transfer'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenAddAccount}
                className="py-2.5 px-4 rounded-xl bg-white hover:bg-rose-50 active:scale-95 text-[#9F1239] font-black text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#E11D48]" />
                <span>{lang === 'bn' ? 'নতুন ওয়ালেট' : 'Add Vault'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Selected Month Inflow/Outflow Breakdown */}
        <div className="rounded-3xl bg-white border border-[#F3D7D9] p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                {lang === 'bn' ? 'মাসের নিট ক্যাশ ফ্লো' : 'MONTHLY CASH FLOW'}
              </h3>
              <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                {selectedMonth}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-[#E11D48]" />
                    <span>{lang === 'bn' ? 'মোট খরচ' : 'OUTFLOW'}</span>
                  </span>
                  <p className="text-base sm:text-lg font-black font-mono text-[#E11D48] mt-0.5">
                    {showBalance ? `-${formatBDT(selectedMonthOutflow, lang)}` : '••••••'}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-[#E11D48] flex items-center justify-center font-bold">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                    <span>{lang === 'bn' ? 'মোট জমা' : 'INFLOW'}</span>
                  </span>
                  <p className="text-base sm:text-lg font-black font-mono text-emerald-600 mt-0.5">
                    {showBalance ? `+${formatBDT(selectedMonthInflow, lang)}` : '••••••'}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('statements')}
            className="w-full mt-4 py-2.5 text-center text-xs font-bold text-[#E11D48] hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{lang === 'bn' ? 'পূর্ণাঙ্গ অডিট স্টেটমেন্ট' : 'View Audit Statement'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Monthly Weekly Cash Flow Velocity Chart */}
      <div className="rounded-3xl bg-white border border-[#F3D7D9] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-900">
            {lang === 'bn' ? 'সাপ্তাহিক লেনদেন গ্রাফ' : 'Weekly Movement Breakdown'} ({selectedMonth})
          </h3>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(val) => showBalance ? formatBDT(val, lang) : '••••••'} 
                contentStyle={{ borderRadius: '12px', border: '1px solid #F3D7D9' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Inflow" fill="#059669" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Outflow" fill="#E11D48" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
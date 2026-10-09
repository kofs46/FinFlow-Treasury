import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import { BrandLogo } from '../common/BrandLogos';
import { 
  Repeat, 
  Plus, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Briefcase,
  BarChart2,
  Wallet,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar
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
  const { user, profile } = useAuth();
  const { lang } = useLang();

  const [accounts, setAccounts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedProjectId, setSelectedProjectId] = useState('all');

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

      const { data: projData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (projData) setProjects(projData);

      const { data: expData } = await supabase
        .from('project_expenses')
        .select('*')
        .eq('user_id', user.id);
      if (expData) setExpenses(expData);

      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });
      if (txData) setTransactions(txData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  const totalLiquidity = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);

  // --- VELOCITY CHART DATA ---
  const generateChartData = () => {
    const weeks = [
      { name: lang === 'bn' ? 'সপ্তাহ ১ (১-৭)' : 'W1 (1-7)', Inflow: 0, Outflow: 0 },
      { name: lang === 'bn' ? 'সপ্তাহ ২ (৮-১৪)' : 'W2 (8-14)', Inflow: 0, Outflow: 0 },
      { name: lang === 'bn' ? 'সপ্তাহ ৩ (১৫-২১)' : 'W3 (15-21)', Inflow: 0, Outflow: 0 },
      { name: lang === 'bn' ? 'সপ্তাহ ৪ (২২+)' : 'W4 (22+)', Inflow: 0, Outflow: 0 },
    ];

    transactions.forEach((tx) => {
      const rawDate = tx.transaction_date || tx.created_at;
      if (!rawDate) return;
      const dateStr = String(rawDate).substring(0, 10);

      if (!dateStr.startsWith(selectedMonth)) return;
      if (selectedProjectId !== 'all' && tx.project_id !== selectedProjectId) return;

      const day = parseInt(dateStr.split('-')[2], 10) || 1;
      const amount = Number(tx.amount) || 0;

      const isInflow = ['income', 'transfer_in'].includes(tx.type);
      const isOutflow = ['expense', 'project_expense', 'transfer_out'].includes(tx.type);

      const weekIndex = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;

      if (isInflow) {
        weeks[weekIndex].Inflow += amount;
      } else if (isOutflow) {
        weeks[weekIndex].Outflow += amount;
      }
    });

    return weeks;
  };

  const histogramData = generateChartData();
  const totalMonthOutflow = histogramData.reduce((sum, w) => sum + w.Outflow, 0);
  const totalMonthInflow = histogramData.reduce((sum, w) => sum + w.Inflow, 0);

  return (
    <div className="space-y-6">
      
      {/* 1. EXECUTIVE TREASURY HERO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Main Liquidity Vault Card */}
        <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-[#9F1239] via-[#BE123C] to-[#E11D48] p-6 sm:p-7 text-white shadow-xl shadow-rose-950/15 border border-rose-400/30 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Ambient Mesh Orbs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Info Bar */}
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-[11px] font-black uppercase tracking-widest text-rose-100">
                  {lang === 'bn' ? 'ট্রেজারি লিকুইডিটি পুল' : 'TREASURY LIQUIDITY POOL'}
                </span>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold text-rose-100">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>{accounts.length} {lang === 'bn' ? 'ওয়ালেট সংযুক্ত' : 'Active Vaults'}</span>
              </div>
            </div>

            {/* Balance Display */}
            <div className="mt-4 sm:mt-5">
              <span className="text-xs font-semibold text-rose-200/90 block mb-1">
                {lang === 'bn' ? 'সর্বমোট সংরক্ষিত ব্যালেন্স (BDT)' : 'Consolidated Net Reserves'}
              </span>
              <div className="flex items-baseline gap-2">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight text-white drop-shadow-sm">
                  {formatBDT(totalLiquidity, lang)}
                </h1>
              </div>
              <p className="text-xs text-rose-100/80 mt-1.5 font-medium max-w-md">
                {lang === 'bn' 
                  ? 'রিয়েল-টাইম ক্যাশ রিজার্ভ, ব্যাংক অ্যাকাউন্ট এবং মোবাইল ফাইন্যান্সিয়াল সার্ভিসের সম্মিলিত ব্যালেন্স।' 
                  : 'Multi-vault balance unified across scheduled banks, MFS, and cash reserves.'}
              </p>
            </div>
          </div>

          {/* Bottom Quick-Action Dock */}
          <div className="relative z-10 mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenTransfer}
                className="py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs flex items-center gap-2 backdrop-blur-md border border-white/20 shadow-sm transition cursor-pointer"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ফান্ড ট্রান্সফার' : 'Inter-Vault Transfer'}</span>
              </button>

              <button
                onClick={onOpenAddAccount}
                className="py-2.5 px-4 rounded-xl bg-white hover:bg-rose-50 active:scale-95 text-[#9F1239] font-black text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#E11D48]" />
                <span>{lang === 'bn' ? 'নতুন ওয়ালেট' : 'Add Vault'}</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold text-rose-200">
              <Calendar className="w-3.5 h-3.5 text-rose-300" />
              <span>{selectedMonth}</span>
            </div>
          </div>
        </div>

        {/* 2. Monthly Summary Card */}
        <div className="rounded-3xl bg-white border border-[#E2E8F0] p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                {lang === 'bn' ? 'চলতি মাসের নিরীক্ষা' : 'MONTHLY CASH FLOW'}
              </h3>
              <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                {selectedMonth}
              </span>
            </div>
            
            <div className="space-y-3">
              {/* Outflow Box */}
              <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-[#E11D48]" />
                    <span>{lang === 'bn' ? 'মোট খরচ (Outflow)' : 'TOTAL OUTFLOW'}</span>
                  </span>
                  <p className="text-base sm:text-lg font-black font-mono text-[#E11D48] mt-0.5">
                    -{formatBDT(totalMonthOutflow, lang)}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-[#E11D48] flex items-center justify-center font-bold">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>

              {/* Inflow Box */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                    <span>{lang === 'bn' ? 'মোট জমা (Inflow)' : 'TOTAL INFLOW'}</span>
                  </span>
                  <p className="text-base sm:text-lg font-black font-mono text-emerald-600 mt-0.5">
                    +{formatBDT(totalMonthInflow, lang)}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('statements')}
            className="w-full mt-4 py-2.5 text-center text-xs font-bold text-[#E11D48] hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{lang === 'bn' ? 'অডিট স্টেটমেন্ট দেখুন' : 'View Full Statements'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. HORIZONTAL ACCOUNT VAULTS SCROLLER */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#E11D48]" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {lang === 'bn' ? 'অ্যাকাউন্ট ও ওয়ালেট' : 'ACCOUNTS & WALLETS'}
            </h3>
          </div>
          <button 
            onClick={() => setActiveTab('accounts')}
            className="text-[11px] font-bold text-[#E11D48] hover:underline flex items-center cursor-pointer"
          >
            <span>{lang === 'bn' ? 'ব্যবস্থাপনা' : 'Manage All'}</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
          {accounts.map((acc) => {
            const match = acc.account_name.match(/\[(.*?)\]/);
            const accNumber = match ? match[1] : null;
            const displayName = acc.account_name.replace(/\[.*?\]/, '').trim();

            return (
              <div
                key={acc.id}
                onClick={() => setActiveTab('accounts')}
                className="min-w-[155px] p-3.5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col items-center text-center justify-between snap-start cursor-pointer hover:border-[#E11D48] hover:shadow-md transition"
              >
                <BrandLogo name={acc.account_name} type={acc.account_type} className="w-9 h-9 mb-2 shadow-xs" />
                <p className="text-xs font-bold text-slate-800 truncate w-full" title={displayName}>
                  {displayName}
                </p>
                <p className="text-xs font-black text-[#E11D48] font-mono mt-1">
                  {formatBDT(acc.balance, lang)}
                </p>
                {accNumber && (
                  <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                    {accNumber.substring(0, 8)}...
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CASH VELOCITY CHART */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 md:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-[#E11D48] text-[10px] font-black uppercase mb-1">
              <BarChart2 className="w-3 h-3" />
              <span>{lang === 'bn' ? 'নগদ প্রবাহ গতি' : 'CASH VELOCITY'}</span>
            </div>
            <h3 className="text-base font-black text-slate-900 leading-tight">
              {lang === 'bn' ? 'মাসিক নগদ জমা ও খরচের পরিসংখ্যান' : 'Monthly Cash Inflow & Outflow'}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#E11D48] cursor-pointer"
            >
              <option value="all">{lang === 'bn' ? 'সব প্রজেক্ট' : 'All Projects'}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#E11D48] font-mono cursor-pointer"
            />
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFF1F2" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false} 
                tickFormatter={(val) => `৳${val}`}
              />
              <Tooltip 
                formatter={(value) => [formatBDT(value, lang), '']}
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '1rem', 
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }} 
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar 
                dataKey="Inflow" 
                name={lang === 'bn' ? 'জমা (Inflow)' : 'Inflow'} 
                fill="#10b981" 
                radius={[6, 6, 0, 0]} 
                barSize={20} 
              />
              <Bar 
                dataKey="Outflow" 
                name={lang === 'bn' ? 'খরচ (Outflow)' : 'Outflow'} 
                fill="#E11D48" 
                radius={[6, 6, 0, 0]} 
                barSize={20} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. ACTIVE PROJECTS */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#E11D48]" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {lang === 'bn' ? 'অ্যাক্টিভ প্রজেক্টসমূহ' : 'ACTIVE PROJECTS'}
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('projects')}
            className="text-[11px] font-bold text-[#E11D48] hover:underline flex items-center cursor-pointer"
          >
            <span>{lang === 'bn' ? 'সবগুলো' : 'View All'}</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {projects.slice(0, 2).map((proj) => {
            const budget = Number(proj.budget) || 0;
            const projExpenses = expenses.filter(e => e.project_id === proj.id);
            const spent = projExpenses.reduce((s, e) => s + Number(e.amount), 0);
            const percent = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;

            return (
              <div key={proj.id} className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-slate-900 truncate max-w-[160px]">{proj.name}</h4>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-50 text-[#E11D48] border border-rose-100">
                    {proj.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>Spent: <strong className="text-[#E11D48] font-mono">{formatBDT(spent, lang)}</strong></span>
                  <span>Budget: <strong className="text-slate-800 font-mono">{formatBDT(budget, lang)}</strong></span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#E11D48] rounded-full" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
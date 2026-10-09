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
  Wallet
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
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);

  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedProjectId, setSelectedProjectId] = useState('all');

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user, refreshTrigger]);

  const loadDashboardData = async () => {
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

    const { data: debtData } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (debtData) setDebts(debtData);
  };

  const totalLiquidity = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);

  const generateChartData = () => {
    const weeks = [
      { name: 'Week 1', Inflow: 0, Outflow: 0 },
      { name: 'Week 2', Inflow: 0, Outflow: 0 },
      { name: 'Week 3', Inflow: 0, Outflow: 0 },
      { name: 'Week 4', Inflow: 0, Outflow: 0 },
    ];

    expenses.forEach((item) => {
      const expDate = item.expense_date || item.created_at;
      if (!expDate.startsWith(selectedMonth)) return;
      if (selectedProjectId !== 'all' && item.project_id !== selectedProjectId) return;

      const day = parseInt(expDate.split('-')[2], 10);
      const amount = Number(item.amount);

      if (day <= 7) weeks[0].Outflow += amount;
      else if (day <= 14) weeks[1].Outflow += amount;
      else if (day <= 21) weeks[2].Outflow += amount;
      else weeks[3].Outflow += amount;
    });

    debts.forEach((d) => {
      if (d.debt_type !== 'receivable' || d.status !== 'settled') return;
      const dDate = d.created_at.substring(0, 10);
      if (!dDate.startsWith(selectedMonth)) return;

      const day = parseInt(dDate.split('-')[2], 10);
      const amount = Number(d.remaining_amount || d.original_amount);

      if (day <= 7) weeks[0].Inflow += amount;
      else if (day <= 14) weeks[1].Inflow += amount;
      else if (day <= 21) weeks[2].Inflow += amount;
      else weeks[3].Inflow += amount;
    });

    return weeks;
  };

  const histogramData = generateChartData();
  const totalMonthOutflow = histogramData.reduce((sum, w) => sum + w.Outflow, 0);
  const totalMonthInflow = histogramData.reduce((sum, w) => sum + w.Inflow, 0);

  return (
    <div className="space-y-6">
      
      {/* 1. Balanced Executive Treasury Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Main Liquidity Card */}
        <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-[#E11D48] via-[#e11d48] to-[#be123c] p-6 text-white shadow-lg shadow-rose-900/10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-extrabold text-rose-100 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {lang === 'bn' ? 'সর্বমোট তরল সম্পদ' : 'Total Net Liquidity'}
              </span>
              <span className="text-[11px] font-bold text-rose-200">
                {accounts.length} {lang === 'bn' ? 'টি ওয়ালেট সক্রিয়' : 'Active Wallets'}
              </span>
            </div>

            <div className="mt-3">
              <h1 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                {formatBDT(totalLiquidity, lang)}
              </h1>
              <p className="text-[11px] text-rose-200 mt-1 font-medium">
                {lang === 'bn' ? 'রিয়েল-টাইম ক্যাশ রিজার্ভ ও সমস্ত অ্যাকাউন্টের সম্মিলিত ব্যালেন্স' : 'Consolidated balance across banks, MFS, and cash vaults'}
              </p>
            </div>
          </div>

          {/* Symmetrical Action Hub */}
          <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-white/15">
            <button
              onClick={onOpenTransfer}
              className="py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 border border-white/20"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ফান্ড স্থানান্তর' : 'Fund Transfer'}</span>
            </button>
            <button
              onClick={onOpenAddAccount}
              className="py-2.5 px-4 rounded-xl bg-white text-[#E11D48] hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>{lang === 'bn' ? 'নতুন ওয়ালেট' : 'Add Wallet'}</span>
            </button>
          </div>
        </div>

        {/* Quick Audit Metrics Panel */}
        <div className="rounded-3xl bg-white border border-[#F3D7D9] p-5 flex flex-col justify-between shadow-xs">
          <div>
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
              {lang === 'bn' ? 'চলতি মাসের নিরীক্ষা' : 'Monthly Summary'}
            </h3>
            
            <div className="space-y-2.5">
              <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    {lang === 'bn' ? 'মোট খরচ (Outflow)' : 'Total Outflow'}
                  </span>
                  <p className="text-sm font-black font-mono text-[#E11D48]">
                    -{formatBDT(totalMonthOutflow, lang)}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-[#E11D48] flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    {lang === 'bn' ? 'মোট জমা (Inflow)' : 'Total Inflow'}
                  </span>
                  <p className="text-sm font-black font-mono text-emerald-600">
                    +{formatBDT(totalMonthInflow, lang)}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('analytics')}
            className="w-full mt-3 py-2 text-center text-xs font-bold text-[#E11D48] hover:bg-rose-50 rounded-xl transition flex items-center justify-center gap-1"
          >
            <span>{lang === 'bn' ? 'বিস্তারিত অ্যানালিটিক্স দেখুন' : 'View Deep Analytics'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Horizontal Account Vaults */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#E11D48]" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {lang === 'bn' ? 'অ্যাকাউন্ট ও ওয়ালেট' : 'Accounts & Wallets'}
            </h3>
          </div>
          <button 
            onClick={() => setActiveTab('accounts')}
            className="text-[11px] font-bold text-[#E11D48] hover:underline flex items-center"
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
                className="min-w-[150px] p-3.5 rounded-2xl bg-white border border-[#F3D7D9] shadow-xs flex flex-col items-center text-center justify-between snap-start cursor-pointer hover:border-[#E11D48] hover:shadow-md transition"
              >
                <BrandLogo name={acc.account_name} type={acc.account_type} className="w-8 h-8 mb-2 shadow-xs" />
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

      {/* 3. Monthly Inflow/Outflow Velocity Chart */}
      <div className="bg-white border border-[#F3D7D9] rounded-3xl p-5 md:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-[#E11D48] text-[10px] font-bold uppercase mb-1">
              <BarChart2 className="w-3 h-3" />
              <span>{lang === 'bn' ? 'নগদ প্রবাহ নিরীক্ষা' : 'Cash Velocity'}</span>
            </div>
            <h3 className="text-base font-black text-slate-900 leading-tight">
              {lang === 'bn' ? 'মাসিক ও প্রজেক্টভিত্তিক নিরীক্ষা' : 'Monthly Cash Inflow & Outflow'}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#E11D48]"
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
              className="px-3 py-1.5 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#E11D48] font-mono"
            />
          </div>
        </div>

        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFF1F2" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '1rem', 
                  border: '1px solid #F3D7D9',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                }} 
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Inflow" name={lang === 'bn' ? 'প্রাপ্তি (Inflow)' : 'Inflow'} fill="#10b981" radius={[6, 6, 0, 0]} barSize={18} />
              <Bar dataKey="Outflow" name={lang === 'bn' ? 'ব্যয় (Outflow)' : 'Outflow'} fill="#E11D48" radius={[6, 6, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Active Projects */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#E11D48]" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {lang === 'bn' ? 'অ্যাক্টিভ প্রজেক্টসমূহ' : 'Active Projects'}
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('projects')}
            className="text-[11px] font-bold text-[#E11D48] hover:underline flex items-center"
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
              <div key={proj.id} className="p-4 rounded-2xl bg-white border border-[#F3D7D9] shadow-xs">
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
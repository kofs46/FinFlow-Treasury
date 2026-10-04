import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import { BrandLogo } from '../common/BrandLogos';
import { 
  Repeat, 
  Briefcase, 
  ChevronRight,
  User,
  Plus,
  BarChart2
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
  const { lang, toggleLang } = useLang();

  const [accounts, setAccounts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [debtTab, setDebtTab] = useState('receivable');

  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedProjectId, setSelectedProjectId] = useState('all');

  useEffect(() => {
    if (user) loadAllDashboardData();
  }, [user, refreshTrigger]);

  const loadAllDashboardData = async () => {
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
    <div className="space-y-6 pb-6">
      {/* ১. টপ ব্যানার - কালার থিমে সিঙ্ক ও প্রোপার প্যাডিং */}
      <div className="rounded-3xl bg-[#F36259] text-white p-6 shadow-md border border-[#EED8C7]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full border-2 border-white/50 overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <p className="text-xs text-white/80 font-medium">
                {lang === 'bn' ? 'স্বাগতম,' : 'Welcome,'}
              </p>
              <h3 className="text-base font-bold text-white leading-tight">
                {profile?.full_name || user?.email?.split('@')[0]}
              </h3>
            </div>
          </div>

          <button
            onClick={toggleLang}
            className="px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold text-white border border-white/30 transition"
          >
            {lang === 'bn' ? 'BN | EN' : 'EN | বাং'}
          </button>
        </div>

        <div className="text-center py-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold mb-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>{lang === 'bn' ? 'সর্বমোট তরল সম্পদ' : 'Total Net Liquidity'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
            {formatBDT(totalLiquidity, lang)}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            onClick={onOpenTransfer}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/30 transition active:scale-95"
          >
            <Repeat className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ফান্ড স্থানান্তর' : 'Fund Transfer'}</span>
          </button>
          <button
            onClick={onOpenAddAccount}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white text-[#F36259] font-bold text-xs shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'নতুন অ্যাকাউন্ট' : 'Add Account'}</span>
          </button>
        </div>
      </div>

      {/* ২. ওয়ালেট রো */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {lang === 'bn' ? 'অ্যাকাউন্ট ও ওয়ালেট' : 'Accounts & Wallets'}
          </h3>
          <button 
            onClick={() => setActiveTab && setActiveTab('accounts')}
            className="text-[11px] font-bold text-[#F36259] hover:underline flex items-center"
          >
            <span>{accounts.length} {lang === 'bn' ? 'টি ওয়ালেট' : 'Wallets'}</span>
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
                onClick={() => setActiveTab && setActiveTab('accounts')}
                className="min-w-[140px] sm:min-w-[150px] p-3.5 rounded-2xl bg-white border border-[#EED8C7] shadow-xs flex flex-col items-center text-center justify-between snap-start cursor-pointer hover:border-[#F36259] transition"
              >
                <BrandLogo name={acc.account_name} type={acc.account_type} className="w-8 h-8 mb-2 shadow-xs" />
                <p className="text-xs font-bold text-slate-800 truncate w-full" title={displayName}>
                  {displayName}
                </p>
                <p className="text-xs font-black text-[#F36259] font-mono mt-1">
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

      {/* ৩. মান্থলি হিস্টোগ্রাম */}
      <div className="bg-white border border-[#EED8C7] rounded-3xl p-5 md:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F1EDEC] text-[#F36259] text-[10px] font-bold uppercase mb-1">
              <BarChart2 className="w-3 h-3" />
              <span>{lang === 'bn' ? 'মাসিক নিরীক্ষা' : 'Monthly Analysis'}</span>
            </div>
            <h3 className="text-base font-black text-slate-900 leading-tight">
              {lang === 'bn' ? 'মাসিক ও প্রজেক্টভিত্তিক নিরীক্ষা' : 'Monthly & Project Audit'}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 bg-[#F1EDEC] border border-[#EED8C7] rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F36259]"
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
              className="px-3 py-1.5 bg-[#F1EDEC] border border-[#EED8C7] rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F36259] font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-[#F1EDEC] border border-[#EED8C7]">
            <span className="text-[10px] font-bold text-blue-600 uppercase">
              {lang === 'bn' ? 'মোট প্রাপ্তি (Inflow)' : 'Filtered Inflow'}
            </span>
            <p className="text-sm sm:text-base font-black text-blue-700 font-mono mt-0.5">
              +{formatBDT(totalMonthInflow, lang)}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-[#F1EDEC] border border-[#EED8C7]">
            <span className="text-[10px] font-bold text-[#F36259] uppercase">
              {lang === 'bn' ? 'মোট ব্যয় (Outflow)' : 'Filtered Outflow'}
            </span>
            <p className="text-sm sm:text-base font-black text-[#F36259] font-mono mt-0.5">
              -{formatBDT(totalMonthOutflow, lang)}
            </p>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1EDEC" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '1rem', 
                  border: '1px solid #EED8C7' 
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Inflow" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={18} />
              <Bar dataKey="Outflow" fill="#F36259" radius={[6, 6, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ৪. প্রজেক্ট প্রিভিউ */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {lang === 'bn' ? 'অ্যাক্টিভ প্রজেক্টসমূহ' : 'Active Projects'}
          </h3>
          <button
            onClick={() => setActiveTab && setActiveTab('projects')}
            className="text-[11px] font-bold text-[#F36259] hover:underline flex items-center"
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
              <div key={proj.id} className="p-4 rounded-2xl bg-white border border-[#EED8C7] shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-slate-900 truncate max-w-[160px]">{proj.name}</h4>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-[#EED8C7] text-slate-800">
                    {proj.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>Spent: <strong className="text-[#F36259] font-mono">{formatBDT(spent, lang)}</strong></span>
                  <span>Budget: <strong className="text-slate-800 font-mono">{formatBDT(budget, lang)}</strong></span>
                </div>
                <div className="w-full h-1.5 bg-[#F1EDEC] rounded-full overflow-hidden">
                  <div className="h-full bg-[#F36259] rounded-full" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
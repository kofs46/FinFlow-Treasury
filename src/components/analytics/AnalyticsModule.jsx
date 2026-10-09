import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  ShieldAlert, 
  ShieldCheck, 
  Calendar, 
  Layers, 
  ArrowUpRight, 
  ArrowDownLeft,
  Sparkles,
  PieChart as PieIcon,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function AnalyticsModule() {
  const { user } = useAuth();
  const { lang } = useLang();

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [debts, setDebts] = useState([]);

  useEffect(() => {
    if (user) loadAnalyticsData();
  }, [user]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // 1. Wallets / Liquid Assets
      const { data: accData } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);
      if (accData) setAccounts(accData);

      // 2. Project Expenses
      const { data: expData } = await supabase
        .from('project_expenses')
        .select('*')
        .eq('user_id', user.id);
      if (expData) setExpenses(expData);

      // 3. Unified Transactions Audit Ledger
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);
      if (txData) setTransactions(txData);

      // 4. Debts
      const { data: debtData } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user.id);
      if (debtData) setDebts(debtData);
    } catch (err) {
      console.error('Error loading analytics datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- CORE TREASURY MATHEMATICS ---
  const totalNetLiquidity = accounts.reduce((acc, a) => acc + Number(a.balance), 0);

  // Total Outflow across last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  const last30DaysOutflow = transactions
    .filter(t => ['expense', 'transfer_out', 'project_expense'].includes(t.type) && (t.transaction_date >= thirtyDaysAgo))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Fallback monthly burn rate
  const monthlyBurnRate = last30DaysOutflow > 0 
    ? last30DaysOutflow 
    : expenses.reduce((s, e) => s + Number(e.amount), 0) / 2 || 1;

  // Runway Calculation (Months)
  const runwayMonths = totalNetLiquidity > 0 
    ? (totalNetLiquidity / monthlyBurnRate).toFixed(1) 
    : '0.0';

  // Liquidity Health Assessment
  let healthScore = 'Excellent';
  let healthColor = 'emerald';
  if (Number(runwayMonths) < 1.5 || totalNetLiquidity <= 0) {
    healthScore = 'Critical';
    healthColor = 'rose';
  } else if (Number(runwayMonths) < 3.5) {
    healthScore = 'Moderate';
    healthColor = 'amber';
  }

  // --- 1. 90-DAY PREDICTIVE FORECAST ENGINE ---
  // Calculates projected balance for Day 30, Day 60, Day 90 based on daily burn rate + scheduled debt settlements
  const dailyBurn = monthlyBurnRate / 30;
  const pendingReceivables = debts.filter(d => d.debt_type === 'receivable' && d.status !== 'settled');
  const pendingPayables = debts.filter(d => d.debt_type === 'payable' && d.status !== 'settled');

  const getExpectedDebtMovement = (daySpan) => {
    const targetDate = new Date(Date.now() + daySpan * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    const inFlow = pendingReceivables
      .filter(d => d.due_date && d.due_date <= targetDate)
      .reduce((s, d) => s + Number(d.remaining_amount), 0);
    const outFlow = pendingPayables
      .filter(d => d.due_date && d.due_date <= targetDate)
      .reduce((s, d) => s + Number(d.remaining_amount), 0);
    return inFlow - outFlow;
  };

  const forecastData = [
    { period: 'Today', ProjectedLiquidity: Math.round(totalNetLiquidity), Baseline: Math.round(totalNetLiquidity) },
    { 
      period: '+30 Days', 
      ProjectedLiquidity: Math.max(0, Math.round(totalNetLiquidity - (dailyBurn * 30) + getExpectedDebtMovement(30))),
      Baseline: Math.max(0, Math.round(totalNetLiquidity - (dailyBurn * 30)))
    },
    { 
      period: '+60 Days', 
      ProjectedLiquidity: Math.max(0, Math.round(totalNetLiquidity - (dailyBurn * 60) + getExpectedDebtMovement(60))),
      Baseline: Math.max(0, Math.round(totalNetLiquidity - (dailyBurn * 60)))
    },
    { 
      period: '+90 Days', 
      ProjectedLiquidity: Math.max(0, Math.round(totalNetLiquidity - (dailyBurn * 90) + getExpectedDebtMovement(90))),
      Baseline: Math.max(0, Math.round(totalNetLiquidity - (dailyBurn * 90)))
    }
  ];

  // --- 2. EXPENSE CATEGORY DISTRIBUTION ---
  const categoryMap = {};
  expenses.forEach(e => {
    const titleKey = e.title.trim().split(' ')[0] || 'General';
    categoryMap[titleKey] = (categoryMap[titleKey] || 0) + Number(e.amount);
  });
  
  const categoryData = Object.keys(categoryMap).map(k => ({
    name: k,
    value: categoryMap[k]
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  const PIE_COLORS = ['#E11D48', '#FB7185', '#F43F5E', '#FDA4AF', '#FECDD3'];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#E11D48]" />
            <span>{lang === 'bn' ? 'ট্রেজারি অ্যানালিটিক্স ও পূর্বাভাস' : 'Treasury Intelligence & Forecasting'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' ? 'নগদ রিজার্ভের স্থায়িত্বকাল (Runway), ব্যয়ের গতি এবং ভবিষ্যৎ লিকুইডিটি মডেলিং' : 'Predictive cash runway, burn rate velocity, and 90-day liquidity simulation'}
          </p>
        </div>
      </div>

      {/* Top Intelligence Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Runway Card */}
        <div className="p-5 rounded-3xl bg-white border border-[#F3D7D9] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              {lang === 'bn' ? 'ক্যাশ রানওয়ে (স্থায়িত্ব)' : 'Operational Cash Runway'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#E11D48] flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black font-mono text-slate-950">{runwayMonths}</span>
              <span className="text-xs font-bold text-slate-500">{lang === 'bn' ? 'মাস' : 'Months'}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === 'bn' ? 'বর্তমান ব্যয়ের হারে আপনার রিজার্ভ টিকে থাকবে' : 'Survival period based on last 30-day burn rate'}
            </p>
          </div>
        </div>

        {/* Average Monthly Burn */}
        <div className="p-5 rounded-3xl bg-white border border-[#F3D7D9] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              {lang === 'bn' ? 'মাসিক গড় খরচ (Burn Rate)' : 'Monthly Burn Velocity'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-[#E11D48] flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-[#E11D48]">
              {formatBDT(monthlyBurnRate, lang)}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              ~{formatBDT(dailyBurn, lang)} / {lang === 'bn' ? 'প্রতিদিন আউটফ্লো' : 'daily cash outflow'}
            </p>
          </div>
        </div>

        {/* Treasury Health Rating */}
        <div className={`p-5 rounded-3xl border shadow-xs flex flex-col justify-between ${
          healthColor === 'emerald' ? 'bg-emerald-50/50 border-emerald-200' : healthColor === 'amber' ? 'bg-amber-50/50 border-amber-200' : 'bg-rose-50/50 border-rose-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
              {lang === 'bn' ? 'লিকুইডিটি স্বাস্থ্য' : 'Treasury Stability Score'}
            </span>
            {healthColor === 'emerald' ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> : <ShieldAlert className="w-5 h-5 text-[#E11D48]" />}
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-black tracking-tight ${
              healthColor === 'emerald' ? 'text-emerald-700' : healthColor === 'amber' ? 'text-amber-700' : 'text-[#E11D48]'
            }`}>
              {healthScore}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              {healthScore === 'Excellent' 
                ? (lang === 'bn' ? 'শক্তিশালী ব্যালেন্স ও পর্যাপ্ত রানওয়ে সংরক্ষিত রয়েছে।' : 'Robust liquidity reserves exceeding standard benchmarks.')
                : (lang === 'bn' ? 'সতর্কতা: দ্রুত পাওনা আদায় ও খরচ নিয়ন্ত্রণে জোর দিন।' : 'Attention: Expedite receivables and minimize non-essential burn.')}
            </p>
          </div>
        </div>

      </div>

      {/* 90-Day Predictive Trajectory Simulation */}
      <div className="bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-[#E11D48] text-[10px] font-black uppercase mb-1">
              <Sparkles className="w-3 h-3" />
              <span>{lang === 'bn' ? 'পূর্বাভাস ইঞ্জিন' : 'Predictive Runway Simulation'}</span>
            </div>
            <h3 className="text-base font-black text-slate-900 leading-tight">
              {lang === 'bn' ? 'আগামী ৯০ দিনের সম্ভাব্য নগদ রিজার্ভ' : '90-Day Projected Liquidity Trajectory'}
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            Current Baseline: <strong className="text-slate-800 font-mono">{formatBDT(totalNetLiquidity, lang)}</strong>
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLiquidity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E11D48" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#E11D48" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFF1F2" vertical={false} />
              <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
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
              <Area 
                type="monotone" 
                dataKey="ProjectedLiquidity" 
                name={lang === 'bn' ? 'ঋণ নিষ্পত্তিসহ সম্ভাব্য ব্যালেন্স' : 'Projected Reserves (Adjusted)'} 
                stroke="#E11D48" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#colorLiquidity)" 
              />
              <Area 
                type="monotone" 
                dataKey="Baseline" 
                name={lang === 'bn' ? 'সাধারণ বার্ন ব্যালেন্স' : 'Baseline Burn Projection'} 
                stroke="#94a3b8" 
                strokeDasharray="4 4"
                strokeWidth={1.5} 
                fillOpacity={1} 
                fill="url(#colorBase)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Cost Breakdown & Expense Concentration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Cost Concentration Pie Chart */}
        <div className="p-6 rounded-3xl bg-white border border-[#F3D7D9] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#E11D48]" />
              <span>{lang === 'bn' ? 'শীর্ষ খাতভিত্তিক ব্যয়' : 'Top Expense Categories'}</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Concentration</span>
          </div>

          {categoryData.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-bold">
              No categorized expenses logged yet.
            </div>
          ) : (
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderRadius: '1rem', 
                      border: '1px solid #F3D7D9' 
                    }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Capital Allocation Overview */}
        <div className="p-6 rounded-3xl bg-white border border-[#F3D7D9] shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#E11D48]" />
              <span>{lang === 'bn' ? 'ট্রেজারি লিকুইডিটি বণ্টন' : 'Vault Liquidity Allocation'}</span>
            </h3>

            <div className="space-y-3">
              {accounts.map(acc => {
                const bal = Number(acc.balance);
                const sharePercent = totalNetLiquidity > 0 ? Math.round((bal / totalNetLiquidity) * 100) : 0;

                return (
                  <div key={acc.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800">{acc.account_name}</span>
                      <span className="font-mono text-slate-900">{formatBDT(bal, lang)} ({sharePercent}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#E11D48] rounded-full" style={{ width: `${sharePercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>{lang === 'bn' ? 'মোট সংরক্ষিত মূলধন' : 'Consolidated Total'}</span>
            <span className="font-mono text-base font-black text-slate-950">{formatBDT(totalNetLiquidity, lang)}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
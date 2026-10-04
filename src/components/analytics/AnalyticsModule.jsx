import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart as PieIcon, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export default function AnalyticsModule() {
  const { user } = useAuth();
  const { lang } = useLang();

  const [accounts, setAccounts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAnalyticsData();
  }, [user]);

  const fetchAnalyticsData = async () => {
    setLoading(true);

    // 1. Fetch Accounts
    const { data: accData } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id);

    // 2. Fetch Project Expenses
    const { data: expData } = await supabase
      .from('project_expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('expense_date', { ascending: true });

    // 3. Fetch Debts
    const { data: debtData } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id);

    if (accData) setAccounts(accData);
    if (expData) setExpenses(expData);
    if (debtData) setDebts(debtData);

    setLoading(false);
  };

  // Calculations
  const totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalReceivables = debts
    .filter((d) => d.debt_type === 'receivable' && d.status === 'pending')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalPayables = debts
    .filter((d) => d.debt_type === 'payable' && d.status === 'pending')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  // Group Expenses by Date for Chart
  const chartDataMap = {};
  expenses.forEach((item) => {
    const d = item.expense_date || 'Recent';
    if (!chartDataMap[d]) {
      chartDataMap[d] = { date: d, outflow: 0, inflow: 0 };
    }
    chartDataMap[d].outflow += Number(item.amount);
  });

  // If no expenses, add fallback placeholder trends
  const chartData = Object.values(chartDataMap).length > 0 
    ? Object.values(chartDataMap)
    : [
        { date: 'Day 1', inflow: 12000, outflow: 4000 },
        { date: 'Day 5', inflow: 8000, outflow: 3200 },
        { date: 'Day 10', inflow: 15000, outflow: 9500 },
        { date: 'Day 15', inflow: 22000, outflow: 14000 },
        { date: 'Day 20', inflow: 18000, outflow: 7000 },
        { date: 'Day 25', inflow: 25000, outflow: 12500 },
        { date: 'Day 30', inflow: 30000, outflow: 16000 }
      ];

  const COLORS = ['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Header Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Liquidity */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'bn' ? 'মোট তারল্য' : 'Net Liquidity'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {formatBDT(totalBalance, lang)}
          </h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {accounts.length} Active Vaults
          </p>
        </div>

        {/* Total Outflow */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'bn' ? 'মোট খরচ (Outflow)' : 'Total Outflow'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-600 tracking-tight font-mono">
            {formatBDT(totalExpenses, lang)}
          </h3>
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            {expenses.length} logged expenses
          </p>
        </div>

        {/* Pending Receivables */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'bn' ? 'পাওনা টাকা (Inflow Due)' : 'Pending Receivable'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-blue-600 tracking-tight font-mono">
            {formatBDT(totalReceivables, lang)}
          </h3>
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            Expected recovery
          </p>
        </div>

        {/* Pending Payables */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'bn' ? 'দেনা টাকা (Liability)' : 'Pending Payable'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-600 tracking-tight font-mono">
            {formatBDT(totalPayables, lang)}
          </h3>
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            Upcoming settlements
          </p>
        </div>
      </div>

      {/* 2. Visual Cash Flow Area Chart */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 md:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-black text-slate-900 leading-tight">
              {lang === 'bn' ? 'মাসিক ক্যাশ-ফ্লো নিরীক্ষা' : 'Monthly Cash Flow Audit'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn' ? 'আয় ও খরচের লাইভ ট্রেন্ড গ্রাফ' : 'Real-time liquidity velocity & expenditure curves'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-slate-600">Inflow (আয়/তহবিল)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-slate-600">Outflow (ব্যয়/খরচ)</span>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="inflowColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="outflowColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '1rem', 
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="inflow" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#inflowColor)" 
              />
              <Area 
                type="monotone" 
                dataKey="outflow" 
                stroke="#f43f5e" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#outflowColor)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Account Balance Distribution (Vault Allocations) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 md:p-6 shadow-xs">
        <h3 className="text-base font-black text-slate-900 mb-1">
          {lang === 'bn' ? 'অ্যাকাউন্ট ব্যালেন্স বণ্টন' : 'Vault Liquidity Allocation'}
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          {lang === 'bn' ? 'কোন ওয়ালেটে আপনার মোট সম্পদের কত শতাংশ রয়েছে' : 'Percentage weight of assets in institutional accounts'}
        </p>

        <div className="space-y-3.5">
          {accounts.map((acc, index) => {
            const balance = Number(acc.balance);
            const percentage = totalBalance > 0 ? ((balance / totalBalance) * 100).toFixed(1) : 0;
            const color = COLORS[index % COLORS.length];

            return (
              <div key={acc.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-slate-800">{acc.account_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-900 font-mono">{formatBDT(balance, lang)}</span>
                    <span className="text-slate-400 font-mono w-10 text-right">{percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%`, backgroundColor: color }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
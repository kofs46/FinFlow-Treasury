import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { formatBDT } from '../../utils/currency';
import { 
  Download, 
  FileSpreadsheet, 
  Search, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Wallet, 
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Filter
} from 'lucide-react';
import { 
  generateBankStatementPDF, 
  generateStatementExcel 
} from '../../services/reportExportService';

export default function StatementsModule() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    fullName: user?.user_metadata?.full_name || 'Treasury Officer',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
    address: 'Dhaka, Bangladesh'
  });

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Fetch User Profile & Financial Records
  useEffect(() => {
    if (!user?.id) return;

    const fetchAllData = async () => {
      try {
        setLoading(true);

        const [profileRes, accRes, txRes] = await Promise.all([
          supabase.from('profiles').select('full_name, phone, address').eq('id', user.id).single(),
          supabase.from('accounts').select('*').eq('user_id', user.id),
          supabase.from('transactions').select('*').eq('user_id', user.id).order('transaction_date', { ascending: false })
        ]);

        if (profileRes.data) {
          setProfile({
            fullName: profileRes.data.full_name || user?.user_metadata?.full_name || 'Treasury Officer',
            email: user?.email || '',
            phone: profileRes.data.phone || user?.user_metadata?.phone || 'Not recorded',
            address: profileRes.data.address || 'Dhaka, Bangladesh'
          });
        }

        if (accRes.data) setAccounts(accRes.data);
        if (txRes.data) setTransactions(txRes.data);
      } catch (err) {
        console.warn('Error loading statement records:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user?.id]);

  // 2. Filter Logic
  const filteredTransactions = transactions.filter((tx) => {
    const matchAccount = filterAccount === 'all' || tx.account_id === filterAccount;
    const matchType = filterType === 'all' || tx.type === filterType;
    const matchSearch = !searchTerm || 
      (tx.notes && tx.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.category && tx.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchDateStart = !startDate || tx.transaction_date >= startDate;
    const matchDateEnd = !endDate || tx.transaction_date <= endDate;

    return matchAccount && matchType && matchSearch && matchDateStart && matchDateEnd;
  });

  const totalInflow = filteredTransactions
    .filter((t) => ['income', 'transfer_in'].includes(t.type))
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const totalOutflow = filteredTransactions
    .filter((t) => ['expense', 'transfer_out'].includes(t.type))
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const netBalance = totalInflow - totalOutflow;

  // 3. Export PDF Handler
  const handleExportPDF = () => {
    const selectedAcc = accounts.find((a) => a.id === filterAccount);
    const accName = selectedAcc ? selectedAcc.account_name : 'Consolidated Treasury Vault';
    const accNum = selectedAcc ? selectedAcc.account_number : 'ALL-VAULTS';
    const accType = selectedAcc ? selectedAcc.account_type : 'Corporate';

    generateBankStatementPDF({
      userName: profile.fullName,
      userEmail: profile.email,
      userPhone: profile.phone,
      userAddress: profile.address,
      accountName: accName,
      accountNumber: accNum,
      accountType: accType,
      startDate: startDate || (filteredTransactions.length ? filteredTransactions[filteredTransactions.length - 1].transaction_date : ''),
      endDate: endDate || (filteredTransactions.length ? filteredTransactions[0].transaction_date : ''),
      openingBalance: 0,
      closingBalance: netBalance,
      totalInflow,
      totalOutflow,
      transactions: filteredTransactions
    });
  };

  // 4. Export Excel Handler
  const handleExportExcel = () => {
    const selectedAcc = accounts.find((a) => a.id === filterAccount);
    const accName = selectedAcc ? selectedAcc.account_name : 'Combined_Ledger';
    generateStatementExcel({
      userName: profile.fullName,
      accountName: accName,
      transactions: filteredTransactions
    });
  };

  return (
    <div className="space-y-6 select-none font-sans">
      
      {/* 1. TOP HEADER & EXPORT ACTIONS */}
      <div className="rounded-3xl bg-white border border-[#F3D7D9] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-[#E11D48] text-[10px] font-black uppercase tracking-wider border border-rose-200">
              Official Treasury Ledger
            </span>
            <span className="text-xs font-bold text-slate-400">
              • {filteredTransactions.length} Verified Entries
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Statements & Financial Ledger
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Generate formal corporate statements with dynamic user identity & running balances
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            title="Download Excel Spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="py-2.5 px-5 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-2xl text-xs font-black shadow-md shadow-rose-950/15 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            title="Download Institutional PDF Statement"
          >
            <Download className="w-4 h-4" />
            <span>Export Official PDF</span>
          </button>
        </div>
      </div>

      {/* 2. STATEMENT IDENTITY CARD (User Profile Header View) */}
      <div className="rounded-3xl bg-white border border-[#F3D7D9] p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* User Info Details */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-[#E11D48] flex items-center justify-center font-black text-lg shadow-xs shrink-0">
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">{profile.fullName}</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified Holder
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {profile.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {profile.phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {profile.address}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Summary Numbers */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
            <div className="text-left lg:text-right pr-4 lg:border-r border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">Total Inflow</span>
              <p className="text-sm sm:text-base font-black font-mono text-emerald-700">
                +{formatBDT(totalInflow, 'en')}
              </p>
            </div>
            <div className="text-left lg:text-right pr-4 lg:border-r border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#E11D48] block">Total Outflow</span>
              <p className="text-sm sm:text-base font-black font-mono text-[#E11D48]">
                -{formatBDT(totalOutflow, 'en')}
              </p>
            </div>
            <div className="text-left lg:text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Net Liquidity</span>
              <p className="text-base sm:text-lg font-black font-mono text-slate-900">
                {formatBDT(netBalance, 'en')}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. ADVANCED SEARCH & FILTER CONTROLS */}
      <div className="rounded-3xl bg-white border border-[#F3D7D9] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search beneficiary, note or category..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Account Filter */}
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#E11D48] cursor-pointer"
          >
            <option value="all">All Vault Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.account_name}</option>
            ))}
          </select>

          {/* Flow Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#E11D48] cursor-pointer"
          >
            <option value="all">All Flow Types</option>
            <option value="income">Inflows Only (+)</option>
            <option value="expense">Outflows Only (-)</option>
            <option value="transfer_in">Transfer In</option>
            <option value="transfer_out">Transfer Out</option>
          </select>

          {/* Date Range Start */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-[#E11D48] cursor-pointer"
            title="Start Date"
          />

          {/* Date Range End */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-[#E11D48] cursor-pointer"
            title="End Date"
          />
        </div>
      </div>

      {/* 4. PROFESSIONAL TRANSACTION LEDGER TABLE */}
      <div className="rounded-3xl bg-white border border-[#F3D7D9] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Posting Date</th>
                <th className="py-3 px-4">Beneficiary / Notes</th>
                <th className="py-3 px-4">Vault Account</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4 text-right">Inflow (+)</th>
                <th className="py-3 px-4 text-right">Outflow (-)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse">
                    Retrieving statement records...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs font-medium text-slate-400">
                    No transactions match the selected statement filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isInflow = ['income', 'transfer_in'].includes(tx.type);
                  const linkedAcc = accounts.find((a) => a.id === tx.account_id);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {tx.transaction_date}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">
                        {tx.notes || 'Ledger transaction'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {linkedAcc?.account_name || 'Direct Reserve'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                          {tx.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                        {isInflow ? `+${formatBDT(tx.amount, 'en')}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#E11D48] whitespace-nowrap">
                        {!isInflow ? `-${formatBDT(tx.amount, 'en')}` : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
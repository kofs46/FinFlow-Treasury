import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import { BrandLogo } from '../common/BrandLogos';
import { 
  Wallet, 
  Repeat, 
  Plus, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileText, 
  X,
  Search,
  Filter
} from 'lucide-react';

export default function AccountsModule({ onOpenAddAccount, onOpenTransfer, refreshTrigger, onDataChange }) {
  const { user } = useAuth();
  const { lang } = useLang();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Specific Account Statement Modal State
  const [statementAccount, setStatementAccount] = useState(null);
  const [accountTransactions, setAccountTransactions] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [txSearch, setTxSearch] = useState('');

  useEffect(() => {
    if (user) loadAccounts();
  }, [user, refreshTrigger]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (!error && data) setAccounts(data);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAccountStatement = async (acc) => {
    setStatementAccount(acc);
    setStartDate('');
    setEndDate('');
    setTxSearch('');

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('account_id', acc.id)
      .order('transaction_date', { ascending: false });

    if (data) setAccountTransactions(data);
  };

  const filteredAccountTx = accountTransactions.filter((tx) => {
    const d = tx.transaction_date || tx.created_at?.substring(0, 10);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    if (txSearch) {
      const q = txSearch.toLowerCase();
      const n = (tx.notes || '').toLowerCase();
      const c = (tx.category || '').toLowerCase();
      if (!n.includes(q) && !c.includes(q)) return false;
    }
    return true;
  });

  const totalLiquidity = accounts.reduce((acc, a) => acc + Number(a.balance), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#E11D48] px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200">
            Vault Portfolio
          </span>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            {lang === 'bn' ? 'অ্যাকাউন্ট ও ওয়ালেট ভল্ট' : 'Accounts & Liquidity Vaults'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' ? 'সকল ব্যাংক, নগদ ও বিকাশ ওয়ালেটের স্বতন্ত্র হিসাব' : 'Manage balances and view individual date-by-date statements'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenTransfer}
            className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ফান্ড ট্রান্সফার' : 'Transfer Funds'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddAccount}
            className="py-2.5 px-4 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'নতুন ওয়ালেট' : 'Add Vault'}</span>
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="rounded-3xl bg-white border border-[#F3D7D9] p-5 shadow-xs hover:border-[#E11D48] hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <BrandLogo name={acc.account_name} type={acc.account_type} className="w-11 h-11" />
                  <div>
                    <h4 className="text-sm font-black text-slate-900 truncate max-w-[170px]" title={acc.account_name}>
                      {acc.account_name}
                    </h4>
                    <span className="text-[10px] font-black uppercase text-slate-400">
                      {acc.account_type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Available Reserves</span>
                <p className="text-2xl font-black font-mono text-[#E11D48] mt-0.5">
                  {formatBDT(acc.balance, lang)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAccountStatement(acc)}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-[#E11D48] border border-slate-200 hover:border-rose-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'তারিখ অনুযায়ী স্টেটমেন্ট' : 'Date-by-Date Statement'}</span>
            </button>
          </div>
        ))}
      </div>

      {/* MODAL: INDIVIDUAL ACCOUNT DATE-BY-DATE STATEMENT */}
      {statementAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-3xl bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
            
            <button
              type="button"
              onClick={() => setStatementAccount(null)}
              className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <BrandLogo name={statementAccount.account_name} type={statementAccount.account_type} className="w-10 h-10" />
              <div>
                <h3 className="text-base font-black text-slate-900">{statementAccount.account_name}</h3>
                <p className="text-xs text-slate-500 font-mono font-bold">
                  Current Balance: <strong className="text-[#E11D48]">{formatBDT(statementAccount.balance, lang)}</strong>
                </p>
              </div>
            </div>

            {/* Date-by-Date Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search Particulars</label>
                <input
                  type="text"
                  placeholder="Notes, category..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            {/* Statement Entries List */}
            <div className="flex-1 overflow-y-auto space-y-2 border-t border-slate-100 pt-3">
              {filteredAccountTx.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400 font-bold">
                  No transactions found for the selected date range.
                </div>
              ) : (
                filteredAccountTx.map((tx) => {
                  const isInflow = ['income', 'transfer_in'].includes(tx.type);
                  return (
                    <div
                      key={tx.id}
                      className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-400">{tx.transaction_date}</span>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            isInflow ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-[#E11D48]'
                          }`}>
                            {tx.type}
                          </span>
                        </div>
                        <p className="font-bold text-slate-800 truncate mt-0.5">{tx.notes || tx.category || 'Vault Activity'}</p>
                      </div>

                      <div className="text-right">
                        <span className={`font-mono font-black text-sm ${isInflow ? 'text-emerald-600' : 'text-[#E11D48]'}`}>
                          {isInflow ? '+' : '-'}{formatBDT(tx.amount, lang)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { supabase } from '../../supabaseClient';
import { formatBDT } from '../../utils/currency';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export default function SettleDebtModal({ isOpen, onClose, debt, onSettled }) {
  const { user } = useAuth();
  const { lang } = useLang();

  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      fetchAccounts();
      setErrorMsg('');
    }
  }, [isOpen, user]);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, account_name, balance')
      .eq('user_id', user.id);

    if (!error && data) {
      setAccounts(data);
      if (data.length > 0) setSelectedAccountId(data[0].id);
    }
  };

  if (!isOpen || !debt) return null;

  const isReceivable = debt.debt_type === 'receivable';

  const handleSettle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.rpc('settle_debt_transaction', {
      p_debt_id: debt.id,
      p_account_id: selectedAccountId
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      onSettled();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-black text-slate-900 mb-1">
          {lang === 'bn' ? 'দেনা-পাওনা নিষ্পত্তি' : 'Settle Debt Record'}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          {isReceivable 
            ? (lang === 'bn' ? 'পাওনা টাকা আদায় হয়েছে? কোন অ্যাকাউন্টে টাকা জমা করবেন?' : 'Receive money and add to wallet balance')
            : (lang === 'bn' ? 'দেনা পরিশোধ করছেন? কোন অ্যাকাউন্ট থেকে টাকা কাটবেন?' : 'Pay debt and deduct from wallet balance')}
        </p>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5 text-center">
          <p className="text-xs font-bold text-slate-500">{debt.contact_name}</p>
          <h2 className={`text-2xl font-black font-mono mt-1 ${isReceivable ? 'text-blue-600' : 'text-rose-600'}`}>
            {formatBDT(debt.amount, lang)}
          </h2>
          <span className={`inline-block mt-2 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
            isReceivable ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {isReceivable ? 'Receivable (পাওনা)' : 'Payable (দেনা)'}
          </span>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSettle} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {isReceivable 
                ? (lang === 'bn' ? 'যে অ্যাকাউন্টে টাকা জমা হবে' : 'Deposit To Account')
                : (lang === 'bn' ? 'যে অ্যাকাউন্ট থেকে টাকা কাটা হবে' : 'Deduct From Account')}
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_name} — ({formatBDT(acc.balance, lang)})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 ${
              isReceivable 
                ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/25'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{loading ? (lang === 'bn' ? 'সম্পন্ন হচ্ছে...' : 'Processing...') : (lang === 'bn' ? 'নিষ্পত্তি নিশ্চিত করুন' : 'Confirm Settlement')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { supabase } from '../../supabaseClient';
import { formatBDT } from '../../utils/currency';
import { X, Receipt, PlusCircle, AlertCircle } from 'lucide-react';

export default function AddExpenseModal({ isOpen, onClose, projectId, projectName, onExpenseAdded }) {
  const { user } = useAuth();
  const { lang } = useLang();

  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setAccounts(data);
      if (data.length > 0) setSelectedAccountId(data[0].id);
    }
  };

  if (!isOpen) return null;

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg(lang === 'bn' ? 'সঠিক পরিমাণ BDT (৳) টাকা লিখুন।' : 'Enter a valid positive amount.');
      return;
    }

    if (selectedAccount && numericAmount > Number(selectedAccount.balance)) {
      setErrorMsg(
        lang === 'bn'
          ? `অপর্যাপ্ত ব্যালেন্স! নির্বাচিত ওয়ালেটে আছে ${formatBDT(selectedAccount.balance, lang)}।`
          : `Insufficient funds! Selected wallet has ${formatBDT(selectedAccount.balance, lang)}.`
      );
      return;
    }

    setLoading(true);

    const { error } = await supabase.rpc('log_project_expense', {
      p_project_id: projectId,
      p_account_id: selectedAccountId,
      p_title: title.trim(),
      p_amount: numericAmount,
      p_date: date
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setTitle('');
      setAmount('');
      onExpenseAdded();
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

        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-tight">
              {lang === 'bn' ? 'খরচ এন্ট্রি করুন' : 'Log Project Expense'}
            </h3>
            <p className="text-xs text-indigo-600 font-bold truncate max-w-[240px]">
              {projectName}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {lang === 'bn' ? 'খরচের বিবরণ' : 'Expense Title / Purpose'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Materials purchase, Vendor fee"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {lang === 'bn' ? 'টাকার পরিমাণ (BDT ৳)' : 'Expense Amount (BDT ৳)'}
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-black text-slate-400">৳</span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white font-mono text-slate-900 transition font-bold"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {lang === 'bn' ? 'পেমেন্ট ওয়ালেট / ব্যাংক' : 'Payment Account (Deduct From)'}
              </label>
              {selectedAccount && (
                <span className="text-[11px] font-bold text-slate-500">
                  Balance: <span className="text-indigo-600">{formatBDT(selectedAccount.balance, lang)}</span>
                </span>
              )}
            </div>
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

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {lang === 'bn' ? 'তারিখ' : 'Expense Date'}
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 transition font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-500/25 transition disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{loading ? (lang === 'bn' ? 'কাটা হচ্ছে...' : 'Deducting...') : (lang === 'bn' ? 'টাকা কাটুন ও রেকর্ড করুন' : 'Deduct & Record Expense')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
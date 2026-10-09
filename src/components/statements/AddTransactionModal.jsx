import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wallet, 
  Calendar, 
  Tag, 
  FileText, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AddTransactionModal({ isOpen, onClose, onTransactionAdded }) {
  const { user } = useAuth();
  const { lang } = useLang();

  const [type, setType] = useState('income'); // 'income' | 'expense'
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  
  const [accounts, setAccounts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadAccounts();
      setErrorMsg('');
      setAmount('');
      setNotes('');
      setCategory('');
    }
  }, [isOpen, user]);

  const loadAccounts = async () => {
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (data) {
      setAccounts(data);
      if (data.length > 0 && !accountId) {
        setAccountId(data[0].id);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountId || !amount || Number(amount) <= 0) {
      setErrorMsg(lang === 'bn' ? 'সঠিক অ্যাকাউন্ট ও টাকার পরিমাণ দিন।' : 'Please enter valid account and amount.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const numAmount = Number(amount);
      const selectedAcc = accounts.find(a => a.id === accountId);

      // Check balance if expense
      if (type === 'expense' && Number(selectedAcc?.balance || 0) < numAmount) {
        throw new Error(lang === 'bn' ? 'অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই!' : 'Insufficient wallet balance!');
      }

      // 1. Update Account Balance
      const newBalance = type === 'income' 
        ? Number(selectedAcc.balance) + numAmount 
        : Number(selectedAcc.balance) - numAmount;

      const { error: accErr } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (accErr) throw accErr;

      // 2. Insert into unified Transactions table
      const { error: txErr } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          account_id: accountId,
          type: type,
          amount: numAmount,
          category: category.trim() || (type === 'income' ? 'Direct Income' : 'Direct Expense'),
          notes: notes.trim() || (type === 'income' ? 'Capital Deposit' : 'General Outflow'),
          transaction_date: date
        }]);

      if (txErr) throw txErr;

      if (onTransactionAdded) onTransactionAdded();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error recording transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div 
        className="w-full max-w-md rounded-3xl bg-white border border-[#E2E8F0] p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <h3 className="text-lg font-black text-slate-950">
            {lang === 'bn' ? 'আয় / ব্যয় যুক্ত করুন' : 'Record Income / Expense'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' ? 'সরাসরি আয় বা খরচ এন্ট্রি করুন এবং ওয়ালেট আপডেট করুন' : 'Record direct cash flow and auto-sync wallet balance'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-[#E11D48] text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Income / Expense Switch Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              type === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>{lang === 'bn' ? 'আয় (Income / জমা)' : 'Income (+)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              type === 'expense' ? 'bg-[#E11D48] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ব্যয় (Expense / খরচ)' : 'Expense (-)'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              {lang === 'bn' ? 'টাকার পরিমাণ (৳ BDT)' : 'Amount (৳ BDT)'}
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              {type === 'income' ? (lang === 'bn' ? 'যে অ্যাকাউন্টে জমা হবে' : 'Deposit Into Wallet') : (lang === 'bn' ? 'যে অ্যাকাউন্ট থেকে কাটবে' : 'Pay From Wallet')}
            </label>
            <div className="relative">
              <select
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.account_name} ({formatBDT(a.balance, lang)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                {lang === 'bn' ? 'ক্যাটাগরি / খাত' : 'Category'}
              </label>
              <input
                type="text"
                placeholder={type === 'income' ? 'e.g. Salary, Client Fee' : 'e.g. Food, Utility, Office'}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                {lang === 'bn' ? 'তারিখ' : 'Date'}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              {lang === 'bn' ? 'বিবরণ / নোট' : 'Particulars / Notes'}
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly freelance payment"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#E11D48] hover:bg-[#BE123C]'
              }`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{submitting ? 'Saving...' : type === 'income' ? 'Confirm Income (+)' : 'Confirm Expense (-)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
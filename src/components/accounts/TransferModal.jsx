import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import { X, Repeat, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function TransferModal({ isOpen, onClose, onTransferSuccess }) {
  const { user } = useAuth();
  const { lang } = useLang();

  const [accounts, setAccounts] = useState([]);
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadAccounts();
      setErrorMsg('');
    }
  }, [isOpen, user]);

  const loadAccounts = async () => {
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (data && data.length >= 2) {
      setAccounts(data);
      setFromAccountId(data[0].id);
      setToAccountId(data[1].id);
    } else if (data) {
      setAccounts(data);
    }
  };

  if (!isOpen) return null;

  const fromAcc = accounts.find((a) => a.id === fromAccountId);
  const toAcc = accounts.find((a) => a.id === toAccountId);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg(lang === 'bn' ? 'সঠিক টাকার পরিমাণ লিখুন।' : 'Please enter a valid amount.');
      return;
    }

    if (fromAccountId === toAccountId) {
      setErrorMsg(lang === 'bn' ? 'প্রেরক ও প্রাপক অ্যাকাউন্ট একই হতে পারে না।' : 'Source and destination accounts must be different.');
      return;
    }

    if (fromAcc && numericAmount > Number(fromAcc.balance)) {
      setErrorMsg(
        lang === 'bn'
          ? `অপর্যাপ্ত ব্যালেন্স! নির্বাচিত অ্যাকাউন্টে আছে ${formatBDT(fromAcc.balance, lang)}।`
          : `Insufficient balance! Selected account has ${formatBDT(fromAcc.balance, lang)}.`
      );
      return;
    }

    setLoading(true);

    const { error } = await supabase.rpc('transfer_funds', {
      p_from_account: fromAccountId,
      p_to_account: toAccountId,
      p_amount: numericAmount,
      p_note: note || (lang === 'bn' ? 'ওয়ালেট স্থানান্তর' : 'Wallet transfer')
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setAmount('');
      setNote('');
      onTransferSuccess();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl bg-[#F1EDEC] border border-[#EED8C7] p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#F36259] text-white flex items-center justify-center shadow-md">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {lang === 'bn' ? 'ফান্ড স্থানান্তর' : 'Transfer Funds'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {lang === 'bn' ? 'এক অ্যাকাউন্ট থেকে অন্য অ্যাকাউন্টে টাকা পাঠান' : 'Move money between internal accounts'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-[#F36259] text-xs rounded-xl font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase">
                {lang === 'bn' ? 'উৎস অ্যাকাউন্ট (টাকা কাটা হবে)' : 'From Account (Deduct)'}
              </label>
              {fromAcc && (
                <span className="text-[11px] font-mono font-bold text-[#F36259]">
                  {formatBDT(fromAcc.balance, lang)}
                </span>
              )}
            </div>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#F36259]"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_name} — ({formatBDT(acc.balance, lang)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase">
                {lang === 'bn' ? 'গন্তব্য অ্যাকাউন্ট (টাকা জমা হবে)' : 'To Account (Deposit)'}
              </label>
              {toAcc && (
                <span className="text-[11px] font-mono font-bold text-emerald-600">
                  {formatBDT(toAcc.balance, lang)}
                </span>
              )}
            </div>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#F36259]"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_name} — ({formatBDT(acc.balance, lang)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              {lang === 'bn' ? 'টাকার পরিমাণ (BDT ৳)' : 'Transfer Amount (BDT ৳)'}
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#F36259]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              {lang === 'bn' ? 'নোট / বিবরণ (ঐচ্ছিক)' : 'Note / Purpose (Optional)'}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Bank to bKash load"
              className="w-full px-3 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs focus:outline-none focus:border-[#F36259]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#F36259] hover:bg-[#e0534b] text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
          >
            {loading ? (lang === 'bn' ? 'স্থানান্তর হচ্ছে...' : 'Transferring...') : (lang === 'bn' ? 'স্থানান্তর নিশ্চিত করুন' : 'Confirm Transfer')}
          </button>
        </form>
      </div>
    </div>
  );
}
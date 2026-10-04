import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { supabase } from '../../supabaseClient';
import { X, HandCoins, Plus, Phone, Calendar, User, FileText, AlertCircle, Briefcase, Wallet } from 'lucide-react';

export default function RecordDebtModal({ isOpen, onClose, onDebtAdded }) {
  const { user } = useAuth();
  const { lang } = useLang();

  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [debtType, setDebtType] = useState('receivable');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const [accounts, setAccounts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadMeta();
      setErrorMsg('');
    }
  }, [isOpen, user]);

  const loadMeta = async () => {
    const { data: accs } = await supabase.from('accounts').select('id, account_name, balance').eq('user_id', user.id);
    if (accs) {
      setAccounts(accs);
      if (accs.length > 0) setSelectedAccountId(accs[0].id);
    }

    const { data: projs } = await supabase.from('projects').select('id, name').eq('user_id', user.id);
    if (projs) {
      setProjects(projs);
      if (projs.length > 0) setSelectedProjectId(projs[0].id);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const numAmount = parseFloat(amount) || 0;
    const cleanPhone = phone.trim();

    if (!cleanPhone) {
      setErrorMsg(lang === 'bn' ? 'ফোন নম্বর দেওয়া আবশ্যক!' : 'Phone number is required!');
      setLoading(false);
      return;
    }

    // Check if phone number already exists in active debts
    const { data: existing } = await supabase
      .from('debts')
      .select('id, contact_name, status')
      .eq('user_id', user.id)
      .eq('phone', cleanPhone)
      .neq('status', 'settled');

    if (existing && existing.length > 0) {
      setErrorMsg(
        lang === 'bn' 
          ? `এই ফোন নম্বর (${cleanPhone}) দিয়ে "${existing[0].contact_name}" এর একটি পেন্ডিং লোন আছে! আগেরটি ডিলিট বা শোধ না করা পর্যন্ত নতুন অ্যাড করা যাবে না।`
          : `Phone number ${cleanPhone} already has an active loan (${existing[0].contact_name})!`
      );
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('debts').insert({
      user_id: user.id,
      contact_name: contactName.trim(),
      phone: cleanPhone,
      debt_type: debtType,
      original_amount: numAmount,
      remaining_amount: numAmount,
      account_id: selectedAccountId || null,
      project_id: selectedProjectId || null,
      due_date: dueDate || null,
      notes: notes.trim() || null,
      status: 'pending'
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setContactName('');
      setPhone('');
      setAmount('');
      setDueDate('');
      setNotes('');
      onDebtAdded();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-[#F1EDEC] border border-[#EED8C7] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#F36259] text-white flex items-center justify-center shadow-md">
            <HandCoins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Record Loan / Debt</h3>
            <p className="text-[11px] text-slate-500">Unique Phone ID & Multi-Vault Linked</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-[#F36259] text-xs rounded-xl font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-2xl border border-[#EED8C7]">
            <button
              type="button"
              onClick={() => setDebtType('receivable')}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                debtType === 'receivable' ? 'bg-[#F36259] text-white shadow' : 'text-slate-600'
              }`}
            >
              Receivable (পাওনা - Lent)
            </button>
            <button
              type="button"
              onClick={() => setDebtType('payable')}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                debtType === 'payable' ? 'bg-slate-800 text-white shadow' : 'text-slate-600'
              }`}
            >
              Payable (দেনা - Borrowed)
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact / Person Name</label>
            <input
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Anisur Rahman"
              className="w-full px-3.5 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F36259]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Phone Number <span className="text-[#F36259] text-[10px] font-black">(Unique ID)</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 01700000000"
              className="w-full px-3.5 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-[#F36259]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount (BDT ৳)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#F36259]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Linked Account</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs font-semibold focus:outline-none"
              >
                {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Linked Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs font-semibold focus:outline-none"
              >
                <option value="">None (Personal)</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#F36259] hover:bg-[#e0534b] text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Confirm Loan Record'}
          </button>
        </form>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import { 
  HandCoins, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calendar, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  X, 
  Loader2,
  Filter
} from 'lucide-react';

export default function DebtsModule({ onDataChange }) {
  const { user } = useAuth();
  const { lang } = useLang();

  const [debts, setDebts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state: 'all' | 'receivable' | 'payable' | 'overdue'
  const [activeFilter, setActiveFilter] = useState('all');

  // Repayment Modal State
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayAccountId, setRepayAccountId] = useState('');
  const [repayNote, setRepayNote] = useState('');
  const [submittingRepay, setSubmittingRepay] = useState(false);
  const [repayError, setRepayError] = useState('');

  useEffect(() => {
    if (user) loadDebtsData();
  }, [user]);

  const loadDebtsData = async () => {
    setLoading(true);
    try {
      const { data: dData } = await supabase
        .from('debts')
        .select(`
          *,
          accounts:account_id (account_name),
          projects:project_id (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (dData) setDebts(dData);

      const { data: aData } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);
      if (aData) setAccounts(aData);
    } catch (err) {
      console.error('Error fetching debts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Overdue Helper
  const getOverdueStatus = (dueDate, status) => {
    if (status === 'settled') return { isOverdue: false, days: 0, text: 'Settled', color: 'slate' };
    if (!dueDate) return { isOverdue: false, days: 0, text: 'No Due Date', color: 'slate' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return { 
        isOverdue: true, 
        days: diffDays, 
        text: `${diffDays} ${lang === 'bn' ? 'দিন অতিক্রান্ত' : 'Days Overdue'}`, 
        color: 'rose' 
      };
    } else if (diffDays === 0) {
      return { 
        isOverdue: true, 
        days: 0, 
        text: lang === 'bn' ? 'আজই পরিশোধের শেষ দিন' : 'Due Today', 
        color: 'amber' 
      };
    } else {
      const remainingDays = Math.abs(diffDays);
      return { 
        isOverdue: false, 
        days: remainingDays, 
        text: `${remainingDays} ${lang === 'bn' ? 'দিন বাকি' : 'Days Left'}`, 
        color: 'emerald' 
      };
    }
  };

  // Filter List
  const filteredDebts = debts.filter((d) => {
    if (activeFilter === 'receivable') return d.debt_type === 'receivable';
    if (activeFilter === 'payable') return d.debt_type === 'payable';
    if (activeFilter === 'overdue') {
      const { isOverdue } = getOverdueStatus(d.due_date, d.status);
      return isOverdue && d.status !== 'settled';
    }
    return true;
  });

  const totalReceivable = debts
    .filter((d) => d.debt_type === 'receivable' && d.status !== 'settled')
    .reduce((sum, d) => sum + Number(d.remaining_amount), 0);

  const totalPayable = debts
    .filter((d) => d.debt_type === 'payable' && d.status !== 'settled')
    .reduce((sum, d) => sum + Number(d.remaining_amount), 0);

  const overdueCount = debts.filter((d) => {
    const { isOverdue } = getOverdueStatus(d.due_date, d.status);
    return isOverdue && d.status !== 'settled';
  }).length;

  const handleRepaySubmit = async (e) => {
    e.preventDefault();
    if (!selectedDebt || !repayAccountId || !repayAmount) return;

    setSubmittingRepay(true);
    setRepayError('');

    try {
      const { error } = await supabase.rpc('make_debt_payment', {
        p_debt_id: selectedDebt.id,
        p_account_id: repayAccountId,
        p_amount: Number(repayAmount),
        p_note: repayNote
      });

      if (error) throw error;

      setSelectedDebt(null);
      setRepayAmount('');
      setRepayNote('');
      loadDebtsData();
      if (onDataChange) onDataChange();
    } catch (err) {
      setRepayError(err.message || 'Payment execution failed.');
    } finally {
      setSubmittingRepay(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Liquidity Status Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Receivables Card */}
        <div className="p-5 rounded-3xl bg-white border border-[#F3D7D9] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
              {lang === 'bn' ? 'মোট পাওনা (Receivable)' : 'Total Receivable'}
            </span>
            <p className="text-xl font-black font-mono text-slate-900 mt-1">
              +{formatBDT(totalReceivable, lang)}
            </p>
            <span className="text-[10px] text-slate-400 font-bold">Incoming liquidity</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        {/* Payables Card */}
        <div className="p-5 rounded-3xl bg-white border border-[#F3D7D9] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#E11D48] tracking-wider">
              {lang === 'bn' ? 'মোট দেনা (Payable)' : 'Total Payable'}
            </span>
            <p className="text-xl font-black font-mono text-[#E11D48] mt-1">
              -{formatBDT(totalPayable, lang)}
            </p>
            <span className="text-[10px] text-slate-400 font-bold">Obligations to settle</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#E11D48] flex items-center justify-center font-bold">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Overdue Alert Bucket */}
        <div className={`p-5 rounded-3xl border shadow-xs flex items-center justify-between transition ${
          overdueCount > 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-white border-[#F3D7D9]'
        }`}>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'মেয়াদোত্তীর্ণ ঋণ (Overdue)' : 'Overdue Debts'}</span>
            </span>
            <p className="text-xl font-black font-mono text-[#E11D48] mt-1">
              {overdueCount} {lang === 'bn' ? 'টি ঋণ' : 'Records'}
            </p>
            <span className="text-[10px] text-rose-500 font-bold">Requires immediate action</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-[#E11D48] flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#F3D7D9] pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveFilter('all')}
          className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeFilter === 'all' ? 'bg-[#E11D48] text-white shadow-sm' : 'text-slate-600 hover:bg-rose-50'
          }`}
        >
          {lang === 'bn' ? 'সব দেনা-পাওনা' : 'All Debts'} ({debts.length})
        </button>

        <button
          onClick={() => setActiveFilter('receivable')}
          className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeFilter === 'receivable' ? 'bg-[#E11D48] text-white shadow-sm' : 'text-slate-600 hover:bg-rose-50'
          }`}
        >
          {lang === 'bn' ? 'শুধু পাওনা' : 'Receivables'}
        </button>

        <button
          onClick={() => setActiveFilter('payable')}
          className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeFilter === 'payable' ? 'bg-[#E11D48] text-white shadow-sm' : 'text-slate-600 hover:bg-rose-50'
          }`}
        >
          {lang === 'bn' ? 'শুধু দেনা' : 'Payables'}
        </button>

        <button
          onClick={() => setActiveFilter('overdue')}
          className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'overdue' ? 'bg-[#E11D48] text-white shadow-sm' : 'text-rose-600 hover:bg-rose-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'মেয়াদোত্তীর্ণ ঋণ' : 'Overdue Only'}</span>
          {overdueCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-white text-[#E11D48] text-[10px] font-black flex items-center justify-center">
              {overdueCount}
            </span>
          )}
        </button>
      </div>

      {/* Debts Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDebts.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400 text-xs font-bold bg-white rounded-3xl border border-[#F3D7D9]">
            No matching debt records found.
          </div>
        ) : (
          filteredDebts.map((item) => {
            const isReceivable = item.debt_type === 'receivable';
            const { isOverdue, text: dueText, color: dueColor } = getOverdueStatus(item.due_date, item.status);
            const isSettled = item.status === 'settled';

            return (
              <div 
                key={item.id} 
                className={`p-5 rounded-3xl bg-white border transition shadow-xs flex flex-col justify-between ${
                  isOverdue ? 'border-rose-300 ring-2 ring-rose-50' : 'border-[#F3D7D9]'
                }`}
              >
                <div>
                  {/* Top status bar with Overdue Warning Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        isReceivable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-[#E11D48] border border-rose-200'
                      }`}>
                        {isReceivable ? 'Receivable (পাওনা)' : 'Payable (দেনা)'}
                      </span>
                      <span className="text-[10px] font-black uppercase text-slate-400">
                        {item.status}
                      </span>
                    </div>

                    {/* DYNAMIC OVERDUE BADGE */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      dueColor === 'rose'
                        ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                        : dueColor === 'amber'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : dueColor === 'emerald'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {isOverdue && <AlertTriangle className="w-3 h-3" />}
                      <span>{dueText}</span>
                    </span>
                  </div>

                  {/* Contact Identifier & Meta */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-black text-slate-900">{item.contact_name}</h4>
                      <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.phone}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Remaining</span>
                      <p className="text-lg font-black font-mono text-slate-900">
                        {formatBDT(item.remaining_amount, lang)}
                      </p>
                    </div>
                  </div>

                  {/* Notes & Linked Project */}
                  <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Original Loan:</span>
                      <strong className="font-mono text-slate-800">{formatBDT(item.original_amount, lang)}</strong>
                    </div>
                    {item.due_date && (
                      <div className="flex justify-between">
                        <span>Due Date:</span>
                        <strong className="font-mono text-slate-800">{item.due_date}</strong>
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-slate-600 italic mt-1 bg-slate-50 p-2 rounded-xl">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Settle Action Button */}
                {!isSettled && (
                  <button
                    onClick={() => {
                      setSelectedDebt(item);
                      setRepayAmount(item.remaining_amount);
                      setRepayError('');
                    }}
                    className="w-full mt-4 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{isReceivable ? 'Record Payment Received' : 'Pay Debt'}</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* --- REPAYMENT MODAL --- */}
      {selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedDebt(null)}
              className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-950 mb-1">
              {selectedDebt.debt_type === 'receivable' ? 'Record Repayment' : 'Make Debt Payment'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Contact: <strong>{selectedDebt.contact_name}</strong> | Remaining: <strong>{formatBDT(selectedDebt.remaining_amount, lang)}</strong>
            </p>

            {repayError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-[#E11D48] text-xs font-bold">
                {repayError}
              </div>
            )}

            <form onSubmit={handleRepaySubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Settlement Amount (৳)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={selectedDebt.remaining_amount}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  {selectedDebt.debt_type === 'receivable' ? 'Deposit Into Wallet' : 'Pay From Wallet'}
                </label>
                <select
                  required
                  value={repayAccountId}
                  onChange={(e) => setRepayAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                >
                  <option value="">Select Account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_name} ({formatBDT(a.balance, lang)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Note / Particulars</label>
                <input
                  type="text"
                  placeholder="e.g. Partial repayment via bKash"
                  value={repayNote}
                  onChange={(e) => setRepayNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingRepay}
                  className="w-full py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submittingRepay && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{submittingRepay ? 'Processing...' : 'Confirm Settlement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
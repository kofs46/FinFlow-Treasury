import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import { 
  HandCoins, 
  Plus, 
  Phone, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function DebtsModule({ onDataChange }) {
  const { user } = useAuth();
  const { lang } = useLang();

  const [debts, setDebts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);

  // Modals
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [debtType, setDebtType] = useState('receivable');
  const [originalAmount, setOriginalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [debtAccountId, setDebtAccountId] = useState('');

  // Settle Modal
  const [settleDebt, setSettleDebt] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleAccountId, setSettleAccountId] = useState('');

  // Contact Full Statement Modal
  const [statementContact, setStatementContact] = useState(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const { data: dData } = await supabase.from('debts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (dData) setDebts(dData);

      const { data: pData } = await supabase.from('debt_payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (pData) setPayments(pData);

      const { data: aData } = await supabase.from('accounts').select('*').eq('user_id', user.id);
      if (aData) {
        setAccounts(aData);
        if (aData.length > 0) {
          if (!debtAccountId) setDebtAccountId(aData[0].id);
          if (!settleAccountId) setSettleAccountId(aData[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching debts:', err);
    }
  };

  const handleSaveDebt = async (e) => {
    e.preventDefault();
    if (!contactName || !phone || !originalAmount || !debtAccountId) return;

    try {
      const amt = parseFloat(originalAmount);

      // Create Debt
      await supabase.from('debts').insert([{
        user_id: user.id,
        contact_name: contactName,
        phone: phone,
        debt_type: debtType,
        original_amount: amt,
        remaining_amount: amt,
        account_id: debtAccountId,
        due_date: dueDate || null,
        status: 'pending'
      }]);

      setIsAddDebtOpen(false);
      setContactName('');
      setPhone('');
      setOriginalAmount('');
      loadData();
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error('Error saving debt:', err);
    }
  };

  const handleSettlePayment = async (e) => {
    e.preventDefault();
    if (!settleDebt || !settleAmount || !settleAccountId) return;

    try {
      const amt = parseFloat(settleAmount);

      // Call Stored Procedure
      const { error } = await supabase.rpc('make_debt_payment', {
        p_debt_id: settleDebt.id,
        p_account_id: settleAccountId,
        p_amount: amt,
        p_note: `Settlement for ${settleDebt.contact_name}`
      });

      if (error) throw error;

      setSettleDebt(null);
      setSettleAmount('');
      loadData();
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message || 'Payment failed.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#E11D48] px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200">
            Lending & Receivables
          </span>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            {lang === 'bn' ? 'দেনা ও পাওনা ট্র্যাকার' : 'Debts & Lending Ledger'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' ? 'ইউনিক ফোন নম্বর দিয়ে দেনা-পাওনার হিসাব এবং সম্পূর্ণ লেনদেন হিস্ট্রি' : 'Unique phone indexed lending ledger with repayment logs'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddDebtOpen(true)}
          className="py-2.5 px-4 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'bn' ? 'নতুন দেনা / পাওনা যুক্ত করুন' : '+ Record Debt / Loan'}</span>
        </button>
      </div>

      {/* Debts Table */}
      <div className="bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b text-slate-400 font-bold uppercase text-[10px]">
              <th className="py-2.5 px-3">Contact Person</th>
              <th className="py-2.5 px-3">Phone (Unique ID)</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Remaining</th>
              <th className="py-2.5 px-3">Due Date</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {debts.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/50">
                <td className="py-3 px-3 font-bold text-slate-900">
                  <button
                    type="button"
                    onClick={() => setStatementContact(d)}
                    className="hover:text-[#E11D48] underline flex items-center gap-1 cursor-pointer"
                    title="Click to view full loan history"
                  >
                    <span>{d.contact_name}</span>
                    <History className="w-3 h-3 text-slate-400" />
                  </button>
                </td>
                <td className="py-3 px-3 font-mono text-slate-600">{d.phone}</td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    d.debt_type === 'receivable' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-[#E11D48]'
                  }`}>
                    {d.debt_type === 'receivable' ? 'Pawnar (পাওনা)' : 'Denar (দেনা)'}
                  </span>
                </td>
                <td className="py-3 px-3 font-mono font-bold text-slate-900">{formatBDT(d.remaining_amount, lang)}</td>
                <td className="py-3 px-3 font-mono text-slate-500">{d.due_date || '—'}</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-100 text-slate-700">
                    {d.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  {d.status !== 'settled' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSettleDebt(d);
                        setSettleAmount(d.remaining_amount);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Settle / Pay
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RECORD DEBT MODAL */}
      {isAddDebtOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsAddDebtOpen(false)}
              className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900 mb-1">Record Debt or Loan</h3>
            <p className="text-xs text-slate-500 mb-4">Track lending and borrowing against contacts.</p>

            <form onSubmit={handleSaveDebt} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asif Mahmud"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone Number (Unique)</label>
                <input
                  type="tel"
                  required
                  placeholder="+8801XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Type</label>
                  <select
                    value={debtType}
                    onChange={(e) => setDebtType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
                  >
                    <option value="receivable">Pawnar (Receivable / পাবো)</option>
                    <option value="payable">Denar (Payable / দিবো)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Amount (৳ BDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={originalAmount}
                    onChange={(e) => setOriginalAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDebtOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#E11D48] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTLE PAYMENT MODAL */}
      {settleDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSettleDebt(null)}
              className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900 mb-1">Settle Debt Payment</h3>
            <p className="text-xs text-slate-500 mb-4">{settleDebt.contact_name} ({settleDebt.phone})</p>

            <form onSubmit={handleSettlePayment} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Payment Amount (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Select Wallet</label>
                <select
                  value={settleAccountId}
                  onChange={(e) => setSettleAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name} ({formatBDT(a.balance, lang)})</option>)}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSettleDebt(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL STATEMENT & HISTORY MODAL FOR A CONTACT */}
      {statementContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-2xl bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[80vh]">
            <button
              type="button"
              onClick={() => setStatementContact(null)}
              className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900">{statementContact.contact_name}</h3>
            <p className="text-xs text-slate-500 font-mono">Phone: {statementContact.phone}</p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex-1 overflow-y-auto space-y-2">
              <div className="p-3 bg-slate-50 rounded-2xl flex justify-between text-xs font-bold">
                <span>Original Loan Amount:</span>
                <span className="font-mono">{formatBDT(statementContact.original_amount, lang)}</span>
              </div>
              <div className="p-3 bg-rose-50 text-[#E11D48] rounded-2xl flex justify-between text-xs font-bold">
                <span>Remaining Balance:</span>
                <span className="font-mono">{formatBDT(statementContact.remaining_amount, lang)}</span>
              </div>

              <h4 className="text-xs font-black uppercase text-slate-400 mt-4 mb-2">Repayment Logs</h4>
              {payments.filter(p => p.debt_id === statementContact.id).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No repayments recorded yet.</p>
              ) : (
                payments.filter(p => p.debt_id === statementContact.id).map(p => (
                  <div key={p.id} className="p-2.5 rounded-xl border border-slate-100 flex justify-between text-xs font-mono">
                    <span>{p.created_at?.substring(0, 10)} - {p.note}</span>
                    <span className="font-bold text-emerald-600">+{formatBDT(p.amount, lang)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
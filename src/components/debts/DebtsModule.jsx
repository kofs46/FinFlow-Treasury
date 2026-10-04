import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import RecordDebtModal from './RecordDebtModal';
import { 
  HandCoins, 
  Plus, 
  Trash2, 
  History, 
  CheckCircle2, 
  Clock, 
  CreditCard,
  X
} from 'lucide-react';

export default function DebtsModule({ onDataChange }) {
  const { user } = useAuth();
  const { lang } = useLang();

  const [debts, setDebts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState('receivable');
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState(null);
  const [selectedDebtForHistory, setSelectedDebtForHistory] = useState(null);

  // Partial/Full Payment Form States
  const [payAmount, setPayAmount] = useState('');
  const [payAccountId, setPayAccountId] = useState('');
  const [payNote, setPayNote] = useState('');
  const [paying, setPaying] = useState(false);

  // History state
  const [paymentHistory, setPaymentHistory] = useState([]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data: dData } = await supabase.from('debts').select('*, projects(name), accounts(account_name)').eq('user_id', user.id).order('created_at', { ascending: false });
    const { data: aData } = await supabase.from('accounts').select('*').eq('user_id', user.id);
    if (dData) setDebts(dData);
    if (aData) {
      setAccounts(aData);
      if (aData.length > 0) setPayAccountId(aData[0].id);
    }
    setLoading(false);
  };

  const handleMakePayment = async (e) => {
    e.preventDefault();
    if (!selectedDebtForPayment) return;
    setPaying(true);

    const { error } = await supabase.rpc('make_debt_payment', {
      p_debt_id: selectedDebtForPayment.id,
      p_account_id: payAccountId,
      p_amount: parseFloat(payAmount),
      p_note: payNote
    });

    if (error) {
      alert(error.message);
    } else {
      setSelectedDebtForPayment(null);
      setPayAmount('');
      setPayNote('');
      loadData();
      if (onDataChange) onDataChange();
    }
    setPaying(false);
  };

  const openHistory = async (debt) => {
    setSelectedDebtForHistory(debt);
    const { data } = await supabase
      .from('debt_payments')
      .select('*, accounts(account_name)')
      .eq('debt_id', debt.id)
      .order('created_at', { ascending: false });
    if (data) setPaymentHistory(data);
  };

  const handleDeleteDebt = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the record for ${name}?`)) {
      await supabase.from('debts').delete().eq('id', id);
      loadData();
      if (onDataChange) onDataChange();
    }
  };

  const filteredDebts = debts.filter(d => d.debt_type === activeTab);

  return (
    <div className="space-y-5 pb-10">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-[#F1EDEC] border border-[#EED8C7] p-4 rounded-3xl">
        <div>
          <h3 className="text-base font-black text-slate-900">Debt & Lending Ledger</h3>
          <p className="text-[11px] text-slate-500">Track unique borrower history & partial payments</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-[#F36259] hover:bg-[#e0534b] text-white font-bold rounded-2xl text-xs shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Record Loan
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-[#F1EDEC] rounded-2xl border border-[#EED8C7]">
        <button
          onClick={() => setActiveTab('receivable')}
          className={`py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'receivable' ? 'bg-[#F36259] text-white shadow' : 'text-slate-600'
          }`}
        >
          Receivables (পাওনা টাকা)
        </button>
        <button
          onClick={() => setActiveTab('payable')}
          className={`py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'payable' ? 'bg-slate-800 text-white shadow' : 'text-slate-600'
          }`}
        >
          Payables (দেনা টাকা)
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredDebts.map((item) => (
          <div key={item.id} className="p-4 bg-white border border-[#EED8C7] rounded-3xl shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-slate-900">{item.contact_name}</h4>
                <span className="text-[10px] font-mono text-slate-400 font-bold">({item.phone})</span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                  item.status === 'settled' ? 'bg-emerald-100 text-emerald-700' :
                  item.status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {item.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Linked: <strong className="text-slate-700">{item.accounts?.account_name || 'Direct'}</strong> 
                {item.projects?.name && <> • Project: <strong className="text-[#F36259]">{item.projects.name}</strong></>}
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
              <div className="text-right">
                <p className="text-sm font-black font-mono text-[#F36259]">
                  Rem: {formatBDT(item.remaining_amount, lang)}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Original: {formatBDT(item.original_amount, lang)}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {item.status !== 'settled' && (
                  <button
                    onClick={() => {
                      setSelectedDebtForPayment(item);
                      setPayAmount(item.remaining_amount);
                    }}
                    className="px-3 py-1.5 bg-[#F36259] hover:bg-[#e0534b] text-white text-xs font-bold rounded-xl"
                  >
                    Pay/Settle
                  </button>
                )}
                <button
                  onClick={() => openHistory(item)}
                  className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                  title="Payment History"
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteDebt(item.id, item.contact_name)}
                  className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600"
                  title="Delete Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Partial / Full Payment Modal */}
      {selectedDebtForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#F1EDEC] border border-[#EED8C7] rounded-3xl p-6 shadow-2xl relative">
            <h3 className="text-base font-black text-slate-900 mb-1">Make Payment / Settlement</h3>
            <p className="text-xs text-[#F36259] font-bold mb-4">{selectedDebtForPayment.contact_name} ({selectedDebtForPayment.phone})</p>

            <form onSubmit={handleMakePayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Amount (BDT)</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedDebtForPayment.remaining_amount}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400">Enter full or partial amount</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pay Via Wallet</label>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs font-semibold"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name} ({formatBDT(a.balance, lang)})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="e.g. Bank installment"
                  className="w-full px-3 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setSelectedDebtForPayment(null)} className="w-1/2 py-2.5 bg-white rounded-xl text-xs font-bold text-slate-600">Cancel</button>
                <button type="submit" disabled={paying} className="w-1/2 py-2.5 bg-[#F36259] text-white rounded-xl text-xs font-bold">
                  {paying ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {selectedDebtForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-[#EED8C7] rounded-3xl p-6 shadow-2xl relative max-h-[80vh] overflow-y-auto">
            <button onClick={() => setSelectedDebtForHistory(null)} className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900">{selectedDebtForHistory.contact_name} - Payment History</h3>
            <p className="text-xs text-slate-500 mb-4">Phone: {selectedDebtForHistory.phone}</p>

            {paymentHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No payment history recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {paymentHistory.map(ph => (
                  <div key={ph.id} className="p-3 bg-[#F1EDEC] rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{ph.accounts?.account_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{ph.created_at.split('T')[0]} • {ph.payment_type}</p>
                    </div>
                    <p className="font-black font-mono text-[#F36259]">+{formatBDT(ph.amount, lang)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <RecordDebtModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onDebtAdded={loadData} />
    </div>
  );
}
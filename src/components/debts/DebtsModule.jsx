import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { formatBDT } from '../../utils/currency';
import { 
  Plus, 
  HandCoins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Trash2, 
  X, 
  Search,
  CreditCard,
  Clock
} from 'lucide-react';

export default function DebtsModule({ onDataChange }) {
  const { user } = useAuth();
  const [debts, setDebts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [personName, setPersonName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [debtType, setDebtType] = useState('receivable'); // 'receivable' (Lent) | 'payable' (Borrowed)
  const [totalAmount, setTotalAmount] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]); // Lending / Borrowing Date
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [linkedAccountId, setLinkedAccountId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Settlement Modal State
  const [settlementTarget, setSettlementTarget] = useState(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementAccount, setSettlementAccount] = useState('');
  const [settling, setSettling] = useState(false);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [debtRes, accRes] = await Promise.all([
        supabase
          .from('debts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id)
      ]);

      if (debtRes.data) setDebts(debtRes.data);
      if (accRes.data) {
        setAccounts(accRes.data);
        if (accRes.data.length > 0) {
          setLinkedAccountId(accRes.data[0].id);
          setSettlementAccount(accRes.data[0].id);
        }
      }
    } catch (err) {
      console.warn('Error loading debts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Insert Handler: Fully compliant with both pending/settled checks and new issue_date
  const handleCreateDebt = async (e) => {
    e.preventDefault();
    if (!personName || !totalAmount) return;

    setSubmitting(true);
    try {
      const parsedAmount = parseFloat(totalAmount);
      
      const newDebtItem = {
        user_id: user.id,
        // Name compatibility
        person_name: personName.trim(),
        contact_name: personName.trim(),
        phone: phoneNumber.trim() || 'N/A',
        // Type compatibility
        type: debtType,
        debt_type: debtType,
        // Amount compatibility
        total_amount: parsedAmount,
        original_amount: parsedAmount,
        paid_amount: 0,
        remaining_amount: parsedAmount,
        // Dates
        issue_date: issueDate || new Date().toISOString().split('T')[0],
        due_date: dueDate || null,
        notes: notes.trim() || null,
        account_id: linkedAccountId || null,
        // Status compatible with 'pending' in strict DB constraints
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('debts')
        .insert([newDebtItem])
        .select()
        .single();

      if (error) throw error;

      // Adjust linked account balance if selected
      if (linkedAccountId && data) {
        const targetAcc = accounts.find((a) => a.id === linkedAccountId);
        if (targetAcc) {
          const currentBal = Number(targetAcc.balance || 0);
          const newBal = debtType === 'receivable' ? currentBal - parsedAmount : currentBal + parsedAmount;
          await supabase
            .from('accounts')
            .update({ balance: newBal })
            .eq('id', linkedAccountId)
            .eq('user_id', user.id);
        }
      }

      setDebts((prev) => [data, ...prev]);
      setIsAddModalOpen(false);
      setPersonName('');
      setPhoneNumber('');
      setTotalAmount('');
      setDueDate('');
      setNotes('');
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(`Could not create profile: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Settlement Handler
  const handleSettlePayment = async (e) => {
    e.preventDefault();
    if (!settlementTarget || !settlementAmount) return;

    const payVal = parseFloat(settlementAmount);
    if (isNaN(payVal) || payVal <= 0) return;

    setSettling(true);
    try {
      const currentPaid = Number(settlementTarget.paid_amount || 0);
      const newPaid = currentPaid + payVal;
      const total = Number(settlementTarget.total_amount || settlementTarget.original_amount || settlementTarget.amount || 0);
      const newRemaining = Math.max(total - newPaid, 0);
      const isCompleted = newRemaining === 0;

      const updatePayload = {
        paid_amount: newPaid,
        remaining_amount: newRemaining,
        status: isCompleted ? 'settled' : 'partial'
      };

      const { error } = await supabase
        .from('debts')
        .update(updatePayload)
        .eq('id', settlementTarget.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Adjust Vault Account
      if (settlementAccount) {
        const acc = accounts.find((a) => a.id === settlementAccount);
        if (acc) {
          const currentBal = Number(acc.balance || 0);
          const itemType = settlementTarget.type || settlementTarget.debt_type;
          const updatedBal = itemType === 'receivable' ? currentBal + payVal : currentBal - payVal;
          await supabase
            .from('accounts')
            .update({ balance: updatedBal })
            .eq('id', settlementAccount)
            .eq('user_id', user.id);
        }
      }

      setDebts((prev) =>
        prev.map((d) =>
          d.id === settlementTarget.id
            ? { ...d, paid_amount: newPaid, remaining_amount: newRemaining, status: isCompleted ? 'settled' : 'partial' }
            : d
        )
      );

      setSettlementTarget(null);
      setSettlementAmount('');
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(`Settlement failed: ${err.message}`);
    } finally {
      setSettling(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete debt profile for "${name}"?`)) return;
    try {
      const { error } = await supabase.from('debts').delete().eq('id', id).eq('user_id', user.id);
      if (!error) {
        setDebts((prev) => prev.filter((d) => d.id !== id));
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      alert(`Error deleting: ${err.message}`);
    }
  };

  const totalReceivable = debts
    .filter((d) => (d.type === 'receivable' || d.debt_type === 'receivable') && d.status !== 'settled')
    .reduce((acc, curr) => {
      if (curr.remaining_amount !== undefined && curr.remaining_amount !== null) {
        return acc + Number(curr.remaining_amount);
      }
      return acc + (Number(curr.total_amount || curr.original_amount || 0) - Number(curr.paid_amount || 0));
    }, 0);

  const totalPayable = debts
    .filter((d) => (d.type === 'payable' || d.debt_type === 'payable') && d.status !== 'settled')
    .reduce((acc, curr) => {
      if (curr.remaining_amount !== undefined && curr.remaining_amount !== null) {
        return acc + Number(curr.remaining_amount);
      }
      return acc + (Number(curr.total_amount || curr.original_amount || 0) - Number(curr.paid_amount || 0));
    }, 0);

  const filteredDebts = debts.filter((d) => {
    const dName = String(d.person_name || d.contact_name || d.name || '').toLowerCase();
    const dPhone = String(d.phone || '');
    const sTerm = searchTerm.toLowerCase();

    const dType = d.type || d.debt_type;
    const matchFilter = 
      activeFilter === 'all' ? true :
      activeFilter === 'settled' ? d.status === 'settled' :
      dType === activeFilter && d.status !== 'settled';

    const matchSearch = !searchTerm || dName.includes(sTerm) || dPhone.includes(sTerm);

    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-6 select-none font-sans">
      
      {/* 1. TOP HEADER */}
      <div className="rounded-3xl bg-white border border-[#F3D7D9] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-[#E11D48] text-[10px] font-black uppercase tracking-wider border border-rose-200">
              Lending & Liability Manager
            </span>
            <span className="text-xs font-bold text-slate-400">
              • {debts.length} Profiles Tracked
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Debts & Lending Profiles
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Monitor receivables (money lent), payables (borrowed), and installment settlements
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="py-2.5 px-5 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-2xl text-xs font-black shadow-md shadow-rose-950/15 flex items-center gap-2 transition active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Debt Profile</span>
        </button>
      </div>

      {/* 2. SUMMARY KPI OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[#F3D7D9] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
              Total Lent (You Will Receive)
            </span>
            <p className="text-2xl font-black font-mono text-emerald-600 mt-1">
              +{formatBDT(totalReceivable, 'en')}
            </p>
            <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">
              Asset / Outstanding Receivables
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#F3D7D9] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#E11D48] block">
              Total Borrowed (You Must Pay)
            </span>
            <p className="text-2xl font-black font-mono text-[#E11D48] mt-1">
              -{formatBDT(totalPayable, 'en')}
            </p>
            <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">
              Liability / Outstanding Payables
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#E11D48] flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#F3D7D9] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Net Outstanding Ledger
            </span>
            <p className="text-2xl font-black font-mono text-slate-900 mt-1">
              {formatBDT(totalReceivable - totalPayable, 'en')}
            </p>
            <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">
              {totalReceivable >= totalPayable ? 'Net Surplus Position' : 'Net Debt Exposure'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
            <HandCoins className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. FILTER TABS & SEARCH */}
      <div className="rounded-3xl bg-white border border-[#F3D7D9] p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'All Active' },
            { id: 'receivable', label: 'Lent (Receivables)' },
            { id: 'payable', label: 'Borrowed (Payables)' },
            { id: 'settled', label: 'Settled / Closed' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`py-2 px-3.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search person or phone..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
          />
        </div>
      </div>

      {/* 4. PROFILE CARDS */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filteredDebts.length === 0 ? (
        <div className="rounded-3xl bg-white border border-[#F3D7D9] p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-[#E11D48] flex items-center justify-center mx-auto">
            <HandCoins className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-900">No Debt Profiles Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You don't have any entries under this filter. Tap below to create your first lending or borrowing card.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="py-2.5 px-5 bg-[#E11D48] text-white text-xs font-bold rounded-xl shadow-md inline-flex items-center gap-1.5 cursor-pointer mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Profile</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDebts.map((item) => {
            const displayName = item.person_name || item.contact_name || item.name || 'Unknown Contact';
            const initialLetter = displayName.trim().charAt(0).toUpperCase() || 'U';

            const isReceivable = (item.type || item.debt_type) === 'receivable';
            const total = Number(item.total_amount || item.original_amount || item.amount || 0);
            
            let remaining = 0;
            let paid = 0;
            if (item.remaining_amount !== undefined && item.remaining_amount !== null) {
              remaining = Number(item.remaining_amount);
              paid = Math.max(total - remaining, 0);
            } else {
              paid = Number(item.paid_amount || 0);
              remaining = Math.max(total - paid, 0);
            }

            const progress = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;
            const isSettled = item.status === 'settled' || remaining === 0;
            const createdDateFormatted = item.issue_date || (item.created_at ? item.created_at.split('T')[0] : '—');

            return (
              <div
                key={item.id}
                className="rounded-3xl bg-white border border-[#F3D7D9] p-5 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div 
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isSettled ? 'bg-slate-300' : isReceivable ? 'bg-emerald-500' : 'bg-[#E11D48]'
                  }`} 
                />

                {/* Top Section */}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 shadow-xs border ${
                        isSettled 
                          ? 'bg-slate-100 text-slate-600 border-slate-200' 
                          : isReceivable 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-50 text-[#E11D48] border-rose-200'
                      }`}
                    >
                      {initialLetter}
                    </div>

                    <div className="leading-tight truncate">
                      <h4 className="text-sm font-black text-slate-900 truncate">
                        {displayName}
                      </h4>
                      {item.phone && item.phone !== 'N/A' ? (
                        <a 
                          href={`tel:${item.phone}`} 
                          className="text-[11px] font-mono text-slate-500 hover:text-[#E11D48] flex items-center gap-1 mt-0.5"
                          title="Call Person"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{item.phone}</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 block mt-0.5">No contact recorded</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span 
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        isSettled
                          ? 'bg-slate-100 text-slate-600 border-slate-200'
                          : isReceivable
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-[#E11D48] border-rose-200'
                      }`}
                    >
                      {isSettled ? 'SETTLED' : isReceivable ? 'LENT (RECEIVE)' : 'BORROWED (PAY)'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, displayName)}
                      className="p-1 rounded-lg text-slate-300 hover:text-rose-600 transition cursor-pointer"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Financial Balances & Progress */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Remaining Due
                    </span>
                    <span className={`text-lg font-black font-mono ${
                      isSettled ? 'text-slate-400 line-through' : isReceivable ? 'text-emerald-600' : 'text-[#E11D48]'
                    }`}>
                      {formatBDT(remaining, 'en')}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>Repaid: {progress}%</span>
                      <span>Total: {formatBDT(total, 'en')}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div 
                        style={{ width: `${progress}%` }} 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSettled ? 'bg-slate-400' : isReceivable ? 'bg-emerald-500' : 'bg-[#E11D48]'
                        }`} 
                      />
                    </div>
                  </div>
                </div>

                {/* Date Breakdown: Issue Date and Due Date */}
                <div className="space-y-1.5 text-xs bg-white rounded-xl p-2 border border-slate-100">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Lent/Borrowed Date:
                    </span>
                    <span className="font-mono font-bold text-slate-700">
                      {createdDateFormatted}
                    </span>
                  </div>

                  {item.due_date && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Target Due Date:
                      </span>
                      <span className="font-mono font-bold text-[#E11D48]">
                        {item.due_date}
                      </span>
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-[11px] text-slate-500 italic border-t border-slate-100 pt-1 mt-1 truncate">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Settlement Action */}
                <div className="pt-2 border-t border-slate-100">
                  {isSettled ? (
                    <div className="py-2 px-3 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Debt Fully Settled</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSettlementTarget(item);
                        setSettlementAmount(String(remaining));
                      }}
                      className="w-full py-2.5 px-4 bg-white hover:bg-rose-50/70 border border-[#F3D7D9] text-slate-800 hover:text-[#E11D48] rounded-xl text-xs font-black shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-[#E11D48]" />
                      <span>Record Repayment / Settle</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 5. ADD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">New Debt / Lending Profile</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="space-y-4 mt-4">
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDebtType('receivable')}
                  className={`py-2 rounded-xl text-xs font-black uppercase transition cursor-pointer border ${
                    debtType === 'receivable'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  I Lent Money (Receivable)
                </button>

                <button
                  type="button"
                  onClick={() => setDebtType('payable')}
                  className={`py-2 rounded-xl text-xs font-black uppercase transition cursor-pointer border ${
                    debtType === 'payable'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  I Borrowed (Payable)
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Person or Company Name
                </label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="e.g. Shakib Al Hasan"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Mobile / Contact Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 01700000000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Total Principal Amount (BDT)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              {/* Two Date Inputs: Lending/Borrowing Date & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                    Lent / Borrowed Date
                  </label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Disburse From / Receive Into Vault
                </label>
                <select
                  value={linkedAccountId}
                  onChange={(e) => setLinkedAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                >
                  <option value="">Don't adjust vault balance</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_name} (Bal: Tk {Number(a.balance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Terms or Purpose Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Short term personal lending"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-5 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-black shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Creating Profile...' : 'Save Debt Profile'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 6. SETTLEMENT MODAL */}
      {settlementTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Record Repayment</h3>
                <p className="text-xs text-slate-400">
                  For {settlementTarget.person_name || settlementTarget.contact_name || settlementTarget.name || 'Profile'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettlementTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettlePayment} className="space-y-4 mt-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Settlement Amount (BDT)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Deposit / Draw from Vault
                </label>
                <select
                  value={settlementAccount}
                  onChange={(e) => setSettlementAccount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                >
                  <option value="">Don't adjust vault balance</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_name} (Bal: Tk {Number(a.balance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSettlementTarget(null)}
                  className="py-2 px-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settling}
                  className="py-2 px-4 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-black shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {settling ? 'Settling...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
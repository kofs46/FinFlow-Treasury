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
  History, 
  X,
  CheckCircle2,
  RefreshCw,
  Search,
  ArrowRight,
  TrendingDown,
  TrendingUp
} from 'lucide-react';

export default function DebtsModule({ onDataChange }) {
  const { user } = useAuth();
  const { lang } = useLang();

  const [debts, setDebts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [searchPhone, setSearchPhone] = useState('');

  // Add / Modify Entry Modal
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [debtType, setDebtType] = useState('receivable'); // 'receivable' (Pabo) or 'payable' (Dibo)
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [note, setNote] = useState('');

  // Repayment Modal
  const [settleDebt, setSettleDebt] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleAccountId, setSettleAccountId] = useState('');

  // Selected Phone Full Audit Timeline
  const [activeContactLedger, setActiveContactLedger] = useState(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const { data: dData } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (dData) setDebts(dData);

      const { data: pData } = await supabase
        .from('debt_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (pData) setPayments(pData);

      const { data: aData } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);
      if (aData) {
        setAccounts(aData);
        if (aData.length > 0) {
          if (!selectedAccountId) setSelectedAccountId(aData[0].id);
          if (!settleAccountId) setSettleAccountId(aData[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading debts:', err);
    }
  };

  // Group Debts by Unique Phone Number
  const uniqueContactsMap = {};
  debts.forEach((d) => {
    const p = d.phone.trim();
    if (!uniqueContactsMap[p]) {
      uniqueContactsMap[p] = {
        name: d.contact_name,
        phone: p,
        records: [],
        totalReceivable: 0,
        totalPayable: 0,
      };
    }
    uniqueContactsMap[p].records.push(d);
    if (d.debt_type === 'receivable') {
      uniqueContactsMap[p].totalReceivable += Number(d.remaining_amount);
    } else {
      uniqueContactsMap[p].totalPayable += Number(d.remaining_amount);
    }
  });

  const uniqueContactList = Object.values(uniqueContactsMap).filter(c => {
    if (!searchPhone) return true;
    const q = searchPhone.toLowerCase();
    return c.phone.includes(q) || c.name.toLowerCase().includes(q);
  });

  const handleSaveDebtEntry = async (e) => {
    e.preventDefault();
    if (!contactName || !phone || !amount || !selectedAccountId) return;

    try {
      const numericAmt = parseFloat(amount);
      const cleanPhone = phone.trim();

      // Insert new loan ledger row for this phone number
      const { error } = await supabase.from('debts').insert([{
        user_id: user.id,
        contact_name: contactName,
        phone: cleanPhone,
        debt_type: debtType,
        original_amount: numericAmt,
        remaining_amount: numericAmt,
        account_id: selectedAccountId,
        due_date: dueDate || null,
        notes: note || null,
        status: 'pending'
      }]);

      if (error) throw error;

      setIsAddDebtOpen(false);
      setContactName('');
      setPhone('');
      setAmount('');
      setNote('');
      loadData();
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message || 'Error saving debt record.');
    }
  };

  const handleSettlePayment = async (e) => {
    e.preventDefault();
    if (!settleDebt || !settleAmount || !settleAccountId) return;

    try {
      const amt = parseFloat(settleAmount);

      const { error } = await supabase.rpc('make_debt_payment', {
        p_debt_id: settleDebt.id,
        p_account_id: settleAccountId,
        p_amount: amt,
        p_note: `Settlement for ${settleDebt.contact_name} (${settleDebt.phone})`
      });

      if (error) throw error;

      setSettleDebt(null);
      setSettleAmount('');
      loadData();
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message || 'Payment settlement failed.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Quick Action */}
      <div className="bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#E11D48] px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200">
            Lending Directory
          </span>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            {lang === 'bn' ? 'দেনা ও পাওনা লেজার (ফোন নম্বর ভিত্তিক)' : 'Debts & Loans (Phone Number Unique Ledger)'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' ? 'একই ফোন নম্বরে লেনদেনের ভূমিকা পরিবর্তন এবং সম্পূর্ণ অতীতের হিস্ট্রি' : 'Track dual-role borrowers/lenders with lifetime transaction history per contact'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddDebtOpen(true)}
          className="py-2.5 px-4 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'bn' ? 'নতুন লেনদেন এন্ট্রি' : '+ Record Loan / Debt'}</span>
        </button>
      </div>

      {/* 2. Contact Phone Search Filter */}
      <div className="bg-white border border-[#F3D7D9] rounded-2xl p-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={lang === 'bn' ? 'ফোন নম্বর বা নাম দিয়ে খুঁজুন...' : 'Search by phone number or contact name...'}
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          className="w-full text-xs font-bold bg-transparent outline-none text-slate-800"
        />
      </div>

      {/* 3. Unique Phone Contacts Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {uniqueContactList.map((contact) => {
          const netPosition = contact.totalReceivable - contact.totalPayable;
          return (
            <div
              key={contact.phone}
              className="rounded-3xl bg-white border border-[#F3D7D9] p-5 shadow-xs hover:border-[#E11D48] transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{contact.name}</h4>
                    <p className="text-xs font-mono font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-[#E11D48]" /> {contact.phone}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    {contact.records.length} Entries
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-emerald-700">Pabo (Receivable):</span>
                    <span className="font-mono">{formatBDT(contact.totalReceivable, lang)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-[#E11D48]">Dibo (Payable):</span>
                    <span className="font-mono">{formatBDT(contact.totalPayable, lang)}</span>
                  </div>
                  <div className="flex justify-between font-black pt-1 border-t border-slate-100">
                    <span>Net Balance:</span>
                    <span className={`font-mono ${netPosition >= 0 ? 'text-emerald-600' : 'text-[#E11D48]'}`}>
                      {netPosition >= 0 ? '+' : ''}{formatBDT(netPosition, lang)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveContactLedger(contact)}
                className="mt-5 w-full py-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-[#E11D48] border border-slate-200 hover:border-rose-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'সকল লেনদেনের হিস্ট্রি দেখুন' : 'View Full History & Statement'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD DEBT ENTRY WITH ROLE SELECTION */}
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
            <h3 className="text-base font-black text-slate-900 mb-1">
              {lang === 'bn' ? 'নতুন দেনা বা পাওনা এন্ট্রি' : 'Record Loan or Debt'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {lang === 'bn' ? 'একই ব্যক্তি থেকে টাকা নেওয়া বা দেওয়ার হিসাব' : 'Phone number will index all past and future loans for this contact.'}
            </p>

            <form onSubmit={handleSaveDebtEntry} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  {lang === 'bn' ? 'ব্যক্তির নাম' : 'Contact Name'}
                </label>
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
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  {lang === 'bn' ? 'ফোন নম্বর (ইউনিক আইডি)' : 'Phone Number (Unique Index)'}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-mono font-bold"
                />
              </div>

              {/* Role Switcher */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    {lang === 'bn' ? 'লেনদেনের ধরন (Role)' : 'Transaction Role'}
                  </label>
                  <select
                    value={debtType}
                    onChange={(e) => setDebtType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
                  >
                    <option value="receivable">Pabo / পাওনা (I Lent Money)</option>
                    <option value="payable">Dibo / দেনা (I Borrowed Money)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    {lang === 'bn' ? 'পরিমাণ (৳ BDT)' : 'Amount (৳ BDT)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    {lang === 'bn' ? 'ওয়ালেট / ব্যাংক' : 'Linked Wallet'}
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
                  >
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    {lang === 'bn' ? 'পরিশোধের শেষ তারিখ' : 'Due Date'}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  {lang === 'bn' ? 'বিবরণ / নোট' : 'Particulars / Memo'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Urgent business bridge loan"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs"
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
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FULL TIMELINE STATEMENT FOR A CONTACT PHONE */}
      {activeContactLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-3xl bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
            <button
              type="button"
              onClick={() => setActiveContactLedger(null)}
              className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">{activeContactLedger.name}</h3>
              <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-[#E11D48]" /> Phone: {activeContactLedger.phone}
              </p>
            </div>

            {/* List of all loans and payments */}
            <div className="flex-1 overflow-y-auto space-y-3 my-4 pr-1">
              {activeContactLedger.records.map((rec) => {
                const recPayments = payments.filter(p => p.debt_id === rec.id);
                return (
                  <div key={rec.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          rec.debt_type === 'receivable' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-[#E11D48]'
                        }`}>
                          {rec.debt_type === 'receivable' ? 'Lent (পাওনা)' : 'Borrowed (দেনা)'}
                        </span>
                        <span className="font-mono text-xs text-slate-400">
                          {rec.created_at?.substring(0, 10)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {formatBDT(rec.original_amount, lang)}
                        </span>
                        <span className="text-[10px] block text-slate-500">
                          Remaining: <strong className="text-[#E11D48] font-mono">{formatBDT(rec.remaining_amount, lang)}</strong>
                        </span>
                      </div>
                    </div>

                    {rec.notes && <p className="text-xs text-slate-600 italic">"{rec.notes}"</p>}

                    {/* Settle Action */}
                    {rec.status !== 'settled' && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSettleDebt(rec);
                            setSettleAmount(rec.remaining_amount);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                        >
                          Record Repayment
                        </button>
                      </div>
                    )}

                    {/* Repayment History for this loan */}
                    {recPayments.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Repayment Logs:</span>
                        {recPayments.map(p => (
                          <div key={p.id} className="flex justify-between text-[11px] font-mono text-emerald-700">
                            <span>{p.created_at?.substring(0, 10)} - {p.note}</span>
                            <span>+{formatBDT(p.amount, lang)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* MODAL: SETTLE PAYMENT */}
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
            <h3 className="text-base font-black text-slate-900 mb-1">
              {lang === 'bn' ? 'টাকা পরিশোধ / গ্রহণের এন্ট্রি' : 'Record Repayment Entry'}
            </h3>
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
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Select Vault</label>
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

    </div>
  );
}
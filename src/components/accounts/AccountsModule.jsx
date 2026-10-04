import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import { BrandLogo } from '../common/BrandLogos';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  X, 
  Check 
} from 'lucide-react';

export default function AccountsModule({ onOpenAddAccount, onOpenTransfer, refreshTrigger, onDataChange }) {
  const { user } = useAuth();
  const { lang } = useLang();

  const [accounts, setAccounts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedAccForStatement, setSelectedAccForStatement] = useState(null);
  const [accTransactions, setAccTransactions] = useState([]);

  // Edit Modal State
  const [editingAccount, setEditingAccount] = useState(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [editType, setEditType] = useState('bank');
  const [updating, setUpdating] = useState(false);

  // Statement Filters
  const [stmtMonth, setStmtMonth] = useState('');
  const [stmtProjectId, setStmtProjectId] = useState('all');

  useEffect(() => {
    if (user) {
      loadAccounts();
      loadProjects();
    }
  }, [user, refreshTrigger]);

  const loadAccounts = async () => {
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (data) setAccounts(data);
  };

  const loadProjects = async () => {
    const { data } = await supabase.from('projects').select('id, name').eq('user_id', user.id);
    if (data) setProjects(data);
  };

  const openAccountStatement = async (acc) => {
    setSelectedAccForStatement(acc);

    const { data: exp } = await supabase
      .from('project_expenses')
      .select('*, projects(name)')
      .eq('account_id', acc.id)
      .eq('user_id', user.id);

    const { data: dPay } = await supabase
      .from('debt_payments')
      .select('*, debts(contact_name, debt_type)')
      .eq('account_id', acc.id)
      .eq('user_id', user.id);

    const merged = [];
    if (exp) {
      exp.forEach((e) => {
        merged.push({
          id: e.id,
          title: `${lang === 'bn' ? 'প্রজেক্ট' : 'Project'}: ${e.projects?.name || ''} - ${e.title}`,
          date: e.expense_date || e.created_at.split('T')[0],
          amount: Number(e.amount),
          type: 'debit',
          projectId: e.project_id
        });
      });
    }

    if (dPay) {
      dPay.forEach((dp) => {
        const isRec = dp.debts?.debt_type === 'receivable';
        merged.push({
          id: dp.id,
          title: `${lang === 'bn' ? 'লোন' : 'Loan'}: ${dp.debts?.contact_name || ''}`,
          date: dp.created_at.split('T')[0],
          amount: Number(dp.amount),
          type: isRec ? 'credit' : 'debit',
          projectId: 'all'
        });
      });
    }

    merged.sort((a, b) => new Date(b.date) - new Date(a.date));
    setAccTransactions(merged);
  };

  const startEdit = (acc, e) => {
    e.stopPropagation();
    setEditingAccount(acc);
    setEditName(acc.account_name);
    setEditBalance(acc.balance);
    setEditType(acc.account_type);
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    if (!editingAccount) return;
    setUpdating(true);

    const { error } = await supabase
      .from('accounts')
      .update({
        account_name: editName.trim(),
        balance: parseFloat(editBalance) || 0,
        account_type: editType
      })
      .eq('id', editingAccount.id);

    if (!error) {
      setEditingAccount(null);
      loadAccounts();
      if (onDataChange) onDataChange();
    } else {
      alert(error.message);
    }
    setUpdating(false);
  };

  const handleDeleteAccount = async (id, name, e) => {
    e.stopPropagation();
    const confirmMsg = lang === 'bn' 
      ? `আপনি কি নিশ্চিত "${name}" অ্যাকাউন্টটি মুছে ফেলতে চান?` 
      : `Are you sure you want to delete "${name}"?`;

    if (window.confirm(confirmMsg)) {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (!error) {
        loadAccounts();
        if (onDataChange) onDataChange();
      } else {
        alert(error.message);
      }
    }
  };

  const filteredStatement = accTransactions.filter((t) => {
    const matchesMonth = stmtMonth ? t.date.startsWith(stmtMonth) : true;
    const matchesProj = stmtProjectId === 'all' || t.projectId === stmtProjectId;
    return matchesMonth && matchesProj;
  });

  return (
    <div className="space-y-5 pb-10">
      <div className="flex justify-between items-center bg-[#F1EDEC] border border-[#EED8C7] p-4 rounded-3xl">
        <div>
          <h3 className="text-base font-black text-slate-900">
            {lang === 'bn' ? 'অ্যাকাউন্ট ও ওয়ালেট' : 'Wallets & Accounts'}
          </h3>
          <p className="text-[11px] text-slate-500">
            {lang === 'bn' ? 'কার্ডে চাপ দিয়ে স্টেটমেন্ট দেখুন বা তথ্য এডিট করুন' : 'Click card for statement or use actions to edit/delete'}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onOpenTransfer} 
            className="px-3.5 py-2 bg-white border border-[#EED8C7] text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-50 transition"
          >
            {lang === 'bn' ? '⇄ স্থানান্তর' : '⇄ Transfer'}
          </button>
          <button 
            onClick={onOpenAddAccount} 
            className="px-3.5 py-2 bg-[#F36259] hover:bg-[#e0534b] text-white font-bold rounded-2xl text-xs shadow-sm transition"
          >
            {lang === 'bn' ? '+ নতুন ওয়ালেট' : '+ Add Wallet'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            onClick={() => openAccountStatement(acc)}
            className="p-5 bg-white border border-[#EED8C7] hover:border-[#F36259] rounded-3xl shadow-xs cursor-pointer transition flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#EED8C7] text-slate-800">
                  {acc.account_type}
                </span>
                <div className="flex items-center gap-1.5">
                  <BrandLogo name={acc.account_name} type={acc.account_type} className="w-7 h-7 mr-1" />
                  
                  {/* EDIT BUTTON */}
                  <button
                    onClick={(e) => startEdit(acc, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#F36259] hover:bg-[#F1EDEC] transition"
                    title={lang === 'bn' ? 'অ্যাকাউন্ট এডিট করুন' : 'Edit Account'}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* DELETE BUTTON */}
                  <button
                    onClick={(e) => handleDeleteAccount(acc.id, acc.account_name, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title={lang === 'bn' ? 'অ্যাকাউন্ট মুছুন' : 'Delete Account'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-900 truncate">{acc.account_name}</h4>
              <p className="text-xl font-black font-mono text-[#F36259] mt-3">
                {formatBDT(acc.balance, lang)}
              </p>
            </div>

            <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>{lang === 'bn' ? 'স্টেটমেন্ট দেখুন' : 'View Statement'}</span>
              <FileText className="w-3.5 h-3.5 text-[#F36259]" />
            </p>
          </div>
        ))}
      </div>

      {/* EDIT ACCOUNT MODAL */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#F1EDEC] border border-[#EED8C7] rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingAccount(null)}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 mb-1">
              {lang === 'bn' ? 'অ্যাকাউন্ট তথ্য পরিবর্তন' : 'Edit Account Details'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {editingAccount.account_name}
            </p>

            <form onSubmit={handleUpdateAccount} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  {lang === 'bn' ? 'অ্যাকাউন্টের নাম' : 'Account Title'}
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#F36259]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  {lang === 'bn' ? 'অ্যাকাউন্টের ধরন' : 'Account Type'}
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#F36259]"
                >
                  <option value="bank">Bank (ব্যাংক)</option>
                  <option value="mfs">MFS (bKash / Nagad / Upay)</option>
                  <option value="cash">Cash in Hand (নগদ টাকা)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  {lang === 'bn' ? 'ব্যালেন্স (BDT ৳)' : 'Balance (BDT ৳)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-[#F36259]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="w-1/2 py-2.5 bg-white rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="w-1/2 py-2.5 bg-[#F36259] hover:bg-[#e0534b] text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {updating ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (lang === 'bn' ? 'আপডেট করুন' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACCOUNT STATEMENT DRAWER MODAL */}
      {selectedAccForStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-[#EED8C7] rounded-3xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedAccForStatement(null)} 
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900">
              {selectedAccForStatement.account_name} {lang === 'bn' ? 'স্টেটমেন্ট' : 'Statement'}
            </h3>
            <p className="text-xs text-[#F36259] font-bold font-mono">
              {lang === 'bn' ? 'বর্তমান ব্যালেন্স:' : 'Current Balance:'} {formatBDT(selectedAccForStatement.balance, lang)}
            </p>

            <div className="grid grid-cols-2 gap-2 mt-4 mb-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  {lang === 'bn' ? 'মাস নির্বাচন' : 'Select Month'}
                </label>
                <input
                  type="month"
                  value={stmtMonth}
                  onChange={(e) => setStmtMonth(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#F1EDEC] border border-[#EED8C7] rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#F36259]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  {lang === 'bn' ? 'প্রজেক্ট ফিল্টার' : 'Project Filter'}
                </label>
                <select
                  value={stmtProjectId}
                  onChange={(e) => setStmtProjectId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#F1EDEC] border border-[#EED8C7] rounded-xl text-xs font-bold focus:outline-none focus:border-[#F36259]"
                >
                  <option value="all">{lang === 'bn' ? 'সকল প্রজেক্ট' : 'All Projects'}</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {filteredStatement.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center font-medium">
                  {lang === 'bn' ? 'এই ফিল্টারের অধীনে কোনো লেনদেন পাওয়া যায়নি।' : 'No transactions found for this filter.'}
                </p>
              ) : (
                filteredStatement.map((t) => (
                  <div key={t.id} className="p-3 bg-[#F1EDEC] rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{t.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{t.date}</p>
                    </div>
                    <p className={`font-black font-mono ${t.type === 'credit' ? 'text-emerald-600' : 'text-[#F36259]'}`}>
                      {t.type === 'credit' ? '+' : '-'}{formatBDT(t.amount, lang)}
                    </p>
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
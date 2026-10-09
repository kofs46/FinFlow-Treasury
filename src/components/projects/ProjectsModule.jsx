import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import { 
  Briefcase, 
  Plus, 
  ArrowRightLeft, 
  Receipt, 
  Calendar, 
  Wallet, 
  FileText, 
  Camera, 
  ExternalLink, 
  Eye, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function ProjectsModule({ onDataChange }) {
  const { user } = useAuth();
  const { lang } = useLang();

  const [projects, setProjects] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // New Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().substring(0, 10));
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const fileInputRef = useRef(null);

  // Preview Receipt Modal
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  // Inter-project Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [fromProjId, setFromProjId] = useState('');
  const [toProjId, setToProjId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user) {
      loadProjectsData();
    }
  }, [user]);

  const loadProjectsData = async () => {
    // 1. Projects
    const { data: pData } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (pData) {
      setProjects(pData);
      if (!selectedProjectId && pData.length > 0) {
        setSelectedProjectId(pData[0].id);
      }
    }

    // 2. Accounts
    const { data: aData } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id);
    if (aData) setAccounts(aData);

    // 3. Expenses with receipts
    const { data: eData } = await supabase
      .from('project_expenses')
      .select(`
        *,
        accounts:account_id (account_name)
      `)
      .eq('user_id', user.id)
      .order('expense_date', { ascending: false });
    if (eData) setExpenses(eData);
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !expenseAccountId || !expenseAmount) return;

    setSubmittingExpense(true);
    setMessage({ text: '', type: '' });

    try {
      let uploadedReceiptUrl = null;

      // 1. Upload receipt image if selected
      if (receiptFile) {
        setUploadingReceipt(true);
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${user.id}/receipt-${Date.now()}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from('receipts')
          .upload(fileName, receiptFile, { upsert: true });

        if (uploadErr) throw uploadErr;

        const { data: publicData } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName);

        uploadedReceiptUrl = publicData.publicUrl;
      }

      // 2. Call SQL stored procedure for atomic deduction
      const { error: rpcErr } = await supabase.rpc('log_project_expense', {
        p_project_id: selectedProjectId,
        p_account_id: expenseAccountId,
        p_title: expenseTitle,
        p_amount: Number(expenseAmount),
        p_date: expenseDate
      });

      if (rpcErr) throw rpcErr;

      // 3. Bind the receipt URL to the latest expense record if present
      if (uploadedReceiptUrl) {
        const { data: latestExp } = await supabase
          .from('project_expenses')
          .select('id')
          .eq('project_id', selectedProjectId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestExp) {
          await supabase
            .from('project_expenses')
            .update({ receipt_url: uploadedReceiptUrl })
            .eq('id', latestExp.id);
        }
      }

      setMessage({
        text: lang === 'bn' ? 'প্রজেক্ট খরচ এবং ভাউচার সফলভাবে যুক্ত হয়েছে!' : 'Project expense and voucher logged successfully!',
        type: 'success'
      });

      // Reset
      setExpenseTitle('');
      setExpenseAmount('');
      setReceiptFile(null);
      setIsExpenseModalOpen(false);
      loadProjectsData();
      if (onDataChange) onDataChange();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSubmittingExpense(false);
      setUploadingReceipt(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (fromProjId === toProjId) {
      setMessage({
        text: lang === 'bn' ? 'একই প্রজেক্টে ট্রান্সফার করা যাবে না।' : 'Source and target project cannot be identical.',
        type: 'error'
      });
      return;
    }

    setSubmittingTransfer(true);
    try {
      const { error } = await supabase.rpc('transfer_project_budget', {
        p_from_proj: fromProjId,
        p_to_proj: toProjId,
        p_amount: Number(transferAmount),
        p_note: transferNote
      });

      if (error) throw error;

      setMessage({
        text: lang === 'bn' ? 'বাজেট সফলভাবে স্থানান্তর হয়েছে!' : 'Budget transferred successfully!',
        type: 'success'
      });

      setTransferAmount('');
      setTransferNote('');
      setIsTransferModalOpen(false);
      loadProjectsData();
      if (onDataChange) onDataChange();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSubmittingTransfer(false);
    }
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId);
  const activeExpenses = expenses.filter((e) => e.project_id === selectedProjectId);
  const totalSpent = activeExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const budget = Number(activeProject?.budget) || 0;
  const remainingBudget = budget - totalSpent;
  const progressPercent = budget > 0 ? Math.min(Math.round((totalSpent / budget) * 100), 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Alert Notification */}
      {message.text && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
          message.type === 'error' ? 'bg-rose-50 border border-rose-200 text-[#E11D48]' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        }`}>
          {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Header & Quick Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#E11D48]" />
            <span>{lang === 'bn' ? 'প্রজেক্ট ব্যয় ও লেজার' : 'Project Cost Accounting'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' ? 'রসিদ ও ভাউচার ছবি সংযুক্তিসহ প্রজেক্ট খরচ পরিচালনা করুন' : 'Track expenditures, attached vouchers, and inter-project budget shifting'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4 text-[#E11D48]" />
            <span>{lang === 'bn' ? 'বাজেট ট্রান্সফার' : 'Shift Budget'}</span>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            disabled={!selectedProjectId}
            className="py-2.5 px-4 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'খরচ ও ভাউচার যোগ' : 'Log Expense & Receipt'}</span>
          </button>
        </div>
      </div>

      {/* Horizontal Project Switcher */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
        {projects.map((proj) => {
          const isSelected = proj.id === selectedProjectId;
          return (
            <button
              key={proj.id}
              onClick={() => setSelectedProjectId(proj.id)}
              className={`min-w-[190px] p-4 rounded-2xl border text-left transition snap-start cursor-pointer ${
                isSelected
                  ? 'bg-white border-[#E11D48] shadow-md ring-2 ring-rose-100'
                  : 'bg-white border-[#F3D7D9] hover:border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-slate-900 truncate max-w-[120px]">{proj.name}</span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-50 text-[#E11D48] border border-rose-200">
                  {proj.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">Budget: <strong className="text-slate-800 font-mono">{formatBDT(proj.budget, lang)}</strong></p>
            </button>
          );
        })}
      </div>

      {/* Selected Project Status Card */}
      {activeProject && (
        <div className="rounded-3xl bg-white border border-[#F3D7D9] p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#E11D48] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                Active Ledger
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">{activeProject.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{activeProject.description || 'No description provided.'}</p>
            </div>

            <div className="flex items-center gap-4 text-left sm:text-right">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Allocated Budget</span>
                <p className="text-base font-black font-mono text-slate-900">{formatBDT(budget, lang)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Spent</span>
                <p className="text-base font-black font-mono text-[#E11D48]">{formatBDT(totalSpent, lang)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Remaining</span>
                <p className={`text-base font-black font-mono ${remainingBudget >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatBDT(remainingBudget, lang)}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-500">
              <span>Cost Burn</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  progressPercent >= 100 ? 'bg-rose-600' : progressPercent >= 80 ? 'bg-amber-500' : 'bg-[#E11D48]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Expenses History with Receipt Attachment Preview */}
      <div className="bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-xs">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#E11D48]" />
          <span>{lang === 'bn' ? 'প্রজেক্ট খরচ ও রসিদ তালিকা' : 'Expense & Receipt Vouchers'}</span>
        </h4>

        {activeExpenses.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs font-bold">
            No expenses logged for this project yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeExpenses.map((exp) => (
              <div key={exp.id} className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#E11D48] shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{exp.title}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{exp.expense_date}</span>
                      <span>•</span>
                      <span>Wallet: <strong className="text-slate-600">{exp.accounts?.account_name}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Voucher Preview Action */}
                  {exp.receipt_url ? (
                    <button
                      type="button"
                      onClick={() => setPreviewImageUrl(exp.receipt_url)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[#E11D48] text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{lang === 'bn' ? 'ভাউচার দেখুন' : 'View Receipt'}</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">No voucher</span>
                  )}

                  <span className="text-xs font-black font-mono text-[#E11D48]">
                    -{formatBDT(exp.amount, lang)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL 1: LOG EXPENSE & ATTACH RECEIPT --- */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsExpenseModalOpen(false)}
              className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-950 mb-1">
              {lang === 'bn' ? 'প্রজেক্ট খরচ ও রসিদ যোগ করুন' : 'Log Project Expense & Receipt'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Wallet balance will be automatically debited upon recording.
            </p>

            <form onSubmit={handleExpenseSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raw Material Procurement"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Amount (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Deduct From Wallet</label>
                <select
                  required
                  value={expenseAccountId}
                  onChange={(e) => setExpenseAccountId(e.target.value)}
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

              {/* Receipt / Voucher Upload Section */}
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Attach Voucher / Cash Memo Photo
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#F3D7D9] hover:border-[#E11D48] rounded-2xl p-4 text-center cursor-pointer bg-slate-50 transition"
                >
                  <Camera className="w-5 h-5 text-[#E11D48] mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">
                    {receiptFile ? receiptFile.name : 'Click to snap photo or upload receipt'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, or PDF up to 5MB</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingExpense || uploadingReceipt}
                  className="w-full py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {(submittingExpense || uploadingReceipt) && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{uploadingReceipt ? 'Uploading Voucher...' : submittingExpense ? 'Recording...' : 'Submit & Deduct Wallet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: INTER-PROJECT BUDGET SHIFTING --- */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsTransferModalOpen(false)}
              className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-950 mb-1">
              {lang === 'bn' ? 'প্রজেক্ট বাজেট স্থানান্তর' : 'Shift Project Budget'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Reallocate capital from one project to another.</p>

            <form onSubmit={handleTransferSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">From Project</label>
                <select
                  required
                  value={fromProjId}
                  onChange={(e) => setFromProjId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                >
                  <option value="">Select Source Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (Budget: {formatBDT(p.budget, lang)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">To Project</label>
                <select
                  required
                  value={toProjId}
                  onChange={(e) => setToProjId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                >
                  <option value="">Select Target Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (Budget: {formatBDT(p.budget, lang)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Transfer Amount (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Transfer Note</label>
                <input
                  type="text"
                  placeholder="e.g. Budget reallocation"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingTransfer}
                  className="w-full py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/25 transition disabled:opacity-50 cursor-pointer"
                >
                  <span>{submittingTransfer ? 'Transferring...' : 'Confirm Reallocation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: EXPANDED VOUCHER IMAGE PREVIEW --- */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div 
            className="w-full max-w-2xl bg-white rounded-3xl p-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h4 className="text-xs font-black text-slate-900 uppercase">Attached Voucher Memo</h4>
              <button 
                onClick={() => setPreviewImageUrl(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-2xl flex items-center justify-center bg-slate-50">
              <img src={previewImageUrl} alt="Voucher" className="max-w-full max-h-[70vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
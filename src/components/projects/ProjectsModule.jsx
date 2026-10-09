import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import { 
  Briefcase, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  DollarSign, 
  Layers, 
  X,
  Camera,
  Trash2,
  Calendar
} from 'lucide-react';

export default function ProjectsModule({ onDataChange }) {
  const { user } = useAuth();
  const { lang } = useLang();

  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);

  // Create / Edit Project Modal
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projName, setProjName] = useState('');
  const [projBudget, setProjBudget] = useState('');
  const [projDesc, setProjDesc] = useState('');

  // Add Expense to Project Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedProjForExp, setSelectedProjForExp] = useState(null);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expAccountId, setExpAccountId] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().substring(0, 10));

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const { data: pData } = await supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (pData) setProjects(pData);

      const { data: eData } = await supabase.from('project_expenses').select('*').eq('user_id', user.id);
      if (eData) setExpenses(eData);

      const { data: aData } = await supabase.from('accounts').select('*').eq('user_id', user.id);
      if (aData) {
        setAccounts(aData);
        if (aData.length > 0 && !expAccountId) setExpAccountId(aData[0].id);
      }
    } catch (err) {
      console.error('Error fetching projects data:', err);
    }
  };

  const handleOpenCreateProject = () => {
    setEditingProject(null);
    setProjName('');
    setProjBudget('');
    setProjDesc('');
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (proj) => {
    setEditingProject(proj);
    setProjName(proj.name);
    setProjBudget(proj.budget);
    setProjDesc(proj.description || '');
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!projName || !projBudget) return;

    try {
      if (editingProject) {
        // Update
        await supabase
          .from('projects')
          .update({
            name: projName,
            budget: parseFloat(projBudget),
            description: projDesc
          })
          .eq('id', editingProject.id)
          .eq('user_id', user.id);
      } else {
        // Create
        await supabase
          .from('projects')
          .insert([{
            user_id: user.id,
            name: projName,
            budget: parseFloat(projBudget),
            description: projDesc,
            status: 'active'
          }]);
      }

      setIsProjectModalOpen(false);
      loadData();
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error('Error saving project:', err);
    }
  };

  const handleSaveProjectExpense = async (e) => {
    e.preventDefault();
    if (!expTitle || !expAmount || !expAccountId || !selectedProjForExp) return;

    try {
      const amount = parseFloat(expAmount);
      const selectedAcc = accounts.find(a => a.id === expAccountId);

      if (Number(selectedAcc?.balance || 0) < amount) {
        alert(lang === 'bn' ? 'অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই!' : 'Insufficient balance in wallet!');
        return;
      }

      // Deduct Account
      await supabase
        .from('accounts')
        .update({ balance: Number(selectedAcc.balance) - amount })
        .eq('id', expAccountId);

      // Insert Project Expense
      await supabase
        .from('project_expenses')
        .insert([{
          project_id: selectedProjForExp.id,
          account_id: expAccountId,
          user_id: user.id,
          title: expTitle,
          amount: amount,
          expense_date: expDate
        }]);

      // Insert Ledger Transaction
      await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          account_id: expAccountId,
          project_id: selectedProjForExp.id,
          type: 'project_expense',
          amount: amount,
          category: 'Project Expense',
          notes: `${selectedProjForExp.name}: ${expTitle}`,
          transaction_date: expDate
        }]);

      setIsExpenseModalOpen(false);
      setExpTitle('');
      setExpAmount('');
      loadData();
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error('Error saving expense:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#E11D48] px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200">
            Project Ledgers
          </span>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            {lang === 'bn' ? 'প্রজেক্ট ও খরচ নিয়ন্ত্রণ' : 'Projects Cost & Budgeting'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' ? 'নতুন প্রজেক্ট তৈরি, বাজেট নির্ধারণ ও খরচ এন্ট্রি করুন' : 'Track client projects, budget utilization, and direct expenses'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateProject}
          className="py-2.5 px-4 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'bn' ? 'নতুন প্রজেক্ট তৈরি' : '+ Create Project'}</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.map((proj) => {
          const projExp = expenses.filter(e => e.project_id === proj.id);
          const totalSpent = projExp.reduce((s, e) => s + Number(e.amount), 0);
          const budget = Number(proj.budget);
          const percent = budget > 0 ? Math.min(Math.round((totalSpent / budget) * 100), 100) : 0;

          return (
            <div key={proj.id} className="rounded-3xl bg-white border border-[#F3D7D9] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-black text-slate-900">{proj.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{proj.description || 'No description'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenEditProject(proj)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                    title="Edit Budget/Info"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Spent: <strong className="text-[#E11D48] font-mono">{formatBDT(totalSpent, lang)}</strong></span>
                    <span>Budget: <strong className="text-slate-900 font-mono">{formatBDT(budget, lang)}</strong></span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#E11D48] rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 font-mono">{percent}% utilized</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProjForExp(proj);
                    setIsExpenseModalOpen(true);
                  }}
                  className="py-2 px-3.5 bg-rose-50 hover:bg-[#E11D48] text-[#E11D48] hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'খরচ যোগ করুন' : 'Record Expense'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT PROJECT MODAL */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsProjectModalOpen(false)}
              className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900 mb-1">
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Set allocated budget and project parameters.</p>

            <form onSubmit={handleSaveProject} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Uttara Commercial Site"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Allocated Budget (৳ BDT)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={projBudget}
                  onChange={(e) => setProjBudget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Client details or scope"
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#E11D48] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900 mb-1">Record Project Expense</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedProjForExp?.name}</p>

            <form onSubmit={handleSaveProjectExpense} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cement Procurement"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Amount (৳ BDT)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Deduct Wallet</label>
                <select
                  value={expAccountId}
                  onChange={(e) => setExpAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name} ({formatBDT(a.balance, lang)})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#E11D48] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Confirm Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
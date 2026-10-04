import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { formatBDT } from '../../utils/currency';
import NewProjectModal from './NewProjectModal';
import AddExpenseModal from './AddExpenseModal';
import { 
  Briefcase, 
  Plus, 
  Receipt, 
  AlertTriangle 
} from 'lucide-react';

export default function ProjectsModule({ onDataChange }) {
  const { user } = useAuth();
  const { lang } = useLang();

  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [selectedProjectForExpense, setSelectedProjectForExpense] = useState(null);

  useEffect(() => {
    if (user) fetchProjectData();
  }, [user]);

  const fetchProjectData = async () => {
    setLoading(true);
    const { data: projData } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const { data: expData } = await supabase
      .from('project_expenses')
      .select('*')
      .eq('user_id', user.id);

    if (projData) setProjects(projData);
    if (expData) setExpenses(expData);
    setLoading(false);
  };

  const handleRefresh = () => {
    fetchProjectData();
    if (onDataChange) onDataChange();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs">
        <div>
          <h3 className="text-lg font-black text-slate-900 leading-tight">
            {lang === 'bn' ? 'প্রজেক্ট বাজেট ও লেজার' : 'Project Ledger & Budgets'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' ? 'বাজেট সিলিং মনিটরিং ও রিয়েল-টাইম খরচ ট্র্যাকার' : 'Monitor budget ceilings & live account balance deductions'}
          </p>
        </div>

        <button
          onClick={() => setIsNewProjectOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs md:text-sm shadow-md shadow-indigo-500/25 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'bn' ? 'নতুন প্রজেক্ট' : 'New Project'}</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 rounded-3xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200/80 rounded-3xl shadow-xs">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">
            {lang === 'bn' ? 'কোনো প্রজেক্ট তৈরি করা হয়নি' : 'No Projects Found'}
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {lang === 'bn' ? 'নতুন প্রজেক্ট তৈরি করে বাজেট নির্ধারণ করুন এবং খরচ ট্র্যাক করুন।' : 'Create a project to allocate BDT budgets and log expenses directly.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((proj) => {
            const projExpenses = expenses.filter((e) => e.project_id === proj.id);
            const totalSpent = projExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
            const budget = Number(proj.budget);
            const remaining = budget - totalSpent;
            const percentUsed = budget > 0 ? Math.min(Math.round((totalSpent / budget) * 100), 100) : 0;
            const isOverBudget = budget > 0 && totalSpent > budget;

            return (
              <div
                key={proj.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="text-base font-black text-slate-900 leading-snug">{proj.name}</h4>
                      {proj.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{proj.description}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {proj.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Budget</p>
                      <p className="text-xs font-black text-slate-800 font-mono mt-0.5">{formatBDT(budget, lang)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Spent</p>
                      <p className="text-xs font-black text-rose-600 font-mono mt-0.5">{formatBDT(totalSpent, lang)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Remaining</p>
                      <p className={`text-xs font-black font-mono mt-0.5 ${remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatBDT(remaining, lang)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-slate-500">{percentUsed}% Allocated</span>
                      {isOverBudget && (
                        <span className="text-rose-600 flex items-center gap-1 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" /> Over Budget!
                        </span>
                      )}
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverBudget
                            ? 'bg-rose-500'
                            : percentUsed > 80
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${percentUsed}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    {projExpenses.length} {lang === 'bn' ? 'টি খরচ এন্ট্রি' : 'Expenses recorded'}
                  </span>
                  <button
                    onClick={() => setSelectedProjectForExpense(proj)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-bold transition"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'খরচ যোগ করুন' : 'Add Expense'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onProjectCreated={handleRefresh}
      />

      {selectedProjectForExpense && (
        <AddExpenseModal
          isOpen={!!selectedProjectForExpense}
          onClose={() => setSelectedProjectForExpense(null)}
          projectId={selectedProjectForExpense.id}
          projectName={selectedProjectForExpense.name}
          onExpenseAdded={handleRefresh}
        />
      )}
    </div>
  );
}
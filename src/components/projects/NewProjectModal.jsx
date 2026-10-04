import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { X, Briefcase, Plus, AlertCircle } from 'lucide-react';

export default function NewProjectModal({ isOpen, onClose, onProjectCreated }) {
  const { user } = useAuth();
  const { lang } = useLang();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const numBudget = parseFloat(budget) || 0;

    const { error } = await supabase.from('projects').insert({
      user_id: user.id,
      name: name.trim(),
      description: description.trim() || null,
      budget: numBudget,
      status: 'active'
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setName('');
      setDescription('');
      setBudget('');
      onProjectCreated();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#F1EDEC] border border-[#EED8C7] rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#F36259] text-white flex items-center justify-center shadow-md">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {lang === 'bn' ? 'নতুন প্রজেক্ট তৈরি করুন' : 'Create New Project'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {lang === 'bn' ? 'বাজেট সিলিং ও খরচের হিসাব নির্ধারণ' : 'Set BDT budget & track real-time expenses'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-[#F36259] text-xs rounded-xl font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              {lang === 'bn' ? 'প্রজেক্টের নাম' : 'Project Title'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. October-2026"
              className="w-full px-3 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#F36259]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              {lang === 'bn' ? 'বিবরণ (ঐচ্ছিক)' : 'Description (Optional)'}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Scope, targets or project notes"
              className="w-full px-3 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F36259]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              {lang === 'bn' ? 'বাজেট সিলিং (BDT ৳)' : 'Budget Ceiling (BDT ৳)'}
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-white border border-[#EED8C7] rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-[#F36259]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#F36259] hover:bg-[#e0534b] text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
          >
            {loading ? (lang === 'bn' ? 'তৈরি হচ্ছে...' : 'Creating...') : (lang === 'bn' ? '+ প্রজেক্ট নিশ্চিত করুন' : '+ Confirm Project')}
          </button>
        </form>
      </div>
    </div>
  );
}
import React from 'react';
import { useLang } from '../../context/LangContext';
import { 
  LayoutDashboard, 
  Wallet, 
  Briefcase, 
  HandCoins, 
  BarChart3, 
  FileSpreadsheet,
  HeadphonesIcon
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onOpenContact }) {
  const { t, lang } = useLang();

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'accounts', label: t('accounts'), icon: Wallet },
    { id: 'projects', label: t('projects'), icon: Briefcase },
    { id: 'debts', label: t('debts'), icon: HandCoins },
    { id: 'analytics', label: t('analytics'), icon: BarChart3 },
    { id: 'statements', label: t('statements'), icon: FileSpreadsheet },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 bg-white border-r border-slate-200/80 p-4 min-h-[calc(100vh-65px)]">
      <div className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-600 border border-indigo-100 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Side Menu Contact Support Button */}
      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={onOpenContact}
          className="flex items-center justify-between w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100/80 hover:border-indigo-300 text-indigo-900 transition shadow-xs group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <HeadphonesIcon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition">
                {lang === 'bn' ? 'যোগাযোগ করুন' : 'Contact Us'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">KOFS Support</p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      </div>
    </aside>
  );
}
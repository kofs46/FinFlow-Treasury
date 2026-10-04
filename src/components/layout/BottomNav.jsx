import React from 'react';
import { useLang } from '../../context/LangContext';
import { 
  LayoutDashboard, 
  Wallet, 
  Briefcase, 
  HandCoins, 
  BarChart3,
  FileSpreadsheet
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const { t } = useLang();

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'accounts', label: t('accounts'), icon: Wallet },
    { id: 'projects', label: t('projects'), icon: Briefcase },
    { id: 'debts', label: t('debts'), icon: HandCoins },
    { id: 'statements', label: t('statements'), icon: FileSpreadsheet },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                isActive
                  ? 'text-indigo-600 font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1 rounded-xl transition ${isActive ? 'bg-indigo-50' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 max-w-[60px] truncate">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
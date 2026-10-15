import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Plus, 
  FolderGit2, 
  FileSpreadsheet 
} from 'lucide-react';

export default function BottomNav({ 
  activeTab, 
  setActiveTab, 
  onOpenAddTx 
}) {
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'accounts', label: 'Vaults', icon: Wallet },
    { key: 'add', label: 'Add', icon: Plus, isAction: true },
    { key: 'projects', label: 'Projects', icon: FolderGit2 },
    { key: 'statements', label: 'Audit', icon: FileSpreadsheet },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 px-3 py-2 pointer-events-none flex justify-center select-none print:hidden md:hidden">
      <nav className="pointer-events-auto bg-white/95 backdrop-blur-md border border-[#F3D7D9] shadow-xl shadow-rose-950/10 rounded-2xl px-3 py-1.5 flex items-center justify-around gap-1 w-full max-w-md transition-all">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;

          if (item.isAction) {
            return (
              <button
                key={item.key}
                type="button"
                onClick={onOpenAddTx}
                className="relative -top-2 flex flex-col items-center justify-center p-3 rounded-full bg-[#E11D48] hover:bg-[#BE123C] text-white shadow-lg shadow-rose-600/30 active:scale-95 transition cursor-pointer"
                title="Add New Transaction"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
            );
          }

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`flex-1 py-1 px-2 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition active:scale-95 cursor-pointer ${
                isActive
                  ? 'text-[#E11D48] bg-rose-50/70'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
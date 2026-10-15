import React from 'react';
import { 
  X, 
  LayoutDashboard, 
  Wallet, 
  FolderKanban, 
  HandCoins, 
  Scale, 
  BarChart3, 
  ReceiptText,
  UserCheck,
  LifeBuoy,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SidebarDrawer({ 
  isOpen, 
  onClose, 
  activeTab, 
  onSelectTab,
  onOpenProfile,
  onOpenSupport
}) {
  const { signOut } = useAuth();

  if (!isOpen) return null;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts & Vaults', icon: Wallet },
    { id: 'projects', label: 'Projects & Costs', icon: FolderKanban },
    { id: 'debts', label: 'Debts & Loans', icon: HandCoins },
    { id: 'reconcile', label: 'Audit & Compliance', icon: Scale },
    { id: 'analytics', label: 'Financial Analytics', icon: BarChart3 },
    { id: 'statements', label: 'Statements Ledger', icon: ReceiptText },
  ];

  return (
    <div className="fixed inset-0 z-50 flex select-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-76 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-[#F3D7D9]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 p-1 flex items-center justify-center shadow-xs">
              <img src="/logo.png" alt="FinFlow Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-sm font-black text-slate-900">FinFlow</span>
                <span className="text-[8px] font-black uppercase tracking-wider bg-rose-100 text-[#E11D48] px-1 py-0.5 rounded">
                  TREASURY
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold mt-0.5">Enterprise Navigation</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Modules */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1 block">
            Workspace Modules
          </span>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive 
                    ? 'bg-[#E11D48] text-white shadow-sm shadow-rose-950/15' 
                    : 'text-slate-600 hover:bg-rose-50/60 hover:text-[#E11D48]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer / Profile Settings, Support & Clean Sign Out */}
        <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/40">
          
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenProfile) onOpenProfile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-[#E11D48] transition cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-slate-400" />
            <span>Profile Settings</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenSupport) onOpenSupport();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-[#E11D48] transition cursor-pointer"
          >
            <LifeBuoy className="w-4 h-4 text-slate-400" />
            <span>Help & Support</span>
          </button>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-[#E11D48] bg-rose-50/80 hover:bg-rose-100 transition cursor-pointer border border-rose-200/60"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
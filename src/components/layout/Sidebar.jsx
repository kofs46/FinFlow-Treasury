import React from 'react';
import { 
  X, 
  LayoutDashboard, 
  Wallet, 
  FolderKanban, 
  HandCoins, 
  BarChart3, 
  ReceiptText, 
  UserCheck, 
  LifeBuoy, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

export default function SidebarDrawer({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onOpenProfile,
  onOpenSupport
}) {
  const { signOut } = useAuth();
  const { t } = useLang();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts & Vaults', icon: Wallet },
    { id: 'projects', label: 'Projects & Costs', icon: FolderKanban },
    { id: 'debts', label: 'Debts & Loans', icon: HandCoins },
    { id: 'analytics', label: 'Analytics & Insights', icon: BarChart3 },
    { id: 'statements', label: 'Statements Ledger', icon: ReceiptText }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex select-none">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col justify-between p-6 border-r border-[#F3D7D9] z-10 animate-in slide-in-from-left duration-200">
        
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 p-1.5 flex items-center justify-center">
                <img src="/logo.png" alt="FinFlow Logo" className="w-full h-full object-contain" />
              </div>
              <div className="leading-tight">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">FinFlow Treasury</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enterprise ERP</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="mt-6 space-y-1.5">
            {navigationItems.map((item) => {
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
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-black transition cursor-pointer ${
                    isActive
                      ? 'bg-[#E11D48] text-white shadow-md shadow-rose-950/15'
                      : 'text-slate-600 hover:bg-rose-50/60 hover:text-[#E11D48]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-slate-100 space-y-1.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenProfile();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-slate-400" />
            <span>Profile & Security</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSupport();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <LifeBuoy className="w-4 h-4 text-slate-400" />
            <span>Help Desk</span>
          </button>

          <button
            type="button"
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#E11D48] hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  );
}
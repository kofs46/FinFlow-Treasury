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

  // Audit & Compliance module-ti list theke shompurno shoriye dewa hoyeche
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts & Vaults', icon: Wallet },
    { id: 'projects', label: 'Projects & Costs', icon: FolderKanban },
    { id: 'debts', label: 'Debts & Loans', icon: HandCoins },
    { id: 'analytics', label: 'Financial Analytics', icon: BarChart3 },
    { id: 'statements', label: 'Statements Ledger', icon: ReceiptText }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex select-none font-sans">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Drawer Sidebar */}
      <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between p-5 border-r border-[#F3D7D9] z-10 animate-in slide-in-from-left duration-200">
        
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 p-1 flex items-center justify-center">
                <img src="/logo.png" alt="FinFlow Logo" className="w-full h-full object-contain" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-slate-950">FinFlow</span>
                  <span className="text-[8px] font-black uppercase tracking-wider bg-rose-100 text-[#E11D48] px-1 py-0.5 rounded">
                    TREASURY
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  Enterprise Navigation
                </p>
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

          {/* Section Title */}
          <div className="mt-5 mb-2 px-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              WORKSPACE MODULES
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-[#E11D48] text-white shadow-md shadow-rose-900/15'
                      : 'text-slate-600 hover:bg-rose-50/70 hover:text-[#E11D48]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-100 space-y-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenProfile();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-slate-400" />
            <span>Profile Settings</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSupport();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <LifeBuoy className="w-4 h-4 text-slate-400" />
            <span>Help & Support</span>
          </button>

          <button
            type="button"
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 mt-2 px-3 py-2 rounded-xl text-xs font-bold text-[#E11D48] bg-rose-50/70 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  );
}
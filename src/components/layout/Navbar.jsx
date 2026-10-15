import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../common/NotificationDropdown';
import { 
  Menu, 
  X, 
  Cloud, 
  Plus, 
  Headphones, 
  LogOut, 
  ChevronDown,
  LayoutDashboard,
  Wallet,
  FolderGit2,
  Receipt,
  FileSpreadsheet,
  BarChart3,
  Scale
} from 'lucide-react';

export default function Navbar({ 
  activeTab,
  onNavigateTab, 
  onNavigateHome,
  onOpenAddTx,
  onOpenDriveSync,
  onOpenContact, 
  onOpenProfile
}) {
  const { user, profile, signOut } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const displayName = profile?.full_name?.trim() || user?.email?.split('@')[0] || 'User';

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'accounts', label: 'Accounts & Wallets', icon: Wallet },
    { key: 'projects', label: 'Projects Ledger', icon: FolderGit2 },
    { key: 'debts', label: 'Debts & Lending', icon: Receipt },
    { key: 'reconcile', label: 'Tax & Compliance', icon: Scale },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'statements', label: 'Statements & Audit', icon: FileSpreadsheet },
  ];

  const handleSelectTab = (key) => {
    if (onNavigateTab) onNavigateTab(key);
    setIsDrawerOpen(false);
  };

  return (
    <>
      <header className="w-full bg-white h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 select-none border-b border-slate-100 relative z-30 shadow-xs">
        
        {/* HAMBURGER MENU & BRAND */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-[#E11D48] transition cursor-pointer active:scale-95 shadow-xs flex items-center gap-2"
            title="Open Main Navigation Menu"
          >
            <Menu className="w-5 h-5 text-[#E11D48]" />
            <span className="text-xs font-black tracking-tight hidden sm:inline text-slate-800">Menu</span>
          </button>

          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 text-left cursor-pointer hover:opacity-90 transition focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1 shadow-xs border border-[#F3D7D9] overflow-hidden">
              <img 
                src="/logo.png" 
                alt="FinFlow" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-base font-black tracking-tight text-slate-900">
                  FinFlow
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-[#E11D48] text-[9px] font-black uppercase tracking-wider border border-rose-200">
                  Treasury
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                Liquidity Management
              </p>
            </div>
          </button>
        </div>

        {/* NOTIFICATIONS & PROFILE */}
        <div className="flex items-center gap-3">
          <NotificationDropdown onNavigateTab={onNavigateTab} />

          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition group cursor-pointer active:scale-95 shrink-0"
            title="Account Profile"
          >
            <div className="w-7 h-7 rounded-full bg-[#E11D48] text-white flex items-center justify-center text-xs font-black shadow-xs overflow-hidden shrink-0">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <span className="hidden sm:inline text-xs font-bold text-slate-800 group-hover:text-[#E11D48] max-w-[110px] truncate">
              {displayName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#E11D48] shrink-0" />
          </button>
        </div>
      </header>

      {/* SLIDE-OUT MENU DRAWER */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="relative w-72 sm:w-80 bg-white h-full shadow-2xl flex flex-col justify-between border-r border-[#F3D7D9] z-50 animate-in slide-in-from-left duration-200">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white border border-[#F3D7D9] flex items-center justify-center p-1">
                  <img src="/logo.png" alt="FinFlow" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">FinFlow Menu</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Main Navigation</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 block mb-1">
                Modules
              </span>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSelectTab(item.key)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                      isActive 
                        ? 'bg-[#E11D48] text-white shadow-md shadow-rose-950/10' 
                        : 'text-slate-600 hover:bg-rose-50/70 hover:text-[#E11D48]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="pt-4 mt-3 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 block mb-1">
                  Actions & Cloud
                </span>

                {onOpenAddTx && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAddTx();
                      setIsDrawerOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-rose-50 text-[#E11D48] text-xs font-bold hover:bg-[#E11D48] hover:text-white transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Transaction</span>
                  </button>
                )}

                {onOpenDriveSync && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenDriveSync();
                      setIsDrawerOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>Google Drive Auto-Sync</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  if (onOpenContact) onOpenContact();
                  setIsDrawerOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-[#E11D48] transition text-xs font-semibold cursor-pointer"
              >
                <Headphones className="w-4 h-4 text-slate-400" />
                <span>Help & Support</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  signOut();
                }}
                className="w-full py-2 flex items-center justify-center gap-2 rounded-xl text-rose-600 hover:bg-rose-100/60 text-xs font-bold transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
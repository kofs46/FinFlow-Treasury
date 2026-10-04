import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import ProfileModal from '../common/ProfileModal';
import { 
  LogOut, 
  Globe, 
  User, 
  Menu, 
  X, 
  LayoutDashboard, 
  Wallet, 
  Briefcase, 
  HandCoins, 
  BarChart3, 
  FileSpreadsheet, 
  HeadphonesIcon 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenContact }) {
  const { user, profile, signOut } = useAuth();
  const { lang, toggleLang, t } = useLang();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'accounts', label: t('accounts'), icon: Wallet },
    { id: 'projects', label: t('projects'), icon: Briefcase },
    { id: 'debts', label: t('debts'), icon: HandCoins },
    { id: 'analytics', label: t('analytics'), icon: BarChart3 },
    { id: 'statements', label: t('statements'), icon: FileSpreadsheet },
  ];

  const handleMobileNavClick = (id) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        {/* Left: Mobile Menu Button & Brand */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 text-white font-black text-lg shadow-sm">
            ৳
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight tracking-tight">
              {t('appTitle')}
            </h1>
            <p className="text-[9px] text-indigo-600 font-bold tracking-wider uppercase">Treasury ERP</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Language Switch */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition border border-slate-200 shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span>{lang === 'bn' ? 'EN' : 'বাং'}</span>
          </button>

          {/* User Profile Avatar & Options */}
          {user && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition text-left"
                title="Profile Settings"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-indigo-500/30 bg-slate-100 flex items-center justify-center shadow-xs">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
              </button>

              <button
                onClick={signOut}
                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition border border-rose-200/60"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Slide Drawer (পূর্ণাঙ্গ ড্রয়ার মেনু) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85%] bg-white h-full shadow-2xl flex flex-col justify-between p-5 border-r border-slate-200 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-base flex items-center justify-center">
                    ৳
                  </div>
                  <span className="font-extrabold text-slate-900 text-base">FinFlow ERP</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu List */}
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMobileNavClick(item.id)}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-2xl text-sm font-semibold transition ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 font-bold border border-indigo-100'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Bottom Support Button */}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onOpenContact) onOpenContact();
                }}
                className="flex items-center justify-between w-full px-3.5 py-3 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-indigo-950 font-bold text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <HeadphonesIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <p className="leading-tight">{lang === 'bn' ? 'যোগাযোগ করুন' : 'Contact Support'}</p>
                    <p className="text-[10px] text-slate-400 font-mono font-normal">KOFS Support</p>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            </div>
          </div>
        </div>
      )}

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}
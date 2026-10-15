import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import NotificationDropdown from '../common/NotificationDropdown';
import { 
  Globe, 
  LogOut, 
  Headphones, 
  ChevronDown,
  Plus,
  Cloud
} from 'lucide-react';

export default function Navbar({ 
  onOpenContact, 
  onOpenProfile, 
  onNavigateHome, 
  onNavigateTab, 
  onOpenAddTx,
  onOpenDriveSync 
}) {
  const { user, profile, signOut } = useAuth();
  const { lang, toggleLang } = useLang();

  const displayName = profile?.full_name?.trim() || user?.email?.split('@')[0] || 'User';

  return (
    <header className="w-full bg-white h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 select-none">
      
      {/* Brand Button with Logo */}
      <button
        type="button"
        onClick={onNavigateHome}
        className="flex items-center gap-3 shrink-0 text-left cursor-pointer hover:opacity-90 active:scale-98 transition focus:outline-none"
        title={lang === 'bn' ? 'Dashboard-e fire jan' : 'Go to Dashboard'}
      >
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-xs border border-[#F3D7D9] shrink-0 overflow-hidden">
          <img 
            src="/logo.png" 
            alt="FinFlow" 
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black tracking-tight text-slate-900">
              FinFlow
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-[#E11D48] text-[9px] font-black uppercase tracking-wider border border-rose-200 shrink-0">
              Treasury
            </span>
          </div>
          <p className="text-[10px] font-medium text-slate-400 -mt-0.5">
            Liquidity Management
          </p>
        </div>
      </button>

      {/* Control Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* 1. GOOGLE DRIVE BACKUP BUTTON (Direct Access) */}
        <button
          type="button"
          onClick={onOpenDriveSync}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-bold transition cursor-pointer shadow-xs"
          title="Google Drive Cloud Auto-Backup"
        >
          <Cloud className="w-4 h-4" />
          <span className="hidden sm:inline">Drive Sync</span>
        </button>

        {/* 2. Quick Add Entry Button */}
        {onOpenAddTx && (
          <button
            type="button"
            onClick={onOpenAddTx}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-[#E11D48] text-[#E11D48] hover:text-white border border-rose-200 text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'Ay / Baye' : 'Entry'}</span>
          </button>
        )}

        {/* Notification Dropdown */}
        <NotificationDropdown onNavigateTab={onNavigateTab} />

        {/* Support Button */}
        <button
          type="button"
          onClick={onOpenContact}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:text-[#E11D48] hover:bg-rose-50/70 border border-slate-200 text-xs font-semibold transition cursor-pointer"
          title={lang === 'bn' ? 'Sohayota' : 'Support'}
        >
          <Headphones className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{lang === 'bn' ? 'Sohayota' : 'Support'}</span>
        </button>

        {/* Language Switcher */}
        <button
          type="button"
          onClick={toggleLang}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:text-[#E11D48] hover:bg-rose-50/70 text-xs font-bold transition font-mono cursor-pointer flex items-center gap-1"
        >
          <Globe className="w-3.5 h-3.5 text-[#E11D48]" />
          <span>{lang === 'bn' ? 'BN' : 'EN'}</span>
        </button>

        {/* User Identity Pill */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition group cursor-pointer active:scale-95 shrink-0"
        >
          <div className="w-7 h-7 rounded-full bg-[#E11D48] text-white flex items-center justify-center text-xs font-black shadow-xs overflow-hidden shrink-0 pointer-events-none">
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
          <span className="hidden sm:inline text-xs font-bold text-slate-800 group-hover:text-[#E11D48] max-w-[120px] truncate pointer-events-none">
            {displayName}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#E11D48] shrink-0 pointer-events-none" />
        </button>

        {/* Sign Out */}
        <button
          type="button"
          onClick={signOut}
          className="p-1.5 rounded-xl text-slate-400 hover:text-[#E11D48] hover:bg-rose-50 transition cursor-pointer shrink-0"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
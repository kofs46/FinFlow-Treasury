import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { 
  Menu as MenuIcon, 
  Bell, 
  Plus, 
  ChevronDown,
  CheckCheck,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
  Volume2,
  Mail,
  Phone,
  Edit2,
  LogOut,
  Search
} from 'lucide-react';

export default function Navbar({ 
  onToggleSidebar, 
  onNavigateHome, 
  onOpenAddTx, 
  onOpenProfile,
  onOpenCommandPalette
}) {
  const { user, signOut } = useAuth();
  
  const [profileData, setProfileData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    phone: user?.user_metadata?.phone || '',
    avatarUrl: ''
  });

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef(null);

  const [permissionGranted, setPermissionGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const loadLiveProfile = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, avatar_url')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfileData({
          fullName: data.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0],
          phone: data.phone || 'No phone recorded',
          avatarUrl: data.avatar_url || ''
        });
      }
    } catch (err) {
      console.warn('Profile fetch warning:', err);
    }
  };

  useEffect(() => {
    loadLiveProfile();

    const handleProfileUpdated = (e) => {
      if (e.detail) {
        setProfileData((prev) => ({
          ...prev,
          fullName: e.detail.full_name || prev.fullName,
          phone: e.detail.phone || prev.phone,
          avatarUrl: e.detail.avatar_url || prev.avatarUrl
        }));
      }
    };

    window.addEventListener('finflow_profile_updated', handleProfileUpdated);
    return () => window.removeEventListener('finflow_profile_updated', handleProfileUpdated);
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const requestPhoneNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPermissionGranted(true);
        new Notification('FinFlow Treasury', {
          body: 'Phone push notifications are now active!',
          icon: '/logo.png'
        });
      }
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
        }
      } catch (err) {
        console.warn('Notification fetch warning:', err);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        const newNotif = payload.new;
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(newNotif.title || 'FinFlow Treasury', {
            body: newNotif.message || 'New financial activity logged in your vault.',
            icon: '/logo.png'
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Could not mark read:', err);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'warning':
      case 'alert':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-600" />;
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Info className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  return (
    <header className="w-full bg-white border-b border-[#F3D7D9] px-4 sm:px-6 py-3 select-none relative z-30">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: 3-Line Hamburger Menu & Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* 3-Line Hamburger Button */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-[#E11D48] transition cursor-pointer shadow-xs active:scale-95 flex items-center justify-center group"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <div className="w-4 h-4 flex flex-col justify-center gap-1">
              <span className="w-4 h-0.5 bg-slate-700 group-hover:bg-[#E11D48] rounded-full transition-colors" />
              <span className="w-3.5 h-0.5 bg-slate-700 group-hover:bg-[#E11D48] rounded-full transition-colors" />
              <span className="w-4 h-0.5 bg-slate-700 group-hover:bg-[#E11D48] rounded-full transition-colors" />
            </div>
          </button>

          {/* Brand Logo & Title */}
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 group cursor-pointer ml-0.5"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 p-1.5 flex items-center justify-center shadow-xs group-hover:scale-105 transition">
              <img 
                src="/logo.png" 
                alt="FinFlow Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-base font-black text-slate-950 tracking-tight">FinFlow</span>
                <span className="text-[9px] font-black uppercase tracking-wider bg-rose-100/70 text-[#E11D48] px-1.5 py-0.5 rounded-md">
                  TREASURY
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Liquidity Management
              </p>
            </div>
          </button>
        </div>

        {/* Right: Actions, Notifications & Profile Hub */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Search Palette Button */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-600 hover:text-[#E11D48] transition cursor-pointer"
            title="Quick Search (Ctrl + K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Add Transaction */}
          <button
            type="button"
            onClick={onOpenAddTx}
            className="hidden md:flex items-center gap-1.5 py-2 px-3.5 bg-[#E11D48] hover:bg-[#BE123C] active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm shadow-rose-950/10 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Transaction</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-600 hover:text-[#E11D48] transition cursor-pointer relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="min-w-4 h-4 px-1 rounded-full bg-[#E11D48] text-[9px] font-black text-white flex items-center justify-center absolute -top-1 -right-1 ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#F3D7D9] rounded-3xl shadow-2xl overflow-hidden z-50">
                <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-[#E11D48] text-[10px] font-black">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-bold text-slate-500 hover:text-[#E11D48] flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>Read all</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsNotifOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {!permissionGranted && (
                  <div className="p-2.5 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-3.5 h-3.5 text-[#E11D48] shrink-0" />
                      <span className="text-[10px] font-bold text-slate-700">
                        Enable phone & push alerts
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={requestPhoneNotificationPermission}
                      className="py-1 px-2 bg-[#E11D48] text-white text-[10px] font-black rounded-lg cursor-pointer"
                    >
                      Enable
                    </button>
                  </div>
                )}

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center text-xs font-medium text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-3.5 transition flex items-start gap-3 hover:bg-slate-50/80 ${
                          !n.is_read ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        <div className="p-1.5 rounded-xl bg-white border border-slate-200 shadow-xs mt-0.5 shrink-0">
                          {getNotifIcon(n.type)}
                        </div>
                        <div className="flex-1 truncate">
                          <p className="text-xs font-black text-slate-900 line-clamp-1">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <span className="text-[9px] font-mono text-slate-400 mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 py-1 pl-1 pr-2.5 rounded-xl bg-slate-50 hover:bg-rose-50/80 border border-slate-200 transition cursor-pointer group shadow-xs active:scale-95"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-rose-200 bg-rose-50 flex items-center justify-center shrink-0">
                {profileData.avatarUrl ? (
                  <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-black uppercase text-[#E11D48]">
                    {user?.email?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <div className="text-left hidden sm:block leading-none">
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#E11D48] transition block truncate max-w-[110px]">
                  {profileData.fullName || 'My Account'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition ml-0.5" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-[#F3D7D9] rounded-3xl shadow-2xl p-4 z-50">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-rose-200 bg-rose-50 flex items-center justify-center shrink-0 shadow-xs">
                    {profileData.avatarUrl ? (
                      <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-base font-black uppercase text-[#E11D48]">
                        {user?.email?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="truncate leading-tight">
                    <h4 className="text-sm font-black text-slate-900 truncate">
                      {profileData.fullName || 'User Profile'}
                    </h4>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#E11D48] bg-rose-50 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                      Treasury Admin
                    </span>
                  </div>
                </div>

                <div className="py-3 space-y-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-xs font-mono text-slate-700 truncate" title={user?.email}>
                      {user?.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 truncate">
                      {profileData.phone || 'No phone set'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-[#E11D48] text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200/70"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile & Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#E11D48] text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
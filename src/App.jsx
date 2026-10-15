import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './context/AuthContext';
import { useLang } from './context/LangContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import OverviewCards from './components/dashboard/OverviewCards';
import AccountsModule from './components/accounts/AccountsModule';
import ProjectsModule from './components/projects/ProjectsModule';
import DebtsModule from './components/debts/DebtsModule';
import ComplianceModule from './components/compliance/ComplianceModule';
import AnalyticsModule from './components/analytics/AnalyticsModule';
import StatementsModule from './components/statements/StatementsModule';
import AddAccountModal from './components/accounts/AddAccountModal';
import TransferModal from './components/accounts/TransferModal';
import AddTransactionModal from './components/statements/AddTransactionModal';
import ContactModal from './components/common/ContactModal';
import ProfileModal from './components/common/ProfileModal';
import DriveBackupModal from './components/common/DriveBackupModal';
import { silentSyncToDrive } from './services/googleDriveSilentSync';
import { 
  Shield, 
  KeyRound, 
  Mail, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  CheckCircle2,
  Plus
} from 'lucide-react';

export default function App() {
  const { user, loading, signIn, signUp } = useAuth();
  const { t, lang } = useLang();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modals
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Global State Refresh
  const [refreshKey, setRefreshKey] = useState(0);
  const handleDataRefresh = () => setRefreshKey((prev) => prev + 1);

  // Auth States
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Full Treasury Data State for Google Drive Silent Auto-Backup
  const [currentTreasuryPayload, setCurrentTreasuryPayload] = useState(null);

  useEffect(() => {
    if (user) {
      loadFullDataForBackup();
    }
  }, [user, refreshKey]);

  const loadFullDataForBackup = async () => {
    try {
      const [{ data: acc }, { data: tx }, { data: debts }, { data: proj }] = await Promise.all([
        supabase.from('accounts').select('*').eq('user_id', user.id),
        supabase.from('transactions').select('*').eq('user_id', user.id),
        supabase.from('debts').select('*').eq('user_id', user.id),
        supabase.from('projects').select('*').eq('user_id', user.id)
      ]);

      const payload = {
        accounts: acc || [],
        transactions: tx || [],
        debts: debts || [],
        projects: proj || [],
        syncedAt: new Date().toISOString()
      };

      setCurrentTreasuryPayload(payload);

      // Silent Auto-Sync Check (WhatsApp-er moto nirdishto din por por background-e sync)
      const isConnected = localStorage.getItem('gdrive_connected') === 'true';
      const lastSyncStr = localStorage.getItem('gdrive_last_sync');
      const freqDays = parseInt(localStorage.getItem('gdrive_sync_freq') || '3', 10);

      if (isConnected) {
        let shouldSync = false;
        if (!lastSyncStr) {
          shouldSync = true;
        } else {
          const daysSince = (new Date() - new Date(lastSyncStr)) / (1000 * 60 * 60 * 24);
          if (daysSince >= freqDays) shouldSync = true;
        }

        if (shouldSync) {
          silentSyncToDrive(payload).then((res) => {
            if (res.success) {
              console.log('[FinFlow] Silent periodic backup auto-saved to Google Drive.');
            }
          });
        }
      }
    } catch (err) {
      console.error('Error fetching backup snapshot:', err);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    if (authMode === 'register') {
      if (password !== confirmPassword) {
        setErrorMsg(lang === 'bn' ? 'পাসওয়ার্ড দুটি মেলেনি।' : 'Passwords do not match.');
        setSubmitting(false);
        return;
      }
      if (recoveryPin.length !== 6 || isNaN(recoveryPin)) {
        setErrorMsg(lang === 'bn' ? 'সিকিউরিটি পিন অবশ্যই ৬ ডিজিটের হতে হবে।' : 'Security PIN must be exactly 6 digits.');
        setSubmitting(false);
        return;
      }
      const res = await signUp(email, password, fullName, recoveryPin);
      if (res?.error) {
        setErrorMsg(res.error.message);
      } else {
        setSuccessMsg(
          lang === 'bn' 
            ? 'অ্যাকাউন্ট তৈরি সফল হয়েছে! অনুগ্রহ করে ইমেইল কনফার্ম করুন।' 
            : 'Registration successful! Please confirm your email.'
        );
        setTimeout(() => setAuthMode('login'), 3500);
      }
    } else if (authMode === 'login') {
      const res = await signIn(email, password);
      if (res?.error) {
        setErrorMsg(res.error.message);
      }
    }
    setSubmitting(false);
  };

  const handlePinReset = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('id, recovery_pin')
        .eq('recovery_pin', recoveryPin)
        .single();

      if (profileErr || !profileData) {
        setErrorMsg(lang === 'bn' ? 'ভুল ৬ ডিজিট রিকভারি পিন।' : 'Invalid 6-digit recovery PIN.');
        setSubmitting(false);
        return;
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateErr) {
        setErrorMsg(updateErr.message);
      } else {
        setSuccessMsg(lang === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' : 'Password reset successfully!');
        setTimeout(() => {
          setAuthMode('login');
          setSuccessMsg('');
          setPassword('');
          setNewPassword('');
          setRecoveryPin('');
        }, 2000);
      }
    } catch (err) {
      setErrorMsg(lang === 'bn' ? 'অনুরোধটি সম্পন্ন করা যায়নি।' : 'Error processing request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAFAFA] text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white p-2.5 shadow-md border border-[#F3D7D9] flex items-center justify-center animate-pulse">
            <img src="/logo.png" alt="FinFlow Logo" className="w-full h-full object-contain" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
            Loading FinFlow Treasury...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-rose-50/60 via-[#FAFAFA] to-orange-50/40 px-4 py-10 text-slate-900 overflow-x-hidden">
        <div className="w-full max-w-md rounded-3xl bg-white border border-[#F3D7D9] p-6 sm:p-8 shadow-2xl shadow-rose-900/10">
          
          {/* LOGIN HERO BRAND LOGO WITH PNG */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white mb-3 shadow-md shadow-rose-900/10 ring-4 ring-rose-100 border border-[#F3D7D9]">
              <img 
                src="/logo.png" 
                alt="FinFlow Treasury Logo" 
                className="w-14 h-14 object-contain"
              />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              {authMode === 'login' && 'Sign In'}
              {authMode === 'register' && 'Create Account'}
              {authMode === 'forgot' && 'PIN Recovery'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">FinFlow Enterprise Treasury & Liquidity Terminal</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-[#E11D48] text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {authMode !== 'forgot' ? (
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Monirul Islam"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-[#F3D7D9] rounded-xl text-sm focus:outline-none focus:border-[#E11D48] text-slate-900 transition font-medium"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-[#F3D7D9] rounded-xl text-sm focus:outline-none focus:border-[#E11D48] text-slate-900 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-[11px] font-bold text-[#E11D48] hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-[#F3D7D9] rounded-xl text-sm focus:outline-none focus:border-[#E11D48] text-slate-900 transition font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Confirm Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-[#F3D7D9] rounded-xl text-sm focus:outline-none focus:border-[#E11D48] text-slate-900 transition font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">6-Digit Recovery PIN</label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-3 w-4 h-4 text-rose-500" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={recoveryPin}
                        onChange={(e) => setRecoveryPin(e.target.value)}
                        placeholder="123456"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-[#F3D7D9] rounded-xl text-sm focus:outline-none focus:border-[#E11D48] text-slate-900 font-mono tracking-widest transition"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3.5 px-4 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-rose-500/25 active:scale-98 cursor-pointer"
              >
                <span>{submitting ? 'Authenticating...' : authMode === 'login' ? 'Sign In to Terminal' : 'Create System Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handlePinReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">6-Digit Recovery PIN</label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-3 w-4 h-4 text-rose-500" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={recoveryPin}
                    onChange={(e) => setRecoveryPin(e.target.value)}
                    placeholder="Enter 6-digit PIN"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-[#F3D7D9] rounded-xl text-sm focus:outline-none focus:border-[#E11D48] text-slate-900 font-mono tracking-widest transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-[#F3D7D9] rounded-xl text-sm transition font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 px-4 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold rounded-xl text-sm shadow-md transition cursor-pointer"
              >
                <span>{submitting ? 'Resetting...' : 'Reset Password'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="w-full py-2 flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </button>
            </form>
          )}

          {authMode !== 'forgot' && (
            <div className="mt-6 text-center border-t border-slate-100 pt-4">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-xs font-bold text-[#E11D48] hover:underline cursor-pointer"
              >
                {authMode === 'login' ? "Don't have an account? Sign Up" : 'Already registered? Sign In'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#FAFAFA] text-slate-900 flex flex-col font-sans overflow-hidden">
      
      {/* 1. TOP NAVBAR - PERMANENTLY FIXED & NEVER VANISHES */}
      <div className="w-full shrink-0 z-50 bg-white border-b border-[#F3D7D9] print:hidden">
        <Navbar 
          onOpenContact={() => setIsContactOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onNavigateHome={() => setActiveTab('dashboard')}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onOpenAddTx={() => setIsAddTxOpen(true)}
          onOpenDriveSync={() => setIsDriveModalOpen(true)}
        />
      </div>

      {/* 2. BODY SPLIT AREA */}
      <div className="flex flex-1 w-full overflow-hidden">
        
        {/* SIDEBAR */}
        <div className="print:hidden shrink-0 h-full">
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onOpenContact={() => setIsContactOpen(true)}
          />
        </div>

        {/* SCROLLABLE MAIN CANVAS */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 print:p-0 print:m-0 print:overflow-visible">
          
          <div className="flex items-center justify-between mb-6 print:hidden">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight">
                {t(activeTab)}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                {t('subTitle')}
              </p>
            </div>

            {/* Quick Action Dock */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddTxOpen(true)}
                className="py-2 px-3.5 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'bn' ? 'লেনদেন যোগ করুন' : '+ Add Transaction'}</span>
              </button>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <OverviewCards 
              onOpenTransfer={() => setIsTransferOpen(true)} 
              onOpenAddAccount={() => setIsAddAccountOpen(true)} 
              refreshTrigger={refreshKey}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsModule 
              onOpenAddAccount={() => setIsAddAccountOpen(true)}
              onOpenTransfer={() => setIsTransferOpen(true)}
              refreshTrigger={refreshKey}
              onDataChange={handleDataRefresh}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsModule onDataChange={handleDataRefresh} />
          )}

          {activeTab === 'debts' && (
            <DebtsModule onDataChange={handleDataRefresh} />
          )}

          {activeTab === 'reconcile' && (
            <ComplianceModule onDataChange={handleDataRefresh} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsModule />
          )}

          {activeTab === 'statements' && (
            <StatementsModule onDataChange={handleDataRefresh} />
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="w-full shrink-0 print:hidden md:hidden z-40 bg-white border-t border-[#F3D7D9]">
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* GLOBAL MODALS */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onAccountAdded={handleDataRefresh}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onTransferSuccess={handleDataRefresh}
      />

      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        onTransactionAdded={handleDataRefresh}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      {/* WHATSAPP-STYLE SILENT GOOGLE DRIVE BACKUP & RESTORE MODAL */}
      <DriveBackupModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        currentTreasuryData={currentTreasuryPayload}
        onRestoreCompleted={(restoredData) => {
          console.log('[FinFlow] Restored Data from Drive:', restoredData);
          handleDataRefresh();
        }}
      />
    </div>
  );
}
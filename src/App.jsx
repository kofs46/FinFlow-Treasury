import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './context/AuthContext';
import { useLang } from './context/LangContext';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import SidebarDrawer from './components/layout/SidebarDrawer';
import CommandPalette from './components/common/CommandPalette';
import SpeedDialFAB from './components/common/SpeedDialFAB';
import OverviewCards from './components/dashboard/OverviewCards';
import AccountsModule from './components/accounts/AccountsModule';
import ProjectsModule from './components/projects/ProjectsModule';
import DebtsModule from './components/debts/DebtsModule';
import AnalyticsModule from './components/analytics/AnalyticsModule';
import StatementsModule from './components/statements/StatementsModule';
import AddAccountModal from './components/accounts/AddAccountModal';
import TransferModal from './components/accounts/TransferModal';
import AddTransactionModal from './components/statements/AddTransactionModal';
import ContactModal from './components/common/ContactModal';
import ProfileModal from './components/common/ProfileModal';
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
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState('dashboard');

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    if (authMode === 'register') {
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        setSubmitting(false);
        return;
      }
      if (recoveryPin.length !== 6 || isNaN(recoveryPin)) {
        setErrorMsg('Security PIN must be exactly 6 digits.');
        setSubmitting(false);
        return;
      }
      const res = await signUp(email, password, fullName, recoveryPin);
      if (res?.error) {
        setErrorMsg(res.error.message);
      } else {
        setSuccessMsg('Registration successful! Please confirm your email.');
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
        setErrorMsg('Invalid 6-digit recovery PIN.');
        setSubmitting(false);
        return;
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateErr) {
        setErrorMsg(updateErr.message);
      } else {
        setSuccessMsg('Password reset successfully!');
        setTimeout(() => {
          setAuthMode('login');
          setSuccessMsg('');
          setPassword('');
          setNewPassword('');
          setRecoveryPin('');
        }, 2000);
      }
    } catch (err) {
      setErrorMsg('Error processing request.');
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
      
      {/* 1. TOP NAVBAR */}
      <div className="w-full shrink-0 z-40 bg-white border-b border-[#F3D7D9] print:hidden">
        <Navbar 
          onToggleSidebar={() => setIsSidebarOpen(true)}
          onNavigateHome={() => setActiveTab('dashboard')}
          onOpenAddTx={() => setIsAddTxOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
      </div>

      {/* 2. GLOBAL COMMAND PALETTE */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenAddTx={() => setIsAddTxOpen(true)}
        onOpenTransfer={() => setIsTransferOpen(true)}
        onOpenAddAccount={() => setIsAddAccountOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSupport={() => setIsContactOpen(true)}
      />

      {/* 3. SIDEBAR DRAWER */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSupport={() => setIsContactOpen(true)}
      />

      {/* 4. SPEED DIAL FAB */}
      <SpeedDialFAB
        onOpenAddExpense={() => setIsAddTxOpen(true)}
        onOpenAddIncome={() => setIsAddTxOpen(true)}
        onOpenTransfer={() => setIsTransferOpen(true)}
        onOpenAddVault={() => setIsAddAccountOpen(true)}
      />

      {/* 5. MAIN WORKSPACE */}
      <main className="flex-1 w-full overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 print:p-0 print:m-0 print:overflow-visible">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight">
              {t(activeTab)}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-semibold">
              {t('subTitle')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddTxOpen(true)}
            className="py-2.5 px-4 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Transaction</span>
          </button>
        </div>

        {/* Modules: Compliance module is removed */}
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

        {activeTab === 'analytics' && (
          <AnalyticsModule />
        )}

        {activeTab === 'statements' && (
          <StatementsModule onDataChange={handleDataRefresh} />
        )}
      </main>

      {/* 6. MOBILE BOTTOM NAVIGATION */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenAddTx={() => setIsAddTxOpen(true)} 
      />

      {/* 7. MODALS */}
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
    </div>
  );
}
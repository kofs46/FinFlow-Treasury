import React, { useState } from 'react';
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
import AnalyticsModule from './components/analytics/AnalyticsModule';
import StatementsModule from './components/statements/StatementsModule';
import AddAccountModal from './components/accounts/AddAccountModal';
import TransferModal from './components/accounts/TransferModal';
import ContactModal from './components/common/ContactModal';
import ProfileModal from './components/common/ProfileModal';
import NewProjectModal from './components/projects/NewProjectModal';
import RecordDebtModal from './components/debts/RecordDebtModal';
import { 
  Shield, 
  KeyRound, 
  Mail, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const { user, loading, signIn, signUp } = useAuth();
  const { t, lang } = useLang();
  const [activeTab, setActiveTab] = useState('dashboard');

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isRecordDebtOpen, setIsRecordDebtOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

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
        setErrorMsg(lang === 'bn' ? 'পাসওয়ার্ড দুটি মেলেনি।' : 'Passwords do not match.');
        setSubmitting(false);
        return;
      }
      if (recoveryPin.length !== 6 || isNaN(recoveryPin)) {
        setErrorMsg(lang === 'bn' ? 'রিকভারি পিন অবশ্যই ৬ ডিজিটের হতে হবে।' : 'Security PIN must be exactly 6 digits.');
        setSubmitting(false);
        return;
      }
      const res = await signUp(email, password, fullName, recoveryPin);
      if (res.error) {
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
      if (res.error) {
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
          <div className="w-12 h-12 border-4 border-[#E11D48] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Loading FinFlow Treasury...
          </p>
        </div>
      </div>
    );
  }

  // --- AUTH SCREEN ---
  if (!user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-rose-50/60 via-[#FAFAFA] to-orange-50/40 px-4 py-10 text-slate-900 overflow-x-hidden">
        <div className="w-full max-w-md rounded-3xl bg-white border border-[#F3D7D9] p-6 sm:p-8 shadow-2xl shadow-rose-900/10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E11D48] text-white font-black text-2xl mb-3 shadow-lg shadow-rose-500/30 ring-4 ring-rose-100">
              ৳
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              {authMode === 'login' && 'Sign In'}
              {authMode === 'register' && 'Create Account'}
              {authMode === 'forgot' && 'PIN Recovery'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">Enterprise Treasury & Liquidity Terminal</p>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Monirul Islam"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-[#F3D7D9] rounded-xl text-sm focus:outline-none focus:border-[#E11D48] text-slate-900 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-[#F3D7D9] rounded-xl text-sm focus:outline-none focus:border-[#E11D48] text-slate-900 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Password</label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-[11px] font-bold text-[#E11D48] hover:underline"
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
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-[#F3D7D9] rounded-xl text-sm focus:outline-none focus:border-[#E11D48] text-slate-900 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Confirm Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-[#F3D7D9] rounded-xl text-sm focus:outline-none focus:border-[#E11D48] text-slate-900 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">6-Digit Recovery PIN</label>
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
                className="w-full mt-2 py-3.5 px-4 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-rose-500/25 active:scale-98"
              >
                <span>{submitting ? 'Authenticating...' : authMode === 'login' ? 'Sign In to Terminal' : 'Create System Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handlePinReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">6-Digit Recovery PIN</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-[#F3D7D9] rounded-xl text-sm transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 px-4 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold rounded-xl text-sm shadow-md transition"
              >
                <span>{submitting ? 'Resetting...' : 'Reset Password'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="w-full py-2 flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
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
                className="text-xs font-bold text-[#E11D48] hover:underline"
              >
                {authMode === 'login' ? "Don't have an account? Sign Up" : 'Already registered? Sign In'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- MAIN APP WORKSPACE ---
  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] text-slate-900 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <div className="w-full shrink-0 print:hidden">
        <Navbar 
          onOpenContact={() => setIsContactOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
      </div>

      {/* Main Layout Area */}
      <div className="flex flex-1 w-full">
        
        {/* Desktop Sidebar */}
        <div className="print:hidden shrink-0">
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onOpenContact={() => setIsContactOpen(true)}
          />
        </div>

        {/* Content View Container: Removed artificial max-w-7xl auto margin */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-y-auto print:p-0 print:m-0 print:max-w-full">
          <div className="flex items-center justify-between mb-6 print:hidden">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight">
                {t(activeTab)}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                {t('subTitle')}
              </p>
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

          {activeTab === 'analytics' && (
            <AnalyticsModule />
          )}

          {activeTab === 'statements' && (
            <StatementsModule />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="w-full shrink-0 print:hidden">
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Global Modals */}
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

      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onProjectCreated={handleDataRefresh}
      />

      <RecordDebtModal
        isOpen={isRecordDebtOpen}
        onClose={() => setIsRecordDebtOpen(false)}
        onDebtAdded={handleDataRefresh}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}
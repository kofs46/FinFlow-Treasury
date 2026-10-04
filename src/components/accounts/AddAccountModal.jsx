import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { supabase } from '../../supabaseClient';
import { BrandLogo } from '../common/BrandLogos';
import { 
  X, 
  Plus, 
  Wallet, 
  Check, 
  Landmark, 
  Smartphone, 
  Banknote, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Hash
} from 'lucide-react';

// MFS Full List
const ALL_MFS = [
  { id: 'bKash', name: 'bKash (বিকাশ)', popular: true },
  { id: 'Nagad', name: 'Nagad (নগদ)', popular: true },
  { id: 'Rocket', name: 'Rocket (রকেট)', popular: true },
  { id: 'Upay', name: 'Upay (উপায়)', popular: true },
  { id: 'Cellfin', name: 'Cellfin (সেলফিন)', popular: true },
  { id: 'SureCash', name: 'SureCash', popular: false },
  { id: 'Tap', name: 'Tap (Trust Axiata)', popular: false },
  { id: 'mfs_other', name: 'Other MFS...', popular: false },
];

// BD Banks Full List
const ALL_BANKS = [
  { id: 'City Bank', name: 'City Bank', popular: true },
  { id: 'BRAC Bank', name: 'BRAC Bank', popular: true },
  { id: 'Dutch-Bangla Bank', name: 'Dutch-Bangla Bank (DBBL)', popular: true },
  { id: 'Islami Bank', name: 'Islami Bank Bangladesh', popular: true },
  { id: 'Eastern Bank', name: 'Eastern Bank (EBL)', popular: true },
  { id: 'Standard Chartered', name: 'Standard Chartered', popular: true },
  { id: 'Prime Bank', name: 'Prime Bank', popular: false },
  { id: 'Mutual Trust Bank', name: 'Mutual Trust Bank (MTB)', popular: false },
  { id: 'Sonali Bank', name: 'Sonali Bank PLC', popular: false },
  { id: 'Dhaka Bank', name: 'Dhaka Bank', popular: false },
  { id: 'Pubali Bank', name: 'Pubali Bank', popular: false },
  { id: 'Bank Asia', name: 'Bank Asia', popular: false },
  { id: 'United Commercial Bank', name: 'UCB Bank', popular: false },
  { id: 'Southeast Bank', name: 'Southeast Bank', popular: false },
  { id: 'NCC Bank', name: 'NCC Bank', popular: false },
  { id: 'Mercantile Bank', name: 'Mercantile Bank', popular: false },
  { id: 'Premier Bank', name: 'Premier Bank', popular: false },
  { id: 'Trust Bank', name: 'Trust Bank', popular: false },
  { id: 'bank_other', name: 'Other Commercial Bank...', popular: false },
];

export default function AddAccountModal({ isOpen, onClose, onAccountAdded }) {
  const { user } = useAuth();
  const { lang } = useLang();

  const [accountType, setAccountType] = useState('mfs');
  const [selectedProvider, setSelectedProvider] = useState('bKash');
  const [accountNumber, setAccountNumber] = useState('');
  const [customName, setCustomName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  
  // See More toggles
  const [showAllMFS, setShowAllMFS] = useState(false);
  const [showAllBanks, setShowAllBanks] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleTypeChange = (type) => {
    setAccountType(type);
    if (type === 'mfs') setSelectedProvider('bKash');
    else if (type === 'bank') setSelectedProvider('City Bank');
    else if (type === 'cash') setSelectedProvider('Cash in Hand');
    else setSelectedProvider('Other');
    setCustomName('');
    setAccountNumber('');
  };

  const visibleMFS = showAllMFS ? ALL_MFS : ALL_MFS.filter(m => m.popular);
  const visibleBanks = showAllBanks ? ALL_BANKS : ALL_BANKS.filter(b => b.popular);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    let finalName = '';
    const accNumFormatted = accountNumber.trim() ? ` [${accountNumber.trim()}]` : '';

    if (accountType === 'mfs' || accountType === 'bank') {
      if (selectedProvider.includes('_other')) {
        finalName = `${customName.trim()}${accNumFormatted}`;
      } else {
        const extraLabel = customName.trim() ? ` - ${customName.trim()}` : '';
        finalName = `${selectedProvider}${extraLabel}${accNumFormatted}`;
      }
    } else if (accountType === 'cash') {
      finalName = customName.trim() ? `Cash (${customName.trim()})` : 'Cash in Hand';
    } else {
      finalName = `${customName.trim() || 'Custom Reserve'}${accNumFormatted}`;
    }

    if (!finalName) {
      setErrorMsg(lang === 'bn' ? 'অ্যাকাউন্টের নাম দিন।' : 'Please provide an account title.');
      setLoading(false);
      return;
    }

    const numericBalance = parseFloat(initialBalance) || 0;

    const { error } = await supabase.from('accounts').insert({
      user_id: user.id,
      account_name: finalName,
      account_type: accountType,
      balance: numericBalance,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setCustomName('');
      setAccountNumber('');
      setInitialBalance('');
      onAccountAdded();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-tight">
              {lang === 'bn' ? 'নতুন অ্যাকাউন্ট / ওয়ালেট' : 'New Account / Wallet'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'bn' ? 'বাংলাদেশি MFS, ব্যাংক ও ক্যাশ রিজার্ভ' : 'Add Bangladeshi MFS & Banks with A/C Number'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Account Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {lang === 'bn' ? 'অ্যাকাউন্টের ধরন নির্বাচন' : 'Account Type'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'mfs', label: 'MFS', icon: Smartphone, color: 'text-pink-600' },
                { id: 'bank', label: 'Bank', icon: Landmark, color: 'text-blue-600' },
                { id: 'cash', label: 'Cash', icon: Banknote, color: 'text-emerald-600' },
                { id: 'other', label: 'Other', icon: Sparkles, color: 'text-purple-600' },
              ].map((type) => {
                const Icon = type.icon;
                const isSelected = accountType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleTypeChange(type.id)}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-indigo-600' : type.color}`} />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MFS Providers with See More */}
          {accountType === 'mfs' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {lang === 'bn' ? 'MFS প্রোভাইডার' : 'Select MFS Provider'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowAllMFS(!showAllMFS)}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                >
                  <span>{showAllMFS ? (lang === 'bn' ? 'কম দেখুন' : 'Show Less') : (lang === 'bn' ? 'আরও দেখুন' : 'See More')}</span>
                  {showAllMFS ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {visibleMFS.map((prov) => {
                  const isSelected = selectedProvider === prov.id;
                  return (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => setSelectedProvider(prov.id)}
                      className={`relative flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <BrandLogo name={prov.id} type="mfs" className="w-7 h-7 flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-800 truncate">{prov.name}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-indigo-600 absolute right-2.5 top-3.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bank Providers with See More */}
          {accountType === 'bank' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {lang === 'bn' ? 'বাণিজ্যিক ব্যাংক' : 'Select Commercial Bank'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowAllBanks(!showAllBanks)}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                >
                  <span>{showAllBanks ? (lang === 'bn' ? 'কম দেখুন' : 'Show Less') : (lang === 'bn' ? 'আরও দেখুন (সব ব্যাংক)' : 'See More (All Banks)')}</span>
                  {showAllBanks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {visibleBanks.map((prov) => {
                  const isSelected = selectedProvider === prov.id;
                  return (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => setSelectedProvider(prov.id)}
                      className={`relative flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <BrandLogo name={prov.id} type="bank" className="w-7 h-7 flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-800 truncate">{prov.name}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-indigo-600 absolute right-2.5 top-3.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Account Number / Wallet Mobile No */}
          {(accountType === 'mfs' || accountType === 'bank' || accountType === 'other') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {accountType === 'mfs'
                  ? (lang === 'bn' ? 'ওয়ালেট / মোবাইল নম্বর' : 'Wallet / Phone Number')
                  : (lang === 'bn' ? 'অ্যাকাউন্ট নম্বর (A/C No)' : 'Account Number (A/C No)')}
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={
                    accountType === 'mfs'
                      ? 'e.g. 017XXXXXXXX'
                      : 'e.g. 2050123456789'
                  }
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 font-mono transition"
                />
              </div>
            </div>
          )}

          {/* Custom Label or Subtitle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {selectedProvider.includes('_other') || accountType === 'other'
                ? (lang === 'bn' ? 'কাস্টম অ্যাকাউন্টের নাম' : 'Custom Account Name')
                : (lang === 'bn' ? 'অ্যাকাউন্ট লেবেল / ব্যবহারকারীর নাম (ঐচ্ছিক)' : 'Account Label / Owner Tag (Optional)')}
            </label>
            <input
              type="text"
              required={selectedProvider.includes('_other') || accountType === 'other'}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={
                accountType === 'mfs'
                  ? 'e.g. Personal / Merchant'
                  : accountType === 'bank'
                  ? 'e.g. Salary A/C, Savings'
                  : 'e.g. Main Safe'
              }
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 transition"
            />
          </div>

          {/* Initial Balance in BDT */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {lang === 'bn' ? 'প্রাথমিক ব্যালেন্স' : 'Starting Balance'}
              </label>
              <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                Currency: BDT (৳)
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-black text-slate-400">৳</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white font-mono text-slate-900 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>
              {loading 
                ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving Account...') 
                : (lang === 'bn' ? 'অ্যাকাউন্ট নিশ্চিত করুন' : 'Confirm & Save Account')}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
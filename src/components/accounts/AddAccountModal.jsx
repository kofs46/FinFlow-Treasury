import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  Smartphone, 
  Landmark, 
  Banknote, 
  Layers, 
  ChevronDown,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const MFS_LIST = [
  'bKash',
  'Nagad',
  'Rocket',
  'Upay',
  'Cellfin',
  'SureCash',
  'mCash',
  'Tap'
];

const BANK_LIST = [
  'Islami Bank Bangladesh (IBBL)',
  'BRAC Bank PLC',
  'City Bank PLC',
  'Dutch-Bangla Bank (DBBL)',
  'Eastern Bank (EBL)',
  'Standard Chartered Bangladesh',
  'Mutual Trust Bank (MTB)',
  'United Commercial Bank (UCB)',
  'Prime Bank PLC',
  'Pubali Bank PLC',
  'Sonali Bank PLC',
  'Janata Bank PLC',
  'Agrani Bank PLC',
  'Rupali Bank PLC',
  'Trust Bank Limited',
  'Dhaka Bank Limited',
  'NCC Bank Limited',
  'Bank Asia Limited',
  'Al-Arafah Islami Bank',
  'First Security Islami Bank',
  'Social Islami Bank (SIBL)',
  'EXIM Bank Bangladesh',
  'Global Islami Bank',
  'Union Bank Limited',
  'Midland Bank',
  'Modhumoti Bank',
  'Community Bank Bangladesh',
  'NRB Bank'
];

export default function AddAccountModal({ isOpen, onClose, onAccountAdded }) {
  const { user } = useAuth();

  // Vault Type: 'mfs' | 'bank' | 'cash' | 'other'
  const [accountType, setAccountType] = useState('mfs');
  const [selectedInstitution, setSelectedInstitution] = useState('bKash');
  const [customInstitutionName, setCustomInstitutionName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleTypeSelect = (type) => {
    setAccountType(type);
    if (type === 'mfs') {
      setSelectedInstitution('bKash');
    } else if (type === 'bank') {
      setSelectedInstitution('Islami Bank Bangladesh (IBBL)');
    } else if (type === 'cash') {
      setSelectedInstitution('Petty Cash Reserve');
      setAccountNumber('');
    } else {
      setSelectedInstitution('Other Institution');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user?.id) {
      setErrorMsg('User authentication required.');
      return;
    }

    setLoading(true);

    try {
      let finalInstitution = selectedInstitution;
      if (accountType === 'other') {
        finalInstitution = customInstitutionName.trim() || 'Custom Reserve';
      } else if (accountType === 'cash') {
        finalInstitution = 'Petty Cash Reserve';
      }

      // Card-er company name ebong cardholder name combine kora
      const finalAccountName = accountName.trim() 
        ? `${finalInstitution} - ${accountName.trim()}`
        : finalInstitution;

      const cleanNumber = accountNumber.trim().replace(/\s+/g, '');
      const parsedBalance = parseFloat(balance) || 0;

      // 1. Save directly to Supabase accounts table
      const { data: newAccount, error } = await supabase
        .from('accounts')
        .insert([
          {
            user_id: user.id,
            account_name: finalAccountName,
            account_number: cleanNumber,
            account_type: accountType,
            balance: parsedBalance
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // 2. Initial balance Opening Transaction audit trail
      if (parsedBalance > 0 && newAccount) {
        await supabase.from('transactions').insert([
          {
            user_id: user.id,
            account_id: newAccount.id,
            type: 'income',
            amount: parsedBalance,
            category: 'Opening Balance',
            notes: `Initial balance opening for ${finalAccountName}`,
            transaction_date: new Date().toISOString().split('T')[0]
          }
        ]);
      }

      // Reset Form
      setAccountName('');
      setAccountNumber('');
      setBalance('');
      setCustomInstitutionName('');
      
      if (onAccountAdded) onAccountAdded();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error issuing vault card.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white border border-[#F3D7D9] rounded-3xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Issue New Vault Card</h3>
            <p className="text-xs text-slate-400 font-medium">Link a bank account, mobile wallet or cash reserve</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-[#E11D48] text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          
          {/* 1. SELECT VAULT TYPE TABS */}
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-2">
              Select Vault Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              
              <button
                type="button"
                onClick={() => handleTypeSelect('mfs')}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  accountType === 'mfs'
                    ? 'border-[#E11D48] bg-rose-50/60 text-[#E11D48] shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Wallet (MFS)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelect('bank')}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  accountType === 'bank'
                    ? 'border-[#E11D48] bg-rose-50/60 text-[#E11D48] shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Landmark className="w-4 h-4" />
                <span>Bank Account</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelect('cash')}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  accountType === 'cash'
                    ? 'border-[#E11D48] bg-rose-50/60 text-[#E11D48] shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Petty Cash</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelect('other')}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  accountType === 'other'
                    ? 'border-[#E11D48] bg-rose-50/60 text-[#E11D48] shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Others</span>
              </button>

            </div>
          </div>

          {/* 2. INSTITUTION DROPDOWN (MFS / Bank Lists) */}
          {accountType === 'mfs' && (
            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Select MFS Provider (Card Brand)
              </label>
              <div className="relative">
                <select
                  value={selectedInstitution}
                  onChange={(e) => setSelectedInstitution(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48] appearance-none pr-9 cursor-pointer"
                >
                  {MFS_LIST.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          )}

          {accountType === 'bank' && (
            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Select Bank Institution (Card Brand)
              </label>
              <div className="relative">
                <select
                  value={selectedInstitution}
                  onChange={(e) => setSelectedInstitution(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48] appearance-none pr-9 cursor-pointer"
                >
                  {BANK_LIST.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          )}

          {accountType === 'other' && (
            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Institution / Network Name
              </label>
              <input
                type="text"
                required
                value={customInstitutionName}
                onChange={(e) => setCustomInstitutionName(e.target.value)}
                placeholder="e.g. PayPal, Payoneer, Crypto Vault"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
              />
            </div>
          )}

          {/* 3. CARDHOLDER / ACCOUNT LABEL */}
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Cardholder / Account Tag[cite: 9]
            </label>
            <input
              type="text"
              required
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder={accountType === 'mfs' ? 'e.g. Personal 01, Merchant' : accountType === 'cash' ? 'e.g. Office Cash Drawer' : 'e.g. Corporate Current, Salary Acc'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
            />
          </div>

          {/* 4. CARD NUMBER (Bank Account / Wallet Phone Number) */}
          {accountType !== 'cash' && (
            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                {accountType === 'mfs' ? 'Wallet Mobile Number (Card Number)' : 'Account / Card Number'}
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={accountType === 'mfs' ? '017XXXXXXXX' : '2050XXXXXXXXXXXXX'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
              />
              <span className="text-[10px] text-slate-400 font-medium block mt-1">
                This number will be embossed as the primary card number[cite: 9].
              </span>
            </div>
          )}

          {/* 5. OPENING BALANCE */}
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Opening Reserve Balance (৳)[cite: 9]
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel[cite: 9]
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-5 bg-[#E11D48] hover:bg-[#BE123C] active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-950/15 disabled:opacity-50 cursor-pointer transition"
            >
              {loading ? 'Issuing Card...' : 'Create Vault Card'}[cite: 9]
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
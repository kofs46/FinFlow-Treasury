import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { X, Landmark, Smartphone, Banknote, ShieldCheck } from 'lucide-react';

export default function AddAccountModal({ isOpen, onClose, onAccountAdded }) {
  const { user } = useAuth();

  const [accountType, setAccountType] = useState('mfs'); // 'mfs', 'bank', 'cash'
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!accountName.trim()) {
      setErrorMsg('Please enter a valid cardholder or account name.');
      return;
    }

    // Cash chara onno shob khetre Phone/Account number mandatory
    if (accountType !== 'cash' && !accountNumber.trim()) {
      setErrorMsg(
        accountType === 'mfs'
          ? 'Please enter the wallet phone number.'
          : 'Please enter the bank account number.'
      );
      return;
    }

    setLoading(true);
    try {
      const cleanNumber = accountNumber.trim().replace(/\s+/g, '');
      const parsedBalance = parseFloat(openingBalance) || 0;

      const { data, error } = await supabase
        .from('accounts')
        .insert([
          {
            user_id: user.id,
            account_name: accountName.trim(),
            account_type: accountType,
            account_number: cleanNumber,
            balance: parsedBalance,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;

      // Reset & close
      setAccountName('');
      setAccountNumber('');
      setOpeningBalance('');
      setAccountType('mfs');
      if (onAccountAdded) onAccountAdded();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create vault card.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-white border border-[#F3D7D9] rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900">Issue New Vault Card</h3>
            <p className="text-xs text-slate-400 font-medium">Link a bank account, mobile wallet or cash reserve</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-[#E11D48]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Account Category Selector */}
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-2">
              Select Vault Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAccountType('mfs')}
                className={`py-2.5 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                  accountType === 'mfs'
                    ? 'bg-rose-50 border-[#E11D48] text-[#E11D48]'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Wallet (MFS)</span>
              </button>

              <button
                type="button"
                onClick={() => setAccountType('bank')}
                className={`py-2.5 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                  accountType === 'bank'
                    ? 'bg-rose-50 border-[#E11D48] text-[#E11D48]'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Landmark className="w-4 h-4" />
                <span>Bank Account</span>
              </button>

              <button
                type="button"
                onClick={() => setAccountType('cash')}
                className={`py-2.5 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                  accountType === 'cash'
                    ? 'bg-rose-50 border-[#E11D48] text-[#E11D48]'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Petty Cash</span>
              </button>
            </div>
          </div>

          {/* Cardholder / Account Name */}
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
              Cardholder / Account Name
            </label>
            <input
              type="text"
              required
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder={accountType === 'mfs' ? 'e.g. bKash Personal' : accountType === 'bank' ? 'e.g. BRAC Bank Corporate' : 'e.g. Office Petty Cash'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48] transition"
            />
          </div>

          {/* Dynamic Account / Phone Number Field */}
          {accountType !== 'cash' && (
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
                {accountType === 'mfs' ? 'Wallet Phone Number' : 'Bank Account Number'}
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={accountType === 'mfs' ? 'e.g. 01712345678' : 'e.g. 1501203456789001'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E11D48] transition"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {accountType === 'mfs' 
                  ? 'This phone number will be displayed as the primary wallet card number.'
                  : 'This account number will appear as the embossed card number.'}
              </p>
            </div>
          )}

          {/* Opening Balance */}
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
              Opening Reserve Balance (৳)
            </label>
            <input
              type="number"
              step="any"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E11D48] transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-5 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-bold shadow-md shadow-rose-950/15 disabled:opacity-50 transition active:scale-95"
            >
              {loading ? 'Creating...' : 'Create Vault Card'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
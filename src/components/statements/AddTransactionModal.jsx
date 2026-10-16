import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { parseReceiptText, getSmartPreset } from '../../utils/receiptParser';
import Tesseract from 'tesseract.js';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Receipt, 
  Calendar, 
  Tag, 
  Wallet, 
  FileText,
  DollarSign
} from 'lucide-react';

const CATEGORIES = [
  'General Expense',
  'Utilities',
  'Office Supplies',
  'Rent',
  'Travel & Transport',
  'Salaries',
  'Food & Pantry',
  'Marketing',
  'Client Revenue',
  'Investment Inflow',
  'Equipment',
  'Taxes & Compliance'
];

export default function AddTransactionModal({ 
  isOpen, 
  onClose, 
  onTransactionAdded 
}) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [type, setType] = useState('expense'); // 'expense' | 'income'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('General Expense');
  const [notes, setNotes] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split('T')[0]);

  // OCR Processing States
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [ocrSuccessNotice, setOcrSuccessNotice] = useState('');

  // Low-Balance Warning Alert State
  const [thresholdWarning, setThresholdWarning] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Available Vault Accounts
  useEffect(() => {
    if (!user?.id || !isOpen) return;

    const fetchAccounts = async () => {
      try {
        const { data, error } = await supabase
          .from('accounts')
          .select('id, account_name, account_type, balance')
          .eq('user_id', user.id)
          .order('account_name', { ascending: true });

        if (!error && data) {
          setAccounts(data);
          if (data.length > 0 && !selectedAccountId) {
            setSelectedAccountId(data[0].id);
          }
        }
      } catch (err) {
        console.warn('Accounts load error:', err);
      }
    };

    fetchAccounts();
    setErrorMsg('');
    setThresholdWarning('');
    setOcrSuccessNotice('');
  }, [user?.id, isOpen]);

  // Evaluate Low Balance Warning on Amount or Account Change
  useEffect(() => {
    if (!selectedAccountId || !amount || type !== 'expense') {
      setThresholdWarning('');
      return;
    }

    const currentAcc = accounts.find((a) => a.id === selectedAccountId);
    if (!currentAcc) return;

    const currentBalance = Number(currentAcc.balance || 0);
    const debitAmount = parseFloat(amount) || 0;
    const projectedBalance = currentBalance - debitAmount;

    // Configurable Low Balance Threshold (৳ 5,000 for Petty cash, ৳ 10,000 for banks)
    const warningLimit = currentAcc.account_type === 'cash' ? 5000 : 10000;

    if (projectedBalance < 0) {
      setThresholdWarning(`Deficit Warning: This will overdraw this account by ৳ ${(Math.abs(projectedBalance)).toLocaleString()}!`);
    } else if (projectedBalance < warningLimit) {
      setThresholdWarning(`Low Reserve Alert: Remaining balance (৳ ${projectedBalance.toLocaleString()}) drops below safe limit (৳ ${warningLimit.toLocaleString()}).`);
    } else {
      setThresholdWarning('');
    }
  }, [amount, selectedAccountId, type, accounts]);

  // Smart Autocomplete on Payee / Notes Change
  const handleNotesChange = (val) => {
    setNotes(val);
    const preset = getSmartPreset(val);
    if (preset) {
      if (preset.category) setCategory(preset.category);
      if (preset.type) setType(preset.type);
    }
  };

  // OCR File Handler using Tesseract.js
  const handleReceiptScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanProgress(0);
    setErrorMsg('');
    setOcrSuccessNotice('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const imageUri = reader.result;
        
        const worker = await Tesseract.createWorker('eng');
        const ret = await worker.recognize(imageUri);
        await worker.terminate();

        const rawText = ret.data.text;
        const parsed = parseReceiptText(rawText);

        if (parsed.amount) setAmount(parsed.amount);
        if (parsed.date) setTransactionDate(parsed.date);
        if (parsed.vendor) {
          setNotes(parsed.vendor);
          handleNotesChange(parsed.vendor);
        }
        if (parsed.category) setCategory(parsed.category);

        setOcrSuccessNotice(`Receipt scanned successfully! Amount: ৳${parsed.amount || '0'}, Date: ${parsed.date}`);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setErrorMsg(`OCR Parsing failed: ${err.message}. Please fill values manually.`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedAccountId) {
      setErrorMsg('Please select a vault account.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Insert transaction into Supabase
      const { error: txError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            account_id: selectedAccountId,
            type,
            amount: numAmount,
            category,
            notes: notes.trim(),
            transaction_date: transactionDate
          }
        ]);

      if (txError) throw txError;

      // 2. Adjust account balance directly
      const currentAcc = accounts.find((a) => a.id === selectedAccountId);
      if (currentAcc) {
        const currentBal = Number(currentAcc.balance || 0);
        const newBalance = type === 'income' ? currentBal + numAmount : currentBal - numAmount;

        await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('id', selectedAccountId)
          .eq('user_id', user.id);
      }

      // Reset
      setAmount('');
      setNotes('');
      if (onTransactionAdded) onTransactionAdded();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error recording transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white border border-[#F3D7D9] rounded-3xl p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Record Financial Entry</h3>
            <p className="text-xs text-slate-400 font-medium">Log income, vouchers, or auto-scan receipt slip</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* OCR Auto-Scanner Button Card */}
        <div className="mt-4 p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E11D48] text-white flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">Auto-Scan Receipt / Voucher</p>
              <span className="text-[10px] text-slate-500 font-medium">Upload photo to auto-extract amount & vendor</span>
            </div>
          </div>

          <button
            type="button"
            disabled={isScanning}
            onClick={() => fileInputRef.current?.click()}
            className="py-1.5 px-3 bg-white hover:bg-rose-100 border border-rose-200 text-[#E11D48] rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Reading...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Scan OCR</span>
              </>
            )}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleReceiptScan}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* OCR Notice */}
        {ocrSuccessNotice && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{ocrSuccessNotice}</span>
          </div>
        )}

        {/* Error Notice */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-[#E11D48] text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* Low-Balance Warning Alert Banner */}
        {thresholdWarning && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{thresholdWarning}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          
          {/* Income vs Expense Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
                type === 'expense'
                  ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Expense Voucher
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
                type === 'income'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Income Inflow
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Amount (৳ BDT)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold font-mono">৳</span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
              />
            </div>
          </div>

          {/* Vault Account Selector */}
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Select Vault Account
            </label>
            <div className="relative">
              <Wallet className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48] cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_name} — (Bal: ৳{Number(acc.balance).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="relative">
              <Tag className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48] cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payee / Description / Smart Autocomplete Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                Payee / Voucher Description
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Smart autocomplete enabled</span>
            </div>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="e.g. Daraz, Dhaka WASA, Office Rent, Starlink..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
              />
            </div>
          </div>

          {/* Transaction Date */}
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Posting Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isScanning}
              className="py-2.5 px-5 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-bold shadow-md shadow-rose-950/15 disabled:opacity-50 cursor-pointer transition active:scale-95"
            >
              {submitting ? 'Posting Ledger...' : 'Commit Transaction'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
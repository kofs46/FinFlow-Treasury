import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { formatBDT } from '../../utils/currency';
import { 
  Plus, 
  ArrowRightLeft, 
  Copy, 
  Check, 
  Wifi, 
  Eye, 
  EyeOff, 
  Trash2, 
  Edit2, 
  Clock, 
  X, 
  Layers, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileSpreadsheet
} from 'lucide-react';

export default function AccountsModule({ 
  onOpenAddAccount, 
  onOpenTransfer, 
  refreshTrigger, 
  onDataChange 
}) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // Prottek card-er jonno alada visibility state tracker
  const [visibleBalances, setVisibleBalances] = useState({});

  // History & Edit Modals State
  const [selectedAccountForHistory, setSelectedAccountForHistory] = useState(null);
  const [historyTransactions, setHistoryTransactions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [editingAccount, setEditingAccount] = useState(null);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editType, setEditType] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const prevAccountsJson = useRef('');

  const fetchAccounts = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const currentJson = JSON.stringify(data);
        if (currentJson !== prevAccountsJson.current) {
          prevAccountsJson.current = currentJson;
          setAccounts(data);
        }
      }
    } catch (err) {
      console.warn('Error fetching Supabase accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user?.id, refreshTrigger]);

  // Specific Card Balance Visibility Toggle
  const toggleCardVisibility = (id) => {
    setVisibleBalances((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteAccount = async (id, accountName) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${accountName}"?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (!error) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      alert(`Could not delete vault: ${err.message}`);
    }
  };

  const handleOpenHistory = async (account) => {
    setSelectedAccountForHistory(account);
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('account_id', account.id)
        .order('transaction_date', { ascending: false });

      if (!error) {
        setHistoryTransactions(data || []);
      }
    } catch (err) {
      console.error('Error fetching account history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenEdit = (account) => {
    setEditingAccount(account);
    setEditName(account.account_name || '');
    setEditNumber(account.account_number || '');
    setEditType(account.account_type || 'bank');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingAccount) return;
    setEditSubmitting(true);

    try {
      const cleanNumber = editNumber.trim().replace(/\s+/g, '');
      const updatedData = {
        account_name: editName.trim(),
        account_number: cleanNumber,
        account_type: editType
      };

      const { error } = await supabase
        .from('accounts')
        .update(updatedData)
        .eq('id', editingAccount.id)
        .eq('user_id', user.id);

      if (!error) {
        setAccounts((prev) =>
          prev.map((acc) => (acc.id === editingAccount.id ? { ...acc, ...updatedData } : acc))
        );
        setEditingAccount(null);
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      alert(`Error updating account: ${err.message}`);
    } finally {
      setEditSubmitting(false);
    }
  };

  const getCardTheme = (type = '', name = '') => {
    const term = `${name} ${type}`.toLowerCase();

    if (term.includes('bkash')) {
      return {
        bg: 'from-[#be123c] via-[#e11d48] to-[#fb7185]',
        brand: 'bKash Wallet',
        typeBadge: 'MFS DEBIT',
        network: 'bKash'
      };
    }
    if (term.includes('nagad')) {
      return {
        bg: 'from-[#c2410c] via-[#ea580c] to-[#f97316]',
        brand: 'Nagad Priority',
        typeBadge: 'MFS WALLET',
        network: 'Nagad'
      };
    }
    if (term.includes('rocket')) {
      return {
        bg: 'from-[#6b21a8] via-[#8b5cf6] to-[#a855f7]',
        brand: 'DBBL Rocket',
        typeBadge: 'MFS WALLET',
        network: 'Rocket'
      };
    }
    if (term.includes('upay')) {
      return {
        bg: 'from-[#0369a1] via-[#0284c7] to-[#38bdf8]',
        brand: 'Upay Digital',
        typeBadge: 'MFS WALLET',
        network: 'Upay'
      };
    }
    if (term.includes('cellfin')) {
      return {
        bg: 'from-[#065f46] via-[#059669] to-[#34d399]',
        brand: 'IBBL Cellfin',
        typeBadge: 'OMNI-WALLET',
        network: 'VISA'
      };
    }

    if (term.includes('islami') || term.includes('ibbl')) {
      return {
        bg: 'from-[#064e3b] via-[#047857] to-[#10b981]',
        brand: 'Islami Bank Bangladesh',
        typeBadge: 'ISLAMIC SIGNATURE',
        network: 'VISA'
      };
    }
    if (term.includes('city')) {
      return {
        bg: 'from-[#1e3a8a] via-[#1d4ed8] to-[#60a5fa]',
        brand: 'City Bank Priority',
        typeBadge: 'PLATINUM',
        network: 'AMEX'
      };
    }
    if (term.includes('brac')) {
      return {
        bg: 'from-[#075985] via-[#0284c7] to-[#38bdf8]',
        brand: 'BRAC Bank Premium',
        typeBadge: 'SIGNATURE',
        network: 'VISA'
      };
    }
    if (term.includes('dutch') || term.includes('dbbl')) {
      return {
        bg: 'from-[#15803d] via-[#16a34a] to-[#4ade80]',
        brand: 'Dutch-Bangla Bank',
        typeBadge: 'NEXUS DEBIT',
        network: 'NEXUS'
      };
    }
    if (term.includes('cash')) {
      return {
        bg: 'from-[#064e3b] via-[#047857] to-[#059669]',
        brand: 'Petty Cash Reserve',
        typeBadge: 'DIRECT CASH',
        network: 'TREASURY'
      };
    }

    return {
      bg: 'from-[#0f172a] via-[#1e293b] to-[#334155]',
      brand: 'Corporate Banking Vault',
      typeBadge: 'COMMERCIAL',
      network: 'MASTERCARD'
    };
  };

  const renderEmbossedCardNumber = (rawNum, type = '') => {
    if (!rawNum) {
      if (type === 'cash') return 'LIQUID CASH VAULT';
      return 'NO CARD NUMBER';
    }
    const clean = String(rawNum).trim().replace(/\s+/g, '');
    if (clean.length === 11) {
      return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
    }
    return clean.match(/.{1,4}/g)?.join(' ') || clean;
  };

  const totalLiquidity = accounts.reduce((acc, curr) => acc + Number(curr.balance || 0), 0);

  return (
    <div className="space-y-6 select-none font-sans">
      
      {/* 1. TOP SUMMARY BAR (Global Eye Button Removed) */}
      <div className="rounded-3xl bg-white border border-[#F3D7D9] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-[#E11D48] text-[10px] font-black uppercase tracking-wider border border-rose-200">
              Vault Portfolio
            </span>
            <span className="text-xs font-bold text-slate-400">
              • {accounts.length} Active Accounts
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Accounts & Liquidity Vaults
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Manage physical reserves, digital wallets & institutional cards
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Cumulative Reserves
            </span>
            <span className="text-lg font-black font-mono text-slate-900">
              {formatBDT(totalLiquidity, 'en')}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenTransfer}
            className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfer Funds</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddAccount}
            className="py-2.5 px-4 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-2xl text-xs font-bold shadow-md shadow-rose-950/15 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Vault</span>
          </button>
        </div>
      </div>

      {/* 2. VISA CARDS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-60 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-3xl bg-white border border-[#F3D7D9] p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-[#E11D48] flex items-center justify-center mx-auto shadow-xs">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">No Cards In Vault</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Your vault is currently empty. Issue your first bank card or digital wallet below.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenAddAccount}
              className="py-3 px-5 bg-[#E11D48] hover:bg-[#BE123C] active:scale-95 text-white font-bold text-xs rounded-2xl shadow-md flex items-center gap-2 mx-auto transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Vault</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => {
            const theme = getCardTheme(acc.account_type, acc.account_name);
            const balanceVal = Number(acc.balance || 0);
            const isCardBalanceVisible = visibleBalances[acc.id] !== false; // Default-e visible thakbe

            return (
              <div key={acc.id} className="flex flex-col gap-2">
                <div
                  className={`relative w-full aspect-[1.586/1] min-h-[225px] rounded-3xl bg-gradient-to-br ${theme.bg} p-6 text-white shadow-xl shadow-slate-950/15 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden border border-white/10`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/15 pointer-events-none" />
                  <div className="absolute -right-20 -top-20 w-52 h-52 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Top Row: Brand & Actions */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black tracking-wider uppercase text-white/95 leading-none">
                        {acc.account_name.split(' - ')[0] || theme.brand}
                      </h4>
                      <span className="text-[9px] font-bold tracking-widest text-white/70 uppercase">
                        {acc.account_type.toUpperCase()} RESERVE
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[9px] font-black uppercase tracking-widest border border-white/20">
                        {theme.typeBadge}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(acc)}
                        className="p-1.5 rounded-lg bg-black/20 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
                        title="Edit Vault"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAccount(acc.id, acc.account_name)}
                        className="p-1.5 rounded-lg bg-black/20 hover:bg-rose-950/60 text-white/80 hover:text-white transition cursor-pointer"
                        title="Delete Vault"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Middle Row: Gold Chip & Individual Balance with Eye Button */}
                  <div className="relative z-10 flex items-center justify-between my-auto pt-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-8 rounded-lg bg-gradient-to-tr from-[#eab308] via-[#fef08a] to-[#ca8a04] p-1 shadow-md border border-amber-300/60 relative overflow-hidden flex items-center justify-center">
                        <div className="w-full h-[1px] bg-amber-900/40 absolute" />
                        <div className="h-full w-[1px] bg-amber-900/40 absolute" />
                        <div className="w-4 h-3 rounded-xs border border-amber-900/50" />
                      </div>
                      <Wifi className="w-5 h-5 text-white/75 rotate-90" />
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-white/70 block leading-tight">
                          Available Balance
                        </span>
                        {/* Individual Eye Toggle Button for this specific card */}
                        <button
                          type="button"
                          onClick={() => toggleCardVisibility(acc.id)}
                          className="p-1 rounded-md bg-white/10 hover:bg-white/25 text-white/80 hover:text-white transition cursor-pointer"
                          title={isCardBalanceVisible ? "Hide Balance" : "Show Balance"}
                        >
                          {isCardBalanceVisible ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white drop-shadow-sm">
                        {isCardBalanceVisible ? formatBDT(balanceVal, 'en') : '••••••••'}
                      </span>
                    </div>
                  </div>

                  {/* Embossed Card Number */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-base sm:text-lg font-black tracking-[0.16em] text-white/95 drop-shadow-md truncate">
                        {renderEmbossedCardNumber(acc.account_number, acc.account_type)}
                      </p>
                      {acc.account_number && (
                        <button
                          type="button"
                          onClick={() => handleCopy(acc.account_number, acc.id)}
                          className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition cursor-pointer shrink-0 ml-2"
                          title="Copy Account Number"
                        >
                          {copiedId === acc.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Cardholder & Network Badge */}
                  <div className="relative z-10 pt-2 border-t border-white/15 flex items-end justify-between">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/60 block">
                        Cardholder / Label
                      </span>
                      <p className="text-xs font-black uppercase tracking-wider text-white truncate max-w-[170px]">
                        {acc.account_name.includes(' - ') ? acc.account_name.split(' - ')[1] : acc.account_name}
                      </p>
                    </div>

                    <div className="text-center px-2">
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/60 block">
                        Valid Thru
                      </span>
                      <span className="text-[10px] font-mono font-bold text-white tracking-widest">
                        10/30
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-black italic tracking-tighter text-white drop-shadow-sm font-serif">
                        {theme.network}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenHistory(acc)}
                  className="w-full py-2.5 px-4 bg-white hover:bg-rose-50/60 active:scale-98 border border-[#F3D7D9] rounded-2xl text-xs font-bold text-slate-700 hover:text-[#E11D48] transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Clock className="w-3.5 h-3.5 text-[#E11D48]" />
                  <span>Date-by-Date Statement</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. TRANSACTION HISTORY MODAL */}
      {selectedAccountForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#E11D48] flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {selectedAccountForHistory.account_name} Statement
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {renderEmbossedCardNumber(selectedAccountForHistory.account_number, selectedAccountForHistory.account_type)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAccountForHistory(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 divide-y divide-slate-100">
              {historyLoading ? (
                <div className="py-10 text-center text-xs font-bold text-slate-400 animate-pulse">
                  Loading statement records...
                </div>
              ) : historyTransactions.length === 0 ? (
                <div className="py-12 text-center text-xs font-medium text-slate-400">
                  No date-by-date transactions recorded for this account.
                </div>
              ) : (
                historyTransactions.map((tx) => {
                  const isInflow = ['income', 'transfer_in'].includes(tx.type);
                  return (
                    <div key={tx.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/70 px-2 rounded-xl transition">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isInflow ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-[#E11D48]'
                        }`}>
                          {isInflow ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 line-clamp-1">
                            {tx.notes || tx.category || 'Transaction Entry'}
                          </p>
                          <span className="text-[10px] font-bold text-slate-400">
                            {tx.transaction_date}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-xs font-mono font-black ${
                          isInflow ? 'text-emerald-600' : 'text-[#E11D48]'
                        }`}>
                          {isInflow ? '+' : '-'}{formatBDT(tx.amount, 'en')}
                        </p>
                        <span className="text-[9px] font-black uppercase text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded-md">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Current Balance</span>
              <span className="text-sm font-black font-mono text-slate-900">
                {formatBDT(selectedAccountForHistory.balance, 'en')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. EDIT ACCOUNT MODAL */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Edit Vault Card</h3>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Card Name / Label
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Card / Mobile Number
                </label>
                <input
                  type="text"
                  required
                  value={editNumber}
                  onChange={(e) => setEditNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Account Type
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                >
                  <option value="mfs">MFS Wallet (bKash / Nagad / Rocket)</option>
                  <option value="bank">Bank Account</option>
                  <option value="cash">Petty Cash</option>
                  <option value="other">Others</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="py-2.5 px-5 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-bold shadow-md shadow-rose-950/15 disabled:opacity-50 cursor-pointer"
                >
                  {editSubmitting ? 'Saving...' : 'Update Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
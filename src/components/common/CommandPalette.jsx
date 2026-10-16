import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  Wallet,
  FolderKanban,
  HandCoins,
  BarChart3,
  ReceiptText,
  Plus,
  ArrowRightLeft,
  UserCheck,
  LifeBuoy,
  LogOut,
  ArrowRight,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function CommandPalette({
  isOpen = false,
  onClose = () => {},
  onNavigateTab = () => {},
  onOpenAddTx = () => {},
  onOpenTransfer = () => {},
  onOpenAddAccount = () => {},
  onOpenProfile = () => {},
  onOpenSupport = () => {}
}) {
  const { signOut } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  const actions = [
    {
      id: 'add-tx',
      title: 'Add New Transaction',
      subtitle: 'Record income, expense or project voucher',
      icon: Plus,
      category: 'Quick Actions',
      handler: () => {
        onClose();
        onOpenAddTx();
      }
    },
    {
      id: 'transfer',
      title: 'Transfer Funds',
      subtitle: 'Inter-account liquidity movement between vaults',
      icon: ArrowRightLeft,
      category: 'Quick Actions',
      handler: () => {
        onClose();
        onOpenTransfer();
      }
    },
    {
      id: 'add-vault',
      title: 'Issue New Vault Card',
      subtitle: 'Add bank, MFS wallet or petty cash reserve',
      icon: Wallet,
      category: 'Quick Actions',
      handler: () => {
        onClose();
        onOpenAddAccount();
      }
    },
    {
      id: 'nav-dashboard',
      title: 'Dashboard Overview',
      subtitle: 'Net liquidity, balance trends & audit activity',
      icon: LayoutDashboard,
      category: 'Navigation',
      handler: () => {
        onClose();
        onNavigateTab('dashboard');
      }
    },
    {
      id: 'nav-accounts',
      title: 'Accounts & Liquidity Vaults',
      subtitle: 'Embossed cards, bank wallets & balances',
      icon: Wallet,
      category: 'Navigation',
      handler: () => {
        onClose();
        onNavigateTab('accounts');
      }
    },
    {
      id: 'nav-projects',
      title: 'Projects & Cost Centers',
      subtitle: 'Budget allocations and project-level expenses',
      icon: FolderKanban,
      category: 'Navigation',
      handler: () => {
        onClose();
        onNavigateTab('projects');
      }
    },
    {
      id: 'nav-debts',
      title: 'Debts & Loan Settlements',
      subtitle: 'Receivables, payables and loan repayment tracking',
      icon: HandCoins,
      category: 'Navigation',
      handler: () => {
        onClose();
        onNavigateTab('debts');
      }
    },
    {
      id: 'nav-analytics',
      title: 'Financial Analytics & Histograms',
      subtitle: 'Cash flow analytics, net liquidity and projections',
      icon: BarChart3,
      category: 'Navigation',
      handler: () => {
        onClose();
        onNavigateTab('analytics');
      }
    },
    {
      id: 'nav-statements',
      title: 'Statements Audit Ledger',
      subtitle: 'Official bank-grade financial statements & export',
      icon: ReceiptText,
      category: 'Navigation',
      handler: () => {
        onClose();
        onNavigateTab('statements');
      }
    },
    {
      id: 'user-profile',
      title: 'Profile Settings & Security',
      subtitle: 'Update full name, phone, password or avatar photo',
      icon: UserCheck,
      category: 'Account',
      handler: () => {
        onClose();
        onOpenProfile();
      }
    },
    {
      id: 'user-support',
      title: 'Help & Support Desk',
      subtitle: 'Developer contact, bug reports and inquiries',
      icon: LifeBuoy,
      category: 'Account',
      handler: () => {
        onClose();
        onOpenSupport();
      }
    },
    {
      id: 'user-signout',
      title: 'Sign Out Session',
      subtitle: 'Disconnect from this terminal securely',
      icon: LogOut,
      category: 'Account',
      handler: () => {
        onClose();
        if (signOut) signOut();
      }
    }
  ];

  const filteredActions = actions.filter((act) => {
    const q = (query || '').toLowerCase().trim();
    if (!q) return true;
    return (
      act.title.toLowerCase().includes(q) ||
      act.subtitle.toLowerCase().includes(q) ||
      act.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredActions.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filteredActions.length || 1)) % (filteredActions.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].handler();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  useEffect(() => {
    if (listRef.current && listRef.current.children[selectedIndex]) {
      listRef.current.children[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 select-none font-sans">
      
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white border border-[#F3D7D9] rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10">
        
        {/* Search Bar with Cross Close Button */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or jump to module... (e.g. 'statements', 'transfer')"
            className="w-full bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Results */}
        <div 
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2.5 space-y-1"
        >
          {filteredActions.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400">
              No matching commands or routes found for "{query}"
            </div>
          ) : (
            filteredActions.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = selectedIndex === idx;

              return (
                <div
                  key={item.id}
                  onClick={item.handler}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer transition ${
                    isSelected
                      ? 'bg-[#E11D48] text-white shadow-md'
                      : 'text-slate-700 hover:bg-rose-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate text-left leading-tight">
                      <p className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {item.title}
                      </p>
                      <p className={`text-[10px] font-medium truncate mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-3 shrink-0">
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {item.category}
                    </span>
                    <ArrowRight
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'text-white' : 'text-slate-300'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Keyboard Hints Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-mono font-bold text-slate-600">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-mono font-bold text-slate-600">↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-mono font-bold text-slate-600">↵</kbd>
              <span>select</span>
            </span>
          </div>

          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-mono font-bold text-slate-600">esc</kbd>
            <span>close</span>
          </span>
        </div>

      </div>
    </div>
  );
}
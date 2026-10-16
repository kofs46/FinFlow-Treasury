import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  Wallet
} from 'lucide-react';

export default function SpeedDialFAB({ 
  onOpenAddExpense = () => {}, 
  onOpenAddIncome = () => {}, 
  onOpenTransfer = () => {}, 
  onOpenAddVault = () => {} 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fabRef.current && !fabRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const actions = [
    {
      id: 'income',
      label: 'Log Income',
      icon: ArrowDownLeft,
      color: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25',
      handler: () => {
        setIsOpen(false);
        onOpenAddIncome();
      }
    },
    {
      id: 'expense',
      label: 'Add Expense',
      icon: ArrowUpRight,
      color: 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25',
      handler: () => {
        setIsOpen(false);
        onOpenAddExpense();
      }
    },
    {
      id: 'transfer',
      label: 'Fast Transfer',
      icon: ArrowRightLeft,
      color: 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/25',
      handler: () => {
        setIsOpen(false);
        onOpenTransfer();
      }
    },
    {
      id: 'vault',
      label: 'New Vault Card',
      icon: Wallet,
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25',
      handler: () => {
        setIsOpen(false);
        onOpenAddVault();
      }
    }
  ];

  return (
    <div 
      ref={fabRef} 
      className="fixed bottom-20 md:bottom-8 right-5 sm:right-8 z-40 flex flex-col items-end select-none print:hidden"
    >
      {/* Speed Dial Menu Actions (Stacked Upward) */}
      <div 
        className={`flex flex-col items-end gap-2.5 mb-3 transition-all duration-200 ${
          isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <div key={act.id} className="flex items-center gap-2.5">
              <span className="py-1 px-2.5 rounded-xl bg-slate-900/90 text-white text-[11px] font-bold shadow-md whitespace-nowrap">
                {act.label}
              </span>
              <button
                type="button"
                onClick={act.handler}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer ${act.color}`}
                title={act.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Main Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-950/20 transition-all duration-300 active:scale-90 cursor-pointer ${
          isOpen ? 'bg-slate-900 rotate-45' : 'bg-[#E11D48] hover:bg-[#BE123C] rotate-0'
        }`}
        title="Quick Financial Actions"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
}
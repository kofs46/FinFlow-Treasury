import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Layers, 
  X, 
  ChevronRight,
  ShieldAlert,
  Calendar
} from 'lucide-react';

export default function NotificationDropdown({ onNavigateTab }) {
  const { user } = useAuth();
  const { lang } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [user]);

  const loadNotifications = async () => {
    try {
      const generated = [];

      // 1. Scan for Overdue Debts
      const { data: debts } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'settled');

      const today = new Date().toISOString().substring(0, 10);
      if (debts) {
        debts.forEach((d) => {
          if (d.due_date && d.due_date <= today) {
            generated.push({
              id: `debt-${d.id}`,
              title: lang === 'bn' ? 'মেয়াদোত্তীর্ণ ঋণের সতর্কতা' : 'Overdue Debt Obligation',
              message: `${d.contact_name}: ৳${Number(d.remaining_amount).toLocaleString()} (${d.debt_type})`,
              type: 'alert',
              linkTab: 'debts',
              time: d.due_date
            });
          }
        });
      }

      // 2. Scan for Upcoming Recurring Commitments within next 5 days
      const { data: recs } = await supabase
        .from('recurring_commitments')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const currentDay = new Date().getDate();
      if (recs) {
        recs.forEach((r) => {
          const daysLeft = r.due_day - currentDay;
          if (daysLeft >= 0 && daysLeft <= 5) {
            generated.push({
              id: `rec-${r.id}`,
              title: lang === 'bn' ? 'আসন্ন মাসিক ব্যয়' : 'Upcoming Overhead Commitment',
              message: `${r.title}: ৳${Number(r.amount).toLocaleString()} (Due day ${r.due_day})`,
              type: 'warning',
              linkTab: 'reconcile',
              time: `${daysLeft === 0 ? 'Today' : `${daysLeft} days left`}`
            });
          }
        });
      }

      // 3. Scan for Pending NBR VAT/TDS Challans
      const { data: tax } = await supabase
        .from('tax_withholdings')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending_challan');

      if (tax && tax.length > 0) {
        const totalPendingTax = tax.reduce((s, t) => s + Number(t.tds_amount) + Number(t.vds_amount), 0);
        generated.push({
          id: 'nbr-tax-alert',
          title: lang === 'bn' ? 'এনবিআর উৎসে কর চালান বকেয়া' : 'Pending NBR Tax Withholding Deposit',
          message: `Total ৳${totalPendingTax.toLocaleString()} TDS/VDS pending treasury deposit`,
          type: 'warning',
          linkTab: 'reconcile',
          time: 'Requires Challan'
        });
      }

      setNotifications(generated);
    } catch (err) {
      console.error('Error generating notifications:', err);
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-[#E11D48] hover:bg-rose-50 border border-slate-200 transition cursor-pointer flex items-center justify-center shrink-0"
        title={lang === 'bn' ? 'নোটিফিকেশন সেন্টার' : 'Notifications'}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E11D48] text-[9px] font-black text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white border border-[#F3D7D9] shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
            <div className="flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-[#E11D48]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                {lang === 'bn' ? 'ট্রেজারি নোটিফিকেশন' : 'Treasury Intelligence Alerts'}
              </h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-[#E11D48] border border-rose-200">
              {unreadCount} {lang === 'bn' ? 'টি এলার্ট' : 'Active'}
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-bold">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p>{lang === 'bn' ? 'সব ঠিক আছে! কোনো বকেয়া বা জরুরি এলার্ট নেই।' : 'Treasury healthy! No overdue or pending alerts.'}</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (onNavigateTab && item.linkTab) onNavigateTab(item.linkTab);
                    setIsOpen(false);
                  }}
                  className="pt-2 p-2 rounded-2xl hover:bg-rose-50/60 transition cursor-pointer flex items-start gap-3"
                >
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    item.type === 'alert' ? 'bg-rose-100 text-[#E11D48]' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.type === 'alert' ? <ShieldAlert className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-black text-slate-900 truncate">{item.title}</p>
                      <span className="text-[9px] font-mono font-bold text-slate-400 shrink-0">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-medium leading-relaxed">{item.message}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 self-center" />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
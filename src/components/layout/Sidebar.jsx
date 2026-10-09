import React from 'react';
import { useLang } from '../../context/LangContext';
import { 
  LayoutDashboard, 
  Wallet, 
  Briefcase, 
  HandCoins, 
  BarChart3, 
  FileSpreadsheet,
  Scale,
  Headphones
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onOpenContact }) {
  const { lang } = useLang();

  const navigation = [
    { id: 'dashboard', labelBn: 'ড্যাশবোর্ড', labelEn: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', labelBn: 'অ্যাকাউন্ট ও ওয়ালেট', labelEn: 'Accounts & Wallets', icon: Wallet },
    { id: 'projects', labelBn: 'প্রজেক্ট লেজার', labelEn: 'Projects Ledger', icon: Briefcase },
    { id: 'debts', labelBn: 'দেনা-পাওনা ট্র্যাকার', labelEn: 'Debts & Lending', icon: HandCoins },
    { id: 'reconcile', labelBn: 'ট্যাক্স ও কমপ্লায়েন্স', labelEn: 'Tax & Compliance', icon: Scale },
    { id: 'analytics', labelBn: 'অ্যানালিটিক্স', labelEn: 'Analytics', icon: BarChart3 },
    { id: 'statements', labelBn: 'অডিট স্টেটমেন্ট', labelEn: 'Statements & Audit', icon: FileSpreadsheet },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-[#F3D7D9] bg-white p-4 justify-between h-[calc(100vh-4rem)] sticky top-16 shrink-0 transition-all">
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
          {lang === 'bn' ? 'মূল মেন্যু' : 'Main Navigation'}
        </p>
        
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#E11D48] text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-600 hover:text-[#E11D48] hover:bg-rose-50/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="tracking-tight">{lang === 'bn' ? item.labelBn : item.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Support Box */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200/70 text-slate-900 shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider text-[#E11D48]">Support Online</span>
        </div>
        <p className="text-xs font-bold text-slate-800">KOFS Engineering</p>
        <p className="text-[10px] text-slate-500 mt-0.5">24/7 Treasury Helpdesk</p>
        <button
          onClick={onOpenContact}
          className="mt-3 w-full py-2 bg-[#E11D48] hover:bg-[#BE123C] text-white text-[11px] font-black rounded-xl shadow-md shadow-rose-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'যোগাযোগ করুন' : 'Connect Agent'}</span>
        </button>
      </div>
    </aside>
  );
}
import React from 'react';
import { Landmark, Wallet, Banknote, Sparkles } from 'lucide-react';

export const BrandLogo = ({ name = '', type = '', className = "w-7 h-7" }) => {
  const lower = name.toLowerCase();

  // MFS
  if (lower.includes('bkash')) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-[#e2136e] p-1 shadow-xs ${className}`}>
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 15L85 45H58L50 15Z" fill="#FFFFFF"/>
          <path d="M15 45L50 15V45H15Z" fill="#FCE4EC"/>
          <path d="M15 45L50 85L35 45H15Z" fill="#FFFFFF"/>
          <path d="M50 85L85 45H62L50 85Z" fill="#FCE4EC"/>
        </svg>
      </div>
    );
  }

  if (lower.includes('nagad')) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#f15a24] to-[#f7931e] p-1 shadow-xs ${className}`}>
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="38" stroke="#FFFFFF" strokeWidth="10" strokeDasharray="140 50"/>
          <path d="M38 62L62 38M62 38H45M62 38V55" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }

  if (lower.includes('rocket')) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-[#8c3494] p-1 shadow-xs ${className}`}>
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 12C50 12 65 30 65 55L50 70L35 55C35 30 50 12 50 12Z" fill="#FFFFFF"/>
          <path d="M35 55L20 68L32 75L40 65L35 55Z" fill="#F3E5F5"/>
          <path d="M65 55L80 68L68 75L60 65L65 55Z" fill="#F3E5F5"/>
          <circle cx="50" cy="40" r="7" fill="#8c3494"/>
        </svg>
      </div>
    );
  }

  if (lower.includes('upay')) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-[#005c9e] p-1 shadow-xs ${className}`}>
        <span className="text-white font-black text-[10px] tracking-tight">upay</span>
      </div>
    );
  }

  if (lower.includes('cellfin')) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-[#00897b] p-1 shadow-xs ${className}`}>
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <rect x="25" y="15" width="50" height="70" rx="10" stroke="#FFFFFF" strokeWidth="8"/>
          <circle cx="50" cy="72" r="5" fill="#FFFFFF"/>
          <path d="M38 32H62M38 42H54" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round"/>
        </svg>
      </div>
    );
  }

  // Banks
  if (lower.includes('city bank')) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-[#d32f2f] text-white font-black text-[9px] shadow-xs ${className}`}>
        CITY
      </div>
    );
  }

  if (lower.includes('brac')) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-[#0054a6] text-white font-black text-[9px] shadow-xs ${className}`}>
        BRAC
      </div>
    );
  }

  if (lower.includes('dbbl') || lower.includes('dutch-bangla')) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-[#1b5e20] text-white font-black text-[8px] shadow-xs ${className}`}>
        DBBL
      </div>
    );
  }

  if (lower.includes('islami bank') || lower.includes('ibbl')) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-[#00796b] text-white font-black text-[9px] shadow-xs ${className}`}>
        IBBL
      </div>
    );
  }

  if (lower.includes('ebl') || lower.includes('eastern')) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-[#0288d1] text-white font-black text-[9px] shadow-xs ${className}`}>
        EBL
      </div>
    );
  }

  // Fallback Type Icons
  if (type === 'bank' || lower.includes('bank')) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-blue-100 text-blue-700 ${className}`}>
        <Landmark className="w-4 h-4" />
      </div>
    );
  }
  if (type === 'cash' || lower.includes('cash')) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 ${className}`}>
        <Banknote className="w-4 h-4" />
      </div>
    );
  }
  if (type === 'mfs') {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-pink-100 text-pink-700 ${className}`}>
        <Wallet className="w-4 h-4" />
      </div>
    );
  }
  return (
    <div className={`flex items-center justify-center rounded-xl bg-purple-100 text-purple-700 ${className}`}>
      <Sparkles className="w-4 h-4" />
    </div>
  );
};
import React, { useState } from 'react';
import { Wallet, Landmark, Banknote } from 'lucide-react';

// Verified CDN & Official Vector/PNG Logos for Bangladeshi Banks & MFS
const BRAND_ASSETS = {
  // --- MFS & Digital Wallets ---
  bkash: {
    name: 'bKash',
    logo: 'https://raw.githubusercontent.com/freepnglogos/logos/main/bkash-logo-transparent.png',
    bg: '#E2136E',
    fallbackText: 'bKash'
  },
  nagad: {
    name: 'Nagad',
    logo: 'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png',
    bg: '#F7941D',
    fallbackText: 'Nagad'
  },
  rocket: {
    name: 'Rocket',
    logo: 'https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D1CC458D-seeklogo.com.png',
    bg: '#8C3494',
    fallbackText: 'Rocket'
  },
  upay: {
    name: 'Upay',
    logo: 'https://seeklogo.com/images/U/upay-logo-858348278E-seeklogo.com.png',
    bg: '#FFCC00',
    fallbackText: 'Upay'
  },

  // --- Major Commercial Banks ---
  brac: {
    name: 'BRAC Bank',
    logo: 'https://seeklogo.com/images/B/brac-bank-logo-F91A82A02C-seeklogo.com.png',
    bg: '#004A99',
    fallbackText: 'BRAC'
  },
  city: {
    name: 'City Bank',
    logo: 'https://seeklogo.com/images/T/the-city-bank-ltd-logo-62C30BCAE6-seeklogo.com.png',
    bg: '#ED1C24',
    fallbackText: 'City'
  },
  dbbl: {
    name: 'Dutch-Bangla Bank',
    logo: 'https://seeklogo.com/images/D/dutch-bangla-bank-logo-8A1C007C1C-seeklogo.com.png',
    bg: '#006633',
    fallbackText: 'DBBL'
  },
  ebl: {
    name: 'Eastern Bank (EBL)',
    logo: 'https://seeklogo.com/images/E/eastern-bank-limited-ebl-logo-F7C4402636-seeklogo.com.png',
    bg: '#004B8D',
    fallbackText: 'EBL'
  },
  islami: {
    name: 'Islami Bank (IBBL)',
    logo: 'https://seeklogo.com/images/I/islami-bank-bangladesh-ltd-logo-30A8D252E4-seeklogo.com.png',
    bg: '#006A4E',
    fallbackText: 'IBBL'
  },
  sonali: {
    name: 'Sonali Bank',
    logo: 'https://seeklogo.com/images/S/sonali-bank-limited-logo-F7EF43C9BD-seeklogo.com.png',
    bg: '#F58220',
    fallbackText: 'Sonali'
  },
  mtb: {
    name: 'Mutual Trust Bank (MTB)',
    logo: 'https://seeklogo.com/images/M/mutual-trust-bank-ltd-mtb-logo-7E3DFDF7B2-seeklogo.com.png',
    bg: '#D32F2F',
    fallbackText: 'MTB'
  },
  prime: {
    name: 'Prime Bank',
    logo: 'https://seeklogo.com/images/P/prime-bank-limited-logo-DF0B06EC30-seeklogo.com.png',
    bg: '#0054A6',
    fallbackText: 'Prime'
  },
  pubali: {
    name: 'Pubali Bank',
    logo: 'https://seeklogo.com/images/P/pubali-bank-limited-logo-3EE1A7CD83-seeklogo.com.png',
    bg: '#006837',
    fallbackText: 'Pubali'
  },
  trust: {
    name: 'Trust Bank',
    logo: 'https://seeklogo.com/images/T/trust-bank-limited-logo-9ED3F69A9F-seeklogo.com.png',
    bg: '#1A4D2E',
    fallbackText: 'Trust'
  },
  bankasia: {
    name: 'Bank Asia',
    logo: 'https://seeklogo.com/images/B/bank-asia-logo-4CDA686D7D-seeklogo.com.png',
    bg: '#002B49',
    fallbackText: 'Bank Asia'
  },
  ucb: {
    name: 'UCB Bank',
    logo: 'https://seeklogo.com/images/U/united-commercial-bank-ucb-logo-EB2ED5FD7C-seeklogo.com.png',
    bg: '#ED1C24',
    fallbackText: 'UCB'
  }
};

export function BrandLogo({ name = '', type = '', className = 'w-9 h-9' }) {
  const [imgError, setImgError] = useState(false);
  const cleanName = (name || '').toLowerCase().trim();

  // 1. Detect Cash
  if (cleanName.includes('cash') || cleanName.includes('petty') || type === 'cash') {
    return (
      <div className={`${className} rounded-2xl bg-emerald-600 flex items-center justify-center p-2 shadow-xs shrink-0`}>
        <Banknote className="w-full h-full text-white" />
      </div>
    );
  }

  // 2. Identify Brand Key
  let brandKey = null;
  if (cleanName.includes('bkash')) brandKey = 'bkash';
  else if (cleanName.includes('nagad')) brandKey = 'nagad';
  else if (cleanName.includes('rocket')) brandKey = 'rocket';
  else if (cleanName.includes('upay')) brandKey = 'upay';
  else if (cleanName.includes('brac')) brandKey = 'brac';
  else if (cleanName.includes('city')) brandKey = 'city';
  else if (cleanName.includes('dbbl') || cleanName.includes('dutch bangla') || cleanName.includes('dutch-bangla')) brandKey = 'dbbl';
  else if (cleanName.includes('ebl') || cleanName.includes('eastern bank')) brandKey = 'ebl';
  else if (cleanName.includes('islami') || cleanName.includes('ibbl')) brandKey = 'islami';
  else if (cleanName.includes('sonali')) brandKey = 'sonali';
  else if (cleanName.includes('mtb') || cleanName.includes('mutual trust')) brandKey = 'mtb';
  else if (cleanName.includes('prime bank')) brandKey = 'prime';
  else if (cleanName.includes('pubali')) brandKey = 'pubali';
  else if (cleanName.includes('trust bank')) brandKey = 'trust';
  else if (cleanName.includes('bank asia')) brandKey = 'bankasia';
  else if (cleanName.includes('ucb') || cleanName.includes('united commercial')) brandKey = 'ucb';

  const brand = brandKey ? BRAND_ASSETS[brandKey] : null;

  // 3. Render High-Resolution Brand Logo if matched and image loads
  if (brand && !imgError) {
    return (
      <div 
        className={`${className} rounded-2xl bg-white border border-slate-100 flex items-center justify-center p-1 shadow-xs shrink-0 overflow-hidden`}
        title={brand.name}
      >
        <img 
          src={brand.logo} 
          alt={brand.name} 
          onError={() => setImgError(true)}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  // 4. Smart Typography Fallback with Brand Colors
  if (brand && imgError) {
    return (
      <div 
        className={`${className} rounded-2xl flex items-center justify-center text-white font-black text-[10px] tracking-tight shadow-xs shrink-0 p-1`}
        style={{ backgroundColor: brand.bg }}
        title={brand.name}
      >
        {brand.fallbackText}
      </div>
    );
  }

  // 5. Default Scheduled Bank Fallback
  if (type === 'bank' || cleanName.includes('bank')) {
    return (
      <div className={`${className} rounded-2xl bg-slate-900 flex items-center justify-center p-2 shadow-xs shrink-0`}>
        <Landmark className="w-full h-full text-white" />
      </div>
    );
  }

  // 6. Generic MFS / Wallet Fallback
  return (
    <div className={`${className} rounded-2xl bg-[#E11D48] flex items-center justify-center p-2 shadow-xs shrink-0`}>
      <Wallet className="w-full h-full text-white" />
    </div>
  );
}
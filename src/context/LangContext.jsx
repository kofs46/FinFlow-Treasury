import React, { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    appTitle: "FinFlow Treasury",
    subTitle: "Real-time Financial Audit & Liquidity Tracker",
    dashboard: "Dashboard",
    accounts: "Accounts & Wallets",
    projects: "Project Ledger",
    debts: "Debt Tracker",
    analytics: "Analytics",
    statements: "Statements",
    totalLiquidity: "Total Net Liquidity",
    totalBalanceDesc: "Total Net Balance Across All Vaults",
    liveAudit: "Real-Time Treasury Overview",
    transfer: "Fund Transfer",
    addAccount: "Add Account",
    addProject: "New Project",
    addDebt: "Record Loan / Debt",
    walletsTitle: "Institutional Accounts & Wallets",
    noAccounts: "No accounts connected yet.",
    noAccountsDesc: "Add bKash, Nagad, Bank, or Cash wallets to start tracking.",
    accountsCount: "Accounts",
    verified: "Verified",
    save: "Save Changes",
    cancel: "Cancel",
    profileSettings: "Profile Settings",
    profileSubtitle: "Manage your identity & personal details",
    profileUpdated: "Profile updated successfully!",
    fullName: "Full Name",
    phone: "Phone Number",
    address: "Address",
    changePhoto: "Click camera to change photo",
    uploading: "Uploading...",
    saving: "Saving...",
    contactDev: "Developer & Treasury Support",
    contactSubtitle: "Get in touch directly with the system architect",
    rightsReserved: "All rights reserved.",
    craftedBy: "Architected & Maintained by"
  },
  bn: {
    appTitle: "ফিনফ্লো ট্রেজারি",
    subTitle: "রিয়েল-টাইম আর্থিক নিরীক্ষা ও তারল্য ট্র্যাকার",
    dashboard: "ড্যাশবোর্ড",
    accounts: "অ্যাকাউন্ট ও ওয়ালেট",
    projects: "প্রজেক্ট লেজার",
    debts: "দেনা-পাওনা ট্র্যাকার",
    analytics: "অ্যানালিটিক্স",
    statements: "স্টেটমেন্ট",
    totalLiquidity: "সর্বমোট তরল সম্পদ",
    totalBalanceDesc: "সকল অ্যাকাউন্টের মোট অবশিষ্ট ব্যালেন্স",
    liveAudit: "লাইভ ট্রেজারি অডিট",
    transfer: "তহবিল স্থানান্তর",
    addAccount: "অ্যাকাউন্ট যোগ",
    addProject: "নতুন প্রজেক্ট",
    addDebt: "ধার / ঋণ রেকর্ড",
    walletsTitle: "অ্যাকাউন্ট ও ওয়ালেট তালিকা",
    noAccounts: "এখনো কোনো অ্যাকাউন্ট যোগ করা হয়নি।",
    noAccountsDesc: "bKash, Nagad, Bank বা Cash ওয়ালেট যুক্ত করে শুরু করুন।",
    accountsCount: "টি অ্যাকাউন্ট",
    verified: "যাচাইকৃত",
    save: "পরিবর্তন সংরক্ষণ করুন",
    cancel: "বাতিল",
    profileSettings: "প্রোফাইল সেটিংস",
    profileSubtitle: "আপনার ব্যক্তিগত তথ্য ও ছবি আপডেট করুন",
    profileUpdated: "প্রোফাইল সফলভাবে আপডেট হয়েছে!",
    fullName: "পূর্ণ নাম",
    phone: "ফোন নম্বর",
    address: "ঠিকানা",
    changePhoto: "ছবি পরিবর্তন করতে ক্যামেরা আইকনে চাপুন",
    uploading: "আপলোড হচ্ছে...",
    saving: "সংরক্ষণ হচ্ছে...",
    contactDev: "ডেভেলপার ও টেকনিক্যাল সাপোর্ট",
    contactSubtitle: "সিস্টেম আর্কিটেক্টের সাথে সরাসরি যোগাযোগ করুন",
    rightsReserved: "সর্বস্বত্ব সংরক্ষিত।",
    craftedBy: "ডিজাইন ও ডেভেলপমেন্টে"
  }
};

const LangContext = createContext();

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('finflow_lang') || 'en');

  const toggleLang = () => {
    const nextLang = lang === 'bn' ? 'en' : 'bn';
    setLang(nextLang);
    localStorage.setItem('finflow_lang', nextLang);
  };

  const t = (key) => translations[lang]?.[key] || key;

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
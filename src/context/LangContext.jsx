import React, { createContext, useContext } from 'react';

const LangContext = createContext();

export const LangProvider = ({ children }) => {
  const lang = 'en';

  // Direct English dictionary
  const translations = {
    dashboard: 'Dashboard',
    accounts: 'Accounts & Wallets',
    projects: 'Projects Ledger',
    debts: 'Debts & Lending',
    reconcile: 'Tax & Compliance',
    analytics: 'Analytics',
    statements: 'Statements & Audit',
    subTitle: 'Real-time Financial Audit & Liquidity Tracker',
  };

  const t = (key) => translations[key] || key;
  const toggleLang = () => {}; // Disabled for strictly English

  return (
    <LangContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
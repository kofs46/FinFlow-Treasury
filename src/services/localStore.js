// src/services/localStore.js

const STORAGE_KEY = 'finflow_local_treasury_v1';

const defaultTreasuryData = {
  accounts: [],
  transactions: [],
  debts: [],
  projects: [],
  lastUpdated: new Date().toISOString()
};

export const getLocalTreasuryData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultTreasuryData;
    const parsed = JSON.parse(raw);
    return {
      accounts: Array.isArray(parsed?.accounts) ? parsed.accounts : [],
      transactions: Array.isArray(parsed?.transactions) ? parsed.transactions : [],
      debts: Array.isArray(parsed?.debts) ? parsed.debts : [],
      projects: Array.isArray(parsed?.projects) ? parsed.projects : [],
      lastUpdated: parsed?.lastUpdated || new Date().toISOString()
    };
  } catch (err) {
    console.warn('Error reading local treasury data:', err);
    return defaultTreasuryData;
  }
};

export const saveLocalTreasuryData = (data) => {
  try {
    const payload = {
      ...defaultTreasuryData,
      ...data,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload;
  } catch (err) {
    console.error('Error saving local treasury data:', err);
    return null;
  }
};

export const localDB = {
  getAccounts: () => getLocalTreasuryData().accounts || [],
  saveAccount: (account) => {
    const current = getLocalTreasuryData();
    const newAccount = {
      ...account,
      id: account.id || 'acc_' + Date.now(),
      created_at: account.created_at || new Date().toISOString()
    };
    current.accounts = [newAccount, ...(current.accounts || [])];
    saveLocalTreasuryData(current);
    return newAccount;
  },
  updateAccount: (id, updatedFields) => {
    const current = getLocalTreasuryData();
    current.accounts = (current.accounts || []).map(acc => 
      acc.id === id ? { ...acc, ...updatedFields } : acc
    );
    saveLocalTreasuryData(current);
  },
  deleteAccount: (id) => {
    const current = getLocalTreasuryData();
    current.accounts = (current.accounts || []).filter(acc => acc.id !== id);
    saveLocalTreasuryData(current);
  },
  getTransactions: () => getLocalTreasuryData().transactions || [],
  saveTransaction: (tx) => {
    const current = getLocalTreasuryData();
    const newTx = {
      ...tx,
      id: tx.id || 'tx_' + Date.now(),
      created_at: tx.created_at || new Date().toISOString()
    };
    current.transactions = [newTx, ...(current.transactions || [])];
    saveLocalTreasuryData(current);
    return newTx;
  }
};
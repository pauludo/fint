import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const FinanceContext = createContext();

export const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', rate: 1.0 },
  EUR: { symbol: '€', name: 'Euro', rate: 0.92 },
  GBP: { symbol: '£', name: 'British Pound', rate: 0.79 },
  CAD: { symbol: 'CA$', name: 'Canadian Dollar', rate: 1.36 },
  NGN: { symbol: '₦', name: 'Nigerian Naira', rate: 1450.0 },
  JPY: { symbol: '¥', name: 'Japanese Yen', rate: 155.2 },
  AUD: { symbol: 'A$', name: 'Australian Dollar', rate: 1.52 }
};

export function FinanceProvider({ children }) {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgetsData, setBudgetsData] = useState(null);
  const [subscriptionsData, setSubscriptionsData] = useState(null);
  const [goalsData, setGoalsData] = useState(null);
  const [reportsData, setReportsData] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [loading, setLoading] = useState(false);

  // Global UI States
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState('expense');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [theme, setTheme] = useState(() => localStorage.getItem('fintrack_theme') || 'dark');

  // Sync theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('fintrack_theme', theme);
  }, [theme]);

  // The base currency is the currency the user chose at signup.
  // It is the denomination in which ALL stored amounts are expressed.
  // It should never change (it's baked into every stored number).
  const baseCurrency = (user?.base_currency && CURRENCIES[user.base_currency])
    ? user.base_currency
    : 'USD';

  // Set user's preferred display currency on login
  useEffect(() => {
    if (user?.base_currency && CURRENCIES[user.base_currency]) {
      setSelectedCurrency(user.base_currency);
    }
  }, [user]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Convert and format currency amounts.
  //
  // Stored amounts are denominated in the user's BASE currency (chosen at signup).
  // To display in any other currency we do a two-step conversion:
  //
  //   stored (base) ──÷ baseRate──► USD ──× displayRate──► displayed
  //
  // This means switching the display currency never mutates the underlying data.
  // USD users: baseRate = 1.0, so formula reduces to the original behaviour.
  const formatCurrency = useCallback((amount, overrideCurrency) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      const fallbackSym = CURRENCIES[overrideCurrency || selectedCurrency]?.symbol ||
                          CURRENCIES[baseCurrency]?.symbol || '$';
      return `${fallbackSym}0.00`;
    }

    const displayCode = overrideCurrency || selectedCurrency;
    const displayCurr = CURRENCIES[displayCode] || CURRENCIES.USD;
    const baseCurr    = CURRENCIES[baseCurrency] || CURRENCIES.USD;

    // Step 1: normalise to USD equivalent
    const amountInUSD = amount / baseCurr.rate;
    // Step 2: convert from USD to the display currency
    const converted = amountInUSD * displayCurr.rate;

    const formattedNumber = Math.abs(converted).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const prefix = amount < 0 ? '-' : '';
    return `${prefix}${displayCurr.symbol}${formattedNumber}`;
  }, [selectedCurrency, baseCurrency]);

  // Main data fetcher
  const refreshAllData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [accs, cats, txs, bgts, subs, gls, rpts, ins] = await Promise.all([
        api.getAccounts().catch(() => []),
        api.getCategories().catch(() => []),
        api.getTransactions({ limit: 150 }).catch(() => ({ transactions: [] })),
        api.getBudgets().catch(() => null),
        api.getSubscriptions().catch(() => null),
        api.getGoals().catch(() => null),
        api.getReportsSummary().catch(() => null),
        api.getAIInsights().catch(() => [])
      ]);

      setAccounts(accs);
      setCategories(cats);
      setTransactions(txs?.transactions || []);
      setBudgetsData(bgts);
      setSubscriptionsData(subs);
      setGoalsData(gls);
      setReportsData(rpts);
      setAiInsights(ins);
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshAllData();
    } else {
      setAccounts([]);
      setCategories([]);
      setTransactions([]);
      setBudgetsData(null);
      setSubscriptionsData(null);
      setGoalsData(null);
      setReportsData(null);
      setAiInsights([]);
    }
  }, [user, refreshAllData]);

  // Compute live Net Worth
  const totalAssets = accounts.filter(a => a.balance > 0).reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.balance < 0).reduce((sum, a) => sum + Math.abs(a.balance), 0);
  const netWorth = totalAssets - totalLiabilities;

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        categories,
        transactions,
        budgetsData,
        subscriptionsData,
        goalsData,
        reportsData,
        aiInsights,
        loading,
        netWorth,
        totalAssets,
        totalLiabilities,
        baseCurrency,
        selectedCurrency,
        setSelectedCurrency,
        theme,
        toggleTheme,
        formatCurrency,
        refreshAllData,
        isAiDrawerOpen,
        setIsAiDrawerOpen,
        isQuickAddOpen,
        setIsQuickAddOpen,
        quickAddType,
        setQuickAddType
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}

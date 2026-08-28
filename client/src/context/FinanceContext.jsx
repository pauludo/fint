import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const FinanceContext = createContext();

export const CURRENCIES = {
  USD: { symbol: '$',    name: 'US Dollar',          rate: 1.0     },
  EUR: { symbol: '€',    name: 'Euro',                rate: 0.92    },
  GBP: { symbol: '£',    name: 'British Pound',       rate: 0.79    },
  CAD: { symbol: 'CA$',  name: 'Canadian Dollar',     rate: 1.36    },
  AUD: { symbol: 'A$',   name: 'Australian Dollar',   rate: 1.52    },
  JPY: { symbol: '¥',    name: 'Japanese Yen',        rate: 155.2   },
  CHF: { symbol: 'CHF',  name: 'Swiss Franc',         rate: 0.90    },
  CNY: { symbol: '¥',    name: 'Chinese Yuan',        rate: 7.24    },
  INR: { symbol: '₹',    name: 'Indian Rupee',        rate: 83.5    },
  BRL: { symbol: 'R$',   name: 'Brazilian Real',      rate: 5.05    },
  MXN: { symbol: '$',    name: 'Mexican Peso',        rate: 17.15   },
  SGD: { symbol: 'S$',   name: 'Singapore Dollar',    rate: 1.35    },
  HKD: { symbol: 'HK$',  name: 'Hong Kong Dollar',   rate: 7.82    },
  NZD: { symbol: 'NZ$',  name: 'New Zealand Dollar',  rate: 1.63    },
  SEK: { symbol: 'kr',   name: 'Swedish Krona',       rate: 10.45   },
  NOK: { symbol: 'kr',   name: 'Norwegian Krone',     rate: 10.60   },
  DKK: { symbol: 'kr',   name: 'Danish Krone',        rate: 6.88    },
  ZAR: { symbol: 'R',    name: 'South African Rand',  rate: 18.60   },
  NGN: { symbol: '₦',    name: 'Nigerian Naira',      rate: 1450.0  },
  GHS: { symbol: 'GH₵', name: 'Ghanaian Cedi',       rate: 15.50   },
  KES: { symbol: 'KSh',  name: 'Kenyan Shilling',     rate: 129.0   },
  EGP: { symbol: 'E£',   name: 'Egyptian Pound',      rate: 30.90   },
  AED: { symbol: 'AED',  name: 'UAE Dirham',          rate: 3.67    },
  SAR: { symbol: 'SR',   name: 'Saudi Riyal',         rate: 3.75    },
  QAR: { symbol: 'QR',   name: 'Qatari Riyal',        rate: 3.64    },
  PKR: { symbol: '₨',    name: 'Pakistani Rupee',     rate: 278.0   },
  BDT: { symbol: '৳',    name: 'Bangladeshi Taka',    rate: 110.0   },
  IDR: { symbol: 'Rp',   name: 'Indonesian Rupiah',   rate: 15700.0 },
  MYR: { symbol: 'RM',   name: 'Malaysian Ringgit',   rate: 4.70    },
  PHP: { symbol: '₱',    name: 'Philippine Peso',     rate: 56.5    },
  THB: { symbol: '฿',    name: 'Thai Baht',           rate: 35.10   },
  VND: { symbol: '₫',    name: 'Vietnamese Dong',     rate: 24200.0 },
  KRW: { symbol: '₩',    name: 'South Korean Won',    rate: 1325.0  },
  TWD: { symbol: 'NT$',  name: 'Taiwan Dollar',       rate: 32.10   },
  TRY: { symbol: '₺',    name: 'Turkish Lira',        rate: 32.50   },
  PLN: { symbol: 'zł',   name: 'Polish Złoty',        rate: 3.95    },
  CZK: { symbol: 'Kč',   name: 'Czech Koruna',        rate: 23.20   },
  HUF: { symbol: 'Ft',   name: 'Hungarian Forint',    rate: 358.0   },
  RON: { symbol: 'lei',  name: 'Romanian Leu',        rate: 4.58    },
  UAH: { symbol: '₴',    name: 'Ukrainian Hryvnia',   rate: 38.90   },
  ILS: { symbol: '₪',    name: 'Israeli Shekel',      rate: 3.73    },
  CLP: { symbol: '$',    name: 'Chilean Peso',        rate: 930.0   },
  COP: { symbol: '$',    name: 'Colombian Peso',      rate: 3940.0  },
  ARS: { symbol: '$',    name: 'Argentine Peso',      rate: 855.0   },
  PEN: { symbol: 'S/',   name: 'Peruvian Sol',        rate: 3.72    },
};

/**
 * COUNTRY_MAP: maps ISO 3166-1 alpha-2 country codes to display info + currency code.
 * Grouped by region for the selector UI.
 */
export const COUNTRY_MAP = {
  // ── North America ──
  US: { name: 'United States',       flag: '🇺🇸', currency: 'USD', region: 'Americas'    },
  CA: { name: 'Canada',              flag: '🇨🇦', currency: 'CAD', region: 'Americas'    },
  MX: { name: 'Mexico',              flag: '🇲🇽', currency: 'MXN', region: 'Americas'    },

  // ── South America ──
  BR: { name: 'Brazil',              flag: '🇧🇷', currency: 'BRL', region: 'Americas'    },
  AR: { name: 'Argentina',           flag: '🇦🇷', currency: 'ARS', region: 'Americas'    },
  CL: { name: 'Chile',               flag: '🇨🇱', currency: 'CLP', region: 'Americas'    },
  CO: { name: 'Colombia',            flag: '🇨🇴', currency: 'COP', region: 'Americas'    },
  PE: { name: 'Peru',                flag: '🇵🇪', currency: 'PEN', region: 'Americas'    },

  // ── Western Europe ──
  GB: { name: 'United Kingdom',      flag: '🇬🇧', currency: 'GBP', region: 'Europe'      },
  DE: { name: 'Germany',             flag: '🇩🇪', currency: 'EUR', region: 'Europe'      },
  FR: { name: 'France',              flag: '🇫🇷', currency: 'EUR', region: 'Europe'      },
  IT: { name: 'Italy',               flag: '🇮🇹', currency: 'EUR', region: 'Europe'      },
  ES: { name: 'Spain',               flag: '🇪🇸', currency: 'EUR', region: 'Europe'      },
  PT: { name: 'Portugal',            flag: '🇵🇹', currency: 'EUR', region: 'Europe'      },
  NL: { name: 'Netherlands',         flag: '🇳🇱', currency: 'EUR', region: 'Europe'      },
  BE: { name: 'Belgium',             flag: '🇧🇪', currency: 'EUR', region: 'Europe'      },
  AT: { name: 'Austria',             flag: '🇦🇹', currency: 'EUR', region: 'Europe'      },
  CH: { name: 'Switzerland',         flag: '🇨🇭', currency: 'CHF', region: 'Europe'      },
  SE: { name: 'Sweden',              flag: '🇸🇪', currency: 'SEK', region: 'Europe'      },
  NO: { name: 'Norway',              flag: '🇳🇴', currency: 'NOK', region: 'Europe'      },
  DK: { name: 'Denmark',             flag: '🇩🇰', currency: 'DKK', region: 'Europe'      },
  PL: { name: 'Poland',              flag: '🇵🇱', currency: 'PLN', region: 'Europe'      },
  CZ: { name: 'Czech Republic',      flag: '🇨🇿', currency: 'CZK', region: 'Europe'      },
  HU: { name: 'Hungary',             flag: '🇭🇺', currency: 'HUF', region: 'Europe'      },
  RO: { name: 'Romania',             flag: '🇷🇴', currency: 'RON', region: 'Europe'      },
  TR: { name: 'Turkey',              flag: '🇹🇷', currency: 'TRY', region: 'Europe'      },
  UA: { name: 'Ukraine',             flag: '🇺🇦', currency: 'UAH', region: 'Europe'      },
  GR: { name: 'Greece',              flag: '🇬🇷', currency: 'EUR', region: 'Europe'      },
  IE: { name: 'Ireland',             flag: '🇮🇪', currency: 'EUR', region: 'Europe'      },
  FI: { name: 'Finland',             flag: '🇫🇮', currency: 'EUR', region: 'Europe'      },

  // ── Middle East ──
  AE: { name: 'UAE',                 flag: '🇦🇪', currency: 'AED', region: 'Middle East' },
  SA: { name: 'Saudi Arabia',        flag: '🇸🇦', currency: 'SAR', region: 'Middle East' },
  QA: { name: 'Qatar',               flag: '🇶🇦', currency: 'QAR', region: 'Middle East' },
  IL: { name: 'Israel',              flag: '🇮🇱', currency: 'ILS', region: 'Middle East' },
  EG: { name: 'Egypt',               flag: '🇪🇬', currency: 'EGP', region: 'Middle East' },

  // ── Africa ──
  NG: { name: 'Nigeria',             flag: '🇳🇬', currency: 'NGN', region: 'Africa'      },
  ZA: { name: 'South Africa',        flag: '🇿🇦', currency: 'ZAR', region: 'Africa'      },
  GH: { name: 'Ghana',               flag: '🇬🇭', currency: 'GHS', region: 'Africa'      },
  KE: { name: 'Kenya',               flag: '🇰🇪', currency: 'KES', region: 'Africa'      },

  // ── South Asia ──
  IN: { name: 'India',               flag: '🇮🇳', currency: 'INR', region: 'Asia'        },
  PK: { name: 'Pakistan',            flag: '🇵🇰', currency: 'PKR', region: 'Asia'        },
  BD: { name: 'Bangladesh',          flag: '🇧🇩', currency: 'BDT', region: 'Asia'        },

  // ── East & Southeast Asia ──
  CN: { name: 'China',               flag: '🇨🇳', currency: 'CNY', region: 'Asia'        },
  JP: { name: 'Japan',               flag: '🇯🇵', currency: 'JPY', region: 'Asia'        },
  KR: { name: 'South Korea',         flag: '🇰🇷', currency: 'KRW', region: 'Asia'        },
  TW: { name: 'Taiwan',              flag: '🇹🇼', currency: 'TWD', region: 'Asia'        },
  SG: { name: 'Singapore',           flag: '🇸🇬', currency: 'SGD', region: 'Asia'        },
  HK: { name: 'Hong Kong',           flag: '🇭🇰', currency: 'HKD', region: 'Asia'        },
  MY: { name: 'Malaysia',            flag: '🇲🇾', currency: 'MYR', region: 'Asia'        },
  ID: { name: 'Indonesia',           flag: '🇮🇩', currency: 'IDR', region: 'Asia'        },
  PH: { name: 'Philippines',         flag: '🇵🇭', currency: 'PHP', region: 'Asia'        },
  TH: { name: 'Thailand',            flag: '🇹🇭', currency: 'THB', region: 'Asia'        },
  VN: { name: 'Vietnam',             flag: '🇻🇳', currency: 'VND', region: 'Asia'        },

  // ── Oceania ──
  AU: { name: 'Australia',           flag: '🇦🇺', currency: 'AUD', region: 'Oceania'     },
  NZ: { name: 'New Zealand',         flag: '🇳🇿', currency: 'NZD', region: 'Oceania'     },
};

/** Returns the currency code for a given country code (falls back to 'USD'). */
export function getCurrencyForCountry(countryCode) {
  return COUNTRY_MAP[countryCode]?.currency || 'USD';
}

/** Returns the country code whose currency matches the given currency code (first match). */
export function getCountryForCurrency(currencyCode) {
  return Object.keys(COUNTRY_MAP).find(
    (code) => COUNTRY_MAP[code].currency === currencyCode
  ) || 'US';
}

/** Returns COUNTRY_MAP entries grouped by region, sorted alphabetically within each. */
export function getCountriesByRegion() {
  const regions = {};
  Object.entries(COUNTRY_MAP).forEach(([code, info]) => {
    if (!regions[info.region]) regions[info.region] = [];
    regions[info.region].push({ code, ...info });
  });
  // Sort each region alphabetically
  Object.values(regions).forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name)));
  return regions;
}

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

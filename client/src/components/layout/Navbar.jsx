import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance, CURRENCIES } from '../../context/FinanceContext';
import {
  Sparkles,
  Plus,
  Moon,
  Sun,
  RotateCcw,
  LogOut,
  ChevronDown,
  Globe,
  Bell
} from 'lucide-react';

export default function Navbar() {
  const { user, isDemo, logout } = useAuth();
  const {
    selectedCurrency,
    setSelectedCurrency,
    theme,
    toggleTheme,
    setIsAiDrawerOpen,
    setIsQuickAddOpen,
    refreshAllData
  } = useFinance();

  const handleResetDemo = async () => {
    if (window.confirm('Reset all demo accounts, transactions, and budgets back to default?')) {
      try {
        const token = localStorage.getItem('fintrack_token');
        await fetch('/api/auth/reset-demo', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        await refreshAllData();
        alert('Demo dataset reset successfully!');
      } catch (err) {
        alert('Failed to reset demo data');
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full h-16 glass-card border-b border-slate-200 dark:border-slate-800/80 px-4 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile Title or Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-glow">
            FT
          </div>
          <span className="font-bold text-slate-900 dark:text-white tracking-tight text-lg">FinTrack AI</span>
        </div>
        {isDemo && (
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Demo Mode
          </span>
        )}
      </div>

      {/* Right Action Icons & Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Currency Switcher */}
        <div className="relative flex items-center">
          <Globe className="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="pl-8 pr-7 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
            title="Switch display currency"
          >
            {Object.keys(CURRENCIES).map((code) => (
              <option key={code} value={code}>
                {code} ({CURRENCIES[code].symbol})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
        </div>

        {/* Quick Add Button */}
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Add Entry</span>
        </button>

        {/* Ask AI Assistant Trigger */}
        <button
          onClick={() => setIsAiDrawerOpen(prev => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-glow-accent active:scale-95 animate-pulse-subtle"
          title="Ask AI Assistant"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI</span>
        </button>

        {/* Reset Demo Button (if demo) */}
        {isDemo && (
          <button
            onClick={handleResetDemo}
            className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors"
            title="Reset Demo Data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Dropdown / Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-amber-500 dark:text-amber-400">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

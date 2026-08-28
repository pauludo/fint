import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Repeat,
  Target,
  FileBarChart,
  Settings,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'budgets', label: 'Budgets & Limits', icon: PieChart },
  { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
  { id: 'goals', label: 'Goals & Debt Payoff', icon: Target },
  { id: 'reports', label: 'Reports & Analytics', icon: FileBarChart },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export default function Sidebar({ activeTab, setActiveTab }) {
  const { isAiDrawerOpen, setIsAiDrawerOpen, aiInsights } = useFinance();
  const unreadInsightsCount = aiInsights.length;

  return (
    <aside className="w-64 flex-shrink-0 hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/60 p-4 h-[calc(100vh-4rem)] sticky top-16 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 py-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-glow text-lg">
          FT
        </div>
        <div>
          <h1 className="font-bold text-base text-slate-900 dark:text-white tracking-tight leading-tight">
            FinTrack <span className="text-amber-400">AI</span>
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Wealth Intelligence</p>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="space-y-1.5 flex-1" aria-label="Main Navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* AI Assistant Banner Card in Sidebar */}
      <div className="mt-auto pt-4">
        <div
          onClick={() => setIsAiDrawerOpen(true)}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-950/50 to-indigo-950/40 border border-purple-800/30 hover:border-purple-600/50 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-200">AI Copilot</span>
            </div>
            {unreadInsightsCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full">
                {unreadInsightsCount}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
            Ask natural-language questions about your spending, trends, or budget.
          </p>
          <div className="mt-2.5 flex items-center text-[11px] font-medium text-purple-400 group-hover:text-purple-300">
            Open Chat &rarr;
          </div>
        </div>

        {/* Security & Bank Disclaimer Notice */}
        <div className="mt-3 px-2 flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <span>Local Manual Aggregator • Scoped Per User</span>
        </div>
      </div>
    </aside>
  );
}

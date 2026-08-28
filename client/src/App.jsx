import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useFinance } from './context/FinanceContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import AuthPage from './components/auth/AuthPage';
import DashboardOverview from './components/dashboard/DashboardOverview';
import TransactionManager from './components/transactions/TransactionManager';
import CsvImportModal from './components/transactions/CsvImportModal';
import BudgetPlanner from './components/budgets/BudgetPlanner';
import SubscriptionTracker from './components/subscriptions/SubscriptionTracker';
import GoalsDebtTracker from './components/goals/GoalsDebtTracker';
import ReportsView from './components/reports/ReportsView';
import SettingsView from './components/settings/SettingsView';
import AIAssistantDrawer from './components/ai/AIAssistantDrawer';
import QuickAddModal from './components/common/QuickAddModal';

import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Repeat,
  Target,
  FileBarChart,
  Settings,
  Sparkles
} from 'lucide-react';

export default function App() {
  const { user, loading } = useAuth();
  const { setIsAiDrawerOpen } = useFinance();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4 relative overflow-hidden">
        {/* Ambient blobs */}
        <div className="app-blob app-blob-amber" />
        <div className="app-blob app-blob-indigo" />
        {/* Grid overlay */}
        <div className="app-grid-overlay" />
        <div className="relative z-10 flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-glow animate-pulse">
            FT
          </div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">Loading FinTrack AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview
            setActiveTab={setActiveTab}
            onOpenCsvImport={() => setIsCsvImportOpen(true)}
          />
        );
      case 'transactions':
        return (
          <TransactionManager onOpenCsvImport={() => setIsCsvImportOpen(true)} />
        );
      case 'budgets':
        return <BudgetPlanner />;
      case 'subscriptions':
        return <SubscriptionTracker />;
      case 'goals':
        return <GoalsDebtTracker />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardOverview setActiveTab={setActiveTab} />;
    }
  };

  const MOBILE_NAV = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Ledger', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'subscriptions', label: 'Subs', icon: Repeat },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'reports', label: 'Reports', icon: FileBarChart }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden">

      {/* ── Global ambient background ── */}
      <div className="app-blob app-blob-amber" />
      <div className="app-blob app-blob-indigo" />
      <div className="app-blob app-blob-emerald" />
      <div className="app-grid-overlay" />

      {/* Top Navigation */}
      <Navbar />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Desktop Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full mb-16 md:mb-0">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass-card bg-slate-950/95 border-t border-slate-800 flex items-center justify-around px-2 z-40">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-12 py-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Global Modals & Drawers */}
      <QuickAddModal />
      <CsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
      />
      <AIAssistantDrawer />
    </div>
  );
}

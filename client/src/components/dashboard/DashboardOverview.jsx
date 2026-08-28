import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Plus,
  Upload
} from 'lucide-react';

const CATEGORY_COLORS = [
  '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899',
  '#F97316', '#06B6D4', '#6366F1', '#EAB308', '#14B8A6'
];

export default function DashboardOverview({ setActiveTab, onOpenCsvImport }) {
  const {
    netWorth,
    totalAssets,
    totalLiabilities,
    accounts,
    reportsData,
    aiInsights,
    subscriptionsData,
    formatCurrency,
    setIsAiDrawerOpen,
    setIsQuickAddOpen,
    setQuickAddType
  } = useFinance();

  const monthlyTrends = reportsData?.monthlyTrends || [
    { month: '2026-06', income: 8400, expenses: 3120, net: 5280 },
    { month: '2026-07', income: 9050, expenses: 3410, net: 5640 },
    { month: '2026-08', income: 9122, expenses: 3270, net: 5852 }
  ];

  const categoryBreakdown = reportsData?.categoryBreakdown || [
    { name: 'Housing & Rent', total_spent: 1750, color: '#6366F1' },
    { name: 'Groceries', total_spent: 336.80, color: '#14B8A6' },
    { name: 'Food & Dining', total_spent: 273.70, color: '#F59E0B' },
    { name: 'Digital Subscriptions', total_spent: 142.97, color: '#8B5CF6' },
    { name: 'Utilities & Bills', total_spent: 170.00, color: '#EAB308' },
    { name: 'Transportation', total_spent: 127.50, color: '#3B82F6' }
  ];

  const summary = reportsData?.summary || {
    totalIncome: 9122.40,
    totalExpenses: 3270.80,
    savingsRate: 64
  };

  const upcomingRenewals = subscriptionsData?.upcomingRenewals || [];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header / Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Financial Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time balance, cashflow health, and intelligent proactive insights.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setQuickAddType('income');
              setIsQuickAddOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            + Income
          </button>
          <button
            onClick={() => {
              setQuickAddType('expense');
              setIsQuickAddOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all"
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
            + Expense
          </button>
          <button
            onClick={onOpenCsvImport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/20"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
        </div>
      </div>

      {/* Hero Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Net Worth */}
        <div className="glass-card p-5 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/90 dark:to-slate-950/80 border border-slate-200 dark:border-slate-800/80 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Net Worth</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(netWorth)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-emerald-400 font-semibold flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +4.2%
            </span>
            <span className="text-slate-400 dark:text-slate-400">vs last month</span>
          </div>
        </div>

        {/* Total Assets */}
        <div className="glass-card p-5 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/90 dark:to-slate-950/80 border border-slate-200 dark:border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Assets</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-emerald-400 tracking-tight">
            {formatCurrency(totalAssets)}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Cash, checking & savings reserves</p>
        </div>

        {/* Total Liabilities */}
        <div className="glass-card p-5 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/90 dark:to-slate-950/80 border border-slate-200 dark:border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Liabilities</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-rose-400 tracking-tight">
            {formatCurrency(totalLiabilities)}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Credit cards & short-term balances</p>
        </div>

        {/* Savings Rate */}
        <div className="glass-card p-5 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/90 dark:to-slate-950/80 border border-slate-200 dark:border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monthly Savings Rate</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-purple-300 tracking-tight">
            {summary.savingsRate}%
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {formatCurrency(summary.totalIncome - summary.totalExpenses)} net free cash flow
          </p>
        </div>
      </div>

      {/* AI Proactive Weekly Insights Widget */}
      {aiInsights && aiInsights.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900/80 to-indigo-950/40 border border-purple-800/40 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 shadow-glow-accent">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Weekly Insights & Anomalies</h3>
                <p className="text-xs text-purple-200/70">Autonomous financial intelligence computed from your transaction patterns</p>
              </div>
            </div>
            <button
              onClick={() => setIsAiDrawerOpen(true)}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              Ask AI Details &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {aiInsights.slice(0, 4).map((ins) => (
              <div
                key={ins.id}
                onClick={() => setIsAiDrawerOpen(true)}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-purple-500/40 cursor-pointer transition-all hover:translate-y-[-2px] group"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {ins.impact_level === 'high' ? (
                    <span className="p-1 rounded-md bg-rose-500/10 text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="p-1 rounded-md bg-amber-500/10 text-amber-400">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-1 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                    {ins.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {ins.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            onClick={() => setActiveTab('transactions')}
            className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-900/60"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1">{acc.name}</span>
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: acc.color || '#3B82F6' }}
              />
            </div>
            <div className={`text-xl font-bold ${acc.balance < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
              {formatCurrency(acc.balance)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 capitalize">
              <span>{acc.type}</span>
              <span>{acc.transaction_count || 0} txs</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section: Cashflow & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Income vs Expenses (2 cols) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Monthly Cash Flow Comparison</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Income vs Expenses over the last 6 months</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-3 h-3 rounded-sm bg-rose-500" /> Expenses
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value) => [formatCurrency(value), '']}
                />
                <Bar dataKey="income" name="Income" fill="#10B981" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="expenses" name="Expenses" fill="#F43F5E" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending by Category Donut (1 col) */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Spending by Category</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Current month expense distribution</p>
          </div>

          <div className="h-52 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="total_spent"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value) => [formatCurrency(value), '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Ranked Categories List */}
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
            {categoryBreakdown.slice(0, 5).map((cat, idx) => (
              <div key={cat.id || idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color || CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium line-clamp-1">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(cat.total_spent)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Spending Trends & Upcoming Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trends Area Chart (2 cols) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Net Cash Flow Trajectory</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Net monthly savings growth over time</p>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
            >
              Full Reports &rarr;
            </button>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="netGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value) => [formatCurrency(value), 'Net Surplus']}
                />
                <Area
                  type="monotone"
                  dataKey="net"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#netGrowthGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Recurring Bills Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Upcoming Bills</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Renewals in the next 14 days</p>
            </div>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              View All
            </button>
          </div>

          {upcomingRenewals.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="text-xs">No imminent subscription charges due in the next 7 days.</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {upcomingRenewals.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{sub.name}</h4>
                    <p className="text-[11px] text-amber-400 font-medium">
                      Renews in {sub.daysUntil} day{sub.daysUntil === 1 ? '' : 's'} ({sub.next_renewal_date})
                    </p>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatCurrency(sub.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

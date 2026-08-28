import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { api } from '../../services/api';
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function ReportsView() {
  const { reportsData, formatCurrency, totalAssets } = useFinance();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const summary = reportsData?.summary || {
    totalIncome: 9122.40,
    totalExpenses: 3270.80,
    netSavings: 5851.60,
    savingsRate: 64,
    transactionCount: 42
  };

  const categoryBreakdown = reportsData?.categoryBreakdown || [];
  const anomalies = reportsData?.anomalies || [];
  const monthlyTrends = reportsData?.monthlyTrends || [];

  // Estimated cashflow runway
  const avgMonthlyExpenses = summary.totalExpenses || 3000;
  const runwayMonths = avgMonthlyExpenses > 0 ? (totalAssets / avgMonthlyExpenses).toFixed(1) : '12+';

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const token = localStorage.getItem('fintrack_token');
    window.open(`/api/transactions/export-csv?startDate=${startDate}&endDate=${endDate}&token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in print:text-black">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Financial Reports & Statements</h2>
          <p className="text-sm text-slate-400">
            Comprehensive periodic audit, cashflow runway, and category analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export Statement CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/20"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Statement Header */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6 print:border-none print:shadow-none">
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Executive Cash Flow Statement</h3>
            <p className="text-xs text-slate-400">Generated on {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Financial Runway</span>
            <div className="text-lg font-bold text-amber-400">{runwayMonths} Months Coverage</div>
          </div>
        </div>

        {/* 4 Pillars Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Revenue / Inflows</span>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">
              {formatCurrency(summary.totalIncome)}
            </div>
          </div>
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Expenses / Outflows</span>
            <div className="text-xl font-extrabold text-rose-400 mt-1">
              {formatCurrency(summary.totalExpenses)}
            </div>
          </div>
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">Net Cash Surpluses</span>
            <div className="text-xl font-extrabold text-amber-400 mt-1">
              {formatCurrency(summary.netSavings)}
            </div>
          </div>
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">Savings Retention Rate</span>
            <div className="text-xl font-extrabold text-purple-300 mt-1">
              {summary.savingsRate}%
            </div>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div>
          <h4 className="text-sm font-bold text-white mb-3">Expenditure by Category</h4>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Transactions</th>
                  <th className="p-3 text-right">Total Amount</th>
                  <th className="p-3 text-right">% of Total Spending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {categoryBreakdown.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-semibold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </td>
                    <td className="p-3 text-center text-slate-400">{c.transaction_count}</td>
                    <td className="p-3 text-right font-bold text-white">
                      {formatCurrency(c.total_spent)}
                    </td>
                    <td className="p-3 text-right text-slate-300">{c.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Anomalies section */}
        {anomalies && anomalies.length > 0 && (
          <div className="p-4 bg-rose-950/10 border border-rose-500/20 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
              <AlertCircle className="w-4 h-4" />
              <span>Flagged Statistical Spending Outliers</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              {anomalies.map((anom) => (
                <div key={anom.id} className="flex justify-between items-center py-1 border-b border-rose-500/10">
                  <span>
                    {anom.date} • <strong>{anom.merchant}</strong> ({anom.category_name || 'Expense'})
                  </span>
                  <span className="font-bold text-rose-400">{formatCurrency(anom.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

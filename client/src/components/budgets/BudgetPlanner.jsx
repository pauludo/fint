import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { api } from '../../services/api';
import Modal from '../common/Modal';
import {
  PieChart,
  Sparkles,
  Plus,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Edit2,
  ArrowRight,
  TrendingDown
} from 'lucide-react';

export default function BudgetPlanner() {
  const { budgetsData, categories, formatCurrency, refreshAllData } = useFinance();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [limitInput, setLimitInput] = useState('');
  const [rolloverInput, setRolloverInput] = useState(false);

  // AI Suggestion Modal State
  const [isAiSuggestModalOpen, setIsAiSuggestModalOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [savingAiBudgets, setSavingAiBudgets] = useState(false);

  const allBudgets = budgetsData?.budgets || [];
  // Show only categories that have real spending OR a limit set
  const budgets = allBudgets.filter(b => b.has_spending || b.has_limit);
  const unbudgetedCount = budgets.filter(b => b.has_spending && !b.has_limit).length;
  const currentMonth = budgetsData?.month || new Date().toISOString().slice(0, 7);

  const handleOpenEdit = (bgt) => {
    setSelectedCat(bgt);
    setLimitInput(String(bgt.base_limit || 0));
    setRolloverInput(Boolean(bgt.rollover_enabled));
    setIsEditModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    try {
      await api.saveBudget({
        category_id: selectedCat.category_id,
        month: currentMonth,
        limit_amount: parseFloat(limitInput) || 0,
        rollover_enabled: rolloverInput
      });
      setIsEditModalOpen(false);
      await refreshAllData();
    } catch (err) {
      alert('Failed to save budget: ' + err.message);
    }
  };

  const handleFetchAiSuggestions = async () => {
    setIsAiSuggestModalOpen(true);
    setAiLoading(true);
    try {
      const res = await api.suggestAIBudget();
      setAiSuggestions(res.suggestions || []);
    } catch (err) {
      alert('Failed to generate AI suggestions: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiSuggestionLimitChange = (index, value) => {
    setAiSuggestions((prev) => {
      const copy = [...prev];
      copy[index].suggestedLimit = parseFloat(value) || 0;
      return copy;
    });
  };

  const handleApplyAiBudgets = async () => {
    setSavingAiBudgets(true);
    try {
      const items = aiSuggestions.map((s) => ({
        categoryId: s.categoryId,
        limitAmount: s.suggestedLimit,
        rolloverEnabled: s.categoryName?.includes('Groceries') || s.categoryName?.includes('Transport')
      }));

      await api.bulkUpsertBudgets({ month: currentMonth, items });
      setIsAiSuggestModalOpen(false);
      await refreshAllData();
    } catch (err) {
      alert('Failed to apply AI budget: ' + err.message);
    } finally {
      setSavingAiBudgets(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header & AI Suggest Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Category Budgets & Limits</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor monthly allowances with automated rollover protections and AI optimization.
          </p>
          {unbudgetedCount > 0 && (
            <p className="text-xs text-amber-500 font-semibold mt-1">
              ⚠️ {unbudgetedCount} categor{unbudgetedCount === 1 ? 'y has' : 'ies have'} spending but no limit set — click the edit icon to add one.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFetchAiSuggestions}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-glow-accent transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Suggest 3-Mo Budget
          </button>
        </div>
      </div>

      {/* Monthly Budget Summary Banner */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {currentMonth} Monthly Budget Health
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {formatCurrency(budgetsData?.totalSpent || 0)}
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {' '}of {formatCurrency(budgetsData?.totalBudget || 0)} allocated
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400">Remaining Cushion</span>
            <div
              className={`text-xl font-bold ${
                (budgetsData?.totalRemaining || 0) < 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {formatCurrency(budgetsData?.totalRemaining || 0)}
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-800">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              (budgetsData?.overallPercentUsed || 0) > 100
                ? 'bg-rose-500'
                : (budgetsData?.overallPercentUsed || 0) > 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, budgetsData?.overallPercentUsed || 0)}%` }}
          />
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((bgt) => {
          const isOver = bgt.status === 'exceeded';
          const isWarn = bgt.status === 'warning';
          const noLimit = bgt.has_spending && !bgt.has_limit;
          const barColor = isOver ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500';

          return (
            <div
              key={bgt.category_id}
              className={`glass-card p-5 rounded-2xl border transition-all ${
                isOver
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : noLimit
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : isWarn
                  ? 'border-amber-500/40'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: bgt.category_color || '#64748B' }}
                  />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{bgt.category_name}</h3>
                  {noLimit && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      NO LIMIT
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleOpenEdit(bgt)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Set Budget Limit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Amount & Status */}
              <div className="flex items-baseline justify-between mb-2">
                <div className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(bgt.spent)}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {noLimit
                    ? <span className="text-amber-500 font-semibold cursor-pointer" onClick={() => handleOpenEdit(bgt)}>+ Set a limit</span>
                    : <>Limit: {formatCurrency(bgt.effective_limit)}</>
                  }
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-800/80 mb-2">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${barColor}`}
                  style={{ width: `${noLimit ? 100 : Math.min(100, bgt.percent_used)}%` }}
                />
              </div>

              {/* Footer info: rollover & remaining */}
              <div className="flex items-center justify-between text-[11px]">
                <span
                  className={
                    noLimit
                      ? 'text-amber-500 font-medium'
                      : bgt.remaining < 0
                      ? 'text-rose-400 font-bold'
                      : bgt.remaining < bgt.effective_limit * 0.2
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }
                >
                  {noLimit
                    ? 'Unbudgeted — click edit to set a limit'
                    : bgt.remaining < 0
                    ? `Over by ${formatCurrency(Math.abs(bgt.remaining))}`
                    : `Remaining: ${formatCurrency(Math.abs(bgt.remaining))}`
                  }
                </span>

                {bgt.rollover_amount > 0 && (
                  <span className="text-amber-400 font-medium flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" />
                    +{formatCurrency(bgt.rollover_amount)} rollover
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {budgets.length === 0 && (
          <div className="col-span-3 py-16 text-center text-slate-500 dark:text-slate-400">
            <PieChart className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No spending or budgets yet this month.</p>
            <p className="text-xs mt-1">Add transactions or subscriptions to see your budget tracking here.</p>
          </div>
        )}
      </div>

      {/* Edit Single Budget Modal */}
      {selectedCat && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Set Budget: ${selectedCat.category_name}`}
          maxWidth="max-w-sm"
        >
          <form onSubmit={handleSaveBudget} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Monthly Limit ($)</label>
              <input
                type="number"
                step="10"
                required
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rollover-check"
                checked={rolloverInput}
                onChange={(e) => setRolloverInput(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
              />
              <label htmlFor="rollover-check" className="text-slate-600 dark:text-slate-300 cursor-pointer">
                Enable Unused Budget Rollover to Next Month
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
              >
                Save Budget
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* AI Suggested Budget Modal */}
      <Modal
        isOpen={isAiSuggestModalOpen}
        onClose={() => setIsAiSuggestModalOpen(false)}
        title="AI-Powered 3-Month Budget Generator"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-purple-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Analyzed 3 Months of Actual Transactions</p>
              <p className="text-[11px] text-purple-300 mt-0.5">
                Our financial intelligence engine has formulated realistic spending limits with non-essential optimizations.
                Review and tweak any limit before applying to your account.
              </p>
            </div>
          </div>

          {aiLoading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
              <p>Analyzing historical cash flow and computing budget allocations...</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {aiSuggestions.map((sug, idx) => (
                  <div
                    key={sug.categoryId}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: sug.color || '#64748B' }}
                        />
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">{sug.categoryName}</h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          (3-mo avg: {formatCurrency(sug.currentAvgSpend)})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{sug.reasoning}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">$</span>
                      <input
                        type="number"
                        step="10"
                        value={sug.suggestedLimit}
                        onChange={(e) => handleAiSuggestionLimitChange(idx, e.target.value)}
                        className="w-24 px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Total Suggested: $
                  {aiSuggestions.reduce((sum, s) => sum + (s.suggestedLimit || 0), 0).toLocaleString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAiSuggestModalOpen(false)}
                    className="px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingAiBudgets}
                    onClick={handleApplyAiBudgets}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20"
                  >
                    {savingAiBudgets ? 'Saving...' : 'Apply AI Budget Plan'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { api } from '../../services/api';
import Modal from '../common/Modal';
import confetti from 'canvas-confetti';
import {
  Target,
  ShieldCheck,
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  TrendingUp,
  Flame,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export default function GoalsDebtTracker() {
  const { goalsData, accounts, formatCurrency, refreshAllData } = useFinance();

  const [activeSubTab, setActiveSubTab] = useState('savings'); // 'savings' | 'debt'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
    type: 'savings',
    account_id: '',
    interest_rate: '0',
    minimum_payment: '0',
    color: '#10B981'
  });

  const goals = goalsData?.goals || [];
  const savingsGoals = goals.filter((g) => g.type === 'savings');
  const debtGoals = goals.filter((g) => g.type === 'debt');

  const handleOpenAdd = (type) => {
    setFormData({
      name: '',
      target_amount: '',
      current_amount: '0',
      target_date: '',
      type,
      account_id: accounts[0]?.id || '',
      interest_rate: type === 'debt' ? '19.99' : '0',
      minimum_payment: type === 'debt' ? '100' : '0',
      color: type === 'debt' ? '#F59E0B' : '#10B981'
    });
    setIsAddModalOpen(true);
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    try {
      await api.createGoal(formData);
      setIsAddModalOpen(false);
      await refreshAllData();
    } catch (err) {
      alert('Failed to save goal: ' + err.message);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      await api.deleteGoal(id);
      await refreshAllData();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleOpenDeposit = (goal) => {
    setSelectedGoal(goal);
    setDepositAmount('');
    setIsDepositModalOpen(true);
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || isNaN(parseFloat(depositAmount))) return;
    const addAmt = parseFloat(depositAmount);
    const newCurrent = selectedGoal.current_amount + addAmt;

    try {
      await api.updateGoal(selectedGoal.id, {
        current_amount: newCurrent
      });

      if (newCurrent >= selectedGoal.target_amount) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      setIsDepositModalOpen(false);
      await refreshAllData();
    } catch (err) {
      alert('Failed to update goal: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Goals & Debt Payoff</h2>
          <p className="text-sm text-slate-400">
            Set milestone targets for emergency reserves, vacations, or eliminate credit card debt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub Tab Switcher */}
          <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSubTab('savings')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSubTab === 'savings'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Savings Milestones ({savingsGoals.length})
            </button>
            <button
              onClick={() => setActiveSubTab('debt')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSubTab === 'debt'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Debt Payoff ({debtGoals.length})
            </button>
          </div>

          <button
            onClick={() => handleOpenAdd(activeSubTab)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            New {activeSubTab === 'savings' ? 'Goal' : 'Debt Tracker'}
          </button>
        </div>
      </div>

      {/* Savings Tab */}
      {activeSubTab === 'savings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savingsGoals.map((g) => {
            const isFinished = g.current_amount >= g.target_amount;

            return (
              <div
                key={g.id}
                className="glass-card p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white line-clamp-1">{g.name}</h3>
                        <span className="text-[11px] text-slate-400">
                          Target: {g.target_date || 'Ongoing'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(g.current_amount)}
                    </div>
                    <div className="text-xs text-slate-400">
                      of {formatCurrency(g.target_amount)} ({g.percent_complete}%)
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800 mb-2">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, g.percent_complete)}%` }}
                    />
                  </div>

                  {/* Projection Info */}
                  <p className="text-[11px] text-slate-400">
                    {isFinished ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Goal Reached!
                      </span>
                    ) : (
                      `Est. finish: ${g.projected_completion_date || 'Ahead of schedule'}`
                    )}
                  </p>
                </div>

                {/* Contribute Button */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {formatCurrency(g.remaining_amount)} to go
                  </span>
                  <button
                    onClick={() => handleOpenDeposit(g)}
                    className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Deposit Funds
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Debt Payoff Tab */}
      {activeSubTab === 'debt' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debtGoals.map((d) => (
              <div
                key={d.id}
                className="glass-card p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{d.name}</h3>
                      <p className="text-xs text-slate-400">APR: {d.interest_rate}% interest rate</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteGoal(d.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Balance and Progress */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400">Original Balance</span>
                    <p className="text-white font-bold text-sm">{formatCurrency(d.target_amount)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Paid Down</span>
                    <p className="text-emerald-400 font-bold text-sm">
                      {formatCurrency(d.current_amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Remaining</span>
                    <p className="text-amber-400 font-bold text-sm">
                      {formatCurrency(d.remaining_amount)}
                    </p>
                  </div>
                </div>

                {/* Debt Payoff Simulation Stats */}
                {d.debt_payoff_stats && (
                  <div className="p-3 bg-purple-950/20 border border-purple-800/30 rounded-xl text-xs space-y-1 text-purple-200">
                    <div className="flex justify-between">
                      <span>Projected Payoff:</span>
                      <span className="font-bold text-white">
                        {d.debt_payoff_stats.estimatedMonthsToPayoff} months
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Total Interest:</span>
                      <span className="font-bold text-amber-400">
                        {formatCurrency(d.debt_payoff_stats.estimatedTotalInterest)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recommended Min Monthly:</span>
                      <span className="font-bold text-emerald-400">
                        {formatCurrency(d.debt_payoff_stats.recommendedMonthlyPayment)}/mo
                      </span>
                    </div>
                  </div>
                )}

                {/* Log Payment Button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleOpenDeposit(d)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20"
                  >
                    Log Debt Payment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={formData.type === 'debt' ? 'Add Debt Payoff Tracker' : 'Create Savings Goal'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveGoal} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Goal Title</label>
            <input
              type="text"
              required
              placeholder={formData.type === 'debt' ? 'e.g. Credit Card Payoff' : 'e.g. Emergency Fund'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">Target Amount ($)</label>
              <input
                type="number"
                step="50"
                required
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Starting Amount ($)</label>
              <input
                type="number"
                step="50"
                value={formData.current_amount}
                onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {formData.type === 'debt' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Interest Rate (APR %)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Min Monthly Payment ($)</label>
                <input
                  type="number"
                  step="10"
                  value={formData.minimum_payment}
                  onChange={(e) => setFormData({ ...formData, minimum_payment: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-400 mb-1">Target Completion Date</label>
            <input
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
            >
              Save Goal
            </button>
          </div>
        </form>
      </Modal>

      {/* Deposit / Contribution Modal */}
      {selectedGoal && (
        <Modal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          title={`Add Funds to ${selectedGoal.name}`}
          maxWidth="max-w-sm"
        >
          <form onSubmit={handleDeposit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">
                {selectedGoal.type === 'debt' ? 'Payment Amount ($)' : 'Contribution Amount ($)'}
              </label>
              <input
                type="number"
                step="10"
                required
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-white text-base font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDepositModalOpen(false)}
                className="px-3 py-2 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl"
              >
                Confirm Deposit
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

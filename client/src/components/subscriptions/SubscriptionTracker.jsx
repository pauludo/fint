import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { api } from '../../services/api';
import Modal from '../common/Modal';
import {
  Repeat,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  DollarSign
} from 'lucide-react';

export default function SubscriptionTracker() {
  const { subscriptionsData, accounts, categories, formatCurrency, refreshAllData } = useFinance();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    billing_cycle: 'monthly',
    category_id: '',
    account_id: '',
    next_renewal_date: '',
    reminder_days: 3,
    notes: '',
    website: ''
  });

  // Recurring Detector Modal
  const [isDetectorOpen, setIsDetectorOpen] = useState(false);
  const [detectedCandidates, setDetectedCandidates] = useState([]);
  const [detectorLoading, setDetectorLoading] = useState(false);

  const subscriptions = subscriptionsData?.subscriptions || [];
  const monthlyBurn = subscriptionsData?.totalMonthlyBurn || 0;
  const annualBurn = subscriptionsData?.totalAnnualBurn || 0;

  const handleOpenAdd = () => {
    setEditingSub(null);
    setFormData({
      name: '',
      amount: '',
      billing_cycle: 'monthly',
      category_id: categories.find(c => c.name.toLowerCase().includes('sub'))?.id || '',
      account_id: accounts[0]?.id || '',
      next_renewal_date: new Date().toISOString().split('T')[0],
      reminder_days: 3,
      notes: '',
      website: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (sub) => {
    setEditingSub(sub);
    setFormData({
      name: sub.name,
      amount: String(sub.amount),
      billing_cycle: sub.billing_cycle,
      category_id: sub.category_id || '',
      account_id: sub.account_id || '',
      next_renewal_date: sub.next_renewal_date,
      reminder_days: sub.reminder_days || 3,
      notes: sub.notes || '',
      website: sub.website || ''
    });
    setIsAddModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingSub) {
        await api.updateSubscription(editingSub.id, formData);
      } else {
        await api.createSubscription(formData);
      }
      setIsAddModalOpen(false);
      await refreshAllData();
    } catch (err) {
      alert('Failed to save subscription: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subscription?')) return;
    try {
      await api.deleteSubscription(id);
      await refreshAllData();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleScanRecurring = async () => {
    setIsDetectorOpen(true);
    setDetectorLoading(true);
    try {
      const results = await api.detectRecurring();
      setDetectedCandidates(results);
    } catch (err) {
      alert('Failed to scan transactions: ' + err.message);
    } finally {
      setDetectorLoading(false);
    }
  };

  const handleAddDetected = async (candidate) => {
    try {
      await api.createSubscription({
        name: candidate.merchant,
        amount: candidate.amount,
        billing_cycle: candidate.suggestedBillingCycle,
        category_id: candidate.categoryId || null,
        account_id: candidate.accountId || null,
        next_renewal_date: candidate.suggestedNextDate,
        reminder_days: 3,
        notes: `Auto-detected from ${candidate.occurrences} recurring charges`
      });

      setDetectedCandidates(prev => prev.filter(c => c.merchant !== candidate.merchant));
      await refreshAllData();
    } catch (err) {
      alert('Failed to add subscription: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Recurring &amp; Subscriptions</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Keep tabs on ongoing digital services, memberships, and renewal schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleScanRecurring}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Auto-Detect Recurring
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Subscription
          </button>
        </div>
      </div>

      {/* Burn Rate Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Monthly Burn
          </span>
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatCurrency(monthlyBurn)}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400"> / month</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Across {subscriptions.length} active memberships</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Projected Annual Cost
          </span>
          <div className="text-2xl lg:text-3xl font-extrabold text-amber-400 mt-1">
            {formatCurrency(annualBurn)}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400"> / year</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Calculated over a full 12-month cycle</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Renewal Alert Window
          </span>
          <div className="text-2xl lg:text-3xl font-extrabold text-purple-300 mt-1">
            {subscriptionsData?.upcomingRenewals?.length || 0} Due Soon
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Services renewing within the next 7 days</p>
        </div>
      </div>

      {/* Subscriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscriptions.map((sub) => {
          const isDueSoon = sub.isUpcoming;

          return (
            <div
              key={sub.id}
              className={`glass-card p-5 rounded-2xl border transition-all ${
                isDueSoon
                  ? 'border-amber-500/50 bg-amber-500/5'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{sub.name}</h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                      {sub.billing_cycle}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(sub)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(sub.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cost Info */}
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(sub.amount)}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatCurrency(sub.monthlyCost)}/mo
                </span>
              </div>

              {/* Renewal Countdown Badge */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Renews {sub.next_renewal_date}
                </span>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isDueSoon
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {sub.daysUntil <= 0
                    ? 'Renews Today'
                    : `In ${sub.daysUntil} day${sub.daysUntil === 1 ? '' : 's'}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Subscription Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingSub ? 'Edit Subscription' : 'Add Subscription'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1">Service / Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Netflix, Spotify, Gym"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Billing Cycle</label>
              <select
                value={formData.billing_cycle}
                onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="quarterly">Quarterly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Next Renewal Date</label>
              <input
                type="date"
                required
                value={formData.next_renewal_date}
                onChange={(e) => setFormData({ ...formData, next_renewal_date: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Reminder (Days Ahead)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.reminder_days}
                onChange={(e) => setFormData({ ...formData, reminder_days: parseInt(e.target.value) || 3 })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Account</label>
              <select
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1">Notes</label>
            <input
              type="text"
              placeholder="e.g. Shared with roommates"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
            >
              Save Subscription
            </button>
          </div>
        </form>
      </Modal>

      {/* Auto-Detect Recurring Charges Modal */}
      <Modal
        isOpen={isDetectorOpen}
        onClose={() => setIsDetectorOpen(false)}
        title="Auto-Detect Recurring Transactions"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-400 leading-relaxed">
            We scanned the past 90 days of transactions for repeating merchant charges.
            Found candidate charges you can instantly track as subscriptions:
          </p>

          {detectorLoading ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Sparkles className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
              <p>Analyzing repeating charges...</p>
            </div>
          ) : detectedCandidates.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p>All detected recurring transactions are already tracked in your subscriptions!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {detectedCandidates.map((c) => (
                <div
                  key={c.merchant}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{c.merchant}</h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      ${c.amount.toFixed(2)}/mo • Charged {c.occurrences}x recently
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddDetected(c)}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-lg border border-amber-500/30 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Track
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsDetectorOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

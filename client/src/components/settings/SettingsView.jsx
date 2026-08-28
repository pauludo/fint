import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance, CURRENCIES, COUNTRY_MAP, getCountryForCurrency, getCountriesByRegion } from '../../context/FinanceContext';
import { api } from '../../services/api';
import Modal from '../common/Modal';
import {
  Settings,
  User,
  KeyRound,
  Shield,
  Sparkles,
  Download,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Wallet,
  Tag
} from 'lucide-react';

export default function SettingsView() {
  const { user, isDemo, updateUserProfile } = useAuth();
  const {
    accounts,
    categories,
    selectedCurrency,
    setSelectedCurrency,
    theme,
    toggleTheme,
    refreshAllData,
    formatCurrency
  } = useFinance();

  // Derive country from current display currency
  const selectedCountry = getCountryForCurrency(selectedCurrency);
  const countriesByRegion = getCountriesByRegion();
  const detectedCurrency = CURRENCIES[selectedCurrency];

  const handleCountryChange = (countryCode) => {
    const currency = COUNTRY_MAP[countryCode]?.currency || 'USD';
    setSelectedCurrency(currency);
  };

  const [nameInput, setNameInput] = useState(user?.name || '');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ error: '', success: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // New Account Modal
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [newAccountForm, setNewAccountForm] = useState({
    name: '',
    type: 'checking',
    balance: '0',
    currency: selectedCurrency,
    color: '#3B82F6',
    institution: ''
  });

  // New Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    type: 'expense',
    color: '#64748B'
  });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess('');
    try {
      const res = await api.updateProfile({
        name: nameInput,
        base_currency: selectedCurrency,
        ...(apiKeyInput ? { anthropic_api_key: apiKeyInput.trim() } : {})
      });
      updateUserProfile(res.user);
      setProfileSuccess('Profile preferences updated successfully!');
      setApiKeyInput('');
    } catch (err) {
      alert('Failed to update profile: ' + err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ error: '', success: '' });
    setPasswordLoading(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setPasswordMsg({ success: 'Password changed successfully!', error: '' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordMsg({ error: err.message || 'Failed to change password', success: '' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      await api.createAccount(newAccountForm);
      setIsAccountModalOpen(false);
      await refreshAllData();
    } catch (err) {
      alert('Failed to create account: ' + err.message);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Delete this account and all associated ledger records?')) return;
    try {
      await api.deleteAccount(id);
      await refreshAllData();
    } catch (err) {
      alert('Failed to delete account: ' + err.message);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.createCategory(newCategoryForm);
      setIsCategoryModalOpen(false);
      await refreshAllData();
    } catch (err) {
      alert('Failed to create category: ' + err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this custom category?')) return;
    try {
      await api.deleteCategory(id);
      await refreshAllData();
    } catch (err) {
      alert('Failed to delete category: ' + err.message);
    }
  };

  const handleExportAll = () => {
    const token = localStorage.getItem('fintrack_token');
    window.open(`/api/settings/export-all?token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System & Account Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage currency, security, AI API keys, categories, and account structures.
        </p>
      </div>

      {/* Profile & Currency Preferences */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <User className="w-4 h-4 text-amber-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">General Preferences</h3>
        </div>

        {profileSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{profileSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Display Name</label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Country</label>
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
              >
                {Object.entries(countriesByRegion).map(([region, countries]) => (
                  <optgroup key={region} label={`── ${region} ──`}>
                    {countries.map(({ code, name, flag, currency }) => (
                      <option key={code} value={code}>
                        {flag} {name} ({CURRENCIES[currency]?.symbol})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {/* Auto-detected currency badge */}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Display currency:</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-400">
                  {selectedCurrency} {detectedCurrency?.symbol} — {detectedCurrency?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Anthropic Claude API Key Config */}
          <div className="p-4 bg-purple-950/20 border border-purple-800/30 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Anthropic Claude API Key (Optional)</h4>
            </div>
            <p className="text-[11px] text-purple-300/80 leading-relaxed">
              If configured, your AI Assistant will use live Claude 3.5 Sonnet to generate responses.
              If omitted, FinTrack AI seamlessly runs using its intelligent built-in financial rule engine.
            </p>
            <input
              type="password"
              placeholder="sk-ant-api03-..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20 text-xs transition-all"
            >
              {profileSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>

      {/* Accounts Management */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Linked Accounts</h3>
          </div>
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white text-xs font-semibold rounded-xl"
          >
            <Plus className="w-3.5 h-3.5" /> Add Account
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: acc.color }} />
                  <h4 className="font-bold text-slate-900 dark:text-white">{acc.name}</h4>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                  {acc.type} • {formatCurrency(acc.balance)}
                </span>
              </div>
              <button
                onClick={() => handleDeleteAccount(acc.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Categories Management */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-purple-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Categories</h3>
          </div>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white text-xs font-semibold rounded-xl"
          >
            <Plus className="w-3.5 h-3.5" /> Add Category
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {categories.map((c) => (
            <div
              key={c.id}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="text-slate-700 dark:text-slate-200">{c.name}</span>
              {Boolean(c.is_custom) && (
                <button
                  onClick={() => handleDeleteCategory(c.id)}
                  className="text-slate-500 hover:text-rose-400 ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Security & Password */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <KeyRound className="w-4 h-4 text-rose-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Security & Password</h3>
        </div>

        {passwordMsg.error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
            {passwordMsg.error}
          </div>
        )}
        {passwordMsg.success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
            {passwordMsg.success}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl text-xs transition-all"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Data Export & Backup */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <Download className="w-4 h-4 text-emerald-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Full Ledger Backup & Portability</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Download a complete, unencrypted JSON backup of all your accounts, transactions, recurring bills, and savings milestones.
        </p>
        <button
          onClick={handleExportAll}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl flex items-center gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          Download All Data (JSON)
        </button>
      </div>

      {/* Create Account Modal */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title="Add Financial Account"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1">Account Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Chase Sapphire Checking"
              value={newAccountForm.name}
              onChange={(e) => setNewAccountForm({ ...newAccountForm, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Account Type</label>
              <select
                value={newAccountForm.type}
                onChange={(e) => setNewAccountForm({ ...newAccountForm, type: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit">Credit Card</option>
                <option value="investment">Investment</option>
                <option value="cash">Cash Wallet</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Starting Balance ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={newAccountForm.balance}
                onChange={(e) => setNewAccountForm({ ...newAccountForm, balance: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(false)}
              className="px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
            >
              Save Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add Custom Category"
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1">Category Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Pet Supplies"
              value={newCategoryForm.name}
              onChange={(e) => setNewCategoryForm({ ...newCategoryForm, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Type</label>
              <select
                value={newCategoryForm.type}
                onChange={(e) => setNewCategoryForm({ ...newCategoryForm, type: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Color</label>
              <input
                type="color"
                value={newCategoryForm.color}
                onChange={(e) => setNewCategoryForm({ ...newCategoryForm, color: e.target.value })}
                className="w-full h-9 bg-slate-950 border border-slate-700 rounded-xl cursor-pointer p-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
            >
              Add Category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

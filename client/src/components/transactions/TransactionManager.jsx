import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { api } from '../../services/api';
import Modal from '../common/Modal';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckSquare,
  Square,
  RotateCcw
} from 'lucide-react';

export default function TransactionManager({ onOpenCsvImport }) {
  const {
    transactions,
    accounts,
    categories,
    formatCurrency,
    refreshAllData,
    setIsQuickAddOpen,
    setQuickAddType
  } = useFinance();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkRecatOpen, setIsBulkRecatOpen] = useState(false);
  const [bulkTargetCategory, setBulkTargetCategory] = useState('');

  // Edit Single Transaction Modal
  const [editingTx, setEditingTx] = useState(null);
  const [editForm, setEditForm] = useState({
    merchant: '',
    amount: '',
    type: 'expense',
    account_id: '',
    category_id: '',
    date: '',
    notes: '',
    is_recurring: false
  });

  // Client-side filtering & sorting
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchMerchant = t.merchant?.toLowerCase().includes(query);
        const matchNotes = t.notes?.toLowerCase().includes(query);
        if (!matchMerchant && !matchNotes) return false;
      }
      if (selectedAccount && t.account_id !== selectedAccount) return false;
      if (selectedCategory && t.category_id !== selectedCategory) return false;
      if (selectedType !== 'all' && t.type !== selectedType) return false;
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      return true;
    });
  }, [transactions, searchTerm, selectedAccount, selectedCategory, selectedType, startDate, endDate]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransactions.map((t) => t.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected transaction(s)?`)) return;
    try {
      await api.bulkDeleteTransactions(selectedIds);
      setSelectedIds([]);
      await refreshAllData();
    } catch (err) {
      alert('Failed to delete transactions: ' + err.message);
    }
  };

  const handleBulkRecategorize = async () => {
    if (!bulkTargetCategory) return;
    try {
      await api.bulkRecategorizeTransactions(selectedIds, bulkTargetCategory);
      setIsBulkRecatOpen(false);
      setSelectedIds([]);
      await refreshAllData();
    } catch (err) {
      alert('Failed to recategorize: ' + err.message);
    }
  };

  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setEditForm({
      merchant: tx.merchant,
      amount: String(tx.amount),
      type: tx.type,
      account_id: tx.account_id,
      category_id: tx.category_id || '',
      date: tx.date,
      notes: tx.notes || '',
      is_recurring: Boolean(tx.is_recurring)
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.updateTransaction(editingTx.id, {
        ...editForm,
        amount: parseFloat(editForm.amount)
      });
      setEditingTx(null);
      await refreshAllData();
    } catch (err) {
      alert('Failed to update transaction: ' + err.message);
    }
  };

  const handleDeleteSingle = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.deleteTransaction(id);
      await refreshAllData();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleExportCsv = () => {
    const token = localStorage.getItem('fintrack_token');
    window.open(`/api/transactions/export-csv?startDate=${startDate}&endDate=${endDate}&accountId=${selectedAccount}&token=${token}`, '_blank');
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedAccount('');
    setSelectedCategory('');
    setSelectedType('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Transactions & Ledger</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'} recorded across your accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all"
            title="Download CSV file"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={onOpenCsvImport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
          <button
            onClick={() => {
              setQuickAddType('expense');
              setIsQuickAddOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search merchant, memo, tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Account Filter */}
          <div>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>
        </div>

        {/* Date Range & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Dates:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
            />
          </div>

          {(searchTerm || selectedAccount || selectedCategory || selectedType !== 'all' || startDate || endDate) && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar (when rows are selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between animate-fade-in">
          <span className="text-xs font-bold text-amber-400">
            {selectedIds.length} item{selectedIds.length === 1 ? '' : 's'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkRecatOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white text-xs font-semibold rounded-lg transition-all"
            >
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              Recategorize
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Transactions Ledger Table */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 w-10">
                  <button
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-white"
                    aria-label="Select all"
                  >
                    {selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Merchant / Source</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Account</th>
                <th className="p-3.5 text-right">Amount</th>
                <th className="p-3.5 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    No transactions found matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isSelected = selectedIds.includes(tx.id);
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors ${
                        isSelected ? 'bg-amber-50 dark:bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="p-3.5">
                        <button
                          onClick={() => toggleSelectOne(tx.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3.5 text-slate-400 whitespace-nowrap font-mono">
                        {tx.date}
                      </td>
                      <td className="p-3.5 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1 rounded-md ${
                              isIncome
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <div>
                            <p className="font-semibold line-clamp-1">{tx.merchant}</p>
                            {tx.notes && (
                              <p className="text-[11px] text-slate-500 line-clamp-1">{tx.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                          style={{
                            backgroundColor: `${tx.category_color || '#64748B'}15`,
                            color: tx.category_color || '#94A3B8',
                            borderColor: `${tx.category_color || '#64748B'}30`
                          }}
                        >
                          {tx.category_name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 whitespace-nowrap">
                        {tx.account_name || 'Account'}
                      </td>
                      <td
                        className={`p-3.5 text-right font-bold whitespace-nowrap text-sm ${
                          isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-100'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(tx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSingle(tx.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTx && (
        <Modal
          isOpen={Boolean(editingTx)}
          onClose={() => setEditingTx(null)}
          title="Edit Transaction"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Merchant / Payee</label>
              <input
                type="text"
                required
                value={editForm.merchant}
                onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Account</label>
                <select
                  value={editForm.account_id}
                  onChange={(e) => setEditForm({ ...editForm, account_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
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
                  value={editForm.category_id}
                  onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="">Uncategorized</option>
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
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bulk Recategorize Modal */}
      <Modal
        isOpen={isBulkRecatOpen}
        onClose={() => setIsBulkRecatOpen(false)}
        title={`Recategorize ${selectedIds.length} Selected Transactions`}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-400">
            Select the new target category to assign to all selected transactions:
          </p>
          <select
            value={bulkTargetCategory}
            onChange={(e) => setBulkTargetCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="">Choose category...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsBulkRecatOpen(false)}
              className="px-3 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!bulkTargetCategory}
              onClick={handleBulkRecategorize}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl disabled:opacity-40"
            >
              Apply Category
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

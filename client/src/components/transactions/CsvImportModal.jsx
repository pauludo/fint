import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { api } from '../../services/api';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CsvImportModal({ isOpen, onClose }) {
  const { accounts, refreshAllData } = useFinance();
  const [file, setFile] = useState(null);
  const [accountId, setAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const activeAccountId = accountId || accounts[0]?.id || '';

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && (selected.type === 'text/csv' || selected.name.endsWith('.csv'))) {
      setFile(selected);
      setError('');
    } else {
      setError('Please upload a valid .csv bank statement file.');
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }
    if (!activeAccountId) {
      setError('Please select a target account.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('defaultAccountId', activeAccountId);

      const res = await api.importCsv(formData);
      setResult(res);
      await refreshAllData();
    } catch (err) {
      setError(err.message || 'Failed to import CSV.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Bank Statement CSV"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {result ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">{result.message}</h4>
            <p className="text-xs text-slate-400">
              Processed {result.totalRows} records from your file. Your accounts and budgets have been updated.
            </p>
            <button
              onClick={handleClose}
              className="mt-4 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all"
            >
              Done & View Transactions
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload any standard CSV statement from Chase, Bank of America, Amex, Apple Card, or custom spreadsheet.
              Our parser auto-detects date, amount, description, and automatically assigns categories.
            </p>

            {error && (
              <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Target Account Picker */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                Assign to Account
              </label>
              <select
                value={activeAccountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Drag & Drop Box */}
            <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl p-6 text-center transition-colors bg-slate-950/40">
              <input
                type="file"
                id="csv-file-input"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="csv-file-input" className="cursor-pointer block space-y-2">
                <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400">
                    <FileText className="w-4 h-4" />
                    <span>{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-semibold text-white hover:text-amber-400">
                      Click to choose CSV file
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">Accepts UTF-8 formatted CSV files up to 5MB</p>
                  </div>
                )}
              </label>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!file || loading}
                onClick={handleImport}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 disabled:opacity-40"
              >
                {loading ? 'Processing & Matching...' : 'Upload & Process CSV'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

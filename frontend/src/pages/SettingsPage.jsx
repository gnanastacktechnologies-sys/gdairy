import React, { useState, useEffect } from 'react';
import { FiSettings, FiCheckCircle, FiShield, FiSave, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SettingsPage = () => {
  const { systemDairyName, updateSystemDairyName } = useAuth();
  const [retentionPeriod, setRetentionPeriod] = useState(3);
  const [retentionUnit, setRetentionUnit] = useState('months');
  const [billingCycle, setBillingCycle] = useState('10days');
  const [settlementDay, setSettlementDay] = useState(10);
  const [dairyName, setDairyName] = useState(systemDairyName || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (systemDairyName) {
      setDairyName(systemDairyName);
    }
  }, [systemDairyName]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      if (res.data.success) {
        setRetentionPeriod(res.data.data.retentionPeriod);
        setRetentionUnit(res.data.data.retentionUnit || 'months');
        setBillingCycle(res.data.data.billingCycle || '10days');
        setSettlementDay(res.data.data.settlementDay || 10);
        if (res.data.data.dairyName) {
          setDairyName(res.data.data.dairyName);
          updateSystemDairyName(res.data.data.dairyName);
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/settings', {
        retentionPeriod: parseInt(retentionPeriod, 10),
        retentionUnit,
        billingCycle,
        settlementDay: parseInt(settlementDay, 10),
        dairyName
      });
      if (res.data.success) {
        updateSystemDairyName(dairyName);
        showToast('Settings & Central Dairy Name saved successfully!');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold animate-fadeIn">
          <FiCheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-bold text-text-main flex items-center gap-2">
          <FiSettings className="text-primary w-6 h-6" />
          <span>Application Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-text-sub mt-1">Configure global application behavior, payment credit cycles, and data retention rules.</p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        {/* Billing Settlement & Credit Cycle Settings */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-main">Billing Settlement & Credit Cycle</h2>
            <p className="text-xs text-text-sub">Set when milk collection amounts automatically settle and credit to accounts.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-2">
              Payment Credit Cycle
            </label>
            <select
              value={billingCycle}
              onChange={(e) => {
                const val = e.target.value;
                setBillingCycle(val);
                if (val === '10days') setSettlementDay(10);
                else if (val === '15days') setSettlementDay(15);
                else if (val === 'monthly') setSettlementDay(30);
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="10days">10 Days Cycle (Every 10 Days)</option>
              <option value="15days">15 Days Cycle (Half Monthly)</option>
              <option value="monthly">Monthly Cycle (End of Month)</option>
              <option value="custom">Custom Day Cycle</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-2">
              Settlement Threshold (Days)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={settlementDay}
              onChange={(e) => setSettlementDay(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 10"
            />
          </div>
        </div>

        {/* Dairy Name Setting */}
        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-2">
            Dairy Name (Editable by Admin)
          </label>
          <input
            type="text"
            value={dairyName}
            onChange={(e) => setDairyName(e.target.value)}
            placeholder="e.g. Aavin Dairy, Heritage Dairy"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p className="text-[11px] text-text-sub mt-1.5 font-medium">
            The Dairy Name configured here applies for milk collections.
          </p>
        </div>

        {/* Retention Settings */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 pt-4">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <FiShield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-main">Data & Report Retention</h2>
            <p className="text-xs text-text-sub">Set the period for active report summaries and analytics cache retention.</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-2">
            Retention Duration
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              value={`${retentionPeriod}-${retentionUnit}`}
              onChange={(e) => {
                const [p, u] = e.target.value.split('-');
                setRetentionPeriod(parseInt(p, 10));
                setRetentionUnit(u);
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="1-months">1 Month</option>
              <option value="3-months">3 Months (Default)</option>
              <option value="6-months">6 Months</option>
              <option value="12-months">12 Months (1 Year)</option>
            </select>
          </div>
        </div>

        {/* Important Data Integrity Note */}
        <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed font-medium">
            <strong>Billing & Data Integrity:</strong> When a credit settlement date is reached and amount is credited (paid), the period total ends and the next entry starts a new unpaid calculation. Historical collection entries are permanently preserved.
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving || loading}
            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-xl shadow-md shadow-primary/30 active:scale-95 transition-all flex items-center gap-2"
          >
            <FiSave className="w-4 h-4" />
            <span>{saving ? 'Saving Settings...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;

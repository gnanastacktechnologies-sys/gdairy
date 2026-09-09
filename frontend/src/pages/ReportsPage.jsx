import React, { useState, useEffect } from 'react';
import { FiCalendar, FiSun, FiMoon, FiTrendingUp, FiDroplet, FiCreditCard, FiCheckCircle, FiX, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/common/StatCard';
import { formatCurrency, formatLitres, formatDate, getTodayDateString, getDateNDaysAgo } from '../utils/formatters';

const ReportsPage = () => {
  const { user, isAdmin } = useAuth();
  const canCreditAccount = isAdmin || user?.permissions?.canCreditAccount !== false;

  const [activeTab, setActiveTab] = useState('period'); // 'period' or 'daily'
  const [periodPreset, setPeriodPreset] = useState('10'); // '10', '15', '30', 'custom'

  const [startDate, setStartDate] = useState(getDateNDaysAgo(10));
  const [endDate, setEndDate] = useState(getTodayDateString());

  const [periodSummary, setPeriodSummary] = useState(null);
  const [dailyReports, setDailyReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settlement Credit Modal State
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [crediting, setCrediting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (periodPreset !== 'custom') {
      const days = parseInt(periodPreset, 10);
      setStartDate(getDateNDaysAgo(days));
      setEndDate(getTodayDateString());
    }
  }, [periodPreset]);

  useEffect(() => {
    if (activeTab === 'period') {
      fetchPeriodReport();
    } else {
      fetchDailyReports();
    }
  }, [activeTab, startDate, endDate]);

  const fetchPeriodReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/period?startDate=${startDate}&endDate=${endDate}`);
      if (res.data.success) {
        setPeriodSummary(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch period report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyReports = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/daily?startDate=${startDate}&endDate=${endDate}`);
      if (res.data.success) {
        setDailyReports(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch daily reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreditPeriod = async () => {
    if (!canCreditAccount) {
      alert('Credit Account / Settlement access has been restricted for your account by Administrator.');
      return;
    }
    setCrediting(true);
    try {
      const res = await api.post('/milk/credit-period', { startDate, endDate });
      if (res.data.success) {
        setShowCreditModal(false);
        setToastMessage(res.data.message || 'Amount credited successfully!');
        setTimeout(() => setToastMessage(null), 4000);
        // Refresh report data
        if (activeTab === 'period') fetchPeriodReport();
        else fetchDailyReports();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to process settlement credit');
    } finally {
      setCrediting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold animate-fadeIn">
          <FiCheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-main">Milk Reports & Settlement</h1>
          <p className="text-xs sm:text-sm text-text-sub mt-1">
            Calculate period summary billing for 10-day, 15-day, 30-day or custom date ranges & settle payments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              if (!canCreditAccount) {
                alert('Credit Account / Settlement access has been restricted for your account by Administrator.');
                return;
              }
              setShowCreditModal(true);
            }}
            disabled={!canCreditAccount}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
              canCreditAccount
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
            title={canCreditAccount ? 'Credit Account (Mark Paid)' : 'Restricted by Administrator'}
          >
            <FiCheckCircle className="w-4 h-4" />
            <span>Credit Account (Mark Paid)</span>
            {!canCreditAccount && <span className="text-[10px] bg-slate-300 text-slate-600 px-1.5 py-0.5 rounded ml-1">Restricted</span>}
          </button>
        </div>
      </div>

      {/* Tabs and Date Range Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          {/* Tab Selection */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('period')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'period'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Period Summary
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'daily'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Breakdown
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {['10', '15', '30'].map((preset) => (
              <button
                key={preset}
                onClick={() => setPeriodPreset(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  periodPreset === preset
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {preset} Days
              </button>
            ))}
            <button
              onClick={() => setPeriodPreset('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                periodPreset === 'custom'
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Custom Range
            </button>
          </div>
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-sub mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setPeriodPreset('custom');
                setStartDate(e.target.value);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-sub mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setPeriodPreset('custom');
                setEndDate(e.target.value);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      </div>

      {/* Period Summary Tab View */}
      {activeTab === 'period' && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Period Milk"
              value={loading ? '...' : formatLitres(periodSummary?.totalLitres)}
              subtitle={`${periodSummary?.daysCount || 0} Days Billing Period`}
              icon={FiDroplet}
              color="indigo"
            />
            <StatCard
              title="Total Billing Amount"
              value={loading ? '...' : formatCurrency(periodSummary?.totalAmount)}
              subtitle={`Avg ${formatCurrency(periodSummary?.averageAmountPerDay)}/day`}
              icon={FiCreditCard}
              color="emerald"
            />
            <StatCard
              title="Current Unpaid Balance"
              value={loading ? '...' : formatCurrency(periodSummary?.unpaidAmount)}
              subtitle="Pending Credit Settlement"
              icon={FiAlertCircle}
              color="amber"
            />
            <StatCard
              title="Credited Total (Paid)"
              value={loading ? '...' : formatCurrency(periodSummary?.creditedAmount)}
              subtitle="Settled Account Credits"
              icon={FiCheckCircle}
              color="emerald"
            />
          </div>

          {/* Session Breakdown Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                  <FiSun className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-main">Morning Session Total</h3>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    {loading ? '...' : formatLitres(periodSummary?.morningLitres)}
                  </p>
                  <p className="text-xs text-text-sub font-semibold mt-0.5">
                    Amount: {formatCurrency(periodSummary?.morningAmount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                  <FiMoon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-main">Evening Session Total</h3>
                  <p className="text-2xl font-black text-indigo-600 mt-1">
                    {loading ? '...' : formatLitres(periodSummary?.eveningLitres)}
                  </p>
                  <p className="text-xs text-text-sub font-semibold mt-0.5">
                    Amount: {formatCurrency(periodSummary?.eveningAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Breakdown Tab View */}
      {activeTab === 'daily' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text-main">Daily Milk Breakdown Report</h3>
              <p className="text-xs text-text-sub">Morning vs Evening breakdown per day with credit status</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-surface-header text-xs font-semibold uppercase tracking-wider text-text-sub border-b border-slate-200">
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Morning Milk</th>
                  <th className="px-4 py-3.5">Evening Milk</th>
                  <th className="px-4 py-3.5">Total Litres</th>
                  <th className="px-4 py-3.5">Total Amount</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-xs text-text-sub">Loading daily reports...</td>
                  </tr>
                ) : dailyReports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-xs text-text-sub">No collection records found for this date range.</td>
                  </tr>
                ) : (
                  dailyReports.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-text-main">{formatDate(row.date)}</td>
                      <td className="px-4 py-3.5 text-amber-700 font-medium">
                        {formatLitres(row.morningLitres)} ({formatCurrency(row.morningAmount)})
                      </td>
                      <td className="px-4 py-3.5 text-indigo-700 font-medium">
                        {formatLitres(row.eveningLitres)} ({formatCurrency(row.eveningAmount)})
                      </td>
                      <td className="px-4 py-3.5 font-bold text-text-main">{formatLitres(row.totalLitres)}</td>
                      <td className="px-4 py-3.5 font-bold text-emerald-600">{formatCurrency(row.totalAmount)}</td>
                      <td className="px-4 py-3.5">
                        {row.paymentStatus === 'credited' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            <FiCheckCircle className="w-3.5 h-3.5" /> Credited
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                            <FiAlertCircle className="w-3.5 h-3.5" /> Unpaid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Credit Settlement Confirmation Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative border border-slate-100">
            <button
              onClick={() => setShowCreditModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              title="Close dialog"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <FiCheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-main">Settle & Credit Account</h3>
                <p className="text-xs text-text-sub">Confirm period credit settlement</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Period Date Range:</span>
                <span className="font-bold text-slate-800">{formatDate(startDate)} to {formatDate(endDate)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-2">
                <span className="text-slate-500 font-medium">Amount to Credit:</span>
                <span className="font-black text-emerald-600 text-sm">
                  {formatCurrency(periodSummary?.unpaidAmount || periodSummary?.totalAmount)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              By crediting this amount, all unpaid collection entries in this date range will be marked as <strong>CREDITED (PAID)</strong>. The current unpaid balance will end, and the next collection entry onwards will start accumulating in a new unpaid billing cycle.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreditModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreditPeriod}
                disabled={crediting}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <FiCheckCircle className="w-4 h-4" />
                <span>{crediting ? 'Crediting...' : 'Confirm & Credit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;

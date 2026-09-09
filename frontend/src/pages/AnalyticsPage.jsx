import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { FiTrendingUp, FiBarChart2, FiPieChart, FiCreditCard } from 'react-icons/fi';
import api from '../services/api';
import { formatCurrency, formatLitres, formatDate } from '../utils/formatters';

const AnalyticsPage = () => {
  const [filter, setFilter] = useState('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [filter, startDate, endDate]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let query = `/analytics/charts?filter=${filter}`;
      if (filter === 'custom' && startDate && endDate) {
        query += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await api.get(query);
      if (res.data.success) {
        // Format dates for chart labels
        const formatted = res.data.chartData.map((d) => ({
          ...d,
          formattedDate: formatDate(d.date)
        }));
        setChartData(formatted);
        setSummary(res.data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPresets = [
    { label: '7 Days', value: '7days' },
    { label: '10 Days', value: '10days' },
    { label: '15 Days', value: '15days' },
    { label: '30 Days', value: '30days' },
    { label: '3 Months', value: '3months' },
    { label: 'Custom', value: 'custom' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-main">Milk Collection Analytics</h1>
          <p className="text-xs sm:text-sm text-text-sub mt-1">
            Visual trends for milk collection volume, session comparisons, billing revenue, and rate trends.
          </p>
        </div>
      </div>

      {/* Filter Selector */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {filterPresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setFilter(preset.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === preset.value
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {filter === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-sub mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-sub mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        )}
      </div>

      {/* Analytics Summary Banner */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-sub">Total Litres</span>
            <p className="text-xl font-black text-indigo-600 mt-1">{formatLitres(summary.totalLitres)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-sub">Total Amount</span>
            <p className="text-xl font-black text-emerald-600 mt-1">{formatCurrency(summary.totalAmount)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-sub">Avg Litres/Day</span>
            <p className="text-xl font-black text-amber-600 mt-1">{formatLitres(summary.avgLitresPerDay)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-sub">Avg Rate / L</span>
            <p className="text-xl font-black text-purple-600 mt-1">₹{summary.avgPricePerLitre}/L</p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Line Chart: Milk Quantity Over Time */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
              <FiTrendingUp className="text-indigo-600 w-4 h-4" />
              <span>Milk Volume Trend (Litres over Time)</span>
            </h3>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-text-sub">Loading graph...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip formatter={(value) => [`${value} Litres`, 'Total Milk']} />
                  <Line type="monotone" dataKey="totalLitres" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2. Bar Chart: Morning vs Evening Milk */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
              <FiBarChart2 className="text-amber-500 w-4 h-4" />
              <span>Morning vs Evening Collection</span>
            </h3>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-text-sub">Loading graph...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip />
                  <Legend tick={{ fontSize: 11 }} />
                  <Bar dataKey="morningLitres" name="Morning (L)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="eveningLitres" name="Evening (L)" fill="#4338CA" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 3. Area Chart: Daily Amount Billing */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
              <FiCreditCard className="text-emerald-600 w-4 h-4" />
              <span>Daily Revenue & Amount (₹)</span>
            </h3>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-text-sub">Loading graph...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Daily Amount']} />
                  <Area type="monotone" dataKey="totalAmount" stroke="#16A34A" fill="#DCFCE7" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 4. Line Chart: Price Per Litre Trend */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
              <FiPieChart className="text-purple-600 w-4 h-4" />
              <span>Price / Litre Rate Trend (₹/L)</span>
            </h3>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-text-sub">Loading graph...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip formatter={(value) => [`₹${value}/L`, 'Rate']} />
                  <Line type="stepAfter" dataKey="avgPricePerLitre" stroke="#9333EA" strokeWidth={2.5} dot={{ r: 3, fill: '#9333EA' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

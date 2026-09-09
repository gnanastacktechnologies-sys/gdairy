import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSun,
  FiMoon,
  FiDroplet,
  FiCreditCard,
  FiUsers,
  FiDatabase,
  FiTrendingUp,
  FiPlusCircle,
  FiCheckCircle,
  FiClock
} from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/common/StatCard';
import { formatCurrency, formatLitres, formatDate } from '../utils/formatters';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayDate: '',
    today: { totalLitres: 0, totalAmount: 0, morningLitres: 0, morningAmount: 0, eveningLitres: 0, eveningAmount: 0 },
    settlement: { unpaidAmount: 0, unpaidLitres: 0, creditedAmount: 0, creditedLitres: 0 },
    overall: { totalLitres: 0, totalAmount: 0, averagePricePerLitre: 0, totalRecords: 0 },
    adminStats: null
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/dashboard');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-indigo-600/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-100 mb-2">
              <FiSun className="w-3.5 h-3.5 text-amber-300" />
              <span>Today: {formatDate(stats.todayDate)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-sm text-indigo-100/80 mt-1 max-w-xl font-medium">
              GDairy Milk Collection & Billing overview. Record today's morning or evening collection.
            </p>
          </div>

          <button
            onClick={() => navigate('/milk-entry')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-indigo-700 font-bold text-sm shadow-md hover:bg-indigo-50 transition-transform active:scale-95 flex-shrink-0"
          >
            <FiPlusCircle className="w-5 h-5 stroke-[2.5]" />
            <span>Add Today's Milk</span>
          </button>
        </div>
      </div>

      {/* Account Credit & Unpaid Balance Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
            <FiCreditCard className="text-emerald-600 w-5 h-5" />
            <span>Account Settlement Balance</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title="Unpaid Cycle Balance"
            value={loading ? '...' : formatCurrency(stats.settlement?.unpaidAmount)}
            subtitle={`${formatLitres(stats.settlement?.unpaidLitres)} unbilled milk in active cycle`}
            icon={FiClock}
            color="amber"
          />

          <StatCard
            title="Total Credited (Paid)"
            value={loading ? '...' : formatCurrency(stats.settlement?.creditedAmount)}
            subtitle={`${formatLitres(stats.settlement?.creditedLitres)} settled historical milk`}
            icon={FiCheckCircle}
            color="emerald"
          />
        </div>
      </div>

      {/* Today's Live Collection Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
            <FiDroplet className="text-primary w-5 h-5" />
            <span>Today's Milk Collection</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Today Total Milk"
            value={loading ? '...' : formatLitres(stats.today.totalLitres)}
            subtitle={`Total Amount: ${formatCurrency(stats.today.totalAmount)}`}
            icon={FiDroplet}
            color="indigo"
          />

          <StatCard
            title="Morning Session"
            value={loading ? '...' : formatLitres(stats.today.morningLitres)}
            subtitle={`Amount: ${formatCurrency(stats.today.morningAmount)}`}
            icon={FiSun}
            color="amber"
          />

          <StatCard
            title="Evening Session"
            value={loading ? '...' : formatLitres(stats.today.eveningLitres)}
            subtitle={`Amount: ${formatCurrency(stats.today.eveningAmount)}`}
            icon={FiMoon}
            color="purple"
          />
        </div>
      </div>

      {/* Admin Specific Summary Cards (if Admin) */}
      {isAdmin && stats.adminStats && (
        <div className="pt-2">
          <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
            <FiUsers className="text-indigo-600 w-5 h-5" />
            <span>System Administration Summary</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active Farmers / Users"
              value={loading ? '...' : `${stats.adminStats.activeUsers || stats.adminStats.totalUsers} Active`}
              subtitle={`Total Registered Users: ${stats.adminStats.totalUsers}`}
              icon={FiUsers}
              color="emerald"
            />
            <StatCard
              title="Total Collection Records"
              value={loading ? '...' : stats.adminStats.totalMilkRecords}
              subtitle="All time collection entries"
              icon={FiDatabase}
              color="emerald"
            />
            <StatCard
              title="Total Milk Quantity"
              value={loading ? '...' : formatLitres(stats.adminStats.totalMilkQuantity)}
              subtitle="Cumulative Litres Collected"
              icon={FiDroplet}
              color="indigo"
            />
            <StatCard
              title="Total Business Amount"
              value={loading ? '...' : formatCurrency(stats.adminStats.totalAmount)}
              subtitle="Cumulative Billing Amount"
              icon={FiCreditCard}
              color="emerald"
            />
          </div>
        </div>
      )}

      {/* All Time & Averages Overview */}
      <div className="pt-2">
        <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-indigo-600 w-5 h-5" />
          <span>Overall Metrics & Pricing</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="All-Time Litres"
            value={loading ? '...' : formatLitres(stats.overall.totalLitres)}
            subtitle={`${stats.overall.totalRecords} total entries recorded`}
            icon={FiDroplet}
            color="indigo"
          />
          <StatCard
            title="All-Time Amount"
            value={loading ? '...' : formatCurrency(stats.overall.totalAmount)}
            subtitle="Cumulative Billing"
            icon={FiCreditCard}
            color="emerald"
          />
          <StatCard
            title="Avg Price / Litre"
            value={loading ? '...' : `₹${stats.overall.averagePricePerLitre}/L`}
            subtitle="Effective average pricing"
            icon={FiTrendingUp}
            color="amber"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

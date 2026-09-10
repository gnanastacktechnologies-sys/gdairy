import mongoose from 'mongoose';
import MilkEntry from '../models/MilkEntry.js';
import User from '../models/User.js';

const roundTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// Helper to get YYYY-MM-DD string for today in India (Asia/Kolkata)
const getTodayString = () => {
  const now = new Date();
  // Format in IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().split('T')[0];
};

// @desc    Get dashboard metrics & totals
// @route   GET /api/analytics/dashboard
// @access  Private
export const getDashboardStats = async (req, res, next) => {
  try {
    const todayStr = getTodayString();

    const userMatch = {};
    if (req.user.role !== 'admin') {
      userMatch.user = new mongoose.Types.ObjectId(req.user._id);
    }

    const todayQuery = MilkEntry.aggregate([
      { $match: { ...userMatch, date: todayStr } },
      {
        $group: {
          _id: null,
          totalLitres: { $sum: '$litres' },
          totalAmount: { $sum: '$totalAmount' },
          morningLitres: { $sum: { $cond: [{ $eq: ['$session', 'morning'] }, '$litres', 0] } },
          morningAmount: { $sum: { $cond: [{ $eq: ['$session', 'morning'] }, '$totalAmount', 0] } },
          eveningLitres: { $sum: { $cond: [{ $eq: ['$session', 'evening'] }, '$litres', 0] } },
          eveningAmount: { $sum: { $cond: [{ $eq: ['$session', 'evening'] }, '$totalAmount', 0] } }
        }
      }
    ]);

    const allTimeQuery = MilkEntry.aggregate([
      { $match: userMatch },
      {
        $group: {
          _id: '$paymentStatus',
          totalLitres: { $sum: '$litres' },
          totalAmount: { $sum: '$totalAmount' },
          totalRecords: { $sum: 1 }
        }
      }
    ]);

    const isAdmin = req.user.role === 'admin';
    const totalUsersQuery = isAdmin ? User.countDocuments({ role: 'user' }) : Promise.resolve(0);
    const activeUsersQuery = isAdmin ? User.countDocuments({ role: 'user', status: 'active' }) : Promise.resolve(0);

    // Execute queries in parallel for maximum performance
    const [todayAggregation, allTimeAggregation, totalUsers, activeUsers] = await Promise.all([
      todayQuery,
      allTimeQuery,
      totalUsersQuery,
      activeUsersQuery
    ]);

    const todayStats = todayAggregation[0] || {
      totalLitres: 0,
      totalAmount: 0,
      morningLitres: 0,
      morningAmount: 0,
      eveningLitres: 0,
      eveningAmount: 0
    };

    let totalLitresAll = 0;
    let totalAmountAll = 0;
    let totalRecordsAll = 0;
    let unpaidAmount = 0;
    let unpaidLitres = 0;
    let creditedAmount = 0;
    let creditedLitres = 0;

    allTimeAggregation.forEach((item) => {
      totalLitresAll += item.totalLitres;
      totalAmountAll += item.totalAmount;
      totalRecordsAll += item.totalRecords;
      if (item._id === 'credited') {
        creditedAmount += item.totalAmount;
        creditedLitres += item.totalLitres;
      } else {
        unpaidAmount += item.totalAmount;
        unpaidLitres += item.totalLitres;
      }
    });

    const avgPricePerLitre = totalLitresAll > 0 ? roundTwo(totalAmountAll / totalLitresAll) : 0;

    const adminStats = isAdmin
      ? {
          totalUsers,
          activeUsers,
          totalMilkRecords: totalRecordsAll,
          totalMilkQuantity: roundTwo(totalLitresAll),
          totalAmount: roundTwo(totalAmountAll),
          unpaidBalance: roundTwo(unpaidAmount),
          creditedTotal: roundTwo(creditedAmount)
        }
      : null;

    res.status(200).json({
      success: true,
      data: {
        todayDate: todayStr,
        today: {
          totalLitres: roundTwo(todayStats.totalLitres),
          totalAmount: roundTwo(todayStats.totalAmount),
          morningLitres: roundTwo(todayStats.morningLitres),
          morningAmount: roundTwo(todayStats.morningAmount),
          eveningLitres: roundTwo(todayStats.eveningLitres),
          eveningAmount: roundTwo(todayStats.eveningAmount)
        },
        settlement: {
          unpaidAmount: roundTwo(unpaidAmount),
          unpaidLitres: roundTwo(unpaidLitres),
          creditedAmount: roundTwo(creditedAmount),
          creditedLitres: roundTwo(creditedLitres)
        },
        overall: {
          totalLitres: roundTwo(totalLitresAll),
          totalAmount: roundTwo(totalAmountAll),
          averagePricePerLitre: avgPricePerLitre,
          totalRecords: totalRecordsAll
        },
        adminStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get analytics datasets for charts (Quantity, Morning vs Evening, Revenue Amount, Price trend)
// @route   GET /api/analytics/charts
// @access  Private
export const getAnalyticsData = async (req, res, next) => {
  try {
    const { filter = '30days', startDate: customStart, endDate: customEnd, user } = req.query;

    let startDate;
    let endDate = getTodayString();

    const now = new Date();

    if (filter === 'today') {
      startDate = endDate;
    } else if (filter === '7days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split('T')[0];
    } else if (filter === '10days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 10);
      startDate = d.toISOString().split('T')[0];
    } else if (filter === '15days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 15);
      startDate = d.toISOString().split('T')[0];
    } else if (filter === '30days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      startDate = d.toISOString().split('T')[0];
    } else if (filter === '3months') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      startDate = d.toISOString().split('T')[0];
    } else if (filter === 'custom' && customStart && customEnd) {
      startDate = customStart;
      endDate = customEnd;
    } else {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      startDate = d.toISOString().split('T')[0];
    }

    const matchQuery = {
      date: { $gte: startDate, $lte: endDate }
    };

    if (req.user.role !== 'admin') {
      matchQuery.user = new mongoose.Types.ObjectId(req.user._id);
    } else if (user) {
      matchQuery.user = new mongoose.Types.ObjectId(user);
    }

    const aggregated = await MilkEntry.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$date',
          morningLitres: { $sum: { $cond: [{ $eq: ['$session', 'morning'] }, '$litres', 0] } },
          eveningLitres: { $sum: { $cond: [{ $eq: ['$session', 'evening'] }, '$litres', 0] } },
          totalLitres: { $sum: '$litres' },
          morningAmount: { $sum: { $cond: [{ $eq: ['$session', 'morning'] }, '$totalAmount', 0] } },
          eveningAmount: { $sum: { $cond: [{ $eq: ['$session', 'evening'] }, '$totalAmount', 0] } },
          totalAmount: { $sum: '$totalAmount' },
          avgPricePerLitre: { $avg: '$milkPricePerLitre' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const chartData = aggregated.map((item) => ({
      date: item._id,
      morningLitres: roundTwo(item.morningLitres),
      eveningLitres: roundTwo(item.eveningLitres),
      totalLitres: roundTwo(item.totalLitres),
      morningAmount: roundTwo(item.morningAmount),
      eveningAmount: roundTwo(item.eveningAmount),
      totalAmount: roundTwo(item.totalAmount),
      avgPricePerLitre: roundTwo(item.avgPricePerLitre)
    }));

    // Summary for period
    let sumLitres = 0;
    let sumAmount = 0;
    let morningLitresTotal = 0;
    let eveningLitresTotal = 0;

    chartData.forEach((d) => {
      sumLitres += d.totalLitres;
      sumAmount += d.totalAmount;
      morningLitresTotal += d.morningLitres;
      eveningLitresTotal += d.eveningLitres;
    });

    const daysCount = Math.max(1, chartData.length);
    const summary = {
      totalLitres: roundTwo(sumLitres),
      totalAmount: roundTwo(sumAmount),
      morningLitres: roundTwo(morningLitresTotal),
      eveningLitres: roundTwo(eveningLitresTotal),
      avgLitresPerDay: roundTwo(sumLitres / daysCount),
      avgAmountPerDay: roundTwo(sumAmount / daysCount),
      avgPricePerLitre: sumLitres > 0 ? roundTwo(sumAmount / sumLitres) : 0
    };

    res.status(200).json({
      success: true,
      filter,
      startDate,
      endDate,
      summary,
      chartData
    });
  } catch (error) {
    next(error);
  }
};

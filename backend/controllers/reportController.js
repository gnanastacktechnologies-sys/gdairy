import mongoose from 'mongoose';
import MilkEntry from '../models/MilkEntry.js';

const roundTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// @desc    Get Daily Reports aggregated by date
// @route   GET /api/reports/daily
// @access  Private
export const getDailyReports = async (req, res, next) => {
  try {
    const { startDate, endDate, user } = req.query;

    const matchQuery = {};

    if (req.user.role !== 'admin') {
      matchQuery.user = new mongoose.Types.ObjectId(req.user._id);
    } else if (user) {
      matchQuery.user = new mongoose.Types.ObjectId(user);
    }

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = startDate;
      if (endDate) matchQuery.date.$lte = endDate;
    }

    const aggregation = [
      { $match: matchQuery },
      {
        $group: {
          _id: '$date',
          morningLitres: {
            $sum: { $cond: [{ $eq: ['$session', 'morning'] }, '$litres', 0] }
          },
          morningAmount: {
            $sum: { $cond: [{ $eq: ['$session', 'morning'] }, '$totalAmount', 0] }
          },
          eveningLitres: {
            $sum: { $cond: [{ $eq: ['$session', 'evening'] }, '$litres', 0] }
          },
          eveningAmount: {
            $sum: { $cond: [{ $eq: ['$session', 'evening'] }, '$totalAmount', 0] }
          },
          totalLitres: { $sum: '$litres' },
          totalAmount: { $sum: '$totalAmount' },
          unpaidAmount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'unpaid'] }, '$totalAmount', 0] }
          },
          creditedAmount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'credited'] }, '$totalAmount', 0] }
          },
          statuses: { $addToSet: '$paymentStatus' }
        }
      },
      { $sort: { _id: -1 } }
    ];

    const results = await MilkEntry.aggregate(aggregation);

    const formattedData = results.map((item) => ({
      date: item._id,
      morningLitres: roundTwo(item.morningLitres),
      morningAmount: roundTwo(item.morningAmount),
      eveningLitres: roundTwo(item.eveningLitres),
      eveningAmount: roundTwo(item.eveningAmount),
      totalLitres: roundTwo(item.totalLitres),
      totalAmount: roundTwo(item.totalAmount),
      unpaidAmount: roundTwo(item.unpaidAmount),
      creditedAmount: roundTwo(item.creditedAmount),
      paymentStatus: item.statuses.includes('unpaid') ? 'unpaid' : 'credited'
    }));

    res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Period Summary Report (10/15/30/Custom Days)
// @route   GET /api/reports/period
// @access  Private
export const getPeriodReport = async (req, res, next) => {
  try {
    const { startDate, endDate, user } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Both startDate and endDate query parameters are required'
      });
    }

    const matchQuery = {
      date: { $gte: startDate, $lte: endDate }
    };

    if (req.user.role !== 'admin') {
      matchQuery.user = new mongoose.Types.ObjectId(req.user._id);
    } else if (user) {
      matchQuery.user = new mongoose.Types.ObjectId(user);
    }

    const aggregation = [
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalLitres: { $sum: '$litres' },
          totalAmount: { $sum: '$totalAmount' },
          morningLitres: {
            $sum: { $cond: [{ $eq: ['$session', 'morning'] }, '$litres', 0] }
          },
          morningAmount: {
            $sum: { $cond: [{ $eq: ['$session', 'morning'] }, '$totalAmount', 0] }
          },
          eveningLitres: {
            $sum: { $cond: [{ $eq: ['$session', 'evening'] }, '$litres', 0] }
          },
          eveningAmount: {
            $sum: { $cond: [{ $eq: ['$session', 'evening'] }, '$totalAmount', 0] }
          },
          unpaidAmount: {
            $sum: { $cond: [{ $ne: ['$paymentStatus', 'credited'] }, '$totalAmount', 0] }
          },
          creditedAmount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'credited'] }, '$totalAmount', 0] }
          },
          recordCount: { $sum: 1 }
        }
      }
    ];

    const result = await MilkEntry.aggregate(aggregation);
    const summary = result[0] || {
      totalLitres: 0,
      totalAmount: 0,
      morningLitres: 0,
      morningAmount: 0,
      eveningLitres: 0,
      eveningAmount: 0,
      unpaidAmount: 0,
      creditedAmount: 0,
      recordCount: 0
    };

    // Calculate difference in days between startDate and endDate
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);

    const totalLitres = roundTwo(summary.totalLitres);
    const totalAmount = roundTwo(summary.totalAmount);
    const morningLitres = roundTwo(summary.morningLitres);
    const morningAmount = roundTwo(summary.morningAmount);
    const eveningLitres = roundTwo(summary.eveningLitres);
    const eveningAmount = roundTwo(summary.eveningAmount);
    const unpaidAmount = roundTwo(summary.unpaidAmount);
    const creditedAmount = roundTwo(summary.creditedAmount);

    const averageLitresPerDay = roundTwo(totalLitres / daysCount);
    const averageAmountPerDay = roundTwo(totalAmount / daysCount);
    const averagePricePerLitre = totalLitres > 0 ? roundTwo(totalAmount / totalLitres) : 0;

    res.status(200).json({
      success: true,
      data: {
        startDate,
        endDate,
        daysCount,
        totalLitres,
        totalAmount,
        morningLitres,
        morningAmount,
        eveningLitres,
        eveningAmount,
        unpaidAmount,
        creditedAmount,
        averageLitresPerDay,
        averageAmountPerDay,
        averagePricePerLitre,
        recordCount: summary.recordCount
      }
    });
  } catch (error) {
    next(error);
  }
};

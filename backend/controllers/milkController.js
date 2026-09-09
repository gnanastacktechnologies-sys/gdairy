import MilkEntry from '../models/MilkEntry.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';

// Helper to round to 2 decimal places safely
const roundAmount = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// @desc    Add new milk entry
// @route   POST /api/milk
// @access  Private (User & Admin)
export const addMilkEntry = async (req, res, next) => {
  try {
    const { date, session, litres, milkPricePerLitre, userId, dairyName } = req.body;

    if (!date || !session || litres === undefined || milkPricePerLitre === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date, session, litres, and price per litre'
      });
    }

    const numLitres = parseFloat(litres);
    const numPrice = parseFloat(milkPricePerLitre);

    if (isNaN(numLitres) || numLitres <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Litres must be a positive number'
      });
    }

    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price per litre must be a non-negative number'
      });
    }

    if (!['morning', 'evening'].includes(session.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Session must be either morning or evening'
      });
    }

    // Permission check for normal users
    if (req.user.role !== 'admin') {
      if (req.user.permissions && req.user.permissions.canAddMilk === false) {
        return res.status(403).json({
          success: false,
          message: 'Milk collection entry access has been restricted for your account by Administrator.'
        });
      }
    }

    // Determine entry owner: if admin provides userId, use that; otherwise use logged-in user
    let targetUser = req.user._id;
    if (req.user.role === 'admin' && userId) {
      targetUser = userId;
    }

    const userDoc = await User.findById(targetUser);

    const effectiveStartDate = userDoc?.joiningDate || userDoc?.createdAt;
    if (effectiveStartDate) {
      const userStartDateStr = effectiveStartDate.toISOString().split('T')[0];
      if (date < userStartDateStr) {
        return res.status(400).json({
          success: false,
          message: `Cannot record milk entry prior to dairy joining date (${userStartDateStr}).`
        });
      }
    }

    // Determine Dairy Name
    let entryDairyName = dairyName ? dairyName.trim() : '';
    if (!entryDairyName && userDoc && userDoc.dairyName) {
      entryDairyName = userDoc.dairyName;
    }
    if (!entryDairyName) {
      const appSettings = await Settings.findOne();
      entryDairyName = appSettings?.dairyName || 'GDairy Central';
    }

    // Calculate total amount on backend (Source of Truth)
    const totalAmount = roundAmount(numLitres * numPrice);

    const milkEntry = await MilkEntry.create({
      user: targetUser,
      date,
      session: session.toLowerCase(),
      litres: numLitres,
      milkPricePerLitre: numPrice,
      totalAmount,
      dairyName: entryDairyName,
      createdBy: req.user._id
    });

    const populatedEntry = await MilkEntry.findById(milkEntry._id)
      .populate('user', 'name username userCode dairyName')
      .populate('createdBy', 'name username userCode role');

    res.status(201).json({
      success: true,
      message: 'Milk entry saved successfully',
      data: populatedEntry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get milk entries with pagination, filters & sorting
// @route   GET /api/milk
// @access  Private
export const getMilkEntries = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const { startDate, endDate, session, user, search, paymentStatus } = req.query;

    const query = {};

    // Role check: Normal users can ONLY see their own records
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    } else if (user) {
      query.user = user;
    }

    if (session) {
      query.session = session.toLowerCase();
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus.toLowerCase();
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const total = await MilkEntry.countDocuments(query);

    // Multi-sort: sort by specified field, then session/createdAt for deterministic pagination
    const sortObj = {};
    sortObj[sortBy] = sortOrder;
    if (sortBy !== 'createdAt') sortObj.createdAt = -1;

    const entries = await MilkEntry.find(query)
      .populate('user', 'name username userCode phone dairyName')
      .populate('createdBy', 'name username userCode role')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: entries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single milk entry
// @route   GET /api/milk/:id
// @access  Private
export const getMilkEntryById = async (req, res, next) => {
  try {
    const entry = await MilkEntry.findById(req.params.id)
      .populate('user', 'name username userCode dairyName')
      .populate('createdBy', 'name username userCode role');

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Milk entry not found' });
    }

    // Permission check
    if (req.user.role !== 'admin' && entry.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this record' });
    }

    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

// @desc    Update milk entry
// @route   PUT /api/milk/:id
// @access  Private
export const updateMilkEntry = async (req, res, next) => {
  try {
    const { date, session, litres, milkPricePerLitre, dairyName } = req.body;
    let entry = await MilkEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Milk entry not found' });
    }

    // Permission check
    if (req.user.role !== 'admin') {
      if (entry.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to edit this record' });
      }
      if (req.user.permissions && req.user.permissions.canEditMilk === false) {
        return res.status(403).json({ success: false, message: 'Editing milk records is restricted for your account by Administrator.' });
      }
    }

    if (date) {
      const userDoc = await User.findById(entry.user);
      const effectiveStartDate = userDoc?.joiningDate || userDoc?.createdAt;
      if (effectiveStartDate) {
        const userStartDateStr = effectiveStartDate.toISOString().split('T')[0];
        if (date < userStartDateStr) {
          return res.status(400).json({
            success: false,
            message: `Cannot set milk entry date prior to dairy joining date (${userStartDateStr}).`
          });
        }
      }
      entry.date = date;
    }
    if (session) entry.session = session.toLowerCase();
    if (dairyName !== undefined) entry.dairyName = dairyName.trim();

    if (litres !== undefined) {
      const numLitres = parseFloat(litres);
      if (isNaN(numLitres) || numLitres <= 0) {
        return res.status(400).json({ success: false, message: 'Litres must be a positive number' });
      }
      entry.litres = numLitres;
    }

    if (milkPricePerLitre !== undefined) {
      const numPrice = parseFloat(milkPricePerLitre);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ success: false, message: 'Price per litre must be a non-negative number' });
      }
      entry.milkPricePerLitre = numPrice;
    }

    // Recalculate total amount on backend
    entry.totalAmount = roundAmount(entry.litres * entry.milkPricePerLitre);

    await entry.save();
    const updatedEntry = await MilkEntry.findById(entry._id)
      .populate('user', 'name username')
      .populate('createdBy', 'name username role');

    res.status(200).json({
      success: true,
      message: 'Milk entry updated successfully',
      data: updatedEntry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete milk entry
// @route   DELETE /api/milk/:id
// @access  Private
export const deleteMilkEntry = async (req, res, next) => {
  try {
    const entry = await MilkEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Milk entry not found' });
    }

    // Permission check
    if (req.user.role !== 'admin') {
      if (entry.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this record' });
      }
      if (req.user.permissions && req.user.permissions.canDeleteMilk === false) {
        return res.status(403).json({ success: false, message: 'Deleting milk records is restricted for your account by Administrator.' });
      }
    }

    await MilkEntry.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Milk entry deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Credit Amount / Mark Period Billing as Credited (PAID)
// @route   POST /api/milk/credit-period
// @access  Private
export const creditPeriod = async (req, res, next) => {
  try {
    const { startDate, endDate, user: targetUserId } = req.body;

    // Permission check for normal users
    if (req.user.role !== 'admin') {
      if (req.user.permissions && req.user.permissions.canCreditAccount === false) {
        return res.status(403).json({
          success: false,
          message: 'Credit Account / Settlement access has been restricted for your account by Administrator.'
        });
      }
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both startDate and endDate for period settlement'
      });
    }

    const query = {
      date: { $gte: startDate, $lte: endDate },
      paymentStatus: 'unpaid'
    };

    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    } else if (targetUserId) {
      query.user = targetUserId;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const result = await MilkEntry.updateMany(query, {
      $set: {
        paymentStatus: 'credited',
        settlementDate: todayStr
      }
    });

    res.status(200).json({
      success: true,
      message: `Amount credited successfully for period ${startDate} to ${endDate}! The current balance is now settled, and next entries will calculate into the new unpaid cycle.`,
      data: {
        modifiedCount: result.modifiedCount,
        settlementDate: todayStr
      }
    });
  } catch (error) {
    next(error);
  }
};

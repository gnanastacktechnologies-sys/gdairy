import Settings from '../models/Settings.js';
import User from '../models/User.js';
import MilkEntry from '../models/MilkEntry.js';

// @desc    Get application settings
// @route   GET /api/settings
// @access  Private
export const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        retentionPeriod: 3,
        retentionUnit: 'months',
        billingCycle: '10days',
        settlementDay: 10,
        dairyName: 'GDairy Central',
        updatedBy: req.user?._id || null
      });
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update application settings
// @route   PUT /api/settings
// @access  Private/Admin
export const updateSettings = async (req, res, next) => {
  try {
    const { retentionPeriod, retentionUnit, billingCycle, settlementDay, dairyName } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({
        retentionPeriod: retentionPeriod || 3,
        retentionUnit: retentionUnit || 'months',
        billingCycle: billingCycle || '10days',
        settlementDay: settlementDay || 10,
        dairyName: dairyName ? dairyName.trim() : 'GDairy Central',
        updatedBy: req.user._id
      });
    } else {
      if (retentionPeriod !== undefined) settings.retentionPeriod = retentionPeriod;
      if (retentionUnit) settings.retentionUnit = retentionUnit;
      if (billingCycle) settings.billingCycle = billingCycle;
      if (settlementDay !== undefined) settings.settlementDay = settlementDay;
      if (dairyName !== undefined) settings.dairyName = dairyName.trim();
      settings.updatedBy = req.user._id;
    }

    await settings.save();

    // Propagate updated Dairy Name to all Users and Milk Entries for single source of truth
    if (dairyName !== undefined && dairyName.trim()) {
      const updatedDairyName = dairyName.trim();
      await User.updateMany({}, { dairyName: updatedDairyName });
      await MilkEntry.updateMany({}, { dairyName: updatedDairyName });
    }

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

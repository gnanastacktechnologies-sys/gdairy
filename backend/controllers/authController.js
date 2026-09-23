import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import MilkEntry from '../models/MilkEntry.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'gdairy_jwt_secret_key_super_secure_2026', {
    expiresIn: '30d'
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username and password'
      });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        userCode: user.userCode || (user.role === 'admin' ? 'ADM-001' : 'FARM-001'),
        phone: user.phone,
        dairyName: user.dairyName || '',
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        joiningDate: user.joiningDate || user.createdAt,
        permissions: user.permissions || { canAddMilk: true, canEditMilk: true, canDeleteMilk: false, canCreditAccount: true },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile info
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, username, phone, dairyName, userCode, joiningDate } = req.body;
    const user = await User.findById(req.user._id);

    if (username && req.user.role === 'admin' && username.toLowerCase().trim() !== user.username) {
      const cleanUsername = username.toLowerCase().trim();
      const existingUser = await User.findOne({ username: cleanUsername });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
      user.username = cleanUsername;
    }

    if (name) user.name = name;
    if (userCode !== undefined && req.user.role === 'admin') user.userCode = userCode.toUpperCase().trim();
    if (phone !== undefined) user.phone = phone;
    if (joiningDate) user.joiningDate = new Date(joiningDate);
    
    if (dairyName !== undefined && req.user.role === 'admin') {
      const trimmedDairyName = dairyName.trim();
      user.dairyName = trimmedDairyName;
      await Settings.updateOne({}, { dairyName: trimmedDairyName }, { upsert: true });
      await User.updateMany({}, { dairyName: trimmedDairyName });
      await MilkEntry.updateMany({}, { dairyName: trimmedDairyName });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change current user password
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Forgot Password (reset if username and mobile number match)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { username, phone, newPassword } = req.body;

    if (!username || !phone || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, mobile number, and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const cleanUsername = username.toLowerCase().trim();
    const cleanPhone = phone.trim();

    const user = await User.findOne({ username: cleanUsername });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid username or registered mobile number'
      });
    }

    const userPhoneClean = (user.phone || '').replace(/\D/g, '');
    const inputPhoneClean = cleanPhone.replace(/\D/g, '');

    if (!userPhoneClean || userPhoneClean !== inputPhoneClean) {
      return res.status(400).json({
        success: false,
        message: 'Registered mobile number does not match username'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now login with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Seed Initial Admin and Default Settings (Useful for Vercel deployment)
// @route   GET /api/auth/seed or POST /api/auth/seed
// @access  Public
export const seedDatabase = async (req, res, next) => {
  try {
    const adminUsername = (process.env.ADMIN_USERNAME || 'Gnanasekaran').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Gnana123@';
    const adminName = process.env.ADMIN_NAME || 'Gnanasekaran';

    let admin = await User.findOne({ role: 'admin' }) || await User.findOne({ username: adminUsername });

    if (admin) {
      admin.name = adminName;
      admin.username = adminUsername;
      admin.role = 'admin';
      admin.status = 'active';
      admin.userCode = admin.userCode || 'ADM-001';
      admin.password = adminPassword;
      await admin.save();
    } else {
      admin = await User.create({
        name: adminName,
        username: adminUsername,
        password: adminPassword,
        userCode: 'ADM-001',
        role: 'admin',
        status: 'active',
        phone: '9876543210'
      });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      await Settings.create({
        retentionPeriod: 3,
        retentionUnit: 'months',
        updatedBy: admin._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Database seeded successfully! Admin account ready.',
      adminUsername
    });
  } catch (error) {
    next(error);
  }
};


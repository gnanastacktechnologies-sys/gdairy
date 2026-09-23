import express from 'express';
import { login, getMe, updateProfile, changePassword, logout, forgotPassword, seedDatabase } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/seed', seedDatabase);
router.post('/seed', seedDatabase);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

export default router;

import express from 'express';
import { getDashboardStats, getAnalyticsData } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/charts', getAnalyticsData);

export default router;

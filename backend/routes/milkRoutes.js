import express from 'express';
import {
  addMilkEntry,
  getMilkEntries,
  getMilkEntryById,
  updateMilkEntry,
  deleteMilkEntry,
  creditPeriod
} from '../controllers/milkController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/credit-period', creditPeriod);

router.route('/')
  .get(getMilkEntries)
  .post(addMilkEntry);

router.route('/:id')
  .get(getMilkEntryById)
  .put(updateMilkEntry)
  .delete(deleteMilkEntry);

export default router;

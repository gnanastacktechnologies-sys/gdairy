import express from 'express';
import {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  resetPassword,
  deleteUser
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes below with Auth + Admin Role Check
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.post('/:id/reset-password', resetPassword);

export default router;

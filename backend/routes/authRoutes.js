import express from 'express';
import { register, login, getUser, updateUser, forgotPassword, resetPassword, verifyPhone, validateResetToken, clearResetToken, getAllUsers } from '../controllers/authController.js';
import { protect, admin, posUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-phone', verifyPhone);
router.get('/validate-reset-token/:token', validateResetToken);
router.post('/clear-reset-token', clearResetToken);
router.get('/user', protect, getUser);
router.put('/update', protect, updateUser);
router.get('/users', protect, posUser, getAllUsers); // Admin/POS only

export default router;
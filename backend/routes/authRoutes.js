import express from 'express';
import { register, login, getUser, updateUser, forgotPassword, resetPassword, verifyPhone, validateResetToken, clearResetToken } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

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

export default router;
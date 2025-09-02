import express from 'express';
import { register, login, getUser, updateUser, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/user', protect, getUser);
router.put('/update', protect, updateUser);

export default router;
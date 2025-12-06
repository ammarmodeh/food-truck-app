import express from 'express';
import { getSettings, updateSettings, resetSettings } from '../controllers/settingsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, admin, getSettings);
router.put('/', protect, admin, updateSettings);
router.post('/reset', protect, admin, resetSettings);

export default router;

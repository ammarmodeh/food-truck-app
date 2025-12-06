import express from 'express';
import { startShift, endShift, getCurrentShift } from '../controllers/shiftController.js';
import { protect, posUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/start', protect, posUser, startShift);
router.post('/end', protect, posUser, endShift);
router.get('/current', protect, posUser, getCurrentShift);

export default router;

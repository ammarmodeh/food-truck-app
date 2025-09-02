import express from 'express';
import { getSchedules, addSchedule, updateSchedule, deleteSchedule } from '../controllers/scheduleController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getSchedules);
router.post('/', protect, admin, addSchedule);
router.put('/:id', protect, admin, updateSchedule);
router.delete('/:id', protect, admin, deleteSchedule);

export default router;
import express from 'express';
import { getCurrentLocation, updateCurrentLocation } from '../controllers/locationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/current', getCurrentLocation);
router.put('/current', protect, admin, updateCurrentLocation);

export default router;
import express from 'express';
import { getAllLocations, getCurrentLocation, addLocation, updateLocation, deleteLocation } from '../controllers/locationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, admin, getAllLocations);
router.get('/current', getCurrentLocation);
router.post('/', protect, admin, addLocation);
router.put('/:id', protect, admin, updateLocation);
router.delete('/:id', protect, admin, deleteLocation);

export default router;
import express from 'express';
import {
  getTestimonials, // Make sure this is imported
  addTestimonial,
  updateTestimonial,
  deleteTestimonial,
  verifyTestimonialOwner,
  getPublicTestimonials,
  getAdminTestimonials
} from '../controllers/testimonialController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes for testimonials CRUD operations
router.get('/', protect, getTestimonials); // ADD THIS LINE - Main route for authenticated users
router.get('/admin', protect, admin, getAdminTestimonials);
router.get('/public', getPublicTestimonials);
router.post('/', protect, addTestimonial);
router.put('/:id', protect, verifyTestimonialOwner, updateTestimonial);
router.delete('/:id', protect, verifyTestimonialOwner, deleteTestimonial);

export default router;
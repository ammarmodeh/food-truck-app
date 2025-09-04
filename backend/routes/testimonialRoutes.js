import express from 'express';
import {
  getTestimonials,
  addTestimonial,
  updateTestimonial,
  deleteTestimonial,
  verifyTestimonialOwner,
  getPublicTestimonials,
  getAdminTestimonials // Add this new function
} from '../controllers/testimonialController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes for testimonials CRUD operations
router.get('/admin', protect, admin, getAdminTestimonials); // Admin access to view all testimonials with pagination and filtering
router.get('/public', getPublicTestimonials); // Public access to view testimonials
router.post('/', addTestimonial); // Allow all users (including anonymous) to add testimonials
router.put('/:id', protect, verifyTestimonialOwner, updateTestimonial);
router.delete('/:id', protect, admin, deleteTestimonial);

export default router;
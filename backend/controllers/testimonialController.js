import Testimonial from '../models/testimonialModel.js';

// Middleware to verify user owns the testimonial
export const verifyTestimonialOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: 'Invalid testimonial ID' });
    }

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }

    if (!testimonial.userId) {
      return res.status(403).json({ msg: 'Cannot edit anonymous testimonials' });
    }

    if (testimonial.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Not authorized to modify this testimonial' });
    }

    next();
  } catch (error) {
    console.error('Error verifying testimonial owner:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// Get all testimonials with pagination and filtering (admin only)
export const getTestimonials = async (req, res) => {
  try {
    const { page = 1, limit = 10, rating } = req.query;
    const query = rating ? { rating: parseInt(rating) } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const testimonials = await Testimonial.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalReviews = await Testimonial.countDocuments(query);
    const totalPages = Math.ceil(totalReviews / parseInt(limit));

    res.status(200).json({
      reviews: testimonials,
      currentPage: parseInt(page),
      totalPages,
      totalReviews,
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ msg: 'Error fetching testimonials', error: error.message });
  }
};

// Get public testimonials with pagination and optional filtering
export const getPublicTestimonials = async (req, res) => {
  try {
    const { page = 1, limit = 10, rating } = req.query;
    const query = rating ? { rating: parseInt(rating) } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const testimonials = await Testimonial.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('text author role rating avatar createdAt'); // Exclude userId for security

    const totalReviews = await Testimonial.countDocuments(query);
    const totalPages = Math.ceil(totalReviews / parseInt(limit));

    res.status(200).json({
      reviews: testimonials,
      currentPage: parseInt(page),
      totalPages,
      totalReviews,
    });
  } catch (error) {
    console.error('Error fetching public testimonials:', error);
    res.status(500).json({ msg: 'Error fetching public testimonials', error: error.message });
  }
};

// Add a new testimonial
export const addTestimonial = async (req, res) => {
  try {
    const { text, author, role, rating, avatar } = req.body;

    // Validate required fields
    if (!text || !author || !role || !rating) {
      return res.status(400).json({ msg: 'Text, author, role, and rating are required' });
    }

    const newTestimonial = new Testimonial({
      text,
      author,
      role,
      rating,
      avatar: avatar || '⭐',
      userId: req.user?._id || null, // Allow null for unauthenticated users
    });

    const savedTestimonial = await newTestimonial.save();
    res.status(201).json(savedTestimonial);
  } catch (error) {
    console.error('Error adding testimonial:', error);
    res.status(500).json({ msg: 'Error adding testimonial', error: error.message });
  }
};

// Update a testimonial by ID
export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, author, role, rating, avatar } = req.body;

    const testimonial = await Testimonial.findById(id);

    // Update fields if provided
    if (text) testimonial.text = text;
    if (author) testimonial.author = author;
    if (role) testimonial.role = role;
    if (rating) testimonial.rating = rating;
    if (avatar) testimonial.avatar = avatar;

    const updatedTestimonial = await testimonial.save();
    res.status(200).json(updatedTestimonial);
  } catch (error) {
    console.error('Error updating testimonial:', error);
    res.status(500).json({ msg: 'Error updating testimonial', error: error.message });
  }
};

// Delete a testimonial by ID
export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findByIdAndDelete(id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }

    res.status(200).json({ msg: 'Testimonial deleted successfully' });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({ msg: 'Error deleting testimonial', error: error.message });
  }
};

// Get all testimonials with pagination and filtering (admin only)
export const getAdminTestimonials = async (req, res) => {
  try {
    const { page = 1, limit = 10, rating } = req.query;
    const query = rating && rating !== 'all' ? { rating: parseInt(rating) } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const testimonials = await Testimonial.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalReviews = await Testimonial.countDocuments(query);
    const totalPages = Math.ceil(totalReviews / parseInt(limit));

    res.status(200).json({
      reviews: testimonials,
      currentPage: parseInt(page),
      totalPages,
      totalReviews,
    });
  } catch (error) {
    console.error('Error fetching admin testimonials:', error);
    res.status(500).json({ msg: 'Error fetching testimonials', error: error.message });
  }
};
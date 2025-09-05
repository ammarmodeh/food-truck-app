import Testimonial from '../models/testimonialModel.js';

// Middleware to verify user owns the testimonial
export const verifyTestimonialOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: 'Invalid testimonial ID format' });
    }

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }

    if (!testimonial.userId) {
      return res.status(403).json({ msg: 'Cannot edit or delete anonymous testimonials' });
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

// Get all testimonials with pagination and filtering (for authenticated users)
export const getTestimonials = async (req, res) => {
  try {
    const { page = 1, limit = 10, rating } = req.query;
    const query = rating ? { rating: parseInt(rating) } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const testimonials = await Testimonial.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('text author role rating avatar userId createdAt');

    const totalReviews = await Testimonial.countDocuments(query);
    const totalPages = Math.ceil(totalReviews / parseInt(limit));

    // console.log('Fetched testimonials for authenticated user:', testimonials);

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
      .select('text author role rating avatar createdAt');

    const totalReviews = await Testimonial.countDocuments(query);
    const totalPages = Math.ceil(totalReviews / parseInt(limit));

    // console.log('Fetched public testimonials:', testimonials);

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
    const { text, author, role, rating, avatar, userId } = req.body;

    // Validate required fields
    if (!text || !author || !role || !rating || !userId) {
      return res.status(400).json({ msg: 'Text, author, role, rating, and userId are required' });
    }

    // Verify that the userId matches the authenticated user
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Invalid user ID' });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }

    const newTestimonial = new Testimonial({
      text,
      author,
      role,
      rating,
      avatar: avatar || '⭐',
      userId,
    });

    const savedTestimonial = await newTestimonial.save();
    // console.log('Added testimonial:', savedTestimonial);
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

    // console.log('Update testimonial request:', { id, payload: req.body });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: 'Invalid testimonial ID format' });
    }

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }

    // Validate optional fields
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }
    if (text && text.length > 500) {
      return res.status(400).json({ msg: 'Testimonial text cannot exceed 500 characters' });
    }
    if (author && author.length > 100) {
      return res.status(400).json({ msg: 'Author name cannot exceed 100 characters' });
    }
    if (role && role.length > 100) {
      return res.status(400).json({ msg: 'Role cannot exceed 100 characters' });
    }
    if (avatar && avatar.length > 10) {
      return res.status(400).json({ msg: 'Avatar cannot exceed 10 characters' });
    }

    // Update fields if provided
    if (text !== undefined) testimonial.text = text;
    if (author !== undefined) testimonial.author = author;
    if (role !== undefined) testimonial.role = role;
    if (rating !== undefined) testimonial.rating = rating;
    if (avatar !== undefined) testimonial.avatar = avatar;

    const updatedTestimonial = await testimonial.save();
    // console.log('Updated testimonial:', updatedTestimonial);
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

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: 'Invalid testimonial ID format' });
    }

    const testimonial = await Testimonial.findByIdAndDelete(id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }

    // console.log('Deleted testimonial:', testimonial);
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

    // console.log('Fetched admin testimonials:', testimonials);
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
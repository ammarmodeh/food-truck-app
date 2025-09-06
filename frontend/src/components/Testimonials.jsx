import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';

const Testimonials = ({ isReady, isPublic }) => {
  const [testimonials, setTestimonials] = useState([]);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    text: '',
    author: '',
    role: '',
    rating: 0,
    avatar: '⭐',
  });
  const [formError, setFormError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [editingTestimonialId, setEditingTestimonialId] = useState(null);
  const { user, isAuthenticated, token, loading: authLoading = false } = useSelector((state) => state.auth);

  // Debug mount and props
  useEffect(() => {
    console.log('Testimonials component mounted:', { isReady, isPublic, isAuthenticated, userId: user?._id, token, authLoading });
  }, [isReady, isPublic, isAuthenticated, user, token, authLoading]);

  // Fetch testimonials
  const fetchTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting fetch for testimonials:', {
        endpoint: isPublic ? 'public' : 'authenticated',
        isReady,
        isAuthenticated,
        authLoading
      });

      // Always use public endpoint if not authenticated or still loading auth
      let endpoint = `${import.meta.env.VITE_BACKEND_API}/api/testimonials/public`;
      let headers = {
        'Content-Type': 'application/json',
      };

      // Only use authenticated endpoint if fully authenticated
      if (isAuthenticated && token && !authLoading) {
        endpoint = `${import.meta.env.VITE_BACKEND_API}/api/testimonials`;
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('Fetching from:', endpoint, 'with headers:', headers);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('Fetch testimonials timed out after 15 seconds');
        setLoading(false);
        setError('Request timed out');
      }, 15000);

      let response = await fetch(endpoint, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          response.status === 404
            ? 'Testimonials endpoint not found'
            : response.status === 401
              ? 'Unauthorized: Invalid or expired token'
              : response.status === 403
                ? 'Forbidden: You do not have permission to access this resource'
                : errorData.includes('<!DOCTYPE')
                  ? `Failed to fetch testimonials: Server returned HTML (status ${response.status})`
                  : errorData.msg || `Failed to fetch testimonials: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log('Raw API response:', data);

      // Validate response
      if (!data.reviews || !Array.isArray(data.reviews)) {
        throw new Error('Invalid response format: reviews is not an array');
      }

      const formattedTestimonials = data.reviews.map((item) => ({
        _id: item._id || '',
        text: item.text || '',
        author: item.author || 'Anonymous',
        role: item.role || 'Customer',
        rating: Number(item.rating) || 0,
        avatar: item.avatar || '⭐',
        userId: item.userId || null,
        createdAt: item.createdAt || new Date().toISOString(),
      }));

      console.log('Formatted testimonials:', formattedTestimonials);
      setTestimonials(formattedTestimonials);
      setLoading(false);
      console.log('State updated:', { testimonialsLength: formattedTestimonials.length, loading: false });
    } catch (err) {
      console.error('Fetch testimonials error:', err.message);
      setError(err.message || 'Unknown error fetching testimonials');
      setLoading(false);
      console.log('State updated:', { testimonialsLength: testimonials.length, loading: false, error: err.message });
    }
  }, [isPublic, isAuthenticated, token, authLoading, isReady]);

  useEffect(() => {
    // Wait for auth state to be fully determined and component to be ready
    if (isReady && isAuthenticated !== null && (authLoading === false || authLoading === undefined)) {
      fetchTestimonials();
    } else {
      console.warn('Waiting for auth state or component readiness:', {
        isReady,
        isAuthenticated,
        authLoading
      });
      setLoading(false);
    }
  }, [isReady, isPublic, isAuthenticated, authLoading, fetchTestimonials]);

  // Handle testimonial carousel
  useEffect(() => {
    if (!loading && testimonials.length > 0) {
      const testimonialInterval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(testimonialInterval);
    }
  }, [loading, testimonials.length]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle star rating selection
  const handleRatingChange = (rating) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitSuccess(false);

    if (!isAuthenticated || !user?._id) {
      setFormError('You must be logged in to submit a review');
      return;
    }

    if (!formData.text || !formData.author || !formData.role || formData.rating === 0) {
      setFormError('All fields and a rating are required');
      return;
    }

    try {
      const payload = {
        text: formData.text,
        author: formData.author,
        role: formData.role,
        rating: formData.rating,
        avatar: formData.avatar,
      };

      // Include userId only for POST requests (create)
      if (!editingTestimonialId) {
        payload.userId = user._id;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const url = editingTestimonialId
        ? `${import.meta.env.VITE_BACKEND_API}/api/testimonials/${editingTestimonialId}`
        : `${import.meta.env.VITE_BACKEND_API}/api/testimonials`;

      const method = editingTestimonialId ? 'PUT' : 'POST';

      console.log('Submitting testimonial:', { url, method, payload, headers });

      let response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      // Retry with refreshed token if 401 Unauthorized
      if (response.status === 401) {
        console.warn('Unauthorized request, attempting to refresh token');
        const refreshResponse = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!refreshResponse.ok) {
          throw new Error('Failed to refresh token');
        }

        const { token: newToken } = await refreshResponse.json();
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, {
          method,
          headers,
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          response.status === 400
            ? data.msg || 'Invalid request data'
            : response.status === 403
              ? 'Forbidden: You do not have permission to modify this testimonial'
              : response.status === 404
                ? 'Testimonial not found'
                : data.msg || `Failed to ${editingTestimonialId ? 'update' : 'submit'} testimonial: ${response.status} ${response.statusText}`
        );
      }

      // Re-fetch testimonials to ensure fresh data
      await fetchTestimonials();

      setFormData({
        text: '',
        author: '',
        role: '',
        rating: 0,
        avatar: '⭐',
      });
      setEditingTestimonialId(null);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      console.log('Testimonial submitted successfully:', data);
    } catch (err) {
      setFormError(err.message);
      console.error('Submit testimonial error:', err.message, 'Status:', err.status);
    }
  };

  // Handle edit testimonial
  const handleEdit = (testimonial) => {
    setFormData({
      text: testimonial.text,
      author: testimonial.author,
      role: testimonial.role,
      rating: testimonial.rating,
      avatar: testimonial.avatar,
    });
    setEditingTestimonialId(testimonial._id);
    console.log('Editing testimonial:', testimonial);
  };

  // Handle delete testimonial
  const handleDelete = async (testimonialId) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      console.log('Deleting testimonial:', testimonialId);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/testimonials/${testimonialId}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          response.status === 403
            ? 'Forbidden: You do not have permission to delete this testimonial'
            : response.status === 404
              ? 'Testimonial not found'
              : data.msg || 'Failed to delete testimonial'
        );
      }

      // Re-fetch testimonials to ensure fresh data
      await fetchTestimonials();

      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      console.log('Testimonial deleted successfully:', data);
    } catch (err) {
      setFormError(err.message);
      console.error('Delete testimonial error:', err.message);
    }
  };

  const itemVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 1,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const LoadingSkeleton = ({ className, children }) => (
    <div className={`animate-pulse ${className}`}>
      {children}
    </div>
  );

  return (
    <motion.section
      className="py-32 relative"
      variants={itemVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      style={{ position: 'relative' }}
    >
      <div className="container mx-auto px-6">
        <motion.div className="text-center mb-20" variants={itemVariants}>
          <motion.h2
            className="text-5xl sm:text-6xl md:text-7xl font-black mb-8 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
            initial={{ scale: 0.5 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            TESTIMONIALS
          </motion.h2>
          <motion.div
            className="w-40 h-1 bg-gradient-to-r from-cyan-400 to-pink-500 mx-auto rounded-full"
            initial={{ width: 0 }}
            whileInView={{ width: "10rem" }}
            transition={{ duration: 1.2, delay: 0.5 }}
          />
        </motion.div>

        {/* Review Form - Show only for authenticated users */}
        {isAuthenticated === true && (
          <motion.div
            className="max-w-2xl mx-auto mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative card-gradient-bg backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5" />
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-6">
                  {editingTestimonialId ? 'Edit Your Review' : 'Share Your Experience'}
                </h3>
                {formError && (
                  <motion.div
                    className="text-red-400 mb-4 text-center bg-red-900/50 p-4 rounded-xl border border-red-400/50"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {formError}
                  </motion.div>
                )}
                <div className="space-y-6">
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder="Your Name"
                    className="w-full px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-purple-400 transition-all duration-300"
                  />
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    placeholder="Your Role (e.g., Foodie, Customer)"
                    className="w-full px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-purple-400 transition-all duration-300"
                  />
                  <textarea
                    name="text"
                    value={formData.text}
                    onChange={handleInputChange}
                    placeholder="Write your review..."
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-purple-400 transition-all duration-300 resize-none h-32"
                  />
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        className={`text-2xl ${formData.rating >= star ? 'text-yellow-400' : 'text-white/30'}`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        ⭐
                      </motion.button>
                    ))}
                  </div>
                  <div className="flex justify-center items-center gap-2">
                    <motion.button
                      onClick={handleSubmit}
                      className="group relative text-sm sm:text-lg px-4 sm:px-6 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white rounded-full font-bold shadow-2xl overflow-hidden max-w-xs"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className={`relative z-10 flex items-center justify-center space-x-2`}>
                        <span>{editingTestimonialId ? 'Update Review' : 'Submit Review'}</span>
                        <span>🚀</span>
                      </span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100"
                        transition={{ duration: 0.3 }}
                      />
                    </motion.button>
                    {editingTestimonialId && (
                      <motion.button
                        onClick={() => {
                          setFormData({
                            text: '',
                            author: '',
                            role: '',
                            rating: 0,
                            avatar: '⭐',
                          });
                          setEditingTestimonialId(null);
                        }}
                        className="group relative px-4 sm:px-6 py-3 text-sm sm:text-lg bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 text-white rounded-full font-bold shadow-2xl overflow-hidden"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="relative z-10">Cancel</span>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-gray-500 via-gray-400 to-gray-500 opacity-0 group-hover:opacity-100"
                          transition={{ duration: 0.3 }}
                        />
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {submitSuccess && (
              <motion.p
                className="text-green-400 mt-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {editingTestimonialId ? 'Review updated successfully!' : 'Thank you for your review! It has been submitted successfully.'}
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Testimonials Display */}
        <AnimatePresence mode="wait">
          {console.log('Rendering testimonials:', { isReady, loading, testimonialsLength: testimonials.length, error, authLoading })}
          {!isReady || authLoading ? (
            <motion.div
              className="text-center py-20 max-w-5xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-9xl mb-8 filter drop-shadow-2xl">🕒</div>
              <h3 className="text-4xl font-bold text-white mb-6">Waiting for Authentication</h3>
              <p className="text-white/60 text-xl">Please wait while we verify your session...</p>
            </motion.div>
          ) : loading ? (
            <motion.div
              className="text-center py-20 max-w-5xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <LoadingSkeleton className="group">
                <div className="relative bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-2xl border border-white/10 p-12 rounded-3xl shadow-2xl text-center overflow-hidden">
                  <div className="h-20 bg-gradient-to-r from-slate-600/50 to-slate-500/50 rounded-full mb-8"></div>
                  <div className="h-8 bg-slate-700/50 rounded-full mb-6"></div>
                  <div className="h-6 bg-slate-600/50 rounded-full w-3/4 mx-auto"></div>
                </div>
              </LoadingSkeleton>
              <p className="text-white/60 mt-4">Loading testimonials...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              className="text-center py-20 max-w-5xl mx-auto"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="text-9xl mb-8 filter drop-shadow-2xl"
              >
                🔮
              </motion.div>
              <h3 className="text-4xl font-bold text-white mb-6">Error Loading Testimonials</h3>
              <p className="text-white/60 mb-12 text-xl">{error}</p>
              <motion.button
                className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-10 py-4 rounded-full font-bold text-lg shadow-2xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchTestimonials()}
              >
                Retry
              </motion.button>
            </motion.div>
          ) : testimonials.length === 0 ? (
            <motion.div
              className="text-center py-20 max-w-5xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-9xl mb-8 filter drop-shadow-2xl">🎭</div>
              <h3 className="text-4xl font-bold text-white mb-6">No Testimonials Yet</h3>
              <p className="text-white/60 text-xl">Be the first to share your experience!</p>
            </motion.div>
          ) : (
            <motion.div
              className="max-w-5xl mx-auto mb-20"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                key={currentTestimonial}
                className="relative card-gradient-bg backdrop-blur-2xl border border-white/10 p-12 rounded-3xl shadow-2xl text-center overflow-hidden"
                initial={{ opacity: 0, y: 100, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -100, scale: 0.8 }}
                transition={{ duration: 0.6 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-cyan-500/5" />
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"></div>
                <motion.div
                  className="text-8xl mb-8 filter drop-shadow-lg"
                >
                  {testimonials[currentTestimonial].avatar}
                </motion.div>
                <motion.p
                  className="text-2xl md:text-3xl text-white mb-8 leading-relaxed italic font-light"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  "{testimonials[currentTestimonial].text}"
                </motion.p>
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex text-yellow-400 text-2xl">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
                      >
                        ⭐
                      </motion.span>
                    ))}
                  </div>
                  <div className="text-center">
                    <h4 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      {testimonials[currentTestimonial].author}
                    </h4>
                    <p className="text-white/60 text-lg">{testimonials[currentTestimonial].role}</p>
                  </div>
                  {/* Debug info for troubleshooting */}
                  {console.log('User ID debug:', {
                    user: user?._id,
                    testimonial: testimonials[currentTestimonial]?.userId,
                    match: testimonials[currentTestimonial]?.userId?.toString() === user?._id?.toString(),
                    isAuthenticated,
                    isPublic
                  })}
                  {!isPublic &&
                    isAuthenticated &&
                    user?._id &&
                    testimonials[currentTestimonial]?.userId &&
                    testimonials[currentTestimonial].userId.toString() === user._id.toString() && (
                      <div className="flex justify-center space-x-4 mt-4">
                        <motion.button
                          onClick={() => handleEdit(testimonials[currentTestimonial])}
                          className="group relative px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full font-bold shadow-2xl overflow-hidden"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="relative z-10">Edit</span>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100"
                            transition={{ duration: 0.3 }}
                          />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(testimonials[currentTestimonial]._id)}
                          className="group relative px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-bold shadow-2xl overflow-hidden"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="relative z-10">Delete</span>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-pink-500 to-red-500 opacity-0 group-hover:opacity-100"
                            transition={{ duration: 0.3 }}
                          />
                        </motion.button>
                      </div>
                    )}
                </div>
              </motion.div>
              <div className="flex justify-center space-x-4 mt-12">
                {testimonials.map((_, index) => (
                  <motion.button
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${index === currentTestimonial
                      ? 'bg-gradient-to-r from-cyan-400 to-pink-500 scale-125 shadow-lg'
                      : 'bg-white/30 hover:bg-white/50'
                      }`}
                    onClick={() => setCurrentTestimonial(index)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

export default Testimonials;
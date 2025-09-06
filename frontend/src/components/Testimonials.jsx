import { useState, useEffect, useCallback } from 'react';
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

  // Fetch testimonials
  const fetchTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = `${import.meta.env.VITE_BACKEND_API}/api/testimonials/public`;
      let headers = {
        'Content-Type': 'application/json',
      };

      if (isAuthenticated && token && !authLoading) {
        endpoint = `${import.meta.env.VITE_BACKEND_API}/api/testimonials`;
        headers['Authorization'] = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('Fetch testimonials timed out after 15 seconds');
        setError('Request timed out');
        setLoading(false);
      }, 15000);

      const response = await fetch(endpoint, {
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

      setTestimonials(formattedTestimonials);
      setLoading(false);
    } catch (err) {
      console.error('Fetch testimonials error:', err.message);
      setError(err.message || 'Unable to load testimonials. Please try again.');
      setLoading(false);
    }
  }, [isPublic, isAuthenticated, token, authLoading]);

  // Optimize fetch trigger to prevent unnecessary re-renders
  useEffect(() => {
    if (!isReady || isAuthenticated === null || authLoading) {
      setLoading(false);
      return;
    }
    fetchTestimonials();
  }, [isReady, isAuthenticated, authLoading, fetchTestimonials]);

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

      let response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

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
    } catch (err) {
      setFormError(err.message);
      console.error('Submit testimonial error:', err.message);
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
  };

  // Handle delete testimonial
  const handleDelete = async (testimonialId) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

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

      await fetchTestimonials();
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      setFormError(err.message);
      console.error('Delete testimonial error:', err.message);
    }
  };

  const LoadingSkeleton = ({ className, children }) => (
    <div className={`animate-pulse ${className}`}>
      {children}
    </div>
  );

  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-black mb-8 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            TESTIMONIALS
          </h2>
          <div className="w-40 h-1 bg-gradient-to-r from-cyan-400 to-pink-500 mx-auto rounded-full" />
        </div>

        {/* Review Form - Show only for authenticated users */}
        {isAuthenticated === true && (
          <div className="max-w-2xl mx-auto mb-20">
            <div className="relative card-gradient-bg backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5" />
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-6">
                  {editingTestimonialId ? 'Edit Your Review' : 'Share Your Experience'}
                </h3>
                {formError && (
                  <div className="text-red-400 mb-4 text-center bg-red-900/50 p-4 rounded-xl border border-red-400/50">
                    {formError}
                  </div>
                )}
                <div className="space-y-6">
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder="Your Name"
                    className="w-full px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-purple-400 transition-all duration-300"
                    aria-label="Your Name"
                  />
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    placeholder="Your Role (e.g., Foodie, Customer)"
                    className="w-full px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-purple-400 transition-all duration-300"
                    aria-label="Your Role"
                  />
                  <textarea
                    name="text"
                    value={formData.text}
                    onChange={handleInputChange}
                    placeholder="Write your review..."
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-purple-400 transition-all duration-300 resize-none h-32"
                    aria-label="Write your review"
                  />
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        className={`text-2xl ${formData.rating >= star ? 'text-yellow-400' : 'text-white/30'}`}
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={handleSubmit}
                      className="group relative text-sm sm:text-lg px-4 sm:px-6 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white rounded-full font-bold shadow-2xl overflow-hidden max-w-xs"
                      aria-label={editingTestimonialId ? 'Update Review' : 'Submit Review'}
                    >
                      <span className="relative z-10 flex items-center justify-center space-x-2">
                        <span>{editingTestimonialId ? 'Update Review' : 'Submit Review'}</span>
                        <span>🚀</span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100" />
                    </button>
                    {editingTestimonialId && (
                      <button
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
                        aria-label="Cancel editing review"
                      >
                        <span className="relative z-10">Cancel</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-500 via-gray-400 to-gray-500 opacity-0 group-hover:opacity-100" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {submitSuccess && (
              <p className="text-green-400 mt-4 text-center">
                {editingTestimonialId ? 'Review updated successfully!' : 'Thank you for your review! It has been submitted successfully.'}
              </p>
            )}
          </div>
        )}

        {/* Testimonials Display */}
        {(!isReady || authLoading) ? (
          <div className="text-center py-20 max-w-5xl mx-auto card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700">
            <div className="text-9xl mb-8 filter drop-shadow-2xl">🕒</div>
            <h3 className="text-4xl font-bold text-white mb-6">Waiting for Authentication</h3>
            <p className="text-white/60 text-xl">Please wait while we verify your session...</p>
          </div>
        ) : loading ? (
          <div className="text-center py-20 max-w-5xl mx-auto card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700">
            <LoadingSkeleton className="group">
              <div className="relative bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-2xl border border-white/10 p-12 rounded-3xl shadow-2xl text-center overflow-hidden">
                <div className="h-20 bg-gradient-to-r from-slate-600/50 to-slate-500/50 rounded-full mb-8"></div>
                <div className="h-8 bg-slate-700/50 rounded-full mb-6"></div>
                <div className="h-6 bg-slate-600/50 rounded-full w-3/4 mx-auto"></div>
              </div>
            </LoadingSkeleton>
            <p className="text-white/60 mt-4">Loading testimonials...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 max-w-5xl mx-auto card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700">
            <div className="text-9xl mb-8 filter drop-shadow-2xl">🔮</div>
            <h3 className="text-4xl font-bold text-white mb-6">Unable to Load Testimonials</h3>
            <p className="text-white/60 mb-12 text-xl">{error}</p>
            <button
              className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-10 py-4 rounded-full font-bold text-lg shadow-2xl"
              onClick={fetchTestimonials}
              aria-label="Retry loading testimonials"
            >
              Try Again
            </button>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-20 max-w-5xl mx-auto card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700">
            <div className="text-9xl mb-8 filter drop-shadow-2xl">🎭</div>
            <h3 className="text-4xl font-bold text-white mb-6">No Testimonials Yet</h3>
            <p className="text-white/60 text-xl">Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto mb-20">
            <div
              className="relative card-gradient-bg backdrop-blur-2xl border border-white/10 p-12 rounded-3xl shadow-2xl text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-cyan-500/5" />
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"></div>
              <div className="text-8xl mb-8 filter drop-shadow-lg">
                {testimonials[currentTestimonial].avatar}
              </div>
              <p className="text-2xl md:text-3xl text-white mb-8 leading-relaxed italic font-light">
                "{testimonials[currentTestimonial].text}"
              </p>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex text-yellow-400 text-2xl">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>
                <div className="text-center">
                  <h4 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    {testimonials[currentTestimonial].author}
                  </h4>
                  <p className="text-white/60 text-lg">{testimonials[currentTestimonial].role}</p>
                </div>
                {!isPublic &&
                  isAuthenticated &&
                  user?._id &&
                  testimonials[currentTestimonial]?.userId &&
                  testimonials[currentTestimonial].userId.toString() === user._id.toString() && (
                    <div className="flex justify-center space-x-4 mt-4">
                      <button
                        onClick={() => handleEdit(testimonials[currentTestimonial])}
                        className="group relative px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full font-bold shadow-2xl overflow-hidden"
                        aria-label="Edit testimonial"
                      >
                        <span className="relative z-10">Edit</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100" />
                      </button>
                      <button
                        onClick={() => handleDelete(testimonials[currentTestimonial]._id)}
                        className="group relative px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-bold shadow-2xl overflow-hidden"
                        aria-label="Delete testimonial"
                      >
                        <span className="relative z-10">Delete</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-red-500 opacity-0 group-hover:opacity-100" />
                      </button>
                    </div>
                  )}
              </div>
            </div>
            <div className="flex justify-center space-x-4 mt-12">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${index === currentTestimonial
                    ? 'bg-gradient-to-r from-cyan-400 to-pink-500 scale-125 shadow-lg'
                    : 'bg-white/30 hover:bg-white/50'
                    }`}
                  onClick={() => setCurrentTestimonial(index)}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
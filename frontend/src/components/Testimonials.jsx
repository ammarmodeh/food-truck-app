import { useState, useEffect, useRef } from 'react';
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
  const isMounted = useRef(true);
  const { user, isAuthenticated, token } = useSelector((state) => state.auth);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch testimonials
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        setError(null);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const endpoint = isPublic
          ? `${import.meta.env.VITE_BACKEND_API}/api/testimonials/public`
          : `${import.meta.env.VITE_BACKEND_API}/api/testimonials`;

        const headers = isPublic
          ? { 'Content-Type': 'application/json' }
          : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        const response = await fetch(endpoint, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to fetch testimonials: ${response.statusText}`);
        }

        const data = await response.json();
        const formattedTestimonials = data.reviews.map((item) => ({
          _id: item._id,
          text: item.text,
          author: item.author,
          role: item.role,
          rating: item.rating,
          avatar: item.avatar || '⭐',
          userId: item.userId || null,
          createdAt: item.createdAt,
        }));

        if (isMounted.current) {
          setTestimonials(formattedTestimonials);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchTestimonials();

    return () => {
      isMounted.current = false;
    };
  }, [isPublic, token]);

  // Handle testimonial carousel
  useEffect(() => {
    if (!loading && testimonials.length > 0) {
      const testimonialInterval = setInterval(() => {
        if (isMounted.current) {
          setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }
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

  // Handle form submission (add new testimonial)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitSuccess(false);

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
      if (isAuthenticated && user?._id) {
        payload.userId = user._id;
      }

      const headers = {
        'Content-Type': 'application/json',
      };
      if (isAuthenticated && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/testimonials`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to submit testimonial');
      }

      if (isMounted.current) {
        setTestimonials((prev) => [...prev, data]);
        setFormData({
          text: '',
          author: '',
          role: '',
          rating: 0,
          avatar: '⭐',
        });
        setSubmitSuccess(true);
        // Clear success message after 3 seconds
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch (err) {
      if (isMounted.current) {
        setFormError(err.message);
      }
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
    >
      <div className="container mx-auto px-6">
        <motion.div className="text-center mb-20" variants={itemVariants}>
          <motion.h2
            className="text-5xl sm:text-6xl md:text-7xl font-black mb-8 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"
            initial={{ scale: 0.5 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            TESTIMONIALS
          </motion.h2>
          <motion.div
            className="w-40 h-1 bg-gradient-to-r from-pink-400 to-cyan-500 mx-auto rounded-full"
            initial={{ width: 0 }}
            whileInView={{ width: "10rem" }}
            transition={{ duration: 1.2, delay: 0.5 }}
          />
        </motion.div>

        {/* Review Form - Show for public pages OR when user is authenticated */}
        {(isPublic || isAuthenticated) && (
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
                  Share Your Experience
                </h3>
                {formError && (
                  <motion.p
                    className="text-red-400 mb-4 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {formError}
                  </motion.p>
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
                  <motion.button
                    onClick={handleSubmit}
                    className="group relative px-8 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white rounded-full font-bold shadow-2xl overflow-hidden w-full"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="relative z-10 flex items-center justify-center space-x-2">
                      <span>Submit Review</span>
                      <span>🚀</span>
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100"
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                </div>
              </div>
            </div>
            {submitSuccess && (
              <motion.p
                className="text-green-400 mb-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                Thank you for your review! It has been submitted successfully.
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Testimonials Display */}
        <AnimatePresence mode="wait">
          {isReady && !loading ? (
            error ? (
              <motion.div
                className="text-center py-20 max-w-5xl mx-auto"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div
                  className="text-9xl mb-8 filter drop-shadow-2xl"
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🔮
                </motion.div>
                <h3 className="text-4xl font-bold text-white mb-6">Error Loading Testimonials</h3>
                <p className="text-white/60 mb-12 text-xl">{error}</p>
                <motion.button
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-10 py-4 rounded-full font-bold text-lg shadow-2xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.reload()}
                >
                  Retry
                </motion.button>
              </motion.div>
            ) : testimonials.length === 0 ? (
              <motion.div
                className="text-center py-20 max-w-5xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
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
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500"></div>
                  <motion.div
                    className="text-8xl mb-8 filter drop-shadow-lg"
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
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
                  </div>
                </motion.div>
                <div className="flex justify-center space-x-4 mt-12">
                  {testimonials.map((_, index) => (
                    <motion.button
                      key={index}
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${index === currentTestimonial
                        ? 'bg-gradient-to-r from-pink-500 to-cyan-500 scale-125 shadow-lg'
                        : 'bg-white/30 hover:bg-white/50'
                        }`}
                      onClick={() => setCurrentTestimonial(index)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>
              </motion.div>
            )
          ) : (
            <motion.div
              className="max-w-5xl mx-auto mb-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
            >
              <LoadingSkeleton className="group">
                <div className="relative bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-2xl border border-white/10 p-12 rounded-3xl shadow-2xl text-center overflow-hidden">
                  <div className="h-20 bg-gradient-to-r from-slate-600/50 to-slate-500/50 rounded-full mb-8"></div>
                  <div className="h-8 bg-slate-700/50 rounded-full mb-6"></div>
                  <div className="h-6 bg-slate-600/50 rounded-full w-3/4 mx-auto"></div>
                </div>
              </LoadingSkeleton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

export default Testimonials;
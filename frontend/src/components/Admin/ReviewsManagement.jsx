import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';

const ReviewsManagement = () => {
  const { token } = useSelector((state) => state.auth);
  const [allReviews, setAllReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterRating, setFilterRating] = useState('all');
  const [viewReview, setViewReview] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const isMounted = useRef(true);
  const reviewsPerPage = 10;

  // Fetch ALL reviews once
  useEffect(() => {
    const fetchAllReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API}/api/testimonials/admin?limit=1000`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : undefined,
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to fetch reviews: ${response.status} ${response.statusText} - ${errorData.msg || 'No additional error message'}`
          );
        }

        const data = await response.json();

        if (!data.reviews) {
          throw new Error('Invalid response format: No reviews array');
        }

        const formattedReviews = data.reviews.map((item) => ({
          _id: item._id,
          text: item.text,
          author: item.author,
          role: item.role,
          rating: item.rating,
          avatar: item.avatar || '⭐',
          userId: item.userId,
          createdAt: new Date(item.createdAt).toLocaleDateString(),
        }));

        if (isMounted.current) {
          setAllReviews(formattedReviews);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted.current) {
          console.error('Fetch error:', err);
          setError(
            err.name === 'AbortError'
              ? 'Request timed out. Please try again.'
              : err.message || 'Unknown error occurred'
          );
          setLoading(false);
        }
      }
    };

    if (token) {
      fetchAllReviews();
    } else {
      setError('No authentication token found. Please log in.');
      setLoading(false);
    }

    return () => {
      isMounted.current = false;
    };
  }, [token]);

  // Filter reviews locally based on rating filter
  useEffect(() => {
    let filtered;

    if (filterRating !== 'all') {
      filtered = allReviews.filter(review => review.rating === parseInt(filterRating));
    } else {
      // Create a new array reference for "All ratings" to ensure reactivity
      filtered = [...allReviews];
    }

    setFilteredReviews(filtered);
    setTotalPages(Math.ceil(filtered.length / reviewsPerPage));
  }, [allReviews, filterRating, reviewsPerPage]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterRating]);

  // Get current page reviews
  const getCurrentPageReviews = () => {
    const startIndex = (currentPage - 1) * reviewsPerPage;
    const endIndex = startIndex + reviewsPerPage;
    return filteredReviews.slice(startIndex, endIndex);
  };

  // Handle delete review - FIXED VERSION
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/testimonials/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to delete review');
      }

      if (isMounted.current) {
        // Remove from local state
        const updatedReviews = allReviews.filter((review) => review._id !== id);
        setAllReviews(updatedReviews);

        // If this was the last review on the current page, go to previous page
        if (getCurrentPageReviews().length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }

        setDeleteConfirm(null); // Close the confirmation dialog
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.message);
        setDeleteConfirm(null); // Close the dialog even on error
      }
    }
  };

  // Pagination controls
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilterRating(e.target.value);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  return (
    <motion.section
      className="py-32 relative"
      variants={itemVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container mx-auto px-6">
        <motion.h2
          className="text-5xl font-black mb-8 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent text-center"
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, type: 'spring' }}
        >
          Reviews Management
        </motion.h2>

        {/* Filter Section */}
        <motion.div
          className="mb-8 flex justify-center"
          variants={itemVariants}
        >
          <div className="relative bg-gradient-to-br from-slate-900/70 via-slate-800/70 to-slate-900/70 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl shadow-2xl">
            <label className="text-white font-semibold mr-4">Filter by Rating:</label>
            <select
              value={filterRating}
              onChange={handleFilterChange}
              className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-400 transition-all duration-300"
              disabled={loading || !token}
            >
              <option value="all">All Ratings</option>
              {[1, 2, 3, 4, 5].map((rating) => (
                <option key={rating} value={rating}>{rating} Star{rating > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            className="text-center py-10 mb-8 bg-red-500/20 border border-red-500/50 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-red-300 text-lg">{error}</p>
            <motion.button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full font-bold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Reload Page
            </motion.button>
          </motion.div>
        )}

        {/* Reviews Table */}
        {loading ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="animate-pulse text-6xl mb-8">🔄</div>
            <p className="text-white/60 text-xl">Loading reviews...</p>
          </motion.div>
        ) : !error && filteredReviews.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-8">📭</div>
            <p className="text-white/60 text-xl">
              {filterRating === 'all' ? 'No reviews found' : `No ${filterRating} star reviews found`}
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="overflow-x-auto"
            variants={itemVariants}
          >
            <table className="w-full bg-gradient-to-br from-slate-900/70 via-slate-800/70 to-slate-900/70 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl">
              <thead>
                <tr className="text-white/80 border-b border-white/20">
                  <th className="py-4 px-6 text-left">Author</th>
                  <th className="py-4 px-6 text-left">Role</th>
                  <th className="py-4 px-6 text-center">Rating</th>
                  <th className="py-4 px-6 text-left">Text</th>
                  <th className="py-4 px-6 text-left">Created At</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentPageReviews().map((review, index) => (
                  <motion.tr
                    key={review._id}
                    className="border-b border-white/10 last:border-0 hover:bg-white/5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="py-4 px-6 text-white">{review.author}</td>
                    <td className="py-4 px-6 text-white">{review.role}</td>
                    <td className="py-4 px-6 text-center text-yellow-400">
                      {[...Array(review.rating)].map((_, i) => (
                        <span key={i}>⭐</span>
                      ))}
                    </td>
                    <td className="py-4 px-6 text-white max-w-xs truncate">{review.text}</td>
                    <td className="py-4 px-6 text-white">{review.createdAt}</td>
                    <td className="py-4 px-6 text-center">
                      <motion.button
                        onClick={() => setViewReview(review)}
                        className="group relative px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-bold mr-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="relative z-10 flex items-center space-x-2">
                          <span>View</span>
                          <span>👁️</span>
                        </span>
                      </motion.button>
                      <motion.button
                        onClick={() => setDeleteConfirm(review._id)}
                        className="group relative px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-bold"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="relative z-10 flex items-center space-x-2">
                          <span>Delete</span>
                          <span>🗑️</span>
                        </span>
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && !error && filteredReviews.length > 0 && totalPages > 1 && (
          <motion.div
            className="flex justify-center mt-8 space-x-2"
            variants={itemVariants}
          >
            <motion.button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-full font-bold ${currentPage === 1 ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'}`}
              whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
              whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
            >
              Previous
            </motion.button>
            {[...Array(totalPages)].map((_, i) => (
              <motion.button
                key={i + 1}
                onClick={() => handlePageChange(i + 1)}
                className={`px-4 py-2 rounded-full font-bold ${currentPage === i + 1 ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white scale-110' : 'bg-white/20 text-white hover:bg-white/30'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {i + 1}
              </motion.button>
            ))}
            <motion.button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-full font-bold ${currentPage === totalPages ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'}`}
              whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
              whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
            >
              Next
            </motion.button>
          </motion.div>
        )}

        {/* View Review Modal */}
        <AnimatePresence>
          {viewReview && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-lg w-full"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500" />
                <div className="relative">
                  <h3 className="text-2xl font-bold text-white mb-4">Review Details</h3>
                  <p className="text-white mb-2"><strong>Author:</strong> {viewReview.author}</p>
                  <p className="text-white mb-2"><strong>Role:</strong> {viewReview.role}</p>
                  <p className="text-white mb-2"><strong>Rating:</strong> {[...Array(viewReview.rating)].map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}</p>
                  <p className="text-white mb-2"><strong>Text:</strong> {viewReview.text}</p>
                  <p className="text-white mb-6"><strong>Created At:</strong> {viewReview.createdAt}</p>
                  <motion.button
                    onClick={() => setViewReview(null)}
                    className="group relative px-6 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white rounded-full font-bold w-full"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="relative z-10">Close</span>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirm && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500" />
                <div className="relative">
                  <h3 className="text-xl font-bold text-white mb-4">Confirm Delete</h3>
                  <p className="text-white mb-6">Are you sure you want to delete this review?</p>
                  <div className="flex space-x-4">
                    <motion.button
                      onClick={() => handleDelete(deleteConfirm)}
                      className="group relative px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-bold flex-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="relative z-10">Delete</span>
                    </motion.button>
                    <motion.button
                      onClick={() => setDeleteConfirm(null)}
                      className="group relative px-4 py-2 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-white/20 text-white rounded-full font-bold flex-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="relative z-10">Cancel</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

export default ReviewsManagement;
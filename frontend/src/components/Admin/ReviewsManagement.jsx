import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { TrashIcon, EyeIcon } from '@heroicons/react/24/solid';

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

  // Handle delete review
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
        const updatedReviews = allReviews.filter((review) => review._id !== id);
        setAllReviews(updatedReviews);

        if (getCurrentPageReviews().length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }

        setDeleteConfirm(null);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.message);
        setDeleteConfirm(null);
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
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: "easeIn" } },
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50 pb-20"
      variants={itemVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.h2
          className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          Reviews Management
        </motion.h2>

        {/* Filter Section */}
        <motion.div
          className="mb-8"
          variants={itemVariants}
        >
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Filter Reviews</h3>
            <div className="flex items-center space-x-3">
              <label className="text-gray-600 font-medium text-sm">Rating:</label>
              <select
                value={filterRating}
                onChange={handleFilterChange}
                className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm cursor-pointer"
                disabled={loading || !token}
              >
                <option value="all">All Ratings</option>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <option key={rating} value={rating}>{rating} Star{rating > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            className="text-center py-10 mb-8 bg-white border border-red-100 rounded-2xl shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-red-500 text-lg font-medium mb-4">{error}</p>
            <motion.button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg font-bold hover:bg-red-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Reload Page
            </motion.button>
          </motion.div>
        )}

        {/* Reviews Table */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex space-x-4 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        ) : !error && filteredReviews.length === 0 ? (
          <motion.div
            className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4 opacity-50">📭</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {filterRating === 'all' ? 'No reviews found' : `No ${filterRating} star reviews found`}
            </h3>
            <p className="text-gray-500">Reviews matching your criteria will appear here.</p>
          </motion.div>
        ) : (
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            variants={itemVariants}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Author</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Text</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getCurrentPageReviews().map((review, index) => (
                    <motion.tr
                      key={review._id}
                      className="hover:bg-gray-50/50 transition-colors group"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">{review.author}</td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide">
                          {review.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center text-yellow-400 text-sm">
                        <div className="flex justify-center">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-200"}>★</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 max-w-xs truncate" title={review.text}>{review.text}</td>
                      <td className="py-4 px-6 text-sm text-gray-500 tabular-nums">{review.createdAt}</td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            onClick={() => setViewReview(review)}
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View Details"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </motion.button>
                          <motion.button
                            onClick={() => setDeleteConfirm(review._id)}
                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete Review"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && !error && filteredReviews.length > 0 && totalPages > 1 && (
          <motion.div
            className="flex justify-center mt-10 space-x-2"
            variants={itemVariants}
          >
            <motion.button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
              whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
            >
              &lt;
            </motion.button>
            {[...Array(totalPages)].map((_, i) => (
              <motion.button
                key={i + 1}
                onClick={() => handlePageChange(i + 1)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg font-semibold text-sm transition-all shadow-sm ${currentPage === i + 1
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {i + 1}
              </motion.button>
            ))}
            <motion.button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
              whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
            >
              &gt;
            </motion.button>
          </motion.div>
        )}

        {/* View Review Modal */}
        <AnimatePresence>
          {viewReview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
                onClick={() => setViewReview(null)}
              />
              <motion.div
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Review Details</h3>
                  <button onClick={() => setViewReview(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-xl">
                      {viewReview.avatar || '👤'}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{viewReview.author}</p>
                      <p className="text-sm text-gray-500 font-medium">{viewReview.role}</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-lg flex items-center space-x-2">
                    <span className="font-bold text-yellow-700 text-sm uppercase tracking-wide">Rating:</span>
                    <div className="flex text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < viewReview.rating ? "text-yellow-500" : "text-yellow-200"}>★</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Review</p>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                      "{viewReview.text}"
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Date</p>
                    <p className="text-sm font-medium text-gray-900">{viewReview.createdAt}</p>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                  <motion.button
                    onClick={() => setViewReview(null)}
                    className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Close
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
                onClick={() => setDeleteConfirm(null)}
              />
              <motion.div
                className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrashIcon className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Review?</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Are you sure you want to delete this review? This action cannot be undone.
                  </p>
                  <div className="flex space-x-3">
                    <motion.button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={() => handleDelete(deleteConfirm)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-md"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Delete
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ReviewsManagement;
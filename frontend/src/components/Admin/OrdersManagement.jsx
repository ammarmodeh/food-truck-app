import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { useSelector } from 'react-redux';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { ClockIcon, CheckCircleIcon, XCircleIcon, TruckIcon, ArchiveBoxXMarkIcon } from '@heroicons/react/24/solid';

// Helper function to format time difference
const formatTimeDifference = (start, end) => {
  if (!start || !end) return 'N/A';
  const diffMs = new Date(end) - new Date(start);
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours} hr ${minutes} min`;
  return `${minutes} min`;
};

const OrdersManagement = () => {
  const { notify } = useNotification();
  const { user } = useSelector((state) => state.auth);
  const socket = useSocket();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [queue, setQueue] = useState({ length: 0, estimatedWait: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/orders`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setOrders(data);
      } catch (err) {
        setError('Failed to fetch orders. Please try again later.');
        notify('Failed to fetch orders', 'error');
      }
    };

    const fetchQueue = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/orders/queue`);
        setQueue(data);
      } catch (err) {
        setError('Failed to load queue status. Please try again later.');
        notify('Failed to load queue status', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.isAdmin) {
      fetchOrders();
      fetchQueue();
    } else {
      setLoading(false);
    }

    socket.on('queueUpdate', (update) => {
      setQueue(update);
      notify(`Queue updated: ${update.length} orders`, 'info');
      fetchOrders();
    });
    socket.on('connect_error', (err) => {
      console.error('Socket.io error:', err);
      setError('Connection error. Updates may be delayed.');
      notify('Connection error. Updates may be delayed.', 'error');
    });

    return () => {
      socket.off('queueUpdate');
      socket.off('connect_error');
    };
  }, [notify, socket, user]);

  const updateStatus = async (id, status) => {
    try {
      const { data } = await axios.put(
        `${import.meta.env.VITE_BACKEND_API}/api/orders/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order._id === id ? { ...order, status, updatedAt: data.updatedAt } : order))
      );
      notify(`Order marked as ${status}`, 'success');
    } catch (err) {
      notify('Failed to update order status', 'error');
    }
  };

  // Filter orders by search query and active tab
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Apply status filter only if not on "All" tab
    if (activeTab !== 'All') {
      filtered = orders.filter((order) => order.status === activeTab);
    }

    // Apply search query filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order._id.toLowerCase().includes(lowerQuery) ||
          order.user?.name.toLowerCase().includes(lowerQuery) ||
          order.phone.toLowerCase().includes(lowerQuery)
      );
    }

    return filtered;
  }, [orders, searchQuery, activeTab]);

  // Paginate filtered orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(startIndex, startIndex + ordersPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  if (!user || !user.isAdmin) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-6 py-12">
          <motion.div
            className="text-center py-12 bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-lg backdrop-blur-sm"
            variants={itemVariants}
          >
            <div className="text-6xl mb-4">🔐</div>
            <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">Access Denied</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">This page is for admins only.</p>
            <motion.button
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-full font-semibold"
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(251, 146, 60, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
            >
              Log In
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container mx-auto px-6 py-12">
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          Orders Management
        </motion.h2>

        {/* Queue Status */}
        <motion.section className="mb-12" variants={itemVariants}>
          <div className="flex items-center justify-center space-x-3 mb-6">
            <ClockIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Queue Status</h3>
          </div>
          {loading ? (
            <div className="bg-white/80 dark:bg-gray-800/80 p-8 rounded-3xl shadow-lg backdrop-blur-sm max-w-2xl mx-auto">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-6 animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-full animate-pulse"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-lg backdrop-blur-sm max-w-2xl mx-auto">
              <div className="text-6xl mb-4">⏰</div>
              <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">Unable to load queue</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
              <motion.button
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-full font-semibold"
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(251, 146, 60, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
              >
                Try Again
              </motion.button>
            </div>
          ) : (
            <motion.div
              className="bg-white/80 dark:bg-gray-800/80 p-8 rounded-3xl shadow-lg backdrop-blur-sm max-w-2xl mx-auto text-center"
              key={queue.length}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 20 }}
            >
              <p className="text-3xl font-semibold text-orange-600 dark:text-orange-400">{queue.length} Orders</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 mt-4 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-6 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((queue.estimatedWait / 60) * 100, 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                ></motion.div>
              </div>
            </motion.div>
          )}
        </motion.section>

        {/* Search and Tabs */}
        <motion.section className="mb-12" variants={itemVariants}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Orders</h3>
            <input
              type="text"
              placeholder="Search by Order ID, Customer Name, or Phone"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="w-full max-w-md p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
            />
          </div>
          <div className="flex space-x-2 mb-6 overflow-x-auto">
            {['All', 'Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setActiveTab(status);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full font-semibold transition duration-300 ${activeTab === status
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/50'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </motion.section>

        {/* Orders Display */}
        <motion.section variants={itemVariants}>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((_, index) => (
                <motion.div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg animate-pulse"
                  variants={itemVariants}
                >
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </motion.div>
              ))}
            </div>
          ) : error ? (
            <motion.div
              className="text-center py-12 bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-lg backdrop-blur-sm"
              variants={itemVariants}
            >
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">Unable to load orders</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
              <motion.button
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-full font-semibold"
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(251, 146, 60, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
              >
                Try Again
              </motion.button>
            </motion.div>
          ) : filteredOrders.length === 0 ? (
            <motion.div
              className="text-center py-12 bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-lg backdrop-blur-sm"
              variants={itemVariants}
            >
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">No orders found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No orders match your search criteria.' : 'No orders in this category.'}
              </p>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                  {paginatedOrders.map((order) => (
                    <motion.div
                      key={order._id}
                      className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500"
                      variants={itemVariants}
                      initial="initial"
                      animate="visible"
                      exit={{ opacity: 0, y: 20 }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-orange-600 transition-colors">
                            Order #{order._id.slice(-6)}
                          </h3>
                          <span
                            className={`flex items-center space-x-2 px-3 py-1 rounded-full font-semibold text-sm ${order.status === 'Pending'
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                              : order.status === 'Preparing'
                                ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
                                : order.status === 'Ready'
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                                  : order.status === 'Delivered'
                                    ? 'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-400'
                                    : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                              }`}
                          >
                            {order.status === 'Pending' && <ClockIcon className="h-5 w-5" />}
                            {order.status === 'Preparing' && <ClockIcon className="h-5 w-5" />}
                            {order.status === 'Ready' && <CheckCircleIcon className="h-5 w-5" />}
                            {order.status === 'Delivered' && <TruckIcon className="h-5 w-5" />}
                            {order.status === 'Cancelled' && <ArchiveBoxXMarkIcon className="h-5 w-5" />}
                            <span>{order.status}</span>
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                          <span className="font-semibold">Customer:</span> {order.user?.name || 'N/A'} (
                          {order.phone || 'N/A'})
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                          <span className="font-semibold">Items:</span>{' '}
                          {order.items.map((item) => `${item.qty} x ${item.menuItem.name}`).join(', ')}
                        </p>
                        <p className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-2">
                          ${typeof order.totalPrice === 'number' ? order.totalPrice.toFixed(2) : parseFloat(order.totalPrice || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          <span className="font-semibold">Placed:</span>{' '}
                          {new Date(order.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </p>
                        {order.status === 'Ready' && order.readyAt && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <span className="font-semibold">Ready:</span>{' '}
                            {new Date(order.readyAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })} ({formatTimeDifference(order.createdAt, order.readyAt)})
                          </p>
                        )}
                        {order.status === 'Delivered' && order.deliveredAt && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <span className="font-semibold">Delivered:</span>{' '}
                            {new Date(order.deliveredAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })} ({formatTimeDifference(order.createdAt, order.deliveredAt)})
                          </p>
                        )}
                        {order.status === 'Cancelled' && order.cancelledAt && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <span className="font-semibold">Cancelled:</span>{' '}
                            {new Date(order.cancelledAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })} ({formatTimeDifference(order.createdAt, order.cancelledAt)})
                          </p>
                        )}
                        <div className="flex justify-end space-x-4">
                          {order.status === 'Pending' && (
                            <motion.button
                              onClick={() => updateStatus(order._id, 'Preparing')}
                              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full font-semibold"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Mark Preparing
                            </motion.button>
                          )}
                          {order.status === 'Preparing' && (
                            <motion.button
                              onClick={() => updateStatus(order._id, 'Ready')}
                              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full font-semibold"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Mark Ready
                            </motion.button>
                          )}
                          {order.status === 'Ready' && (
                            <motion.button
                              onClick={() => updateStatus(order._id, 'Delivered')}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full font-semibold"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Mark Delivered
                            </motion.button>
                          )}
                          {['Pending', 'Preparing'].includes(order.status) && (
                            <motion.button
                              onClick={() => updateStatus(order._id, 'Cancelled')}
                              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full font-semibold"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Mark Cancelled
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6 space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-full font-semibold ${currentPage === page
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/50'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
};

export default OrdersManagement;
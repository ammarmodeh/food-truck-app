import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { useSelector } from 'react-redux';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

// Helper function to format time difference
const formatTimeDifference = (start, end) => {
  if (!start || !end) return 'N/A';
  const diffMs = new Date(end) - new Date(start);
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours} hr ${minutes} min`;
  return `${minutes} min`;
};

const UserOrderStatus = () => {
  const { notify } = useNotification();
  const { user } = useSelector((state) => state.auth);
  const socket = useSocket();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/orders/myorders`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setOrders(data);
      } catch (err) {
        setError('Failed to load orders. Please try again later.');
        notify('Failed to load orders', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }

    // socket.on('connect', () => console.log('Socket.io connected'));
    socket.on('orderStatusUpdate', ({ orderId, status }) => {
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status } : order
        )
      );
      const displayStatus = status === 'Delivered' ? 'Received' : status;
      notify(`Order ${orderId.slice(-6)} is now ${displayStatus}!`, status === 'Cancelled' ? 'error' : 'success');
      // Refetch orders to get updated timestamps
      if (['Ready', 'Delivered', 'Cancelled'].includes(status)) {
        fetchOrders();
      }
    });
    socket.on('connect_error', (err) => {
      console.error('Socket.io error:', err);
      notify('Connection error. Order updates may be delayed.', 'error');
    });

    return () => {
      socket.off('orderStatusUpdate');
      socket.off('connect');
      socket.off('connect_error');
    };
  }, [notify, socket, user]);

  // Memoize grouped and sorted orders
  const { activeOrders, receivedOrders, cancelledOrders } = useMemo(() => {
    const active = orders
      .filter((order) => ['Pending', 'Preparing', 'Ready'].includes(order.status))
      .sort((a, b) => b._id.localeCompare(a._id));
    const received = orders
      .filter((order) => order.status === 'Delivered')
      .sort((a, b) => b._id.localeCompare(a._id));
    const cancelled = orders
      .filter((order) => order.status === 'Cancelled')
      .sort((a, b) => b._id.localeCompare(a._id));
    return { activeOrders: active, receivedOrders: received, cancelledOrders: cancelled };
  }, [orders]);

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

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  if (!user) {
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
            <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">Please log in</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">You need to be logged in to view your orders.</p>
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
          className="text-5xl md:text-6xl font-extrabold tracking-tight text-center mb-16
              drop-shadow-sm font-serif text-[cornsilk]"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          Your Order Status
        </motion.h2>

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
        ) : (
          <div className="space-y-12 sm:mt-20">
            {/* Active Orders (Pending, Preparing, Ready) */}
            <motion.div variants={sectionVariants}>
              <h3 className="text-3xl font-bold mb-6 text-white">
                Active Orders
              </h3>
              {activeOrders.length === 0 ? (
                <motion.div
                  className="text-center py-8 bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-lg backdrop-blur-sm border-1 border-gray-700"
                  variants={itemVariants}
                >
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-gray-500 dark:text-gray-400">No active orders at the moment.</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <AnimatePresence>
                    {activeOrders.map((order) => {
                      const displayStatus = order.status;
                      return (
                        <motion.div
                          key={order._id}
                          className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 border-1 border-gray-700"
                          variants={itemVariants}
                          initial="hidden"
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
                                className={`flex items-center space-x-2 px-3 py-1 rounded-full font-semibold text-sm ${displayStatus === 'Ready'
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                                  : displayStatus === 'Preparing'
                                    ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
                                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                                  }`}
                              >
                                {displayStatus === 'Ready' && <CheckCircleIcon className="h-5 w-5" />}
                                {(displayStatus === 'Preparing' || displayStatus === 'Pending') && <ClockIcon className="h-5 w-5" />}
                                <span>{displayStatus}</span>
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-3">
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
                            {displayStatus === 'Ready' && order.updatedAt && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                <span className="font-semibold">Ready:</span>{' '}
                                {new Date(order.updatedAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                })}{' '}
                                ({formatTimeDifference(order.createdAt, order.updatedAt)})
                              </p>
                            )}
                            {displayStatus === 'Ready' && (
                              <p className="text-green-600 dark:text-green-400 font-semibold mt-3">
                                Your order is ready for pickup! 🚚
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

            {/* Received Orders (Delivered) */}
            <motion.div variants={sectionVariants}>
              <h3 className="text-3xl font-bold mb-6 text-white">
                Received Orders
              </h3>
              {receivedOrders.length === 0 ? (
                <motion.div
                  className="text-center py-8 bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-lg backdrop-blur-sm border-1 border-gray-700"
                  variants={itemVariants}
                >
                  <div className="text-4xl mb-4">✅</div>
                  <p className="text-gray-500 dark:text-gray-400">No received orders yet.</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <AnimatePresence>
                    {receivedOrders.map((order) => (
                      <motion.div
                        key={order._id}
                        className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 border-1 border-gray-700"
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: 20 }}
                        whileHover={{ scale: 1.03 }}
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-orange-600 transition-colors">
                              Order #{order._id.slice(-6)}
                            </h3>
                            <span className="flex items-center space-x-2 px-3 py-1 rounded-full font-semibold text-sm bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                              <CheckCircleIcon className="h-5 w-5" />
                              <span>Received</span>
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-3">
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
                          {order.status === 'Delivered' && order.updatedAt && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              <span className="font-semibold">Received:</span>{' '}
                              {new Date(order.updatedAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })}{' '}
                              ({formatTimeDifference(order.createdAt, order.updatedAt)})
                            </p>
                          )}
                          <p className="text-blue-600 dark:text-blue-400 font-semibold mt-3">
                            Your order has been received! Thank you! 🎉
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

            {/* Cancelled Orders */}
            <motion.div variants={sectionVariants}>
              <h3 className="text-3xl font-bold mb-6 text-white">
                Cancelled Orders
              </h3>
              {cancelledOrders.length === 0 ? (
                <motion.div
                  className="text-center py-8 bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-lg backdrop-blur-sm border-1 border-gray-700"
                  variants={itemVariants}
                >
                  <div className="text-4xl mb-4">❌</div>
                  <p className="text-gray-500 dark:text-gray-400">No cancelled orders.</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <AnimatePresence>
                    {cancelledOrders.map((order) => (
                      <motion.div
                        key={order._id}
                        className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 border-1 border-gray-700"
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: 20 }}
                        whileHover={{ scale: 1.03 }}
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-orange-600 transition-colors">
                              Order #{order._id.slice(-6)}
                            </h3>
                            <span className="flex items-center space-x-2 px-3 py-1 rounded-full font-semibold text-sm bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400">
                              <XCircleIcon className="h-5 w-5" />
                              <span>Cancelled</span>
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-3">
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
                          {order.status === 'Cancelled' && order.updatedAt && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              <span className="font-semibold">Cancelled:</span>{' '}
                              {new Date(order.updatedAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })}{' '}
                              ({formatTimeDifference(order.createdAt, order.updatedAt)})
                            </p>
                          )}
                          <p className="text-red-600 dark:text-red-400 font-semibold mt-3">
                            Your order has been cancelled. 😔
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default UserOrderStatus;
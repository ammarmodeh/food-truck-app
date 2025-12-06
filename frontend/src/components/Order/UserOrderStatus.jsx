import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { useSelector } from 'react-redux';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { ClockIcon, CheckCircleIcon, XCircleIcon, CreditCardIcon, BanknotesIcon } from '@heroicons/react/24/solid';

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

    socket.on('orderStatusUpdate', ({ orderId, status }) => {
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status } : order
        )
      );
      const displayStatus = status === 'Delivered' ? 'Received' : status;
      notify(`Order ${orderId.slice(-6)} is now ${displayStatus}!`, status === 'Cancelled' ? 'error' : 'success');
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
        className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-lg w-full"
          variants={itemVariants}
        >
          <div className="text-6xl mb-4 opacity-50">🔐</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Please log in</h3>
          <p className="text-gray-500 mb-8">You need to be logged in to view your orders.</p>
          <motion.button
            className="bg-orange-600 text-white px-8 py-3 rounded-full font-semibold shadow-md hover:bg-orange-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
          >
            Log In
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50 pb-20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.h2
          className="text-3xl font-bold text-gray-900 mb-12 border-b border-gray-200 pb-4"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          Your Order Status
        </motion.h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <motion.div
            className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            <div className="text-6xl mb-4 opacity-50">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to load orders</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              className="bg-orange-600 text-white px-8 py-3 rounded-full font-semibold shadow-md hover:bg-orange-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </motion.div>
        ) : (
          <div className="space-y-16">
            {/* Active Orders (Pending, Preparing, Ready) */}
            <motion.div variants={sectionVariants}>
              <h3 className="text-2xl font-bold mb-8 text-gray-900 flex items-center gap-3">
                <span className="w-3 h-8 bg-orange-600 rounded-full"></span>
                Active Orders
              </h3>
              {activeOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="text-4xl mb-4 opacity-50">📋</div>
                  <p className="text-gray-500">No active orders at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {activeOrders.map((order) => {
                      const displayStatus = order.status;
                      const statusColors = {
                        Ready: 'bg-green-100 text-green-700 border-green-200',
                        Preparing: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                        Pending: 'bg-blue-100 text-blue-700 border-blue-200',
                      };
                      return (
                        <motion.div
                          key={order._id}
                          className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden group transition-all duration-300"
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, y: 20 }}
                        >
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                                Order #{order._id.slice(-6)}
                              </h3>
                              <span
                                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full font-semibold text-xs border ${statusColors[displayStatus] || 'bg-gray-100 text-gray-700'}`}
                              >
                                {displayStatus === 'Ready' && <CheckCircleIcon className="h-4 w-4" />}
                                {(displayStatus === 'Preparing' || displayStatus === 'Pending') && <ClockIcon className="h-4 w-4" />}
                                <span>{displayStatus}</span>
                              </span>
                            </div>
                            <div className="py-4 border-t border-b border-gray-50 my-4 space-y-2">
                              <p className="text-gray-600 text-sm">
                                <span className="font-semibold text-gray-900">Items:</span>{' '}
                                {order.items.map((item) => `${item.qty} x ${item.menuItem.name}`).join(', ')}
                              </p>
                              <p className="text-gray-600 text-sm flex items-center">
                                <span className="font-semibold text-gray-900 mr-2">Payment:</span>
                                {order.paymentMethod === 'Card' ? (
                                  <span className="flex items-center text-green-600 font-medium">
                                    <CreditCardIcon className="h-4 w-4 mr-1" /> Card
                                  </span>
                                ) : (
                                  <span className="flex items-center text-orange-600 font-medium">
                                    <BanknotesIcon className="h-4 w-4 mr-1" /> Cash
                                  </span>
                                )}
                              </p>
                              <p className="text-gray-600 text-sm">
                                <span className="font-semibold text-gray-900">Placed:</span>{' '}
                                {new Date(order.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                })}
                              </p>
                            </div>

                            <div className="flex justify-between items-end mt-2">
                              {displayStatus === 'Ready' && (
                                <p className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-lg">
                                  Ready for pickup! 🚚
                                </p>
                              )}
                              <p className="text-2xl font-bold text-orange-600 ml-auto">
                                ${typeof order.totalPrice === 'number' ? order.totalPrice.toFixed(2) : parseFloat(order.totalPrice || 0).toFixed(2)}
                              </p>
                            </div>

                            {displayStatus === 'Ready' && order.updatedAt && (
                              <p className="text-xs text-gray-400 mt-2 text-right">
                                Ready since: {formatTimeDifference(order.createdAt, order.updatedAt)} ago
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
              <h3 className="text-2xl font-bold mb-8 text-gray-900 flex items-center gap-3">
                <span className="w-3 h-8 bg-blue-600 rounded-full"></span>
                Received Orders
              </h3>
              {receivedOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="text-4xl mb-4 opacity-50">✅</div>
                  <p className="text-gray-500">No received orders yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {receivedOrders.map((order) => (
                      <motion.div
                        key={order._id}
                        className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden group transition-all duration-300"
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: 20 }}
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                              Order #{order._id.slice(-6)}
                            </h3>
                            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full font-semibold text-xs bg-blue-50 text-blue-700 border border-blue-200">
                              <CheckCircleIcon className="h-4 w-4" />
                              <span>Received</span>
                            </span>
                          </div>

                          <div className="py-4 border-t border-b border-gray-50 my-4 space-y-2">
                            <p className="text-gray-600 text-sm">
                              <span className="font-semibold text-gray-900">Items:</span>{' '}
                              {order.items.map((item) => `${item.qty} x ${item.menuItem.name}`).join(', ')}
                            </p>
                            <p className="text-gray-600 text-sm flex items-center">
                              <span className="font-semibold text-gray-900 mr-2">Payment:</span>
                              {order.paymentMethod === 'Card' ? (
                                <span className="flex items-center text-green-600 font-medium">
                                  <CreditCardIcon className="h-4 w-4 mr-1" /> Card
                                </span>
                              ) : (
                                <span className="flex items-center text-orange-600 font-medium">
                                  <BanknotesIcon className="h-4 w-4 mr-1" /> Cash
                                </span>
                              )}
                            </p>
                            <p className="text-gray-600 text-sm">
                              <span className="font-semibold text-gray-900">Placed:</span>{' '}
                              {new Date(order.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </p>
                          </div>

                          <div className="flex justify-between items-end mt-2">
                            <p className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1 rounded-lg">
                              Received 🎉
                            </p>
                            <p className="text-2xl font-bold text-orange-600 ml-auto">
                              ${typeof order.totalPrice === 'number' ? order.totalPrice.toFixed(2) : parseFloat(order.totalPrice || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

            {/* Cancelled Orders */}
            <motion.div variants={sectionVariants}>
              <h3 className="text-2xl font-bold mb-8 text-gray-900 flex items-center gap-3">
                <span className="w-3 h-8 bg-red-600 rounded-full"></span>
                Cancelled Orders
              </h3>
              {cancelledOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="text-4xl mb-4 opacity-50">❌</div>
                  <p className="text-gray-500">No cancelled orders.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {cancelledOrders.map((order) => (
                      <motion.div
                        key={order._id}
                        className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden group transition-all duration-300 opacity-75 hover:opacity-100"
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: 20 }}
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                              Order #{order._id.slice(-6)}
                            </h3>
                            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full font-semibold text-xs bg-red-50 text-red-700 border border-red-200">
                              <XCircleIcon className="h-4 w-4" />
                              <span>Cancelled</span>
                            </span>
                          </div>

                          <div className="py-4 border-t border-b border-gray-50 my-4 space-y-2">
                            <p className="text-gray-600 text-sm">
                              <span className="font-semibold text-gray-900">Items:</span>{' '}
                              {order.items.map((item) => `${item.qty} x ${item.menuItem.name}`).join(', ')}
                            </p>
                            <p className="text-gray-600 text-sm flex items-center">
                              <span className="font-semibold text-gray-900 mr-2">Payment:</span>
                              {order.paymentMethod === 'Card' ? (
                                <span className="flex items-center text-green-600 font-medium">
                                  <CreditCardIcon className="h-4 w-4 mr-1" /> Card
                                </span>
                              ) : (
                                <span className="flex items-center text-orange-600 font-medium">
                                  <BanknotesIcon className="h-4 w-4 mr-1" /> Cash
                                </span>
                              )}
                            </p>
                            <p className="text-gray-600 text-sm">
                              <span className="font-semibold text-gray-900">Placed:</span>{' '}
                              {new Date(order.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </p>
                          </div>

                          <div className="flex justify-between items-end mt-2">
                            <p className="text-red-600 font-bold text-sm bg-red-50 px-3 py-1 rounded-lg">
                              Cancelled 😔
                            </p>
                            <p className="text-2xl font-bold text-orange-600 ml-auto">
                              ${typeof order.totalPrice === 'number' ? order.totalPrice.toFixed(2) : parseFloat(order.totalPrice || 0).toFixed(2)}
                            </p>
                          </div>
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
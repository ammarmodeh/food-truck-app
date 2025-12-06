import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { useSelector } from 'react-redux';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { ClockIcon, CheckCircleIcon, TruckIcon, ArchiveBoxXMarkIcon, CreditCardIcon, BanknotesIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'; // Updated icons for light theme

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
      fetchOrders(); // Refetch orders to ensure consistency
    });

    socket.on('orderStatusUpdate', ({ orderId, status }) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId
            ? {
              ...order,
              status,
              updatedAt: new Date(),
              ...(status === 'Preparing' && { preparingAt: new Date() }),
              ...(status === 'Ready' && { readyAt: new Date() }),
              ...(status === 'Delivered' && { deliveredAt: new Date() }),
              ...(status === 'Cancelled' && { cancelledAt: new Date() }),
            }
            : order
        )
      );
      notify(`Order ${orderId.slice(-6)} updated to ${status}`, 'success');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket.io error:', err);
      setError('Connection error. Updates may be delayed.');
      notify('Connection error. Updates may be delayed.', 'error');
    });

    return () => {
      socket.off('queueUpdate');
      socket.off('orderStatusUpdate');
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

    if (activeTab !== 'All') {
      filtered = orders.filter((order) => order.status === activeTab);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          (order._id || '').toLowerCase().includes(lowerQuery) ||
          (order.user?.name || '').toLowerCase().includes(lowerQuery) ||
          (order.phone || '').toLowerCase().includes(lowerQuery)
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
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  if (!user || !user.isAdmin) {
    return (
      <motion.div
        className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="text-center py-12 px-8 bg-white rounded-3xl shadow-xl max-w-lg w-full"
          variants={itemVariants}
        >
          <div className="text-6xl mb-6">🔐</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h3>
          <p className="text-gray-500 mb-8">This page is for admins only.</p>
          <motion.button
            className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
      className="min-h-screen bg-gray-50 pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="flex justify-between items-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h2 className="text-3xl font-bold text-gray-900">
            Orders Management
          </h2>
        </motion.div>

        {/* Queue Status */}
        <motion.section className="mb-8" variants={itemVariants}>
          {loading ? (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 animate-pulse max-w-2xl mx-auto">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-sm border border-red-100 max-w-2xl mx-auto">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-red-500 mb-4">{error}</p>
              <button
                className="px-6 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 font-semibold"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : (
            <motion.div
              className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 max-w-2xl mx-auto text-center"
              key={queue.length}
              variants={itemVariants}
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                <ClockIcon className="h-6 w-6 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-700">Live Queue</h3>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-6">{queue.length} <span className="text-xl font-normal text-gray-500">active orders</span></p>

              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden relative">
                <motion.div
                  className="bg-orange-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((queue.estimatedWait / 60) * 100, 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">Estimated wait time: ~{queue.estimatedWait} mins</p>
            </motion.div>
          )}
        </motion.section>

        {/* Search and Tabs */}
        <motion.section className="mb-8" variants={itemVariants}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full md:w-96">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition shadow-sm"
              />
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              {['All', 'Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setActiveTab(status);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === status
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Orders Display */}
        <motion.section variants={itemVariants}>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((_, index) => (
                <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-64 animate-pulse"></div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-200">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900">No orders found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {paginatedOrders.map((order) => (
                    <motion.div
                      key={order._id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
                      variants={itemVariants}
                      initial="initial"
                      animate="visible"
                      exit={{ opacity: 0, y: 10 }}
                      layout
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">#{order._id.slice(-6)}</h3>
                            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center space-x-1 ${order.status === 'Pending'
                              ? 'bg-blue-100 text-blue-700'
                              : order.status === 'Preparing'
                                ? 'bg-yellow-100 text-yellow-700'
                                : order.status === 'Ready'
                                  ? 'bg-green-100 text-green-700'
                                  : order.status === 'Delivered'
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-red-100 text-red-700'
                              }`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Customer</span>
                            <span className="font-medium text-gray-900">{order.user?.name || 'Guest'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Phone</span>
                            <span className="font-medium text-gray-900">{order.phone || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Payment</span>
                            <span className="font-medium text-gray-900 flex items-center">
                              {order.paymentMethod === 'Card' ? <CreditCardIcon className="h-4 w-4 mr-1 text-green-600" /> : <BanknotesIcon className="h-4 w-4 mr-1 text-orange-600" />}
                              {order.paymentMethod}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-gray-100">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-900 font-semibold">Total</span>
                              <span className="text-xl font-bold text-orange-600">${typeof order.totalPrice === 'number' ? order.totalPrice.toFixed(2) : parseFloat(order.totalPrice || 0).toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                            <span className="font-semibold block mb-1 text-gray-700">Items:</span>
                            {order.items.map((item) => `${item.qty} x ${item.menuItem.name}`).join(', ')}
                          </div>
                        </div>


                        <div className="grid grid-cols-1 gap-2">
                          {order.status === 'Pending' && (
                            <button
                              onClick={() => updateStatus(order._id, 'Preparing')}
                              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition text-sm"
                            >
                              Start Preparing
                            </button>
                          )}
                          {order.status === 'Preparing' && (
                            <button
                              onClick={() => updateStatus(order._id, 'Ready')}
                              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition text-sm"
                            >
                              Mark Ready
                            </button>
                          )}
                          {order.status === 'Ready' && (
                            <button
                              onClick={() => updateStatus(order._id, 'Delivered')}
                              className="w-full py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-semibold transition text-sm"
                            >
                              Complete Order
                            </button>
                          )}
                          {['Pending', 'Preparing'].includes(order.status) && (
                            <button
                              onClick={() => updateStatus(order._id, 'Cancelled')}
                              className="w-full py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition text-sm"
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center mt-8 space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg font-medium ${currentPage === page
                        ? 'bg-orange-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
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
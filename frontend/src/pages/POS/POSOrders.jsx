import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowPathIcon, ClipboardDocumentListIcon, CreditCardIcon, BanknotesIcon, MagnifyingGlassIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

const POSOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [refundModal, setRefundModal] = useState({ show: false, order: null });
  const [refundConfirmation, setRefundConfirmation] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/orders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setOrders(data);
    } catch (error) {
      console.error(error);
      notify('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openRefundModal = (order) => {
    setRefundModal({ show: true, order });
    setRefundConfirmation('');
  };

  const closeRefundModal = () => {
    setRefundModal({ show: false, order: null });
    setRefundConfirmation('');
  };

  const handleRefund = async () => {
    const { order } = refundModal;
    if (!order) return;

    // Verify order ID matches
    if (refundConfirmation !== order._id) {
      notify('Order ID does not match. Please try again.', 'error');
      return;
    }

    try {
      const { data } = await axios.put(
        `${import.meta.env.VITE_BACKEND_API}/api/orders/${order._id}/refund`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      notify('Order refunded', 'success');
      setOrders(orders.map(o => o._id === order._id ? data : o));
      closeRefundModal();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.msg || error.response?.data?.error || 'Refund failed';
      notify(msg, 'error');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'All' || order.paymentMethod === paymentFilter;
    const matchesSearch = search === '' ||
      order._id.toLowerCase().includes(search.toLowerCase()) ||
      (order.user?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesPayment && matchesSearch;
  });

  const StatusBadge = ({ status }) => {
    let colorClass = 'bg-gray-100 text-gray-600';
    if (status === 'Pending') colorClass = 'bg-yellow-100 text-yellow-700';
    if (status === 'Preparing') colorClass = 'bg-blue-100 text-blue-700';
    if (status === 'Ready') colorClass = 'bg-green-100 text-green-700';
    if (status === 'Delivered') colorClass = 'bg-gray-200 text-gray-500';
    if (status === 'Cancelled') colorClass = 'bg-red-100 text-red-700';

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${colorClass}`}>
        {status}
      </span>
    );
  };

  const PaymentIcon = ({ method }) => {
    if (method === 'Card') return <CreditCardIcon className="h-5 w-5 text-purple-500" title="Card" />;
    return <BanknotesIcon className="h-5 w-5 text-green-600" title="Cash" />;
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50 text-gray-900 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <ClipboardDocumentListIcon className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search ID or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm"
            />
          </div>
          <button onClick={fetchOrders} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 text-gray-500 hover:text-orange-600 transition-colors shadow-sm">
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar flex-1">
          {['All', 'Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-sm border whitespace-nowrap ${statusFilter === status ? 'bg-orange-600 text-white border-orange-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Payment Filter */}
        <div className="flex gap-2">
          {['All', 'Cash', 'Card'].map(type => (
            <button
              key={type}
              onClick={() => setPaymentFilter(type)}
              className={`px-3 py-2 rounded-lg font-semibold text-xs transition-all shadow-sm border ${paymentFilter === type ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Table Header */}
      <div className="bg-white p-4 rounded-t-2xl grid grid-cols-12 gap-4 font-semibold text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100 shadow-sm z-10 sticky top-0">
        <div className="col-span-2">Order #</div>
        <div className="col-span-3">Customer</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2">Total</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* Order List */}
      <div className="flex-1 overflow-y-auto bg-white rounded-b-2xl border border-t-0 border-gray-100 shadow-sm custom-scrollbar">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 h-64 text-gray-400">
            <ClipboardDocumentListIcon className="h-12 w-12 mb-2 opacity-20" />
            <p>No orders found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredOrders.map(order => (
              <div key={order._id}>
                <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors group">
                  <div className="col-span-2 font-mono text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded w-fit">
                    #{order._id.slice(-6).toUpperCase()}
                  </div>
                  <div className="col-span-3">
                    <p className="font-bold text-gray-800 text-sm truncate">{order.user?.name || 'Guest'}</p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="col-span-2 flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <PaymentIcon method={order.paymentMethod} />
                    {order.paymentMethod}
                  </div>
                  <div className="col-span-2 font-bold text-gray-900">
                    ${order.totalPrice.toFixed(2)}
                  </div>
                  <div className="col-span-1">
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="col-span-2 text-right">
                    {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                      <button
                        onClick={() => openRefundModal(order)}
                        className="px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors text-xs font-bold shadow-sm"
                      >
                        Refund
                      </button>
                    )}
                  </div>
                </div>

                {/* Refund Information Note */}
                {order.paymentStatus === 'Refunded' && order.refundedBy && (
                  <div className="px-4 pb-4">
                    <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-red-900 mb-1">
                            ⚠️ Order Refunded
                          </p>
                          <div className="text-xs text-red-800 space-y-0.5">
                            <p>
                              <span className="font-semibold">Refunded by:</span> {order.refundedBy.name || order.refundedBy.username}
                            </p>
                            <p>
                              <span className="font-semibold">Refund time:</span> {new Date(order.refundedAt).toLocaleString()}
                            </p>
                            <p>
                              <span className="font-semibold">Amount:</span> ${order.totalPrice.toFixed(2)}
                            </p>
                            {order.paymentMethod === 'Card' && (
                              <p>
                                <span className="font-semibold">Method:</span> Stripe refund processed
                              </p>
                            )}
                            {order.refundReason && (
                              <p>
                                <span className="font-semibold">Reason:</span> {order.refundReason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refund Confirmation Modal */}
      <AnimatePresence>
        {refundModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={closeRefundModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md relative border border-gray-100 shadow-2xl"
            >
              <button
                onClick={closeRefundModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Confirm Refund</h2>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-800 font-medium mb-2">
                  ⚠️ You are about to refund this order:
                </p>
                <div className="space-y-1 text-xs text-red-700">
                  <p><span className="font-bold">Order ID:</span> {refundModal.order?._id}</p>
                  <p><span className="font-bold">Customer:</span> {refundModal.order?.user?.name || 'Guest'}</p>
                  <p><span className="font-bold">Amount:</span> ${refundModal.order?.totalPrice?.toFixed(2)}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Type the Order ID to confirm:
                </label>
                <input
                  type="text"
                  value={refundConfirmation}
                  onChange={(e) => setRefundConfirmation(e.target.value)}
                  placeholder="Enter order ID"
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-red-500 outline-none font-mono text-sm"
                  autoFocus
                />
                {refundConfirmation && refundConfirmation !== refundModal.order?._id && (
                  <p className="text-xs text-red-600 mt-2">⚠️ Order ID does not match</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeRefundModal}
                  className="flex-1 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefund}
                  disabled={refundConfirmation !== refundModal.order?._id}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                >
                  Confirm Refund
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default POSOrders;

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { adjustCartQuantity, removeFromCart, clearCart } from '../../redux/actions/cartActions';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { PlusIcon, MinusIcon, TrashIcon, CreditCardIcon, BanknotesIcon } from '@heroicons/react/24/solid';
import StripePayment from '../Payment/StripePayment';

// Memoized selectors
const selectCart = (state) => state.cart;
const selectAuth = (state) => state.auth;
const selectCartItems = createSelector([selectCart], (cart) => cart.cartItems);
const selectIsAuthenticated = createSelector([selectAuth], (auth) => auth.isAuthenticated);

const Cart = () => {
  const cartItems = useSelector(selectCartItems);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash' or 'Card'
  const [quantities, setQuantities] = useState(
    cartItems.reduce((acc, item) => ({ ...acc, [item._id]: item.qty }), {})
  );

  // Update local quantities when cartItems changes
  useState(() => {
    setQuantities(
      cartItems.reduce((acc, item) => ({ ...acc, [item._id]: item.qty }), {})
    );
  }, [cartItems]);

  // Calculate order summary
  const total = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  // Handle image loading errors
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23E5E7EB'/%3E%3Cpath d='M200,150 L250,100 L300,150 L250,200 Z' fill='%23D1D5DB'/%3E%3Ccircle cx='200' cy='150' r='30' fill='%239CA3AF'/%3E%3C/svg%3E";
  };

  // Handle quantity changes (local state)
  const handleQuantityChange = (itemId, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta),
    }));
  };

  // Handle updating cart with local quantity
  const handleUpdateQuantity = (itemId) => {
    const qty = quantities[itemId] || 0;
    dispatch(adjustCartQuantity(itemId, qty));
  };

  // Handle removing item from cart
  const handleRemoveFromCart = (itemId) => {
    dispatch(removeFromCart(itemId));
    setQuantities((prev) => ({ ...prev, [itemId]: 0 }));
  };

  // Handle placing order (COD)
  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      notify('Please log in to place an order', 'error');
      return navigate('/login');
    }
    try {
      setIsLoading(true);
      const items = cartItems.map((item) => ({ menuItem: item._id, qty: item.qty }));
      await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/api/orders`,
        { items, paymentMethod: 'Cash' },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      dispatch(clearCart());
      notify('Order placed! Pay cash on arrival. Personally check your phone for confirmation.', 'success');
      navigate('/orders');
    } catch (err) {
      notify(err.response?.data?.msg || 'Failed to place order. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful Stripe payment
  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      setIsLoading(true);
      const items = cartItems.map((item) => ({ menuItem: item._id, qty: item.qty }));
      await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/api/orders`,
        {
          items,
          paymentMethod: 'Card',
          paymentIntentId
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      dispatch(clearCart());
      notify('Payment successful! Order placed.', 'success');
      navigate('/orders');
    } catch (err) {
      notify('Payment successful but failed to create order. Please contact support.', 'error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <motion.div
      className="min-h-screen bg-gray-50 pb-20"
      variants={containerVariants}
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
          Your Shopping Cart
        </motion.h2>

        {cartItems.length === 0 ? (
          <motion.div
            className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            <div className="text-6xl mb-4 opacity-50">🛒</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Start adding delicious items from our menu!</p>
            <motion.button
              className="bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/menu')}
            >
              Explore Menu
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Cart Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div
                    key={item._id}
                    className="relative bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden group transition-all duration-300 flex flex-col"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: 20 }}
                  >
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      <img
                        src={item.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23E5E7EB'/%3E%3Cpath d='M200,150 L250,100 L300,150 L250,200 Z' fill='%23D1D5DB'/%3E%3Ccircle cx='200' cy='150' r='30' fill='%239CA3AF'/%3E%3C/svg%3E"}
                        alt={item.name}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        onError={handleImageError}
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => handleRemoveFromCart(item._id)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded-md transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>

                      <p className="text-lg font-bold text-orange-600 mb-4">
                        ${(item.price * item.qty).toFixed(2)}
                        <span className="text-xs text-gray-400 font-normal ml-2">(${item.price.toFixed(2)} ea)</span>
                      </p>

                      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between gap-3">
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => handleQuantityChange(item._id, -1)}
                            className="p-1.5 rounded-md hover:bg-white text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors shadow-sm disabled:shadow-none"
                            disabled={quantities[item._id] <= 0}
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-bold text-gray-900 text-sm">{quantities[item._id] || 0}</span>
                          <button
                            onClick={() => handleQuantityChange(item._id, 1)}
                            className="p-1.5 rounded-md hover:bg-white text-gray-600 hover:text-orange-600 transition-colors shadow-sm"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleUpdateQuantity(item._id)}
                          className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 hover:text-orange-600 transition-all shadow-sm disabled:opacity-50 disabled:bg-gray-50"
                          disabled={quantities[item._id] === item.qty || quantities[item._id] <= 0}
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Divider */}
            {/* <div className="border-t border-gray-200"></div> */}

            {/* Order Summary & Payment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
              {/* Payment Method Selection */}
              <motion.div
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit"
                variants={itemVariants}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BanknotesIcon className="h-6 w-6 text-orange-600" /> Payment Method
                </h3>
                <div className="space-y-4">
                  <div
                    className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all duration-200 ${paymentMethod === 'Cash' ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'}`}
                    onClick={() => setPaymentMethod('Cash')}
                  >
                    <div className={`mt-1 mr-4 p-2 rounded-full ${paymentMethod === 'Cash' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                      <BanknotesIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className={`text-base font-bold ${paymentMethod === 'Cash' ? 'text-orange-900' : 'text-gray-900'}`}>Cash on Delivery</h4>
                      <p className={`text-sm mt-1 ${paymentMethod === 'Cash' ? 'text-orange-700' : 'text-gray-500'}`}>Pay with cash when you pick up your order at the truck.</p>
                    </div>
                  </div>

                  <div
                    className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all duration-200 ${paymentMethod === 'Card' ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'}`}
                    onClick={() => setPaymentMethod('Card')}
                  >
                    <div className={`mt-1 mr-4 p-2 rounded-full ${paymentMethod === 'Card' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                      <CreditCardIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className={`text-base font-bold ${paymentMethod === 'Card' ? 'text-orange-900' : 'text-gray-900'}`}>Pay Online</h4>
                      <p className={`text-sm mt-1 ${paymentMethod === 'Card' ? 'text-orange-700' : 'text-gray-500'}`}>Securely pay with your credit or debit card via Stripe.</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Summary & Checkout */}
              <motion.div
                className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 h-fit sticky top-24"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
                <div className="space-y-4">
                  <div className="text-gray-600 text-sm space-y-3">
                    {cartItems.map((item) => (
                      <div key={item._id} className="flex justify-between items-center pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                        <span className="font-medium text-gray-800">{item.name} <span className="text-gray-400 text-xs">x{item.qty}</span></span>
                        <span className="font-semibold text-gray-900">${(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                      <span>Total To Pay</span>
                      <span className="text-2xl text-orange-600">${total.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">Includes all taxes</p>
                  </div>

                  <div className="mt-8">
                    {paymentMethod === 'Cash' ? (
                      <motion.button
                        onClick={handlePlaceOrder}
                        disabled={isLoading}
                        className={`w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 hover:shadow-lg transition-all duration-300 flex justify-center items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        whileHover={{ scale: isLoading ? 1 : 1.02 }}
                        whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      >
                        {isLoading ? (
                          <>Processing...</>
                        ) : (
                          <>Place Order <span className="font-normal text-orange-200">(${total.toFixed(2)})</span></>
                        )}
                      </motion.button>
                    ) : (
                      <div className="mt-4">
                        {isAuthenticated ? (
                          <StripePayment totalAmount={total} onPaymentSuccess={handlePaymentSuccess} />
                        ) : (
                          <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors"
                          >
                            Log in to Pay
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {paymentMethod === 'Cash' && isAuthenticated && (
                    <p className="text-center text-xs text-gray-500 mt-4">
                      By placing this order, you agree to pay in person upon pickup.
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Cart;
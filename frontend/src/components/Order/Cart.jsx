import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { adjustCartQuantity, removeFromCart, clearCart } from '../../redux/actions/cartActions';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { PlusIcon, MinusIcon, TrashIcon } from '@heroicons/react/24/solid';

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
    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23FFEDD5'/%3E%3Cpath d='M200,150 L250,100 L300,150 L250,200 Z' fill='%23FDBA74'/%3E%3Ccircle cx='200' cy='150' r='30' fill='%23FB923C'/%3E%3C/svg%3E";
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

  // Handle placing order
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
        { items },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      dispatch(clearCart());
      notify('Order placed! Pay cash on arrival. Personally check your phone for confirmation.', 'success');
      navigate('/orders');
    } catch (err) {
      notify('Failed to place order. Please try again.', 'error');
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
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container mx-auto px-6 py-12">
        <motion.h2
          className="text-5xl md:text-6xl font-extrabold tracking-tight text-center mb-16 text-[cornsilk] drop-shadow-sm font-serif"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          Your Shopping Cart
        </motion.h2>



        {cartItems.length === 0 ? (
          <motion.div
            className="text-center py-12 bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-lg backdrop-blur-sm"
            variants={itemVariants}
          >
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Start adding delicious items from our menu!</p>
            <motion.button
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-full font-semibold"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div
                    key={item._id}
                    className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: 20 }}
                    whileHover={{ scale: 1.03, boxShadow: '0 25px 50px rgba(251, 146, 60, 0.2)' }}
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={item.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23FFEDD5'/%3E%3Cpath d='M200,150 L250,100 L300,150 L250,200 Z' fill='%23FDBA74'/%3E%3Ccircle cx='200' cy='150' r='30' fill='%23FB923C'/%3E%3C/svg%3E"}
                        alt={item.name}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={handleImageError}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-orange-600/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white group-hover:text-orange-600 transition-colors">
                          {item.name}
                        </h3>
                        <motion.button
                          onClick={() => handleRemoveFromCart(item._id)}
                          className="text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-100/50 dark:hover:bg-red-900/50 transition-colors duration-300"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </motion.button>
                      </div>
                      {item.description && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">{item.description}</p>
                      )}
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-4">
                        ${(item.price * item.qty).toFixed(2)}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <motion.button
                            onClick={() => handleQuantityChange(item._id, -1)}
                            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-900 dark:text-white disabled:opacity-50"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={quantities[item._id] <= 0}
                          >
                            <MinusIcon className="h-5 w-5" />
                          </motion.button>
                          <span className="text-lg font-semibold text-gray-800 dark:text-white w-10 text-center">
                            {quantities[item._id] || 0}
                          </span>
                          <motion.button
                            onClick={() => handleQuantityChange(item._id, 1)}
                            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-900 dark:text-white"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <PlusIcon className="h-5 w-5" />
                          </motion.button>
                        </div>
                        <motion.button
                          onClick={() => handleUpdateQuantity(item._id)}
                          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 px-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={quantities[item._id] === item.qty || quantities[item._id] <= 0}
                        >
                          Update
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <motion.div
              className="bg-white/80 dark:bg-gray-800/80 p-6 rounded-3xl shadow-lg backdrop-blur-sm"
              variants={itemVariants}
            >
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Order Summary</h3>
              <div className="space-y-4">
                <div className="text-gray-700 dark:text-gray-300">
                  <h4 className="text-lg font-semibold mb-2">Items:</h4>
                  <ul className="space-y-2">
                    {cartItems.map((item) => (
                      <li key={item._id} className="flex justify-between">
                        <span>{item.name} (x{item.qty})</span>
                        <span>${(item.price * item.qty).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-between text-2xl font-bold text-gray-800 dark:text-white pt-4">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <motion.button
                  onClick={handlePlaceOrder}
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                >
                  {isLoading ? 'Placing Order...' : 'Place Order (Cash on Arrival)'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Cart;
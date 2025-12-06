import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { addToCart, removeFromCart, adjustCartQuantity, clearCart } from '../../redux/actions/cartActions';
import { MagnifyingGlassIcon, TrashIcon, MinusIcon, PlusIcon, CreditCardIcon, BanknotesIcon, XMarkIcon } from '@heroicons/react/24/solid';
import StripePayment from '../../components/Payment/StripePayment';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';

const POSDashboard = () => {
  const [menu, setMenu] = useState([]);
  const [filteredMenu, setFilteredMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.cart);
  const { notify } = useNotification();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/menu`);
        setMenu(data);
        setFilteredMenu(data);
        const cats = [...new Set(data.map(item => item.category))];
        setCategories(['all', ...cats]);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  useEffect(() => {
    let filtered = menu.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === 'all' || item.category === category)
    );
    setFilteredMenu(filtered);
  }, [search, category, menu]);

  const handleAddToCart = (item) => {
    const existingItem = cartItems.find(x => x._id === item._id);
    const qty = existingItem ? existingItem.qty + 1 : 1;
    dispatch(addToCart(item, qty));
  };

  const handleRemoveOne = (item) => {
    const existingItem = cartItems.find(x => x._id === item._id);
    if (existingItem.qty > 1) {
      dispatch(adjustCartQuantity(item._id, existingItem.qty - 1));
    } else {
      dispatch(removeFromCart(item._id));
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);
  };

  const handleCheckout = async (paymentMethod) => {
    if (cartItems.length === 0) return;

    if (paymentMethod === 'Card') {
      setShowCardModal(true);
      return;
    }

    setProcessing(true);
    try {
      const items = cartItems.map((item) => ({ menuItem: item._id, qty: item.qty }));
      await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/api/orders`,
        { items, paymentMethod },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      dispatch(clearCart());
      notify('Order placed successfully!', 'success');
    } catch (error) {
      console.error(error);
      notify('Failed to place order', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleCardPaymentSuccess = async (paymentIntentId) => {
    setProcessing(true);
    try {
      const items = cartItems.map((item) => ({ menuItem: item._id, qty: item.qty }));
      await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/api/orders`,
        { items, paymentMethod: 'Card', paymentIntentId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      dispatch(clearCart());
      setShowCardModal(false);
      notify('Order placed successfully!', 'success');
    } catch (error) {
      console.error(error);
      notify('Failed to place order', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-white text-gray-900 overflow-hidden">
      {/* Left Side: Menu Grid */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Header / Filter Bar */}
        <div className="flex gap-4 mb-4 items-center bg-gray-50 p-2 rounded-xl shadow-sm border border-gray-100">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu..."
              className="w-full bg-white text-gray-900 pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar max-w-lg">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${category === cat ? 'bg-orange-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center h-full text-gray-500">Loading Menu...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-20">
              {filteredMenu.map(item => (
                <motion.div
                  key={item._id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddToCart(item)}
                  className="bg-white rounded-xl p-2 cursor-pointer hover:shadow-md border border-gray-100 transition-all flex flex-col items-center text-center group h-48 justify-between relative overflow-hidden"
                >
                  <div className="w-full h-24 mb-2 overflow-hidden rounded-lg bg-gray-50">
                    <img
                      src={item.image || "https://placehold.co/150"}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/150"; }}
                    />
                  </div>
                  <div className="w-full px-1">
                    <h3 className="font-semibold text-sm leading-tight mb-1 truncate w-full text-gray-800">{item.name}</h3>
                    <p className="text-orange-600 font-bold text-sm">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-orange-500 text-white p-1 rounded-full shadow-sm">
                      <PlusIcon className="h-4 w-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Cart / Checkout */}
      <div className="w-80 bg-gray-50 flex flex-col border-l border-gray-200 shadow-xl z-10">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <span className="text-orange-600">Current Order</span>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-gray-50">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
              <div className="text-5xl mb-2">🛒</div>
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            <AnimatePresence>
              {cartItems.map(item => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white p-3 rounded-xl mb-2 flex items-center justify-between shadow-sm border border-gray-100"
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <h4 className="font-semibold text-sm text-gray-800 truncate">{item.name}</h4>
                    <p className="text-xs text-gray-500">${item.price.toFixed(2)} x {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button onClick={(e) => { e.stopPropagation(); handleRemoveOne(item); }} className="p-1 hover:bg-white rounded text-red-500 shadow-sm transition-colors">
                      <MinusIcon className="h-3 w-3" />
                    </button>
                    <span className="font-bold text-sm w-4 text-center text-gray-700">{item.qty}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }} className="p-1 hover:bg-white rounded text-green-600 shadow-sm transition-colors">
                      <PlusIcon className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="ml-3 font-bold text-orange-600 text-sm">
                    ${(item.price * item.qty).toFixed(2)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 font-medium">Total</span>
            <span className="font-bold text-2xl text-gray-900">${calculateTotal().toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={processing}
              onClick={() => handleCheckout('Cash')}
              className={`bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all shadow-sm active:scale-95 ${processing ? 'opacity-50' : ''}`}
            >
              <BanknotesIcon className="h-5 w-5" />
              <span className="text-sm">Cash</span>
            </button>
            <button
              disabled={processing}
              onClick={() => handleCheckout('Card')}
              className={`bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all shadow-sm active:scale-95 ${processing ? 'opacity-50' : ''}`}
            >
              <CreditCardIcon className="h-5 w-5" />
              <span className="text-sm">Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stripe Payment Modal */}
      <AnimatePresence>
        {showCardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md relative border border-gray-100 shadow-2xl"
            >
              <button
                onClick={() => setShowCardModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <CreditCardIcon className="h-6 w-6 text-blue-600" />
                Card Payment
              </h2>

              <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                <p className="text-gray-500 text-sm mb-1">Total to Pay</p>
                <p className="text-3xl font-bold text-gray-900">${calculateTotal().toFixed(2)}</p>
              </div>

              <StripePayment
                totalAmount={calculateTotal()}
                onPaymentSuccess={handleCardPaymentSuccess}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default POSDashboard;

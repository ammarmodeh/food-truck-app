import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { addToCart, adjustCartQuantity, removeFromCart } from '../../redux/actions/cartActions';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon, MinusIcon, TrashIcon } from '@heroicons/react/24/solid';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

// Unchanged functions
const handleImageError = (e) => {
  e.target.onerror = null;
  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%234B5563'/%3E%3Cpath d='M200,150 L250,100 L300,150 L250,200 Z' fill='%23F59E0B'/%3E%3Ccircle cx='200' cy='150' r='30' fill='%23D97706'/%3E%3C/svg%3E";
};

const MenuList = () => {
  const [menu, setMenu] = useState([]);
  const [filteredMenu, setFilteredMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('name');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [prepTime, setPrepTime] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({});
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/menu`);
        setMenu(data);
        setFilteredMenu(data);
        const cats = [...new Set(data.map(item => item.category))];
        setCategories(['all', ...cats]);
      } catch (err) {
        setError('Failed to load menu. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  useEffect(() => {
    if (menu.length > 0) {
      const initialQuantities = menu.reduce((acc, item) => {
        const cartItem = cartItems.find(cartItem => cartItem._id === item._id);
        return { ...acc, [item._id]: cartItem ? cartItem.qty : 0 };
      }, {});
      setQuantities(initialQuantities);
    }
  }, [menu, cartItems]);

  // Filter and sort menu
  useMemo(() => {
    let filtered = menu.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === 'all' || item.category === category) &&
      (!priceRange.min || item.price >= parseFloat(priceRange.min || 0)) &&
      (!priceRange.max || item.price <= parseFloat(priceRange.max || Infinity)) &&
      (!prepTime || item.prepTime <= parseInt(prepTime || Infinity))
    );
    filtered.sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });
    setFilteredMenu(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [search, category, sort, priceRange, prepTime, menu]);

  // Pagination
  const totalPages = Math.ceil(filteredMenu.length / itemsPerPage);
  const paginatedMenu = filteredMenu.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Dynamic grid layout
  const getGridClasses = (itemCount) => {
    if (itemCount === 1) return 'grid grid-cols-1 mx-auto';
    if (itemCount === 2) return 'grid grid-cols-1 sm:grid-cols-2 gap-8 mx-auto';
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto';
  };

  // Clear filters
  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setSort('name');
    setPriceRange({ min: '', max: '' });
    setPrepTime('');
    setCurrentPage(1);
  };

  const getItemQuantity = (itemId) => {
    const cartItem = cartItems.find(item => item._id === itemId);
    return cartItem ? cartItem.qty : 0;
  };

  const handleQuantityChange = (itemId, delta) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta),
    }));
  };

  const handleAddToCart = (item) => {
    const qty = quantities[item._id] || 0;
    if (qty > 0) {
      if (getItemQuantity(item._id) > 0) {
        dispatch(adjustCartQuantity(item._id, qty));
      } else {
        dispatch(addToCart(item, qty));
      }
    } else if (getItemQuantity(item._id) > 0) {
      dispatch(adjustCartQuantity(item._id, 0));
    }
  };

  const handleRemoveFromCart = (itemId) => {
    dispatch(removeFromCart(itemId));
    setQuantities(prev => ({
      ...prev,
      [itemId]: 0,
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="section-container">
        <motion.h2
          className="section-heading"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          Our Gourmet Menu
        </motion.h2>

        {/* Search and Filters */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12 card-gradient-bg p-6 rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700"
          variants={itemVariants}
        >
          <div className="relative">
            <label htmlFor="search" className="block text-gray-300 font-semibold mb-1">Search</label>
            <input
              id="search"
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
            />
            <MagnifyingGlassIcon className="h-5 w-5 absolute right-3 top-[3.3rem] transform -translate-y-1/2 text-gray-400" />
          </div>
          <div className="relative">
            <label htmlFor="category" className="block text-gray-300 font-semibold mb-1">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300 appearance-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            <FunnelIcon className="h-5 w-5 absolute right-3 top-[3.3rem] transform -translate-y-1/2 text-orange-500 pointer-events-none" />
          </div>
          <div className="relative">
            <label htmlFor="sort" className="block text-gray-300 font-semibold mb-1">Sort</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300 appearance-none"
            >
              <option value="name">Sort by Name</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <ChevronDownIcon className="h-5 w-5 absolute right-3 top-[3.3rem] transform -translate-y-1/2 text-orange-500 pointer-events-none" />
          </div>
          <div className="relative">
            <label htmlFor="priceRange" className="block text-gray-300 font-semibold mb-1">Price Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
              />
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
              />
            </div>
          </div>
          <div className="relative">
            <label htmlFor="prepTime" className="block text-gray-300 font-semibold mb-1">Max Prep Time</label>
            <select
              id="prepTime"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300 appearance-none"
            >
              <option value="">Any</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="60">60 min</option>
            </select>
            <ChevronDownIcon className="h-5 w-5 absolute right-3 top-[3.3rem] transform -translate-y-1/2 text-orange-500 pointer-events-none" />
          </div>
        </motion.div>
        <motion.div className="flex justify-end mb-6" variants={itemVariants}>
          <button
            onClick={clearFilters}
            className="px-6 py-3 bg-gray-700 text-white rounded-full font-semibold hover:bg-gray-600 transition duration-300"
          >
            Clear Filters
          </button>
        </motion.div>

        {/* Menu Items */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((_, index) => (
              <motion.div
                key={index}
                className="card-gradient-bg p-6 rounded-3xl shadow-lg animate-pulse border border-gray-700"
                variants={itemVariants}
              >
                <div className="w-full h-48 bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-orange-700 rounded-lg"></div>
              </motion.div>
            ))}
          </div>
        ) : error ? (
          <motion.div
            className="text-center py-12 card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700 max-w-7xl mx-auto"
            variants={itemVariants}
          >
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-2xl font-bold text-gray-300 mb-2">Unable to load menu</h3>
            <p className="text-gray-400 mb-6">{error}</p>
            <motion.button
              className="bg-button-bg-primary text-white px-8 py-3 rounded-full font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
            >
              Try Again
            </motion.button>
          </motion.div>
        ) : filteredMenu.length === 0 ? (
          <motion.div
            className="text-center py-12 card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700 max-w-7xl mx-auto"
            variants={itemVariants}
          >
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-2xl font-bold text-gray-300 mb-2">No items found</h3>
            <p className="text-gray-400">Try adjusting your search or filters.</p>
          </motion.div>
        ) : (
          <>
            <motion.div className="flex justify-between items-center mb-6" variants={itemVariants}>
              <h3 className="text-xl font-bold text-white">Showing {paginatedMenu.length} of {filteredMenu.length} menu items</h3>
            </motion.div>
            <motion.div
              className={getGridClasses(paginatedMenu.length)}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {paginatedMenu.map((item) => {
                const cartQty = getItemQuantity(item._id);
                const localQty = quantities[item._id] || 0;
                return (
                  <motion.div
                    key={item._id}
                    className="relative card-gradient-bg rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 border border-gray-700 w-full"
                    variants={itemVariants}
                    whileHover={{ scale: 1.03, boxShadow: '0 25px 50px rgba(251, 146, 60, 0.2)' }}
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={item.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%234B5563'/%3E%3Cpath d='M200,150 L250,100 L300,150 L250,200 Z' fill='%23F59E0B'/%3E%3Ccircle cx='200' cy='150' r='30' fill='%23D97706'/%3E%3C/svg%3E"}
                        alt={item.name}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={handleImageError}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-orange-600/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-2xl font-bold text-white group-hover:text-orange-600 transition-colors">
                          {item.name}
                        </h3>
                        <AnimatePresence>
                          {cartQty > 0 && user && (
                            <motion.span
                              className="bg-gradient-to-r from-orange-900 to-orange-800 text-orange-300 text-xs font-semibold px-2 py-1 rounded-full"
                              variants={badgeVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                            >
                              Added {cartQty} time{cartQty === 1 ? '' : 's'}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      {item.description && (
                        <p className="text-gray-300 mb-3 text-sm line-clamp-2">{item.description}</p>
                      )}
                      <p className="text-2xl font-bold text-orange-400 mb-4">
                        ${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-400 mb-4">
                        Prep Time: {item.prepTime} min | Category: {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                      </p>
                      {user ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <motion.button
                              onClick={() => handleQuantityChange(item._id, -1)}
                              className="p-2 bg-gray-700 rounded-full text-white disabled:opacity-50"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              disabled={localQty <= 0}
                            >
                              <MinusIcon className="h-5 w-5" />
                            </motion.button>
                            <span className="text-lg font-semibold text-white w-10 text-center">
                              {localQty}
                            </span>
                            <motion.button
                              onClick={() => handleQuantityChange(item._id, 1)}
                              className="p-2 bg-gray-700 rounded-full text-white"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <PlusIcon className="h-5 w-5" />
                            </motion.button>
                          </div>
                          <div className="flex items-center gap-2">
                            <motion.button
                              onClick={() => handleAddToCart(item)}
                              className="bg-button-bg-primary text-white py-2 px-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              disabled={localQty <= 0}
                            >
                              {cartQty > 0 ? 'Update Cart' : 'Add to Cart'}
                            </motion.button>
                            <AnimatePresence>
                              {cartQty > 0 && (
                                <motion.button
                                  onClick={() => handleRemoveFromCart(item._id)}
                                  className="bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 border border-gray-700"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </motion.button>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          Please <a href="/login" className='font-semibold underline hover:text-orange-600 text-orange-500'>login</a> to add items to your cart.
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
            {/* Pagination Controls */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-between mt-8"
              variants={itemVariants}
            >
              <div className="flex items-center space-x-2 mb-4 sm:mb-0">
                <label className="text-gray-300">Items per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value, 10));
                    setCurrentPage(1);
                  }}
                  className="bg-gray-700 text-white border border-gray-600 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="6">6</option>
                  <option value="12">12</option>
                  <option value="24">24</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-gray-700 text-white px-4 py-2 rounded-full disabled:opacity-50"
                  whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
                  whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                >
                  Previous
                </motion.button>
                <span className="text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <motion.button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="bg-gray-700 text-white px-4 py-2 rounded-full disabled:opacity-50"
                  whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
                  whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
                >
                  Next
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default MenuList;
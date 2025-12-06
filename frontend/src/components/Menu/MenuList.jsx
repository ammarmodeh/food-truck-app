import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { addToCart, adjustCartQuantity, removeFromCart } from '../../redux/actions/cartActions';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon, MinusIcon, TrashIcon, ShoppingCartIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const handleImageError = (e) => {
  e.target.onerror = null;
  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23E5E7EB'/%3E%3Cpath d='M200,150 L250,100 L300,150 L250,200 Z' fill='%23D1D5DB'/%3E%3Ccircle cx='200' cy='150' r='30' fill='%239CA3AF'/%3E%3C/svg%3E";
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
  const [retryCount, setRetryCount] = useState(0);
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/menu`);
      setMenu(data);
      setFilteredMenu(data);
      const cats = [...new Set(data.map(item => item.category))];
      setCategories(['all', ...cats]);
      setRetryCount(0);
    } catch (err) {
      const errorMessage = err.response?.status === 500
        ? 'Server is temporarily unavailable. Please try again shortly.'
        : 'Failed to load menu. Please try again later.';

      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchMenu();
  };

  useEffect(() => {
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
    if (itemCount === 2) return 'grid grid-cols-1 sm:grid-cols-2 gap-6 mx-auto';
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mx-auto';
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

  // Floating button animation variants
  const fabVariants = {
    hidden: { opacity: 0, scale: 0, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0, y: 20, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative font-sans text-gray-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Our Gourmet Menu
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our curated selection of delicious dishes, crafted with passion.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="relative">
            <label htmlFor="search" className="block text-gray-700 font-semibold mb-1 text-sm">Search</label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Search dishes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
              <MagnifyingGlassIcon className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="relative">
            <label htmlFor="category" className="block text-gray-700 font-semibold mb-1 text-sm">Category</label>
            <div className="relative">
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
              <FunnelIcon className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="relative">
            <label htmlFor="sort" className="block text-gray-700 font-semibold mb-1 text-sm">Sort</label>
            <div className="relative">
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="name">Sort by Name</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
              <ChevronDownIcon className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="relative">
            <label htmlFor="priceRange" className="block text-gray-700 font-semibold mb-1 text-sm">Price Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                className="w-full py-2.5 px-3 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                className="w-full py-2.5 px-3 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="relative">
            <label htmlFor="prepTime" className="block text-gray-700 font-semibold mb-1 text-sm">Max Prep Time</label>
            <div className="relative">
              <select
                id="prepTime"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="">Any</option>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="60">60 min</option>
              </select>
              <ChevronDownIcon className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </motion.div>

        <motion.div className="flex justify-end mb-8" variants={itemVariants} initial="hidden" animate="visible">
          <button
            onClick={clearFilters}
            className="px-5 py-2 text-sm bg-white text-gray-600 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50 hover:text-orange-600 transition-colors shadow-sm"
          >
            Clear Filters
          </button>
        </motion.div>

        {/* Menu Items */}
        <AnimatePresence mode="wait">
          {loading && !error ? (
            <motion.div
              key="loading"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mx-auto"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {[1, 2, 3, 4, 5, 6].map((_, index) => (
                <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
                  <div className="w-full h-48 bg-gray-200 rounded-xl mb-4"></div>
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded-lg mt-4"></div>
                </div>
              ))}
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 mx-auto max-w-2xl"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to load menu</h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <button
                className="bg-orange-600 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center justify-center mx-auto hover:bg-orange-700 transition-colors shadow-md"
                onClick={handleRetry}
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Try Again
              </button>
            </motion.div>
          ) : filteredMenu.length === 0 ? (
            <motion.div
              key="empty"
              className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 mx-auto max-w-2xl"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="text-6xl mb-4 opacity-50">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500">Try adjusting your search or filters.</p>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <motion.div className="flex justify-between items-center mb-6" variants={itemVariants}>
                <h3 className="text-lg font-medium text-gray-500">Showing {paginatedMenu.length} of {filteredMenu.length} items</h3>
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
                      className="group bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden transition-all duration-300 flex flex-col h-full"
                      variants={itemVariants}
                    >
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        <img
                          src={item.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23E5E7EB'/%3E%3Cpath d='M200,150 L250,100 L300,150 L250,200 Z' fill='%23D1D5DB'/%3E%3Ccircle cx='200' cy='150' r='30' fill='%239CA3AF'/%3E%3C/svg%3E"}
                          alt={item.name}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                          onError={handleImageError}
                        />
                        {cartQty > 0 && user && (
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-orange-100">
                            <span className="text-xs font-bold text-orange-600">Added x{cartQty}</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900/60 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="text-xs font-medium bg-orange-600 px-2 py-0.5 rounded-full w-fit">{item.category}</p>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-orange-600 transition-colors">{item.name}</h3>
                          <span className="text-lg font-bold text-orange-600 whitespace-nowrap">${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price || 0).toFixed(2)}</span>
                        </div>

                        {item.description && (
                          <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{item.description}</p>
                        )}

                        <div className="mt-auto">
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-4 font-medium uppercase tracking-wide">
                            <span>{item.prepTime} min prep</span>
                          </div>

                          {user ? (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                <button
                                  onClick={() => handleQuantityChange(item._id, -1)}
                                  disabled={localQty <= 0}
                                  className="p-1.5 rounded-md hover:bg-white text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors shadow-sm disabled:shadow-none"
                                >
                                  <MinusIcon className="h-4 w-4" />
                                </button>
                                <span className="w-8 text-center font-bold text-gray-900 text-sm">{localQty}</span>
                                <button
                                  onClick={() => handleQuantityChange(item._id, 1)}
                                  className="p-1.5 rounded-md hover:bg-white text-gray-600 hover:text-orange-600 transition-colors shadow-sm"
                                >
                                  <PlusIcon className="h-4 w-4" />
                                </button>
                              </div>
                              <button
                                onClick={() => handleAddToCart(item)}
                                disabled={localQty <= 0}
                                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg text-sm font-semibold shadow-md hover:bg-orange-700 hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all duration-300"
                              >
                                {cartQty > 0 ? 'Update' : 'Add'}
                              </button>
                              {cartQty > 0 && (
                                <button
                                  onClick={() => handleRemoveFromCart(item._id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <Link to="/login" className="block w-full text-center py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                              Login to Order
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <motion.div
                  className="flex flex-col sm:flex-row items-center justify-between mt-10 p-4 bg-white rounded-xl shadow-sm border border-gray-100"
                  variants={itemVariants}
                >
                  <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                    <span className="text-gray-500 text-sm font-medium">Show:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(parseInt(e.target.value, 10));
                        setCurrentPage(1);
                      }}
                      className="bg-gray-50 text-gray-900 border border-gray-200 rounded-lg py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="6">6</option>
                      <option value="12">12</option>
                      <option value="24">24</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-gray-600 text-sm w-32 text-center font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-gray-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartItems.length > 0 && user && (
          <motion.div
            className="fixed bottom-8 right-8 z-50"
            variants={fabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Link to="/cart">
              <button
                className="bg-orange-600 text-white px-6 py-4 rounded-full shadow-xl hover:shadow-2xl hover:bg-orange-700 transition-all duration-300 flex items-center gap-3 transform hover:-translate-y-1"
              >
                <ShoppingCartIcon className="h-6 w-6" />
                <span className="font-bold text-lg">
                  Cart ({cartItems.reduce((acc, item) => acc + item.qty, 0)})
                </span>
              </button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuList;
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid';

const MenuManagement = () => {
  const { notify } = useNotification();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuForm, setMenuForm] = useState({ name: '', description: '', price: 0, category: '', image: '', prepTime: 5 });
  const [editItemId, setEditItemId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/menu`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setMenuItems(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch menu items. Please try again later.');
        notify('Failed to fetch menu items', 'error');
        setLoading(false);
      }
    };

    if (user && user.isAdmin) {
      fetchMenuItems();
    } else {
      setLoading(false);
    }
  }, [user, notify]);

  const handleMenuChange = (e) => {
    const { name, value } = e.target;
    setMenuForm({
      ...menuForm,
      [name]: name === 'price' || name === 'prepTime' ? parseFloat(value) || 0 : value,
    });
  };

  const addMenuItem = async (e) => {
    e.preventDefault();
    if (!menuForm.name || !menuForm.price || !menuForm.category) {
      notify('Please fill in all required fields', 'error');
      return;
    }
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_API}/api/menu`, menuForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setMenuItems([...menuItems, data]);
      setMenuForm({ name: '', description: '', price: 0, category: '', image: '', prepTime: 5 });
      notify('Menu item added successfully!', 'success');
    } catch (err) {
      notify('Failed to add menu item', 'error');
    }
  };

  const updateMenuItem = async (id, e) => {
    e.preventDefault();
    if (!menuForm.name || !menuForm.price || !menuForm.category) {
      notify('Please fill in all required fields', 'error');
      return;
    }
    try {
      const { data } = await axios.put(`${import.meta.env.VITE_BACKEND_API}/api/menu/${id}`, menuForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setMenuItems(menuItems.map((item) => (item._id === id ? data : item)));
      setEditItemId(null);
      setMenuForm({ name: '', description: '', price: 0, category: '', image: '', prepTime: 5 });
      notify('Menu item updated successfully!', 'success');
    } catch (err) {
      notify('Failed to update menu item', 'error');
    }
  };

  const deleteMenuItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_API}/api/menu/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setMenuItems(menuItems.filter((item) => item._id !== id));
      notify('Menu item deleted successfully!', 'success');
    } catch (err) {
      notify('Failed to delete menu item', 'error');
    }
  };

  // Filter and paginate menu items
  const filteredItems = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery)
    );
  }, [menuItems, searchQuery]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
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
          className="text-5xl md:text-6xl font-extrabold tracking-tight text-center mb-16 text-[cornsilk] drop-shadow-sm font-serif"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          Menu Management
        </motion.h2>


        {/* Add Menu Item Form */}
        <motion.section className="mb-12" variants={itemVariants}>
          <div className="bg-white/80 dark:bg-gray-800/80 p-8 rounded-3xl shadow-lg backdrop-blur-sm border-1 border-gray-700">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <PlusIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Add Menu Item</h3>
            </div>
            <form onSubmit={addMenuItem}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Name *</label>
                  <input
                    name="name"
                    value={menuForm.name}
                    onChange={handleMenuChange}
                    placeholder="Item Name"
                    className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Category *</label>
                  <input
                    name="category"
                    value={menuForm.category}
                    onChange={handleMenuChange}
                    placeholder="Category"
                    className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Description</label>
                <textarea
                  name="description"
                  value={menuForm.description}
                  onChange={handleMenuChange}
                  placeholder="Item Description"
                  className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Price ($)*</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    value={menuForm.price}
                    onChange={handleMenuChange}
                    placeholder="Price"
                    className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Prep Time (min)</label>
                  <input
                    name="prepTime"
                    type="number"
                    value={menuForm.prepTime}
                    onChange={handleMenuChange}
                    placeholder="Prep Time"
                    className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    min="1"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Image URL</label>
                <input
                  name="image"
                  value={menuForm.image}
                  onChange={handleMenuChange}
                  placeholder="Image URL"
                  className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                />
              </div>
              <motion.button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-full font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Add Item
              </motion.button>
            </form>
          </div>
        </motion.section>

        {/* Menu Items List */}
        <motion.section className="mb-12" variants={itemVariants}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Menu Items</h3>
            <input
              type="text"
              placeholder="Search by Name or Category"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="w-full max-w-md p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
            />
          </div>

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
              className="text-center py-12 bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-lg backdrop-blur-sm border-1 border-gray-700"
              variants={itemVariants}
            >
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">Unable to load menu items</h3>
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
          ) : filteredItems.length === 0 ? (
            <motion.div
              className="text-center py-12 bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-lg backdrop-blur-sm border-1 border-gray-700"
              variants={itemVariants}
            >
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">No menu items found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No menu items match your search criteria.' : 'No menu items available.'}
              </p>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                  {paginatedItems.map((item) => (
                    <motion.div
                      key={item._id}
                      className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 border-1 border-gray-700"
                      variants={itemVariants}
                      initial="initial"
                      animate="visible"
                      exit={{ opacity: 0, y: 20 }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="p-6">
                        {editItemId === item._id ? (
                          <form onSubmit={(e) => updateMenuItem(item._id, e)}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Name *</label>
                                <input
                                  name="name"
                                  value={menuForm.name}
                                  onChange={handleMenuChange}
                                  placeholder="Item Name"
                                  className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Category *</label>
                                <input
                                  name="category"
                                  value={menuForm.category}
                                  onChange={handleMenuChange}
                                  placeholder="Category"
                                  className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                                  required
                                />
                              </div>
                            </div>
                            <div className="mb-4">
                              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Description</label>
                              <textarea
                                name="description"
                                value={menuForm.description}
                                onChange={handleMenuChange}
                                placeholder="Item Description"
                                className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                                rows="3"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Price ($)*</label>
                                <input
                                  name="price"
                                  type="number"
                                  step="0.01"
                                  value={menuForm.price}
                                  onChange={handleMenuChange}
                                  placeholder="Price"
                                  className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Prep Time (min)</label>
                                <input
                                  name="prepTime"
                                  type="number"
                                  value={menuForm.prepTime}
                                  onChange={handleMenuChange}
                                  placeholder="Prep Time"
                                  className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                                  min="1"
                                />
                              </div>
                            </div>
                            <div className="mb-4">
                              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Image URL</label>
                              <input
                                name="image"
                                value={menuForm.image}
                                onChange={handleMenuChange}
                                placeholder="Image URL"
                                className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                              />
                            </div>
                            <div className="flex justify-end space-x-4">
                              <motion.button
                                type="submit"
                                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full font-semibold"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Save
                              </motion.button>
                              <motion.button
                                type="button"
                                onClick={() => {
                                  setEditItemId(null);
                                  setMenuForm({ name: '', description: '', price: 0, category: '', image: '', prepTime: 5 });
                                }}
                                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-full font-semibold"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Cancel
                              </motion.button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-orange-600 transition-colors">
                                {item.name}
                              </h3>
                              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 font-semibold text-sm">
                                {item.category}
                              </span>
                            </div>
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-48 object-cover rounded-lg mb-4"
                              />
                            )}
                            <p className="text-gray-600 dark:text-gray-300 mb-2">{item.description || 'No description'}</p>
                            <p className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-2">
                              ${item.price.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                              Prep Time: {item.prepTime} min
                            </p>
                            <div className="flex justify-end space-x-4">
                              <motion.button
                                onClick={() => {
                                  setEditItemId(item._id);
                                  setMenuForm({
                                    name: item.name,
                                    description: item.description || '',
                                    price: item.price,
                                    category: item.category,
                                    image: item.image || '',
                                    prepTime: item.prepTime,
                                  });
                                }}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full font-semibold"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <PencilIcon className="h-5 w-5 inline mr-2" />
                                Edit
                              </motion.button>
                              <motion.button
                                onClick={() => deleteMenuItem(item._id)}
                                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full font-semibold"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <TrashIcon className="h-5 w-5 inline mr-2" />
                                Delete
                              </motion.button>
                            </div>
                          </>
                        )}
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

export default MenuManagement;
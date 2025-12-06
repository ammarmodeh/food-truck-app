import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, PhotoIcon } from '@heroicons/react/24/outline'; // Updated icons

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
  const itemsPerPage = 8; // Adjusted for better grid layout

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
        (item.name || '').toLowerCase().includes(lowerQuery) ||
        (item.category || '').toLowerCase().includes(lowerQuery)
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
        <motion.h2
          className="text-3xl font-bold text-gray-900 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Menu Management
        </motion.h2>

        {/* Add Menu Item Form */}
        <motion.section className="mb-10" variants={itemVariants}>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <PlusIcon className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Add Menu Item</h3>
            </div>
            <form onSubmit={addMenuItem}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Name *</label>
                  <input
                    name="name"
                    value={menuForm.name}
                    onChange={handleMenuChange}
                    placeholder="E.g., Classic Burger"
                    className="w-full p-3 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Category *</label>
                  <input
                    name="category"
                    value={menuForm.category}
                    onChange={handleMenuChange}
                    placeholder="E.g., Burgers"
                    className="w-full p-3 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={menuForm.description}
                  onChange={handleMenuChange}
                  placeholder="Describe your delicious item..."
                  className="w-full p-3 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-2">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Price ($)*</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    value={menuForm.price}
                    onChange={handleMenuChange}
                    placeholder="0.00"
                    className="w-full p-3 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Prep Time (min)</label>
                  <input
                    name="prepTime"
                    type="number"
                    value={menuForm.prepTime}
                    onChange={handleMenuChange}
                    placeholder="5"
                    className="w-full p-3 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Image URL</label>
                  <input
                    name="image"
                    value={menuForm.image}
                    onChange={handleMenuChange}
                    placeholder="https://..."
                    className="w-full p-3 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 shadow-md transition-all"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                Add Menu Item
              </motion.button>
            </form>
          </div>
        </motion.section>

        {/* Menu Items List */}
        <motion.section className="mb-12" variants={itemVariants}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <h3 className="text-xl font-bold text-gray-900">Items List</h3>
            <div className="relative w-full md:w-96">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition shadow-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((_, index) => (
                <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 h-80 animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-sm border border-red-100">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-red-500 mb-4">{error}</p>
              <button
                className="text-orange-600 font-bold hover:underline"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-200">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-bold text-gray-900">No items found</h3>
              <p className="text-gray-500 mt-2">Start adding items to your menu!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnimatePresence>
                  {paginatedItems.map((item) => (
                    <motion.div
                      key={item._id}
                      className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
                      variants={itemVariants}
                      initial="initial"
                      animate="visible"
                      exit={{ opacity: 0, scale: 0.9 }}
                      layout
                    >
                      <div className="relative h-48 bg-gray-100 overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <PhotoIcon className="h-12 w-12" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-700 shadow-sm">
                          {item.prepTime}m
                        </div>
                      </div>

                      <div className="p-5">
                        {editItemId === item._id ? (
                          <form onSubmit={(e) => updateMenuItem(item._id, e)} className="space-y-3">
                            <input
                              name="name"
                              value={menuForm.name}
                              onChange={handleMenuChange}
                              className="w-full p-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                              placeholder="Name"
                            />
                            <div className="flex gap-2">
                              <input
                                name="price"
                                type="number"
                                step="0.01"
                                value={menuForm.price}
                                onChange={handleMenuChange}
                                className="w-1/2 p-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                                placeholder="Price"
                              />
                              <input
                                name="category"
                                value={menuForm.category}
                                onChange={handleMenuChange}
                                className="w-1/2 p-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                                placeholder="Cat"
                              />
                            </div>
                            <textarea
                              name="description"
                              value={menuForm.description}
                              onChange={handleMenuChange}
                              className="w-full p-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                              rows="2"
                              placeholder="Desc"
                            />

                            <div className="flex gap-2 pt-2">
                              <button
                                type="submit"
                                className="flex-1 bg-green-600 text-white py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditItemId(null);
                                  setMenuForm({ name: '', description: '', price: 0, category: '', image: '', prepTime: 5 });
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-bold text-gray-900 line-clamp-1 text-lg group-hover:text-orange-600 transition-colors">
                                  {item.name}
                                </h3>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{item.category}</p>
                              </div>
                              <span className="font-bold text-orange-600 text-lg">
                                ${item.price.toFixed(2)}
                              </span>
                            </div>

                            <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">{item.description || 'No description provided.'}</p>

                            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                              <button
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
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => deleteMenuItem(item._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
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

export default MenuManagement;
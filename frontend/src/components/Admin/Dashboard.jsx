import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ChartBarIcon, PlusIcon } from '@heroicons/react/24/solid';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { notify } = useNotification();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [menuForm, setMenuForm] = useState({ name: '', description: '', price: 0, category: '', image: '', prepTime: 5 });
  const [scheduleForm, setScheduleForm] = useState({ date: '', location: '', state: '', startTime: '', endTime: '', coordinates: { lat: 0, lng: 0 } });
  const [locationForm, setLocationForm] = useState({ currentLocation: '', coordinates: { lat: 0, lng: 0 } });
  const [stats, setStats] = useState({ orders: 0, revenue: 0, chartData: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/orders`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const deliveredOrders = data.filter(order => order.status === 'Delivered');
        const revenue = deliveredOrders.reduce((acc, order) => acc + (typeof order.totalPrice === 'number' ? order.totalPrice : parseFloat(order.totalPrice || 0)), 0);
        const chartData = deliveredOrders.reduce((acc, order) => {
          const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const existing = acc.find((item) => item.date === date);
          if (existing) {
            existing.total += typeof order.totalPrice === 'number' ? order.totalPrice : parseFloat(order.totalPrice || 0);
          } else {
            acc.push({ date, total: typeof order.totalPrice === 'number' ? order.totalPrice : parseFloat(order.totalPrice || 0) });
          }
          return acc;
        }, []);
        setStats({ orders: deliveredOrders.length, revenue, chartData });
      } catch (err) {
        setError('Failed to load dashboard stats. Please try again later.');
        notify('Failed to load stats', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (user && user.isAdmin) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user, notify]);

  const handleMenuChange = (e) => setMenuForm({ ...menuForm, [e.target.name]: e.target.name === 'price' || e.target.name === 'prepTime' ? parseFloat(e.target.value) || 0 : e.target.value });
  const handleScheduleChange = (e) => setScheduleForm({ ...scheduleForm, [e.target.name]: e.target.value });
  const handleLocationChange = (e) => setLocationForm({ ...locationForm, [e.target.name]: e.target.name.includes('coordinates') ? { ...locationForm.coordinates, [e.target.name.split('.')[1]]: parseFloat(e.target.value) || 0 } : e.target.value });

  const addMenuItem = async (e) => {
    e.preventDefault();
    if (!menuForm.name || !menuForm.price || !menuForm.category) {
      notify('Please fill in all required fields', 'error');
      return;
    }
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_API}/api/menu`, menuForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      notify('Menu item added successfully!', 'success');
      setMenuForm({ name: '', description: '', price: 0, category: '', image: '', prepTime: 5 });
    } catch (err) {
      notify('Failed to add menu item', 'error');
    }
  };

  const addSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleForm.date || !scheduleForm.location || !scheduleForm.startTime || !scheduleForm.endTime) {
      notify('Please fill in all required fields', 'error');
      return;
    }
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_API}/api/schedules`, scheduleForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      notify('Schedule added successfully!', 'success');
      setScheduleForm({ date: '', location: '', state: '', startTime: '', endTime: '', coordinates: { lat: 0, lng: 0 } });
    } catch (err) {
      notify('Failed to add schedule', 'error');
    }
  };

  const updateLocation = async (e) => {
    e.preventDefault();
    if (!locationForm.currentLocation || !locationForm.coordinates.lat || !locationForm.coordinates.lng) {
      notify('Please fill in all required fields', 'error');
      return;
    }
    try {
      await axios.put(`${import.meta.env.VITE_BACKEND_API}/api/locations/current`, locationForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      notify('Location updated successfully!', 'success');
      setLocationForm({ currentLocation: '', coordinates: { lat: 0, lng: 0 } });
    } catch (err) {
      notify('Failed to update location', 'error');
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          color: '#4B5563',
          font: {
            weight: 'bold',
            size: 14
          }
        },
        grid: { display: false }
      },
      y: {
        title: {
          display: true,
          text: 'Revenue ($)',
          color: '#4B5563',
          font: {
            weight: 'bold',
            size: 14
          }
        },
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#4B5563',
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: '#fff',
        bodyColor: '#fff'
      }
    }
  };

  const chartData = {
    labels: stats.chartData.map(item => item.date),
    datasets: [
      {
        label: 'Revenue ($)',
        data: stats.chartData.map(item => item.total),
        backgroundColor: 'rgba(249, 115, 22, 0.6)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderWidth: 1
      }
    ]
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
          className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          Admin Dashboard
        </motion.h2>

        <motion.section className="mb-12" variants={itemVariants}>
          <div className="flex items-center justify-center space-x-3 mb-6">
            <ChartBarIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard Stats</h3>
          </div>
          {loading ? (
            <div className="bg-white/80 dark:bg-gray-800/80 p-8 rounded-3xl shadow-lg backdrop-blur-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
              </div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-lg backdrop-blur-sm">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">Unable to load stats</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
              <motion.button
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-full font-semibold"
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(251, 146, 60, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
              >
                Try Again
              </motion.button>
            </div>
          ) : (
            <motion.div className="bg-white/80 dark:bg-gray-800/80 p-8 rounded-3xl shadow-lg backdrop-blur-sm" variants={itemVariants}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-orange-100 dark:bg-orange-900 rounded-2xl">
                  <p className="text-lg text-gray-700 dark:text-gray-300">Delivered Orders</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.orders}</p>
                </div>
                <div className="p-4 bg-orange-100 dark:bg-orange-900 rounded-2xl">
                  <p className="text-lg text-gray-700 dark:text-gray-300">Total Revenue</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">${stats.revenue.toFixed(2)}</p>
                </div>
              </div>

              <div className="h-64 mt-6">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </motion.div>
          )}
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.section variants={itemVariants}>
            <div className="bg-white/80 dark:bg-gray-800/80 p-8 rounded-3xl shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <PlusIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Add Menu Item</h3>
              </div>
              <form onSubmit={addMenuItem}>
                <div className="mb-4">
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
                <div className="mb-4">
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
                <div className="mb-4">
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
                <div className="mb-6">
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

          <motion.section variants={itemVariants}>
            <div className="bg-white/80 dark:bg-gray-800/80 p-8 rounded-3xl shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <PlusIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Add Schedule</h3>
              </div>
              <form onSubmit={addSchedule}>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Date *</label>
                  <input
                    name="date"
                    type="date"
                    value={scheduleForm.date}
                    onChange={handleScheduleChange}
                    className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Location *</label>
                  <input
                    name="location"
                    value={scheduleForm.location}
                    onChange={handleScheduleChange}
                    placeholder="Location"
                    className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">State</label>
                  <input
                    name="state"
                    value={scheduleForm.state}
                    onChange={handleScheduleChange}
                    placeholder="State"
                    className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Start Time *</label>
                  <input
                    name="startTime"
                    value={scheduleForm.startTime}
                    onChange={handleScheduleChange}
                    placeholder="Start Time (e.g., 10:00 AM)"
                    className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">End Time *</label>
                  <input
                    name="endTime"
                    value={scheduleForm.endTime}
                    onChange={handleScheduleChange}
                    placeholder="End Time (e.g., 6:00 PM)"
                    className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Latitude</label>
                  <input
                    name="coordinates.lat"
                    type="number"
                    step="any"
                    value={scheduleForm.coordinates.lat}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, coordinates: { ...scheduleForm.coordinates, lat: parseFloat(e.target.value) || 0 } })}
                    placeholder="Latitude"
                    className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Longitude</label>
                  <input
                    name="coordinates.lng"
                    type="number"
                    step="any"
                    value={scheduleForm.coordinates.lng}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, coordinates: { ...scheduleForm.coordinates, lng: parseFloat(e.target.value) || 0 } })}
                    placeholder="Longitude"
                    className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                  />
                </div>
                <motion.button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-full font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Add Schedule
                </motion.button>
              </form>
            </div>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="bg-white/80 dark:bg-gray-800/80 p-8 rounded-3xl shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <PlusIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Update Current Location</h3>
              </div>
              <form onSubmit={updateLocation}>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Current Location *</label>
                  <input
                    name="currentLocation"
                    value={locationForm.currentLocation}
                    onChange={handleLocationChange}
                    placeholder="Current Location"
                    className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Latitude *</label>
                  <input
                    name="coordinates.lat"
                    type="number"
                    step="any"
                    value={locationForm.coordinates.lat}
                    onChange={(e) => setLocationForm({ ...locationForm, coordinates: { ...locationForm.coordinates, lat: parseFloat(e.target.value) || 0 } })}
                    placeholder="Latitude"
                    className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Longitude *</label>
                  <input
                    name="coordinates.lng"
                    type="number"
                    step="any"
                    value={locationForm.coordinates.lng}
                    onChange={(e) => setLocationForm({ ...locationForm, coordinates: { ...locationForm.coordinates, lng: parseFloat(e.target.value) || 0 } })}
                    placeholder="Longitude"
                    className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <motion.button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-full font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Update Location
                </motion.button>
              </form>
            </div>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
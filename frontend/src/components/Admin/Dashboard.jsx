import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
} from '@heroicons/react/24/solid';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

// OrdersTable component
const OrdersTable = ({ orders, filter, setFilter, currentPage, setCurrentPage, rowsPerPage, setRowsPerPage }) => {
  // Filter orders based on input values
  const filteredOrders = orders.filter((order) => {
    const orderNumberMatch = order.orderNumber.toLowerCase().includes(filter.orderNumber.toLowerCase());
    const customerMatch = order.user?.name?.toLowerCase().includes(filter.customer.toLowerCase()) || !filter.customer;
    const phoneMatch = order.phone.toLowerCase().includes(filter.phone.toLowerCase());
    const statusMatch = filter.status ? order.status === filter.status : true;
    return orderNumberMatch && customerMatch && phoneMatch && statusMatch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({ ...filter, [name]: value });
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1); // Reset to first page
  };

  return (
    <motion.section className="mb-12" variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    }}>
      <div className="card-gradient-bg p-8 rounded-3xl shadow-lg backdrop-blur-sm border-1 border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Recent Orders</h3>
          <div className="text-gray-300">Showing {paginatedOrders.length} of {filteredOrders.length} orders</div>
        </div>

        {/* Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-gray-300 font-semibold mb-1">Order Number</label>
            <input
              name="orderNumber"
              value={filter.orderNumber}
              onChange={handleFilterChange}
              placeholder="Search Order Number"
              className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
            />
          </div>
          <div>
            <label className="block text-gray-300 font-semibold mb-1">Customer</label>
            <input
              name="customer"
              value={filter.customer}
              onChange={handleFilterChange}
              placeholder="Search Customer"
              className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
            />
          </div>
          <div>
            <label className="block text-gray-300 font-semibold mb-1">Phone</label>
            <input
              name="phone"
              value={filter.phone}
              onChange={handleFilterChange}
              placeholder="Search Phone"
              className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
            />
          </div>
          <div>
            <label className="block text-gray-300 font-semibold mb-1">Status</label>
            <select
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
              className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Preparing">Preparing</option>
              <option value="Ready">Ready</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-300">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-4">Order Number</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Status</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Date</th>
                <th className="p-4">Items</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center">No orders match the filters</td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-600 hover:bg-gray-700/50">
                    <td className="p-4">{order.orderNumber}</td>
                    <td className="p-4">{order.user?.name || 'N/A'}</td>
                    <td className="p-4">{order.phone || 'N/A'}</td>
                    <td className="p-4">{order.status}</td>
                    <td className="p-4">
                      ${typeof order.totalPrice === 'number' ? order.totalPrice.toFixed(2) : parseFloat(order.totalPrice || 0).toFixed(2)}
                    </td>
                    <td className="p-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      {order.items ? order.items.map(item => `${item.menuItem?.name || 'Unknown'} (x${item.qty || 1})`).join(', ') : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <label className="text-gray-300">Rows per page:</label>
            <select
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              className="bg-gray-700 text-white border border-gray-600 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
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
        </div>
      </div>
    </motion.section>
  );
};

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const { notify } = useNotification();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [menuForm, setMenuForm] = useState({ name: '', description: '', price: 0, category: '', image: '', prepTime: 5 });
  const [scheduleForm, setScheduleForm] = useState({ date: '', location: '', state: '', startTime: '', endTime: '', coordinates: { lat: 0, lng: 0 } });
  const [locationForm, setLocationForm] = useState({ currentLocation: '', coordinates: { lat: 0, lng: 0 } });
  const [stats, setStats] = useState({
    orders: 0,
    revenue: 0,
    chartData: [],
    topItems: [],
    avgOrderValue: 0,
    completionRate: 0,
    allOrders: []
  });
  const [timeFrame, setTimeFrame] = useState('day'); // 'day', 'week', 'month'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  // Added states for filtering and pagination
  const [filter, setFilter] = useState({
    orderNumber: '',
    customer: '',
    phone: '',
    status: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleMenuChange = (e) => setMenuForm({ ...menuForm, [e.target.name]: e.target.name === 'price' || e.target.name === 'prepTime' ? parseFloat(e.target.value) || 0 : e.target.value });
  const handleScheduleChange = (e) => setScheduleForm({ ...scheduleForm, [e.target.name]: e.target.value });
  const handleLocationChange = (e) => setLocationForm({ ...locationForm, [e.target.name]: e.target.name.includes('coordinates') ? { ...locationForm.coordinates, [e.target.name.split('.')[1]]: parseFloat(e.target.value) || 0 } : e.target.value });

  // Function to group data by time frame
  const groupByTimeFrame = (data, timeFrame) => {
    const groupedData = {};

    data.forEach(order => {
      const date = new Date(order.createdAt);
      let key;

      if (timeFrame === 'day') {
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (timeFrame === 'week') {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        key = `Week ${weekNumber}, ${date.getFullYear()}`;
      } else if (timeFrame === 'month') {
        key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          total: 0,
          count: 0,
          date: key
        };
      }

      const orderTotal = typeof order.totalPrice === 'number' ? order.totalPrice : parseFloat(order.totalPrice || 0);
      groupedData[key].total += orderTotal;
      groupedData[key].count += 1;
    });

    return Object.values(groupedData);
  };

  // Function to get top selling items
  const getTopSellingItems = (orders) => {
    const itemCounts = {};

    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item.menuItem?.name) {
            if (!itemCounts[item.menuItem.name]) {
              itemCounts[item.menuItem.name] = {
                count: 0,
                revenue: 0,
                name: item.menuItem.name
              };
            }
            itemCounts[item.menuItem.name].count += item.qty || 1;
            const itemPrice = typeof item.menuItem.price === 'number' ? item.menuItem.price : parseFloat(item.menuItem.price || 0);
            itemCounts[item.menuItem.name].revenue += (item.qty || 1) * itemPrice;
          }
        });
      }
    });

    return Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/orders`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          params: { populate: 'items.menuItem' } // Populate menuItem to get name and price
        });

        const deliveredOrders = data.filter(order => order.status === 'Delivered');
        const allOrders = data;

        const revenue = deliveredOrders.reduce((acc, order) => acc + (typeof order.totalPrice === 'number' ? order.totalPrice : parseFloat(order.totalPrice || 0)), 0);

        const avgOrderValue = deliveredOrders.length > 0 ? revenue / deliveredOrders.length : 0;

        const completionRate = allOrders.length > 0 ? (deliveredOrders.length / allOrders.length) * 100 : 0;

        const chartData = groupByTimeFrame(deliveredOrders, timeFrame);

        const topItems = getTopSellingItems(deliveredOrders);

        setStats({
          orders: deliveredOrders.length,
          revenue,
          chartData,
          topItems,
          avgOrderValue,
          completionRate,
          allOrders: data
        });
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
  }, [user, notify, timeFrame]);

  useEffect(() => {
    if (user !== null) {
      if (!user.isAdmin) {
        navigate('/');
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [user, navigate]);

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

  // Export data to Excel
  const exportToExcel = () => {
    if (!stats.allOrders || stats.allOrders.length === 0) {
      notify('No data to export', 'warning');
      return;
    }

    try {
      // Apply the same filters as the table
      const filteredOrders = stats.allOrders.filter((order) => {
        const orderNumberMatch = order.orderNumber.toLowerCase().includes(filter.orderNumber.toLowerCase());
        const customerMatch = order.user?.name?.toLowerCase().includes(filter.customer.toLowerCase()) || !filter.customer;
        const phoneMatch = order.phone.toLowerCase().includes(filter.phone.toLowerCase());
        const statusMatch = filter.status ? order.status === filter.status : true;
        return orderNumberMatch && customerMatch && phoneMatch && statusMatch;
      });

      const worksheetData = filteredOrders.map(order => ({
        'Order Number': order.orderNumber,
        'Customer': order.user?.name || 'N/A',
        'Phone': order.phone || 'N/A',
        'Status': order.status,
        'Total Amount': typeof order.totalPrice === 'number' ? order.totalPrice : parseFloat(order.totalPrice || 0),
        'Date': new Date(order.createdAt).toLocaleDateString(),
        'Items': order.items ? order.items.map(item => `${item.menuItem?.name || 'Unknown'} (x${item.qty || 1})`).join(', ') : 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

      XLSX.writeFile(workbook, `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      notify('Data exported successfully!', 'success');
    } catch (err) {
      notify('Failed to export data', 'error');
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: timeFrame === 'day' ? 'Date' : timeFrame === 'week' ? 'Week' : 'Month',
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
        bodyColor: '#fff',
        callbacks: {
          label: function (context) {
            return `$${context.raw.toFixed(2)}`;
          }
        }
      }
    }
  };

  const ordersChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        title: {
          ...chartOptions.scales.y.title,
          text: 'Number of Orders'
        }
      }
    }
  };

  const revenueChartData = {
    labels: stats.chartData.map(item => item.date),
    datasets: [
      {
        label: 'Revenue ($)',
        data: stats.chartData.map(item => item.total),
        backgroundColor: 'rgba(249, 115, 22, 0.6)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }
    ]
  };

  const ordersChartData = {
    labels: stats.chartData.map(item => item.date),
    datasets: [
      {
        label: 'Number of Orders',
        data: stats.chartData.map(item => item.count),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }
    ]
  };

  const topItemsChartData = {
    labels: stats.topItems.map(item => item.name),
    datasets: [
      {
        label: 'Units Sold',
        data: stats.topItems.map(item => item.count),
        backgroundColor: [
          'rgba(249, 115, 22, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgba(249, 115, 22, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
        ],
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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return (
      <motion.div
        className="min-h-screen"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="section-container">
          <motion.div
            className="text-center py-12 card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm"
            variants={itemVariants}
          >
            <div className="text-6xl mb-4">🔐</div>
            <h3 className="text-2xl font-bold text-gray-300 mb-2">Access Denied</h3>
            <p className="text-gray-400 mb-6">This page is for admins only.</p>
            <motion.button
              className="bg-button-bg-primary text-white px-8 py-3 rounded-full font-semibold"
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
      className="min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className='section-container'>
        <motion.h2
          className="section-heading"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          Admin Dashboard
        </motion.h2>

        <motion.section className="mb-12" variants={itemVariants}>
          <div className="flex flex-col md:flex-row items-center justify-between mb-10 sm:mb-6">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <ChartBarIcon className="h-8 w-8 text-orange-400" />
              <h3 className="text-2xl font-bold text-white">Dashboard Analytics</h3>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2 bg-gray-700 rounded-full px-4 py-2 shadow-sm">
                <CalendarIcon className="h-5 w-5 text-orange-500" />
                <select
                  value={timeFrame}
                  onChange={(e) => setTimeFrame(e.target.value)}
                  className="bg-transparent border-none outline-none text-gray-300"
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
              </div>

              <motion.button
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full font-semibold text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportToExcel}
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                <span>Export Data</span>
              </motion.button>
            </div>
          </div>

          {loading ? (
            <div className="card-gradient-bg p-8 rounded-3xl shadow-lg backdrop-blur-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-28 bg-gray-700 rounded-2xl animate-pulse"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64 bg-gray-700 rounded-2xl animate-pulse"></div>
                <div className="h-64 bg-gray-700 rounded-2xl animate-pulse"></div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12 card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-300 mb-2">Unable to load stats</h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <motion.button
                className="bg-button-bg-primary text-white px-8 py-3 rounded-full font-semibold"
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(251, 146, 60, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
              >
                Try Again
              </motion.button>
            </div>
          ) : (
            <motion.div className="card-gradient-bg p-8 rounded-3xl shadow-lg backdrop-blur-sm border-1 border-gray-700" variants={itemVariants}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
                <div className="p-6 bg-gradient-to-r from-orange-900 to-orange-800 rounded-2xl shadow-md">
                  <p className="text-lg text-gray-300">Delivered Orders</p>
                  <p className="text-3xl font-bold text-orange-400">{stats.orders}</p>
                </div>

                <div className="p-6 bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl shadow-md">
                  <p className="text-lg text-gray-300">Total Revenue</p>
                  <p className="text-3xl font-bold text-blue-400">${stats.revenue.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-700 p-4 rounded-2xl shadow-md">
                  <h4 className="text-lg font-semibold text-gray-200 mb-4 text-center">Revenue Trend</h4>
                  <div className="h-64">
                    <Line data={revenueChartData} options={chartOptions} />
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-2xl shadow-md">
                  <h4 className="text-lg font-semibold text-gray-200 mb-4 text-center">Orders Trend</h4>
                  <div className="h-64">
                    <Line data={ordersChartData} options={ordersChartOptions} />
                  </div>
                </div>
              </div>

              {stats.topItems && stats.topItems.length > 0 && (
                <div className="bg-gray-700 p-4 rounded-2xl shadow-md mt-6">
                  <h4 className="text-lg font-semibold text-gray-200 mb-4 text-center">Top Selling Items</h4>
                  <div className="h-64">
                    <Pie data={topItemsChartData} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            color: '#4B5563',
                            font: {
                              size: 12
                            }
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              return `${context.label}: ${context.raw} units ($${stats.topItems[context.dataIndex].revenue.toFixed(2)})`;
                            }
                          }
                        }
                      }
                    }} />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.section>

        {/* Divider */}
        <div className="my-24">
          <div className="border-t border-gray-700"></div>
        </div>

        <OrdersTable
          orders={stats.allOrders || []}
          filter={filter}
          setFilter={setFilter}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
        />

        {/* Divider */}
        <div className="my-24">
          <div className="border-t border-gray-700"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.section variants={itemVariants}>
            <div className="card-gradient-bg p-8 rounded-3xl shadow-lg backdrop-blur-sm border-1 border-gray-700">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <PlusIcon className="h-8 w-8 text-orange-400" />
                <h3 className="text-2xl font-bold text-white">Add Menu Item</h3>
              </div>
              <form onSubmit={addMenuItem}>
                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-1">Name *</label>
                  <input
                    name="name"
                    value={menuForm.name}
                    onChange={handleMenuChange}
                    placeholder="Item Name"
                    className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-1">Description</label>
                  <textarea
                    name="description"
                    value={menuForm.description}
                    onChange={handleMenuChange}
                    placeholder="Item Description"
                    className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    rows="3"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-1">Price ($)*</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    value={menuForm.price}
                    onChange={handleMenuChange}
                    placeholder="Price"
                    className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-1">Category *</label>
                  <input
                    name="category"
                    value={menuForm.category}
                    onChange={handleMenuChange}
                    placeholder="Category"
                    className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-1">Image URL</label>
                  <input
                    name="image"
                    value={menuForm.image}
                    onChange={handleMenuChange}
                    placeholder="Image URL"
                    className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-300 font-semibold mb-1">Prep Time (min)</label>
                  <input
                    name="prepTime"
                    type="number"
                    value={menuForm.prepTime}
                    onChange={handleMenuChange}
                    placeholder="Prep Time"
                    className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    min="1"
                  />
                </div>
                <motion.button
                  type="submit"
                  className="w-full bg-button-bg-primary text-white py-3 rounded-full font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Add Item
                </motion.button>
              </form>
            </div>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="card-gradient-bg p-8 rounded-3xl shadow-lg backdrop-blur-sm border-1 border-gray-700">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <PlusIcon className="h-8 w-8 text-orange-400" />
                <h3 className="text-2xl font-bold text-white">Add Schedule</h3>
              </div>
              <form onSubmit={addSchedule}>
                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-1">Date *</label>
                  <input
                    name="date"
                    type="date"
                    value={scheduleForm.date}
                    onChange={handleScheduleChange}
                    className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-1">Location *</label>
                  <input
                    name="location"
                    value={scheduleForm.location}
                    onChange={handleScheduleChange}
                    placeholder="Location"
                    className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-1">State</label>
                  <input
                    name="state"
                    value={scheduleForm.state}
                    onChange={handleScheduleChange}
                    placeholder="State"
                    className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-1">Start Time *</label>
                  <input
                    name="startTime"
                    value={scheduleForm.startTime}
                    onChange={handleScheduleChange}
                    placeholder="Start Time (e.g., 10:00 AM)"
                    className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-1">End Time *</label>
                  <input
                    name="endTime"
                    value={scheduleForm.endTime}
                    onChange={handleScheduleChange}
                    placeholder="End Time (e.g., 6:00 PM)"
                    className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-1">Latitude</label>
                  <input
                    name="coordinates.lat"
                    type="number"
                    step="any"
                    value={scheduleForm.coordinates.lat}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, coordinates: { ...scheduleForm.coordinates, lat: parseFloat(e.target.value) || 0 } })}
                    placeholder="Latitude"
                    className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-300 font-semibold mb-1">Longitude</label>
                  <input
                    name="coordinates.lng"
                    type="number"
                    step="any"
                    value={scheduleForm.coordinates.lng}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, coordinates: { ...scheduleForm.coordinates, lng: parseFloat(e.target.value) || 0 } })}
                    placeholder="Longitude"
                    className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                  />
                </div>
                <motion.button
                  type="submit"
                  className="w-full bg-button-bg-primary text-white py-3 rounded-full font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Add Schedule
                </motion.button>
              </form>
            </div>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="card-gradient-bg p-8 rounded-3xl shadow-lg backdrop-blur-sm border-1 border-gray-700">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <PlusIcon className="h-8 w-8 text-orange-400" />
                <h3 className="text-2xl font-bold text-white">Update Current Location</h3>
              </div>
              <form onSubmit={updateLocation}>
                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-1">Current Location *</label>
                  <input
                    name="currentLocation"
                    value={locationForm.currentLocation}
                    onChange={handleLocationChange}
                    placeholder="Current Location"
                    className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-1">Latitude *</label>
                  <input
                    name="coordinates.lat"
                    type="number"
                    step="any"
                    value={locationForm.coordinates.lat}
                    onChange={(e) => setLocationForm({ ...locationForm, coordinates: { ...locationForm.coordinates, lat: parseFloat(e.target.value) || 0 } })}
                    placeholder="Latitude"
                    className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-300 font-semibold mb-1">Longitude *</label>
                  <input
                    name="coordinates.lng"
                    type="number"
                    step="any"
                    value={locationForm.coordinates.lng}
                    onChange={(e) => setLocationForm({ ...locationForm, coordinates: { ...locationForm.coordinates, lng: parseFloat(e.target.value) || 0 } })}
                    placeholder="Longitude"
                    className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                    required
                  />
                </div>
                <motion.button
                  type="submit"
                  className="w-full bg-button-bg-primary text-white py-3 rounded-full font-semibold"
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
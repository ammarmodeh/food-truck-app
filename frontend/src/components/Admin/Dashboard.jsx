import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AdminDrawer from './AdminDrawer';
import {
  ChartBarIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ClockIcon,
  CreditCardIcon,
  BanknotesIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline'; // Updated imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

// Register ChartJS components
// Note: BarController and LineController are explicitly registered to support mixed chart types
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// --- HELPER FUNCTIONS FOR STATISTICS ---

const getStartOfPeriod = (timeFrame) => {
  const now = new Date();
  if (timeFrame === 'today') {
    return new Date(now.setHours(0, 0, 0, 0));
  } else if (timeFrame === 'week') {
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff)).setHours(0, 0, 0, 0);
  } else if (timeFrame === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (timeFrame === 'year') {
    return new Date(now.getFullYear(), 0, 1);
  }
  return new Date(0); // All time
};

const filterOrdersByTime = (orders, timeFrame) => {
  const start = getStartOfPeriod(timeFrame);
  return orders.filter(o => new Date(o.createdAt) >= start);
};

const calculateMetrics = (orders) => {
  // Only count valid sales for revenue: Paid Card orders OR Delivered Cash orders
  const validSales = orders.filter(order => {
    const isPaidCard = order.paymentMethod === 'Card' && order.paymentStatus === 'Paid' && order.status !== 'Cancelled';
    const isDeliveredCash = order.paymentMethod === 'Cash' && order.status === 'Delivered';
    return isPaidCard || isDeliveredCash;
  });

  const totalRevenue = validSales.reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'Delivered').length;
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;
  const aov = validSales.length ? totalRevenue / validSales.length : 0;

  return {
    revenue: totalRevenue,
    count: totalOrders,
    completed: completedOrders,
    cancelled: cancelledOrders,
    aov: aov,
    validSalesCount: validSales.length
  };
};

// --- COMPONENTS ---

// KPI Card Component
const StatCard = ({ title, value, subValue, icon: Icon, colorClass, trend }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between"
  >
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
      {subValue && <p className={`text-xs font-semibold mt-2 ${colorClass}`}>{subValue}</p>}
      {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
    </div>
    <div className={`p-3 rounded-xl ${colorClass.replace('text-', 'bg-').replace('600', '50').replace('700', '50')}`}>
      <Icon className={`h-6 w-6 ${colorClass}`} />
    </div>
  </motion.div>
);

// OrdersTable Component (Refined)
const OrdersTable = ({ orders, filter, setFilter, currentPage, setCurrentPage, rowsPerPage, setRowsPerPage }) => {
  const filteredOrders = useMemo(() => orders.filter((order) => {
    const orderNumberMatch = (order.orderNumber || '').toLowerCase().includes(filter.orderNumber.toLowerCase());
    const customerMatch = (order.user?.name || '').toLowerCase().includes(filter.customer.toLowerCase()) || !filter.customer;
    const phoneMatch = (order.phone || '').toLowerCase().includes(filter.phone.toLowerCase());
    const statusMatch = filter.status ? order.status === filter.status : true;
    return orderNumberMatch && customerMatch && phoneMatch && statusMatch;
  }), [orders, filter]);

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleFilterChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
        <div className="flex gap-2">
          {/* Simple Status Filter Tabs for Table */}
          {['', 'Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'].map(status => (
            <button
              key={status}
              onClick={() => handleFilterChange({ target: { name: 'status', value: status } })}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${filter.status === status
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {status || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filter Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-gray-50/50">
        <input
          name="orderNumber"
          value={filter.orderNumber}
          onChange={handleFilterChange}
          placeholder="Filter by Order ID..."
          className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
        />
        <input
          name="customer"
          value={filter.customer}
          onChange={handleFilterChange}
          placeholder="Filter by Customer Name..."
          className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
        />
        <input
          name="phone"
          value={filter.phone}
          onChange={handleFilterChange}
          placeholder="Filter by Phone..."
          className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
            <tr>
              <th className="p-4">Order ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Items</th>
              <th className="p-4">Total</th>
              <th className="p-4">Status</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedOrders.length === 0 ? (
              <tr><td colSpan="7" className="p-8 text-center text-gray-400">No transactions found.</td></tr>
            ) : (
              paginatedOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">#{order.orderNumber || order._id.slice(-6).toUpperCase()}</td>
                  <td className="p-4">
                    <div>{order.user?.name || 'Guest'}</div>
                    <div className="text-xs text-gray-400">{order.phone}</div>
                  </td>
                  <td className="p-4 max-w-xs truncate" title={order.items?.map(i => i.menuItem?.name).join(', ')}>
                    {order.items?.length} items
                  </td>
                  <td className="p-4 font-bold text-gray-900">${(Number(order.totalPrice) || 0).toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        order.status === 'Pending' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                      }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      {order.paymentMethod === 'Card' ? <CreditCardIcon className="h-4 w-4 text-purple-500" /> : <BanknotesIcon className="h-4 w-4 text-green-500" />}
                      <span className="text-xs font-medium">{order.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50/50">
        <div className="text-xs text-gray-500">Page {currentPage} of {totalPages || 1}</div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD COMPONENT ---

const Dashboard = () => {
  const { notify } = useNotification();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // State
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFrame, setTimeFrame] = useState('month'); // default to month view

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter State for Table
  const [filter, setFilter] = useState({ orderNumber: '', customer: '', phone: '', status: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch Date
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.isAdmin) return;
      try {
        setLoading(true);
        // Fetch ALL orders for client-side processing to enable "Advanced Stats" without complex backend aggregation for now
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/orders?limit=1000`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setAllOrders(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data.');
        notify('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, notify]);

  // Derived Statistics based on TimeFrame
  const stats = useMemo(() => {
    const filtered = filterOrdersByTime(allOrders, timeFrame);
    const metrics = calculateMetrics(filtered);

    // 1. Chart Data: Revenue & Orders over time
    // Group by Date
    const groupedByDate = {};
    filtered.forEach(o => {
      const dateStr = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!groupedByDate[dateStr]) groupedByDate[dateStr] = { revenue: 0, orders: 0 };
      groupedByDate[dateStr].orders += 1;
      // Only add revenue if valid
      if ((o.paymentMethod === 'Card' && o.paymentStatus === 'Paid' && o.status !== 'Cancelled') ||
        (o.paymentMethod === 'Cash' && o.status === 'Delivered')) {
        groupedByDate[dateStr].revenue += (Number(o.totalPrice) || 0);
      }
    });
    const dates = Object.keys(groupedByDate).sort((a, b) => new Date(a) - new Date(b)); // simplistic sort, might need actual date objs

    // 2. Category Sales
    const categoryStats = {};
    filtered.forEach(o => {
      o.items?.forEach(item => {
        const cat = item.menuItem?.category || 'Uncategorized';
        if (!categoryStats[cat]) categoryStats[cat] = 0;
        categoryStats[cat] += (item.qty || 1);
      });
    });

    // 3. Payment Methods
    const paymentStats = { Card: 0, Cash: 0 };
    filtered.forEach(o => {
      if (o.paymentMethod) paymentStats[o.paymentMethod] = (paymentStats[o.paymentMethod] || 0) + 1;
    });

    // 4. Hourly Activity (Heatmap-ish)
    const hourlyStats = new Array(24).fill(0);
    filtered.forEach(o => {
      const hour = new Date(o.createdAt).getHours();
      hourlyStats[hour] += 1;
    });

    // 5. Top Products
    const productStats = {};
    filtered.forEach(o => {
      o.items?.forEach(item => {
        const name = item.menuItem?.name || 'Unknown Item';
        if (!productStats[name]) productStats[name] = { qty: 0, revenue: 0 };
        productStats[name].qty += (item.qty || 1);
        productStats[name].revenue += (item.qty || 1) * (item.menuItem?.price || 0);
      });
    });
    const topProducts = Object.entries(productStats)
      .sort(([, a], [, b]) => b.qty - a.qty)
      .slice(0, 5);

    return {
      metrics,
      charts: {
        dates,
        revenueSeries: dates.map(d => groupedByDate[d].revenue),
        orderSeries: dates.map(d => groupedByDate[d].orders),
        categories: Object.keys(categoryStats),
        categoryData: Object.values(categoryStats),
        paymentData: [paymentStats.Card, paymentStats.Cash],
        hourlyData: hourlyStats,
        topProducts
      }
    };

  }, [allOrders, timeFrame]);

  // Chart Options
  const mainChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', align: 'end' },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      y: { beginAtZero: true, display: true, position: 'left', title: { display: true, text: 'Revenue ($)' } },
      y1: { beginAtZero: true, display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Orders' } }
    }
  };

  if (!user?.isAdmin) {
    // ... (Keep existing access denied logic if preferred, or redirect)
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Access Denied</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
        <p className="text-gray-500 font-medium">Crunching the numbers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <AdminDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        allOrders={allOrders}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDrawerOpen(true)}
              className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 text-gray-600 shadow-sm transition-all"
            >
              <Squares2X2Icon className="h-6 w-6" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500 mt-1">Overview of your business performance</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm min-w-max">
              {['today', 'week', 'month', 'year', 'all'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeFrame(tf)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all whitespace-nowrap ${timeFrame === tf
                    ? 'bg-orange-50 text-orange-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={`$${stats.metrics.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subValue={`${stats.metrics.validSalesCount} paid orders`}
            colorClass="text-green-600"
            icon={CurrencyDollarIcon}
          />
          <StatCard
            title="Total Orders"
            value={stats.metrics.count}
            subValue={`${stats.metrics.completed} delivered`}
            colorClass="text-blue-600"
            icon={ShoppingBagIcon}
          />
          <StatCard
            title="Avg. Order Value"
            value={`$${stats.metrics.aov.toFixed(2)}`}
            subValue="Per paid order"
            colorClass="text-purple-600"
            icon={ChartBarIcon}
          />
          <StatCard
            title="Completion Rate"
            value={`${stats.metrics.count ? Math.round((stats.metrics.completed / stats.metrics.count) * 100) : 0}%`}
            subValue={`${stats.metrics.cancelled} cancelled`}
            colorClass="text-orange-600"
            icon={UserGroupIcon}
          />
        </div>

        {/* CHARTS SECTION 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend (Mixed Chart) - Takes up 2 columns */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue & Traffic Overview</h3>
            <div className="h-64 md:h-80">
              <Bar
                data={{
                  labels: stats.charts.dates,
                  datasets: [
                    {
                      type: 'line',
                      label: 'Revenue',
                      data: stats.charts.revenueSeries,
                      borderColor: '#ea580c', // Orange-600
                      backgroundColor: 'rgba(234, 88, 12, 0.1)',
                      borderWidth: 2,
                      fill: true,
                      tension: 0.4,
                      yAxisID: 'y'
                    },
                    {
                      type: 'bar',
                      label: 'Orders',
                      data: stats.charts.orderSeries,
                      backgroundColor: '#3b82f6', // Blue-500
                      borderRadius: 4,
                      yAxisID: 'y1'
                    }
                  ]
                }}
                options={mainChartOptions}
              />
            </div>
          </div>

          {/* Sales by Category & Payment Method - Stacked or Tabs? Let's do Doughnuts */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Category Breakdown</h3>
              <div className="h-40 flex justify-center">
                <Doughnut
                  data={{
                    labels: stats.charts.categories,
                    datasets: [{
                      data: stats.charts.categoryData,
                      backgroundColor: [
                        '#f97316', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899', '#f43f5e'
                      ],
                      borderWidth: 0
                    }]
                  }}
                  options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 10, usePointStyle: true } } } }}
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Payment Methods</h3>
              <div className="h-40 flex justify-center">
                <Pie
                  data={{
                    labels: ['Card', 'Cash'],
                    datasets: [{
                      data: stats.charts.paymentData,
                      backgroundColor: ['#a855f7', '#22c55e'],
                      borderWidth: 0
                    }]
                  }}
                  options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 10, usePointStyle: true } } } }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CHARTS SECTION 2: Hourly Activity & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <ClockIcon className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-bold text-gray-900">Hourly Busy Times</h3>
            </div>
            <div className="h-64">
              <Bar
                data={{
                  labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                  datasets: [{
                    label: 'Orders',
                    data: stats.charts.hourlyData,
                    backgroundColor: stats.charts.hourlyData.map(v => v > Math.max(...stats.charts.hourlyData) * 0.8 ? '#ea580c' : '#fdba74'), // Highlight peak hours
                    borderRadius: 4
                  }]
                }}
                options={{
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true }
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top Selling Items</h3>
            <div className="space-y-4">
              {stats.charts.topProducts.map(([name, metrics], index) => (
                <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-white border border-gray-200 text-gray-500'
                      }`}>
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{metrics.qty} sold</div>
                    <div className="text-xs text-gray-500">${metrics.revenue.toFixed(2)} rev</div>
                  </div>
                </div>
              ))}
              {stats.charts.topProducts.length === 0 && <p className="text-gray-500 text-center py-4">No sales data yet.</p>}
            </div>
          </div>
        </div>

        {/* EXPORT BUTTON */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              // Simple export logic reused/adapted
              const worksheet = XLSX.utils.json_to_sheet(allOrders.map(o => ({
                ID: o.orderNumber || o._id,
                Date: new Date(o.createdAt).toISOString(),
                Total: o.totalPrice,
                Status: o.status,
                Payment: o.paymentMethod
              })));
              const workbook = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
              XLSX.writeFile(workbook, "FoodTruck_Data.xlsx");
            }}
            className="flex items-center space-x-2 bg-green-600 text-white px-5 py-2.5 rounded-full font-bold shadow-md hover:bg-green-700 transition transform hover:-translate-y-0.5"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Export All Data</span>
          </button>
        </div>

        {/* TRANSACTIONS TABLE */}
        <OrdersTable
          orders={stats.metrics.validSalesCount >= 0 ? allOrders : []} // Pass all orders (or filtered if preferred)
          filter={filter}
          setFilter={setFilter}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
        />
      </div>
    </div>
  );
};

export default Dashboard;
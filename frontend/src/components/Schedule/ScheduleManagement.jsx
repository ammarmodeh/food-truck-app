import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid';

// Component for Schedule Management
const ScheduleManagement = () => {
  const { notify } = useNotification();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editSchedule, setEditSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    location: '',
    state: '',
    startTime: '',
    endTime: '',
    coordinates: { lat: 0, lng: 0 },
  });
  const schedulesPerPage = 10;

  // Fetch schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/schedules`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setSchedules(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch schedules. Please try again later.');
        notify('Failed to fetch schedules', 'error');
        setLoading(false);
      }
    };

    if (user && user.isAdmin) {
      fetchSchedules();
    } else {
      setLoading(false);
      navigate('/');
    }
  }, [user, navigate, notify]);

  // Handle form changes
  const handleScheduleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('coordinates')) {
      const [_, key] = name.split('.');
      setScheduleForm({
        ...scheduleForm,
        coordinates: { ...scheduleForm.coordinates, [key]: parseFloat(value) || 0 },
      });
    } else {
      setScheduleForm({ ...scheduleForm, [name]: value });
    }
  };

  // Add or update schedule
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleForm.date || !scheduleForm.location || !scheduleForm.startTime || !scheduleForm.endTime) {
      notify('Please fill in all required fields', 'error');
      return;
    }

    try {
      if (editSchedule) {
        // Update existing schedule
        const { data } = await axios.put(
          `${import.meta.env.VITE_BACKEND_API}/api/schedules/${editSchedule._id}`,
          scheduleForm,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setSchedules(schedules.map((s) => (s._id === editSchedule._id ? data : s)));
        notify('Schedule updated successfully!', 'success');
        setEditSchedule(null);
      } else {
        // Add new schedule
        const { data } = await axios.post(
          `${import.meta.env.VITE_BACKEND_API}/api/schedules`,
          scheduleForm,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setSchedules([...schedules, data]);
        notify('Schedule added successfully!', 'success');
      }
      setScheduleForm({ date: '', location: '', state: '', startTime: '', endTime: '', coordinates: { lat: 0, lng: 0 } });
    } catch (err) {
      notify(editSchedule ? 'Failed to update schedule' : 'Failed to add schedule', 'error');
    }
  };

  // Delete schedule
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_API}/api/schedules/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSchedules(schedules.filter((s) => s._id !== id));
      notify('Schedule deleted successfully!', 'success');
    } catch (err) {
      notify('Failed to delete schedule', 'error');
    }
  };

  // Start editing a schedule
  const startEdit = (schedule) => {
    setEditSchedule(schedule);
    setScheduleForm({
      date: new Date(schedule.date).toISOString().split('T')[0],
      location: schedule.location,
      state: schedule.state || '',
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      coordinates: schedule.coordinates || { lat: 0, lng: 0 },
    });
  };

  // Filter schedules by search query
  const filteredSchedules = schedules.filter(
    (schedule) =>
      schedule.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (schedule.state && schedule.state.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Paginate filtered schedules
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * schedulesPerPage,
    currentPage * schedulesPerPage
  );
  const totalPages = Math.ceil(filteredSchedules.length / schedulesPerPage);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  // Admin access check
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
          Schedule Management
        </motion.h2>


        {/* Schedule Form */}
        <motion.section className="mb-12" variants={itemVariants}>
          <div className="bg-white/80 dark:bg-gray-800/80 p-8 rounded-3xl shadow-lg backdrop-blur-sm border-1 border-gray-700">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <PlusIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                {editSchedule ? 'Edit Schedule' : 'Add Schedule'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
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
                  onChange={handleScheduleChange}
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
                  onChange={handleScheduleChange}
                  placeholder="Longitude"
                  className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                />
              </div>
              <div className="flex space-x-4">
                <motion.button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-full font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {editSchedule ? 'Update Schedule' : 'Add Schedule'}
                </motion.button>
                {editSchedule && (
                  <motion.button
                    type="button"
                    onClick={() => {
                      setEditSchedule(null);
                      setScheduleForm({ date: '', location: '', state: '', startTime: '', endTime: '', coordinates: { lat: 0, lng: 0 } });
                    }}
                    className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-full font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel Edit
                  </motion.button>
                )}
              </div>
            </form>
          </div>
        </motion.section>

        {/* Schedules List */}
        <motion.section className="mb-12" variants={itemVariants}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Schedules</h3>
            <input
              type="text"
              placeholder="Search by Location or State"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
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
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">Unable to load schedules</h3>
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
          ) : filteredSchedules.length === 0 ? (
            <motion.div
              className="text-center py-12 bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-lg backdrop-blur-sm border-1 border-gray-700"
              variants={itemVariants}
            >
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">No schedules found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No schedules match your search criteria.' : 'No schedules available.'}
              </p>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                  {paginatedSchedules.map((schedule) => (
                    <motion.div
                      key={schedule._id}
                      className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 border-1 border-gray-700"
                      variants={itemVariants}
                      initial="initial"
                      animate="visible"
                      exit={{ opacity: 0, y: 20 }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-orange-600 transition-colors">
                            {schedule.location}
                          </h3>
                          <div className="flex space-x-2">
                            <motion.button
                              onClick={() => startEdit(schedule)}
                              className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-900 dark:text-white"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <PencilIcon className="h-5 w-5" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDelete(schedule._id)}
                              className="p-2 bg-red-100 dark:bg-red-900 rounded-full text-red-600 dark:text-red-400"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </motion.button>
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                          <span className="font-semibold">Date:</span>{' '}
                          {new Date(schedule.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                          <span className="font-semibold">State:</span> {schedule.state || 'N/A'}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                          <span className="font-semibold">Time:</span> {schedule.startTime} - {schedule.endTime}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                          <span className="font-semibold">Coordinates:</span>{' '}
                          {schedule.coordinates ? `${schedule.coordinates.lat}, ${schedule.coordinates.lng}` : 'N/A'}
                        </p>
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
                      onClick={() => setCurrentPage(page)}
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

export default ScheduleManagement;
import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid';

const ScheduleManagement = () => {
  const { notify } = useNotification();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    searchQuery: '',
    state: '',
    startDate: '',
    endDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [editSchedule, setEditSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    location: '',
    state: '',
    startTime: '',
    endTime: '',
    coordinates: { lat: '', lng: '' } // Changed from { lat: 0, lng: 0 } to empty strings
  });
  const [formErrors, setFormErrors] = useState({});

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
        coordinates: { ...scheduleForm.coordinates, [key]: value === '' ? '' : parseFloat(value) || '' },
      });
    } else {
      setScheduleForm({ ...scheduleForm, [name]: value });
    }
    setFormErrors({ ...formErrors, [name]: '' });
  };

  // Validate and submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!scheduleForm.date) errors.date = 'Date is required';
    if (!scheduleForm.location) errors.location = 'Location is required';
    if (!scheduleForm.state) errors.state = 'State is required';
    if (!scheduleForm.startTime) errors.startTime = 'Start time is required';
    if (!scheduleForm.endTime) errors.endTime = 'End time is required';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      notify('Please fill in all required fields', 'error');
      return;
    }
    try {
      // Prepare data to send, omitting coordinates if both lat and lng are empty
      const submitData = { ...scheduleForm };
      if (submitData.coordinates.lat === '' && submitData.coordinates.lng === '') {
        delete submitData.coordinates;
      }
      if (editSchedule) {
        const { data } = await axios.put(
          `${import.meta.env.VITE_BACKEND_API}/api/schedules/${editSchedule._id}`,
          submitData,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setSchedules(schedules.map((s) => (s._id === editSchedule._id ? data : s)));
        notify('Schedule updated successfully!', 'success');
        setEditSchedule(null);
      } else {
        const { data } = await axios.post(
          `${import.meta.env.VITE_BACKEND_API}/api/schedules`,
          submitData,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setSchedules([...schedules, data]);
        notify('Schedule added successfully!', 'success');
      }
      setScheduleForm({ date: '', location: '', state: '', startTime: '', endTime: '', coordinates: { lat: '', lng: '' } });
      setFormErrors({});
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
      coordinates: schedule.coordinates || { lat: '', lng: '' }, // Ensure empty strings for coordinates if not present
    });
    setFormErrors({});
  };

  // Filter schedules
  const filteredSchedules = schedules.filter((schedule) => {
    const searchMatch =
      schedule.location.toLowerCase().includes(filter.searchQuery.toLowerCase()) ||
      (schedule.state && schedule.state.toLowerCase().includes(filter.searchQuery.toLowerCase()));
    const stateMatch = filter.state ? schedule.state === filter.state : true;
    const dateMatch =
      (!filter.startDate || new Date(schedule.date) >= new Date(filter.startDate)) &&
      (!filter.endDate || new Date(schedule.date) <= new Date(filter.endDate));
    return searchMatch && stateMatch && dateMatch;
  });

  // Paginate filtered schedules
  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Dynamic grid layout
  const getGridClasses = (itemCount) => {
    if (itemCount === 1) return 'grid grid-cols-1 mx-auto';
    if (itemCount === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-8 mx-auto';
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto';
  };

  // Unique states for dropdown
  const uniqueStates = [...new Set(schedules.map(sch => sch.state).filter(Boolean))].sort();

  // Clear filters
  const clearFilters = () => {
    setFilter({ searchQuery: '', state: '', startDate: '', endDate: '' });
    setCurrentPage(1);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  // Calculate date threshold (current date - 1 day)
  const currentDate = new Date('2025-09-06T21:51:00+03:00'); // Updated to match current date and time
  const thresholdDate = new Date(currentDate);
  thresholdDate.setDate(currentDate.getDate() - 1);

  // Function to check if a schedule's date is before the threshold
  const isPastDate = (scheduleDate) => {
    return new Date(scheduleDate) < thresholdDate;
  };

  // Admin access check
  if (!user || !user.isAdmin) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-6 py-12">
          <motion.div
            className="text-center py-12 card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700"
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
          Schedule Management
        </motion.h2>
        {/* Schedule Form */}
        <motion.section className="mb-12" variants={itemVariants}>
          <div className="card-gradient-bg p-8 rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <PlusIcon className="h-8 w-8 text-orange-400" />
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                {editSchedule ? 'Edit Schedule' : 'Add Schedule'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-gray-300 font-semibold mb-1">Date *</label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={scheduleForm.date}
                    onChange={handleScheduleChange}
                    className={`w-full p-3 rounded-full bg-gray-700 text-white border ${formErrors.date ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300`}
                    required
                  />
                  {formErrors.date && <p className="text-red-400 text-sm mt-1">{formErrors.date}</p>}
                </div>
                <div>
                  <label htmlFor="location" className="block text-gray-300 font-semibold mb-1">Location *</label>
                  <input
                    id="location"
                    name="location"
                    value={scheduleForm.location}
                    onChange={handleScheduleChange}
                    placeholder="Location"
                    className={`w-full p-3 rounded-full bg-gray-700 text-white border ${formErrors.location ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300`}
                    required
                  />
                  {formErrors.location && <p className="text-red-400 text-sm mt-1">{formErrors.location}</p>}
                </div>
                <div>
                  <label htmlFor="state" className="block text-gray-300 font-semibold mb-1">State *</label>
                  <input
                    id="state"
                    name="state"
                    value={scheduleForm.state}
                    onChange={handleScheduleChange}
                    placeholder="State"
                    className={`w-full p-3 rounded-full bg-gray-700 text-white border ${formErrors.state ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300`}
                    required
                  />
                  {formErrors.state && <p className="text-red-400 text-sm mt-1">{formErrors.state}</p>}
                </div>
                <div>
                  <label htmlFor="startTime" className="block text-gray-300 font-semibold mb-1">Start Time *</label>
                  <input
                    id="startTime"
                    name="startTime"
                    value={scheduleForm.startTime}
                    onChange={handleScheduleChange}
                    placeholder="Start Time (e.g., 10:00 AM)"
                    className={`w-full p-3 rounded-full bg-gray-700 text-white border ${formErrors.startTime ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300`}
                    required
                  />
                  {formErrors.startTime && <p className="text-red-400 text-sm mt-1">{formErrors.startTime}</p>}
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-gray-300 font-semibold mb-1">End Time *</label>
                  <input
                    id="endTime"
                    name="endTime"
                    value={scheduleForm.endTime}
                    onChange={handleScheduleChange}
                    placeholder="End Time (e.g., 6:00 PM)"
                    className={`w-full p-3 rounded-full bg-gray-700 text-white border ${formErrors.endTime ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300`}
                    required
                  />
                  {formErrors.endTime && <p className="text-red-400 text-sm mt-1">{formErrors.endTime}</p>}
                </div>
                <div>
                  <label htmlFor="coordinates.lat" className="block text-gray-300 font-semibold mb-1">Latitude</label>
                  <input
                    id="coordinates.lat"
                    name="coordinates.lat"
                    type="number"
                    step="any"
                    value={scheduleForm.coordinates.lat}
                    onChange={handleScheduleChange}
                    placeholder="Latitude"
                    className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                  />
                </div>
                <div>
                  <label htmlFor="coordinates.lng" className="block text-gray-300 font-semibold mb-1">Longitude</label>
                  <input
                    id="coordinates.lng"
                    name="coordinates.lng"
                    type="number"
                    step="any"
                    value={scheduleForm.coordinates.lng}
                    onChange={handleScheduleChange}
                    placeholder="Longitude"
                    className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                  />
                </div>
              </div>
              <div className="flex space-x-4 mt-6">
                <motion.button
                  type="submit"
                  className="flex-1 bg-button-bg-primary text-white py-3 rounded-full font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {editSchedule ? 'Update Schedule' : 'Add Schedule'}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                    setEditSchedule(null);
                    setScheduleForm({ date: '', location: '', state: '', startTime: '', endTime: '', coordinates: { lat: '', lng: '' } });
                    setFormErrors({});
                  }}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-full font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {editSchedule ? 'Cancel Edit' : 'Clear Form'}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.section>
        {/* Divider */}
        <div className="my-24">
          <div className="border-t border-gray-700"></div>
        </div>
        {/* Filters */}
        <motion.section className="mb-12" variants={itemVariants}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 card-gradient-bg p-6 rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700">
            <div>
              <label htmlFor="searchQuery" className="block text-gray-300 font-semibold mb-1">Search</label>
              <input
                id="searchQuery"
                type="text"
                placeholder="Search by Location or State"
                value={filter.searchQuery}
                onChange={(e) => {
                  setFilter({ ...filter, searchQuery: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-gray-300 font-semibold mb-1">State</label>
              <select
                id="state"
                value={filter.state}
                onChange={(e) => {
                  setFilter({ ...filter, state: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
              >
                <option value="">All States</option>
                {uniqueStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="block text-gray-300 font-semibold mb-1">Start Date</label>
              <input
                id="startDate"
                type="date"
                value={filter.startDate}
                onChange={(e) => {
                  setFilter({ ...filter, startDate: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-gray-300 font-semibold mb-1">End Date</label>
              <input
                id="endDate"
                type="date"
                value={filter.endDate}
                onChange={(e) => {
                  setFilter({ ...filter, endDate: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
              />
            </div>
          </div>
          <div className="flex justify-end mb-6">
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-gray-700 text-white rounded-full font-semibold hover:bg-gray-600 transition duration-300"
            >
              Clear Filters
            </button>
          </div>
        </motion.section>
        {/* Schedules List */}
        <motion.section className="mb-12" variants={itemVariants}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Showing {paginatedSchedules.length} of {filteredSchedules.length} schedules</h3>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto">
              {[1, 2, 3].map((_, index) => (
                <motion.div
                  key={index}
                  className="card-gradient-bg p-6 rounded-3xl shadow-lg animate-pulse border border-gray-700"
                  variants={itemVariants}
                >
                  <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-700 rounded w-full mb-3"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </motion.div>
              ))}
            </div>
          ) : error ? (
            <motion.div
              className="text-center py-12 card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700 mx-auto"
              variants={itemVariants}
            >
              <div className="text-6xl mb-4">🗓️</div>
              <h3 className="text-2xl font-bold text-gray-300 mb-2">Unable to load schedules</h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <motion.button
                className="bg-button-bg-primary text-white px-8 py-3 rounded-full font-semibold"
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(251, 146, 60, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
              >
                Try Again
              </motion.button>
            </motion.div>
          ) : filteredSchedules.length === 0 ? (
            <motion.div
              className="text-center py-12 card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700 mx-auto"
              variants={itemVariants}
            >
              <div className="text-6xl mb-4">🗓️</div>
              <h3 className="text-2xl font-bold text-gray-300 mb-2">No schedules found</h3>
              <p className="text-gray-400">
                {filter.searchQuery || filter.state || filter.startDate || filter.endDate ? 'No schedules match your filters.' : 'No schedules available.'}
              </p>
            </motion.div>
          ) : (
            <>
              <motion.div
                className={getGridClasses(paginatedSchedules.length)}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence>
                  {paginatedSchedules.map((schedule) => (
                    <motion.div
                      key={schedule._id}
                      className="relative card-gradient-bg rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 border border-gray-700 w-full"
                      variants={itemVariants}
                      initial="initial"
                      animate="visible"
                      exit={{ opacity: 0, y: 20 }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-white group-hover:text-orange-600 transition-colors">
                            {schedule.location}
                          </h3>
                          <div className="flex space-x-2">
                            <motion.button
                              onClick={() => startEdit(schedule)}
                              className="p-2 bg-gray-700 rounded-full text-white"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <PencilIcon className="h-5 w-5" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDelete(schedule._id)}
                              className="p-2 bg-red-900 rounded-full text-red-400"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </motion.button>
                          </div>
                        </div>
                        <p className={`text-gray-300 mb-2 ${isPastDate(schedule.date) ? 'text-red-500' : ''}`}>
                          <span className="font-semibold">Date:</span>{' '}
                          {new Date(schedule.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {isPastDate(schedule.date) && (
                            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-red-500" title="This schedule is outdated"></span>
                          )}
                        </p>
                        <p className="text-gray-300 mb-2">
                          <span className="font-semibold">State:</span> {schedule.state || 'N/A'}
                        </p>
                        <p className="text-gray-300 mb-2">
                          <span className="font-semibold">Time:</span> {schedule.startTime} - {schedule.endTime}
                        </p>
                        <p className="text-gray-300 mb-2">
                          <span className="font-semibold">Coordinates:</span>{' '}
                          {schedule.coordinates && schedule.coordinates.lat && schedule.coordinates.lng ? `${schedule.coordinates.lat}, ${schedule.coordinates.lng}` : 'N/A'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
              {/* Pagination */}
              <motion.div
                className="flex flex-col sm:flex-row items-center justify-between mt-8"
                variants={itemVariants}
              >
                <div className="flex items-center space-x-2 mb-4 sm:mb-0">
                  <label className="text-gray-300">Schedules per page:</label>
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
        </motion.section>
      </div>
    </motion.div>
  );
};

export default ScheduleManagement;
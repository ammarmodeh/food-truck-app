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
  const [itemsPerPage, setItemsPerPage] = useState(9); // Increased for better grid view
  const [editSchedule, setEditSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    location: '',
    state: '',
    startTime: '',
    endTime: '',
    coordinates: { lat: '', lng: '' }
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
      coordinates: schedule.coordinates || { lat: '', lng: '' },
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
    if (itemCount === 1) return 'grid grid-cols-1 mx-auto max-w-lg';
    if (itemCount === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-6 mx-auto max-w-4xl';
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
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
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  // Calculate date threshold (current date - 1 day)
  const currentDate = new Date();
  const thresholdDate = new Date(currentDate);
  thresholdDate.setDate(currentDate.getDate() - 1);

  // Function to check if a schedule's date is before the threshold
  const isPastDate = (scheduleDate) => {
    return new Date(scheduleDate) < thresholdDate;
  };

  // Admin access check
  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-red-100 max-w-sm">
          <div className="text-4xl mb-4">🔐</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500 mb-6">This page is for admins only.</p>
          <button
            className="bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 transition"
            onClick={() => navigate('/login')}
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div variants={itemVariants}>
          <h2 className="text-3xl font-bold text-gray-900 border-b border-gray-200 pb-4">
            Schedule Management
          </h2>
        </motion.div>

        {/* Schedule Form */}
        <motion.section variants={itemVariants}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-orange-100 p-2 rounded-lg">
                <PlusIcon className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {editSchedule ? 'Edit Schedule' : 'Add New Schedule'}
              </h3>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={scheduleForm.date}
                    onChange={handleScheduleChange}
                    className={`w-full px-4 py-2 rounded-lg border ${formErrors.date ? 'border-red-500' : 'border-gray-200'} bg-gray-50 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all`}
                    required
                  />
                  {formErrors.date && <p className="text-red-500 text-xs mt-1">{formErrors.date}</p>}
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    id="location"
                    name="location"
                    value={scheduleForm.location}
                    onChange={handleScheduleChange}
                    placeholder="e.g. Central Park"
                    className={`w-full px-4 py-2 rounded-lg border ${formErrors.location ? 'border-red-500' : 'border-gray-200'} bg-gray-50 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all`}
                    required
                  />
                  {formErrors.location && <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    id="state"
                    name="state"
                    value={scheduleForm.state}
                    onChange={handleScheduleChange}
                    placeholder="e.g. NY"
                    className={`w-full px-4 py-2 rounded-lg border ${formErrors.state ? 'border-red-500' : 'border-gray-200'} bg-gray-50 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all`}
                    required
                  />
                  {formErrors.state && <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>}
                </div>

                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input
                    id="startTime"
                    name="startTime"
                    value={scheduleForm.startTime}
                    onChange={handleScheduleChange}
                    placeholder="e.g. 10:00 AM"
                    className={`w-full px-4 py-2 rounded-lg border ${formErrors.startTime ? 'border-red-500' : 'border-gray-200'} bg-gray-50 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all`}
                    required
                  />
                  {formErrors.startTime && <p className="text-red-500 text-xs mt-1">{formErrors.startTime}</p>}
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <input
                    id="endTime"
                    name="endTime"
                    value={scheduleForm.endTime}
                    onChange={handleScheduleChange}
                    placeholder="e.g. 6:00 PM"
                    className={`w-full px-4 py-2 rounded-lg border ${formErrors.endTime ? 'border-red-500' : 'border-gray-200'} bg-gray-50 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all`}
                    required
                  />
                  {formErrors.endTime && <p className="text-red-500 text-xs mt-1">{formErrors.endTime}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="coordinates.lat" className="block text-sm font-medium text-gray-700 mb-1">Lat</label>
                    <input
                      id="coordinates.lat"
                      name="coordinates.lat"
                      type="number"
                      step="any"
                      value={scheduleForm.coordinates.lat}
                      onChange={handleScheduleChange}
                      placeholder="0.00"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="coordinates.lng" className="block text-sm font-medium text-gray-700 mb-1">Lng</label>
                    <input
                      id="coordinates.lng"
                      name="coordinates.lng"
                      type="number"
                      step="any"
                      value={scheduleForm.coordinates.lng}
                      onChange={handleScheduleChange}
                      placeholder="0.00"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditSchedule(null);
                    setScheduleForm({ date: '', location: '', state: '', startTime: '', endTime: '', coordinates: { lat: '', lng: '' } });
                    setFormErrors({});
                  }}
                  className="px-6 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                >
                  {editSchedule ? 'Cancel' : 'Clear'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-orange-600 text-white font-bold hover:bg-orange-700 shadow-md hover:shadow-lg transition-all transform active:scale-95"
                >
                  {editSchedule ? 'Update Schedule' : 'Add Schedule'}
                </button>
              </div>
            </form>
          </div>
        </motion.section>

        {/* Filters */}
        <motion.section variants={itemVariants}>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Filter Schedules</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search location..."
                value={filter.searchQuery}
                onChange={(e) => {
                  setFilter({ ...filter, searchQuery: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              />

              <select
                value={filter.state}
                onChange={(e) => {
                  setFilter({ ...filter, state: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="">All States</option>
                {uniqueStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>

              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => {
                  setFilter({ ...filter, startDate: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              />

              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => {
                  setFilter({ ...filter, endDate: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={clearFilters}
                className="text-sm text-orange-600 font-medium hover:text-orange-700 hover:underline"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </motion.section>

        {/* Schedules List */}
        <motion.section variants={itemVariants}>
          <div className="flex justify-between items-end mb-6">
            <p className="text-gray-500 text-sm">
              Showing <span className="font-bold text-gray-900">{paginatedSchedules.length}</span> of {filteredSchedules.length} schedules
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-red-100">
              <p className="text-red-500 font-medium">{error}</p>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
              <div className="text-4xl opacity-20 mb-3">📅</div>
              <p className="text-gray-500 text-lg">No schedules found matching your filters.</p>
            </div>
          ) : (
            <>
              <div className={getGridClasses(paginatedSchedules.length)}>
                <AnimatePresence mode='popLayout'>
                  {paginatedSchedules.map((schedule) => (
                    <motion.div
                      key={schedule._id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 p-5 transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${isPastDate(schedule.date) ? 'bg-gray-400' : 'bg-orange-500'}`}>
                              {schedule.state || 'N/A'}
                            </span>
                            {isPastDate(schedule.date) && (
                              <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">Expired</span>
                            )}
                          </div>
                          <h3 className="font-bold text-gray-900 text-lg leading-tight">{schedule.location}</h3>
                        </div>
                        <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(schedule)}
                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(schedule._id)}
                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{new Date(schedule.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="text-gray-400 w-4 mr-2 text-center text-xs">🕒</span>
                          <span>{schedule.startTime} - {schedule.endTime}</span>
                        </div>
                        {schedule.coordinates && (schedule.coordinates.lat || schedule.coordinates.lng) && (
                          <div className="flex items-center text-sm text-gray-400 font-mono pt-2 border-t border-gray-50 mt-2">
                            <span className="text-xs">📍 {schedule.coordinates.lat}, {schedule.coordinates.lng}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-10 pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4 sm:mb-0">
                    <span>Show</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(parseInt(e.target.value, 10));
                        setCurrentPage(1);
                      }}
                      className="bg-white border border-gray-200 rounded-md py-1 px-2 focus:ring-1 focus:ring-orange-500 outline-none"
                    >
                      <option value="6">6</option>
                      <option value="9">9</option>
                      <option value="12">12</option>
                      <option value="24">24</option>
                    </select>
                    <span>per page</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      &lt;
                    </button>
                    <div className="flex items-center space-x-1">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      &gt;
                    </button>
                  </div>
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
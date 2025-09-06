import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, PencilIcon, TrashIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/solid';

const LocationManagement = () => {
  const { notify } = useNotification();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedulesError, setSchedulesError] = useState(null);
  const [editLocation, setEditLocation] = useState(null);
  const [locationForm, setLocationForm] = useState({
    date: '',
    location: '', // Changed from currentLocation to location to match Schedule schema
    state: '',
    startTime: '',
    endTime: '',
    coordinates: { lat: '', lng: '' }
  });
  const [formErrors, setFormErrors] = useState({});
  const [locationUpdated, setLocationUpdated] = useState(false);

  // Fetch single location
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/locations/current`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setLocation(data);
        setLoading(false);
      } catch (err) {
        setError('No current location found.');
        setLoading(false);
      }
    };
    if (user && user.isAdmin) {
      fetchLocation();
    } else {
      setLoading(false);
      navigate('/');
    }
  }, [user, navigate, locationUpdated]);

  // Fetch schedules for import
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/schedules`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setSchedules(data);
        setSchedulesLoading(false);
      } catch (err) {
        setSchedulesError('Failed to fetch schedules. Please try again later.');
        notify('Failed to fetch schedules', 'error');
        setSchedulesLoading(false);
      }
    };
    if (user && user.isAdmin) {
      fetchSchedules();
    }
  }, [user, notify]);

  // Handle form changes
  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('coordinates')) {
      const [_, key] = name.split('.');
      setLocationForm({
        ...locationForm,
        coordinates: { ...locationForm.coordinates, [key]: value === '' ? '' : parseFloat(value) || '' },
      });
    } else {
      setLocationForm({ ...locationForm, [name]: value });
    }
    setFormErrors({ ...formErrors, [name]: '' });
  };

  // Validate and submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!locationForm.date) errors.date = 'Date is required';
    if (!locationForm.location) errors.location = 'Location is required';
    if (!locationForm.state) errors.state = 'State is required';
    if (!locationForm.startTime) errors.startTime = 'Start time is required';
    if (!locationForm.endTime) errors.endTime = 'End time is required';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      notify('Please fill in all required fields', 'error');
      return;
    }
    try {
      if (editLocation) {
        const { data } = await axios.put(
          `${import.meta.env.VITE_BACKEND_API}/api/locations/${editLocation._id}`,
          locationForm,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setLocation(data);
        notify('Location updated successfully!', 'success');
        setEditLocation(null);
      } else {
        const { data } = await axios.post(
          `${import.meta.env.VITE_BACKEND_API}/api/locations`,
          locationForm,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setLocation(data); // This updates the state with the new location
        notify('Location added successfully!', 'success');
      }
      setLocationForm({ date: '', location: '', state: '', startTime: '', endTime: '', coordinates: { lat: '', lng: '' } });
      setFormErrors({});
    } catch (err) {
      const errorMsg = err.response?.data?.msg || err.response?.data?.error || 'Unknown error';

      if (errorMsg.includes('already exists')) {
        // If a location already exists, fetch the current location to update UI
        try {
          const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/locations/current`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          setLocation(data); // Update with the existing location
        } catch (fetchErr) {
          console.error('Failed to fetch current location:', fetchErr);
        }
      }

      notify(editLocation ? 'Failed to update location' : errorMsg, 'error');
    }
  };

  // Delete location
  const handleDelete = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_API}/api/locations/${location._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setLocation(null);
      notify('Location deleted successfully!', 'success');
    } catch (err) {
      notify('Failed to delete location', 'error');
    }
  };

  // Start editing a location
  const startEdit = (loc) => {
    setEditLocation(loc);
    setLocationForm({
      date: new Date(loc.date).toISOString().split('T')[0],
      location: loc.currentLocation, // Map currentLocation to location
      state: loc.state || '',
      startTime: loc.startTime,
      endTime: loc.endTime,
      coordinates: loc.coordinates || { lat: '', lng: '' },
    });
    setFormErrors({});
  };

  // Set as current from schedule
  const handleSetAsCurrent = async (schedule) => {
    if (!schedule.date || !schedule.location || !schedule.state || !schedule.startTime || !schedule.endTime) {
      notify('Selected schedule is missing required fields', 'error');
      return;
    }
    const locationData = {
      date: new Date(schedule.date).toISOString().split('T')[0],
      location: schedule.location,
      state: schedule.state,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      coordinates: schedule.coordinates || { lat: '', lng: '' },
    };
    try {
      if (location) {
        const { data } = await axios.put(
          `${import.meta.env.VITE_BACKEND_API}/api/locations/${location._id}`,
          locationData,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setLocation(data);
        notify('Current location updated from schedule!', 'success');
      } else {
        const { data } = await axios.post(
          `${import.meta.env.VITE_BACKEND_API}/api/locations`,
          locationData,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setLocation(data);
        notify('Current location set from schedule!', 'success');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.msg || 'Unknown error';
      notify(`Failed to set current location: ${errorMsg}`, 'error');
    }
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
  const currentDate = new Date('2025-09-06');
  const thresholdDate = new Date(currentDate);
  thresholdDate.setDate(currentDate.getDate() - 1);

  // Function to check if a location's date is before the threshold
  const isPastDate = (locationDate) => {
    return new Date(locationDate) < thresholdDate;
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
        <div className="container mx-auto px-6 py-12 ">
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
          Location Management
        </motion.h2>
        {/* Location Form */}
        <motion.section className="mb-12" variants={itemVariants}>
          <div className="card-gradient-bg p-8 rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <PlusIcon className="h-8 w-8 text-orange-400" />
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                {editLocation ? 'Edit Current Location' : 'Set Current Location'}
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
                    value={locationForm.date}
                    onChange={handleLocationChange}
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
                    value={locationForm.location}
                    onChange={handleLocationChange}
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
                    value={locationForm.state}
                    onChange={handleLocationChange}
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
                    value={locationForm.startTime}
                    onChange={handleLocationChange}
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
                    value={locationForm.endTime}
                    onChange={handleLocationChange}
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
                    value={locationForm.coordinates.lat}
                    onChange={handleLocationChange}
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
                    value={locationForm.coordinates.lng}
                    onChange={handleLocationChange}
                    placeholder="Longitude"
                    className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                  />
                </div>
              </div>
              <div className="flex space-x-4 mt-6">
                <motion.button
                  type="submit"
                  className={`flex-1 bg-button-bg-primary text-white py-3 rounded-full font-semibold ${editLocation ? '' : location ? 'opacity-50 cursor-not-allowed' : ''}`}
                  whileHover={{ scale: editLocation ? 1.05 : location ? 1 : 1.05 }}
                  whileTap={{ scale: editLocation ? 0.95 : location ? 1 : 0.95 }}
                  disabled={!editLocation && location} // Only disable when not editing AND location exists
                >
                  {editLocation ? 'Update Location' : 'Set Location'}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                    setEditLocation(null);
                    setLocationForm({ date: '', location: '', state: '', startTime: '', endTime: '', coordinates: { lat: '', lng: '' } });
                    setFormErrors({});
                  }}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-full font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {editLocation ? 'Cancel Edit' : 'Clear Form'}
                </motion.button>
              </div>
              {location && !editLocation && (
                <p className="text-gray-400 text-sm mt-4 text-center">
                  A current location already exists. Edit or delete it to set a new one.
                </p>
              )}
            </form>
          </div>
        </motion.section>
        {/* Divider */}
        <div className="my-24">
          <div className="border-t border-gray-700"></div>
        </div>
        {/* Current Location Display */}
        <motion.section className="mb-12" variants={itemVariants}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Current Location</h3>
          </div>
          {loading ? (
            <motion.div
              className="card-gradient-bg p-6 rounded-3xl shadow-lg animate-pulse border border-gray-700"
              variants={itemVariants}
            >
              <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-full mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </motion.div>
          ) : error || !location ? (
            <motion.div
              className="text-center py-12 card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700 mx-auto"
              variants={itemVariants}
            >
              <div className="text-6xl mb-4">🗓️</div>
              <h3 className="text-2xl font-bold text-gray-300 mb-2">No current location</h3>
              <p className="text-gray-400 mb-6">Set a new location using the form above.</p>
            </motion.div>
          ) : (
            <motion.div
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
                    {location.currentLocation}
                  </h3>
                  <div className="flex space-x-2">
                    <motion.button
                      onClick={() => startEdit(location)}
                      className="p-2 bg-gray-700 rounded-full text-white"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </motion.button>
                    <motion.button
                      onClick={handleDelete}
                      className="p-2 bg-red-900 rounded-full text-red-400"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>
                <p className={`text-gray-300 mb-2 ${isPastDate(location.date) ? 'text-red-500' : ''}`}>
                  <span className="font-semibold">Date:</span>{' '}
                  {new Date(location.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {isPastDate(location.date) && (
                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-red-500" title="This location is outdated"></span>
                  )}
                </p>
                <p className="text-gray-300 mb-2">
                  <span className="font-semibold">State:</span> {location.state || 'N/A'}
                </p>
                <p className="text-gray-300 mb-2">
                  <span className="font-semibold">Time:</span> {location.startTime} - {location.endTime}
                </p>
                <p className="text-gray-300 mb-2">
                  <span className="font-semibold">Coordinates:</span>{' '}
                  {location.coordinates ? `${location.coordinates.lat}, ${location.coordinates.lng}` : 'N/A'}
                </p>
              </div>
            </motion.div>
          )}
        </motion.section>
        {/* Divider */}
        <div className="my-24">
          <div className="border-t border-gray-700"></div>
        </div>
        {/* Import from Schedules */}
        <motion.section className="mb-12" variants={itemVariants}>
          <motion.h2
            className="section-heading"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            Import from Schedules
          </motion.h2>
          {schedulesLoading ? (
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
          ) : schedulesError ? (
            <motion.div
              className="text-center py-12 card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700 mx-auto"
              variants={itemVariants}
            >
              <div className="text-6xl mb-4">🗓️</div>
              <h3 className="text-2xl font-bold text-gray-300 mb-2">Unable to load schedules</h3>
              <p className="text-gray-400 mb-6">{schedulesError}</p>
              <motion.button
                className="bg-button-bg-primary text-white px-8 py-3 rounded-full font-semibold"
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(251, 146, 60, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
              >
                Try Again
              </motion.button>
            </motion.div>
          ) : schedules.length === 0 ? (
            <motion.div
              className="text-center py-12 card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700 mx-auto"
              variants={itemVariants}
            >
              <div className="text-6xl mb-4">🗓️</div>
              <h3 className="text-2xl font-bold text-gray-300 mb-2">No schedules available</h3>
              <p className="text-gray-400">No schedules to import from.</p>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {schedules.map((schedule) => (
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
                            onClick={() => handleSetAsCurrent(schedule)}
                            className="p-2 bg-blue-900 rounded-full text-blue-400"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <CheckIcon className="h-5 w-5" />
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
                        {schedule.coordinates ? `${schedule.coordinates.lat}, ${schedule.coordinates.lng}` : 'N/A'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
};

export default LocationManagement;
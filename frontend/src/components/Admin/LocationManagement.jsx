import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PencilIcon, TrashIcon, PlusIcon, CheckIcon, MapPinIcon } from '@heroicons/react/24/solid';

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
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  // Calculate date threshold (current date - 1 day)
  const currentDate = new Date();
  const thresholdDate = new Date(currentDate);
  thresholdDate.setDate(currentDate.getDate() - 1);

  // Function to check if a location's date is before the threshold
  const isPastDate = (locationDate) => {
    return new Date(locationDate) < thresholdDate;
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
            Location Management
          </h2>
        </motion.div>

        {/* Location Form */}
        <motion.section variants={itemVariants}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-orange-100 p-2 rounded-lg">
                <MapPinIcon className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {editLocation ? 'Edit Current Location' : 'Set Current Location'}
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
                    value={locationForm.date}
                    onChange={handleLocationChange}
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
                    value={locationForm.location}
                    onChange={handleLocationChange}
                    placeholder="e.g. Downtown Plaza"
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
                    value={locationForm.state}
                    onChange={handleLocationChange}
                    placeholder="e.g. CA"
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
                    value={locationForm.startTime}
                    onChange={handleLocationChange}
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
                    value={locationForm.endTime}
                    onChange={handleLocationChange}
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
                      value={locationForm.coordinates.lat}
                      onChange={handleLocationChange}
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
                      value={locationForm.coordinates.lng}
                      onChange={handleLocationChange}
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
                    setEditLocation(null);
                    setLocationForm({ date: '', location: '', state: '', startTime: '', endTime: '', coordinates: { lat: '', lng: '' } });
                    setFormErrors({});
                  }}
                  className="px-6 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                >
                  {editLocation ? 'Cancel' : 'Clear'}
                </button>
                <button
                  type="submit"
                  disabled={!editLocation && location && !locationUpdated}
                  className={`px-6 py-2 rounded-lg font-bold shadow-md transition-all ${!editLocation && location ? 'bg-orange-400 text-white cursor-not-allowed opacity-70' : 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg transform active:scale-95'}`}
                >
                  {editLocation ? 'Update Location' : 'Set Location'}
                </button>
              </div>
              {location && !editLocation && (
                <p className="text-orange-500 text-xs mt-3 text-right">
                  * Current location is already set. Edit or delete it to set a new one.
                </p>
              )}
            </form>
          </div>
        </motion.section>

        {/* Current Location Display */}
        <motion.section variants={itemVariants}>
          <h3 className="text-xl font-bold text-gray-900 mb-4 ml-1">Current Active Location</h3>
          {loading ? (
            <div className="h-40 bg-gray-200 rounded-2xl animate-pulse"></div>
          ) : error || !location ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 border-dashed">
              <div className="text-4xl opacity-20 mb-3">📍</div>
              <h3 className="text-lg font-bold text-gray-900">No active location</h3>
              <p className="text-gray-500 text-sm">Use the form above to set where the truck is right now.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-10 -mt-10 z-0"></div>
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">Active Now</span>
                      {isPastDate(location.date) && (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">Expired Date</span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{location.currentLocation}</h2>
                  </div>
                  <div className="flex items-center space-x-2 mt-4 md:mt-0">
                    <button
                      onClick={() => startEdit(location)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Date</p>
                    <p className="font-semibold text-gray-900">{new Date(location.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Time</p>
                    <p className="font-semibold text-gray-900">{location.startTime} - {location.endTime}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Coordinates</p>
                    <p className="font-semibold text-gray-900 font-mono text-sm">
                      {location.coordinates ? `${location.coordinates.lat}, ${location.coordinates.lng}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.section>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Import from Schedules */}
        <motion.section variants={itemVariants}>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quick Set from Schedule</h2>
              <p className="text-gray-500 text-sm mt-1">Select a scheduled event to quickly set it as the current location.</p>
            </div>
          </div>

          {schedulesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : schedulesError ? (
            <div className="text-center py-8 text-red-500 bg-red-50 rounded-xl">{schedulesError}</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
              <p className="text-gray-500">No upcoming schedules found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {schedules.map((schedule) => (
                  <motion.div
                    key={schedule._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-200 p-5 transition-all group relative"
                  >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleSetAsCurrent(schedule)}
                        className="bg-green-600 text-white p-2 rounded-full shadow-lg hover:bg-green-700 hover:scale-110 transition-all transform"
                        title="Set as Active Location"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mb-3">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{schedule.state}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-lg mb-2 pr-8">{schedule.location}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="w-20 text-gray-400 text-xs uppercase font-bold">Date</span>
                        <span>{new Date(schedule.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-20 text-gray-400 text-xs uppercase font-bold">Time</span>
                        <span>{schedule.startTime} - {schedule.endTime}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
};

export default LocationManagement;
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { Tab } from '@headlessui/react';
import { MapPinIcon, ArrowRightIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

// renderMap and Map components remain unchanged
const renderMap = (status) => {
  if (status === Status.LOADING)
    return (
      <div className="h-64 w-full rounded-3xl bg-gray-700 animate-pulse flex items-center justify-center">
        <span className="text-gray-400">Loading map...</span>
      </div>
    );
  if (status === Status.FAILURE)
    return (
      <div className="h-64 w-full rounded-3xl bg-red-900 flex items-center justify-center">
        <span className="text-red-400">Error loading map</span>
      </div>
    );
  return null;
};

const Map = ({ center }) => {
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.marker) {
      const map = new window.google.maps.Map(document.getElementById(`map-${center.lat}`), {
        center,
        zoom: 12,
        mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'your_map_id_here',
      });
      new window.google.maps.marker.AdvancedMarkerElement({
        position: center,
        map,
        title: 'Food Truck Delight',
      });
    }
  }, [center]);

  return <div id={`map-${center.lat}`} className="h-64 w-full rounded-3xl" />;
};

const ScheduleView = () => {
  const { view: initialView } = useParams();
  const [view, setView] = useState(initialView || 'week');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    location: '',
    state: '',
    startDate: '',
    endDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const [retryCount, setRetryCount] = useState(0);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/schedules`, {
        params: { view },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Ensure data is an array
      setSchedules(Array.isArray(data) ? data : []);
      setRetryCount(0);
    } catch (err) {
      const errorMessage = err.response?.status === 500
        ? 'Server is temporarily unavailable. Please try again shortly.'
        : 'Failed to load schedule. Please try again later.';
      setError(errorMessage);
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchSchedules();
  };

  useEffect(() => {
    fetchSchedules();
  }, [view]);

  // Filter schedules
  const filteredSchedules = schedules.filter((sch) => {
    const locationMatch = sch.location?.toLowerCase().includes(filter.location.toLowerCase()) || false;
    const stateMatch = filter.state ? sch.state === filter.state : true;
    const dateMatch = (!filter.startDate || new Date(sch.date) >= new Date(filter.startDate)) &&
      (!filter.endDate || new Date(sch.date) <= new Date(filter.endDate));
    return locationMatch && stateMatch && dateMatch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSchedules.length / rowsPerPage);
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({ ...filter, [name]: value });
    setCurrentPage(1); // Reset to first page
  };

  // Clear filters
  const clearFilters = () => {
    setFilter({ location: '', state: '', startDate: '', endDate: '' });
    setCurrentPage(1);
  };

  // Dynamic grid layout
  const getGridClasses = (itemCount) => {
    if (itemCount === 1) return 'grid grid-cols-1 mx-auto';
    if (itemCount === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-8 mx-auto';
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto';
  };

  // Unique states for dropdown
  const uniqueStates = [...new Set(schedules.map(sch => sch.state).filter(Boolean))].sort();

  // Calculate date threshold (current date - 1 day)
  const currentDate = new Date('2025-09-06T21:43:00+03:00'); // Updated to match provided date and time
  const thresholdDate = new Date(currentDate);
  thresholdDate.setDate(currentDate.getDate() - 1);

  // Function to check if a schedule's date is before the threshold
  const isPastDate = (scheduleDate) => {
    return new Date(scheduleDate) < thresholdDate;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

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
          Food Truck Schedule
        </motion.h2>

        {/* Tabs */}
        <motion.div className="flex justify-center mb-12" variants={itemVariants}>
          <Tab.Group onChange={(index) => setView(index === 0 ? 'week' : 'month')}>
            <Tab.List className="flex space-x-2 rounded-full card-gradient-bg p-2 shadow-lg backdrop-blur-sm border border-gray-700">
              <Tab
                className={({ selected }) =>
                  `px-6 py-3 rounded-full font-semibold transition-all duration-300 ${selected ? 'bg-button-bg-primary text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`
                }
              >
                Week
              </Tab>
              <Tab
                className={({ selected }) =>
                  `px-6 py-3 rounded-full font-semibold transition-all duration-300 ${selected ? 'bg-button-bg-primary text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`
                }
              >
                Month
              </Tab>
            </Tab.List>
          </Tab.Group>
        </motion.div>

        {/* Filters */}
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12" variants={itemVariants}>
          <div>
            <label className="block text-gray-300 font-semibold mb-1">Location</label>
            <input
              name="location"
              value={filter.location}
              onChange={handleFilterChange}
              placeholder="Search Location"
              className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
            />
          </div>
          <div>
            <label className="block text-gray-300 font-semibold mb-1">State</label>
            <select
              name="state"
              value={filter.state}
              onChange={handleFilterChange}
              className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
            >
              <option value="">All States</option>
              {uniqueStates.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-300 font-semibold mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filter.startDate}
              onChange={handleFilterChange}
              className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
            />
          </div>
          <div>
            <label className="block text-gray-300 font-semibold mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filter.endDate}
              onChange={handleFilterChange}
              className="w-full p-3 rounded-full bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
            />
          </div>
        </motion.div>
        <motion.div className="flex justify-end mb-6" variants={itemVariants}>
          <button
            onClick={clearFilters}
            className="px-6 py-3 bg-gray-700 text-white rounded-full font-semibold hover:bg-gray-600 transition duration-300"
          >
            Clear Filters
          </button>
        </motion.div>

        {/* Schedule Items */}
        <AnimatePresence mode="wait">
          {loading && !error ? (
            <motion.div
              key="loading"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {[1, 2, 3, 4].map((_, index) => (
                <motion.div
                  key={index}
                  className="card-gradient-bg p-6 rounded-3xl shadow-lg animate-pulse border border-gray-700"
                  variants={itemVariants}
                >
                  <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
                  <div className="h-64 bg-gray-700 rounded-3xl"></div>
                </motion.div>
              ))}
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              className="text-center py-12 card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700 mx-auto"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="text-6xl mb-4">�️</div>
              <h3 className="text-2xl font-bold text-gray-300 mb-2">Unable to load schedule</h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <motion.button
                className="bg-button-bg-primary text-white px-8 py-3 rounded-full font-semibold flex items-center justify-center mx-auto"
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(251, 146, 60, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRetry}
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Try Again
              </motion.button>
              {retryCount > 0 && (
                <p className="text-gray-500 text-sm mt-3">
                  Attempt {retryCount + 1}
                </p>
              )}
            </motion.div>
          ) : filteredSchedules.length === 0 ? (
            <motion.div
              key="empty"
              className="text-center py-12 card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700 mx-auto"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="text-6xl mb-4">🗓️</div>
              <h3 className="text-2xl font-bold text-gray-300 mb-2">No schedules available</h3>
              <p className="text-gray-400">Check back soon for our next stops!</p>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <motion.div className="flex justify-between items-center mb-6" variants={itemVariants}>
                <h3 className="text-xl font-bold text-white">Showing {paginatedSchedules.length} of {filteredSchedules.length} schedules</h3>
              </motion.div>
              <motion.div
                className={getGridClasses(paginatedSchedules.length)}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence>
                  {paginatedSchedules.map((sch) => (
                    <motion.div
                      key={sch._id}
                      className="relative card-gradient-bg rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 border border-gray-700 w-full"
                      variants={itemVariants}
                      initial="initial"
                      animate="visible"
                      exit={{ opacity: 0, y: 20 }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <span className="text-3xl">📍</span>
                          <h3 className="text-xl font-bold text-white group-hover:text-orange-600 transition-colors">
                            {sch.location}, {sch.state}
                          </h3>
                        </div>
                        <p className={`text-lg text-gray-300 mb-2 ${isPastDate(sch.date) ? 'text-red-500' : ''}`}>
                          <span className="font-semibold">Date:</span>{' '}
                          {new Date(sch.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                          })}
                          {isPastDate(sch.date) && (
                            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-red-500" title="This schedule is outdated"></span>
                          )}
                        </p>
                        <p className="text-lg text-orange-400 font-semibold mb-4">
                          <span className="font-semibold text-gray-300">Time:</span> {sch.startTime} -{' '}
                          {sch.endTime}
                        </p>
                        {sch.notes && (
                          <p className="text-sm text-gray-400 italic mb-4">💭 {sch.notes}</p>
                        )}
                        {sch.coordinates && sch.coordinates.lat && sch.coordinates.lng ? (
                          <Wrapper
                            apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                            render={renderMap}
                            libraries={['marker']}
                          >
                            <Map center={{ lat: sch.coordinates.lat, lng: sch.coordinates.lng }} />
                          </Wrapper>
                        ) : (
                          <div className="h-64 w-full rounded-3xl bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-400">No map available</span>
                          </div>
                        )}
                        {sch.coordinates && sch.coordinates.lat && sch.coordinates.lng && (
                          <div className="mt-4 text-center">
                            <motion.a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${sch.coordinates.lat},${sch.coordinates.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center bg-button-bg-primary text-white px-4 py-2 rounded-full font-semibold text-sm"
                              whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(251, 146, 60, 0.3)' }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <ArrowRightIcon className="h-4 w-4 mr-1" />
                              Get Directions
                            </motion.a>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
              {/* Pagination Controls */}
              <motion.div
                className="flex flex-col sm:flex-row items-center justify-between mt-8"
                variants={itemVariants}
              >
                <div className="flex items-center space-x-2 mb-4 sm:mb-0">
                  <label className="text-gray-300">Schedules per page:</label>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value, 10));
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ScheduleView;
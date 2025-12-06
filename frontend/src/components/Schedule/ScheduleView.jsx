import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { Tab } from '@headlessui/react';
import { MapPinIcon, ArrowRightIcon, ArrowPathIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/solid';

// renderMap and Map components remain unchanged
const renderMap = (status) => {
  if (status === Status.LOADING)
    return (
      <div className="h-64 w-full rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center border border-gray-200">
        <span className="text-gray-400 font-medium">Loading map...</span>
      </div>
    );
  if (status === Status.FAILURE)
    return (
      <div className="h-64 w-full rounded-2xl bg-red-50 flex items-center justify-center border border-red-100">
        <span className="text-red-500 font-medium">Error loading map</span>
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

  return <div id={`map-${center.lat}`} className="h-64 w-full rounded-2xl shadow-inner border border-gray-200" />;
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
      className="min-h-screen bg-gray-50 pb-20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.h2
          className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          Food Truck Schedule
        </motion.h2>

        {/* Tabs */}
        <motion.div className="flex justify-center mb-10" variants={itemVariants}>
          <Tab.Group onChange={(index) => setView(index === 0 ? 'week' : 'month')}>
            <Tab.List className="flex space-x-1 rounded-xl bg-white p-1 shadow-sm border border-gray-200">
              <Tab
                className={({ selected }) =>
                  `px-8 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 outline-none ring-0 focus:ring-0 ${selected
                    ? 'bg-orange-50 text-orange-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                Week View
              </Tab>
              <Tab
                className={({ selected }) =>
                  `px-8 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 outline-none ring-0 focus:ring-0 ${selected
                    ? 'bg-orange-50 text-orange-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                Month View
              </Tab>
            </Tab.List>
          </Tab.Group>
        </motion.div>

        {/* Filters */}
        <motion.div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10" variants={itemVariants}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Location</label>
              <input
                name="location"
                value={filter.location}
                onChange={handleFilterChange}
                placeholder="Search Location"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">State</label>
              <select
                name="state"
                value={filter.state}
                onChange={handleFilterChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
              >
                <option value="">All States</option>
                {uniqueStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filter.startDate}
                onChange={handleFilterChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filter.endDate}
                onChange={handleFilterChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm font-semibold text-gray-500 hover:text-orange-600 transition-colors py-2 px-4 rounded-lg hover:bg-orange-50"
            >
              Clear Filters
            </button>
          </div>
        </motion.div>

        {/* Schedule Items */}
        <AnimatePresence mode="wait">
          {loading && !error ? (
            <motion.div
              key="loading"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-auto"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {[1, 2, 3, 4].map((_, index) => (
                <motion.div
                  key={index}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse"
                  variants={itemVariants}
                >
                  <div className="h-6 bg-gray-100 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/3 mb-4"></div>
                  <div className="h-64 bg-gray-100 rounded-2xl"></div>
                </motion.div>
              ))}
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="text-6xl mb-4 opacity-50">😓</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to load schedule</h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <motion.button
                className="bg-orange-600 text-white px-8 py-3 rounded-full font-semibold flex items-center justify-center mx-auto hover:bg-orange-700 transition-colors shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRetry}
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Try Again
              </motion.button>
              {retryCount > 0 && (
                <p className="text-gray-400 text-xs mt-3">
                  Attempt {retryCount + 1}
                </p>
              )}
            </motion.div>
          ) : filteredSchedules.length === 0 ? (
            <motion.div
              key="empty"
              className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="text-6xl mb-4 opacity-50">🗓️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No schedules available</h3>
              <p className="text-gray-500">Check back soon for our next stops!</p>
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
                <h3 className="text-lg font-semibold text-gray-700">Showing {paginatedSchedules.length} of {filteredSchedules.length} stops</h3>
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
                      className="relative bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden group transition-all duration-300 w-full flex flex-col"
                      variants={itemVariants}
                      initial="initial"
                      animate="visible"
                      exit={{ opacity: 0, y: 20 }}
                    >
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-start gap-4 mb-5">
                          <div className="p-3 bg-orange-50 rounded-xl">
                            <MapPinIcon className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                              {sch.location}
                            </h3>
                            <p className="text-gray-500 font-medium text-sm">{sch.state}</p>
                          </div>
                        </div>

                        <div className="space-y-3 mb-6">
                          <div className={`flex items-center gap-3 p-3 rounded-lg ${isPastDate(sch.date) ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-100'}`}>
                            <CalendarDaysIcon className={`h-5 w-5 ${isPastDate(sch.date) ? 'text-red-500' : 'text-gray-400'}`} />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Date</span>
                              <span className={`text-sm font-semibold ${isPastDate(sch.date) ? 'text-red-600' : 'text-gray-900'}`}>
                                {new Date(sch.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                                {isPastDate(sch.date) && ' (Past)'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                            <ClockIcon className="h-5 w-5 text-gray-400" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Time</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {sch.startTime} - {sch.endTime}
                              </span>
                            </div>
                          </div>
                        </div>

                        {sch.notes && (
                          <p className="text-sm text-gray-500 italic mb-6 line-clamp-2 px-1">"{sch.notes}"</p>
                        )}

                        <div className="mt-auto">
                          {sch.coordinates && sch.coordinates.lat && sch.coordinates.lng ? (
                            <div className="rounded-2xl overflow-hidden border border-gray-200">
                              <Wrapper
                                apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                                render={renderMap}
                                libraries={['marker']}
                              >
                                <Map center={{ lat: sch.coordinates.lat, lng: sch.coordinates.lng }} />
                              </Wrapper>
                            </div>
                          ) : (
                            <div className="h-48 w-full rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-200">
                              <span className="text-gray-400 text-sm">No map available</span>
                            </div>
                          )}

                          {sch.coordinates && sch.coordinates.lat && sch.coordinates.lng && (
                            <div className="mt-4">
                              <motion.a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${sch.coordinates.lat},${sch.coordinates.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center bg-gray-900 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors shadow-sm"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <ArrowRightIcon className="h-4 w-4 mr-2" />
                                Get Directions
                              </motion.a>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
              {/* Pagination Controls */}
              <motion.div
                className="flex flex-col sm:flex-row items-center justify-between mt-12 bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
                variants={itemVariants}
              >
                <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                  <label className="text-gray-500 text-sm font-medium">Rows per page:</label>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value, 10));
                      setCurrentPage(1);
                    }}
                    className="bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
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
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
                    whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                  >
                    Previous
                  </motion.button>
                  <span className="text-gray-500 text-sm font-medium px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <motion.button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { Tab } from '@headlessui/react';
import { MapPinIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

const renderMap = (status) => {
  if (status === Status.LOADING)
    return (
      <div className="h-64 w-full rounded-3xl bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400">Loading map...</span>
      </div>
    );
  if (status === Status.FAILURE)
    return (
      <div className="h-64 w-full rounded-3xl bg-red-100 dark:bg-red-900 flex items-center justify-center">
        <span className="text-red-600 dark:text-red-400">Error loading map</span>
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
        mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'your_map_id_here', // Fallback Map ID
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

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/schedules?view=${view}`);
        setSchedules(data);
      } catch (err) {
        setError('Failed to load schedule. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, [view]);

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
          Food Truck Schedule
        </motion.h2>


        {/* Tabs */}
        <motion.div className="flex justify-center mb-12" variants={itemVariants}>
          <Tab.Group onChange={(index) => setView(index === 0 ? 'week' : 'month')}>
            <Tab.List className="flex space-x-2 rounded-full bg-white/80 dark:bg-gray-800/80 p-2 shadow-lg backdrop-blur-sm border-1 border-gray-700">
              <Tab
                className={({ selected }) =>
                  `px-6 py-3 rounded-full font-semibold transition-all duration-300 ${selected
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`
                }
              >
                Week
              </Tab>
              <Tab
                className={({ selected }) =>
                  `px-6 py-3 rounded-full font-semibold transition-all duration-300 ${selected
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`
                }
              >
                Month
              </Tab>
            </Tab.List>
          </Tab.Group>
        </motion.div>

        {/* Schedule Items */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4].map((_, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg animate-pulse"
                variants={itemVariants}
              >
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-3xl"></div>
              </motion.div>
            ))}
          </div>
        ) : error ? (
          <motion.div
            className="text-center py-12 bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-lg backdrop-blur-sm border-1 border-gray-700"
            variants={itemVariants}
          >
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">Unable to load schedule</h3>
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
        ) : schedules.length === 0 ? (
          <motion.div
            className="text-center py-12 bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-lg backdrop-blur-sm border-1 border-gray-700"
            variants={itemVariants}
          >
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">No schedules available</h3>
            <p className="text-gray-500 dark:text-gray-400">Check back soon for our next stops!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {schedules.map((sch) => (
                <motion.div
                  key={sch._id}
                  className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 border-1 border-gray-700"
                  variants={itemVariants}
                  initial="initial"
                  animate="visible"
                  exit={{ opacity: 0, y: 20 }}
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="text-3xl">📍</span>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-orange-600 transition-colors">
                        {sch.location}, {sch.state}
                      </h3>
                    </div>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                      <span className="font-semibold">Date:</span>{' '}
                      {new Date(sch.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-lg text-orange-600 dark:text-orange-400 font-semibold mb-4">
                      <span className="font-semibold text-gray-600 dark:text-gray-300">Time:</span> {sch.startTime} -{' '}
                      {sch.endTime}
                    </p>
                    {sch.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-4">💭 {sch.notes}</p>
                    )}
                    {sch.coordinates ? (
                      <Wrapper
                        apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                        render={renderMap}
                        libraries={['marker']}
                      >
                        <Map center={{ lat: sch.coordinates.lat, lng: sch.coordinates.lng }} />
                      </Wrapper>
                    ) : (
                      <div className="h-64 w-full rounded-3xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400">No map available</span>
                      </div>
                    )}

                    {/* Get Directions Button */}
                    {sch.coordinates && (
                      <div className="mt-4 text-center">
                        <motion.a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${sch.coordinates.lat},${sch.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full font-semibold text-sm"
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
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ScheduleView;
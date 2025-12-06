import { useEffect, useState } from 'react';
import axios from 'axios';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { useNotification } from '../../context/NotificationContext';
import { MapPinIcon, ArrowRightIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

const renderMap = (status) => {
  if (status === Status.LOADING) {
    return (
      <div className="h-96 w-full rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center border border-gray-200">
        <span className="text-gray-400 font-medium">Loading map...</span>
      </div>
    );
  }
  if (status === Status.FAILURE) {
    return (
      <div className="h-96 w-full rounded-2xl bg-red-50 flex items-center justify-center border border-red-100">
        <span className="text-red-500 font-medium">Error loading map</span>
      </div>
    );
  }
  return null;
};

const Map = ({ center }) => {
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.marker) {
      const map = new window.google.maps.Map(document.getElementById(`map-${center.lat}`), {
        center,
        zoom: 15,
        mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'your_map_id_here',
      });
      new window.google.maps.marker.AdvancedMarkerElement({
        position: center,
        map,
        title: 'Food Truck Delight',
      });
    }
  }, [center]);

  return <div id={`map-${center.lat}`} className="h-96 w-full rounded-2xl shadow-inner border border-gray-200" />;
};

const CurrentLocation = () => {
  const socket = useSocket();
  const { notify } = useNotification();
  const [location, setLocation] = useState({
    currentLocation: 'Loading...',
    coordinates: { lat: 0, lng: 0 },
    updatedAt: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/locations/current`);
      setLocation(data);
      setRetryCount(0);
    } catch (err) {
      const errorMessage = err.response?.status === 500
        ? 'Server is temporarily unavailable. Please try again shortly.'
        : 'Failed to fetch current location. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchLocation();
  };

  useEffect(() => {
    fetchLocation();

    socket.on('locationUpdate', (newLocation) => {
      setLocation(newLocation);
      notify('Food truck location updated!', 'success');
    });

    return () => socket.off('locationUpdate');
  }, [socket, notify]);

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.h2
          className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4 text-center"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          Current Food Truck Location
        </motion.h2>

        <AnimatePresence mode="wait">
          {loading && !error ? (
            <motion.div
              key="loading"
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="h-8 bg-gray-100 rounded w-1/2 mx-auto mb-8 animate-pulse"></div>
              <div className="h-96 bg-gray-100 rounded-2xl animate-pulse"></div>
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
              <div className="text-6xl mb-4 opacity-50">📍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to load location</h3>
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
          ) : (
            <motion.div
              key="success"
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="flex flex-col items-center justify-center mb-8">
                <div className="p-4 bg-orange-50 rounded-full mb-4">
                  <MapPinIcon className="h-10 w-10 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 text-center">
                  {location.currentLocation}
                </h3>
                <p className="text-gray-500 text-sm mt-2 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Live Update
                </p>
              </div>

              <AnimatePresence>
                <motion.div
                  key={`${location.coordinates.lat}-${location.coordinates.lng}`}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: 20 }}
                  className="rounded-2xl overflow-hidden border border-gray-200 shadow-inner"
                >
                  {location.coordinates.lat && location.coordinates.lng ? (
                    <Wrapper
                      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                      render={renderMap}
                      libraries={['marker']}
                    >
                      <Map center={{ lat: location.coordinates.lat, lng: location.coordinates.lng }} />
                    </Wrapper>
                  ) : (
                    <div className="h-96 w-full rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                      <span className="text-gray-400">No map coordinates available</span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="text-center mt-8">
                <motion.a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-gray-900 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowRightIcon className="h-5 w-5 mr-2" />
                  Get Directions
                </motion.a>
              </div>

              <p className="text-center mt-6 text-gray-400 text-xs border-t border-gray-100 pt-6">
                Last updated:{' '}
                {new Date(location.updatedAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CurrentLocation;
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { useNotification } from '../../context/NotificationContext';
import { MapPinIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

const renderMap = (status) => {
  if (status === Status.LOADING) {
    return (
      <div className="h-96 w-full rounded-3xl bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400">Loading map...</span>
      </div>
    );
  }
  if (status === Status.FAILURE) {
    return (
      <div className="h-96 w-full rounded-3xl bg-red-100 dark:bg-red-900 flex items-center justify-center">
        <span className="text-red-600 dark:text-red-400">Error loading map</span>
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
        mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'your_map_id_here', // Fallback Map ID
      });
      new window.google.maps.marker.AdvancedMarkerElement({
        position: center,
        map,
        title: 'Food Truck Delight',
      });
    }
  }, [center]);

  return <div id={`map-${center.lat}`} className="h-96 w-full rounded-3xl shadow-lg" />;
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

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/locations/current`);
        setLocation(data);
      } catch (err) {
        setError('Failed to fetch current location. Please try again later.');
        notify('Failed to fetch location', 'error');
      } finally {
        setLoading(false);
      }
    };
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
          Current Food Truck Location
        </motion.h2>

        {loading ? (
          <motion.div
            className="bg-white/80 dark:bg-gray-800/80 p-8 rounded-3xl shadow-lg backdrop-blur-sm"
            variants={itemVariants}
          >
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-6 animate-pulse"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-3xl animate-pulse"></div>
          </motion.div>
        ) : error ? (
          <motion.div
            className="text-center py-12 bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-lg backdrop-blur-sm"
            variants={itemVariants}
          >
            <div className="text-6xl mb-4">📍</div>
            <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">Unable to load location</h3>
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
        ) : (
          <motion.div
            className="bg-white/80 dark:bg-gray-800/80 p-8 rounded-3xl shadow-lg backdrop-blur-sm"
            variants={itemVariants}
          >
            <div className="flex items-center justify-center space-x-3 mb-6">
              <MapPinIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white group-hover:text-orange-600 transition-colors">
                {location.currentLocation}
              </h3>
            </div>
            <AnimatePresence>
              <motion.div
                key={`${location.coordinates.lat}-${location.coordinates.lng}`}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: 20 }}
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
                  <div className="h-96 w-full rounded-3xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400">No map coordinates available</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="text-center mt-6">
              <motion.a
                href={`https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-full font-semibold"
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(251, 146, 60, 0.4)' }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowRightIcon className="h-5 w-5 mr-2" />
                Get Directions
              </motion.a>
            </div>
            <p className="text-center mt-4 text-gray-500 dark:text-gray-400 text-sm">
              Location updates in real-time. Last updated:{' '}
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
      </div>
    </motion.div>
  );
};

export default CurrentLocation;
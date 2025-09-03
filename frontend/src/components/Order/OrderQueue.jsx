import { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNotification } from '../../context/NotificationContext';
import { ClockIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';

const OrderQueue = () => {
  const socket = useSocket();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [queue, setQueue] = useState({ length: 0, estimatedWait: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/orders/queue`);
        setQueue(data);
      } catch (err) {
        setError('Failed to load queue status. Please try again later.');
        notify('Failed to load queue status', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();

    // socket.on('connect', () => console.log('Socket.io connected'));
    socket.on('queueUpdate', (update) => {
      setQueue(update);
      notify(`Queue updated: ${update.length} orders`, 'info');
    });
    socket.on('connect_error', (err) => {
      console.error('Socket.io error:', err);
      setError('Connection error. Queue updates may be delayed.');
      notify('Connection error. Queue may not update.', 'error');
    });

    return () => {
      socket.off('queueUpdate');
      socket.off('connect');
      socket.off('connect_error');
    };
  }, [socket, notify]);

  const progress = Math.min((queue.estimatedWait / 60) * 100, 100); // Cap at 100%

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
          className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          ⏰ Order Queue Status
        </motion.h2>

        <motion.div
          className="bg-white/80 dark:bg-gray-800/80 p-8 rounded-3xl shadow-lg backdrop-blur-sm max-w-2xl mx-auto"
          variants={itemVariants}
        >
          {loading ? (
            <div className="text-center">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-6 animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-full animate-pulse"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">⏰</div>
              <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">Unable to load queue</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
              <motion.button
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-full font-semibold"
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(251, 146, 60, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
              >
                Try Again
              </motion.button>
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">No orders in queue!</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Order now for quick service!</p>
              <motion.button
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-full font-semibold"
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(251, 146, 60, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/menu')}
              >
                Order Now
              </motion.button>
            </div>
          ) : (
            <AnimatePresence>
              <motion.div
                key={queue.length}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: 20 }}
              >
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <ClockIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Current Queue</h3>
                </div>
                <div className="text-center mb-6">
                  <p className="text-3xl font-semibold text-orange-600 dark:text-orange-400">{queue.length} Orders</p>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                    Estimated Wait: {queue.estimatedWait} minutes
                  </p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-6 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  ></motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
          <p className="text-center mt-6 text-gray-500 dark:text-gray-400 text-sm">
            Queue updates in real-time. Hang tight!
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default OrderQueue;
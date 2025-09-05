import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from "react-router-dom";
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import Testimonials from '../components/Testimonials';

const fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FF6B35;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23F7931E;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='300' fill='url(%23grad1)'/%3E%3Cg transform='translate(200,150)'%3E%3Ccircle r='40' fill='white' opacity='0.9'/%3E%3Ctext x='0' y='8' text-anchor='middle' fill='%23FF6B35' font-size='24' font-family='Arial'%3E🍕%3C/text%3E%3C/g%3E%3C/svg%3E";

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

const Home = () => {
  const [featuredMenu, setFeaturedMenu] = useState([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  const isMounted = useRef(true);
  const requestCount = useRef(0);

  const heroRef = useRef(null);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.2]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (requestCount.current > 0) {
        return;
      }

      requestCount.current++;
      try {
        setLoading(true);
        setError(null);

        const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 1500));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        // Fetch menu items
        const menuResponse = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/menu`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!menuResponse.ok) {
          throw new Error('Failed to fetch menu items');
        }

        const menuData = await menuResponse.json();
        const formattedMenu = menuData.map((item) => ({
          _id: item._id,
          name: item.name,
          description: item.description || 'No description available',
          price: item.price,
          image: item.image || fallbackImage,
        }));

        // Fetch schedules for upcoming dates
        const scheduleController = new AbortController();
        const scheduleTimeoutId = setTimeout(() => scheduleController.abort(), 10000);

        const scheduleResponse = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/schedules`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: scheduleController.signal
        });

        clearTimeout(scheduleTimeoutId);

        let formattedSchedule = [];
        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json();
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Set to start of today for comparison

          // Filter schedules for dates from today onward and sort by date
          formattedSchedule = scheduleData
            .filter((item) => new Date(item.date) >= today)
            .map((item) => ({
              _id: item._id,
              date: new Date(item.date),
              location: item.location || 'Unknown Location',
              state: item.state || 'CA',
              startTime: item.startTime || '11:00 AM',
              endTime: item.endTime || '8:00 PM',
              // notes: item.notes || 'Join us for delicious food!',
              coordinates: item.coordinates || null,
            }))
            .sort((a, b) => a.date - b.date); // Sort by date ascending
        } else {
          console.warn('Failed to fetch schedule data, using empty schedule');
        }

        await minLoadingTime;

        if (isMounted.current) {
          setFeaturedMenu(formattedMenu.slice(0, 3));
          setUpcomingSchedule(formattedSchedule.slice(0, 3)); // Limit to 3 upcoming schedules
        }
      } catch (err) {
        if (isMounted.current) {
          console.error('API Error:', err);
          setError(err.message);
          setFeaturedMenu([]);
          setUpcomingSchedule([]);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
        requestCount.current = Math.max(0, requestCount.current - 1);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      const readyTimer = setTimeout(() => {
        if (isMounted.current) {
          setIsReady(true);
        }
      }, 200);
      return () => clearTimeout(readyTimer);
    }
  }, [loading]);

  const handleImageError = (e, setImage) => {
    e.target.onerror = null;
    setImage(fallbackImage);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 1,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const LoadingSkeleton = ({ className, children }) => (
    <div className={`animate-pulse ${className}`}>
      {children}
    </div>
  );

  const InteractiveCard = ({ item, className }) => {
    const [imageSrc, setImageSrc] = useState(item.image || fallbackImage);

    return (
      <div
        className={`${className} perspective-1000`}
        style={{ opacity: 1, transform: 'translateY(0) rotateX(0deg)' }}
      >
        <div className="relative overflow-hidden">
          <img
            src={imageSrc}
            alt={item.name}
            className="w-full h-80 object-cover"
            onError={(e) => handleImageError(e, setImageSrc)}
          />
          <div className="absolute top-6 right-6 backdrop-blur-md bg-white/10 border border-white/20 text-white px-4 py-2 rounded-full text-sm font-bold shadow-2xl">
            ✨ Featured
          </div>
        </div>
        <div className="p-8 relative bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/10">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-gray-300 mb-6 leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
          <p className="text-4xl font-black text-text-primary">
            ${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price || 0).toFixed(2)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <motion.div
        className="relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.section
          ref={heroRef}
          className="relative flex items-center justify-center min-h-[calc(100vh-72px)] overflow-hidden"
          style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
        >
          <div
            className="absolute inset-0 z-0 bg-[url('/fb-photo.jpg')] bg-cover bg-center bg-no-repeat"
            style={{
              filter: 'blur(8px)',
              transform: 'scale(1.1)'
            }}
          />
          <div className="absolute inset-0 z-1 bg-black/30" />
          <div className="relative z-10 text-center w-full max-w-7xl mx-auto px-4">
            <motion.h1
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-8"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 1.2, ease: "easeOut" }}
            >
              <motion.span
                className="inline-block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: '200% 200%' }}
              >
                Bye Bye
              </motion.span>
              <br />
              <motion.span
                className="inline-block bg-gradient-to-r from-orange-400 via-red-400 to-pink-500 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ['100% 50%', '0% 50%', '100% 50%'],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 0.5 }}
                style={{ backgroundSize: '200% 200%' }}
              >
                ETIQUETTE
              </motion.span>
            </motion.h1>
            <motion.p
              className="text-xl sm:text-2xl md:text-3xl mb-12 text-white/90 max-w-4xl mx-auto leading-relaxed font-light drop-shadow-md"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
            >
              Good food that{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-semibold">
                goes places.
              </span>{' '}
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 2, duration: 1 }}
            >
              <motion.button
                className="group relative px-12 py-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full text-white text-xl font-bold shadow-2xl overflow-hidden"
                whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/menu")}
              >
                <span className="relative z-10 flex items-center space-x-3">
                  <span>🌟</span>
                  <span>Experience Menu</span>
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
              <motion.button
                className="group px-12 py-6 border-2 border-white/30 text-white rounded-full text-xl font-bold backdrop-blur-sm bg-white/10 hover:bg-white/20 transition-all duration-300"
                whileHover={{ scale: 1.05, borderColor: "rgba(255, 255, 255, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/location")}
              >
                <span className="flex items-center space-x-3">
                  <span>📍</span>
                  <span>Track Location</span>
                </span>
              </motion.button>
            </motion.div>
          </div>
        </motion.section>

        {/* Featured Creations Section */}
        <motion.section
          className="py-32 relative"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="container mx-auto px-6">
            <motion.div className="text-center mb-20" variants={itemVariants}>
              <motion.h2
                className="text-5xl sm:text-6xl md:text-7xl font-black mb-8 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                initial={{ scale: 0.5 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
              >
                SIGNATURE CREATIONS
              </motion.h2>
              <motion.div
                className="w-40 h-1 bg-gradient-to-r from-cyan-400 to-pink-500 mx-auto rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: "10rem" }}
                transition={{ duration: 1.2, delay: 0.5 }}
              />
            </motion.div>
            <AnimatePresence mode="wait">
              {isReady && !loading ? (
                error ? (
                  <motion.div
                    className="text-center py-20"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <motion.div
                      className="text-9xl mb-8 filter drop-shadow-2xl"
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🔮
                    </motion.div>
                    <h3 className="text-4xl font-bold text-white mb-6">Culinary Magic Loading...</h3>
                    <p className="text-white/60 mb-12 text-xl">{error}</p>
                    <motion.button
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-10 py-4 rounded-full font-bold text-lg shadow-2xl"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.location.reload()}
                    >
                      Reload Experience
                    </motion.button>
                  </motion.div>
                ) : featuredMenu.length === 0 ? (
                  <motion.div
                    className="text-center py-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="text-9xl mb-8 filter drop-shadow-2xl">🎭</div>
                    <h3 className="text-4xl font-bold text-white mb-6">Crafting Culinary Art...</h3>
                    <p className="text-white/60 text-xl">Our chefs are creating magic</p>
                  </motion.div>
                ) : (
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.2 }}
                  >
                    {featuredMenu.map((item, index) => (
                      <InteractiveCard
                        key={item._id}
                        item={item}
                        index={index}
                        className="relative bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden hover:shadow-cyan-500/25 transition-all duration-500"
                      />
                    ))}
                  </motion.div>
                )
              ) : (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                >
                  {[1, 2, 3].map((index) => (
                    <LoadingSkeleton key={`skeleton-${index}`} className="group">
                      <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                        <div className="w-full h-80 bg-gradient-to-br from-slate-700/50 to-slate-600/50"></div>
                        <div className="p-8">
                          <div className="h-8 bg-gradient-to-r from-slate-600/50 to-slate-500/50 rounded-full mb-4"></div>
                          <div className="h-6 bg-slate-700/50 rounded-full w-3/4 mb-6"></div>
                          <div className="h-10 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-full w-32"></div>
                        </div>
                      </div>
                    </LoadingSkeleton>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              className="text-center mt-20"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={() => navigate('/menu')}
            >
              <motion.button
                className="group relative px-10 py-5 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-white/20 text-white rounded-full text-xl font-bold shadow-2xl overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 flex items-center space-x-3">
                  <span>🎨</span>
                  <span>Explore Full Gallery</span>
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            </motion.div>
          </div>
        </motion.section>

        {/* Location Tracker Section */}
        <motion.section
          className="py-32 relative"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="container mx-auto px-6">
            <motion.div className="text-center mb-20" variants={itemVariants}>
              <motion.h2
                className="text-5xl sm:text-6xl md:text-7xl font-black mb-8 bg-gradient-to-r from-orange-400 via-red-400 to-pink-500 bg-clip-text text-transparent"
                initial={{ scale: 0.5 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
              >
                NEXT LOCATIONS
              </motion.h2>
              <motion.div
                className="w-40 h-1 bg-gradient-to-r from-orange-400 to-pink-500 mx-auto rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: "10rem" }}
                transition={{ duration: 1.2, delay: 0.5 }}
              />
            </motion.div>
            <AnimatePresence mode="wait">
              {isReady && !loading ? (
                error ? (
                  <motion.div
                    className="text-center py-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="text-9xl mb-8 filter drop-shadow-2xl">🗓️</div>
                    <h3 className="text-4xl font-bold text-white mb-6">Location Data Unavailable</h3>
                    <p className="text-white/60 text-xl">{error}</p>
                  </motion.div>
                ) : upcomingSchedule.length === 0 ? (
                  <motion.div
                    className="text-center py-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="text-9xl mb-8 filter drop-shadow-2xl">🗓️</div>
                    <h3 className="text-4xl font-bold text-white mb-6">Planning Next Adventure...</h3>
                    <p className="text-white/60 text-xl">No locations available at the moment</p>
                  </motion.div>
                ) : (
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.2 }}
                  >
                    {upcomingSchedule.map((schedule, index) => (
                      <motion.div
                        key={schedule._id}
                        className="relative card-gradient-bg backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 group"
                        viewport={{ once: true, margin: "-100px" }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10">
                          <motion.div
                            className="text-6xl mb-6 filter drop-shadow-lg"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                          >
                            📍
                          </motion.div>
                          <motion.h3
                            className="text-lg font-bold text-white mb-4"
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            {new Date(schedule.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </motion.h3>
                          <motion.p
                            className="text-md text-cyan-300 mb-3 flex items-center space-x-3"
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1 + 0.1 }}
                          >
                            <span>🏙️</span>
                            <span>{schedule.location}{schedule.state ? `, ${schedule.state}` : ''}</span>
                          </motion.p>
                          <motion.p
                            className="text-md text-orange-300 font-semibold flex items-center space-x-3 mb-4"
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1 + 0.2 }}
                          >
                            <span>⏰</span>
                            <span>{schedule.startTime} - {schedule.endTime}</span>
                          </motion.p>
                          {schedule.notes && (
                            <motion.p
                              className="text-sm text-white/70 italic bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm mb-4"
                              initial={{ opacity: 0 }}
                              whileInView={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 + 0.3 }}
                            >
                              ✨ {schedule.notes}
                            </motion.p>
                          )}
                          {schedule.coordinates ? (
                            <Wrapper
                              apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                              render={renderMap}
                              libraries={['marker']}
                            >
                              <Map center={{ lat: schedule.coordinates.lat, lng: schedule.coordinates.lng }} />
                            </Wrapper>
                          ) : (
                            <div className="h-64 w-full rounded-3xl bg-gray-700 flex items-center justify-center">
                              <span className="text-gray-400">No map available</span>
                            </div>
                          )}
                          {schedule.coordinates && (
                            <motion.div
                              className="mt-4 text-center"
                              initial={{ opacity: 0 }}
                              whileInView={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 + 0.4 }}
                            >
                              <motion.a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${schedule.coordinates.lat},${schedule.coordinates.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center bg-button-bg-primary text-white px-4 py-2 rounded-full font-semibold text-sm"
                                whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(251, 146, 60, 0.3)' }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <ArrowRightIcon className="h-4 w-4 mr-1" />
                                Get Directions
                              </motion.a>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )
              ) : (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                >
                  {[1, 2, 3].map((index) => (
                    <LoadingSkeleton key={`schedule-skeleton-${index}`}>
                      <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                        <div className="h-12 bg-gradient-to-r from-slate-600/50 to-slate-500/50 rounded-full mb-6 w-40"></div>
                        <div className="h-6 bg-slate-700/50 rounded-full mb-4"></div>
                        <div className="h-5 bg-slate-600/50 rounded-full w-48 mb-4"></div>
                        <div className="h-64 bg-gray-700 rounded-3xl"></div>
                      </div>
                    </LoadingSkeleton>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              className="text-center mt-20"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={() => navigate('/schedule/week')}
            >
              <motion.button
                className="group relative px-10 py-5 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-white/20 text-white rounded-full text-xl font-bold shadow-2xl overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 flex items-center space-x-3">
                  <span>🗺️</span>
                  <span>Track All Locations</span>
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            </motion.div>
          </div>
        </motion.section>

        {/* Testimonials Section */}
        <Testimonials isReady={isReady} isPublic={true} />

        {/* Our Story Section */}
        <motion.section
          className="relative py-32 mb-20 overflow-hidden"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="absolute inset-0">
            {/* <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-900/30 to-slate-950" /> */}
            <motion.div
              className="absolute inset-0 opacity-20"
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <div className="relative z-10 text-center text-white px-8 max-w-6xl mx-auto">
            <motion.div
              className="text-8xl md:text-9xl mb-12 filter drop-shadow-2xl"
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1.5, type: "spring", bounce: 0.6 }}
            >
              🚀
            </motion.div>
            <motion.h2
              className="text-5xl sm:text-6xl md:text-7xl font-black mb-12 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
              initial={{ y: 100, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
            >
              THE REVOLUTION STORY
            </motion.h2>
            <motion.div
              className="w-40 h-1 bg-gradient-to-r from-cyan-400 to-pink-500 mx-auto rounded-full mb-16"
              initial={{ width: 0 }}
              whileInView={{ width: "10rem" }}
              transition={{ duration: 1.5, delay: 0.5 }}
            />
            <motion.p
              className="text-2xl md:text-3xl leading-relaxed max-w-4xl mx-auto mb-12 font-light"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 1 }}
            >
              Born from the fusion of <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-semibold">molecular gastronomy</span> and
              street culture, we're not just serving food—we're creating <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent font-semibold">edible art</span> that tells stories.
            </motion.p>
            <motion.p
              className="text-xl md:text-2xl leading-relaxed max-w-5xl mx-auto mb-16 text-white/80"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              Every technique borrowed from the world's finest kitchens. Every ingredient sourced with purpose.
              Every meal designed to challenge your expectations and elevate your senses.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-8 justify-center items-center"
              initial={{ y: 80, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 1 }}
            >
              <motion.button
                className="group relative px-12 py-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full text-white text-xl font-bold shadow-2xl overflow-hidden"
                whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(139, 92, 246, 0.5)" }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 flex items-center space-x-3">
                  <span>🎨</span>
                  <span>Experience the Art</span>
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.4 }}
                />
              </motion.button>
              <motion.button
                className="group px-12 py-6 border-2 border-white/30 text-white rounded-full text-xl font-bold backdrop-blur-md bg-white/5 hover:bg-white/10 transition-all duration-300"
                whileHover={{ scale: 1.05, borderColor: "rgba(139, 92, 246, 0.8)" }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center space-x-3">
                  <span>📱</span>
                  <span>Join the Movement</span>
                </span>
              </motion.button>
            </motion.div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default Home;  
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from "react-router-dom";
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import Testimonials from '../components/Testimonials';
import { useSelector } from 'react-redux';

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
  const [dataLoaded, setDataLoaded] = useState(false); // New state to track if data was successfully loaded
  const navigate = useNavigate();

  const isMounted = useRef(true);
  const requestCount = useRef(0);
  const dataFetched = useRef(false); // Prevent multiple fetches

  const heroRef = useRef(null);
  const containerRef = useRef(null);
  // const { scrollYProgress } = useScroll({
  //   target: containerRef,
  //   offset: ["start start", "end start"],
  // });

  // const heroY = useTransform(scrollYProgress, [0, 1], [0, -300]);
  // const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.2]);
  // const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const [isReady, setIsReady] = useState(false);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        console.log('Fetching initial data for Home');
        await new Promise((resolve) => setTimeout(resolve, 500)); // Reduced timeout
        console.log('Home data fetching complete, setting isReady to true');
        setIsReady(true);
      } catch (err) {
        console.error('Home fetch error:', err);
      }
    };
    fetchInitialData();
  }, []);

  console.log('Home rendering, isReady:', isReady, 'isAuthenticated:', isAuthenticated, 'dataLoaded:', dataLoaded);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Only fetch data once and if not already fetched
    if (dataFetched.current || requestCount.current > 0) {
      return;
    }

    const fetchData = async () => {
      dataFetched.current = true; // Mark as fetched immediately to prevent duplicate requests
      requestCount.current++;

      try {
        setLoading(true);
        setError(null);

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
          today.setHours(0, 0, 0, 0);

          formattedSchedule = scheduleData
            .filter((item) => new Date(item.date) >= today)
            .map((item) => ({
              _id: item._id,
              date: new Date(item.date),
              location: item.location || 'Unknown Location',
              state: item.state || 'CA',
              startTime: item.startTime || '11:00 AM',
              endTime: item.endTime || '8:00 PM',
              coordinates: item.coordinates || null,
            }))
            .sort((a, b) => a.date - b.date);
        } else {
          console.warn('Failed to fetch schedule data, using empty schedule');
        }

        if (isMounted.current) {
          setFeaturedMenu(formattedMenu.slice(0, 3));
          setUpcomingSchedule(formattedSchedule.slice(0, 3));
          setDataLoaded(true); // Mark data as successfully loaded
        }
      } catch (err) {
        if (isMounted.current) {
          console.error('API Error:', err);
          setError(err.message);
          setFeaturedMenu([]);
          setUpcomingSchedule([]);
          dataFetched.current = false; // Reset on error to allow retry
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
        requestCount.current = Math.max(0, requestCount.current - 1);
      }
    };

    fetchData();
  }, []); // Empty dependency array - only run once on mount

  const handleImageError = (e, setImage) => {
    e.target.onerror = null;
    setImage(fallbackImage);
  };

  const getGridClasses = (itemCount) => {
    if (itemCount === 1) return 'grid grid-cols-1 max-w-7xl mx-auto';
    if (itemCount === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto';
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto';
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

  // Guard against null isAuthenticated to stabilize auth state
  if (isAuthenticated === null) {
    console.log('Waiting for authentication state');
    return (
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white text-center py-20 min-h-screen">
        <motion.div
          className="text-9xl mb-8 filter drop-shadow-2xl"
        >
          🕒
        </motion.div>
        <h3 className="text-4xl font-bold text-white mb-6">Loading...</h3>
        <p className="text-white/60 text-xl">Authenticating your session...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <motion.div
        className="relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Enhanced Hero Section */}
        <motion.section
          ref={heroRef}
          className="relative flex items-center justify-center min-h-[calc(100vh-72px)] overflow-hidden"
        // style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
        >
          {/* Background with enhanced parallax effect */}
          <div
            className="absolute inset-0 z-0 bg-[url('/fb-photo.jpg')] bg-cover bg-center bg-no-repeat"
            style={{
              filter: 'blur(8px) brightness(0.5) contrast(1.2)',
              // transform: 'scale(1.2)'
            }}
          />

          <div className="relative z-10 text-center w-full max-w-7xl mx-auto px-4">
            {/* Enhanced main title with 3D effect */}
            <motion.h1
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-8 relative"
              initial={{ y: 100, opacity: 0, rotateX: 90 }}
              animate={{ y: 0, opacity: 1, rotateX: 0 }}
              transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
              style={{
                textShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 60px rgba(6,182,212,0.3)',
                transform: 'perspective(1000px)'
              }}
            >
              <motion.span
                className="inline-block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent relative"
                style={{
                  backgroundSize: '400% 400%',
                  filter: 'drop-shadow(0 0 20px rgba(6,182,212,0.5))'
                }}
              >
                Bye Bye
              </motion.span>
              <br />
              <motion.span
                className="inline-block bg-gradient-to-r from-orange-400 via-red-400 to-pink-500 bg-clip-text text-transparent relative"
                style={{
                  backgroundSize: '400% 400%',
                  filter: 'drop-shadow(0 0 20px rgba(249,115,22,0.5))'
                }}
              >
                ETIQUETTE
              </motion.span>
            </motion.h1>

            {/* Enhanced subtitle with typewriter effect */}
            <motion.p
              className="text-xl sm:text-2xl md:text-3xl mb-12 text-white max-w-4xl mx-auto leading-relaxed font-light"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.8, duration: 1 }}
              style={{
                textShadow: '0 5px 15px rgba(0,0,0,0.5)',
                filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.1))'
              }}
            >
              Good food that{' '}
              <motion.span
                className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-semibold relative"
              >
                goes places.
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 2.5, duration: 1 }}
                />
              </motion.span>
            </motion.p>

            {/* Enhanced CTA buttons with magnetic effect */}
            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 2.2, duration: 1 }}
            >
              <motion.button
                className="group relative px-6 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full text-white text-xl font-bold shadow-2xl overflow-hidden border-2 border-gray-200"
                whileHover={{
                  scale: 1.1,
                  boxShadow: "0 25px 50px -12px rgba(6,182,212,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
                  borderColor: "rgba(255,255,255,0.2)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/menu")}
                style={{
                  background: 'linear-gradient(45deg, #06b6d4, #8b5cf6, #ec4899)',
                  backgroundSize: '200% 200%'
                }}
              >
                <span className="relative z-10 flex items-center space-x-3">
                  <motion.span
                  >
                    🌟
                  </motion.span>
                  <span>Experience Menu</span>
                </span>
                <motion.div
                  className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10"
                  transition={{ duration: 0.3 }}
                />
              </motion.button>

              <motion.button
                className="group px-9 py-3 border-2 border-white/30 text-white rounded-full text-xl font-bold backdrop-blur-sm bg-white/10 overflow-hidden relative"
                whileHover={{
                  scale: 1.1,
                  borderColor: "rgba(255, 255, 255, 0.8)",
                  boxShadow: "0 15px 35px -5px rgba(255,255,255,0.1)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/location")}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10 flex items-center space-x-3">
                  <motion.span
                  >
                    📍
                  </motion.span>
                  <span>Track Location</span>
                </span>
              </motion.button>
            </motion.div>
          </div>
        </motion.section>

        {/* Featured Creations Section - Show content based on dataLoaded */}
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
              {!loading && dataLoaded ? (
                error ? (
                  <motion.div
                    className="text-center py-20"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <motion.div
                      className="text-9xl mb-8 filter drop-shadow-2xl"
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
              {!loading && dataLoaded ? (
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
                    className={getGridClasses(upcomingSchedule.length)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.2 }}
                  >
                    {upcomingSchedule.map((schedule, index) => (
                      <motion.div
                        key={schedule._id}
                        className="relative card-gradient-bg backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 group w-full"
                        viewport={{ once: true, margin: "-100px" }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10">
                          <motion.div
                            className="text-6xl mb-6 filter drop-shadow-lg"
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
        <Testimonials isReady={isReady} isPublic={!isAuthenticated} />

        {/* Our Story Section */}
        <motion.section
          className="relative py-32 mb-20 overflow-hidden"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="absolute inset-0">
            <motion.div
              className="absolute inset-0 opacity-20"
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
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default Home;
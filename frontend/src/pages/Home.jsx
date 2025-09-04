import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from "react-router-dom";

const fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FF6B35;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23F7931E;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='300' fill='url(%23grad1)'/%3E%3Cg transform='translate(200,150)'%3E%3Ccircle r='40' fill='white' opacity='0.9'/%3E%3Ctext x='0' y='8' text-anchor='middle' fill='%23FF6B35' font-size='24' font-family='Arial'%3E🍕%3C/text%3E%3C/g%3E%3C/svg%3E";

const Home = () => {
  const [featuredMenu, setFeaturedMenu] = useState([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  // Add ref to track mounted state and request count
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

  // Debug useEffect to track re-renders and network requests
  useEffect(() => {
    // console.log('Home component rendered. Request count:', requestCount.current);
  });

  useEffect(() => {
    // Set up cleanup on unmount
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Prevent multiple simultaneous requests
      if (requestCount.current > 0) {
        // console.log('Request already in progress, skipping...');
        return;
      }

      requestCount.current++;
      // console.log('Starting network request #', requestCount.current);

      try {
        setLoading(true);
        setError(null);

        const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 1500));

        // Fetch menu items from the API with AbortController for cleanup
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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

        // Fetch current location from the API
        const locationController = new AbortController();
        const locationTimeoutId = setTimeout(() => locationController.abort(), 10000);

        const locationResponse = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/locations/current`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: locationController.signal
        });

        clearTimeout(locationTimeoutId);

        let formattedSchedule = [];
        if (locationResponse.ok) {
          const locationData = await locationResponse.json();
          formattedSchedule = [{
            _id: locationData._id || 'current',
            date: new Date(locationData.updatedAt || Date.now()),
            location: locationData.currentLocation || 'Unknown Location',
            state: 'CA',
            startTime: '11:00 AM',
            endTime: '8:00 PM',
            notes: 'Current location serving now!',
          }];
        } else {
          console.warn('Failed to fetch location data, using empty schedule');
          // Don't throw error for location - it's less critical than menu
        }

        await minLoadingTime;

        // Only update state if component is still mounted
        if (isMounted.current) {
          setFeaturedMenu(formattedMenu.slice(0, 3));
          setUpcomingSchedule(formattedSchedule.slice(0, 3));
          // console.log('Data loaded successfully');
        }
      } catch (err) {
        // Only update state if component is still mounted
        if (isMounted.current) {
          console.error('API Error:', err);
          setError(err.message);
          setFeaturedMenu([]);
          setUpcomingSchedule([]);
        }
      } finally {
        // Only update state if component is still mounted
        if (isMounted.current) {
          setLoading(false);
        }
        requestCount.current = Math.max(0, requestCount.current - 1);
      }
    };

    fetchData();
  }, []); // Empty dependency array - runs only once on mount

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

  // useEffect(() => {
  //   const testimonialInterval = setInterval(() => {
  //     setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  //   }, 5000);
  //   return () => clearInterval(testimonialInterval);
  // }, []);

  const handleImageError = (e, setImage) => {
    e.target.onerror = null;
    setImage(fallbackImage);
  };

  const testimonials = [
    {
      text: "This isn't just street food - it's a culinary revolution on wheels! Every bite is perfection.",
      author: "Elena Rodriguez",
      role: "Food Critic",
      rating: 5,
      avatar: "🍴",
    },
    {
      text: "I've traveled the world for food, and this truck serves dishes that rival Michelin-starred restaurants.",
      author: "James Chen",
      role: "Travel Blogger",
      rating: 5,
      avatar: "✈️",
    },
    {
      text: "The innovation and quality here is unmatched. They've redefined what food trucks can be.",
      author: "Sofia Martinez",
      role: "Chef",
      rating: 5,
      avatar: "👩‍🍳",
    },
  ];

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
          <p className="text-4xl font-black bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
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
          {/* Background Image with Blur */}
          <div
            className="absolute inset-0 z-0 bg-[url('/fb-photo.jpg')] bg-cover bg-center bg-no-repeat"
            style={{
              filter: 'blur(8px)',
              transform: 'scale(1.1)' // Prevents edges from showing due to blur
            }}
          />

          {/* Overlay to improve text readability */}
          <div className="absolute inset-0 z-1 bg-black/30" />

          {/* Content */}
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
              <motion.p
                className="text-xl text-white/60 mt-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Molecular gastronomy meets street food culture
              </motion.p>
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
                        className="relative bg-gradient-to-br from-slate-900/70 via-slate-800/70 to-slate-900/70 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 group"
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
                            className="text-2xl font-bold text-white mb-4"
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
                            className="text-xl text-cyan-300 mb-3 flex items-center space-x-3"
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1 + 0.1 }}
                          >
                            <span>🏙️</span>
                            <span>{schedule.location}{schedule.state ? `, ${schedule.state}` : ''}</span>
                          </motion.p>
                          <motion.p
                            className="text-lg text-orange-300 font-semibold flex items-center space-x-3 mb-4"
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1 + 0.2 }}
                          >
                            <span>⏰</span>
                            <span>{schedule.startTime} - {schedule.endTime}</span>
                          </motion.p>
                          {schedule.notes && (
                            <motion.p
                              className="text-sm text-white/70 italic bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm"
                              initial={{ opacity: 0 }}
                              whileInView={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 + 0.3 }}
                            >
                              ✨ {schedule.notes}
                            </motion.p>
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
                        <div className="h-5 bg-slate-600/50 rounded-full w-48"></div>
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
                className="text-5xl sm:text-6xl md:text-7xl font-black mb-8 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"
                initial={{ scale: 0.5 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
              >
                TASTE TESTIMONIALS
              </motion.h2>
              <motion.div
                className="w-40 h-1 bg-gradient-to-r from-pink-400 to-cyan-500 mx-auto rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: "10rem" }}
                transition={{ duration: 1.2, delay: 0.5 }}
              />
            </motion.div>
            <motion.div
              className="max-w-5xl mx-auto mb-20"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  className="relative bg-gradient-to-br from-slate-900/70 via-slate-800/70 to-slate-900/70 backdrop-blur-2xl border border-white/10 p-12 rounded-3xl shadow-2xl text-center overflow-hidden"
                  initial={{ opacity: 0, y: 100, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -100, scale: 0.8 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-cyan-500/5" />
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-500"></div>
                  <motion.div
                    className="text-8xl mb-8 filter drop-shadow-lg"
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    {testimonials[currentTestimonial].avatar}
                  </motion.div>
                  <motion.p
                    className="text-2xl md:text-3xl text-white mb-8 leading-relaxed italic font-light"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    "{testimonials[currentTestimonial].text}"
                  </motion.p>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex text-yellow-400 text-2xl">
                      {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
                        >
                          ⭐
                        </motion.span>
                      ))}
                    </div>
                    <div className="text-center">
                      <h4 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        {testimonials[currentTestimonial].author}
                      </h4>
                      <p className="text-white/60 text-lg">{testimonials[currentTestimonial].role}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="flex justify-center space-x-4 mt-12">
                {testimonials.map((_, index) => (
                  <motion.button
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${index === currentTestimonial
                      ? 'bg-gradient-to-r from-pink-500 to-cyan-500 scale-125 shadow-lg'
                      : 'bg-white/30 hover:bg-white/50'
                      }`}
                    onClick={() => setCurrentTestimonial(index)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {[
                { text: "It's like having a Michelin-starred restaurant that comes to your neighborhood!", author: "Marcus Kim", role: "Food Enthusiast", emoji: "🌟" },
                { text: "The molecular techniques combined with comfort food is absolutely genius.", author: "Isabella Santos", role: "Culinary Student", emoji: "🧪" },
                { text: "I've never experienced anything like this. Pure artistry on a plate.", author: "Thomas Wade", role: "Restaurant Owner", emoji: "🎭" },
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  className="relative bg-gradient-to-br from-slate-900/50 via-slate-800/50 to-slate-900/50 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl overflow-hidden group hover:shadow-pink-500/25 transition-all duration-500"
                  initial={{ opacity: 0, y: 100 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                  whileHover={{ scale: 1.03, rotateY: 5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-cyan-500"></div>
                  <div className="relative z-10">
                    <motion.div
                      className="text-5xl mb-6 filter drop-shadow-lg"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                    >
                      {testimonial.emoji}
                    </motion.div>
                    <p className="text-white/90 mb-6 leading-relaxed italic">"{testimonial.text}"</p>
                    <div className="flex flex-col items-start">
                      <p className="font-bold text-xl bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
                        — {testimonial.author}
                      </p>
                      <p className="text-white/60">{testimonial.role}</p>
                      <div className="flex text-yellow-400 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-lg">⭐</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Our Story Section */}
        <motion.section
          className="relative py-32 mb-20 overflow-hidden"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-900/30 to-slate-950" />
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{
                backgroundImage: [
                  'radial-gradient(circle at 20% 20%, #06b6d4 0%, transparent 50%), radial-gradient(circle at 80% 80%, #8b5cf6 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 20%, #06b6d4 0%, transparent 50%), radial-gradient(circle at 20% 80%, #8b5cf6 0%, transparent 50%)',
                  'radial-gradient(circle at 20% 20%, #06b6d4 0%, transparent 50%), radial-gradient(circle at 80% 80%, #8b5cf6 0%, transparent 50%)',
                ],
              }}
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

        {/* Newsletter Section */}
        <motion.section
          className="py-20 text-center"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="container mx-auto px-6">
            <motion.div
              className="relative bg-gradient-to-br from-slate-900/70 via-slate-800/70 to-slate-900/70 backdrop-blur-2xl border border-white/10 p-16 rounded-3xl shadow-2xl max-w-4xl mx-auto overflow-hidden"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5" />
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500" />
              <div className="relative z-10">
                <motion.div
                  className="text-7xl mb-8 filter drop-shadow-lg"
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  🔔
                </motion.div>
                <motion.h3
                  className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                >
                  JOIN THE REVOLUTION
                </motion.h3>
                <motion.p
                  className="text-xl text-white/80 mb-12"
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  Be the first to experience our molecular creations and exclusive locations
                </motion.p>
                <motion.div
                  className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-2xl mx-auto"
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.input
                    type="email"
                    placeholder="Your email for exclusive updates"
                    className="flex-1 px-8 py-5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md focus:outline-none focus:border-purple-400 transition-all duration-300 text-white placeholder-white/60 text-center sm:text-left text-lg"
                    whileFocus={{ scale: 1.02 }}
                  />
                  <motion.button
                    className="group relative px-10 py-5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white rounded-full font-bold shadow-2xl overflow-hidden text-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="relative z-10 flex items-center space-x-2">
                      <span>Subscribe</span>
                      <span>🚀</span>
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100"
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default Home;
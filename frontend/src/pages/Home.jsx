import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';

const Home = () => {
  const [featuredMenu, setFeaturedMenu] = useState([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const heroRef = useRef(null);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        await new Promise(resolve => setTimeout(resolve, 1000));

        const [menuResponse, scheduleResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_BACKEND_API}/api/menu`),
          fetch(`${import.meta.env.VITE_BACKEND_API}/api/schedules?view=week`)
        ]);

        if (!menuResponse.ok || !scheduleResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const [menuData, scheduleData] = await Promise.all([
          menuResponse.json(),
          scheduleResponse.json()
        ]);

        setFeaturedMenu(menuData.slice(0, 3));
        setUpcomingSchedule(scheduleData.slice(0, 3));

      } catch (err) {
        console.error('API Error:', err);
        setError(err.message);
        setFeaturedMenu([]);
        setUpcomingSchedule([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FDBA74;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23FB923C;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='300' fill='url(%23grad1)'/%3E%3Cg transform='translate(200,150)'%3E%3Ccircle r='40' fill='white' opacity='0.9'/%3E%3Ctext x='0' y='8' text-anchor='middle' fill='%23EA580C' font-size='24' font-family='Arial'%3E🍕%3C/text%3E%3C/g%3E%3C/svg%3E";
  };

  const testimonials = [
    {
      text: "Absolutely incredible! The gourmet burgers are restaurant-quality, but with that amazing food truck vibe. The truffle fries changed my life!",
      author: "Sarah Chen",
      rating: 5,
      image: "👩‍🍳"
    },
    {
      text: "Best street tacos in the city! Fresh ingredients, bold flavors, and the staff remembers my order. This is what food trucks should be!",
      author: "Marcus Rodriguez",
      rating: 5,
      image: "👨‍🌾"
    },
    {
      text: "I follow this truck all over town! The seasonal specials are always amazing and the commitment to local ingredients shows in every bite.",
      author: "Emma Thompson",
      rating: 5,
      image: "👩‍💼"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 60, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const cardHoverVariants = {
    initial: { scale: 1, rotateY: 0 },
    hover: {
      // scale: 1.05,
      rotateY: 5,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      ease: "easeInOut"
    }
  };

  const LoadingSkeleton = ({ className, children }) => (
    <div className={`animate-pulse ${className}`}>
      {children}
    </div>
  );

  const InteractiveCard = ({ children, className, ...props }) => {
    const cardRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    return (
      <motion.div
        ref={cardRef}
        className={className}
        variants={cardHoverVariants}
        initial="initial"
        whileHover="hover"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        {...props}
      >
        {children}
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </motion.div>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-orange-200/30 to-red-200/30 rounded-full blur-xl"
          animate={floatingAnimation}
        />
        <motion.div
          className="absolute top-1/3 right-20 w-24 h-24 bg-gradient-to-br from-yellow-200/30 to-orange-200/30 rounded-full blur-xl"
          animate={floatingAnimation}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-40 h-40 bg-gradient-to-br from-red-200/20 to-pink-200/20 rounded-full blur-2xl"
          animate={floatingAnimation}
        />
      </div>

      <motion.div
        className="bg-gradient-to-br from-orange-50 via-white to-red-50 relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <motion.section
            ref={heroRef}
            className="relative flex items-center h-[600px] justify-center overflow-hidden mt-10 sm:mt-20 rounded-3xl p-10"
            style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
          >
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-red-500 to-pink-600 opacity-90" />
              <div className="absolute inset-0 bg-[url('/food_truck_dribble_4x.jpg')] bg-cover blur-[5px] bg-center bg-fixed" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40"
                animate={{
                  background: [
                    "linear-gradient(to top, rgba(0,0,0,0.6), transparent, rgba(0,0,0,0.4))",
                    "linear-gradient(to top, rgba(0,0,0,0.4), transparent, rgba(0,0,0,0.6))",
                    "linear-gradient(to top, rgba(0,0,0,0.6), transparent, rgba(0,0,0,0.4))"
                  ]
                }}
                transition={{ duration: 8 }}
              />
            </div>

            <div className="relative z-10 text-center max-w-6xl mx-auto px-6">

              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-8 text-white"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 1 }}
              >
                <span className="inline-block">
                  <span className="bg-gradient-to-r from-yellow-200 via-orange-200 to-red-200 bg-clip-text text-transparent">
                    Food Truck
                  </span>
                </span>
                <br />
                <span className="inline-block">
                  <span className="bg-gradient-to-r from-red-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
                    Revolution
                  </span>
                </span>
              </motion.h1>

              <motion.p
                className="text-xl sm:text-2xl md:text-3xl mb-12 text-white/90 max-w-4xl mx-auto leading-relaxed font-light"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 1 }}
              >
                Gourmet street food crafted with passion, served with love,
                <br />
                <span className="text-orange-200 font-medium">rolling through your neighborhood daily</span>
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.6, duration: 1 }}
              >
                <motion.div
                  className="relative group w-full"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div> */}
                  <Link
                    to="/menu"
                    className="relative px-10 py-5 bg-white text-orange-600 rounded-full text-lg font-bold shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 flex items-center space-x-3"
                  >
                    <span>🍔</span>
                    <span>Explore Menu</span>
                  </Link>
                </motion.div>

                <motion.div
                  className="relative group w-full"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/schedule/week"
                    className="px-10 py-5 border-2 border-white/30 text-white rounded-full text-lg font-bold backdrop-blur-sm hover:bg-white/10 transition-all duration-300 flex items-center space-x-3"
                  >
                    <span>📍</span>
                    <span>Find Us</span>
                  </Link>
                </motion.div>
              </motion.div>

              {/* <motion.div
                className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2 }}
              >
                <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
                  <div className="w-1 h-3 bg-white/70 rounded-full mt-2"></div>
                </div>
              </motion.div> */}
            </div>
          </motion.section>

          <motion.section
            className="py-20 relative"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div
              className="text-center mb-16"
              variants={itemVariants}
            >
              <motion.h2
                className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-orange-600 via-red-500 to-pink-600 bg-clip-text text-transparent"
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.8 }}
              >
                ✨ Signature Creations
              </motion.h2>
              <div className="w-32 h-1 bg-gradient-to-r from-orange-400 to-red-500 mx-auto rounded-full"></div>
            </motion.div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {[1, 2, 3].map((index) => (
                    <LoadingSkeleton key={index} className="group">
                      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                        <div className="w-full h-64 bg-gradient-to-br from-orange-200 via-orange-300 to-red-300 relative">
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{ x: [-300, 300] }}
                            transition={{ duration: 2, ease: "linear" }}
                          />
                        </div>
                        <div className="p-8">
                          <div className="h-8 bg-gray-200 rounded-full mb-4"></div>
                          <div className="h-6 bg-gray-300 rounded-full w-3/4 mb-4"></div>
                          <div className="h-10 bg-orange-200 rounded-full w-24 mb-6"></div>
                          <div className="h-12 bg-gray-200 rounded-xl"></div>
                        </div>
                      </div>
                    </LoadingSkeleton>
                  ))}
                </motion.div>
              ) : error ? (
                <motion.div
                  className="text-center py-20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.div
                    className="text-8xl mb-8"
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 2 }}
                  >
                    🍽️
                  </motion.div>
                  <h3 className="text-3xl font-bold text-gray-700 mb-4">Oops! Menu's taking a break</h3>
                  <p className="text-gray-500 mb-8 text-lg">{error}</p>
                  <motion.button
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </motion.button>
                </motion.div>
              ) : featuredMenu.length === 0 ? (
                <motion.div
                  className="text-center py-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-8xl mb-8">🍽️</div>
                  <h3 className="text-3xl font-bold text-gray-700 mb-4">Menu coming soon!</h3>
                  <p className="text-gray-500 text-lg">We're cooking up something amazing</p>
                </motion.div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ staggerChildren: 0.2 }}
                >
                  {featuredMenu.map((item, index) => (
                    <InteractiveCard
                      key={item._id}
                      className="group relative bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500"
                      initial={{ opacity: 0, y: 60 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.2, duration: 0.8 }}
                    >
                      <div className="relative overflow-hidden">
                        <motion.img
                          src={item.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FDBA74;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23FB923C;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='300' fill='url(%23grad1)'/%3E%3Cg transform='translate(200,150)'%3E%3Ccircle r='40' fill='white' opacity='0.9'/%3E%3Ctext x='0' y='8' text-anchor='middle' fill='%23EA580C' font-size='24'%3E🍕%3C/text%3E%3C/g%3E%3C/svg%3E"}
                          alt={item.name}
                          className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={handleImageError}
                          whileHover={{ scale: 1.1 }}
                        />
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                        <motion.div
                          className="absolute top-4 right-4 bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: index * 0.2 + 0.5, duration: 0.5 }}
                        >
                          ⭐ Popular
                        </motion.div>
                      </div>

                      <div className="p-8">
                        <motion.h3
                          className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-orange-600 transition-colors duration-300"
                          initial={{ x: -20, opacity: 0 }}
                          whileInView={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          {item.name}
                        </motion.h3>

                        {item.description && (
                          <motion.p
                            className="text-gray-600 mb-4 text-sm leading-relaxed line-clamp-2"
                            initial={{ x: -20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1 + 0.1 }}
                          >
                            {item.description}
                          </motion.p>
                        )}

                        <motion.p
                          className="text-4xl font-black text-orange-600 mb-6"
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.2, type: "spring", bounce: 0.5 }}
                        >
                          ${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price || 0).toFixed(2)}
                        </motion.p>

                        {/* <motion.button
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 group-hover:from-orange-600 group-hover:to-red-600"
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ y: 20, opacity: 0 }}
                          whileInView={{ y: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.3 }}
                        >
                          Add to Cart 🛒
                        </motion.button> */}
                      </div>
                    </InteractiveCard>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="text-center mt-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="relative inline-block group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div> */}
                <Link
                  to="/menu"
                  className="relative px-8 py-4 bg-white text-orange-600 rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-2"
                >
                  <span>🍽️</span>
                  <span>View Full Menu</span>
                </Link>
              </motion.div>
            </motion.div>
          </motion.section>

          <motion.section
            className="py-20 bg-gradient-to-r from-orange-50 to-red-50 rounded-3xl my-20"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div
              className="text-center mb-16"
              variants={itemVariants}
            >
              <motion.h2
                className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-orange-600 via-red-500 to-pink-600 bg-clip-text text-transparent"
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                📍 Catch Us Here
              </motion.h2>
              <div className="w-32 h-1 bg-gradient-to-r from-orange-400 to-red-500 mx-auto rounded-full"></div>
            </motion.div>

            <AnimatePresence mode="wait">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                  {[1, 2, 3].map((index) => (
                    <LoadingSkeleton key={index}>
                      <div className="bg-gradient-to-br from-orange-100 to-red-200 p-8 rounded-3xl shadow-xl">
                        <div className="h-10 bg-orange-300 rounded-full mb-4 w-32"></div>
                        <div className="h-6 bg-orange-300 rounded-full mb-3"></div>
                        <div className="h-5 bg-orange-200 rounded-full w-40"></div>
                      </div>
                    </LoadingSkeleton>
                  ))}
                </div>
              ) : upcomingSchedule.length === 0 ? (
                <motion.div
                  className="text-center py-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-8xl mb-8">📅</div>
                  <h3 className="text-3xl font-bold text-gray-700 mb-4">Schedule loading...</h3>
                  <p className="text-gray-500 text-lg">Stay tuned for our next adventure!</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                  {upcomingSchedule.map((schedule, index) => (
                    <motion.div
                      key={schedule._id}
                      className="relative bg-gradient-to-br from-white via-orange-50 to-red-50 p-8 rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500"
                      initial={{ opacity: 0, x: -50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.2, duration: 0.8 }}
                    // whileHover={{ scale: 1.03, y: -5 }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-300/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-300/30 to-transparent rounded-full translate-y-12 -translate-x-12"></div>

                      <div className="relative z-10">
                        <motion.div
                          className="text-5xl mb-6"
                          // animate={{ rotate: [0, -5, 5, 0] }}
                          transition={{ duration: 4 }}
                        >
                          📅
                        </motion.div>

                        <motion.h3
                          className="text-2xl font-bold text-gray-800 mb-4"
                          initial={{ y: 20, opacity: 0 }}
                          whileInView={{ y: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          {new Date(schedule.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </motion.h3>

                        <motion.p
                          className="text-xl text-gray-700 mb-3 flex items-center space-x-2"
                          initial={{ y: 20, opacity: 0 }}
                          whileInView={{ y: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.1 }}
                        >
                          <span>📍</span>
                          <span>{schedule.location}{schedule.state ? `, ${schedule.state}` : ''}</span>
                        </motion.p>

                        <motion.p
                          className="text-lg text-orange-600 font-semibold flex items-center space-x-2"
                          initial={{ y: 20, opacity: 0 }}
                          whileInView={{ y: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.2 }}
                        >
                          <span>🕒</span>
                          <span>{schedule.startTime} - {schedule.endTime}</span>
                        </motion.p>

                        {schedule.notes && (
                          <motion.p
                            className="text-sm text-gray-600 mt-4 italic bg-white/50 p-3 rounded-lg"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: index * 0.1 + 0.3 }}
                          >
                            💭 {schedule.notes}
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            <motion.div
              className="text-center mt-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="relative inline-block group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div> */}
                <Link
                  to="/schedule/week"
                  className="relative px-8 py-4 bg-white text-orange-600 rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-2"
                >
                  <span>📅</span>
                  <span>Full Schedule</span>
                </Link>
              </motion.div>
            </motion.div>
          </motion.section>

          <motion.section
            className="py-20 relative"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div
              className="text-center mb-16"
              variants={itemVariants}
            >
              <motion.h2
                className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-orange-600 via-red-500 to-pink-600 bg-clip-text text-transparent"
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.8 }}
              >
                💬 What People Say
              </motion.h2>
              <div className="w-32 h-1 bg-gradient-to-r from-orange-400 to-red-500 mx-auto rounded-full"></div>
            </motion.div>

            <motion.div
              className="max-w-4xl mx-auto mb-16"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  className="bg-gradient-to-br from-white to-orange-50 p-10 rounded-3xl shadow-2xl text-center relative overflow-hidden"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500"></div>

                  <motion.div
                    className="text-6xl mb-6"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2 }}
                  >
                    {testimonials[currentTestimonial].image}
                  </motion.div>

                  <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed italic font-light">
                    "{testimonials[currentTestimonial].text}"
                  </p>

                  <div className="flex items-center justify-center space-x-4">
                    <h4 className="text-xl font-bold text-orange-600">
                      {testimonials[currentTestimonial].author}
                    </h4>
                    <div className="flex text-orange-400">
                      {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                        <motion.span
                          key={i}
                          className="text-2xl"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1, duration: 0.3 }}
                        >
                          ⭐
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-center space-x-3 mt-8">
                {testimonials.map((_, index) => (
                  <motion.button
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentTestimonial
                      ? 'bg-orange-500 scale-125'
                      : 'bg-gray-300 hover:bg-orange-300'
                      }`}
                    onClick={() => setCurrentTestimonial(index)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {[
                { text: "The seasonal specials are always incredible! You can taste the creativity in every bite.", author: "David Park", emoji: "👨‍💻" },
                { text: "Best customer service ever! They remember your name and your favorite order.", author: "Rachel Green", emoji: "👩‍🎨" },
                { text: "Finally, gourmet food that doesn't break the bank. This truck is a neighborhood gem!", author: "Alex Rivera", emoji: "👨‍🚀" }
              ].map((testimonial, index) => (
                <InteractiveCard
                  key={index}
                  className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500"></div>

                  <motion.div
                    className="text-4xl mb-4"
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 3, delay: index * 0.5 }}
                  >
                    {testimonial.emoji}
                  </motion.div>

                  <p className="text-gray-700 mb-6 leading-relaxed italic">
                    "{testimonial.text}"
                  </p>

                  <div className="flex items-center justify-between">
                    <p className="font-bold text-orange-600 text-lg">
                      — {testimonial.author}
                    </p>
                    <div className="flex text-orange-400">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-lg">⭐</span>
                      ))}
                    </div>
                  </div>
                </InteractiveCard>
              ))}
            </div>
          </motion.section>

          <motion.section
            className="relative py-20 mb-20 overflow-hidden rounded-3xl"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-orange-600 via-red-500 to-pink-600"
              animate={{
                background: [
                  "linear-gradient(135deg, #ea580c, #dc2626, #be185d)",
                  "linear-gradient(135deg, #dc2626, #be185d, #ea580c)",
                  "linear-gradient(135deg, #be185d, #ea580c, #dc2626)",
                  "linear-gradient(135deg, #ea580c, #dc2626, #be185d)"
                ]
              }}
              transition={{ duration: 8 }}
            />

            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full"
                animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
                transition={{ duration: 6 }}
              />
              <motion.div
                className="absolute top-1/3 right-20 w-16 h-16 bg-white/10 rounded-full"
                animate={{ y: [0, 20, 0], rotate: [360, 180, 0] }}
                transition={{ duration: 8 }}
              />
              <motion.div
                className="absolute bottom-20 left-1/4 w-24 h-24 bg-white/10 rounded-full"
                animate={{ y: [0, -15, 0], rotate: [0, -180, -360] }}
                transition={{ duration: 7 }}
              />
            </div>

            <div className="relative z-10 text-center text-white px-8 max-w-6xl mx-auto">
              <motion.div
                className="text-6xl md:text-7xl mb-8"
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                transition={{ duration: 1, type: "spring", bounce: 0.5 }}
              >
                🚚
              </motion.div>

              <motion.h2
                className="text-4xl sm:text-5xl md:text-6xl font-black mb-8"
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                Our Food Journey
              </motion.h2>

              <motion.div
                className="w-32 h-1 bg-white/80 mx-auto rounded-full mb-12"
                initial={{ width: 0 }}
                whileInView={{ width: "8rem" }}
                transition={{ duration: 1, delay: 0.5 }}
              />

              <motion.p
                className="text-xl md:text-2xl leading-relaxed max-w-4xl mx-auto mb-12 font-light"
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Born from a passion for <span className="font-semibold text-yellow-200">exceptional street food</span>,
                we've been rolling through neighborhoods, serving <span className="font-semibold text-yellow-200">gourmet experiences</span>
                one meal at a time. Our mobile kitchen brings together <span className="font-semibold text-yellow-200">local ingredients</span>,
                innovative recipes, and the warmth of community dining.
              </motion.p>

              <motion.p
                className="text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-12 text-white/90"
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                Every dish tells a story. Every customer becomes family.
                Join us on this delicious adventure! 🍽️❤️
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              >
                <motion.div
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute -inset-1 bg-white/30 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                  <Link
                    to="/menu"
                    className="relative px-8 py-4 bg-white text-orange-600 rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-2"
                  >
                    <span>🍔</span>
                    <span>Try Our Food</span>
                  </Link>
                </motion.div>

                <motion.div
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/schedule/week"
                    className="px-8 py-4 border-2 border-white/50 text-white rounded-full text-lg font-bold backdrop-blur-sm hover:bg-white/10 transition-all duration-300 flex items-center space-x-2"
                  >
                    <span>📱</span>
                    <span>Follow Our Journey</span>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.section>

          <motion.section
            className="py-16 text-center"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div
              className="bg-gradient-to-r from-orange-100 to-red-100 p-12 rounded-3xl shadow-xl max-w-4xl mx-auto"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <motion.h3
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
              >
                Never Miss Our Stops! 📧
              </motion.h3>

              <motion.p
                className="text-lg text-gray-600 mb-8"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Get notified about our locations, new menu items, and special events
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 px-6 py-4 rounded-full border border-orange-200 focus:outline-none focus:border-orange-400 transition-colors duration-300 text-center sm:text-left"
                />
                <motion.button
                  className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Subscribe 🚀
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.section>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
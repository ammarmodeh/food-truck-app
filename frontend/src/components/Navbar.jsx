import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../redux/actions/authActions';

// #1f4499

const Navbar = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isAdminToolsOpen, setIsAdminToolsOpen] = useState(false);
  const [isWaking, setIsWaking] = useState(false);
  const [notification, setNotification] = useState(null);
  const accountMenuRef = useRef(null);
  const adminToolsRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const notificationTimeoutRef = useRef(null);

  // Prevent background scrolling
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest('.lg\\:hidden')
      ) {
        setIsMobileMenuOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
      if (adminToolsRef.current && !adminToolsRef.current.contains(event.target)) {
        setIsAdminToolsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Existing useEffects
  // useEffect(() => {
  //   document.documentElement.classList.toggle('dark', theme === 'dark');
  // }, [theme]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAdminToolsOpen(false);
    setIsAccountMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setIsMobileMenuOpen(false);
    setIsAccountMenuOpen(false);
    setIsAdminToolsOpen(false);
  };

  const handleWakeServer = async () => {
    setIsWaking(true);
    setNotification(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      // console.log('Server response:', data);
      if (response.ok) {
        setNotification({ type: 'success', message: 'Server is awake!' });
      } else {
        setNotification({ type: 'error', message: 'Failed to wake server' });
      }
    } catch (error) {
      console.error('Error waking server:', error);
      setNotification({ type: 'error', message: 'Error waking server' });
    } finally {
      setIsWaking(false);
      notificationTimeoutRef.current = setTimeout(() => {
        setNotification(null);
      }, 5000);
    }
  };

  const closeNotification = () => {
    setNotification(null);
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
  };

  const getUserInitials = () => {
    if (!user?.name) return '?';
    const nameParts = user.name.trim().split(' ');
    return nameParts.length === 1
      ? nameParts[0].charAt(0).toUpperCase()
      : (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const isActivePath = (path) => location.pathname === path;

  const mainNavItems = [
    { name: 'Menu', icon: '🍔', path: '/menu' },
  ];

  const userNavItems = [
    { name: 'Cart', icon: '🛒', path: '/cart' },
    { name: 'Orders', icon: '📋', path: '/orders' },
  ];

  const infoNavItems = [
    { name: 'Schedule', icon: '📅', path: '/schedule/week' },
    { name: 'Location', icon: '📍', path: '/location' },
  ];

  const adminItems = [
    { name: 'Admin', icon: '⚙️', path: '/admin' },
  ];

  const adminToolsItems = [
    { name: 'Orders Mgmt.', icon: '📊', path: '/orders-mgmt' },
    { name: 'Menu Mgmt.', icon: '🍔', path: '/menu-mgmt' },
    { name: 'Schedule Mgmt.', icon: '📅', path: '/schedule-mgmt' },
    { name: 'Reviews Mgmt.', icon: '⭐', path: '/reviews-mgmt' },
  ];

  const navItemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.1, duration: 0.5 },
    }),
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.2 },
    },
  };

  const mobileItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (index) => ({
      opacity: 1,
      x: 0,
      transition: { delay: index * 0.1, duration: 0.3 },
    }),
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } },
  };

  const notificationVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: 50, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  const renderNavItem = (item, index, isMobile = false) => {
    const isActive = isActivePath(item.path);
    const baseClasses = isMobile
      ? 'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300'
      : 'flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300';

    const activeClasses = isActive ? 'bg-white/30 text-white shadow-lg' : 'hover:bg-white/20';

    const motionProps = isMobile
      ? {
        custom: index,
        initial: 'hidden',
        animate: 'visible',
        variants: mobileItemVariants,
      }
      : {
        custom: index,
        initial: 'hidden',
        animate: 'visible',
        variants: navItemVariants,
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
      };

    return (
      <motion.div
        key={item.name}
        className={`${baseClasses} ${activeClasses}`}
        {...motionProps}
      >
        <span className={isMobile ? 'text-xl' : 'text-lg'}>{item.icon}</span>
        <Link
          to={item.path}
          className="font-medium"
          onClick={() => isMobile && setIsMobileMenuOpen(false)}
        >
          {item.name}
        </Link>
        {isActive && !isMobile && (
          <motion.div
            className="w-1 h-1 bg-white rounded-full"
            layoutId="activeIndicator"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          />
        )}
      </motion.div>
    );
  };

  const renderAuthButtons = (isMobile = false) => {
    if (isAuthenticated) {
      return (
        <div className={isMobile ? 'space-y-0' : 'flex items-center space-x-2 ml-4'}>
          {isMobile ? (
            <>
              <motion.div
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/20 transition-all duration-300"
                custom={mainNavItems.length + (isAuthenticated ? userNavItems.length : 0) + infoNavItems.length + (user?.isAdmin ? adminItems.length + adminToolsItems.length : 0)}
                initial="hidden"
                animate="visible"
                variants={mobileItemVariants}
              >
                <span className="text-xl">👤</span>
                <Link
                  to="/profile"
                  className="font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
              </motion.div>
              <motion.div
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-500/20 transition-all duration-300 text-red-200 hover:text-red-100 w-full text-left"
                custom={mainNavItems.length + (isAuthenticated ? userNavItems.length : 0) + infoNavItems.length + (user?.isAdmin ? adminItems.length + adminToolsItems.length : 0) + 1}
                initial="hidden"
                animate="visible"
                variants={mobileItemVariants}
              >
                <span className="text-xl">🚪</span>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="font-medium text-left w-full"
                >
                  Logout
                </button>
              </motion.div>
              <motion.div
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 w-full text-left ${isWaking ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-500/20 text-green-200 hover:text-green-100'}`}
                custom={mainNavItems.length + (isAuthenticated ? userNavItems.length : 0) + infoNavItems.length + (user?.isAdmin ? adminItems.length + adminToolsItems.length : 0) + 2}
                initial="hidden"
                animate="visible"
                variants={mobileItemVariants}
              >
                <span className="text-xl">⚡</span>
                <button
                  onClick={() => {
                    handleWakeServer();
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={isWaking}
                  className="font-medium text-left w-full"
                >
                  {isWaking ? 'Waking...' : 'Wake Server'}
                </button>
              </motion.div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="relative" ref={accountMenuRef}>
                <motion.button
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 font-semibold text-lg hover:bg-white/30 transition-all duration-300"
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {getUserInitials()}
                </motion.button>
                <AnimatePresence>
                  {isAccountMenuOpen && (
                    <motion.div
                      className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-xl shadow-2xl py-2 z-50 border border-gray-700"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={dropdownVariants}
                    >
                      <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-white font-semibold flex justify-between items-center">
                          <span>{user?.name}</span>
                          {user?.isAdmin && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-200">
                              Admin
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 truncate">{user?.phone}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200"
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        <span>👤</span>
                        <span>Profile</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full text-left px-4 py-3 text-red-400 hover:bg-red-900/20 transition-colors duration-200"
                      >
                        <span>🚪</span>
                        <span>Logout</span>
                      </button>
                      <button
                        onClick={handleWakeServer}
                        disabled={isWaking}
                        className={`flex items-center space-x-2 w-full text-left px-4 py-3 transition-colors duration-200 ${isWaking ? 'opacity-50 cursor-not-allowed' : 'text-green-400 hover:bg-green-900/20'}`}
                      >
                        <span>⚡</span>
                        <span>{isWaking ? 'Waking...' : 'Wake Server'}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      );
    }

    const buttonClass = isMobile
      ? 'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300'
      : 'px-6 py-2 rounded-full font-semibold transition-all duration-300';

    const loginButton = isMobile ? (
      <motion.div
        className={`${buttonClass} hover:bg-white/20`}
        custom={mainNavItems.length + infoNavItems.length}
        initial="hidden"
        animate="visible"
        variants={mobileItemVariants}
      >
        <span className="text-xl">🔑</span>
        <Link
          to="/login"
          className="font-medium"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Login
        </Link>
      </motion.div>
    ) : (
      <motion.div
        className={`${buttonClass} bg-white/20 hover:bg-white/30`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Link to="/login">Login</Link>
      </motion.div>
    );

    const registerButton = isMobile ? (
      <motion.div
        className={`${buttonClass} hover:bg-white/20`}
        custom={mainNavItems.length + infoNavItems.length + 1}
        initial="hidden"
        animate="visible"
        variants={mobileItemVariants}
      >
        <span className="text-xl">📝</span>
        <Link
          to="/register"
          className="font-medium"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Register
        </Link>
      </motion.div>
    ) : (
      <motion.div
        className={`${buttonClass} bg-white text-orange-600 hover:bg-gray-100`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Link to="/register">Register</Link>
      </motion.div>
    );

    const wakeServerButton = isMobile ? (
      <motion.div
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 w-full text-left ${isWaking ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-500/20 text-green-200 hover:text-green-100'}`}
        custom={mainNavItems.length + infoNavItems.length + 2}
        initial="hidden"
        animate="visible"
        variants={mobileItemVariants}
      >
        <span className="text-xl">⚡</span>
        <button
          onClick={() => {
            handleWakeServer();
            setIsMobileMenuOpen(false);
          }}
          disabled={isWaking}
          className="font-medium text-left w-full"
        >
          {isWaking ? 'Waking...' : 'Wake Server'}
        </button>
      </motion.div>
    ) : (
      <motion.button
        onClick={handleWakeServer}
        disabled={isWaking}
        className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${isWaking ? 'opacity-50 cursor-not-allowed' : 'bg-green-500/20 hover:bg-green-500/30 text-green-200'}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isWaking ? 'Waking...' : 'Wake Server'}
      </motion.button>
    );

    return isMobile ? (
      <div className="space-y-0">
        {loginButton}
        {registerButton}
        {wakeServerButton}
      </div>
    ) : (
      <div className="flex space-x-2 ml-4 items-center">
        {loginButton}
        {registerButton}
        {wakeServerButton}
      </div>
    );
  };

  const renderAdminSection = (isMobile = false) => {
    if (!isAuthenticated || !user?.isAdmin) return null;

    if (isMobile) {
      return (
        <div className="pt-2 border-t border-white/20 mt-2">
          {adminItems.map((item, index) => (
            <motion.div
              key={item.name}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/20 transition-all duration-300"
              custom={mainNavItems.length + (isAuthenticated ? userNavItems.length : 0) + infoNavItems.length + index}
              initial="hidden"
              animate="visible"
              variants={mobileItemVariants}
            >
              <span className="text-xl">{item.icon}</span>
              <Link
                to={item.path}
                className="font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            </motion.div>
          ))}
          <div className="px-4 py-2 text-gray-300 font-semibold">Admin Tools</div>
          {adminToolsItems.map((item, index) => (
            <motion.div
              key={item.name}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/20 transition-all duration-300 ml-4"
              custom={mainNavItems.length + (isAuthenticated ? userNavItems.length : 0) + infoNavItems.length + adminItems.length + index}
              initial="hidden"
              animate="visible"
              variants={mobileItemVariants}
            >
              <span className="text-xl">{item.icon}</span>
              <Link
                to={item.path}
                className="font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            </motion.div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 ml-2 pl-2 border-l border-white/30">
        {adminItems.map((item, index) => {
          const isActive = isActivePath(item.path);
          return (
            <motion.div
              key={`item.name-${index}`}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${isActive ? 'bg-white/30 text-white shadow-lg' : 'hover:bg-white/20'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>{item.icon}</span>
              <Link to={item.path} className="font-medium">
                {item.name}
              </Link>
              {isActive && (
                <motion.div
                  className="w-1 h-1 bg-white rounded-full"
                  layoutId="adminActiveIndicator"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                />
              )}
            </motion.div>
          );
        })}
        <div className="relative" ref={adminToolsRef}>
          <motion.button
            className="flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 hover:bg-white/20"
            onClick={() => setIsAdminToolsOpen(!isAdminToolsOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>🛠️</span>
            <span className="font-medium">Admin Tools</span>
          </motion.button>
          <AnimatePresence>
            {isAdminToolsOpen && (
              <motion.div
                className="absolute left-0 mt-2 w-64 bg-gray-800 rounded-xl shadow-2xl py-2 z-50 border border-gray-700"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={dropdownVariants}
              >
                {adminToolsItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="flex items-center space-x-2 px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200"
                    onClick={() => setIsAdminToolsOpen(false)}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <motion.nav
      className="sticky top-0 z-40 bg-gradient-to-r from-orange-600/10 via-orange-500/10 to-red-500/10 text-white shadow-3xl backdrop-blur-xl h-[72px]"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#1f4499] via-gray-900 to-black"></div>
      <div className="relative container mx-auto sm:px-6 h-full">
        <div className="flex justify-between items-center h-full px-4">
          <motion.div
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-wide border-1 border-white/70 overflow-hidden"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/" className="block">
              <img src="/LogoByeByeEtiquette.svg" alt="Logo" className="w-25" />
            </Link>
          </motion.div>

          <div className="hidden lg:flex items-center space-x-1">
            {mainNavItems.map((item, index) => renderNavItem(item, index))}
            {isAuthenticated && userNavItems.map((item, index) => renderNavItem(item, mainNavItems.length + index))}
            <div className="flex items-center space-x-2 ml-2 pl-2 border-l border-white/30">
              {infoNavItems.map((item, index) =>
                renderNavItem(item, mainNavItems.length + (isAuthenticated ? userNavItems.length : 0) + index)
              )}
            </div>
            {renderAdminSection()}
            {renderAuthButtons()}
          </div>

          <motion.button
            className="lg:hidden p-2 rounded-lg hover:bg-white/20 transition-all duration-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle mobile menu"
          >
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <motion.div
                className="w-full h-0.5 bg-white rounded"
                animate={{
                  rotate: isMobileMenuOpen ? 45 : 0,
                  y: isMobileMenuOpen ? 6 : 0,
                }}
                transition={{ duration: 0.2 }}
              />
              <motion.div
                className="w-full h-0.5 bg-white rounded"
                animate={{ opacity: isMobileMenuOpen ? 0 : 1 }}
                transition={{ duration: 0.2 }}
              />
              <motion.div
                className="w-full h-0.5 bg-white rounded"
                animate={{
                  rotate: isMobileMenuOpen ? -45 : 0,
                  y: isMobileMenuOpen ? -6 : 0,
                }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </motion.button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              ref={mobileMenuRef}
              className="lg:hidden w-full border-t border-white/20 bg-gradient-to-r from-gray-800 via-gray-900 to-black"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={mobileMenuVariants}
            >
              <div className="flex flex-col space-y-1 h-[calc(100vh-72px)] overflow-y-auto py-8 pb-18">
                {mainNavItems.map((item, index) => renderNavItem(item, index, true))}
                {isAuthenticated && userNavItems.map((item, index) => renderNavItem(item, mainNavItems.length + index, true))}
                <div className="pt-2 border-t border-white/20 mt-2">
                  {infoNavItems.map((item, index) =>
                    renderNavItem(item, mainNavItems.length + (isAuthenticated ? userNavItems.length : 0) + index, true)
                  )}
                </div>
                {renderAdminSection(true)}
                <div className="pt-2 border-t border-white/20 mt-2">
                  {renderAuthButtons(true)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {notification && (
            <motion.div
              className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2 max-w-sm ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={notificationVariants}
            >
              <span>{notification.message}</span>
              <button
                onClick={closeNotification}
                className="text-white hover:text-gray-200 focus:outline-none"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav >
  );
};

export default Navbar;
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../redux/actions/authActions';

const Navbar = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // State management
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  // Effects
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handlers
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setIsMobileMenuOpen(false);
    setIsAccountMenuOpen(false);
  };

  const getUserInitials = () => {
    if (!user?.name) return '?';

    const nameParts = user.name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const isActivePath = (path) => location.pathname === path;

  // Navigation items configuration
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
    { name: 'Orders Mgmt.', icon: '📊', path: '/orders-mgmt' },
    { name: 'Menu Mgmt.', icon: '🍔', path: '/menu-mgmt' },
  ];

  // Animation variants
  const navItemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.1, duration: 0.5 }
    })
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: { duration: 0.3, ease: 'easeInOut' }
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.2 }
    }
  };

  const mobileItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (index) => ({
      opacity: 1,
      x: 0,
      transition: { delay: index * 0.1, duration: 0.3 }
    })
  };

  // Component render methods
  const renderNavItem = (item, index, isMobile = false) => {
    const isActive = isActivePath(item.path);
    const baseClasses = isMobile
      ? "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300"
      : "flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300";

    const activeClasses = isActive
      ? "bg-white/30 text-white shadow-lg"
      : "hover:bg-white/20";

    const motionProps = isMobile
      ? {
        custom: index,
        initial: "hidden",
        animate: "visible",
        variants: mobileItemVariants,
        onClick: () => setIsMobileMenuOpen(false)
      }
      : {
        custom: index,
        initial: "hidden",
        animate: "visible",
        variants: navItemVariants,
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 }
      };

    return (
      <motion.div
        key={item.name}
        className={`${baseClasses} ${activeClasses}`}
        {...motionProps}
      >
        <span className={isMobile ? "text-xl" : "text-lg"}>{item.icon}</span>
        <Link to={item.path} className="font-medium">
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
        <div className={isMobile ? "space-y-0" : "flex items-center space-x-2 ml-4"}>
          {isMobile ? (
            <>
              <motion.div
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/20 transition-all duration-300"
                custom={mainNavItems.length + (isAuthenticated ? userNavItems.length : 0) + infoNavItems.length + (user?.isAdmin ? adminItems.length : 0)}
                initial="hidden"
                animate="visible"
                variants={mobileItemVariants}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-xl">👤</span>
                <Link to="/profile" className="font-medium">Profile</Link>
              </motion.div>
              <motion.button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-500/20 transition-all duration-300 text-red-200 hover:text-red-100 w-full text-left"
                custom={mainNavItems.length + (isAuthenticated ? userNavItems.length : 0) + infoNavItems.length + (user?.isAdmin ? adminItems.length : 0) + 1}
                initial="hidden"
                animate="visible"
                variants={mobileItemVariants}
              >
                <span className="text-xl">🚪</span>
                <span className="font-medium">Logout</span>
              </motion.button>
            </>
          ) : (
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
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl py-2 z-50 border border-gray-100 dark:border-gray-700"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-gray-800 dark:text-white font-semibold flex justify-between items-center">
                        <span>{user?.name}</span>
                        {user?.isAdmin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            Admin
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {user?.email}
                      </p>

                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => setIsAccountMenuOpen(false)}
                    >
                      <span>👤</span>
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                    >
                      <span>🚪</span>
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      );
    }

    // Not authenticated
    const buttonClass = isMobile
      ? "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300"
      : "px-6 py-2 rounded-full font-semibold transition-all duration-300";

    const loginButton = isMobile ? (
      <motion.div
        className={`${buttonClass} hover:bg-white/20`}
        custom={mainNavItems.length + infoNavItems.length}
        initial="hidden"
        animate="visible"
        variants={mobileItemVariants}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <span className="text-xl">🔑</span>
        <Link to="/login" className="font-medium">Login</Link>
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
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <span className="text-xl">📝</span>
        <Link to="/register" className="font-medium">Register</Link>
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

    return isMobile ? (
      <div className="space-y-0">
        {loginButton}
        {registerButton}
      </div>
    ) : (
      <div className="flex space-x-2 ml-4">
        {loginButton}
        {registerButton}
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
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="text-xl">{item.icon}</span>
              <Link to={item.path} className="font-medium">
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
              key={item.name}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${isActive ? 'bg-white/30 text-white shadow-lg' : 'hover:bg-white/20'
                }`}
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
      </div>
    );
  };

  return (
    <motion.nav
      className="sticky top-0 z-40 bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 text-white shadow-2xl backdrop-blur-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-orange-600/95 to-red-500/95"></div>

      <div className="relative container mx-auto px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <motion.div
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-wide"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/" className="block">🚚</Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {mainNavItems.map((item, index) => renderNavItem(item, index))}
            {isAuthenticated && userNavItems.map((item, index) => renderNavItem(item, mainNavItems.length + index))}
            <div className="flex items-center space-x-2 ml-2 pl-2 border-l border-white/30">
              {infoNavItems.map((item, index) => renderNavItem(item, mainNavItems.length + (isAuthenticated ? userNavItems.length : 0) + index))}
            </div>
            {renderAdminSection()}
            {renderAuthButtons()}
          </div>

          {/* Mobile Menu Button */}
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
                  y: isMobileMenuOpen ? 6 : 0
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
                  y: isMobileMenuOpen ? -6 : 0
                }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="lg:hidden mt-4 py-4 border-t border-white/20"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={mobileMenuVariants}
            >
              <div className="flex flex-col space-y-1">
                {mainNavItems.map((item, index) => renderNavItem(item, index, true))}
                {isAuthenticated && userNavItems.map((item, index) => renderNavItem(item, mainNavItems.length + index, true))}
                <div className="pt-2 border-t border-white/20 mt-2">
                  {infoNavItems.map((item, index) => renderNavItem(item, mainNavItems.length + (isAuthenticated ? userNavItems.length : 0) + index, true))}
                </div>
                {renderAdminSection(true)}
                <div className="pt-2 border-t border-white/20 mt-2">
                  {renderAuthButtons(true)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
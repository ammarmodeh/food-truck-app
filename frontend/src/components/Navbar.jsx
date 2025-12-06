import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../redux/actions/authActions';
import { cn } from '../lib/utils';

const Navbar = () => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isAdminToolsOpen, setIsAdminToolsOpen] = useState(false);
  const [isWaking, setIsWaking] = useState(false);
  const [notification, setNotification] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const accountMenuRef = useRef(null);
  const adminToolsRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const notificationTimeoutRef = useRef(null);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setAuthChecked(true), 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !event.target.closest('.lg\\:hidden')) {
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

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAdminToolsOpen(false);
    setIsAccountMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const handleWakeServer = async () => {
    setIsWaking(true);
    setNotification(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/health`);
      if (response.ok) setNotification({ type: 'success', message: 'Server is awake!' });
      else setNotification({ type: 'error', message: 'Failed to wake server' });
    } catch (error) {
      console.error('Error waking server:', error);
      setNotification({ type: 'error', message: 'Error waking server' });
    } finally {
      setIsWaking(false);
      notificationTimeoutRef.current = setTimeout(() => setNotification(null), 5000);
    }
  };

  const getUserInitials = () => {
    if (!user?.name) return '?';
    const parts = user.name.trim().split(' ');
    return parts.length === 1 ? parts[0].charAt(0).toUpperCase() : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const isActivePath = (path) => location.pathname === path;

  const mainNavItems = [{ name: 'Menu', path: '/menu' }];
  const userNavItems = [
    { name: 'Cart', path: '/cart' },
    { name: 'Orders', path: '/orders' },
  ];
  const infoNavItems = [
    { name: 'Schedule', path: '/schedule/week' },
    { name: 'Location', path: '/location' },
  ];
  const adminItems = [{ name: 'Dashboard', path: '/admin' }];
  const adminToolsItems = [
    { name: 'Orders Mgmt.', path: '/orders-mgmt' },
    { name: 'Menu Mgmt.', path: '/menu-mgmt' },
    { name: 'Schedule Mgmt.', path: '/schedule-mgmt' },
    { name: 'CurLocation Mgmt.', path: '/curlocation-mgmt' },
    { name: 'Reviews Mgmt.', path: '/reviews-mgmt' },
  ];

  const renderNavItem = (item, isMobile = false) => {
    const isActive = isActivePath(item.path);
    const baseClasses = isMobile
      ? 'px-3 py-1.5 w-full text-sm font-medium transition-colors hover:bg-muted rounded-md'
      : cn('px-2.5 py-1.5 text-sm font-medium rounded-md transition-colors', isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50');

    return (
      <Link key={item.name} to={item.path} className={baseClasses}>
        {item.name}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-14">
      <div className="container mx-auto px-4 h-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="relative w-8 h-8 overflow-hidden rounded-lg border border-border shadow-sm group-hover:border-primary/50 transition-colors">
            <img src="/LogoByeByeEtiquette.svg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground hidden sm:block">
            Bye Bye Etiquette
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {mainNavItems.map((item) => renderNavItem(item))}
          {isAuthenticated && userNavItems.map((item) => renderNavItem(item))}
          <div className="w-px h-6 bg-border mx-2" />
          {infoNavItems.map((item) => renderNavItem(item))}

          {authChecked && isAuthenticated && (user?.isAdmin || user?.role === 'pos' || user?.role === 'admin') && (
            <>
              <div className="w-px h-6 bg-border mx-2" />
              <Link
                to="/pos"
                className={cn('px-2.5 py-1.5 text-sm font-medium rounded-md transition-colors', isActivePath('/pos') ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50')}
              >
                POS
              </Link>
            </>
          )}

          {authChecked && isAuthenticated && user?.isAdmin && (
            <>
              {adminItems.map((item) => renderNavItem(item))}
              <div className="relative group" ref={adminToolsRef}>
                <button
                  className="px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                  onClick={() => setIsAdminToolsOpen(!isAdminToolsOpen)}
                >
                  Admin Tools
                </button>
                {isAdminToolsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 p-1 bg-card border border-border rounded-lg shadow-lg grid gap-1">
                    <Link
                      to="/pos"
                      className="px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-md"
                      onClick={() => setIsAdminToolsOpen(false)}
                    >
                      POS Dashboard
                    </Link>
                    {adminToolsItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className="px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-md"
                        onClick={() => setIsAdminToolsOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="w-px h-6 bg-border mx-2" />

          {/* Auth Buttons */}
          {!authChecked ? (
            <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
          ) : isAuthenticated ? (
            <div className="relative ml-2" ref={accountMenuRef}>
              <button
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {getUserInitials()}
              </button>
              {isAccountMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 p-1 bg-card border border-border rounded-lg shadow-lg z-50">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="font-medium text-sm text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email || user?.phone}</p>
                  </div>
                  <Link to="/profile" className="px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors" onClick={() => setIsAccountMenuOpen(false)}>
                    Profile
                  </Link>
                  <button onClick={handleLogout} className="w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors text-left">
                    Logout
                  </button>
                  <button onClick={handleWakeServer} disabled={isWaking} className="w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors text-left mt-1 border-t border-border">
                    {isWaking ? 'Wake...' : 'Wake Server'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Login</Link>
              <Link to="/register" className="compact-button bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-sm shadow-sm">Register</Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden p-2 text-muted-foreground hover:bg-muted rounded-md"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <div className="w-5 h-5 flex items-center justify-center relative">
            <span className={`absolute h-0.5 w-full bg-current transform transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45' : '-translate-y-1.5'}`} />
            <span className={`absolute h-0.5 w-full bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
            <span className={`absolute h-0.5 w-full bg-current transform transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45' : 'translate-y-1.5'}`} />
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border bg-background shadow-xl overflow-y-auto max-h-[calc(100vh-3.5rem)]"
          >
            <div className="px-4 py-4">
              <div className="flex flex-col gap-1">
                {mainNavItems.map(item => renderNavItem(item, true))}
                {isAuthenticated && userNavItems.map(item => renderNavItem(item, true))}
                <div className="h-px bg-border my-2" />
                {infoNavItems.map(item => renderNavItem(item, true))}

                {/* POS Link for mobile */}
                {authChecked && isAuthenticated && (user?.isAdmin || user?.role === 'pos' || user?.role === 'admin') && (
                  <>
                    <div className="h-px bg-border my-2" />
                    <Link
                      to="/pos"
                      className="px-3 py-1.5 w-full text-sm font-medium transition-colors hover:bg-muted rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      POS
                    </Link>
                  </>
                )}

                {isAuthenticated && user?.isAdmin && (
                  <>
                    <div className="h-px bg-border my-2" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase px-3 mb-1">Admin</p>
                    {adminItems.map(item => renderNavItem(item, true))}
                    {adminToolsItems.map(item => renderNavItem(item, true))}
                  </>
                )}
                <div className="h-px bg-border my-2" />
                {!isAuthenticated ? (
                  <div className="flex flex-col gap-2 mt-2">
                    <Link to="/login" className="w-full text-center py-2 text-sm font-medium border border-border rounded-md hover:bg-muted" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                    <Link to="/register" className="w-full text-center py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <Link to="/profile" className="px-3 py-1.5 text-sm font-medium hover:bg-muted rounded-md" onClick={() => setIsMobileMenuOpen(false)}>
                      Profile
                    </Link>
                    <button onClick={handleLogout} className="px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md w-full text-left">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-sm font-medium z-[100] ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-destructive text-white'}`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </nav >
  );
};

export default Navbar;
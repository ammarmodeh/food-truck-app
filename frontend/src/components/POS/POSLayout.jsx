import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { Squares2X2Icon, ClipboardDocumentListIcon, UserGroupIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, ShieldCheckIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/actions/authActions';
import axios from 'axios';
import { useNotification } from '../../context/NotificationContext';

const POSLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { user } = useSelector(state => state.auth);

  const [hasShift, setHasShift] = useState(null); // null = loading
  const [startCash, setStartCash] = useState('');
  const [showStartModal, setShowStartModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const checkShift = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/shifts/current`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (data) {
        setHasShift(true);
      } else {
        setHasShift(false);
        setShowStartModal(true);
      }
    } catch (error) {
      console.error(error);
      setHasShift(false);
      setShowStartModal(true);
    }
  };

  useEffect(() => {
    checkShift();
  }, []);

  const handleStartShift = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/api/shifts/start`,
        { startCash: Number(startCash) },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setHasShift(true);
      setShowStartModal(false);
      notify('Shift started successfully', 'success');
    } catch (error) {
      notify('Failed to start shift', 'error');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/pos/login');
  };

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsAdmin(payload.role === 'admin' || payload.isAdmin);
      } catch (e) { console.error(e); }
    }
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/pos', icon: Squares2X2Icon, end: true },
    { name: 'Orders', path: '/pos/orders', icon: ClipboardDocumentListIcon },
    { name: 'Customers', path: '/pos/customers', icon: UserGroupIcon },
    ...(isAdmin ? [{ name: 'Logs', path: '/pos/logs', icon: ShieldCheckIcon }] : []),
    { name: 'Settings', path: '/pos/settings', icon: Cog6ToothIcon },
  ];

  if (hasShift === false && showStartModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm text-gray-800 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center border border-gray-100">
          <div className="mb-6 bg-orange-50 w-20 h-20 mx-auto rounded-full flex items-center justify-center">
            <span className="text-4xl">🌤️</span>
          </div>
          <h2 className="text-3xl font-bold mb-2 text-gray-900">Good Morning!</h2>
          <p className="text-gray-500 mb-8">Enter your opening cash to start the shift.</p>
          <form onSubmit={handleStartShift}>
            <div className="mb-6 text-left">
              <label className="block text-xs font-bold mb-2 text-gray-400 uppercase tracking-wider">Starting Cash Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-gray-400 font-bold">$</span>
                <input
                  type="number"
                  value={startCash}
                  onChange={(e) => setStartCash(e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 pl-8 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none text-lg font-bold transition-all"
                  placeholder="0.00"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-200 hover:shadow-orange-300 active:scale-95"
            >
              Open Register
            </button>
          </form>
          <div className="mt-6 border-t border-gray-100 pt-4">
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600 font-medium">Log out</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 flex flex-col justify-between transition-all duration-300 shadow-sm z-20`}>
        <div>
          <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-6'} border-b border-gray-100`}>
            {!isCollapsed && <h1 className="text-xl font-extrabold text-orange-600 tracking-tight">FoodTruck<span className="text-gray-400">POS</span></h1>}
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              {isCollapsed ? <ChevronDoubleRightIcon className="h-5 w-5" /> : <ChevronDoubleLeftIcon className="h-5 w-5" />}
            </button>
          </div>

          <nav className="mt-6 flex flex-col gap-2 p-3">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
              >
                <item.icon className={`h-6 w-6 transition-colors ${isCollapsed ? '' : ''}`} />
                {!isCollapsed && <span className="font-semibold">{item.name}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-3 mb-2">
          {!isCollapsed && user && (
            <div className="mb-4 px-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 leading-tight">{user.name || 'User'}</p>
                <p className="text-xs text-gray-400">{isAdmin ? 'Administrator' : 'Staff'}</p>
              </div>
            </div>
          )}
          <Link
            to="/"
            className={`flex items-center gap-3 p-3 w-full rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors mb-2 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {!isCollapsed && <span className="font-semibold">Back to Website</span>}
          </Link>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 p-3 w-full rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};

export default POSLayout;

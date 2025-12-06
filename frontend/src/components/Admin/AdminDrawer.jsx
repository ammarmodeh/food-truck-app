import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  XMarkIcon,
  Cog6ToothIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  FireIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'; // Outline icons

const AdminDrawer = ({ isOpen, onClose, allOrders }) => {
  const [activeTab, setActiveTab] = useState('processes'); // default tab
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch Users and Logs when drawer opens and tab changes to them
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'clients' && users.length === 0) fetchUsers();
      if (activeTab === 'logs' && logs.length === 0) fetchLogs();
    }
  }, [isOpen, activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/auth/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/audits`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter active processes from passed orders
  const processes = allOrders.filter(o => ['Pending', 'Preparing'].includes(o.status));

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const drawerVariants = {
    hidden: { x: '100%' },
    visible: { x: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed inset-y-0 right-0 w-full bg-white shadow-2xl z-50 flex flex-col"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Admin Control Panel</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {[
                { id: 'processes', icon: FireIcon, label: 'Processes' },
                { id: 'clients', icon: UsersIcon, label: 'Clients' },
                { id: 'logs', icon: ClipboardDocumentListIcon, label: 'Logs' },
                { id: 'settings', icon: Cog6ToothIcon, label: 'Settings' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center py-4 text-xs font-semibold gap-1 transition-colors ${activeTab === tab.id
                    ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                    : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50">
              <div className="max-w-6xl mx-auto p-6">

                {/* TAB: PROCESSES */}
                {activeTab === 'processes' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-gray-900">Active Kitchen Stream</h3>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">
                        {processes.length} Live
                      </span>
                    </div>
                    {processes.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">Kitchen is clear!</div>
                    ) : (
                      processes.map(order => (
                        <div key={order._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                          <div>
                            <div className="font-bold text-gray-900">#{order.orderNumber || order._id.slice(-6)}</div>
                            <div className="text-xs text-gray-500">{order.items?.length} items • {new Date(order.createdAt).toLocaleTimeString()}</div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${order.status === 'Preparing' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {order.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB: CLIENTS */}
                {activeTab === 'clients' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 mb-2">Registered Clients</h3>
                    {loading ? (
                      <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-2 border-orange-600 rounded-full border-t-transparent"></div></div>
                    ) : (
                      users.map(u => (
                        <div key={u._id} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{u.name}</div>
                            <div className="text-xs text-gray-500 truncate">{u.email}</div>
                          </div>
                          {u.isAdmin && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">ADMIN</span>}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB: LOGS */}
                {activeTab === 'logs' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 mb-2">System Audit Logs</h3>
                    {loading ? (
                      <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-2 border-orange-600 rounded-full border-t-transparent"></div></div>
                    ) : logs.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">No recent logs found.</div>
                    ) : (
                      logs.map((log, i) => (
                        <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 text-sm">
                          <div className="flex gap-2">
                            <ExclamationTriangleIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                              <div className="text-gray-900 font-medium">
                                {log.action || 'System Action'}
                              </div>
                              <div className="text-gray-500 text-xs mt-0.5">
                                {typeof log.details === 'object' && log.details !== null
                                  ? JSON.stringify(log.details, null, 2)
                                  : (log.details || 'No details provided')}
                              </div>
                              <div className="text-right text-[10px] text-gray-400 mt-2">
                                {new Date(log.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB: SETTINGS */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <h3 className="font-bold text-gray-900">Quick Settings</h3>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">Maintenance Mode</div>
                        <div className="relative inline-flex items-center cursor-not-allowed opacity-60">
                          <input type="checkbox" className="sr-only peer" disabled />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Temporarily disable user access. (Enabled in Settings Page only)</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">Sound Notifications</div>
                        <div className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Play chime on new orders.</p>
                    </div>

                    <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-xs">
                      For full system settings, please visit the dedicated <a href="/admin/settings" className="font-bold underline">Settings Page</a>.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AdminDrawer;

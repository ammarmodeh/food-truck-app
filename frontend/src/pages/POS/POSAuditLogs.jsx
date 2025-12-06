import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNotification } from '../../context/NotificationContext';

const POSAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const { notify } = useNotification();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/audits`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLogs(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      notify('Failed to fetch audit logs', 'error');
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchUser = log.user?.name.toLowerCase().includes(filterUser.toLowerCase()) || '';
    const matchAction = log.action.toLowerCase().includes(filterAction.toLowerCase());
    return matchUser && matchAction;
  });

  return (
    <div className="p-6 h-full bg-gray-900 text-white overflow-hidden flex flex-col">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <span className="text-orange-500">🛡️</span> Audit Logs
      </h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6 bg-gray-800 p-4 rounded-xl shadow-md">
        <input
          type="text"
          placeholder="Filter by User..."
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 flex-1"
        />
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 flex-1"
        >
          <option value="">All Actions</option>
          <option value="SHIFT_OPEN">Shift Open</option>
          <option value="SHIFT_CLOSE">Shift Close</option>
          <option value="REFUND_ORDER">Refund Order</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-700 sticky top-0 z-10">
            <tr>
              <th className="p-4 font-bold text-gray-300 border-b border-gray-600">Timestamp</th>
              <th className="p-4 font-bold text-gray-300 border-b border-gray-600">User</th>
              <th className="p-4 font-bold text-gray-300 border-b border-gray-600">Role</th>
              <th className="p-4 font-bold text-gray-300 border-b border-gray-600">Action</th>
              <th className="p-4 font-bold text-gray-300 border-b border-gray-600">Details</th>
              <th className="p-4 font-bold text-gray-300 border-b border-gray-600">IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-400">Loading logs...</td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-400">No logs found.</td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log._id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                  <td className="p-4 text-gray-300 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-4 font-semibold text-white">{log.user?.name || 'Unknown'}</td>
                  <td className="p-4 text-sm text-gray-400 uppercase">{log.user?.role || '-'}</td>
                  <td className="p-4 font-mono text-orange-400 text-sm">{log.action}</td>
                  <td className="p-4 text-gray-300 text-xs font-mono max-w-xs truncate" title={JSON.stringify(log.details, null, 2)}>
                    {JSON.stringify(log.details)}
                  </td>
                  <td className="p-4 text-gray-500 text-xs">{log.ip || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default POSAuditLogs;

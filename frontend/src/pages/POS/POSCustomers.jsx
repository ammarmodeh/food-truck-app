import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MagnifyingGlassIcon, UserCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline'; // Updated icons for lighter feel

const POSCustomers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/auth/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(search.toLowerCase())) ||
    (user.phone && user.phone.includes(search))
  );

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50 text-gray-900">
      <div className="mb-8 flex items-center gap-3">
        <UserGroupIcon className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm">View and manage registered customers.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8 max-w-lg">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          className="w-full bg-white text-gray-900 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-200 shadow-sm transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 custom-scrollbar content-start">
        {loading ? (
          <div className="col-span-full text-center text-gray-400 py-10">Loading customers...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-10 text-gray-400">
            <UserCircleIcon className="h-12 w-12 mb-2 opacity-20" />
            <p>No customers found.</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user._id} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow group">
              <div className="bg-orange-50 p-3 rounded-full flex-shrink-0">
                <UserCircleIcon className="h-8 w-8 text-orange-500" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-lg text-gray-800 truncate">{user.name}</h3>
                <p className="text-gray-500 text-sm truncate">{user.email || 'No Email'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-gray-900 text-sm font-medium">{user.phone || 'No Phone'}</p>
                </div>
                <span className="inline-block mt-3 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded uppercase tracking-wide">
                  Registered
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default POSCustomers;

import React, { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import axios from 'axios';
import { useNotification } from '../../context/NotificationContext';
import { Cog6ToothIcon, SpeakerWaveIcon, PrinterIcon, ComputerDesktopIcon, CreditCardIcon } from '@heroicons/react/24/outline';

const POSSettings = () => {
  const { notify } = useNotification();
  const [settings, setSettings] = useState({
    testMode: false,
    soundEnabled: true,
    autoPrintReceipt: false,
    darkMode: false,
  });

  const [shift, setShift] = useState(null);
  const [endCash, setEndCash] = useState('');
  const [showMyLogs, setShowMyLogs] = useState(false);
  const [myLogs, setMyLogs] = useState([]);

  useEffect(() => {
    const fetchShift = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/shifts/current`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setShift(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchShift();
  }, []);

  const fetchMyLogs = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/audits/my`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMyLogs(data);
    } catch (error) {
      console.error(error);
      notify('Failed to load activity history', 'error');
    }
  };

  useEffect(() => {
    if (showMyLogs) {
      fetchMyLogs();
    }
  }, [showMyLogs]);

  const handleCloseRegister = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to close the register? This will end your shift.')) return;
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/api/shifts/end`,
        { endCash: Number(endCash) },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      notify('Register closed successfully', 'success');
      setShift(null);
      window.location.reload();
    } catch (error) {
      notify('Failed to close register', 'error');
    }
  };


  const toggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const Option = ({ label, description, checked, onChange, icon: Icon }) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl mb-3 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-6 w-6 text-gray-400" />}
        <div>
          <h3 className="font-semibold text-gray-800">{label}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onChange={onChange}
        className={`${checked ? 'bg-orange-600' : 'bg-gray-200'
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`}
      >
        <span
          className={`${checked ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`}
        />
      </Switch>
    </div>
  );

  return (
    <div className="p-6 h-full bg-gray-50 text-gray-900 mx-auto overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-3 mb-8">
        <Cog6ToothIcon className="h-8 w-8 text-orange-600" />
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">

        {/* Left Column: Shift Management */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5 text-orange-500" /> Shift Management
            </h2>
            {shift ? (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-gray-500 mb-1">Started At</p>
                    <p className="font-bold text-gray-900">{new Date(shift.startTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Starting Cash</p>
                    <p className="font-bold text-gray-900">${shift.startCash.toFixed(2)}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <label className="block text-sm font-bold mb-2 text-gray-700">Closing Cash Draw ($)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={endCash}
                      onChange={(e) => setEndCash(e.target.value)}
                      className="flex-1 bg-white text-gray-900 p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      placeholder="0.00"
                    />
                    <button
                      onClick={handleCloseRegister}
                      disabled={!endCash}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      Close Register
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 italic mb-4">No active shift.</p>
                <p className="text-sm text-gray-500">Go to Dashboard to open register.</p>
              </div>
            )}

            <div className="mt-6 border-t border-gray-100 pt-4">
              <button
                onClick={() => setShowMyLogs(true)}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>📜</span> View My Activity History
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Preferences */}
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">General Preferences</h2>
            <Option
              label="Sound Effects"
              description="Play sounds for new orders and notifications."
              checked={settings.soundEnabled}
              onChange={() => toggle('soundEnabled')}
              icon={SpeakerWaveIcon}
            />
            <Option
              label="Test Mode"
              description="Use dummy data for payments and orders."
              checked={settings.testMode}
              onChange={() => toggle('testMode')}
              icon={ComputerDesktopIcon}
            />
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Printing & Hardware</h2>
            <Option
              label="Auto-Print Receipt"
              description="Automatically print receipt after successful checkout."
              checked={settings.autoPrintReceipt}
              onChange={() => toggle('autoPrintReceipt')}
              icon={PrinterIcon}
            />
          </section>

          <section>
            <div className="p-4 bg-gray-100 rounded-xl text-center">
              <p className="text-gray-500 text-sm mb-1">POS Version</p>
              <p className="text-lg font-mono font-bold text-gray-700">v1.2.0 (Beta)</p>
            </div>
          </section>
        </div>
      </div>

      {/* My Activity Modal */}
      {showMyLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">My Activity History</h2>
              <button onClick={() => setShowMyLogs(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white">
              {myLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <p>No activity recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myLogs.map(log => (
                    <div key={log._id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-orange-600 text-sm px-2 py-0.5 bg-orange-50 rounded-md border border-orange-100">{log.action}</span>
                        <span className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-gray-600 font-mono break-all bg-white p-2 rounded border border-gray-200">
                        {JSON.stringify(log.details, null, 2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSSettings;

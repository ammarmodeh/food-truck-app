import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  XCircleIcon,
  Cog6ToothIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { useNotification } from '../context/NotificationContext';
import { updateUser, clearErrors } from '../redux/actions/authActions';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

const Profile = () => {
  const { user, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [verifyMode, setVerifyMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || '', phone: user.phone || '' });
    }
  }, [user]);

  useEffect(() => {
    if (error) {
      notify(error, 'error');
      dispatch(clearErrors());
    }
  }, [error, notify, dispatch]);

  const setupRecaptcha = () => {
    if (!auth) {
      console.error('Firebase auth is undefined');
      notify('Firebase auth not initialized', 'error');
      return null;
    }

    const container = document.getElementById('recaptcha-container-profile');
    if (!container) {
      console.error('reCAPTCHA container not found');
      notify('reCAPTCHA container not found', 'error');
      return null;
    }

    try {
      const verifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container-profile',
        {
          size: 'normal',
          callback: (response) => {
            setRecaptchaError(null);
          },
          'expired-callback': () => {
            window.recaptchaVerifierProfile = null;
            setRecaptchaError('reCAPTCHA expired. Please try again.');
            setTimeout(() => {
              window.recaptchaVerifierProfile = setupRecaptcha();
            }, 1000);
          },
        }
      );
      return verifier;
    } catch (err) {
      console.error('Error initializing RecaptchaVerifier:', err.code, err.message);
      setRecaptchaError(err.message);
      notify(`Failed to initialize reCAPTCHA: ${err.message}`, 'error');
      return null;
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const sendOtp = async () => {
    try {
      setLoading(true);

      if (!auth) {
        notify('Firebase auth not initialized', 'error');
        return;
      }

      const verifier = setupRecaptcha();
      if (!verifier) {
        notify('reCAPTCHA not initialized', 'error');
        return;
      }

      window.recaptchaVerifierProfile = verifier;

      const phoneRegex = /^\+\d{10,15}$/;
      const phoneNumber = formData.phone;

      if (!phoneRegex.test(phoneNumber)) {
        notify('Invalid phone number format. Use + followed by country code and number.', 'error');
        return;
      }

      const result = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifierProfile);

      setConfirmationResult(result);
      setVerifyMode(true);
      setRecaptchaError(null);
      notify('OTP sent to your phone number', 'success');

    } catch (err) {
      console.error('Error in sendOtp:', err.code, err.message);
      notify(`Failed to send OTP: ${err.message}`, 'error');

      if (window.recaptchaWidgetIdProfile) {
        window.grecaptcha.reset(window.recaptchaWidgetIdProfile);
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndUpdateProfile = async () => {
    if (!confirmationResult) {
      notify('Please request OTP first', 'error');
      return;
    }

    try {
      setLoading(true);
      await confirmationResult.confirm(otp);

      const updateData = {
        ...formData,
        phoneVerified: true
      };
      await dispatch(updateUser(updateData));

      notify('Phone number verified and profile updated successfully!', 'success');
      setEditMode(false);
      setVerifyMode(false);

    } catch (err) {
      console.error('Error in verifyOtp:', err.code, err.message);
      notify(`Invalid OTP: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateProfileWithoutPhoneChange = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await dispatch(updateUser(formData));
      notify('Profile updated successfully!', 'success');
      setEditMode(false);
    } catch (err) {
      // Error is handled by Redux and useEffect
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    setVerifyMode(false);
    setFormData({ name: user.name || '', phone: user.phone || '' });
    setOtp('');
    setConfirmationResult(null);

    if (window.recaptchaVerifierProfile) {
      window.recaptchaVerifierProfile.clear();
      window.recaptchaVerifierProfile = null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-gray-200 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Please log in</h3>
          <p className="text-gray-500 mb-6">You need to be logged in to view your profile.</p>
          <motion.button
            className="bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-700 shadow-md transition"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/login')}
          >
            Log In
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">

              {/* Profile Header */}
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                  <p className="text-sm text-gray-500">{user.phone}</p>
                </div>
                {user.isAdmin && (
                  <span className="flex items-center gap-1.5 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-medium text-sm">
                    <ShieldCheckIcon className="h-4 w-4" />
                    Admin
                  </span>
                )}
              </div>

              <AnimatePresence mode="wait">
                {editMode ? (
                  /* Edit Form */
                  <motion.form
                    key="edit"
                    onSubmit={updateProfileWithoutPhoneChange}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number {formData.phone !== user.phone && '(New number requires verification)'}
                      </label>
                      <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
                        required
                      />

                      {formData.phone !== user.phone && (
                        <motion.button
                          type="button"
                          onClick={sendOtp}
                          className="mt-3 bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-orange-700 shadow-sm transition"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={loading}
                        >
                          {loading ? 'Sending OTP...' : 'Verify New Phone Number'}
                        </motion.button>
                      )}
                    </div>

                    {verifyMode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-orange-50 rounded-xl border border-orange-200"
                      >
                        <h4 className="font-semibold text-orange-900 mb-2">Verify Phone Number</h4>
                        <p className="text-sm text-orange-700 mb-3">
                          Enter the OTP sent to {formData.phone}
                        </p>

                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="Enter OTP"
                          className="w-full p-3 rounded-xl bg-white border border-orange-300 text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none mb-3"
                          required
                        />

                        <div className="flex gap-2">
                          <motion.button
                            type="button"
                            onClick={verifyOtpAndUpdateProfile}
                            className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-green-700 transition"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={loading}
                          >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                          </motion.button>

                          <motion.button
                            type="button"
                            onClick={() => setVerifyMode(false)}
                            className="bg-gray-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-gray-600 transition"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Cancel Verification
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    <div id="recaptcha-container-profile"></div>

                    {recaptchaError && (
                      <div className="p-3 bg-yellow-50 text-yellow-800 rounded-xl text-sm border border-yellow-200">
                        {recaptchaError}
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                      <motion.button
                        type="button"
                        onClick={cancelEdit}
                        className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>

                      <motion.button
                        type="submit"
                        className="bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 shadow-md transition"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading || (formData.phone !== user.phone && !verifyMode)}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </motion.button>
                    </div>
                  </motion.form>
                ) : (
                  /* View Mode */
                  <motion.div
                    key="view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-500 mb-1">Full Name</p>
                        <p className="text-lg font-semibold text-gray-900">{user.name || 'N/A'}</p>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-500 mb-1">Phone Number</p>
                        <p className="text-lg font-semibold text-gray-900">{user.phone || 'N/A'}</p>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl sm:col-span-2">
                        <p className="text-sm font-medium text-gray-500 mb-2">Verification Status</p>
                        {user.phoneVerified ? (
                          <span className="inline-flex items-center gap-1.5 text-green-700 font-medium">
                            <CheckBadgeIcon className="h-5 w-5" />
                            Phone Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-red-600 font-medium">
                            <XCircleIcon className="h-5 w-5" />
                            Phone Not Verified
                          </span>
                        )}
                      </div>
                    </div>

                    <motion.button
                      onClick={() => setEditMode(true)}
                      className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 shadow-md transition"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      Edit Profile
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Admin Quick Links */}
            {user.isAdmin && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
                  Admin Tools
                </h3>
                <div className="space-y-2">
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition group"
                  >
                    <TableCellsIcon className="h-5 w-5 group-hover:text-orange-600" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                  <Link
                    to="/orders-mgmt"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition group"
                  >
                    <TableCellsIcon className="h-5 w-5 group-hover:text-orange-600" />
                    <span className="font-medium">Orders Management</span>
                  </Link>
                  <Link
                    to="/menu-mgmt"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition group"
                  >
                    <TableCellsIcon className="h-5 w-5 group-hover:text-orange-600" />
                    <span className="font-medium">Menu Management</span>
                  </Link>
                  <Link
                    to="/admin/settings"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition group"
                  >
                    <Cog6ToothIcon className="h-5 w-5 group-hover:text-orange-600" />
                    <span className="font-medium">Settings</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Account Info */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Account Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Type</span>
                  <span className="font-medium text-gray-900">{user.isAdmin ? 'Administrator' : 'Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default Profile;
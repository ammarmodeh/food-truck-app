import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { UserIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
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
      // console.log('Initializing RecaptchaVerifier with size: normal');
      const verifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container-profile',
        {
          size: 'normal',
          callback: (response) => {
            // console.log('reCAPTCHA verified:', response);
            setRecaptchaError(null);
          },
          'expired-callback': () => {
            // console.log('reCAPTCHA expired');
            window.recaptchaVerifierProfile = null;
            setRecaptchaError('reCAPTCHA expired. Please try again.');
            setTimeout(() => {
              window.recaptchaVerifierProfile = setupRecaptcha();
            }, 1000);
          },
        }
      );
      // console.log('RecaptchaVerifier initialized:', verifier);
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

      // console.log('Sending OTP to:', phoneNumber);
      const result = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifierProfile);
      // console.log('signInWithPhoneNumber result:', result);

      setConfirmationResult(result);
      setVerifyMode(true);
      setRecaptchaError(null);
      notify('OTP sent to your phone number', 'success');

    } catch (err) {
      console.error('Error in sendOtp:', err.code, err.message);
      notify(`Failed to send OTP: ${err.message}`, 'error');

      // Reset reCAPTCHA on error
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

      // OTP verified, now update profile with phoneVerified: true
      const updateData = {
        ...formData,
        phoneVerified: true  // Explicitly set phoneVerified to true
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

    // Clean up reCAPTCHA
    if (window.recaptchaVerifierProfile) {
      window.recaptchaVerifierProfile.clear();
      window.recaptchaVerifierProfile = null;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  if (!user) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-poppins"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-6 py-12">
          <motion.div
            className="text-center py-12 bg-white/90 dark:bg-gray-800/90 rounded-3xl shadow-xl backdrop-blur-md"
            variants={itemVariants}
          >
            <div className="text-6xl mb-4">🔐</div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Please log in</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">You need to be logged in to view your profile.</p>
            <motion.button
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-full font-semibold text-lg"
              whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(251, 146, 60, 0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
            >
              Log In
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-poppins"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container mx-auto px-6 py-12">
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          👤 Your Profile
        </motion.h2>

        <motion.div
          className="bg-white/90 dark:bg-gray-800/90 p-8 rounded-3xl shadow-2xl backdrop-blur-md max-w-2xl mx-auto border border-gray-100 dark:border-gray-700"
          variants={itemVariants}
        >
          <div className="flex items-center justify-center space-x-3 mb-8">
            <UserIcon className="h-10 w-10 text-orange-600 dark:text-orange-400" />
            <h3 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">
              {user.isAdmin ? 'Admin Profile' : 'Your Profile'}
            </h3>
            {user.isAdmin && (
              <span className="flex items-center space-x-1 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 px-3 py-1 rounded-full font-medium text-sm">
                <ShieldCheckIcon className="h-5 w-5" />
                <span>Admin</span>
              </span>
            )}
          </div>

          <AnimatePresence mode="wait">
            {editMode ? (
              <motion.form
                key="edit-form"
                onSubmit={updateProfileWithoutPhoneChange}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium text-sm mb-2">Name</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300 text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium text-sm mb-2">
                    Phone Number {formData.phone !== user.phone && '(New number requires verification)'}
                  </label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300 text-base"
                    required
                  />

                  {formData.phone !== user.phone && (
                    <motion.button
                      type="button"
                      onClick={sendOtp}
                      className="mt-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-xl font-semibold text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
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
                    className="space-y-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl"
                  >
                    <h4 className="font-semibold text-orange-800 dark:text-orange-300">Verify Phone Number</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Enter the OTP sent to {formData.phone}
                    </p>

                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      className="w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-orange-300 dark:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />

                    <div className="flex space-x-2">
                      <motion.button
                        type="button"
                        onClick={verifyOtpAndUpdateProfile}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={loading}
                      >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={() => setVerifyMode(false)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-xl font-semibold text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Cancel Verification
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                <div id="recaptcha-container-profile"></div>

                {recaptchaError && (
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-xl text-sm">
                    {recaptchaError}
                  </div>
                )}

                <div className="flex justify-end space-x-4">
                  <motion.button
                    type="submit"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-xl font-semibold text-lg"
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(251, 146, 60, 0.3)' }}
                    whileTap={{ scale: 0.95 }}
                    disabled={loading || (formData.phone !== user.phone && !verifyMode)}
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={cancelEdit}
                    className="bg-gray-500 dark:bg-gray-600 text-white px-8 py-3 rounded-xl font-semibold text-lg"
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(107, 114, 128, 0.3)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="profile-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Name:</span> {user.name || 'N/A'}
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Phone:</span> {user.phone || 'N/A'}
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Phone Verified:</span>
                  {user.phoneVerified ? (
                    <span className="text-green-600 dark:text-green-400 ml-2">✓ Verified</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 ml-2">Not Verified</span>
                  )}
                </p>

                {user.isAdmin && (
                  <motion.div
                    className="mt-6 space-y-4 space-x-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link
                      to="/orders-mgmt"
                      className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:bg-blue-700 transition duration-300"
                    >
                      <ShieldCheckIcon className="h-5 w-5" />
                      <span>Go to Orders Management</span>
                    </Link>
                    <Link
                      to="/menu-mgmt"
                      className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:bg-blue-700 transition duration-300"
                    >
                      <ShieldCheckIcon className="h-5 w-5" />
                      <span>Go to Menu Management</span>
                    </Link>
                  </motion.div>
                )}

                <motion.button
                  onClick={() => setEditMode(true)}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold text-lg mt-6"
                  whileHover={{ scale: 1.02, boxShadow: '0 10px 20px rgba(251, 146, 60, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  Edit Profile
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile;
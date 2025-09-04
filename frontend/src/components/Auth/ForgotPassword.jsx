import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, clearErrors } from '../../redux/actions/authActions';
import { motion } from 'framer-motion';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';

const ForgotPassword = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, message } = useSelector((state) => state.auth);

  const setupRecaptcha = () => {
    if (!auth) {
      console.error('Firebase auth is undefined');
      dispatch({ type: 'FORGOT_PASSWORD_FAIL', payload: 'Firebase auth not initialized' });
      return null;
    }

    const container = document.getElementById('recaptcha-container');
    if (!container) {
      console.error('reCAPTCHA container not found');
      dispatch({ type: 'FORGOT_PASSWORD_FAIL', payload: 'reCAPTCHA container not found' });
      return null;
    }

    try {
      // console.log('Initializing RecaptchaVerifier with size: normal');
      const verifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'normal',
          callback: (response) => {
            // console.log('reCAPTCHA verified:', response);
            setRecaptchaError(null);
          },
          'expired-callback': () => {
            // console.log('reCAPTCHA expired');
            window.recaptchaVerifier = null;
            setRecaptchaError('reCAPTCHA expired. Please try again.');
            setTimeout(() => {
              window.recaptchaVerifier = setupRecaptcha();
            }, 1000);
          },
        }
      );
      // console.log('RecaptchaVerifier initialized:', verifier);
      return verifier;
    } catch (err) {
      console.error('Error initializing RecaptchaVerifier:', err.code, err.message);
      setRecaptchaError(err.message);
      dispatch({ type: 'FORGOT_PASSWORD_FAIL', payload: `Failed to initialize reCAPTCHA: ${err.message}` });
      return null;
    }
  };

  useEffect(() => {
    let retries = 3;
    const initializeRecaptcha = () => {
      if (retries <= 0) {
        console.error('Max retries reached for reCAPTCHA initialization');
        dispatch({ type: 'FORGOT_PASSWORD_FAIL', payload: 'Failed to initialize reCAPTCHA after multiple attempts' });
        return;
      }

      const verifier = setupRecaptcha();
      if (verifier) {
        window.recaptchaVerifier = verifier;
        // Pre-render reCAPTCHA as per documentation
        verifier.render().then((widgetId) => {
          // console.log('reCAPTCHA rendered, widget ID:', widgetId);
          window.recaptchaWidgetId = widgetId;
        }).catch((err) => {
          console.error('Error rendering reCAPTCHA:', err.code, err.message);
          setRecaptchaError('Failed to render reCAPTCHA');
        });
      } else {
        retries -= 1;
        console.warn(`Retrying reCAPTCHA initialization (${retries} attempts left)`);
        setTimeout(initializeRecaptcha, 1000);
      }
    };

    setTimeout(initializeRecaptcha, 100);

    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
        window.recaptchaWidgetId = null;
      }
    };
  }, []);

  const requestOtp = async (e) => {
    e.preventDefault();
    try {
      if (!auth) {
        dispatch({ type: 'FORGOT_PASSWORD_FAIL', payload: 'Firebase auth not initialized' });
        return;
      }

      if (!window.recaptchaVerifier) {
        console.error('reCAPTCHA verifier not available');
        setRecaptchaError('reCAPTCHA not initialized. Please complete the reCAPTCHA.');
        dispatch({ type: 'FORGOT_PASSWORD_FAIL', payload: 'reCAPTCHA not initialized' });
        return;
      }

      const phoneRegex = /^\+\d{10,15}$/;
      const phoneNumber = `${phone}`;
      if (!phoneRegex.test(phoneNumber)) {
        dispatch({ type: 'FORGOT_PASSWORD_FAIL', payload: 'Invalid phone number format. Use + followed by country code and number.' });
        return;
      }

      // console.log('Sending OTP to:', phoneNumber);
      const result = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      // console.log('signInWithPhoneNumber result:', result);
      setConfirmationResult(result);
      setShowOtpField(true);
      setRecaptchaError(null);
    } catch (err) {
      console.error('Error in requestOtp:', err.code, err.message);
      dispatch({ type: 'FORGOT_PASSWORD_FAIL', payload: `Failed to send OTP: ${err.message}` });

      // Reset reCAPTCHA on error, as per documentation
      if (window.recaptchaWidgetId) {
        window.grecaptcha.reset(window.recaptchaWidgetId);
      } else if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then((widgetId) => {
          window.grecaptcha.reset(widgetId);
        });
      }
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!confirmationResult) {
      dispatch({ type: 'FORGOT_PASSWORD_FAIL', payload: 'Please request OTP first' });
      return;
    }

    try {
      await confirmationResult.confirm(otp);
      // Phone verified, now get the reset token from backend
      const result = await dispatch(forgotPassword({ phone }));
      if (result && result.resetToken) {
        // Navigate to reset password page with the token
        navigate(`/reset-password/${result.resetToken}`);
      }
    } catch (err) {
      console.error('Error in onSubmit:', err.code, err.message);
      dispatch({ type: 'FORGOT_PASSWORD_FAIL', payload: `Invalid OTP: ${err.message}` });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-orange-200 dark:border-gray-700"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🔒</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
            Forgot Password
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Enter your phone number to receive an OTP
          </p>
        </motion.div>

        {error && (
          <motion.div
            variants={itemVariants}
            className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl flex justify-between items-center"
          >
            <span>{error}</span>
            <button
              type="button"
              className="text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
              onClick={() => dispatch(clearErrors())}
            >
              ✕
            </button>
          </motion.div>
        )}

        {recaptchaError && (
          <motion.div
            variants={itemVariants}
            className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 rounded-xl"
          >
            <span>reCAPTCHA issue: {recaptchaError}. Please complete the visible reCAPTCHA.</span>
          </motion.div>
        )}

        {message && (
          <motion.div
            variants={itemVariants}
            className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 rounded-xl"
          >
            <span>{message}</span>
          </motion.div>
        )}

        <form onSubmit={showOtpField ? onSubmit : requestOtp} className="space-y-6">
          <motion.div variants={itemVariants}>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., +16505554567"
              className="w-full p-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
              required
            />
          </motion.div>

          {showOtpField && (
            <motion.div variants={itemVariants}>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP (e.g., 123456)"
                className="w-full p-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                required
              />
            </motion.div>
          )}

          <div id="recaptcha-container"></div>

          <motion.div variants={itemVariants}>
            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl font-semibold shadow-lg"
              whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -10px rgba(249, 115, 22, 0.5)' }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
                  {showOtpField ? 'Verifying...' : 'Sending OTP...'}
                </div>
              ) : (
                showOtpField ? 'Verify OTP' : 'Send OTP'
              )}
            </motion.button>
          </motion.div>
        </form>

        <motion.div variants={itemVariants} className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Back to{' '}
            <Link
              to="/login"
              className="font-semibold text-orange-600 dark:text-orange-400 hover:underline transition duration-300"
            >
              Sign In
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
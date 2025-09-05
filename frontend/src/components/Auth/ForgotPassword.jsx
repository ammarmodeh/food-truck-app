import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, clearErrors } from '../../redux/actions/authActions';
import { motion } from 'framer-motion';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';

const ForgotPassword = () => {
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneInput, setPhoneInput] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, message } = useSelector((state) => state.auth);

  const onPhoneChange = (e) => {
    const value = e.target.value.replace(/[^\d]/g, ''); // Allow only digits
    setPhoneInput(value);
    setPhone(value ? countryCode + value : '');
    if (error) dispatch(clearErrors());
  };

  const onCountryCodeChange = (e) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    setPhone(phoneInput ? newCode + phoneInput : '');
  };

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
            window.recaptchaVerifier = null;
            setRecaptchaError('reCAPTCHA expired. Please try again.');
            setTimeout(() => {
              window.recaptchaVerifier = setupRecaptcha();
            }, 1000);
          },
        }
      );
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
        verifier.render().then((widgetId) => {
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

      const phoneRegex = countryCode === '+1' ? /^\+1\d{10}$/ : /^\+962\d{9}$/;
      if (!phoneRegex.test(phone)) {
        dispatch({
          type: 'FORGOT_PASSWORD_FAIL',
          payload: `Invalid phone number format. Use ${countryCode} followed by ${countryCode === '+1' ? '10-digit' : '9-digit'} number (e.g., ${countryCode === '+1' ? '+12345678901' : '+962123456789'}).`,
        });
        return;
      }

      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setShowOtpField(true);
      setRecaptchaError(null);
    } catch (err) {
      console.error('Error in requestOtp:', err.code, err.message);
      dispatch({ type: 'FORGOT_PASSWORD_FAIL', payload: `Failed to send OTP: ${err.message}` });

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
      const result = await dispatch(forgotPassword({ phone }));
      if (result && result.resetToken) {
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md p-8 card-gradient-bg backdrop-blur-sm rounded-3xl shadow-xl border border-gray-700"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🔒</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
            Forgot Password
          </h2>
          <p className="text-gray-400 mt-2">
            Enter your phone number to receive an OTP
          </p>
        </motion.div>

        {error && (
          <motion.div
            variants={itemVariants}
            className="mb-6 p-4 bg-red-900/30 border border-red-700 text-red-300 rounded-xl flex justify-between items-center"
          >
            <span>{error}</span>
            <button
              type="button"
              className="text-red-300 hover:text-red-100"
              onClick={() => dispatch(clearErrors())}
            >
              ✕
            </button>
          </motion.div>
        )}

        {recaptchaError && (
          <motion.div
            variants={itemVariants}
            className="mb-6 p-4 bg-yellow-900/30 border border-yellow-700 text-yellow-300 rounded-xl"
          >
            <span>reCAPTCHA issue: {recaptchaError}. Please complete the visible reCAPTCHA.</span>
          </motion.div>
        )}

        {message && (
          <motion.div
            variants={itemVariants}
            className="mb-6 p-4 bg-green-900/30 border border-green-700 text-green-300 rounded-xl"
          >
            <span>{message}</span>
          </motion.div>
        )}

        <form onSubmit={showOtpField ? onSubmit : requestOtp} className="space-y-6">
          <motion.div variants={itemVariants}>
            <label className="block text-gray-300 font-medium mb-2">
              Phone Number
            </label>
            <div className="flex">
              <select
                value={countryCode}
                onChange={onCountryCodeChange}
                className="p-4 rounded-l-xl bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
              >
                <option value="+1">+1 (USA)</option>
                <option value="+962">+962 (Jordan)</option>
              </select>
              <input
                type="tel"
                value={phoneInput}
                onChange={onPhoneChange}
                placeholder={countryCode === '+1' ? '2345678901' : '123456789'}
                className="w-full p-4 rounded-r-xl bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                required
              />
            </div>
          </motion.div>

          {showOtpField && (
            <motion.div variants={itemVariants}>
              <label className="block text-gray-300 font-medium mb-2">
                OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP (e.g., 123456)"
                className="w-full p-4 rounded-xl bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                required
              />
            </motion.div>
          )}

          <div id="recaptcha-container"></div>

          <motion.div variants={itemVariants}>
            <motion.button
              type="submit"
              className="w-full bg-button-bg-primary text-white p-4 rounded-xl font-semibold shadow-lg"
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
          <p className="text-gray-400">
            Back to{' '}
            <Link
              to="/login"
              className="font-semibold text-orange-400 hover:underline transition duration-300"
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
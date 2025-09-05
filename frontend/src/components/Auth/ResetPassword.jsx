import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { resetPassword, clearErrors } from '../../redux/actions/authActions';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const ResetPassword = () => {
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useParams();
  const { loading, error, message } = useSelector((state) => state.auth);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) dispatch(clearErrors());
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      dispatch({ type: 'RESET_PASSWORD_FAIL', payload: 'Passwords do not match' });
      return;
    }
    dispatch(resetPassword({ password: formData.password, token }));
  };

  useEffect(() => {
    // Check if token is present
    if (!token) {
      navigate('/forgot-password');
      return;
    }

    if (message) {
      const timer = setTimeout(() => navigate('/login'), 3000);
      return () => clearTimeout(timer);
    }
  }, [message, navigate, token]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { delayChildren: 0.2, staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
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
            Reset Password
          </h2>
          <p className="text-gray-400 mt-2">
            Enter your new password
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

        {message && (
          <motion.div
            variants={itemVariants}
            className="mb-6 p-4 bg-green-900/30 border border-green-700 text-green-300 rounded-xl"
          >
            <span>{message}</span>
          </motion.div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <motion.div variants={itemVariants} className="relative">
            <label className="block text-gray-300 font-medium mb-2">
              New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={onChange}
              placeholder="Enter new password"
              className="w-full p-4 rounded-xl bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300 pr-12"
              required
            />
            <button
              type="button"
              className="absolute right-3 bottom-3 p-1 text-gray-400 hover:text-orange-400"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-gray-300 font-medium mb-2">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={onChange}
              placeholder="Confirm new password"
              className="w-full p-4 rounded-xl bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
              required
            />
          </motion.div>

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
                  Resetting...
                </div>
              ) : (
                'Reset Password'
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

export default ResetPassword;
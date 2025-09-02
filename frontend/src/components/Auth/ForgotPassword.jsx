import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, clearErrors } from '../../redux/actions/authActions';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, message } = useSelector((state) => state.auth);

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(forgotPassword({ email }));
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
            Enter your email to receive a password reset link
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

        {message && (
          <motion.div
            variants={itemVariants}
            className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 rounded-xl"
          >
            <span>{message}</span>
          </motion.div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <motion.div variants={itemVariants}>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
              required
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl font-semibold shadow-lg"
              whileHover={{
                scale: 1.02,
                boxShadow: '0 10px 25px -10px rgba(249, 115, 22, 0.5)',
              }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
                  Sending...
                </div>
              ) : (
                'Send Reset Link'
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
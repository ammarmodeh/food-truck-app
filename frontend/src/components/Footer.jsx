import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <motion.footer
      className="bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <motion.div
              className="flex items-center space-x-4 mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-wide border-1 border-white/70 overflow-hidden"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/" className="block">
                  <img src="./LogoByeByeEtiquette.svg" alt="" className='w-25' />
                </Link>
              </motion.div>
              <h3 className='text-3xl font-bold text-orange-400'>Bye Bye Etiquette</h3>
            </motion.div>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              Bringing gourmet street food to your neighborhood with passion,
              quality ingredients, and unbeatable flavors. Follow our journey
              across the city!
            </p>
            <div className="flex space-x-4">
              {['📘', '📷', '🐦', '📺'].map((icon, index) => (
                <motion.div
                  key={index}
                  className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-400 transition-colors"
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-xl">{icon}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-bold mb-6 text-orange-400">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { name: 'Menu', path: '/menu' },
                { name: 'Schedule', path: '/schedule/week' },
                { name: 'Location', path: '/location' },
                { name: 'Orders', path: '/orders' },
                { name: 'Cart', path: '/cart' },
              ].map((link, index) => (
                <motion.li
                  key={link.name}
                  whileHover={{ x: 10, color: "#fb923c" }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={link.path}
                    className="text-gray-300 hover:text-orange-400 transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xl font-bold mb-6 text-orange-400">Get In Touch</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-xl">📧</span>
                <span className="text-gray-300">info@foodtruckdelight.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xl">📱</span>
                <span className="text-gray-300">(555) 123-FOOD</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xl">📍</span>
                <span className="text-gray-300">Mobile throughout CA</span>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          className="border-t border-gray-700 mt-12 pt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-gray-400 text-lg">
            &copy; 2025 Food Truck Delight. All rights reserved. |
            <span className="text-orange-400 hover:text-orange-300 cursor-pointer"> Privacy Policy</span> |
            <span className="text-orange-400 hover:text-orange-300 cursor-pointer"> Terms of Service</span>
          </p>
          <motion.p
            className="text-orange-400 mt-2 font-semibold"
            animate={{
              textShadow: ["0 0 5px #fb923c", "0 0 20px #fb923c", "0 0 5px #fb923c"]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            Made with ❤️ for food lovers everywhere
          </motion.p>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;
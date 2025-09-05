import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// #f7a727

const Footer = () => {
  return (
    <motion.footer
      className="bg-gradient-to-r from-[#1f4499] via-gray-900 to-black text-white"
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
              <h3 className='text-2xl font-bold text-text-primary'>Bye Bye Etiquette</h3>
            </motion.div>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              Bringing gourmet street food to your neighborhood with passion,
              quality ingredients, and unbeatable flavors. Follow our journey
              across the city!
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-bold mb-6 text-text-primary">Quick Links</h4>
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
                    className="text-gray-300 hover:text-text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xl font-bold mb-6 text-text-primary">Get In Touch</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-xl">📧</span>
                <span className="text-gray-300">odehmahmoud57@icloud.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xl">📱</span>
                <span className="text-gray-300">8136475651</span>
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
            &copy; {new Date().getFullYear()} Bye Bye Etiquette. All rights reserved. |
            <span className="text-text-primary cursor-pointer"> Privacy Policy</span> |
            <span className="text-text-primary cursor-pointer"> Terms of Service</span>
          </p>
          <motion.p
            className="text-text-primary mt-2 font-semibold"
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
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-[#1f4499] via-gray-900 to-black text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-4 mb-6">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-wide border-1 border-white/70 overflow-hidden">
                <Link to="/" className="block">
                  <img src="/LogoByeByeEtiquette.svg" alt="Bye Bye Etiquette Logo" className="w-24" />
                </Link>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                Bye Bye Etiquette
              </h3>
            </div>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              Bringing gourmet street food to your neighborhood with passion,
              quality ingredients, and unbeatable flavors. Follow our journey
              across the city!
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[
                { name: 'Menu', path: '/menu' },
                { name: 'Schedule', path: '/schedule/week' },
                { name: 'Location', path: '/location' },
                { name: 'Orders', path: '/orders' },
                { name: 'Cart', path: '/cart' },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-300 hover:text-orange-400 transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Get In Touch
            </h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-xl">📧</span>
                <span className="text-gray-300">galaxy.fsllc@gmail.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xl">📱</span>
                <span className="text-gray-300">8136475651</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8 text-center">
          <p className="text-gray-400 text-lg">
            &copy; {new Date().getFullYear()} Bye Bye Etiquette. All rights reserved. |{' '}
            <Link to="#" className="text-orange-400 hover:text-orange-300 transition-colors duration-300">
              Privacy Policy
            </Link>{' '}
            |{' '}
            <Link to="#" className="text-orange-400 hover:text-orange-300 transition-colors duration-300">
              Terms of Service
            </Link>
          </p>
          <p className="text-orange-400 mt-2 font-semibold">
            Made with ❤️ for food lovers everywhere
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
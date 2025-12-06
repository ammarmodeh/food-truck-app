import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPinIcon,
  ClockIcon,
  FireIcon,
  SparklesIcon,
  TruckIcon,
  StarIcon,
  BellAlertIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

const HeroSection = () => {
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0);

  const announcements = [
    { icon: FireIcon, text: "New: Spicy Korean Tacos!", color: "text-orange-600 bg-orange-50" },
    { icon: MapPinIcon, text: "Downtown Every Friday!", color: "text-blue-600 bg-blue-50" },
    { icon: SparklesIcon, text: "20% Off Orders $30+", color: "text-purple-600 bg-purple-50" },
    { icon: TruckIcon, text: "Live Truck Tracking!", color: "text-green-600 bg-green-50" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAnnouncement((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: "Customers", value: "10K+", icon: StarIcon },
    { label: "Items", value: "50+", icon: ShoppingBagIcon },
    { label: "Locations", value: "15+", icon: MapPinIcon },
  ];

  const quickActions = [
    { title: "Order", desc: "Menu", link: "/menu", icon: ShoppingBagIcon, color: "bg-orange-600 hover:bg-orange-700 text-white" },
    { title: "Find", desc: "Schedule", link: "/schedule/week", icon: MapPinIcon, color: "bg-white hover:bg-gray-50 text-gray-900 border border-gray-200" },
    { title: "Track", desc: "Orders", link: "/orders", icon: ClockIcon, color: "bg-white hover:bg-gray-50 text-gray-900 border border-gray-200" }
  ];

  return (
    <section className="relative w-full overflow-hidden">

      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src="/nathalia-segato-as26awWvRvM-unsplash (1).jpg"
          alt="Delicious food background"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/85"></div>

      {/* Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ea580c15_1px,transparent_1px)] [background-size:20px_20px]"></div>

      {/* Floating Decorations */}
      <div className="absolute top-10 right-10 w-40 h-40 bg-orange-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-orange-300/20 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">

        {/* Announcements */}
        <motion.div
          key={currentAnnouncement}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-5 flex justify-center"
        >
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${announcements[currentAnnouncement].color} shadow-sm backdrop-blur-sm`}>
            {(() => {
              const Icon = announcements[currentAnnouncement].icon;
              return <Icon className="h-3.5 w-3.5" />;
            })()}
            <span className="text-xs font-semibold">{announcements[currentAnnouncement].text}</span>
          </div>
        </motion.div>

        {/* Central Hero Content */}
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Gourmet Street Food
                <span className="block text-orange-600">On The Move</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                Fresh ingredients, bold flavors, unforgettable meals crafted by passionate chefs.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link to="/menu">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-orange-700 flex items-center gap-2"
                >
                  <ShoppingBagIcon className="h-4 w-4" />
                  Order Now
                </motion.button>
              </Link>
              <Link to="/schedule/week">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-white/90 backdrop-blur-sm text-gray-900 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md border border-gray-200 flex items-center gap-2"
                >
                  <MapPinIcon className="h-4 w-4" />
                  Find Our Truck
                </motion.button>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto pt-4">
              {quickActions.map((action, i) => (
                <Link key={i} to={action.link}>
                  <motion.div
                    whileHover={{ y: -2, scale: 1.02 }}
                    className={`p-3 rounded-xl ${action.color} shadow-sm backdrop-blur-sm`}
                  >
                    <action.icon className="h-6 w-6 mb-2 mx-auto" />
                    <h3 className="font-bold text-xs text-center">{action.title}</h3>
                    <p className="text-[10px] opacity-80 text-center">{action.desc}</p>
                  </motion.div>
                </Link>
              ))}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 pt-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl shadow-sm"
                >
                  <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                    <stat.icon className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                    <div className="text-[10px] text-gray-500">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-3 max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="flex flex-col items-center gap-1">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <ClockIcon className="h-4 w-4 text-green-600" />
              </div>
              <div className="font-bold text-gray-900 text-xs">Fast Delivery</div>
              <div className="text-[10px] text-gray-500">15 mins</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <SparklesIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div className="font-bold text-gray-900 text-xs">Fresh Daily</div>
              <div className="text-[10px] text-gray-500">Local</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <TruckIcon className="h-4 w-4 text-purple-600" />
              </div>
              <div className="font-bold text-gray-900 text-xs">Track Live</div>
              <div className="text-[10px] text-gray-500">Anytime</div>
            </div>
          </div>
        </motion.div>

        {/* Floating Badges */}
        {/* <motion.div
          animate={{ y: [-6, 0, -6] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-20 right-8 bg-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 backdrop-blur-sm"
        >
          <FireIcon className="h-4 w-4 text-orange-600" />
          <span className="font-bold text-xs">Hot Deals!</span>
        </motion.div>

        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute bottom-20 left-8 bg-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 backdrop-blur-sm"
        >
          <StarIcon className="h-4 w-4 text-yellow-500" />
          <span className="font-bold text-xs">4.9 Rating</span>
        </motion.div> */}
      </div>
    </section>
  );
};

export default HeroSection;
// src/components/FeaturedMenuSection.jsx
import { useState } from 'react';

const FeaturedMenuSection = ({ featuredMenu, menuLoading, menuError, fetchMenu, navigate, fallbackImage }) => {
  const getGridClasses = (itemCount) => {
    if (itemCount === 1) return 'grid grid-cols-1 mx-auto';
    if (itemCount === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-8 mx-auto';
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto';
  };

  const LoadingSkeleton = ({ className, children }) => (
    <div className={`animate-pulse ${className}`}>
      {children}
    </div>
  );

  const InteractiveCard = ({ item, className }) => {
    const [imageSrc, setImageSrc] = useState(item.image || fallbackImage);

    const handleImageError = (e) => {
      e.target.onerror = null;
      setImageSrc(fallbackImage);
    };

    return (
      <div
        className={`${className} perspective-1000`}
        style={{ opacity: 1, transform: 'translateY(0) rotateX(0deg)' }}
      >
        <div className="relative overflow-hidden">
          <img
            src={imageSrc}
            alt={item.name}
            className="w-full h-80 object-cover"
            onError={handleImageError}
          />
          <div className="absolute top-6 right-6 backdrop-blur-md bg-white/10 border border-white/20 text-white px-4 py-2 rounded-full text-sm font-bold shadow-2xl">
            ✨ Featured
          </div>
        </div>
        <div className="p-8 relative bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/10">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-gray-300 mb-6 leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
          <p className="text-4xl font-black text-text-primary">
            ${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price || 0).toFixed(2)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-black mb-8 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            SIGNATURE CREATIONS
          </h2>
          <div className="w-40 h-1 bg-gradient-to-r from-cyan-400 to-pink-500 mx-auto rounded-full" />
        </div>
        {menuLoading ? (
          <div className={getGridClasses(3)}>
            {[1, 2, 3].map((index) => (
              <LoadingSkeleton key={`menu-skeleton-${index}`} className="group">
                <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                  <div className="w-full h-80 bg-gradient-to-br from-slate-700/50 to-slate-600/50"></div>
                  <div className="p-8">
                    <div className="h-8 bg-gradient-to-r from-slate-600/50 to-slate-500/50 rounded-full mb-4"></div>
                    <div className="h-6 bg-slate-700/50 rounded-full w-3/4 mb-6"></div>
                    <div className="h-10 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-full w-32"></div>
                  </div>
                </div>
              </LoadingSkeleton>
            ))}
          </div>
        ) : menuError ? (
          <div className="text-center py-20 card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700 max-w-4xl mx-auto">
            <div className="text-9xl mb-8 filter drop-shadow-2xl">🍽️</div>
            <h3 className="text-4xl font-bold text-white mb-6">Unable to Load Menu</h3>
            <p className="text-white/60 mb-12 text-xl">{menuError}</p>
            <button
              className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-10 py-4 rounded-full font-bold text-lg shadow-2xl"
              onClick={fetchMenu}
            >
              Try Again
            </button>
          </div>
        ) : featuredMenu.length === 0 ? (
          <div className="text-center py-20 card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700 max-w-4xl mx-auto">
            <div className="text-9xl mb-8 filter drop-shadow-2xl">🎭</div>
            <h3 className="text-4xl font-bold text-white mb-6">Crafting Culinary Art...</h3>
            <p className="text-white/60 text-xl">Our chefs are creating magic</p>
          </div>
        ) : (
          <div className={getGridClasses(featuredMenu.length)}>
            {featuredMenu.map((item) => (
              <InteractiveCard
                key={item._id}
                item={item}
                className="relative bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden hover:shadow-cyan-500/25 transition-all duration-500"
              />
            ))}
          </div>
        )}
        <div className="text-center mt-20" onClick={() => navigate('/menu')}>
          <button className="group relative px-10 py-5 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-white/20 text-white rounded-full text-xl font-bold shadow-2xl overflow-hidden">
            <span className="relative z-10 flex items-center space-x-3">
              <span>🎨</span>
              <span>Explore Full Gallery</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedMenuSection;
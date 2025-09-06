// src/components/HeroSection.jsx

const HeroSection = ({ navigate }) => {
  return (
    <section className="relative flex items-center justify-center min-h-[calc(100vh-72px)] overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-[url('/fb-photo.jpg')] bg-cover bg-center bg-no-repeat"
        style={{
          filter: 'blur(8px) brightness(0.5) contrast(1.2)',
        }}
      />
      <div className="relative z-10 text-center w-full mx-auto px-4">
        <h1
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-8 relative"
          style={{
            textShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 60px rgba(6,182,212,0.3)',
            transform: 'perspective(1000px)'
          }}
        >
          <span
            className="inline-block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent relative"
            style={{
              backgroundSize: '400% 400%',
              filter: 'drop-shadow(0 0 20px rgba(6,182,212,0.5))'
            }}
          >
            Bye Bye
          </span>
          <br />
          <span
            className="inline-block bg-gradient-to-r from-orange-400 via-red-400 to-pink-500 bg-clip-text text-transparent relative"
            style={{
              backgroundSize: '400% 400%',
              filter: 'drop-shadow(0 0 20px rgba(249,115,22,0.5))'
            }}
          >
            ETIQUETTE
          </span>
        </h1>
        <p
          className="text-xl sm:text-2xl md:text-3xl mb-12 text-white max-w-4xl mx-auto leading-relaxed font-light"
          style={{
            textShadow: '0 5px 15px rgba(0,0,0,0.5)',
            filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.1))'
          }}
        >
          Good food that{' '}
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-semibold relative">
            goes places.
            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400" />
          </span>
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button
            className="group relative px-6 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full text-white text-xl font-bold shadow-2xl overflow-hidden border-2 border-gray-200"
            onClick={() => navigate("/menu")}
            style={{
              background: 'linear-gradient(45deg, #06b6d4, #8b5cf6, #ec4899)',
              backgroundSize: '200% 200%'
            }}
          >
            <span className="relative z-10 flex items-center space-x-3">
              <span>🌟</span>
              <span>Experience Menu</span>
            </span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10" />
          </button>
          <button
            className="group px-9 py-3 border-2 border-white/30 text-white rounded-full text-xl font-bold backdrop-blur-sm bg-white/10 overflow-hidden relative"
            onClick={() => navigate("/location")}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100" />
            <span className="relative z-10 flex items-center space-x-3">
              <span>📍</span>
              <span>Track Location</span>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
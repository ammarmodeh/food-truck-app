// src/components/StorySection.jsx

const StorySection = () => {
  return (
    <section className="relative py-32 mb-20 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-20" />
      </div>
      <div className="relative z-10 text-center text-white px-8 max-w-6xl mx-auto">
        <div className="text-8xl md:text-9xl mb-12 filter drop-shadow-2xl">🚀</div>
        <h2 className="text-5xl sm:text-6xl md:text-7xl font-black mb-12 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          THE REVOLUTION STORY
        </h2>
        <div className="w-40 h-1 bg-gradient-to-r from-cyan-400 to-pink-500 mx-auto rounded-full mb-16" />
        <p className="text-2xl md:text-3xl leading-relaxed max-w-4xl mx-auto mb-12 font-light">
          Born from the fusion of <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-semibold">molecular gastronomy</span> and
          street culture, we're not just serving food—we're creating <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent font-semibold">edible art</span> that tells stories.
        </p>
        <p className="text-xl md:text-2xl leading-relaxed max-w-5xl mx-auto mb-16 text-white/80">
          Every technique borrowed from the world's finest kitchens. Every ingredient sourced with purpose.
          Every meal designed to challenge your expectations and elevate your senses.
        </p>
      </div>
    </section>
  );
};

export default StorySection;
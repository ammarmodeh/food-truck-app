import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="space-y-8 text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          The Art of Street Food
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          We started with a simple idea: distinct flavors, high-quality ingredients, and the freedom of the open road.
        </p>
        <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
        <div className="aspect-square bg-muted rounded-2xl border border-border flex items-center justify-center text-6xl shadow-sm">
          🚚
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Our Journey</h2>
          <p className="text-muted-foreground leading-relaxed">
            Founded in 2023, we wanted to break the rules of traditional dining. No reservations, no dress codes—just incredible food served directly to you.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Every dish is inspired by our travels and the vibrant street culture we love. From our signature molecular tacos to our deconstructed burgers, we push boundaries.
          </p>
          <div className="pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <div className="text-2xl font-bold text-foreground">15+</div>
                <div className="text-xs text-muted-foreground uppercase mt-1">Daily Stops</div>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <div className="text-2xl font-bold text-foreground">50+</div>
                <div className="text-xs text-muted-foreground uppercase mt-1">Unique Dishes</div>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <div className="text-2xl font-bold text-foreground">5k+</div>
                <div className="text-xs text-muted-foreground uppercase mt-1">Happy Fans</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-secondary/30 rounded-3xl p-8 md:p-12 text-center border border-border">
        <h2 className="text-2xl font-bold text-foreground mb-4">Meet the Chefs</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          Our team is a collective of culinary rebels who traded Michelin stars for four wheels.
        </p>
        <Link to="/" className="compact-button bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-10 inline-flex items-center justify-center rounded-md font-medium text-sm transition-colors">
          See Our Menu
        </Link>
      </div>
    </div>
  );
};

export default About;

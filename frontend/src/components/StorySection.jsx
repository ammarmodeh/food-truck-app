import { Link } from 'react-router-dom';

const StorySection = () => {
  return (
    <section className="w-full bg-primary/5 p-6 md:p-8 flex flex-col justify-center border-b border-border">
      <div className="flex flex-col space-y-4">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">Our Philosophy</span>
        <h2 className="text-2xl font-bold text-foreground">
          Edible Art, <br className="hidden md:block" /> Street Soul.
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We blend molecular gastronomy with street culture. No rules, just flavor. Every meal tell a story of where we've been and where we're going.
        </p>
        <Link to="/about" className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-2 mt-2">
          Read Our Story &rarr;
        </Link>
      </div>
    </section>
  );
};

export default StorySection;
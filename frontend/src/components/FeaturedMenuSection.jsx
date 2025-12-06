// src/components/FeaturedMenuSection.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

const FeaturedMenuSection = ({ items, menuLoading, menuError, fetchMenu, navigate, fallbackImage }) => {
  const getGridClasses = (itemCount) => {
    if (itemCount === 1) return 'grid grid-cols-1 mx-auto max-w-sm';
    if (itemCount === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto max-w-3xl';
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mx-auto';
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
        className={`${className} group bg-card text-card-foreground rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col md:flex-row h-full`}
      >
        <div className="relative w-full md:w-1/3 aspect-[4/3] md:aspect-auto overflow-hidden bg-muted">
          <img
            src={imageSrc}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={handleImageError}
          />
        </div>
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {item.name}
              </h3>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded ml-2 whitespace-nowrap">
                ${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price || 0).toFixed(2)}
              </span>
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                {item.description}
              </p>
            )}
          </div>
          <button className="text-xs font-semibold text-primary self-start hover:underline mt-auto">
            Order Now &rarr;
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="w-full bg-secondary/30 py-8 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Trending Tastes
            </h2>
            <p className="text-sm text-muted-foreground">Local favorites available right now.</p>
          </div>
          <Link
            to="/menu"
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors hidden sm:block"
          >
            View Full Menu &rarr;
          </Link>
        </div>

        {menuLoading ? (
          <div className={getGridClasses(3)}>
            {[1, 2, 3].map((index) => (
              <LoadingSkeleton key={`menu-skeleton-${index}`} className="bg-card rounded-lg border border-border shadow-sm overflow-hidden h-[120px] w-full" />
            ))}
          </div>
        ) : menuError ? (
          <div className="text-center py-8 bg-destructive/5 rounded-lg border border-destructive/20">
            <p className="text-muted-foreground mb-2 text-sm">{menuError}</p>
            <button className="text-sm font-medium text-primary hover:underline" onClick={fetchMenu}>Try Again</button>
          </div>
        ) : (!items || items.length === 0) ? (
          <div className="text-center py-8 bg-background/50 rounded-lg border border-border border-dashed">
            <p className="text-muted-foreground text-sm">Menu updating...</p>
          </div>
        ) : (
          <div className={getGridClasses(items.length)}>
            {items.slice(0, 6).map((item) => ( // Limit to 6 items max for density
              <InteractiveCard
                key={item._id}
                item={item}
              />
            ))}
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Link
            to="/menu"
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            View Full Menu &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedMenuSection;
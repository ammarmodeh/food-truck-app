import { useEffect } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Link } from 'react-router-dom';

const renderMap = (status) => {
  if (status === Status.LOADING) return <div className="h-32 w-full bg-muted animate-pulse rounded-lg border border-border" />;
  if (status === Status.FAILURE) return <div className="h-32 w-full bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-center text-xs text-destructive">Map Error</div>;
  return null;
};

const Map = ({ center }) => {
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.marker) {
      const map = new window.google.maps.Map(document.getElementById(`map-${center.lat}`), {
        center,
        zoom: 13,
        mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'demo_map_id',
        disableDefaultUI: true,
      });
      new window.google.maps.marker.AdvancedMarkerElement({ position: center, map, title: 'Food Truck' });
    }
  }, [center]);
  return <div id={`map-${center.lat}`} className="h-32 w-full rounded-lg" />;
};

const UpcomingScheduleSection = ({ schedule, scheduleLoading, scheduleError, fetchSchedule, navigate }) => {
  return (
    <section className="w-full bg-background border-r border-border p-6 md:p-8 flex flex-col h-full">
      <div className="flex justify-between items-baseline mb-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Upcoming Stops</h2>
        <Link to="/schedule/week" className="text-xs font-semibold text-primary hover:underline">View All &rarr;</Link>
      </div>

      <div className="flex-1 space-y-4">
        {scheduleLoading ? (
          [1, 2].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)
        ) : scheduleError ? (
          <div className="py-8 text-center text-sm text-muted-foreground bg-destructive/5 rounded-lg">
            Failed to load schedule. <button onClick={fetchSchedule} className="text-primary hover:underline ml-1">Retry</button>
          </div>
        ) : (!schedule || schedule.length === 0) ? (
          <div className="py-12 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
            Check back soon for new locations!
          </div>
        ) : (
          schedule.slice(0, 2).map((item) => (
            <div key={item._id} className="group bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </h3>
                  <p className="text-xs text-muted-foreground">{item.startTime} - {item.endTime}</p>
                </div>
                <div className="bg-primary/10 p-1.5 rounded-full text-primary text-xs">📍</div>
              </div>
              <p className="text-sm font-medium text-foreground mb-2 truncate">{item.location}</p>
              {item.coordinates && (
                <div className="mt-2 rounded-lg overflow-hidden border border-border">
                  <Wrapper apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} render={renderMap} libraries={['marker']}>
                    <Map center={{ lat: item.coordinates.lat, lng: item.coordinates.lng }} />
                  </Wrapper>
                </div>
              )}
              <div className="mt-3 text-right">
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${item?.coordinates?.lat},${item?.coordinates?.lng}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:text-primary/80 inline-flex items-center">
                  Directions <ArrowRightIcon className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-border text-center md:text-left">
        <p className="text-xs text-muted-foreground">Locations subject to change due to weather.</p>
      </div>
    </section>
  );
};

export default UpcomingScheduleSection;
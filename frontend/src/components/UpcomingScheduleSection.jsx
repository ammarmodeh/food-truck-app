// src/components/UpcomingScheduleSection.jsx
import { useEffect } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { Wrapper, Status } from '@googlemaps/react-wrapper'; // Import Status here

const renderMap = (status) => {
  if (status === Status.LOADING)
    return (
      <div className="h-64 w-full rounded-3xl bg-gray-700 animate-pulse flex items-center justify-center">
        <span className="text-gray-400">Loading map...</span>
      </div>
    );
  if (status === Status.FAILURE)
    return (
      <div className="h-64 w-full rounded-3xl bg-red-900 flex items-center justify-center">
        <span className="text-red-400">Error loading map</span>
      </div>
    );
  return null;
};

const Map = ({ center }) => {
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.marker) {
      const map = new window.google.maps.Map(document.getElementById(`map-${center.lat}`), {
        center,
        zoom: 12,
        mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'your_map_id_here',
      });
      new window.google.maps.marker.AdvancedMarkerElement({
        position: center,
        map,
        title: 'Food Truck Delight',
      });
    }
  }, [center]);

  return <div id={`map-${center.lat}`} className="h-64 w-full rounded-3xl" />;
};

const UpcomingScheduleSection = ({ upcomingSchedule, scheduleLoading, scheduleError, fetchSchedule, navigate }) => {
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

  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-black mb-8 bg-gradient-to-r from-orange-400 via-red-400 to-pink-500 bg-clip-text text-transparent">
            NEXT LOCATIONS
          </h2>
          <div className="w-40 h-1 bg-gradient-to-r from-orange-400 to-pink-500 mx-auto rounded-full" />
        </div>
        {scheduleLoading ? (
          <div className={getGridClasses(3)}>
            {[1, 2, 3].map((index) => (
              <LoadingSkeleton key={`schedule-skeleton-${index}`}>
                <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                  <div className="h-12 bg-gradient-to-r from-slate-600/50 to-slate-500/50 rounded-full mb-6 w-40"></div>
                  <div className="h-6 bg-slate-700/50 rounded-full mb-4"></div>
                  <div className="h-5 bg-slate-600/50 rounded-full w-48 mb-4"></div>
                  <div className="h-64 bg-gray-700 rounded-3xl"></div>
                </div>
              </LoadingSkeleton>
            ))}
          </div>
        ) : scheduleError ? (
          <div className="text-center py-20 card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700 max-w-4xl mx-auto">
            <div className="text-9xl mb-8 filter drop-shadow-2xl">🗓️</div>
            <h3 className="text-4xl font-bold text-white mb-6">Unable to Load Locations</h3>
            <p className="text-white/60 text-xl">{scheduleError}</p>
            <button
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-10 py-4 rounded-full font-bold text-lg shadow-2xl mt-6"
              onClick={fetchSchedule}
            >
              Try Again
            </button>
          </div>
        ) : upcomingSchedule.length === 0 ? (
          <div className="text-center py-20 card-gradient-bg rounded-3xl shadow-lg backdrop-blur-sm border border-gray-700 max-w-4xl mx-auto">
            <div className="text-9xl mb-8 filter drop-shadow-2xl">🗓️</div>
            <h3 className="text-4xl font-bold text-white mb-6">Planning Next Adventure...</h3>
            <p className="text-white/60 text-xl">No locations available at the moment</p>
          </div>
        ) : (
          <div className={getGridClasses(upcomingSchedule.length)}>
            {upcomingSchedule.map((schedule) => (
              <div
                key={schedule._id}
                className="relative card-gradient-bg backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 group w-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="text-6xl mb-6 filter drop-shadow-lg">📍</div>
                  <h3 className="text-lg font-bold text-white mb-4">
                    {new Date(schedule.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  <p className="text-md text-cyan-300 mb-3 flex items-center space-x-3">
                    <span>🏙️</span>
                    <span>{schedule.location}{schedule.state ? `, ${schedule.state}` : ''}</span>
                  </p>
                  <p className="text-md text-orange-300 font-semibold flex items-center space-x-3 mb-4">
                    <span>⏰</span>
                    <span>{schedule.startTime} - {schedule.endTime}</span>
                  </p>
                  {schedule.notes && (
                    <p className="text-sm text-white/70 italic bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm mb-4">
                      ✨ {schedule.notes}
                    </p>
                  )}
                  {schedule.coordinates ? (
                    <Wrapper
                      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                      render={renderMap}
                      libraries={['marker']}
                    >
                      <Map center={{ lat: schedule.coordinates.lat, lng: schedule.coordinates.lng }} />
                    </Wrapper>
                  ) : (
                    <div className="h-64 w-full rounded-3xl bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-400">No map available</span>
                    </div>
                  )}
                  {schedule.coordinates && (
                    <div className="mt-4 text-center">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${schedule.coordinates.lat},${schedule.coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-button-bg-primary text-white px-4 py-2 rounded-full font-semibold text-sm"
                      >
                        <ArrowRightIcon className="h-4 w-4 mr-1" />
                        Get Directions
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="text-center mt-20" onClick={() => navigate('/schedule/week')}>
          <button className="group relative px-10 py-5 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-white/20 text-white rounded-full text-xl font-bold shadow-2xl overflow-hidden">
            <span className="relative z-10 flex items-center space-x-3">
              <span>🗺️</span>
              <span>Track All Locations</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default UpcomingScheduleSection;
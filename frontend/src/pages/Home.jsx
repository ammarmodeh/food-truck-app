// src/pages/Home.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { Wrapper } from '@googlemaps/react-wrapper'; // Remove Status import
import { useSelector } from 'react-redux';
import Testimonials from '../components/Testimonials';
import HeroSection from '../components/HeroSection';
import FeaturedMenuSection from '../components/FeaturedMenuSection';
import UpcomingScheduleSection from '../components/UpcomingScheduleSection';
import StorySection from '../components/StorySection';

const fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FF6B35;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23F7931E;stop-opacity:1' /%3E%3C/defs%3E%3Crect width='400' height='300' fill='url(%23grad1)'/%3E%3Cg transform='translate(200,150)'%3E%3Ccircle r='40' fill='white' opacity='0.9'/%3E%3Ctext x='0' y='8' text-anchor='middle' fill='%23FF6B35' font-size='24' font-family='Arial'%3E🍕%3C/text%3E%3C/g%3E%3C/svg%3E";

const Home = () => {
  const [featuredMenu, setFeaturedMenu] = useState([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState(null);
  const navigate = useNavigate();

  const isMounted = useRef(true);
  const menuRequestCount = useRef(0);
  const scheduleRequestCount = useRef(0);
  const menuDataFetched = useRef(false);
  const scheduleDataFetched = useRef(false);

  const [isReady, setIsReady] = useState(false);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setIsReady(true);
      } catch (err) {
        console.error('Home fetch error:', err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchMenu = async () => {
    if (menuDataFetched.current || menuRequestCount.current > 0) {
      return;
    }

    menuDataFetched.current = true;
    menuRequestCount.current++;

    try {
      setMenuLoading(true);
      setMenuError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const menuResponse = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/menu`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!menuResponse.ok) {
        throw new Error('Failed to fetch menu items');
      }

      const menuData = await menuResponse.json();
      const formattedMenu = menuData.map((item) => ({
        _id: item._id,
        name: item.name,
        description: item.description || 'No description available',
        price: item.price,
        image: item.image || fallbackImage,
      }));

      if (isMounted.current) {
        setFeaturedMenu(formattedMenu.slice(0, 3));
      }
    } catch (err) {
      if (isMounted.current) {
        console.error('Menu API Error:', err);
        setMenuError(err.message || 'Unable to load menu. Please try again.');
        setFeaturedMenu([]);
        menuDataFetched.current = false; // Allow retry on error
      }
    } finally {
      if (isMounted.current) {
        setMenuLoading(false);
      }
      menuRequestCount.current = Math.max(0, menuRequestCount.current - 1);
    }
  };

  const fetchSchedule = async () => {
    if (scheduleDataFetched.current || scheduleRequestCount.current > 0) {
      return;
    }

    scheduleDataFetched.current = true;
    scheduleRequestCount.current++;

    try {
      setScheduleLoading(true);
      setScheduleError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const scheduleResponse = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/schedules`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let formattedSchedule = [];
      if (scheduleResponse.ok) {
        const scheduleData = await scheduleResponse.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        formattedSchedule = scheduleData
          .filter((item) => new Date(item.date) >= today)
          .map((item) => ({
            _id: item._id,
            date: new Date(item.date),
            location: item.location || 'Unknown Location',
            state: item.state || 'CA',
            startTime: item.startTime || '11:00 AM',
            endTime: item.endTime || '8:00 PM',
            coordinates: item.coordinates || null,
          }))
          .sort((a, b) => a.date - b.date);
      } else {
        console.warn('Failed to fetch schedule data, using empty schedule');
      }

      if (isMounted.current) {
        setUpcomingSchedule(formattedSchedule.slice(0, 3));
      }
    } catch (err) {
      if (isMounted.current) {
        console.error('Schedule API Error:', err);
        setScheduleError(err.message || 'Unable to load locations. Please try again.');
        setUpcomingSchedule([]);
        scheduleDataFetched.current = false; // Allow retry on error
      }
    } finally {
      if (isMounted.current) {
        setScheduleLoading(false);
      }
      scheduleRequestCount.current = Math.max(0, scheduleRequestCount.current - 1);
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchSchedule();
  }, []);

  // Guard against null isAuthenticated to stabilize auth state
  if (isAuthenticated === null) {
    return (
      <div className="bg-background flex items-center justify-center flex-col min-h-screen">
        <div className="text-6xl mb-4 animate-pulse">🕒</div>
        <h3 className="text-2xl font-bold text-primary mb-2">Loading...</h3>
        <p className="text-muted-foreground text-sm">Authenticating your session...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden font-sans antialiased selection:bg-primary/20">
      <div className="flex flex-col w-full">
        <HeroSection />
        {/* Pass props correctly to FeaturedMenuSection if needed, it uses internal state/props in definition provided earlier? 
            Looking at FeaturedMenuSection definition: ({ items, menuLoading, menuError, fetchMenu, navigate, fallbackImage }) 
            So we must pass these.
        */}
        <FeaturedMenuSection
          items={featuredMenu}
          menuLoading={menuLoading}
          menuError={menuError}
          fetchMenu={fetchMenu}
          navigate={navigate}
          fallbackImage={fallbackImage}
        />

        <div className="grid grid-cols-1 md:grid-cols-2">
          <UpcomingScheduleSection
            schedule={upcomingSchedule}
            scheduleLoading={scheduleLoading}
            scheduleError={scheduleError}
            fetchSchedule={fetchSchedule}
            navigate={navigate}
          />
          <div className="flex flex-col border-l border-border">
            <StorySection />
            <Testimonials isReady={isReady} isPublic={!isAuthenticated} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
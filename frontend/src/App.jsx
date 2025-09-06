import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom'; // Import useLocation
import { loadUser } from './redux/actions/authActions';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  const dispatch = useDispatch();
  const { pathname } = useLocation(); // Get the current pathname

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]); // Trigger when pathname changes

  // Load user on mount
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <>
      <Navbar />
      <main
        className="min-h-screen"
        style={{ background: 'var(--background-image-primary-background)' }}
      >
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default App;
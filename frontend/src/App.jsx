import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { loadUser } from './redux/actions/authActions';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  const dispatch = useDispatch();

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
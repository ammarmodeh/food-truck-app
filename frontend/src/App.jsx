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
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default App;
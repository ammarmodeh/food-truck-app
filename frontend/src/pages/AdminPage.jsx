import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Dashboard from '../components/Admin/Dashboard';

const AdminPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.isAdmin) navigate('/');
  }, [user, navigate]);

  return (
    <div className="container mx-auto p-6">
      <Dashboard />
    </div>
  );
};

export default AdminPage;
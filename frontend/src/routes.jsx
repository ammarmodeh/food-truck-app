import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Profile from './pages/Profile';
import AdminPage from './pages/AdminPage';
import MenuList from './components/Menu/MenuList';
import Cart from './components/Order/Cart';
import ScheduleView from './components/Schedule/ScheduleView';
import CurrentLocation from './components/Location/CurrentLocation';
import OrderQueue from './components/Order/OrderQueue';
import UserOrderStatus from './components/Order/UserOrderStatus';
import OrdersManagement from './components/Admin/OrdersManagement';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import MenuManagement from './components/Menu/MenuManagement';
import ScheduleManagement from './components/Schedule/ScheduleManagement';
import ReviewsManagement from './components/Admin/ReviewsManagement';
import AdminRoute from './components/Admin/AdminRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'profile', element: <Profile /> },
      {
        path: 'admin',
        element: <AdminRoute><AdminPage /></AdminRoute>,
      },
      {
        path: 'orders-mgmt',
        element: <AdminRoute><OrdersManagement /></AdminRoute>,
      },
      {
        path: 'menu-mgmt',
        element: <AdminRoute><MenuManagement /></AdminRoute>,
      },
      {
        path: 'schedule-mgmt',
        element: <AdminRoute><ScheduleManagement /></AdminRoute>,
      },
      {
        path: 'reviews-mgmt',
        element: <AdminRoute><ReviewsManagement /></AdminRoute>,
      },
      { path: 'orders', element: <UserOrderStatus /> },
      { path: 'menu', element: <MenuList /> },
      { path: 'cart', element: <Cart /> },
      { path: 'schedule/:view', element: <ScheduleView /> },
      { path: 'location', element: <CurrentLocation /> },
      { path: 'queue', element: <OrderQueue /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password/:token', element: <ResetPassword /> },
    ],
  },
]);

export default router;
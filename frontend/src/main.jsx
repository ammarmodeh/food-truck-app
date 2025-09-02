import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import store from './redux/store';
import router from './routes';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import './tailwind.css';

// Initialize dark mode from localStorage
const theme = localStorage.getItem('theme') || 'light';
document.documentElement.classList.toggle('dark', theme === 'dark');

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <SocketProvider>
      <NotificationProvider>
        <RouterProvider router={router} />
      </NotificationProvider>
    </SocketProvider>
  </Provider>
);
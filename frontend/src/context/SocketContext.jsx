import { createContext, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const socket = io(`${import.meta.env.VITE_BACKEND_API}`, { autoConnect: false });

  useEffect(() => {
    if (user) {
      socket.auth = { userId: user._id };
      socket.connect();
      console.log('Socket.io connecting with userId:', user._id);
      socket.on('connect', () => {
        console.log('Socket.io connected, joining room:', user._id);
        socket.emit('join', user._id);
      });
    }
    return () => {
      socket.disconnect();
    };
  }, [user]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
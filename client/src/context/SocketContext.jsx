import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    // Dynamically import socket.io-client to avoid SSR issues
    import('socket.io-client').then(({ io }) => {
      if (socketRef.current) socketRef.current.disconnect();

      const socket = io(window.location.origin, {
        auth: token ? { token } : {},
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));

      socketRef.current = socket;
    }).catch(() => {
      console.log('Socket.io not available, real-time disabled');
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [token]);

  const joinOrderRoom = (orderId) => {
    if (socketRef.current) socketRef.current.emit('join:order', orderId);
  };

  const joinRiderRoom = (riderId) => {
    if (socketRef.current) socketRef.current.emit('join:rider', riderId);
  };

  const onOrderUpdate = (callback) => {
    if (socketRef.current) socketRef.current.on('order:update', callback);
    return () => { if (socketRef.current) socketRef.current.off('order:update', callback); };
  };

  const onNewOrder = (callback) => {
    if (socketRef.current) socketRef.current.on('order:new', callback);
    return () => { if (socketRef.current) socketRef.current.off('order:new', callback); };
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, joinOrderRoom, joinRiderRoom, onOrderUpdate, onNewOrder }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);

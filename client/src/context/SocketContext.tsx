import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getBackendUrl } from '../utils/environment';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendApiKey: (apiKey: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(getBackendUrl(), {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      
      // Send stored API key if available
      const storedApiKey = sessionStorage.getItem('anthropic_api_key');
      if (storedApiKey) {
        console.log('Sending stored API key to backend');
        newSocket.emit('store-api-key', { apiKey: storedApiKey });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('api-key-stored', (data) => {
      if (data.success) {
        console.log('API key successfully stored on backend');
      } else {
        console.error('Failed to store API key on backend:', data.error);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const sendApiKey = (apiKey: string) => {
    if (socket && isConnected) {
      console.log('Sending API key to backend via socket');
      socket.emit('store-api-key', { apiKey });
    } else {
      console.warn('Socket not connected, cannot send API key');
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, sendApiKey }}>
      {children}
    </SocketContext.Provider>
  );
};
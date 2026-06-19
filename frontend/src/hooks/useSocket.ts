import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import type { Notification } from '@/types';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to Socket.io server
    const socket = io('http://localhost:4000', {
      auth: {
        token: localStorage.getItem('ipn_token'),
      },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Socket.io connected');
      // Join user-specific room
      socket.emit('join', `user:${user.id}`);
    });

    socket.on('disconnect', () => {
      console.log('Socket.io disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
    });

    // Message events
    socket.on('message:new', () => {
      // Update messages cache
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    // Notification events
    socket.on('notification:new', (notification: Notification) => {
      // Update notifications cache
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png',
        });
      }
    });

    // Intro events
    socket.on('intro:received', () => {
      queryClient.invalidateQueries({ queryKey: ['intros', 'received'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket.on('intro:responded', () => {
      queryClient.invalidateQueries({ queryKey: ['intros', 'sent'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    // Mandate events
    socket.on('mandate:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['mandates'] });
    });

    // Request notification permission on first connect
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, user, queryClient]);

  // Helper function to emit events
  const emit = (event: string, data: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  return {
    socket: socketRef.current,
    emit,
    isConnected: socketRef.current?.connected || false,
  };
};

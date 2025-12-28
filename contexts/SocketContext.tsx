'use client';

/**
 * Socket.IO Client Context
 * Manages WebSocket connection and game state
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  GameState,
} from '@/types/game';

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextValue {
  socket: SocketType | null;
  gameState: GameState | null;
  isConnected: boolean;
  createRoom: (playerName: string) => Promise<{ success: boolean; roomId?: string; error?: string }>;
  joinRoom: (roomId: string, playerName: string) => Promise<{ success: boolean; error?: string }>;
  leaveRoom: () => Promise<{ success: boolean; error?: string }>;
  startGame: () => Promise<{ success: boolean; error?: string }>;
  passCard: (cardId: string) => Promise<{ success: boolean; error?: string }>;
  declareSet: () => Promise<{ success: boolean; error?: string }>;
  clickHand: () => Promise<{ success: boolean; position?: number; error?: string }>;
  continueGame: () => Promise<{ success: boolean; error?: string }>;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<SocketType | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance: SocketType = io({
      path: '/socket.io',
    });

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('game-state', (state) => {
      console.log('Game state updated:', state);
      setGameState(state);
    });

    socketInstance.on('phase-change', (data) => {
      console.log('Phase changed:', data);
    });

    socketInstance.on('player-joined', (data) => {
      console.log('Player joined:', data);
    });

    socketInstance.on('player-left', (data) => {
      console.log('Player left:', data);
    });

    socketInstance.on('player-passed', (data) => {
      console.log('Player passed:', data);
    });

    socketInstance.on('auto-pass', (data) => {
      console.log('Auto-pass:', data);
    });

    socketInstance.on('set-declared', (data) => {
      console.log('SET declared:', data);
    });

    socketInstance.on('hand-clicked', (data) => {
      console.log('Hand clicked:', data);
    });

    socketInstance.on('round-end', (data) => {
      console.log('Round ended:', data);
    });

    socketInstance.on('error', (message) => {
      console.error('Socket error:', message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const createRoom = useCallback(
    (playerName: string): Promise<{ success: boolean; roomId?: string; error?: string }> => {
      return new Promise((resolve) => {
        if (!socket) {
          console.error('Socket not connected');
          resolve({ success: false, error: 'Not connected' });
          return;
        }
        console.log('Emitting create-room event for:', playerName);
        socket.emit('create-room', playerName, (response) => {
          console.log('Create room response:', response);
          if (response.success && response.roomId) {
            // Save to localStorage
            localStorage.setItem('chaar-chitti-room', response.roomId);
            localStorage.setItem('chaar-chitti-player', playerName);
          }
          resolve(response);
        });
      });
    },
    [socket]
  );

  const joinRoom = useCallback(
    (roomId: string, playerName: string): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        if (!socket) {
          resolve({ success: false, error: 'Not connected' });
          return;
        }
        socket.emit('join-room', { roomId, playerName }, (response) => {
          if (response.success) {
            // Save to localStorage
            localStorage.setItem('chaar-chitti-room', roomId);
            localStorage.setItem('chaar-chitti-player', playerName);
          }
          resolve(response);
        });
      });
    },
    [socket]
  );

  const leaveRoom = useCallback((): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socket) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }
      socket.emit('leave-room', (response) => {
        if (response.success) {
          // Clear localStorage
          localStorage.removeItem('chaar-chitti-room');
          localStorage.removeItem('chaar-chitti-player');
        }
        resolve(response);
      });
    });
  }, [socket]);

  const startGame = useCallback((): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socket) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }
      socket.emit('start-game', resolve);
    });
  }, [socket]);

  const passCard = useCallback(
    (cardId: string): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        if (!socket) {
          resolve({ success: false, error: 'Not connected' });
          return;
        }
        socket.emit('pass-card', { cardId }, resolve);
      });
    },
    [socket]
  );

  const declareSet = useCallback((): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socket) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }
      socket.emit('declare-set', resolve);
    });
  }, [socket]);

  const clickHand = useCallback((): Promise<{ success: boolean; position?: number; error?: string }> => {
    return new Promise((resolve) => {
      if (!socket) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }
      socket.emit('click-hand', resolve);
    });
  }, [socket]);

  const continueGame = useCallback((): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socket) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }
      socket.emit('continue-game', resolve);
    });
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        gameState,
        isConnected,
        createRoom,
        joinRoom,
        leaveRoom,
        startGame,
        passCard,
        declareSet,
        clickHand,
        continueGame,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

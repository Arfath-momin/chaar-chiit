/**
 * Socket.IO Server for Chaar Chitti
 * Handles all real-time game communication
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  GameState,
} from '@/types/game';
import { gameEngine } from './game-engine';

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;

export function initSocketServer(httpServer: HTTPServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // CREATE ROOM
    socket.on('create-room', (playerName, callback) => {
      try {
        console.log('Creating room for player:', playerName);
        const roomId = gameEngine.createRoom(playerName, socket.id);
        const room = gameEngine.getRoom(roomId);
        
        if (room) {
          const player = Array.from(room.players.values())[0];
          socket.data.playerId = player.id;
          socket.data.roomId = roomId;
          socket.join(roomId);

          console.log('Room created successfully:', roomId, 'Player ID:', player.id);
          callback({ success: true, roomId });
          
          // Send initial game state
          socket.emit('game-state', buildGameState(room, player.id));
        } else {
          console.error('Room not found after creation');
          callback({ success: false, error: 'Failed to create room' });
        }
      } catch (error) {
        console.error('Error creating room:', error);
        callback({ success: false, error: 'Failed to create room' });
      }
    });

    // JOIN ROOM
    socket.on('join-room', ({ roomId, playerName }, callback) => {
      try {
        const result = gameEngine.joinRoom(roomId, playerName, socket.id);
        
        if (!result.success) {
          callback({ success: false, error: result.error });
          return;
        }

        socket.data.playerId = result.playerId!;
        socket.data.roomId = roomId;
        socket.join(roomId);

        callback({ success: true });

        // Notify all players
        const room = gameEngine.getRoom(roomId);
        if (room) {
          const player = room.players.get(result.playerId!);
          if (player) {
            io!.to(roomId).emit('player-joined', {
              playerId: player.id,
              playerName: player.name,
              playerCount: room.players.size,
            });

            // Send game state to all players
            broadcastGameState(roomId);
          }
        }
      } catch (error) {
        console.error('Error joining room:', error);
        callback({ success: false, error: 'Failed to join room' });
      }
    });

    // START GAME
    socket.on('start-game', (callback) => {
      const { roomId, playerId } = socket.data;
      
      if (!roomId || !playerId) {
        callback({ success: false, error: 'Not in a room' });
        return;
      }

      const result = gameEngine.startGame(roomId, playerId);
      
      if (!result.success) {
        callback({ success: false, error: result.error });
        return;
      }

      callback({ success: true });

      // Broadcast phase change
      const room = gameEngine.getRoom(roomId);
      if (room) {
        io!.to(roomId).emit('phase-change', {
          phase: room.phase,
          timer: room.timer,
        });
        broadcastGameState(roomId);
      }
    });

    // PASS CARD
    socket.on('pass-card', ({ cardId }, callback) => {
      const { roomId, playerId } = socket.data;
      
      if (!roomId || !playerId) {
        callback({ success: false, error: 'Not in a room' });
        return;
      }

      const result = gameEngine.passCard(roomId, playerId, cardId);
      
      if (!result.success) {
        callback({ success: false, error: result.error });
        return;
      }

      callback({ success: true });

      // Notify all players
      const room = gameEngine.getRoom(roomId);
      if (room) {
        const player = room.players.get(playerId);
        if (player) {
          io!.to(roomId).emit('player-passed', {
            playerId: player.id,
            playerName: player.name,
          });
          broadcastGameState(roomId);
        }
      }
    });

    // DECLARE SET
    socket.on('declare-set', (callback) => {
      const { roomId, playerId } = socket.data;
      
      if (!roomId || !playerId) {
        callback({ success: false, error: 'Not in a room' });
        return;
      }

      const result = gameEngine.declareSet(roomId, playerId);
      
      if (!result.success) {
        callback({ success: false, error: result.error });
        return;
      }

      callback({ success: true });

      // Notify all players
      const room = gameEngine.getRoom(roomId);
      if (room) {
        const player = room.players.get(playerId);
        if (player) {
          io!.to(roomId).emit('set-declared', {
            playerId: player.id,
            playerName: player.name,
          });
          io!.to(roomId).emit('phase-change', {
            phase: room.phase,
            timer: room.timer,
          });
          broadcastGameState(roomId);
        }
      }
    });

    // CLICK HAND
    socket.on('click-hand', (callback) => {
      const { roomId, playerId } = socket.data;
      
      if (!roomId || !playerId) {
        callback({ success: false, error: 'Not in a room' });
        return;
      }

      const result = gameEngine.clickHand(roomId, playerId);
      
      if (!result.success) {
        callback({ success: false, error: result.error });
        return;
      }

      callback({ success: true, position: result.position });

      // Notify all players
      const room = gameEngine.getRoom(roomId);
      if (room) {
        const player = room.players.get(playerId);
        if (player) {
          io!.to(roomId).emit('hand-clicked', {
            playerId: player.id,
            playerName: player.name,
            position: result.position!,
          });
          broadcastGameState(roomId);
        }
      }
    });

    // DISCONNECT
    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      const result = gameEngine.handleDisconnect(socket.id);
      
      if (result && result.roomId) {
        const room = gameEngine.getRoom(result.roomId);
        if (room) {
          const player = room.players.get(result.playerId!);
          if (player) {
            io!.to(result.roomId).emit('player-left', {
              playerId: player.id,
              playerName: player.name,
              playerCount: room.players.size,
            });
            broadcastGameState(result.roomId);
          }
        }
      }
    });
  });

  // Start game loop for all rooms (broadcasts updates periodically)
  setInterval(() => {
    broadcastAllRooms();
  }, 1000);

  return io;
}

/**
 * Build game state for a specific player
 */
function buildGameState(room: any, playerId: string): GameState {
  const player = room.players.get(playerId);
  const roomState = gameEngine.getRoomState(room.roomId, playerId);
  
  return {
    roomId: room.roomId,
    yourPlayerId: playerId,
    phase: room.phase,
    players: Array.from(room.players.values()).map((p: any) => ({
      id: p.id,
      name: p.name,
      socketId: p.socketId,
      cardCount: p.cards.length,
      hasPassed: p.hasPassed,
      hasSet: p.hasSet,
      score: p.score,
      handStackPosition: p.handStackPosition,
      handStackTimestamp: p.handStackTimestamp,
      isConnected: p.isConnected,
    })),
    yourCards: player?.cards || [],
    timer: room.timer,
    setWinner: room.setWinner,
    canPass: roomState?.canPass || false,
    canSet: roomState?.canSet || false,
    canHand: roomState?.canHand || false,
    roundNumber: room.roundNumber,
  };
}

/**
 * Broadcast game state to all players in a room
 */
function broadcastGameState(roomId: string) {
  if (!io) return;

  const room = gameEngine.getRoom(roomId);
  if (!room) return;

  // Send personalized state to each player
  room.players.forEach((player) => {
    const socket = io!.sockets.sockets.get(player.socketId);
    if (socket) {
      socket.emit('game-state', buildGameState(room, player.id));
    }
  });
}

/**
 * Broadcast updates for all active rooms
 */
function broadcastAllRooms() {
  if (!io) return;

  // This handles timer updates and phase transitions
  const rooms = Array.from((gameEngine as any).rooms.values());
  rooms.forEach((room: any) => {
    if (room.phase !== 'LOBBY' && room.phase !== 'ROUND_END') {
      broadcastGameState(room.roomId);
    }
  });
}

export function getIO() {
  return io;
}

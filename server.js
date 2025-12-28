/**
 * Custom Next.js server with Socket.IO support
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Import game engine (we'll inline the logic here for compatibility)
const { nanoid } = require('nanoid');

// Inline simplified game engine for server.js
class GameEngine {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(creatorName, creatorSocketId) {
    const roomId = nanoid(6).toUpperCase();
    const playerId = nanoid();

    const room = {
      roomId,
      players: new Map([[playerId, {
        id: playerId,
        name: creatorName,
        socketId: creatorSocketId,
        cards: [],
        hasPassed: false,
        hasSet: false,
        score: 0,
        isConnected: true,
      }]]),
      phase: 'LOBBY',
      deck: [],
      timer: 0,
      roundNumber: 0,
      currentPassingPlayerIndex: 0,
      config: {
        minPlayers: 4,
        maxPlayers: 10,
        passPhaseSeconds: 30,
        handStackSeconds: 10,
        scoring: { 1: 1000, 2: 500, 3: 400, 4: 300, 5: 200, 6: 100 },
      },
      createdAt: Date.now(),
    };

    this.rooms.set(roomId, room);
    return roomId;
  }

  joinRoom(roomId, playerName, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.phase !== 'LOBBY') return { success: false, error: 'Game already in progress' };
    if (room.players.size >= room.config.maxPlayers) return { success: false, error: 'Room is full' };

    const playerId = nanoid();
    room.players.set(playerId, {
      id: playerId,
      name: playerName,
      socketId: socketId,
      cards: [],
      hasPassed: false,
      hasSet: false,
      score: 0,
      isConnected: true,
    });

    return { success: true, playerId };
  }
  leaveRoom(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.phase !== 'LOBBY') return { success: false, error: 'Cannot leave after game started' };

    room.players.delete(playerId);
    
    // Delete room if empty
    if (room.players.size === 0) {
      if (room.timerHandle) clearInterval(room.timerHandle);
      this.rooms.delete(roomId);
    }

    return { success: true };
  }
  startGame(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.phase !== 'LOBBY') return { success: false, error: 'Game already started' };
    
    // Only host (first player) can start the game
    const hostId = Array.from(room.players.keys())[0];
    if (playerId !== hostId) return { success: false, error: 'Only the host can start the game' };
    
    if (room.players.size < room.config.minPlayers) {
      return { success: false, error: `Need at least ${room.config.minPlayers} players` };
    }

    this.transitionToDistribution(room);
    return { success: true };
  }

  transitionToDistribution(room) {
    room.phase = 'DISTRIBUTION';
    room.roundNumber++;
    
    room.players.forEach(player => {
      player.cards = [];
      player.hasPassed = false;
      player.hasSet = false;
      player.handStackPosition = undefined;
      player.handStackTimestamp = undefined;
    });

    room.deck = this.createAndShuffleDeck(room.players.size);

    const playerArray = Array.from(room.players.values());
    for (let i = 0; i < 4; i++) {
      playerArray.forEach(player => {
        const card = room.deck.pop();
        if (card) player.cards.push(card);
      });
    }

    this.transitionToPassPhase(room);
  }

  createAndShuffleDeck(playerCount) {
    const ALL_CATEGORIES = ['Mango', 'Potato', 'Eggplant', 'Okra', 'Carrot', 'Banana', 'Lemon', 'Onion', 'Tomato', 'Watermelon'];
    
    // Use exactly playerCount number of categories
    // Each category has exactly 4 cards
    const categoriesToUse = ALL_CATEGORIES.slice(0, playerCount);
    const deck = [];
    
    categoriesToUse.forEach(category => {
      // Add exactly 4 cards of this category
      for (let i = 0; i < 4; i++) {
        deck.push({ id: nanoid(), category });
      }
    });

    // Shuffle the deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  }

  transitionToPassPhase(room) {
    room.phase = 'PASS_PHASE';
    room.timer = room.config.passPhaseSeconds;
    room.setWinner = undefined;
    room.currentPassingPlayerIndex = 0;

    // Reset all players' hasPassed status
    room.players.forEach(player => {
      player.hasPassed = false;
    });

    this.startPlayerTurn(room);
  }

  startPlayerTurn(room) {
    if (room.timerHandle) clearInterval(room.timerHandle);

    room.timer = room.config.passPhaseSeconds;

    room.timerHandle = setInterval(() => {
      room.timer--;
      if (room.timer <= 0) this.handlePassPhaseTimeout(room);
    }, 1000);
  }

  getCurrentPlayer(room) {
    const playerIds = Array.from(room.players.keys()).filter(id => room.players.get(id).isConnected);
    if (room.currentPassingPlayerIndex >= playerIds.length) return null;
    return room.players.get(playerIds[room.currentPassingPlayerIndex]);
  }

  handlePassPhaseTimeout(room) {
    if (room.timerHandle) {
      clearInterval(room.timerHandle);
      room.timerHandle = undefined;
    }

    const currentPlayer = this.getCurrentPlayer(room);
    if (currentPlayer && !currentPlayer.hasPassed && currentPlayer.cards.length > 0) {
      this.autoPassCard(room, currentPlayer.id);
    }

    this.moveToNextPlayer(room);
  }

  autoPassCard(room, playerId) {
    const player = room.players.get(playerId);
    if (!player || player.hasPassed || player.cards.length === 0) return;

    // Remove the first card from current player
    const cardToPass = player.cards.shift();
    player.hasPassed = true;

    const nextPlayer = this.getNextPlayer(room, playerId);
    if (nextPlayer) nextPlayer.cards.push(cardToPass);
  }

  passCard(roomId, playerId, cardId) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.phase !== 'PASS_PHASE') return { success: false, error: 'Not in pass phase' };

    const currentPlayer = this.getCurrentPlayer(room);
    if (!currentPlayer || currentPlayer.id !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    const player = room.players.get(playerId);
    if (!player) return { success: false, error: 'Player not found' };
    if (player.hasPassed) return { success: false, error: 'You have already passed' };

    const cardIndex = player.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { success: false, error: 'Card not found' };

    const [cardToPass] = player.cards.splice(cardIndex, 1);
    player.hasPassed = true;

    const nextPlayer = this.getNextPlayer(room, playerId);
    if (nextPlayer) nextPlayer.cards.push(cardToPass);

    return { success: true };
  }

  getNextPlayer(room, currentPlayerId) {
    const playerIds = Array.from(room.players.keys());
    const currentIndex = playerIds.indexOf(currentPlayerId);
    if (currentIndex === -1) return null;
    
    const nextIndex = (currentIndex + 1) % playerIds.length;
    return room.players.get(playerIds[nextIndex]) || null;
  }

  moveToNextPlayer(room) {
    if (room.setWinner) return;

    room.currentPassingPlayerIndex++;
    
    const connectedPlayers = Array.from(room.players.values()).filter(p => p.isConnected);
    
    if (room.currentPassingPlayerIndex >= connectedPlayers.length) {
      // All players have passed one card, reset for next passing round
      if (room.timerHandle) {
        clearInterval(room.timerHandle);
        room.timerHandle = undefined;
      }
      
      // Reset hasPassed flags and start new passing round
      room.players.forEach(player => {
        player.hasPassed = false;
      });
      room.currentPassingPlayerIndex = 0;
      
      // Start next passing round immediately
      this.startPlayerTurn(room);
    } else {
      // Start next player's turn
      this.startPlayerTurn(room);
    }
  }

  declareSet(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.phase !== 'PASS_PHASE') return { success: false, error: 'Not in pass phase' };
    if (room.setWinner) return { success: false, error: 'SET already declared' };

    const player = room.players.get(playerId);
    if (!player) return { success: false, error: 'Player not found' };
    if (player.cards.length !== 4) return { success: false, error: 'You must have exactly 4 cards' };

    const firstCategory = player.cards[0].category;
    const allIdentical = player.cards.every(card => card.category === firstCategory);
    if (!allIdentical) return { success: false, error: 'Cards are not identical' };

    room.setWinner = playerId;
    player.hasSet = true;
    player.handStackPosition = 1;
    player.handStackTimestamp = Date.now();

    if (room.timerHandle) {
      clearInterval(room.timerHandle);
      room.timerHandle = undefined;
    }

    this.transitionToHandStack(room);
    return { success: true };
  }

  transitionToHandStack(room) {
    room.phase = 'HAND_STACK';
    room.timer = room.config.handStackSeconds;

    room.timerHandle = setInterval(() => {
      room.timer--;
      if (room.timer <= 0) this.handleHandStackTimeout(room);
    }, 1000);
  }

  clickHand(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.phase !== 'HAND_STACK') return { success: false, error: 'Not in hand stack phase' };

    const player = room.players.get(playerId);
    if (!player) return { success: false, error: 'Player not found' };
    if (player.handStackPosition !== undefined) return { success: false, error: 'You already clicked hand' };

    player.handStackTimestamp = Date.now();

    const playersWithTimestamps = Array.from(room.players.values())
      .filter(p => p.handStackTimestamp !== undefined)
      .sort((a, b) => a.handStackTimestamp - b.handStackTimestamp);

    player.handStackPosition = playersWithTimestamps.findIndex(p => p.id === playerId) + 1;

    return { success: true, position: player.handStackPosition };
  }

  handleHandStackTimeout(room) {
    if (room.timerHandle) {
      clearInterval(room.timerHandle);
      room.timerHandle = undefined;
    }
    this.endRound(room);
  }

  endRound(room) {
    room.phase = 'ROUND_END';

    const playersWithoutPosition = Array.from(room.players.values())
      .filter(p => p.handStackPosition === undefined && p.isConnected);

    let nextPosition = Array.from(room.players.values())
      .filter(p => p.handStackPosition !== undefined)
      .length + 1;

    playersWithoutPosition.forEach(player => {
      player.handStackPosition = nextPosition++;
    });

    Array.from(room.players.values()).forEach(player => {
      const position = player.handStackPosition || 999;
      const points = room.config.scoring[position] || 0;
      player.score += points;
    });

    // Stay in ROUND_END phase, wait for host to continue
  }

  continueGame(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.phase !== 'ROUND_END') return { success: false, error: 'Round has not ended' };
    
    // Only host can continue
    const hostId = Array.from(room.players.keys())[0];
    if (playerId !== hostId) return { success: false, error: 'Only the host can continue the game' };

    this.transitionToDistribution(room);
    return { success: true };
  }

  getRoomState(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.get(playerId);
    if (!player) return null;

    const currentPlayer = this.getCurrentPlayer(room);
    const isPlayerTurn = currentPlayer && currentPlayer.id === playerId;

    return {
      room,
      player,
      canPass: room.phase === 'PASS_PHASE' && isPlayerTurn && !player.hasPassed && player.cards.length > 0,
      canSet: this.canPlayerSet(room, player),
      canHand: room.phase === 'HAND_STACK' && player.handStackPosition === undefined && player.id !== room.setWinner,
    };
  }

  canPlayerSet(room, player) {
    if (room.phase !== 'PASS_PHASE') return false;
    if (room.setWinner) return false;
    if (player.cards.length !== 4) return false;

    const firstCategory = player.cards[0].category;
    return player.cards.every(card => card.category === firstCategory);
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  handleDisconnect(socketId) {
    for (const [roomId, room] of this.rooms.entries()) {
      for (const [playerId, player] of room.players.entries()) {
        if (player.socketId === socketId) {
          player.isConnected = false;
          
          if (room.phase === 'LOBBY') {
            room.players.delete(playerId);
            if (room.players.size === 0) {
              if (room.timerHandle) clearInterval(room.timerHandle);
              this.rooms.delete(roomId);
            }
          }
          
          return { roomId, playerId };
        }
      }
    }
    return null;
  }
}

const gameEngine = new GameEngine();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: dev ? ['http://localhost:3000'] : false,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

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

    socket.on('join-room', ({ roomId, playerName }, callback) => {
      try {
        const result = gameEngine.joinRoom(roomId, playerName, socket.id);
        
        if (!result.success) {
          callback({ success: false, error: result.error });
          return;
        }

        socket.data.playerId = result.playerId;
        socket.data.roomId = roomId;
        socket.join(roomId);

        callback({ success: true });

        const room = gameEngine.getRoom(roomId);
        if (room) {
          const player = room.players.get(result.playerId);
          if (player) {
            io.to(roomId).emit('player-joined', {
              playerId: player.id,
              playerName: player.name,
              playerCount: room.players.size,
            });
            broadcastGameState(roomId);
          }
        }
      } catch (error) {
        console.error('Error joining room:', error);
        callback({ success: false, error: 'Failed to join room' });
      }
    });

    socket.on('leave-room', (callback) => {
      const { roomId, playerId } = socket.data;
      
      console.log('Leave room attempt - roomId:', roomId, 'playerId:', playerId);
      
      if (!roomId || !playerId) {
        callback({ success: false, error: 'Not in a room' });
        return;
      }

      try {
        // Get player name before deleting
        const room = gameEngine.getRoom(roomId);
        const player = room?.players.get(playerId);
        const playerName = player?.name || 'Player';
        
        const result = gameEngine.leaveRoom(roomId, playerId);
        
        if (!result.success) {
          callback({ success: false, error: result.error });
          return;
        }

        // Notify others that player left
        io.to(roomId).emit('player-left', { 
          playerId, 
          playerName, 
          playerCount: room ? room.players.size : 0
        });
        
        // Update remaining players
        const updatedRoom = gameEngine.getRoom(roomId);
        if (updatedRoom) {
          broadcastGameState(roomId);
        }

        // Clean up socket data
        socket.leave(roomId);
        delete socket.data.roomId;
        delete socket.data.playerId;

        callback({ success: true });
      } catch (error) {
        console.error('Error leaving room:', error);
        callback({ success: false, error: 'Failed to leave room' });
      }
    });

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

      const room = gameEngine.getRoom(roomId);
      if (room) {
        io.to(roomId).emit('phase-change', { phase: room.phase, timer: room.timer });
        broadcastGameState(roomId);
      }
    });

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

      const room = gameEngine.getRoom(roomId);
      if (room) {
        const player = room.players.get(playerId);
        if (player) {
          io.to(roomId).emit('player-passed', { playerId: player.id, playerName: player.name });
          
          // Move to next player's turn
          gameEngine.moveToNextPlayer(room);
          
          broadcastGameState(roomId);
        }
      }
    });

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

      const room = gameEngine.getRoom(roomId);
      if (room) {
        const player = room.players.get(playerId);
        if (player) {
          io.to(roomId).emit('set-declared', { playerId: player.id, playerName: player.name });
          io.to(roomId).emit('phase-change', { phase: room.phase, timer: room.timer });
          broadcastGameState(roomId);
        }
      }
    });

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

      const room = gameEngine.getRoom(roomId);
      if (room) {
        const player = room.players.get(playerId);
        if (player) {
          io.to(roomId).emit('hand-clicked', { playerId: player.id, playerName: player.name, position: result.position });
          broadcastGameState(roomId);
        }
      }
    });

    socket.on('continue-game', (callback) => {
      const { roomId, playerId } = socket.data;
      
      if (!roomId || !playerId) {
        callback({ success: false, error: 'Not in a room' });
        return;
      }

      const result = gameEngine.continueGame(roomId, playerId);
      
      if (!result.success) {
        callback({ success: false, error: result.error });
        return;
      }

      callback({ success: true });

      const room = gameEngine.getRoom(roomId);
      if (room) {
        broadcastGameState(roomId);
      }
    });

    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      const result = gameEngine.handleDisconnect(socket.id);
      
      if (result && result.roomId) {
        const room = gameEngine.getRoom(result.roomId);
        if (room) {
          const player = room.players.get(result.playerId);
          if (player) {
            io.to(result.roomId).emit('player-left', {
              playerId: player.id,
              playerName: player.name,
              playerCount: room.players.size,
            });
            broadcastGameState(result.roomId);
          }
        }
      }
    });

    function buildGameState(room, playerId) {
      const player = room.players.get(playerId);
      const roomState = gameEngine.getRoomState(room.roomId, playerId);
      const currentPlayer = gameEngine.getCurrentPlayer(room);
      
      return {
        roomId: room.roomId,
        yourPlayerId: playerId,
        phase: room.phase,
        players: Array.from(room.players.values()).map(p => ({
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
        currentPassingPlayerId: currentPlayer?.id,
        canPass: roomState?.canPass || false,
        canSet: roomState?.canSet || false,
        canHand: roomState?.canHand || false,
        roundNumber: room.roundNumber,
      };
    }

    function broadcastGameState(roomId) {
      const room = gameEngine.getRoom(roomId);
      if (!room) return;

      room.players.forEach((player) => {
        const socket = io.sockets.sockets.get(player.socketId);
        if (socket) {
          socket.emit('game-state', buildGameState(room, player.id));
        }
      });
    }
  });

  setInterval(() => {
    gameEngine.rooms.forEach((room) => {
      if (room.phase !== 'LOBBY') {
        room.players.forEach((player) => {
          const socket = io.sockets.sockets.get(player.socketId);
          if (socket) {
            socket.emit('game-state', buildGameState(room, player.id));
          }
        });
      }
    });
  }, 1000);

  function buildGameState(room, playerId) {
    const player = room.players.get(playerId);
    const roomState = gameEngine.getRoomState(room.roomId, playerId);
    const currentPlayer = gameEngine.getCurrentPlayer(room);
    
    return {
      roomId: room.roomId,
      yourPlayerId: playerId,
      phase: room.phase,
      players: Array.from(room.players.values()).map(p => ({
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
      currentPassingPlayerId: currentPlayer?.id,
      canPass: roomState?.canPass || false,
      canSet: roomState?.canSet || false,
      canHand: roomState?.canHand || false,
      roundNumber: room.roundNumber,
    };
  }

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log('✓ Socket.IO server initialized');
  });
});


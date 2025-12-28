/**
 * Chaar Chitti Game Engine
 * Server-authoritative game logic - SINGLE SOURCE OF TRUTH
 */

import { nanoid } from 'nanoid';
import type {
  Card,
  CardCategory,
  GameRoom,
  Player,
  GamePhase,
  GameConfig,
} from '@/types/game';

const CARD_CATEGORIES: CardCategory[] = ['Apple', 'Mango', 'Banana', 'Orange', 'Grape', 'Pineapple'];

const DEFAULT_CONFIG: GameConfig = {
  minPlayers: 3,
  maxPlayers: 10,
  passPhaseSeconds: 30,
  handStackSeconds: 10,
  scoring: {
    1: 1000, // 1st place (SET winner)
    2: 500,
    3: 400,
    4: 300,
    5: 200,
    6: 100,
  },
};

export class GameEngine {
  private rooms: Map<string, GameRoom> = new Map();

  /**
   * Create a new game room
   */
  createRoom(creatorName: string, creatorSocketId: string): string {
    const roomId = nanoid(6).toUpperCase();
    const playerId = nanoid();

    const creator: Player = {
      id: playerId,
      name: creatorName,
      socketId: creatorSocketId,
      cards: [],
      hasPassed: false,
      hasSet: false,
      score: 0,
      isConnected: true,
    };

    const room: GameRoom = {
      roomId,
      players: new Map([[playerId, creator]]),
      phase: 'LOBBY',
      deck: [],
      timer: 0,
      roundNumber: 0,
      config: DEFAULT_CONFIG,
      createdAt: Date.now(),
    };

    this.rooms.set(roomId, room);
    return roomId;
  }

  /**
   * Join an existing room
   */
  joinRoom(roomId: string, playerName: string, socketId: string): { success: boolean; playerId?: string; error?: string } {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    // Check if player with same name already exists (rejoin scenario)
    const existingPlayer = Array.from(room.players.values()).find(p => p.name === playerName);
    
    if (existingPlayer) {
      // Rejoin - update socket ID and mark as connected
      existingPlayer.socketId = socketId;
      existingPlayer.isConnected = true;
      console.log(`Player ${playerName} rejoined room ${roomId}`);
      return { success: true, playerId: existingPlayer.id };
    }

    // New player joining
    if (room.phase !== 'LOBBY') {
      return { success: false, error: 'Game already in progress' };
    }

    if (room.players.size >= room.config.maxPlayers) {
      return { success: false, error: 'Room is full' };
    }

    const playerId = nanoid();
    const player: Player = {
      id: playerId,
      name: playerName,
      socketId: socketId,
      cards: [],
      hasPassed: false,
      hasSet: false,
      score: 0,
      isConnected: true,
    };

    room.players.set(playerId, player);
    return { success: true, playerId };
  }

  /**
   * Start the game (transition from LOBBY to DISTRIBUTION)
   */
  startGame(roomId: string, requestingPlayerId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.phase !== 'LOBBY') {
      return { success: false, error: 'Game already started' };
    }

    if (room.players.size < room.config.minPlayers) {
      return { success: false, error: `Need at least ${room.config.minPlayers} players` };
    }

    // Start the game
    this.transitionToDistribution(room);
    return { success: true };
  }

  /**
   * DISTRIBUTION PHASE: Deal 4 cards to each player
   */
  private transitionToDistribution(room: GameRoom): void {
    room.phase = 'DISTRIBUTION';
    room.roundNumber++;
    
    // Reset player states
    room.players.forEach(player => {
      player.cards = [];
      player.hasPassed = false;
      player.hasSet = false;
      player.handStackPosition = undefined;
      player.handStackTimestamp = undefined;
    });

    // Create and shuffle deck
    room.deck = this.createAndShuffleDeck(room.players.size);

    // Deal 4 cards to each player
    const playerArray = Array.from(room.players.values());
    for (let i = 0; i < 4; i++) {
      playerArray.forEach(player => {
        const card = room.deck.pop();
        if (card) {
          player.cards.push(card);
        }
      });
    }

    // Immediately transition to PASS PHASE
    this.transitionToPassPhase(room);
  }

  /**
   * Create and shuffle deck
   */
  private createAndShuffleDeck(playerCount: number): Card[] {
    const deck: Card[] = [];
    
    // Each category needs enough cards for all players to potentially get a set
    // We create 4 cards per player for each category to ensure enough cards
    const cardsPerCategory = Math.ceil(playerCount / CARD_CATEGORIES.length) * 4 + 4;
    
    CARD_CATEGORIES.forEach(category => {
      for (let i = 0; i < cardsPerCategory; i++) {
        deck.push({
          id: nanoid(),
          category,
        });
      }
    });

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  }

  /**
   * PASS PHASE: 30 seconds for all players to pass simultaneously
   */
  private transitionToPassPhase(room: GameRoom): void {
    room.phase = 'PASS_PHASE';
    room.timer = room.config.passPhaseSeconds;
    room.setWinner = undefined;

    // Clear any existing timer
    if (room.timerHandle) {
      clearInterval(room.timerHandle);
    }

    // Start countdown timer
    room.timerHandle = setInterval(() => {
      room.timer--;

      if (room.timer <= 0) {
        this.handlePassPhaseTimeout(room);
      }
    }, 1000);
  }

  /**
   * Handle pass phase timeout - auto-pass for players who haven't passed
   */
  private handlePassPhaseTimeout(room: GameRoom): void {
    if (room.timerHandle) {
      clearInterval(room.timerHandle);
      room.timerHandle = undefined;
    }

    // Auto-pass for players who haven't passed yet
    const autoPasses: Array<{ playerId: string; playerName: string }> = [];
    
    room.players.forEach(player => {
      if (!player.hasPassed && player.isConnected) {
        // Auto-pass top card (index 0)
        if (player.cards.length > 0) {
          this.autoPassCard(room, player.id);
          autoPasses.push({ playerId: player.id, playerName: player.name });
        }
      }
    });

    // Check if game should end or continue
    this.checkPassPhaseCompletion(room);
  }

  /**
   * Auto-pass the top card for a player
   */
  private autoPassCard(room: GameRoom, playerId: string): void {
    const player = room.players.get(playerId);
    if (!player || player.hasPassed || player.cards.length === 0) return;

    const cardToPass = player.cards[0]; // Top card
    player.hasPassed = true;

    // Pass to next player (clockwise)
    const nextPlayer = this.getNextPlayer(room, playerId);
    if (nextPlayer) {
      nextPlayer.cards.push(cardToPass);
    }
  }

  /**
   * Player passes a card
   */
  passCard(roomId: string, playerId: string, cardId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.phase !== 'PASS_PHASE') {
      return { success: false, error: 'Not in pass phase' };
    }

    const player = room.players.get(playerId);
    
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (player.hasPassed) {
      return { success: false, error: 'You have already passed' };
    }

    const cardIndex = player.cards.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      return { success: false, error: 'Card not found' };
    }

    // Remove card from player
    const [cardToPass] = player.cards.splice(cardIndex, 1);
    player.hasPassed = true;

    // Pass to next player (clockwise)
    const nextPlayer = this.getNextPlayer(room, playerId);
    if (nextPlayer) {
      nextPlayer.cards.push(cardToPass);
    }

    return { success: true };
  }

  /**
   * Get next player in clockwise order
   */
  private getNextPlayer(room: GameRoom, currentPlayerId: string): Player | null {
    const playerIds = Array.from(room.players.keys());
    const currentIndex = playerIds.indexOf(currentPlayerId);
    
    if (currentIndex === -1) return null;
    
    const nextIndex = (currentIndex + 1) % playerIds.length;
    const nextPlayerId = playerIds[nextIndex];
    
    return room.players.get(nextPlayerId) || null;
  }

  /**
   * Check if pass phase is complete
   */
  private checkPassPhaseCompletion(room: GameRoom): void {
    // If a SET has been declared, don't check completion
    if (room.setWinner) return;

    // Check if all connected players have passed
    const allPassed = Array.from(room.players.values())
      .filter(p => p.isConnected)
      .every(p => p.hasPassed);

    if (allPassed) {
      // No one got a SET, start new round
      setTimeout(() => {
        this.transitionToDistribution(room);
      }, 2000);
    }
  }

  /**
   * Player declares SET
   */
  declareSet(roomId: string, playerId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.phase !== 'PASS_PHASE') {
      return { success: false, error: 'Not in pass phase' };
    }

    if (room.setWinner) {
      return { success: false, error: 'SET already declared' };
    }

    const player = room.players.get(playerId);
    
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    // CRITICAL: Must have passed first
    if (!player.hasPassed) {
      return { success: false, error: 'You must pass before declaring SET' };
    }

    // Must have exactly 4 cards
    if (player.cards.length !== 4) {
      return { success: false, error: 'You must have exactly 4 cards' };
    }

    // All 4 cards must be identical
    const firstCategory = player.cards[0].category;
    const allIdentical = player.cards.every(card => card.category === firstCategory);
    
    if (!allIdentical) {
      return { success: false, error: 'Cards are not identical' };
    }

    // Valid SET!
    room.setWinner = playerId;
    player.hasSet = true;
    player.handStackPosition = 1;
    player.handStackTimestamp = Date.now();

    // Stop pass phase timer
    if (room.timerHandle) {
      clearInterval(room.timerHandle);
      room.timerHandle = undefined;
    }

    // Transition to HAND_STACK phase
    this.transitionToHandStack(room);

    return { success: true };
  }

  /**
   * HAND_STACK PHASE: Other players quickly click HAND
   */
  private transitionToHandStack(room: GameRoom): void {
    room.phase = 'HAND_STACK';
    room.timer = room.config.handStackSeconds;

    room.timerHandle = setInterval(() => {
      room.timer--;

      if (room.timer <= 0) {
        this.handleHandStackTimeout(room);
      }
    }, 1000);
  }

  /**
   * Player clicks HAND
   */
  clickHand(roomId: string, playerId: string): { success: boolean; position?: number; error?: string } {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.phase !== 'HAND_STACK') {
      return { success: false, error: 'Not in hand stack phase' };
    }

    const player = room.players.get(playerId);
    
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (player.handStackPosition !== undefined) {
      return { success: false, error: 'You already clicked hand' };
    }

    // Record timestamp
    player.handStackTimestamp = Date.now();

    // Calculate position based on timestamp order
    const playersWithTimestamps = Array.from(room.players.values())
      .filter(p => p.handStackTimestamp !== undefined)
      .sort((a, b) => a.handStackTimestamp! - b.handStackTimestamp!);

    player.handStackPosition = playersWithTimestamps.findIndex(p => p.id === playerId) + 1;

    return { success: true, position: player.handStackPosition };
  }

  /**
   * Handle hand stack timeout - end round and calculate scores
   */
  private handleHandStackTimeout(room: GameRoom): void {
    if (room.timerHandle) {
      clearInterval(room.timerHandle);
      room.timerHandle = undefined;
    }

    this.endRound(room);
  }

  /**
   * End round and calculate scores
   */
  private endRound(room: GameRoom): void {
    room.phase = 'ROUND_END';

    // Assign positions to players who didn't click hand
    const playersWithoutPosition = Array.from(room.players.values())
      .filter(p => p.handStackPosition === undefined && p.isConnected);

    let nextPosition = Array.from(room.players.values())
      .filter(p => p.handStackPosition !== undefined)
      .length + 1;

    playersWithoutPosition.forEach(player => {
      player.handStackPosition = nextPosition++;
    });

    // Calculate scores
    Array.from(room.players.values()).forEach(player => {
      const position = player.handStackPosition || 999;
      const points = room.config.scoring[position] || 0;
      player.score += points;
    });

    // Start next round after delay
    setTimeout(() => {
      this.transitionToDistribution(room);
    }, 5000);
  }

  /**
   * Get room state for a specific player
   */
  getRoomState(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.get(playerId);
    if (!player) return null;

    return {
      room,
      player,
      canPass: room.phase === 'PASS_PHASE' && !player.hasPassed && player.cards.length > 0,
      canSet: this.canPlayerSet(room, player),
      canHand: room.phase === 'HAND_STACK' && player.handStackPosition === undefined && player.id !== room.setWinner,
    };
  }

  /**
   * Check if player can declare SET
   */
  private canPlayerSet(room: GameRoom, player: Player): boolean {
    if (room.phase !== 'PASS_PHASE') return false;
    if (room.setWinner) return false;
    if (!player.hasPassed) return false;
    if (player.cards.length !== 4) return false;

    const firstCategory = player.cards[0].category;
    return player.cards.every(card => card.category === firstCategory);
  }

  /**
   * Get room by ID
   */
  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Handle player disconnect
   */
  handleDisconnect(socketId: string): { roomId?: string; playerId?: string } | null {
    for (const [roomId, room] of this.rooms.entries()) {
      for (const [playerId, player] of room.players.entries()) {
        if (player.socketId === socketId) {
          player.isConnected = false;
          
          // If in lobby, remove player
          if (room.phase === 'LOBBY') {
            room.players.delete(playerId);
            
            // If room is empty, delete it
            if (room.players.size === 0) {
              if (room.timerHandle) {
                clearInterval(room.timerHandle);
              }
              this.rooms.delete(roomId);
            }
          }
          
          return { roomId, playerId };
        }
      }
    }
    return null;
  }

  /**
   * Reconnect player
   */
  reconnectPlayer(roomId: string, playerId: string, socketId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.get(playerId);
    if (!player) return false;

    player.socketId = socketId;
    player.isConnected = true;
    return true;
  }

  /**
   * Get all players in room
   */
  getRoomPlayers(roomId: string): Player[] {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.players.values()) : [];
  }
}

// Singleton instance
export const gameEngine = new GameEngine();

/**
 * Chaar Chitti Game Types
 * Server-authoritative multiplayer card game
 */

export type CardCategory = 'Mango' | 'Potato' | 'Eggplant' | 'Okra' | 'Carrot' | 'Banana' | 'Lemon' | 'Onion' | 'Tomato' | 'Watermelon';

export interface Card {
  id: string;
  category: CardCategory;
}

export type GamePhase = 'LOBBY' | 'DISTRIBUTION' | 'PASS_PHASE' | 'HAND_STACK' | 'ROUND_END';

export interface Player {
  id: string;
  name: string;
  socketId: string;
  cards: Card[];
  hasPassed: boolean;
  hasSet: boolean;
  score: number;
  handStackPosition?: number; // Position when hand was clicked (1 = winner, 2 = second, etc.)
  handStackTimestamp?: number; // Timestamp when hand was clicked
  isConnected: boolean;
}

export interface GameConfig {
  minPlayers: number;
  maxPlayers: number;
  passPhaseSeconds: number;
  handStackSeconds: number;
  scoring: {
    [position: number]: number; // 1: 1000, 2: 500, etc.
  };
}

export interface GameRoom {
  roomId: string;
  players: Map<string, Player>; // playerId -> Player
  phase: GamePhase;
  deck: Card[];
  timer: number; // Remaining seconds in current phase
  timerHandle?: NodeJS.Timeout;
  setWinner?: string; // playerId of the player who got SET
  roundNumber: number;
  config: GameConfig;
  createdAt: number;
}

export interface GameState {
  roomId: string;
  yourPlayerId: string; // Your player ID
  phase: GamePhase;
  players: Array<Omit<Player, 'cards'> & { cardCount: number }>; // Don't send other players' cards
  yourCards: Card[]; // Only your cards
  timer: number;
  setWinner?: string;
  currentPassingPlayerId?: string; // Whose turn it is to pass
  canPass: boolean; // Can this player pass?
  canSet: boolean; // Can this player set?
  canHand: boolean; // Can this player click hand?
  roundNumber: number;
}

// WebSocket Events (Client -> Server)
export interface ClientToServerEvents {
  'create-room': (playerName: string, callback: (response: { success: boolean; roomId?: string; error?: string }) => void) => void;
  'join-room': (data: { roomId: string; playerName: string }, callback: (response: { success: boolean; error?: string }) => void) => void;
  'leave-room': (callback: (response: { success: boolean; error?: string }) => void) => void;
  'start-game': (callback: (response: { success: boolean; error?: string }) => void) => void;
  'pass-card': (data: { cardId: string }, callback: (response: { success: boolean; error?: string }) => void) => void;
  'declare-set': (callback: (response: { success: boolean; error?: string }) => void) => void;
  'click-hand': (callback: (response: { success: boolean; position?: number; error?: string }) => void) => void;
  'continue-game': (callback: (response: { success: boolean; error?: string }) => void) => void;
  'disconnect': () => void;
}

// WebSocket Events (Server -> Client)
export interface ServerToClientEvents {
  'game-state': (state: GameState) => void;
  'phase-change': (data: { phase: GamePhase; timer: number }) => void;
  'player-joined': (data: { playerId: string; playerName: string; playerCount: number }) => void;
  'player-left': (data: { playerId: string; playerName: string; playerCount: number }) => void;
  'player-passed': (data: { playerId: string; playerName: string }) => void;
  'auto-pass': (data: { playerId: string; playerName: string }) => void;
  'set-declared': (data: { playerId: string; playerName: string }) => void;
  'hand-clicked': (data: { playerId: string; playerName: string; position: number }) => void;
  'round-end': (data: { scores: Array<{ playerId: string; playerName: string; position: number; points: number; totalScore: number }> }) => void;
  'error': (message: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  playerId?: string;
  roomId?: string;
}

# Chaar Chitti - Multiplayer Card Game

A **real-time, mobile-first multiplayer web app** for the traditional Indian card game **Chaar Chitti**. Built with Next.js, TypeScript, Socket.IO, and Tailwind CSS.

## 🎮 Game Overview

**Chaar Chitti** is a fast-paced multiplayer card game where players race to collect 4 identical cards.

### Game Rules

- **Players**: 3-10 players per room
- **Objective**: Be the first to PASS a card and then declare SET with 4 identical cards
- **Cards**: Each player always holds exactly 4 cards from categories (Apple, Mango, Banana, Orange, Grape, Pineapple)
- **Speed**: Quick reflexes and strategic passing are key to winning

### Game Flow

1. **Lobby Phase**: Players join via room code, minimum 3 players required to start
2. **Distribution Phase**: Server deals 4 cards to each player
3. **Pass Phase** (30 seconds):
   - All players simultaneously select and pass 1 card clockwise
   - After passing, if a player has 4 identical cards, the SET button appears
   - Auto-pass: Players who don't pass within 30 seconds automatically pass their top card
4. **Hand Stack Phase**: After a SET is declared, other players race to click HAND
5. **Scoring**: Points awarded based on position (1st: 1000, 2nd: 500, etc.)
6. **Round End**: Scores updated, new round begins automatically

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 19, TypeScript
- **Backend**: Custom Node.js server with Next.js
- **Real-time**: Socket.IO (WebSocket with fallback)
- **Styling**: Tailwind CSS 4
- **State Management**: React Context API
- **Room Codes**: nanoid

### Project Structure

```
chaar-chitti/
├── app/
│   ├── layout.tsx          # Root layout with SocketProvider
│   ├── page.tsx            # Main game UI (home, lobby, game screens)
│   └── globals.css         # Global styles
├── contexts/
│   └── SocketContext.tsx   # Socket.IO client context and hooks
├── lib/
│   ├── game-engine.ts      # Server-authoritative game logic
│   └── socket-server.ts    # Socket.IO server setup and event handlers
├── types/
│   └── game.ts             # TypeScript type definitions
├── server.js               # Custom Next.js server with Socket.IO
└── package.json
```

### Server-Authoritative Design

**CRITICAL**: The server is the **single source of truth** for all game logic:

- ✅ Server validates all player actions (pass, set, hand)
- ✅ Server manages timers and phase transitions
- ✅ Server prevents cheating (e.g., declaring SET before passing)
- ✅ Server handles edge cases (disconnections, timeouts, AFK players)
- ❌ Client NEVER makes game decisions, only sends requests

### State Machine

```
LOBBY → DISTRIBUTION → PASS_PHASE → HAND_STACK → ROUND_END → DISTRIBUTION...
```

**Phase Transitions**:
- `LOBBY`: Waiting for players to join
- `DISTRIBUTION`: Server deals cards to all players
- `PASS_PHASE`: 30-second simultaneous passing phase
- `HAND_STACK`: 10 seconds for players to click HAND after SET
- `ROUND_END`: Display scores, prepare for next round

### Data Flow

1. **Client Action**: User clicks "Pass Card"
2. **Socket Emit**: Client sends `pass-card` event with card ID
3. **Server Validation**: Server checks if action is valid
4. **Server Update**: Server updates game state
5. **Broadcast**: Server sends updated state to all players in the room
6. **Client Render**: All clients re-render with new state

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd chaar-chitti

# Install dependencies
npm install
```

### Running the Game

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

The game will be available at `http://localhost:3000`

### How to Play

1. **Open** `http://localhost:3000` in your browser
2. **Enter** your player name
3. **Create Room** or **Join Room** with a 6-character code
4. **Wait** for at least 3 players to join
5. **Start Game** (any player can start when ready)
6. **Play**:
   - Select a card and click PASS
   - If you get 4 identical cards after passing, click SET
   - If someone else declares SET first, quickly click HAND
7. **Repeat** for multiple rounds!

### Testing Multiplayer

Open multiple browser tabs/windows or devices on the same network:
- Tab 1: Create room (e.g., room code ABC123)
- Tab 2: Join with code ABC123
- Tab 3: Join with code ABC123
- Start the game when 3+ players have joined

## 🎨 Mobile-First Design

- **Responsive**: Works on all screen sizes (mobile, tablet, desktop)
- **Touch-Optimized**: Large tappable buttons and cards
- **Performance**: Lightweight and fast, even on slow connections
- **Accessibility**: Clear visual feedback for all actions

## 🔒 Security & Edge Cases

### Prevented Issues

✅ **No Race Conditions**: Server serializes all actions
✅ **No Infinite Loops**: All timers are server-controlled
✅ **No Deadlocks**: Automatic fallbacks (auto-pass, timeout handling)
✅ **No Cheating**: Server validates all game logic
✅ **No Multiple SET Winners**: First valid SET wins, others locked out
✅ **No Extra Cards**: Server enforces exactly 4 cards per player

### Handled Edge Cases

- **Player Disconnection**: In lobby, player is removed; in-game, marked as disconnected
- **AFK Players**: Auto-pass after 30 seconds
- **Late Hand Click**: Positions assigned based on timestamp order
- **Invalid Actions**: Server rejects with error message (e.g., "You must pass before declaring SET")
- **Network Latency**: Server timestamp is authoritative for ordering

## 📡 WebSocket Events

### Client → Server

- `create-room`: Create a new game room
- `join-room`: Join an existing room with code
- `start-game`: Start the game (min 3 players)
- `pass-card`: Pass a selected card
- `declare-set`: Declare SET (must have 4 identical cards after passing)
- `click-hand`: Click HAND during hand stack phase

### Server → Client

- `game-state`: Full game state update (sent to each player)
- `phase-change`: Phase transition notification
- `player-joined`: New player joined the room
- `player-left`: Player disconnected
- `player-passed`: A player passed their card
- `auto-pass`: A player was auto-passed
- `set-declared`: A player declared SET
- `hand-clicked`: A player clicked HAND
- `round-end`: Round ended with scores
- `error`: Error message

## 🧪 Development Notes

### Key Design Decisions

1. **Server-Authoritative**: Prevents cheating and ensures consistency
2. **Simultaneous Pass Phase**: All players act at the same time (not turn-based)
3. **Pass Before SET**: Critical rule - players cannot SET until they've passed
4. **Auto-Pass Safety**: Prevents game from getting stuck if a player goes AFK
5. **Timestamp-Based Ordering**: Ensures fair hand stack position assignment

### Future Enhancements

- [ ] Persistent leaderboards
- [ ] Player authentication
- [ ] Custom game configurations (timer length, scoring)
- [ ] Spectator mode
- [ ] Game replays
- [ ] Sound effects and animations
- [ ] Private rooms with passwords
- [ ] Tournament mode

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Not connected to server"
- **Solution**: Make sure the server is running (`npm run dev`)

**Issue**: Cards not updating after passing
- **Solution**: Check browser console for WebSocket errors; try refreshing

**Issue**: SET button not appearing
- **Solution**: Remember, you must PASS first, then have 4 identical cards

**Issue**: Multiple tabs not syncing
- **Solution**: Ensure all tabs use the same room code and different player names

## 📄 License

MIT License - feel free to use and modify!

## 🙏 Credits

Traditional Indian card game, digitized for the modern web.

---

**Built with ❤️ using Next.js, TypeScript, and Socket.IO**


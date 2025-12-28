'use client';

/**
 * Main Game Page
 * Handles all game phases: Lobby, Pass Phase, Hand Stack, Round End
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/contexts/SocketContext';
import type { Card } from '@/types/game';

export default function GamePage() {
  const { gameState, isConnected, createRoom, joinRoom, leaveRoom, startGame, passCard, declareSet, clickHand, continueGame } = useSocket();
  const [screen, setScreen] = useState<'home' | 'lobby' | 'game'>('home');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [reorderedCards, setReorderedCards] = useState<Card[]>([]);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showPlayers, setShowPlayers] = useState(false);

  // Load saved player name on mount (for convenience)
  useEffect(() => {
    const savedPlayerName = localStorage.getItem('chaar-chitti-player');
    if (savedPlayerName) {
      setPlayerName(savedPlayerName);
    }
  }, []);

  useEffect(() => {
    if (gameState) {
      if (gameState.phase === 'LOBBY') {
        setScreen('lobby');
      } else {
        setScreen('game');
      }
    }
  }, [gameState]);

  // Prevent accidental refresh during active game
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (gameState && gameState.phase !== 'LOBBY') {
        e.preventDefault();
        e.returnValue = 'Game in progress! Are you sure you want to leave?';
        return 'Game in progress! Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gameState]);

  useEffect(() => {
    if (gameState?.yourCards) {
      // Only update if the card IDs have actually changed (new cards received)
      const currentIds = reorderedCards.map(c => c.id).sort().join(',');
      const newIds = gameState.yourCards.map(c => c.id).sort().join(',');
      
      if (currentIds !== newIds) {
        setReorderedCards(gameState.yourCards);
      }
    }
  }, [gameState?.yourCards, reorderedCards]);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    const result = await createRoom(playerName);
    if (result.success && result.roomId) {
      setRoomCode(result.roomId);
      setScreen('lobby');
      setError('');
    } else {
      setError(result.error || 'Failed to create room');
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter room code');
      return;
    }

    const result = await joinRoom(roomCode.toUpperCase(), playerName);
    if (result.success) {
      setScreen('lobby');
      setError('');
    } else {
      setError(result.error || 'Failed to join room');
    }
  };

  const handleLeaveRoom = async () => {
    const result = await leaveRoom();
    if (result.success) {
      setScreen('home');
      setRoomCode('');
      setError('');
    } else {
      setError(result.error || 'Failed to leave room');
    }
  };

  const handleStartGame = async () => {
    const result = await startGame();
    if (!result.success) {
      setError(result.error || 'Failed to start game');
    }
  };

  const handlePassCard = async () => {
    // If a card is selected, pass it; otherwise pass the first card in the reordered list
    const cardToPass = selectedCard || (reorderedCards.length > 0 ? reorderedCards[0].id : null);
    
    if (!cardToPass) {
      setError('No card available to pass');
      return;
    }

    const result = await passCard(cardToPass);
    if (result.success) {
      setSelectedCard(null);
      setError('');
    } else {
      setError(result.error || 'Failed to pass card');
    }
  };

  const handleDeclareSet = async () => {
    const result = await declareSet();
    if (!result.success) {
      setError(result.error || 'Failed to declare SET');
    }
  };

  const handleClickHand = async () => {
    const result = await clickHand();
    if (!result.success) {
      setError(result.error || 'Failed to click hand');
    }
  };

  const handleCardSelect = (cardId: string) => {
    setSelectedCard(cardId);
  };

  const handleDragStart = (e: React.DragEvent, cardId: string, index: number) => {
    setDraggedCard(cardId);
    e.dataTransfer.effectAllowed = 'move';
    // Add a slight delay to allow the drag preview to render
    setTimeout(() => {
      e.currentTarget.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedCard(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!draggedCard) return;
    
    const dragIndex = reorderedCards.findIndex(c => c.id === draggedCard);
    if (dragIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }
    
    const newOrder = [...reorderedCards];
    const [draggedItem] = newOrder.splice(dragIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    
    setReorderedCards(newOrder);
    setDragOverIndex(null);
  };

  const handleContinueGame = async () => {
    const result = await continueGame();
    if (!result.success) {
      setError(result.error || 'Failed to continue game');
    }
  };

  // HOME SCREEN
  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-8 max-w-md w-full"
        >
          {/* Title */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl font-black text-white mb-2">
              Chaar Chitti
            </h1>
            <p className="text-slate-400 text-lg">4 Cards Game</p>
            <p className="text-slate-500 text-sm mt-1">Collect 4 identical cards to win!</p>
          </motion.div>

          {/* Connection Status */}
          {!isConnected && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-3 rounded-xl mb-4 text-center font-semibold"
            >
              Connecting to server...
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 text-center font-semibold"
            >
              {error}
            </motion.div>
          )}

          {/* Player Name Input */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <label className="block text-sm font-bold text-slate-300 mb-2">Your Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-4 border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              maxLength={20}
            />
          </motion.div>

          {/* Create Room Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateRoom}
            disabled={!isConnected}
            className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/30 text-white py-5 rounded-xl text-xl font-bold mb-4 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition"
          >
            Create New Room
          </motion.button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-slate-700"></div>
            <span className="px-4 text-slate-500 font-semibold">OR</span>
            <div className="flex-1 border-t border-slate-700"></div>
          </div>

          {/* Join Room */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-sm font-bold text-slate-300 mb-2">Room Code</label>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-4 border-2 border-slate-700 bg-slate-900/50 rounded-xl text-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 uppercase text-white text-center font-mono tracking-widest transition mb-4 placeholder-slate-500"
              maxLength={6}
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleJoinRoom}
              disabled={!isConnected}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-5 rounded-xl text-xl font-bold hover:from-indigo-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition shadow-lg"
            >
              🚪 Join Room
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // LOBBY SCREEN
  if (screen === 'lobby' && gameState?.phase === 'LOBBY') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-8 max-w-md w-full"
        >
          {/* Title */}
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-black text-center text-white mb-6"
          >
            Waiting Room
          </motion.h2>
          
          {/* Room Code - Large Display */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-6 mb-6"
          >
            <p className="text-sm font-bold text-slate-400 text-center mb-2">Share this code with friends:</p>
            <p className="text-5xl font-black text-center text-white tracking-widest font-mono">{gameState.roomId}</p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 text-center font-semibold"
            >
              {error}
            </motion.div>
          )}

          {/* Players List */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 text-white flex items-center justify-between">
              <span>Players in Room</span>
              <span className="text-blue-400">{gameState.players.length}/10</span>
            </h3>
            
            <div className="space-y-3">
              <AnimatePresence>
                {gameState.players.map((player, index) => {
                  const isYou = player.id === gameState.yourPlayerId;
                  const isHost = index === 0;
                  
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 50, opacity: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-slate-700/30 border ${isYou ? 'border-blue-500 shadow-lg shadow-blue-900/50' : 'border-slate-600/50'} rounded-xl px-5 py-4 flex items-center justify-between hover:shadow-md transition`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl font-bold text-blue-400">#{index + 1}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-lg">{player.name}</span>
                            {isYou && <span className="text-xs font-black text-blue-400 bg-blue-500/20 border border-blue-500/30 px-2 py-1 rounded">YOU</span>}
                            {isHost && <span className="text-xs font-black text-green-400 bg-green-500/20 border border-green-500/30 px-2 py-1 rounded">HOST</span>}
                          </div>
                        </div>
                      </div>
                      {player.isConnected ? (
                        <span className="flex items-center space-x-2">
                          <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
                          <span className="text-xs font-bold text-emerald-400">ONLINE</span>
                        </span>
                      ) : (
                      <span className="flex items-center space-x-2">
                        <span className="w-3 h-3 bg-slate-600 rounded-full"></span>
                        <span className="text-xs font-bold text-slate-500">OFFLINE</span>
                      </span>
                    )}
                  </motion.div>
                );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Start Game Button - Host Only */}
            {gameState.players.length >= 4 ? (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartGame}
                className="w-full bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/30 text-white py-6 rounded-xl text-2xl font-black transition"
              >
                START GAME
              </motion.button>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-6 py-5 rounded-xl text-center"
              >
                <p className="text-lg font-bold mb-1">Waiting for more players...</p>
                <p className="text-sm">Need {4 - gameState.players.length} more player(s) to start</p>
                <p className="text-xs mt-2 text-amber-500">(Minimum 4 players required)</p>
              </motion.div>
            )}

            {/* Leave Room Button */}
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLeaveRoom}
              className="w-full bg-slate-700 text-white py-4 rounded-xl text-lg font-bold hover:bg-slate-600 transition shadow-lg"
            >
              LEAVE ROOM
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ROUND END SCREEN
  if (screen === 'game' && gameState && gameState.phase === 'ROUND_END') {
    const sortedPlayers = [...gameState.players].sort((a, b) => (a.handStackPosition || 999) - (b.handStackPosition || 999));
    const isHost = gameState.players[0]?.id === gameState.yourPlayerId;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-8 max-w-2xl w-full"
        >
          {/* Title */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-6"
          >
            <h1 className="text-5xl font-black text-white mb-2">
              Round {gameState.roundNumber} Complete!
            </h1>
          </motion.div>

          {error && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 text-center font-semibold"
            >
              {error}
            </motion.div>
          )}

          {/* Scoreboard */}
          <div className="mb-6">
            <h3 className="text-2xl font-black mb-6 text-white text-center">FINAL STANDINGS</h3>
            
            <div className="space-y-4">
              <AnimatePresence>
                {sortedPlayers.map((player, index) => {
                  const isYou = player.id === gameState.yourPlayerId;
                  const position = player.handStackPosition || 999;
                  const points = gameState.roundNumber > 0 ? (position === 1 ? 1000 : position === 2 ? 500 : position === 3 ? 400 : position === 4 ? 300 : position === 5 ? 200 : position === 6 ? 100 : 0) : 0;
                  
                  // Define position-specific styling
                  const getPositionStyle = () => {
                    if (index === 0) return {
                      gradient: 'from-amber-400/30 via-yellow-500/20 to-amber-400/30',
                      border: 'border-amber-400/60',
                      glow: 'shadow-amber-400/30',
                      medal: '🥇',
                      medalBg: 'bg-gradient-to-br from-yellow-400 to-amber-500'
                    };
                    if (index === 1) return {
                      gradient: 'from-slate-400/30 via-slate-500/20 to-slate-400/30',
                      border: 'border-slate-400/60',
                      glow: 'shadow-slate-400/30',
                      medal: '🥈',
                      medalBg: 'bg-gradient-to-br from-slate-300 to-slate-400'
                    };
                    if (index === 2) return {
                      gradient: 'from-orange-400/30 via-orange-500/20 to-orange-400/30',
                      border: 'border-orange-400/60',
                      glow: 'shadow-orange-400/30',
                      medal: '🥉',
                      medalBg: 'bg-gradient-to-br from-orange-400 to-red-500'
                    };
                    return {
                      gradient: 'from-slate-600/20 via-slate-700/10 to-slate-600/20',
                      border: 'border-slate-600/40',
                      glow: 'shadow-slate-600/20',
                      medal: null,
                      medalBg: 'bg-slate-700'
                    };
                  };

                  const style = getPositionStyle();
                  
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`
                        relative overflow-hidden
                        bg-gradient-to-r ${style.gradient}
                        backdrop-blur-xl border-2 ${style.border}
                        rounded-2xl shadow-xl ${style.glow}
                        ${isYou ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''}
                        hover:scale-[1.02] transition-all duration-200
                      `}
                    >
                      <div className="flex items-center justify-between p-5">
                        {/* Left: Position & Player Info */}
                        <div className="flex items-center space-x-4 flex-1">
                          {/* Medal/Position Badge */}
                          <div className={`${style.medalBg} rounded-xl p-3 shadow-lg`}>
                            {style.medal ? (
                              <span className="text-3xl">{style.medal}</span>
                            ) : (
                              <span className="text-white font-black text-2xl">#{index + 1}</span>
                            )}
                          </div>
                          
                          {/* Player Details */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-black text-white text-xl">{player.name}</span>
                              {isYou && (
                                <span className="text-xs font-black text-blue-300 bg-blue-600/40 border border-blue-400/50 px-3 py-1 rounded-full">
                                  YOU
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-300 font-medium">
                              Position: <span className="text-white font-bold">#{position}</span>
                            </p>
                          </div>
                        </div>
                        
                        {/* Right: Points Display */}
                        <div className="text-right">
                          <p className="text-xs text-slate-400 font-bold uppercase mb-1">Round Points</p>
                          <p className="text-3xl font-black text-emerald-400 mb-1">
                            +{points}
                          </p>
                          <div className="bg-slate-900/50 px-3 py-1 rounded-lg border border-slate-600/50">
                            <p className="text-xs text-slate-400 font-semibold">Total</p>
                            <p className="text-lg font-black text-white">{player.score}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Continue Button - Host Only */}
          {isHost ? (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleContinueGame}
              className="w-full bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/30 text-white py-6 rounded-xl text-2xl font-black transition"
            >
              CONTINUE TO NEXT ROUND
            </motion.button>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-6 py-5 rounded-xl text-center"
            >
              <p className="text-lg font-bold">Waiting for host to continue...</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  // GAME SCREEN
  if (screen === 'game' && gameState) {
    const currentPlayer = gameState.players.find(p => p.cardCount === gameState.yourCards.length && gameState.yourCards.length === 4);
    const yourPlayer = gameState.players.find(p => p.id === gameState.yourPlayerId);
    const passedCount = gameState.players.filter(p => p.hasPassed).length;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3">
        {/* Compact Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-xl p-3 mb-3 shadow-xl"
        >
          <div className="flex justify-between items-center">
            {/* Left: Timer & Phase */}
            <div className="flex items-center space-x-3">
              <motion.div
                key={gameState.timer}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className={`text-3xl font-black ${
                  gameState.timer <= 5 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {gameState.timer}s
              </motion.div>
              <div>
                <p className="text-xs text-slate-400">Round {gameState.roundNumber}</p>
                <motion.p
                  key={gameState.phase}
                  className="text-xs font-bold text-blue-400"
                >
                  {gameState.phase === 'PASS_PHASE' ? 'PASS CARDS' : 
                   gameState.phase === 'HAND_STACK' ? 'HAND STACK!' : 
                   gameState.phase === 'ROUND_END' ? 'ROUND END' : 
                   gameState.phase}
                </motion.p>
              </div>
            </div>
            
            {/* Right: Players Toggle */}
            <button
              onClick={() => setShowPlayers(!showPlayers)}
              className="flex items-center space-x-2 bg-slate-700/50 px-3 py-2 rounded-lg hover:bg-slate-700 transition"
            >
              <div className="text-right">
                <p className="text-xs text-slate-400">Players</p>
                <p className="text-sm font-black text-white">{gameState.players.length}</p>
              </div>
              <svg 
                className={`w-4 h-4 text-slate-400 transition-transform ${showPlayers ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -10 }}
              className="bg-red-600/90 backdrop-blur-sm border border-red-500/30 text-white px-4 py-3 rounded-xl mb-3 text-center font-bold shadow-lg text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Status Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-600/90 backdrop-blur-sm border border-blue-500/30 text-white px-4 py-2.5 rounded-xl mb-3 text-center shadow-lg"
        >
          <p className="font-black text-sm">
            {gameState.canPass ? '🎯 SELECT & PASS A CARD' :
             gameState.canSet ? '⭐ DECLARE SET NOW!' :
             gameState.canHand ? '✋ CLICK HAND FAST!' :
             gameState.phase === 'PASS_PHASE' && gameState.currentPassingPlayerId ? 
               (gameState.currentPassingPlayerId === yourPlayer?.id ? 'YOUR TURN!' : `${gameState.players.find(p => p.id === gameState.currentPassingPlayerId)?.name}'s Turn`) :
             gameState.phase === 'PASS_PHASE' ? '⏳ Waiting...' :
             gameState.phase === 'HAND_STACK' ? '🖐️ Hand Stack!' :
             '⏳ Waiting...'}
          </p>
          {gameState.phase === 'PASS_PHASE' && passedCount > 0 && (
            <p className="text-xs mt-1 text-blue-200">
              {passedCount}/{gameState.players.length} players passed
            </p>
          )}
        </motion.div>

        {/* Collapsible Players Grid */}
        <AnimatePresence>
          {showPlayers && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-3"
            >
              <div className="grid grid-cols-2 gap-2">
                {gameState.players.map((player, index) => {
                  const isYou = player.id === gameState.yourPlayerId;
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-slate-800/70 backdrop-blur-xl border ${
                        player.hasSet ? 'border-yellow-400' : 'border-slate-700/50'
                      } rounded-lg p-2.5 shadow-lg ${
                        isYou ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm truncate">
                            {player.name} {isYou && '(You)'}
                          </p>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <p className="text-xs text-slate-400">{player.score} pts</p>
                            {player.hasPassed && (
                              <span className="text-xs text-emerald-400">✓</span>
                            )}
                            {player.hasSet && (
                              <span className="text-xs text-yellow-400">★</span>
                            )}
                            {player.handStackPosition && (
                              <span className="text-xs text-blue-400">#{player.handStackPosition}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right ml-2">
                          <p className="text-xl font-black text-blue-400">{player.cardCount}</p>
                          {player.isConnected ? (
                            <span className="text-xs text-emerald-400">●</span>
                          ) : (
                            <span className="text-xs text-slate-600">●</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Stats Bar (Always Visible - Minimal) */}
        {!showPlayers && (
          <div className="flex justify-center space-x-2 mb-3 overflow-x-auto pb-1">
            {gameState.players.map((player) => {
              const isYou = player.id === gameState.yourPlayerId;
              return (
                <div
                  key={player.id}
                  className={`flex items-center space-x-1 bg-slate-800/50 px-2 py-1 rounded-lg flex-shrink-0 ${
                    isYou ? 'ring-1 ring-blue-500' : ''
                  } ${
                    player.hasSet ? 'ring-1 ring-yellow-400' : ''
                  }`}
                >
                  <p className="text-xs font-bold text-white truncate max-w-[60px]">
                    {isYou ? 'You' : player.name.split(' ')[0]}
                  </p>
                  <div className="flex items-center space-x-0.5">
                    {player.hasPassed && <span className="text-xs text-emerald-400">✓</span>}
                    {player.hasSet && <span className="text-xs text-yellow-400">★</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Your Cards */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-3"
        >
          <div className="text-center mb-2">
            <h3 className="text-white text-lg font-black drop-shadow-lg">
              YOUR CARDS
            </h3>
            {gameState.canPass && (
              <p className="text-slate-400 text-xs mt-0.5 font-semibold">
                💡 Drag to reorder • 1st card auto-passes
              </p>
            )}
          </div>
          
          {/* Mobile Layout: 2x2 Grid */}
          <div className="block md:hidden">
            <div className="grid grid-cols-2 gap-2">
              {reorderedCards.map((card, index) => (
                <div
                  key={card.id}
                  className={`${dragOverIndex === index ? 'ring-4 ring-blue-400 ring-opacity-50 rounded-2xl' : ''}`}
                  draggable={gameState.canPass}
                  onDragStart={(e) => handleDragStart(e, card.id, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <CardComponent
                      card={card}
                      isSelected={selectedCard === card.id}
                      onSelect={() => handleCardSelect(card.id)}
                      canSelect={gameState.canPass}
                      isBig={false}
                      isDragging={draggedCard === card.id}
                    />
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Desktop Layout: 4 Column Grid */}
          <div className="hidden md:grid md:grid-cols-4 gap-4">
            <AnimatePresence>
              {reorderedCards.map((card, index) => (
                <div
                  key={card.id}
                  className={`${dragOverIndex === index ? 'ring-4 ring-blue-400 ring-opacity-50 rounded-2xl' : ''}`}
                  draggable={gameState.canPass}
                  onDragStart={(e) => handleDragStart(e, card.id, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <CardComponent
                      card={card}
                      isSelected={selectedCard === card.id}
                      onSelect={() => handleCardSelect(card.id)}
                      canSelect={gameState.canPass}
                      isBig={false}
                      isDragging={draggedCard === card.id}
                    />
                  </motion.div>
                </div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Action Buttons - Side by Side Layout */}
        <div className="flex gap-2">
          <AnimatePresence>
            {/* Left Side - SET or HAND Button */}
            {gameState.canSet && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: 1 
                }}
                transition={{ 
                  scale: { repeat: Infinity, duration: 1 }
                }}
                exit={{ scale: 0.9, opacity: 0 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDeclareSet}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-5 rounded-xl text-xl md:text-3xl font-black hover:from-yellow-600 hover:to-orange-700 transition shadow-2xl"
              >
                ⭐ SET
              </motion.button>
            )}

            {gameState.canHand && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: 1 
                }}
                transition={{ 
                  scale: { repeat: Infinity, duration: 0.5 }
                }}
                exit={{ scale: 0.9, opacity: 0 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClickHand}
                className="flex-1 bg-gradient-to-r from-red-600 to-pink-700 text-white py-5 rounded-xl text-xl md:text-3xl font-black hover:from-red-700 hover:to-pink-800 transition shadow-2xl"
              >
                ✋ HAND
              </motion.button>
            )}

            {/* Right Side - PASS Button */}
            {gameState.canPass && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePassCard}
                disabled={!selectedCard && reorderedCards.length === 0}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 text-white py-5 rounded-xl text-xl md:text-3xl font-black hover:from-blue-700 hover:to-blue-900 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed transition shadow-xl"
              >
                {selectedCard ? '➤ PASS' : '➤ 1ST'}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return null;
}

// Card Component
function CardComponent({
  card,
  isSelected,
  onSelect,
  canSelect,
  isBig = false,
  isDragging = false,
}: {
  card: Card;
  isSelected: boolean;
  onSelect: () => void;
  canSelect: boolean;
  isBig?: boolean;
  isDragging?: boolean;
}) {
  const categoryColors: Record<string, string> = {
    Mango: 'from-yellow-400/90 via-orange-400/90 to-orange-500/90',
    Potato: 'from-yellow-700/90 via-amber-600/90 to-orange-700/90',
    Eggplant: 'from-purple-600/90 via-purple-700/90 to-purple-800/90',
    Okra: 'from-green-500/90 via-green-600/90 to-green-700/90',
    Carrot: 'from-orange-500/90 via-orange-600/90 to-red-500/90',
    Banana: 'from-yellow-300/90 via-yellow-400/90 to-yellow-500/90',
    Lemon: 'from-lime-400/90 via-yellow-400/90 to-yellow-500/90',
    Onion: 'from-pink-300/90 via-purple-300/90 to-purple-400/90',
    Tomato: 'from-red-500/90 via-red-600/90 to-red-700/90',
    Watermelon: 'from-green-600/90 via-pink-500/90 to-red-500/90',
  };

  const categoryImages: Record<string, string> = {
    Mango: '/images/aamdoctor_the_mango_doctor_character_illustration.png',
    Potato: '/images/aloodon_the_cartoon_potato_character_smiling_confidently.png',
    Eggplant: '/images/bainganbhai_the_eggplant_character_in_vest..png',
    Okra: '/images/bhindiboss_cartoon_character_with_turban_and_mustache.png',
    Carrot: '/images/gajarguru_the_carrot_character_in_traditional_attire.png',
    Banana: '/images/kelasenapati_cartoon_banana_army_general_character.png',
    Lemon: '/images/nimbuneta_in_white_kurta_and_gandhi_cap.png',
    Onion: '/images/pyaaz_minister_cartoon_character_in_desi_outfit.png',
    Tomato: '/images/tamatar_inspector_cartoon_character_holding_magnifying_glass.png',
    Watermelon: '/images/tarboozpolice_watermelon_officer_character_design.png',
  };

  return (
    <motion.button
      whileHover={canSelect ? { scale: 1.05 } : {}}
      whileTap={canSelect ? { scale: 0.95 } : {}}
      onClick={canSelect ? onSelect : undefined}
      disabled={!canSelect}
      className={`
        aspect-[2/3] rounded-2xl relative overflow-hidden
        transition-all duration-200
        ${canSelect ? 'cursor-move shadow-2xl hover:shadow-3xl' : 'cursor-default opacity-80'}
        ${isSelected ? 'ring-4 ring-blue-500 ring-offset-4 ring-offset-slate-900 scale-105 shadow-blue-500/50 shadow-2xl' : 'shadow-xl'}
        ${isDragging ? 'opacity-50 scale-95' : ''}
      `}
    >
      {/* Full-width Image */}
      <img 
        src={categoryImages[card.category]} 
        alt={card.category}
        className="w-full h-full object-cover"
      />
      
      {/* Dark overlay for unselected cards */}
      {!isSelected && canSelect && (
        <div className="absolute inset-0 bg-black/20 hover:bg-black/0 transition-all duration-200"></div>
      )}
      
      {/* Selection indicator */}
      {isSelected && (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-transparent to-transparent"
          />
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute top-3 right-3 bg-blue-500 rounded-full p-2 shadow-xl"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        </>
      )}
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </motion.button>
  );
}

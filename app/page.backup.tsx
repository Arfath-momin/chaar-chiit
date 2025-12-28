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

  useEffect(() => {
    if (gameState) {
      if (gameState.phase === 'LOBBY') {
        setScreen('lobby');
      } else {
        setScreen('game');
      }
    }
  }, [gameState]);

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
    if (!selectedCard) {
      setError('Please select a card to pass');
      return;
    }

    const result = await passCard(selectedCard);
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

  const handleContinueGame = async () => {
    const result = await continueGame();
    if (!result.success) {
      setError(result.error || 'Failed to continue game');
    }
  };

  // HOME SCREEN
  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
        >
          {/* Title */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
              Chaar Chitti
            </h1>
            <p className="text-gray-600 text-lg">4 Cards Game</p>
            <p className="text-gray-500 text-sm mt-1">Collect 4 identical cards to win!</p>
          </motion.div>

          {/* Connection Status */}
          {!isConnected && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-yellow-50 border-2 border-yellow-400 text-yellow-800 px-4 py-3 rounded-xl mb-4 text-center font-semibold"
            >
              🔌 Connecting to server...
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-50 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 text-center font-semibold"
            >
              ❌ {error}
            </motion.div>
          )}

          {/* Player Name Input */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <label className="block text-sm font-bold text-gray-700 mb-2">Your Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-4 border-2 border-purple-300 rounded-xl text-lg focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 text-black transition"
              maxLength={20}
            />
          </motion.div>

          {/* Create Room Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateRoom}
            disabled={!isConnected}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-5 rounded-xl text-xl font-bold mb-4 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition shadow-lg"
          >
            🎮 Create New Room
          </motion.button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t-2 border-gray-300"></div>
            <span className="px-4 text-gray-500 font-semibold">OR</span>
            <div className="flex-1 border-t-2 border-gray-300"></div>
          </div>

          {/* Join Room */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-sm font-bold text-gray-700 mb-2">Room Code</label>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-4 border-2 border-indigo-300 rounded-xl text-lg focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 uppercase text-black text-center font-mono tracking-widest transition mb-4"
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
        >
          {/* Title */}
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-black text-center text-gray-800 mb-6"
          >
            🎮 Waiting Room
          </motion.h2>
          
          {/* Room Code - Large Display */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-purple-100 to-pink-100 border-4 border-purple-500 rounded-2xl p-6 mb-6"
          >
            <p className="text-sm font-bold text-gray-600 text-center mb-2">Share this code with friends:</p>
            <p className="text-5xl font-black text-center text-purple-900 tracking-widest font-mono">{gameState.roomId}</p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-50 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 text-center font-semibold"
            >
              ❌ {error}
            </motion.div>
          )}

          {/* Players List */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center justify-between">
              <span>👥 Players in Room</span>
              <span className="text-purple-600">{gameState.players.length}/10</span>
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
                      className={`bg-gradient-to-r from-purple-50 to-pink-50 border-2 ${
                        isYou ? 'border-green-500 shadow-lg' : 'border-purple-200'
                      } rounded-xl px-5 py-4 flex items-center justify-between hover:shadow-md transition`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl font-bold text-purple-600">#{index + 1}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-800 text-lg">{player.name}</span>
                            {isYou && <span className="text-xs font-black text-green-600 bg-green-100 px-2 py-1 rounded">YOU</span>}
                            {isHost && <span className="text-xs font-black text-purple-600 bg-purple-100 px-2 py-1 rounded">HOST</span>}
                          </div>
                        </div>
                      </div>
                      {player.isConnected ? (
                        <span className="flex items-center space-x-2">
                          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                          <span className="text-xs font-bold text-green-600">ONLINE</span>
                        </span>
                      ) : (
                      <span className="flex items-center space-x-2">
                        <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                        <span className="text-xs font-bold text-gray-500">OFFLINE</span>
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
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-6 rounded-2xl text-2xl font-black hover:from-green-600 hover:to-emerald-700 transition shadow-xl"
              >
                🚀 START GAME
              </motion.button>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-yellow-50 border-2 border-yellow-400 text-yellow-800 px-6 py-5 rounded-2xl text-center"
              >
                <p className="text-lg font-bold mb-1">⏳ Waiting for more players...</p>
                <p className="text-sm">Need {4 - gameState.players.length} more player(s) to start</p>
                <p className="text-xs mt-2 text-yellow-600">(Minimum 4 players required)</p>
              </motion.div>
            )}

            {/* Leave Room Button */}
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLeaveRoom}
              className="w-full bg-gray-500 text-white py-4 rounded-2xl text-lg font-bold hover:bg-gray-600 transition shadow-lg"
            >
              🚪 LEAVE ROOM
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full"
        >
          {/* Title */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-6"
          >
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
              🏆 Round {gameState.roundNumber} Complete!
            </h1>
          </motion.div>

          {error && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-50 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 text-center font-semibold"
            >
              ❌ {error}
            </motion.div>
          )}

          {/* Scoreboard */}
          <div className="mb-6">
            <h3 className="text-2xl font-black mb-4 text-gray-800 text-center">📊 SCOREBOARD</h3>
            
            <div className="space-y-3">
              <AnimatePresence>
                {sortedPlayers.map((player, index) => {
                  const isYou = player.id === gameState.yourPlayerId;
                  const position = player.handStackPosition || 999;
                  const points = gameState.roundNumber > 0 ? (position === 1 ? 1000 : position === 2 ? 500 : position === 3 ? 400 : position === 4 ? 300 : position === 5 ? 200 : position === 6 ? 100 : 0) : 0;
                  
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-gradient-to-r ${
                        index === 0 ? 'from-yellow-100 to-yellow-200 border-yellow-500' :
                        index === 1 ? 'from-gray-100 to-gray-200 border-gray-400' :
                        index === 2 ? 'from-orange-100 to-orange-200 border-orange-400' :
                        'from-purple-50 to-pink-50 border-purple-200'
                      } border-2 rounded-xl px-5 py-4 ${isYou ? 'ring-4 ring-green-400' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-black text-gray-800 text-xl">{player.name}</span>
                              {isYou && <span className="text-xs font-black text-green-600 bg-green-100 px-2 py-1 rounded">YOU</span>}
                            </div>
                            <p className="text-sm text-gray-600">Hand Position: {position}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 font-bold">This Round</p>
                          <p className="text-2xl font-black text-green-600">+{points}</p>
                          <p className="text-xs text-gray-500 mt-1">Total: {player.score}</p>
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
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-6 rounded-2xl text-2xl font-black hover:from-green-600 hover:to-emerald-700 transition shadow-xl"
            >
              ▶️ CONTINUE TO NEXT ROUND
            </motion.button>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-blue-50 border-2 border-blue-400 text-blue-800 px-6 py-5 rounded-2xl text-center"
            >
              <p className="text-lg font-bold">⏳ Waiting for host to continue...</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  // GAME SCREEN
  if (screen === 'game' && gameState) {
    const currentPlayer = gameState.players.find(p => p.cardCount === gameState.yourCards.length && gameState.yourCards.length === 4);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4">
        {/* Header - Game Info */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/95 backdrop-blur-md rounded-3xl p-5 mb-4 shadow-xl"
        >
          <div className="flex justify-between items-center">
            {/* Room & Round Info */}
            <div>
              <p className="text-xs text-gray-500 font-bold">ROOM CODE</p>
              <p className="text-lg font-black text-purple-900">{gameState.roomId}</p>
              <p className="text-xs text-gray-600 mt-1">Round {gameState.roundNumber}</p>
            </div>
            
            {/* Phase Info */}
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold">PHASE</p>
              <motion.p
                key={gameState.phase}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-sm font-black text-purple-700"
              >
                {gameState.phase === 'PASS_PHASE' ? '🔄 PASS CARDS' : 
                 gameState.phase === 'HAND_STACK' ? '✋ HAND STACK!' : 
                 gameState.phase === 'ROUND_END' ? '🏆 ROUND END' : 
                 gameState.phase}
              </motion.p>
            </div>
            
            {/* Timer */}
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold">TIME LEFT</p>
              <motion.p
                key={gameState.timer}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className={`text-3xl font-black ${gameState.timer <= 5 ? 'text-red-600 animate-pulse' : 'text-green-600'}`}
              >
                {gameState.timer}s
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -10 }}
              className="bg-red-500 text-white px-5 py-4 rounded-2xl mb-4 text-center font-bold shadow-lg"
            >
              ❌ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions & Turn Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-500 text-white px-5 py-3 rounded-2xl mb-4 text-center shadow-lg"
        >
          {gameState.phase === 'PASS_PHASE' && gameState.currentPassingPlayerId && (
            <p className="font-black text-lg mb-1">
              {gameState.currentPassingPlayerId === gameState.players.find(p => p.cardCount === gameState.yourCards.length)?.id
                ? '🎯 YOUR TURN!'
                : `⏳ ${gameState.players.find(p => p.id === gameState.currentPassingPlayerId)?.name || 'Player'}'s Turn`}
            </p>
          )}
          <p className="font-bold text-sm">
            {gameState.canPass ? '👇 SELECT A CARD THEN CLICK PASS' :
             gameState.canSet ? '⭐ YOU HAVE 4 IDENTICAL CARDS! CLICK SET!' :
             gameState.canHand ? '✋ SOMEONE GOT SET! CLICK HAND FAST!' :
             gameState.phase === 'PASS_PHASE' ? '⏳ Wait for your turn...' :
             gameState.phase === 'HAND_STACK' ? '✋ Hand stack in progress...' :
             gameState.phase === 'ROUND_END' ? '🏆 Round ended!' :
             '⏳ Waiting for other players...'}
          </p>
        </motion.div>

        {/* Players Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {gameState.players.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg ${
                player.hasSet ? 'ring-4 ring-yellow-400 bg-yellow-50' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-black text-gray-800 text-base truncate">{player.name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs text-purple-600 font-bold">{player.score} pts</p>
                    {player.isConnected ? (
                      <span className="text-xs text-green-600">●</span>
                    ) : (
                      <span className="text-xs text-gray-400">●</span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-black text-purple-700">{player.cardCount}</p>
                  <p className="text-xs text-gray-500">cards</p>
                  
                  <div className="mt-1 space-y-1">
                    {player.hasPassed && (
                      <span className="block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                        ✓ PASSED
                      </span>
                    )}
                    {player.hasSet && (
                      <span className="block text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">
                        ★ SET
                      </span>
                    )}
                    {player.handStackPosition && (
                      <span className="block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                        #{player.handStackPosition}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Your Cards */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-4"
        >
          <h3 className="text-white text-xl font-black mb-3 text-center drop-shadow-lg">
            🎴 YOUR CARDS
          </h3>
          
          {/* Mobile Layout: First card big, rest smaller */}
          <div className="block md:hidden">
            {gameState.yourCards.length > 0 && (
              <div className="space-y-3">
                {/* First Card - Big */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0 }}
                  className="w-full"
                >
                  <CardComponent
                    card={gameState.yourCards[0]}
                    isSelected={selectedCard === gameState.yourCards[0].id}
                    onSelect={() => setSelectedCard(gameState.yourCards[0].id)}
                    canSelect={gameState.canPass}
                    isBig={true}
                  />
                </motion.div>
                
                {/* Remaining Cards - Smaller in Grid */}
                {gameState.yourCards.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {gameState.yourCards.slice(1).map((card, index) => (
                      <motion.div
                        key={card.id}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: (index + 1) * 0.1 }}
                      >
                        <CardComponent
                          card={card}
                          isSelected={selectedCard === card.id}
                          onSelect={() => setSelectedCard(card.id)}
                          canSelect={gameState.canPass}
                          isBig={false}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Desktop Layout: 4 Column Grid */}
          <div className="hidden md:grid md:grid-cols-4 gap-4">
            <AnimatePresence>
              {gameState.yourCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CardComponent
                    card={card}
                    isSelected={selectedCard === card.id}
                    onSelect={() => setSelectedCard(card.id)}
                    canSelect={gameState.canPass}
                    isBig={false}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Action Buttons - Side by Side Layout */}
        <div className="flex gap-3">
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
                className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-7 rounded-2xl text-2xl md:text-3xl font-black hover:from-yellow-500 hover:to-orange-600 transition shadow-2xl"
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
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 text-white py-7 rounded-2xl text-2xl md:text-3xl font-black hover:from-red-600 hover:to-pink-700 transition shadow-2xl"
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
                disabled={!selectedCard}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 text-white py-7 rounded-2xl text-2xl md:text-3xl font-black hover:from-blue-600 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition shadow-xl"
              >
                {selectedCard ? '🔄 PASS' : '👆 SELECT'}
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
}: {
  card: Card;
  isSelected: boolean;
  onSelect: () => void;
  canSelect: boolean;
  isBig?: boolean;
}) {
  const categoryColors: Record<string, string> = {
    Mango: 'from-yellow-400 via-orange-400 to-orange-500',
    Potato: 'from-yellow-700 via-amber-600 to-orange-700',
    Eggplant: 'from-purple-600 via-purple-700 to-purple-800',
    Okra: 'from-green-500 via-green-600 to-green-700',
    Carrot: 'from-orange-500 via-orange-600 to-red-500',
    Banana: 'from-yellow-300 via-yellow-400 to-yellow-500',
    Lemon: 'from-lime-400 via-yellow-400 to-yellow-500',
    Onion: 'from-pink-300 via-purple-300 to-purple-400',
    Tomato: 'from-red-500 via-red-600 to-red-700',
    Watermelon: 'from-green-600 via-pink-500 to-red-500',
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
      whileHover={canSelect ? { scale: 1.05, rotate: 2 } : {}}
      whileTap={canSelect ? { scale: 0.95 } : {}}
      onClick={canSelect ? onSelect : undefined}
      disabled={!canSelect}
      className={`
        aspect-[2/3] rounded-3xl bg-gradient-to-br ${categoryColors[card.category]}
        flex flex-col items-center justify-center
        transition-all duration-200 relative overflow-hidden
        ${canSelect ? 'cursor-pointer shadow-lg hover:shadow-2xl' : 'cursor-default opacity-90'}
        ${isSelected ? 'ring-8 ring-white scale-105 shadow-2xl' : 'shadow-md'}
      `}
    >
      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-50"></div>
      
      {/* Content - Just Image */}
      <div className="relative z-10 flex items-center justify-center w-full h-full p-3">
        <div className={`relative ${isBig ? 'w-40 h-40' : 'w-20 h-20 md:w-24 md:h-24'}`}>
          <img 
            src={categoryImages[card.category]} 
            alt={card.category}
            className="w-full h-full object-contain drop-shadow-2xl"
          />
        </div>
        
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg"
          >
            <span className="text-2xl">✓</span>
          </motion.div>
        )}
      </div>
      
      {/* Pattern Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-2 left-2 w-10 h-10">
          <img src={categoryImages[card.category]} alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute bottom-2 right-2 w-10 h-10">
          <img src={categoryImages[card.category]} alt="" className="w-full h-full object-contain" />
        </div>
      </div>
    </motion.button>
  );
}

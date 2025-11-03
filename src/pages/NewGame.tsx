import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Player } from '../types';
import { useDB } from '../hooks/useDB';
import { MetricSelector } from '../components/MetricSelector';
import { GameTracker } from '../components/GameTracker';

export const NewGame: React.FC = () => {
  const navigate = useNavigate();
  const { getPlayers, addGame, addGameMetrics, deleteGameMetrics, isReady } = useDB();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<number[]>([]);
  const [opponent, setOpponent] = useState('');
  const [gameDate, setGameDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [currentGameId, setCurrentGameId] = useState<number | null>(null);
  const [step, setStep] = useState<'player' | 'metrics' | 'tracking'>('player');

  useEffect(() => {
    if (isReady) {
      loadPlayers();
    }
  }, [isReady]);

  const loadPlayers = async () => {
    const playersData = await getPlayers();
    setPlayers(playersData);
  };

  const handleStartGame = async () => {
    if (!selectedPlayer || selectedMetrics.length === 0 || !opponent.trim()) {
      alert('Please select a player, metrics, and enter opponent name');
      return;
    }

    try {
      // Format title as "vs [Opponent] - [Date]"
      const dateStr = new Date(gameDate).toLocaleDateString();
      const gameTitle = `vs ${opponent.trim()} - ${dateStr}`;
      
      // Create game with status 'in_progress'
      const gameId = await addGame({
        playerId: selectedPlayer.id!,
        opponent: opponent.trim(),
        gameDate: new Date(gameDate),
        title: gameTitle,
        timestamp: new Date(),
        notes: notes.trim() || undefined,
        status: 'in_progress'
      });

      // Save selected metrics to GameMetrics table
      if (gameId) {
        await addGameMetrics(gameId as number, selectedMetrics);
      }

      setCurrentGameId(gameId as number);
      setStep('tracking');
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game. Please try again.');
    }
  };

  const handleEndGame = () => {
    navigate('/history');
  };

  const handleEditMetrics = async () => {
    // When editing metrics, go back to metrics selection
    setStep('metrics');
  };

  const handleMetricsUpdated = async (updatedMetrics: number[]) => {
    // Update selected metrics
    setSelectedMetrics(updatedMetrics);
    
    // Update GameMetrics table if game already exists
    if (currentGameId) {
      try {
        // Delete existing game metrics
        await deleteGameMetrics(currentGameId);
        // Add updated metrics
        if (updatedMetrics.length > 0) {
          await addGameMetrics(currentGameId, updatedMetrics);
        }
        // Return to tracking
        setStep('tracking');
      } catch (error) {
        console.error('Error updating game metrics:', error);
        alert('Failed to update metrics. Please try again.');
      }
    }
  };

  const handleBack = () => {
    if (step === 'metrics') {
      setStep('player');
    } else if (step === 'tracking') {
      setStep('metrics');
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (step === 'tracking' && currentGameId && selectedPlayer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-4">
          <GameTracker
            gameId={currentGameId}
            player={selectedPlayer}
            selectedMetrics={selectedMetrics}
            onGameEnd={handleEndGame}
            onEditMetrics={handleEditMetrics}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              ← Home
            </button>
            <h1 className="text-xl font-bold text-gray-800">New Game</h1>
            <div></div>
          </div>

          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center ${step === 'player' ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'player' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Player</span>
              </div>
              <div className={`w-8 h-0.5 ${step === 'metrics' || step === 'tracking' ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center ${step === 'metrics' ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'metrics' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Metrics</span>
              </div>
              <div className={`w-8 h-0.5 ${step === 'tracking' ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center ${step === 'tracking' ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'tracking' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
                <span className="ml-2 text-sm font-medium">Track</span>
              </div>
            </div>
          </div>

          {/* Step 1: Player Selection */}
          {step === 'player' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Select Player</h2>
                
                {players.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No players found</p>
                    <button
                      onClick={() => navigate('/players')}
                      className="btn-primary"
                    >
                      Add Player
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {players.map(player => (
                      <div
                        key={player.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedPlayer?.id === player.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedPlayer(player)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-800">{player.name}</h3>
                            <p className="text-sm text-gray-600">
                              {player.position} • {player.teamName}
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedPlayer?.id === player.id
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedPlayer?.id === player.id && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Game Details */}
              <div className="card">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Game Details</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="opponent" className="block text-sm font-medium text-gray-700 mb-1">
                      Opponent Team
                    </label>
                    <input
                      type="text"
                      id="opponent"
                      value={opponent}
                      onChange={(e) => setOpponent(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter opponent team name"
                    />
                  </div>

                  <div>
                    <label htmlFor="gameDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Game Date
                    </label>
                    <input
                      type="date"
                      id="gameDate"
                      value={gameDate}
                      onChange={(e) => setGameDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      placeholder="Add any notes about this game..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/')}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep('metrics')}
                  disabled={!selectedPlayer || !opponent.trim()}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Select Metrics
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Metric Selection */}
          {step === 'metrics' && (
            <div className="space-y-6">
              <MetricSelector
                selectedMetrics={selectedMetrics}
                onMetricsChange={setSelectedMetrics}
              />

              <div className="flex space-x-3">
                <button
                  onClick={handleBack}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                {currentGameId ? (
                  <button
                    onClick={() => handleMetricsUpdated(selectedMetrics)}
                    disabled={selectedMetrics.length === 0}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Update Metrics
                  </button>
                ) : (
                  <button
                    onClick={handleStartGame}
                    disabled={selectedMetrics.length === 0}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start Game
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import type { Game, Player, MetricCalculation } from '../types';
import { useDB } from '../hooks/useDB';

interface GameHistoryProps {
  onViewGame: (gameId: number) => void;
}

export const GameHistory: React.FC<GameHistoryProps> = ({ onViewGame }) => {
  const { getGames, getPlayers, calculateMetrics, isReady } = useDB();
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [gameMetrics, setGameMetrics] = useState<{ [gameId: number]: MetricCalculation[] }>({});

  useEffect(() => {
    if (isReady) {
      loadData();
    }
  }, [isReady]);

  useEffect(() => {
    if (games.length > 0) {
      loadGameMetrics();
    }
  }, [games]);

  const loadData = async () => {
    const [gamesData, playersData] = await Promise.all([
      getGames(),
      getPlayers()
    ]);
    setGames(gamesData);
    setPlayers(playersData);
  };

  const loadGameMetrics = async () => {
    const metrics: { [gameId: number]: MetricCalculation[] } = {};
    for (const game of games) {
      if (game.id) {
        metrics[game.id] = await calculateMetrics(game.id);
      }
    }
    setGameMetrics(metrics);
  };

  const filteredGames = selectedPlayer 
    ? games.filter(game => game.playerId === selectedPlayer)
    : games;

  const getPlayerName = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown Player';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isReady) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading game history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Game History</h2>
        
        <div className="mb-4">
          <label htmlFor="playerFilter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Player
          </label>
          <select
            id="playerFilter"
            value={selectedPlayer || ''}
            onChange={(e) => setSelectedPlayer(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Players</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} ({player.position})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Games List */}
      <div className="space-y-4">
        {filteredGames.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-600">No games found</p>
            {selectedPlayer && (
              <p className="text-sm text-gray-500 mt-2">
                Try selecting a different player or add a new game
              </p>
            )}
          </div>
        ) : (
          filteredGames.map(game => (
            <div key={game.id} className="card hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => onViewGame(game.id!)}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-800">{game.title}</h3>
                  <p className="text-sm text-gray-600">
                    {getPlayerName(game.playerId)} • {formatDate(game.timestamp)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">vs {game.opponent}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(game.gameDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Quick Metrics Preview */}
              {gameMetrics[game.id!] && gameMetrics[game.id!].length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200">
                  {gameMetrics[game.id!].slice(0, 3).map(metric => (
                    <div key={metric.metricId} className="text-center">
                      <div className="text-xs text-gray-500">{metric.metricName}</div>
                      <div className="text-sm font-semibold text-primary-600">
                        {typeof metric.value === 'number' && metric.value % 1 !== 0 
                          ? `${metric.value.toFixed(1)}%` 
                          : metric.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Tap to view details</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
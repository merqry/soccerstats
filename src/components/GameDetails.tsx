import React, { useState, useEffect } from 'react';
import type { Game, Player, Action, MetricCalculation } from '../types';
import { useDB } from '../hooks/useDB';

interface GameDetailsProps {
  gameId: number;
  onBack: () => void;
}

export const GameDetails: React.FC<GameDetailsProps> = ({ gameId, onBack }) => {
  const { 
    getGames, 
    getPlayers, 
    getActions, 
    getGameActions,
    getGameMetrics,
    deleteGame,
    calculateMetrics,
    isReady 
  } = useDB();
  
  const [game, setGame] = useState<Game | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [gameActions, setGameActions] = useState<{ [actionId: number]: number }>({});
  const [metrics, setMetrics] = useState<MetricCalculation[]>([]);

  useEffect(() => {
    if (isReady) {
      loadGameData();
    }
  }, [isReady, gameId]);

  const loadGameData = async () => {
    try {
      console.log('Loading game data for gameId:', gameId);
      const [games, players, allActions] = await Promise.all([
        getGames(),
        getPlayers(),
        getActions()
      ]);

      console.log('All games:', games);
      const currentGame = games.find(g => g.id === gameId);
      console.log('Current game:', currentGame);
      if (!currentGame) {
        console.error('Game not found for gameId:', gameId);
        return;
      }

      const currentPlayer = players.find(p => p.id === currentGame.playerId);
      console.log('Current player:', currentPlayer);
      if (!currentPlayer) {
        console.error('Player not found for playerId:', currentGame.playerId);
        return;
      }

      const actions = await getGameActions(gameId);
      console.log('Game actions loaded:', actions);
      const actionCounts: { [actionId: number]: number } = {};
      actions.forEach(action => {
        actionCounts[action.actionId] = action.count;
      });
      console.log('Action counts:', actionCounts);

      // Load selected metrics from GameMetrics table
      const gameMetrics = await getGameMetrics(gameId);
      console.log('Game metrics loaded:', gameMetrics);
      const metricIds = gameMetrics.map(gm => gm.metricId);
      console.log('Selected metric IDs:', metricIds);

      // Calculate metrics using selected metric IDs
      const calculatedMetrics = await calculateMetrics(gameId, metricIds);
      console.log('Calculated metrics:', calculatedMetrics);

      setGame(currentGame);
      setPlayer(currentPlayer);
      setActions(allActions);
      setGameActions(actionCounts);
      setMetrics(calculatedMetrics);
    } catch (error) {
      console.error('Error loading game data:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionName = (actionId: number) => {
    const action = actions.find(a => a.id === actionId);
    return action ? action.name : 'Unknown Action';
  };

  const getActionCategory = (actionId: number) => {
    const action = actions.find(a => a.id === actionId);
    return action ? action.category : 'Unknown';
  };

  const actionsByCategory = Object.entries(gameActions).reduce((acc, [actionId, count]) => {
    const category = getActionCategory(parseInt(actionId));
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ actionId: parseInt(actionId), count });
    return acc;
  }, {} as { [category: string]: { actionId: number; count: number }[] });

  if (!isReady || !game || !player) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading game details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="btn-secondary"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-800">Game Details</h1>
          <div></div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">{game.title}</h2>
          <div className="text-gray-600">
            <p><strong>Player:</strong> {player.name} ({player.position})</p>
            <p><strong>Team:</strong> {player.teamName}</p>
            <p><strong>Opponent:</strong> {game.opponent}</p>
            <p><strong>Game Date:</strong> {new Date(game.gameDate).toLocaleDateString()}</p>
            <p><strong>Tracked:</strong> {formatDate(game.timestamp)}</p>
          </div>
          {game.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700"><strong>Notes:</strong> {game.notes}</p>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
                  await deleteGame(gameId);
                  onBack();
                }
              }}
              className="btn-secondary text-red-600 hover:bg-red-50"
            >
              Delete Game
            </button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      {metrics.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Calculated Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            {metrics.map(metric => (
              <div key={metric.metricId} className="bg-primary-50 p-4 rounded-lg">
                <div className="text-sm text-primary-700 font-medium">{metric.metricName}</div>
                <div className="text-2xl font-bold text-primary-800 mt-1">
                  {typeof metric.value === 'number' && metric.value % 1 !== 0 
                    ? `${metric.value.toFixed(1)}%` 
                    : metric.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Counts */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Action Counts</h3>
        <div className="space-y-4">
          {Object.entries(actionsByCategory).map(([category, categoryActions]) => (
            <div key={category}>
              <h4 className="font-semibold text-gray-700 mb-2">{category}</h4>
              <div className="grid grid-cols-2 gap-3">
                {categoryActions.map(({ actionId, count }) => (
                  <div key={actionId} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">{getActionName(actionId)}</div>
                    <div className="text-lg font-bold text-gray-800">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import type { Player, Action, MetricCalculation } from '../types';
import { useDB } from '../hooks/useDB';
import { StatButton } from './StatButton';

interface GameTrackerProps {
  gameId: number;
  player: Player;
  selectedMetrics?: number[]; // Optional, will load from GameMetrics if not provided
  onGameEnd: () => void;
}

export const GameTracker: React.FC<GameTrackerProps> = ({
  gameId,
  player,
  selectedMetrics,
  onGameEnd
}) => {
  const { 
    getActions, 
    getGameActions, 
    getGameMetrics,
    getRequiredActionsForMetrics,
    incrementGameAction, 
    calculateMetrics,
    updateGame,
    isReady 
  } = useDB();
  
  const [actions, setActions] = useState<Action[]>([]);
  const [gameActions, setGameActions] = useState<{ [actionId: number]: number }>({});
  const [metrics, setMetrics] = useState<MetricCalculation[]>([]);
  const [showMetrics, setShowMetrics] = useState(false);
  const [selectedMetricIds, setSelectedMetricIds] = useState<number[]>(selectedMetrics || []);
  const [relevantActionIds, setRelevantActionIds] = useState<number[]>([]);

  // Update selectedMetricIds when selectedMetrics prop changes
  useEffect(() => {
    if (selectedMetrics && selectedMetrics.length > 0) {
      setSelectedMetricIds(selectedMetrics);
    }
  }, [selectedMetrics]);

  useEffect(() => {
    if (isReady) {
      loadActions();
      loadGameActions();
      
      // If selectedMetrics not provided, load from GameMetrics table
      if (!selectedMetrics || selectedMetrics.length === 0) {
        loadSelectedMetrics();
      }
    }
  }, [isReady, gameId]);

  const loadSelectedMetrics = async () => {
    try {
      const gameMetrics = await getGameMetrics(gameId);
      const metricIds = gameMetrics.map(gm => gm.metricId);
      if (metricIds.length > 0) {
        setSelectedMetricIds(metricIds);
      }
    } catch (error) {
      console.error('Error loading selected metrics:', error);
    }
  };

  useEffect(() => {
    if (Object.keys(gameActions).length > 0 && selectedMetricIds.length > 0) {
      calculateMetrics(gameId, selectedMetricIds).then(setMetrics);
    }
  }, [gameActions, gameId, selectedMetricIds, calculateMetrics]);

  const loadActions = async () => {
    const allActions = await getActions();
    setActions(allActions);
  };

  const loadGameActions = async () => {
    const actions = await getGameActions(gameId);
    const actionCounts: { [actionId: number]: number } = {};
    actions.forEach(action => {
      actionCounts[action.actionId] = action.count;
    });
    setGameActions(actionCounts);
  };

  const handleIncrement = async (actionId: number) => {
    await incrementGameAction(gameId, actionId);
    await loadGameActions(); // Reload to get updated counts
  };

  // Get actions that are relevant to selected metrics using getRequiredActionsForMetrics
  useEffect(() => {
    if (selectedMetricIds.length > 0 && isReady && actions.length > 0) {
      getRequiredActionsForMetrics(selectedMetricIds)
        .then(actionIds => {
          setRelevantActionIds(actionIds);
        })
        .catch(error => {
          console.error('Error getting required actions:', error);
        });
    } else if (selectedMetricIds.length === 0 && isReady) {
      // Reset relevant actions if no metrics selected
      setRelevantActionIds([]);
    }
  }, [selectedMetricIds, isReady, actions.length]);

  const getRelevantActions = () => {
    return actions.filter(action => relevantActionIds.includes(action.id!));
  };

  const relevantActions = getRelevantActions();
  const actionsByCategory = relevantActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as { [category: string]: Action[] });

  if (!isReady) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading game tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Player Info */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {player.name}
            </h2>
            <p className="text-gray-600">
              {player.position} • {player.teamName}
            </p>
          </div>
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className="btn-secondary"
          >
            {showMetrics ? 'Hide Metrics' : 'Show Metrics'}
          </button>
        </div>
      </div>

      {/* Metrics Display */}
      {showMetrics && metrics.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Live Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            {metrics.map(metric => (
              <div key={metric.metricId} className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">{metric.metricName}</div>
                <div className="text-xl font-bold text-primary-600">
                  {typeof metric.value === 'number' && metric.value % 1 !== 0 
                    ? `${metric.value.toFixed(1)}%` 
                    : metric.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {Object.keys(actionsByCategory).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(actionsByCategory).map(([category, categoryActions]) => (
            <div key={category} className="card">
              <h3 className="text-lg font-bold text-gray-800 mb-4">{category}</h3>
              <div className="grid grid-cols-2 gap-3">
                {categoryActions.map(action => (
                  <StatButton
                    key={action.id}
                    label={action.name}
                    count={gameActions[action.id!] || 0}
                    onIncrement={() => handleIncrement(action.id!)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-8">
            <p className="text-gray-600">Loading action buttons...</p>
            {selectedMetricIds.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">No metrics selected or metrics are loading</p>
            )}
          </div>
        </div>
      )}

      {/* End Game Button */}
      <div className="card">
        <button
          onClick={async () => {
            // Update game status to 'completed'
            await updateGame(gameId, { status: 'completed' });
            onGameEnd();
          }}
          className="btn-primary w-full py-3 text-lg"
        >
          End Game
        </button>
      </div>
    </div>
  );
};
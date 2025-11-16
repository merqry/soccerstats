import React, { useState, useEffect } from 'react';
import type { Player, Action, MetricCalculation } from '../types';
import { useDB } from '../hooks/useDB';
import { StatButton } from './StatButton';

interface GameTrackerProps {
  gameId: number;
  player: Player;
  selectedMetrics?: number[]; // Optional, will load from GameMetrics if not provided
  onGameEnd: () => void;
  onEditMetrics?: () => void; // Optional callback to edit metrics
}

export const GameTracker: React.FC<GameTrackerProps> = ({
  gameId,
  player,
  selectedMetrics,
  onGameEnd,
  onEditMetrics
}) => {
  const { 
    getActions, 
    getGameActions, 
    getGameMetrics,
    getRequiredActionsForMetrics,
    incrementGameAction,
    updateGameAction,
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
  const [actionHistory, setActionHistory] = useState<{ actionId: number; previousCount: number }[]>([]);

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
    console.log('handleIncrement called with actionId:', actionId, 'gameId:', gameId);
    if (!actionId) {
      console.error('handleIncrement: actionId is undefined or null');
      return;
    }
    if (!gameId) {
      console.error('handleIncrement: gameId is undefined or null');
      return;
    }
    const previousCount = gameActions[actionId] || 0;
    console.log('Previous count:', previousCount);
    try {
      const result = await incrementGameAction(gameId, actionId);
      console.log('Incremented successfully, result:', result);
      // Save to history for undo
      setActionHistory(prev => [...prev, { actionId, previousCount }]);
      await loadGameActions(); // Reload to get updated counts
      console.log('Game actions reloaded');
    } catch (error) {
      console.error('Error incrementing game action:', error);
      alert(`Error incrementing action: ${error}`);
    }
  };

  const handleDecrement = async (actionId: number) => {
    const currentCount = gameActions[actionId] || 0;
    if (currentCount > 0) {
      const previousCount = currentCount;
      await updateGameAction(gameId, actionId, currentCount - 1);
      // Save to history for undo
      setActionHistory(prev => [...prev, { actionId, previousCount }]);
      await loadGameActions();
    }
  };

  const handleUndo = async () => {
    if (actionHistory.length > 0) {
      const lastAction = actionHistory[actionHistory.length - 1];
      await updateGameAction(gameId, lastAction.actionId, lastAction.previousCount);
      setActionHistory(prev => prev.slice(0, -1));
      await loadGameActions();
    }
  };

  // Get actions that are relevant to selected metrics using getRequiredActionsForMetrics
  useEffect(() => {
    if (selectedMetricIds.length > 0 && isReady && actions.length > 0) {
      getRequiredActionsForMetrics(selectedMetricIds)
        .then(actionIds => {
          console.log('Selected metric IDs:', selectedMetricIds);
          console.log('Required action IDs:', actionIds);
          console.log('Available actions:', actions.map(a => ({ id: a.id, name: a.name })));
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

  // Define color order for sorting
  const getColorOrder = (color?: 'green' | 'light green' | 'light red' | 'red'): number => {
    switch (color) {
      case 'green': return 1;
      case 'light green': return 2;
      case 'light red': return 3;
      case 'red': return 4;
      default: return 5;
    }
  };

  const getRelevantActions = () => {
    // Filter and sort actions to ensure consistent order
    const filtered = actions.filter(action => relevantActionIds.includes(action.id!));
    // Sort by color (green → light green → light red → red), then by name
    return filtered.sort((a, b) => {
      const colorOrderA = getColorOrder(a.color);
      const colorOrderB = getColorOrder(b.color);
      if (colorOrderA !== colorOrderB) {
        return colorOrderA - colorOrderB;
      }
      return a.name.localeCompare(b.name);
    });
  };

  const relevantActions = getRelevantActions();

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
    <div className="space-y-2">
      {/* Player Info */}
      <div className="card py-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {player.name}
            </h2>
            <p className="text-gray-600">
              {player.position} • {player.teamName}
            </p>
          </div>
          <div className="flex gap-2">
            {onEditMetrics && (
              <button
                onClick={onEditMetrics}
                className="btn-secondary"
              >
                Edit Metrics
              </button>
            )}
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="btn-secondary"
            >
              {showMetrics ? 'Show Tracking' : 'Show Metrics'}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Display - Shown when showMetrics is true */}
      {showMetrics && (
        <div className="card py-2">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Live Metrics</h3>
          {metrics.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {metrics.map(metric => (
                <div key={metric.metricId} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">{metric.metricName}</div>
                  <div className="text-2xl font-bold text-primary-600">
                    {typeof metric.value === 'number' && metric.value % 1 !== 0 
                      ? `${metric.value.toFixed(1)}%` 
                      : typeof metric.value === 'number'
                      ? metric.value.toString()
                      : metric.value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No metrics calculated yet. Record some actions to see metrics.</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons Grid - Shown when showMetrics is false */}
      {!showMetrics && (
        <>
          {relevantActions.length > 0 ? (
            <div className="px-2 py-1">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {relevantActions.map(action => {
                  console.log(`Action: ${action.name}, ID: ${action.id}, Color: ${action.color}`);
                  return (
                    <StatButton
                      key={action.id}
                      label={action.name}
                      count={gameActions[action.id!] || 0}
                      onIncrement={() => {
                        console.log('Button clicked for action:', action.name, 'ID:', action.id);
                        if (action.id) {
                          handleIncrement(action.id);
                        } else {
                          console.error('Action ID is undefined:', action);
                        }
                      }}
                      color={action.color}
                    />
                  );
                })}
              </div>
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

          {/* Utility Buttons - Only shown when tracking is visible */}
          <div className="px-2 py-1">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleUndo}
                disabled={actionHistory.length === 0}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded text-xs font-medium"
              >
                ↶ Undo
              </button>
              <button
                onClick={async () => {
                  // Reset all counts to 0
                  if (confirm('Start over? This will reset all action counts to 0.')) {
                    for (const actionId of relevantActionIds) {
                      await updateGameAction(gameId, actionId, 0);
                    }
                    setActionHistory([]);
                    await loadGameActions();
                  }
                }}
                className="btn-secondary px-2 py-1 rounded text-xs font-medium"
              >
                ↻ Reset
              </button>
              <button
                onClick={async () => {
                  // Update game status to 'completed'
                  await updateGame(gameId, { status: 'completed' });
                  onGameEnd();
                }}
                className="btn-primary px-2 py-1 rounded text-xs font-medium"
              >
                ✓ End Game
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
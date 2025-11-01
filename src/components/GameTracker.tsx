import React, { useState, useEffect } from 'react';
import type { Player, Action, MetricCalculation } from '../types';
import { useDB } from '../hooks/useDB';
import { StatButton } from './StatButton';

interface GameTrackerProps {
  gameId: number;
  player: Player;
  selectedMetrics: number[];
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
    incrementGameAction, 
    calculateMetrics,
    isReady 
  } = useDB();
  
  const [actions, setActions] = useState<Action[]>([]);
  const [gameActions, setGameActions] = useState<{ [actionId: number]: number }>({});
  const [metrics, setMetrics] = useState<MetricCalculation[]>([]);
  const [showMetrics, setShowMetrics] = useState(false);

  useEffect(() => {
    if (isReady) {
      loadActions();
      loadGameActions();
    }
  }, [isReady, gameId]);

  useEffect(() => {
    if (Object.keys(gameActions).length > 0) {
      calculateMetrics(gameId).then(setMetrics);
    }
  }, [gameActions, gameId, calculateMetrics]);

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

  // Get actions that are relevant to selected metrics
  const getRelevantActions = () => {
    const relevantActionNames = new Set<string>();
    
    // Add actions based on selected metrics
    if (selectedMetrics.includes(1)) { // Shots on Target %
      relevantActionNames.add('Shot on Target');
      relevantActionNames.add('Shot off Target');
    }
    if (selectedMetrics.includes(2)) { // Total Passes
      relevantActionNames.add('Complete Pass');
      relevantActionNames.add('Incomplete Pass');
      relevantActionNames.add('Pass Forward');
      relevantActionNames.add('Line-breaking Pass');
    }
    if (selectedMetrics.includes(3)) { // Pass Completion Rate
      relevantActionNames.add('Complete Pass');
      relevantActionNames.add('Incomplete Pass');
      relevantActionNames.add('Pass Forward');
      relevantActionNames.add('Line-breaking Pass');
    }
    if (selectedMetrics.includes(4)) { // Dribble Success Rate
      relevantActionNames.add('Successful Dribble');
      relevantActionNames.add('Unsuccessful Dribble');
    }
    if (selectedMetrics.includes(5)) { // Successful Tackle Rate
      relevantActionNames.add('Successful Tackle');
      relevantActionNames.add('Missed Tackle');
    }
    if (selectedMetrics.includes(6)) { // Possession
      relevantActionNames.add('Complete Pass');
      relevantActionNames.add('Incomplete Pass');
      relevantActionNames.add('Successful Dribble');
      relevantActionNames.add('Unsuccessful Dribble');
    }

    return actions.filter(action => relevantActionNames.has(action.name));
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

      {/* End Game Button */}
      <div className="card">
        <button
          onClick={onGameEnd}
          className="btn-primary w-full py-3 text-lg"
        >
          End Game
        </button>
      </div>
    </div>
  );
};
import { useState, useEffect } from 'react';
import { db } from '../db/database';
import type { Player, Game, GameAction, MetricCalculation, GameMetric, MetricAction } from '../types';
import { initialActions, initialMetrics } from '../db/seed';

export const useDB = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeDB = async () => {
      try {
        // Check if actions exist, if not seed them
        const actionCount = await db.actions.count();
        if (actionCount === 0) {
          await db.actions.bulkAdd(initialActions);
        }

        // Check if metrics exist, if not seed them
        const metricCount = await db.metrics.count();
        if (metricCount === 0) {
          await db.metrics.bulkAdd(initialMetrics);
        } else {
          // Update existing metrics to match seed data (sync requiredActions from Metrics.md)
          const existingMetrics = await db.metrics.toArray();
          for (const seedMetric of initialMetrics) {
            const existingMetric = existingMetrics.find(m => m.name === seedMetric.name);
            if (existingMetric && existingMetric.id && seedMetric.requiredActions) {
              // Update requiredActions to match Metrics.md associations
              await db.metrics.update(existingMetric.id, {
                requiredActions: seedMetric.requiredActions,
                metricFormula: seedMetric.metricFormula
              });
            }
          }
        }
        
        // Populate MetricActions table based on metric.requiredActions from Metrics.md
        // Clear existing data to ensure it matches the current seed data
        await db.metricActions.clear();
        const allMetrics = await db.metrics.toArray();
        const metricActions: Omit<MetricAction, 'id'>[] = [];
        
        for (const metric of allMetrics) {
          if (metric.id && metric.requiredActions) {
            for (const actionId of metric.requiredActions) {
              metricActions.push({ metricId: metric.id, actionId });
            }
          }
        }
        
        if (metricActions.length > 0) {
          try {
            await db.metricActions.bulkAdd(metricActions);
            console.log(`Populated MetricActions table with ${metricActions.length} records based on Metrics.md associations`);
          } catch (error) {
            console.error('Error populating MetricActions:', error);
          }
        }

        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setIsReady(true); // Still set ready to prevent infinite loading
      }
    };

    initializeDB();
  }, []);

  // Player operations
  const addPlayer = async (player: Omit<Player, 'id'>) => {
    return await db.players.add(player);
  };

  const getPlayers = async () => {
    return await db.players.orderBy('createdAt').reverse().toArray();
  };

  const updatePlayer = async (id: number, updates: Partial<Player>) => {
    return await db.players.update(id, updates);
  };

  const deletePlayer = async (id: number) => {
    return await db.players.delete(id);
  };

  // Game operations
  const addGame = async (game: Omit<Game, 'id'>) => {
    return await db.games.add(game);
  };

  const getGames = async () => {
    return await db.games.orderBy('timestamp').reverse().toArray();
  };

  const getGamesByPlayer = async (playerId: number, status?: 'in_progress' | 'completed') => {
    let query = db.games.where('playerId').equals(playerId);
    if (status) {
      query = query.filter(game => game.status === status);
    }
    return await query.reverse().sortBy('timestamp');
  };

  const updateGame = async (id: number, updates: Partial<Game>) => {
    return await db.games.update(id, updates);
  };

  const deleteGame = async (id: number) => {
    // Also delete associated game actions and game metrics
    await db.gameActions.where('gameId').equals(id).delete();
    await db.gameMetrics.where('gameId').equals(id).delete();
    return await db.games.delete(id);
  };

  // Action operations
  const getActions = async () => {
    return await db.actions.orderBy('category').toArray();
  };

  const getActionsByCategory = async (category: string) => {
    return await db.actions.where('category').equals(category).toArray();
  };

  // Metric operations
  const getMetrics = async () => {
    return await db.metrics.orderBy('category').toArray();
  };

  const getMetricsByCategory = async (category: string) => {
    return await db.metrics.where('category').equals(category).toArray();
  };

  // Game Action operations
  const addGameAction = async (gameAction: Omit<GameAction, 'id'>) => {
    return await db.gameActions.add(gameAction);
  };

  const updateGameAction = async (gameId: number, actionId: number, count: number) => {
    const existing = await db.gameActions.where(['gameId', 'actionId']).equals([gameId, actionId]).first();
    if (existing) {
      return await db.gameActions.update(existing.id!, { count, timestamp: new Date() });
    } else {
      return await db.gameActions.add({ gameId, actionId, count, timestamp: new Date() });
    }
  };

  const getGameActions = async (gameId: number) => {
    return await db.gameActions.where('gameId').equals(gameId).toArray();
  };

  const incrementGameAction = async (gameId: number, actionId: number) => {
    const existing = await db.gameActions.where(['gameId', 'actionId']).equals([gameId, actionId]).first();
    const newCount = existing ? existing.count + 1 : 1;
    return await updateGameAction(gameId, actionId, newCount);
  };

  // GameMetrics operations
  const addGameMetrics = async (gameId: number, metricIds: number[]) => {
    const gameMetrics: Omit<GameMetric, 'id'>[] = metricIds.map(metricId => ({
      gameId,
      metricId
    }));
    return await db.gameMetrics.bulkAdd(gameMetrics);
  };

  const getGameMetrics = async (gameId: number) => {
    return await db.gameMetrics.where('gameId').equals(gameId).toArray();
  };

  const deleteGameMetrics = async (gameId: number) => {
    return await db.gameMetrics.where('gameId').equals(gameId).delete();
  };

  // MetricAction operations
  const addMetricActions = async (metricId: number, actionIds: number[]) => {
    const metricActions: Omit<MetricAction, 'id'>[] = actionIds.map(actionId => ({
      metricId,
      actionId
    }));
    return await db.metricActions.bulkAdd(metricActions);
  };

  const getMetricActions = async (metricId: number) => {
    return await db.metricActions.where('metricId').equals(metricId).toArray();
  };

  const getActionMetrics = async (actionId: number) => {
    return await db.metricActions.where('actionId').equals(actionId).toArray();
  };

  const deleteMetricActions = async (metricId: number) => {
    return await db.metricActions.where('metricId').equals(metricId).delete();
  };

  // Dependency resolution
  const resolveMetricDependencies = async (selectedMetricIds: number[]): Promise<number[]> => {
    const allMetrics = await getMetrics();
    const resolved: number[] = [];
    const visited = new Set<number>();
    
    const resolve = (metricId: number) => {
      if (visited.has(metricId)) return;
      visited.add(metricId);
      
      const metric = allMetrics.find(m => m.id === metricId);
      if (!metric) return;
      
      // Resolve dependencies first
      if (metric.dependsOn) {
        for (const depId of metric.dependsOn) {
          resolve(depId);
        }
      }
      
      // Add this metric after its dependencies
      if (!resolved.includes(metricId)) {
        resolved.push(metricId);
      }
    };
    
    // Resolve all selected metrics
    for (const metricId of selectedMetricIds) {
      resolve(metricId);
    }
    
    return resolved;
  };

  const getRequiredActionsForMetrics = async (metricIds: number[]): Promise<number[]> => {
    const metrics = await getMetrics();
    const requiredActions = new Set<number>();
    
    for (const metricId of metricIds) {
      const metric = metrics.find(m => m.id === metricId);
      if (metric && metric.requiredActions) {
        metric.requiredActions.forEach(actionId => requiredActions.add(actionId));
      }
    }
    
    return Array.from(requiredActions);
  };

  // Enhanced calculation functions
  const calculateSum = (metric: any, actionCounts: { [actionId: number]: number }): number => {
    let sum = 0;
    if (metric.requiredActions) {
      for (const actionId of metric.requiredActions) {
        sum += actionCounts[actionId] || 0;
      }
    }
    return sum;
  };

  const calculatePercentage = (metric: any, actionCounts: { [actionId: number]: number }, calculatedValues: { [metricId: number]: number }): number => {
    const formula = metric.metricFormula;
    
    if (formula.includes('Total Passes')) {
      // Use calculated value from dependency
      const totalPasses = calculatedValues[metric.dependsOn?.[0]] || 0;
      const successfulPasses = (actionCounts[3] || 0) + (actionCounts[5] || 0) + (actionCounts[6] || 0);
      return totalPasses > 0 ? (successfulPasses / totalPasses) * 100 : 0;
    }
    
    if (formula.includes('Shot on Target')) {
      const shotsOnTarget = actionCounts[1] || 0;
      const shotsOffTarget = actionCounts[2] || 0;
      const total = shotsOnTarget + shotsOffTarget;
      return total > 0 ? (shotsOnTarget / total) * 100 : 0;
    }
    
    if (formula.includes('Dribble Success')) {
      const successful = actionCounts[7] || 0;
      const unsuccessful = actionCounts[8] || 0;
      const total = successful + unsuccessful;
      return total > 0 ? (successful / total) * 100 : 0;
    }
    
    if (formula.includes('Tackle Rate')) {
      const successful = actionCounts[9] || 0;
      const missed = actionCounts[10] || 0;
      const total = successful + missed;
      return total > 0 ? (successful / total) * 100 : 0;
    }
    
    return 0;
  };

  // Enhanced calculate metrics with dependency resolution
  const calculateMetrics = async (gameId: number, selectedMetricIds?: number[]): Promise<MetricCalculation[]> => {
    const gameActions = await getGameActions(gameId);
    const actions = await getActions();
    const metrics = await getMetrics();

    // Build action count lookup by ID
    const actionCounts: { [actionId: number]: number } = {};
    gameActions.forEach(gameAction => {
      actionCounts[gameAction.actionId] = gameAction.count;
    });
    
    // Get metrics to calculate
    let metricsToCalculate = metrics;
    if (selectedMetricIds) {
      // Resolve dependencies in correct order
      const orderedMetricIds = await resolveMetricDependencies(selectedMetricIds);
      metricsToCalculate = metrics.filter(m => orderedMetricIds.includes(m.id!));
    }

    const calculations: MetricCalculation[] = [];
    const calculatedValues: { [metricId: number]: number } = {};

    // Calculate metrics in dependency order
    for (const metric of metricsToCalculate) {
      try {
        let value = 0;
        
        switch (metric.calculationType) {
          case 'sum':
            value = calculateSum(metric, actionCounts);
            break;
          case 'percentage':
            value = calculatePercentage(metric, actionCounts, calculatedValues);
            break;
          case 'custom':
            // Fallback to old logic for custom calculations
            value = calculateCustomMetric(metric, actionCounts, calculatedValues);
            break;
          default:
            value = calculateCustomMetric(metric, actionCounts, calculatedValues);
        }
        
        calculatedValues[metric.id!] = value;
        calculations.push({
          metricId: metric.id!,
          metricName: metric.name,
          value: Math.round(value * 100) / 100,
          formula: metric.metricFormula
        });
      } catch (error) {
        console.error(`Error calculating metric ${metric.name}:`, error);
      }
    }

    return calculations;
  };

  // Fallback calculation for custom metrics
  const calculateCustomMetric = (metric: any, actionCounts: { [actionId: number]: number }, calculatedValues: { [metricId: number]: number }): number => {
    const formula = metric.metricFormula;
    
    if (formula.includes('Possession')) {
      return (actionCounts[3] || 0) + (actionCounts[4] || 0) + (actionCounts[7] || 0) + (actionCounts[8] || 0);
    }
    
    return 0;
  };

  return {
    isReady,
    // Player operations
    addPlayer,
    getPlayers,
    updatePlayer,
    deletePlayer,
    // Game operations
    addGame,
    getGames,
    getGamesByPlayer,
    updateGame,
    deleteGame,
    // Action operations
    getActions,
    getActionsByCategory,
    // Metric operations
    getMetrics,
    getMetricsByCategory,
    // Game Action operations
    addGameAction,
    updateGameAction,
    getGameActions,
    incrementGameAction,
    // GameMetric operations
    addGameMetrics,
    getGameMetrics,
    deleteGameMetrics,
    // MetricAction operations
    addMetricActions,
    getMetricActions,
    getActionMetrics,
    deleteMetricActions,
    // Metric calculation
    calculateMetrics,
    resolveMetricDependencies,
    getRequiredActionsForMetrics
  };
};

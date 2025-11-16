import { useState, useEffect } from 'react';
import { db } from '../db/database';
import type { Player, Game, GameAction, MetricCalculation, GameMetric } from '../types';
import { initialActions, initialMetrics } from '../db/seed';

export const useDB = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeDB = async () => {
      try {
        // Check if actions exist, if not seed them with fixed IDs
        const actionCount = await db.actions.count();
        const expectedActionCount = initialActions.length;
        
        if (actionCount === 0) {
          // Seed actions with fixed IDs (1-based)
          const actionsWithIds = initialActions.map((action, index) => ({
            ...action,
            id: index + 1
          }));
          await db.actions.bulkAdd(actionsWithIds as any);
          console.log(`Seeded ${actionsWithIds.length} actions with fixed IDs`);
        } else if (actionCount !== expectedActionCount) {
          // Clear and re-seed with fixed IDs if count doesn't match
          console.warn(`Action count mismatch: expected ${expectedActionCount}, found ${actionCount}. Clearing and re-seeding actions.`);
          await db.actions.clear();
          const actionsWithIds = initialActions.map((action, index) => ({
            ...action,
            id: index + 1
          }));
          await db.actions.bulkAdd(actionsWithIds as any);
        } else {
          // Verify action IDs and colors are correct, fix if needed, and add missing actions
          const existingActions = await db.actions.orderBy('id').toArray();
          const existingActionNames = new Set(existingActions.map(a => a.name));
          
          // Check if we need to add new actions
          const missingActions = initialActions.filter(seedAction => !existingActionNames.has(seedAction.name));
          
          if (missingActions.length > 0) {
            console.log(`Found ${missingActions.length} new actions to add:`, missingActions.map(a => a.name));
            // Add missing actions with appropriate IDs
            for (const seedAction of missingActions) {
              const actionIndex = initialActions.findIndex(a => a.name === seedAction.name);
              if (actionIndex !== -1) {
                const newAction = {
                  ...seedAction,
                  id: actionIndex + 1
                };
                // Check if ID is already taken, if so, find next available
                const existingWithId = existingActions.find(a => a.id === newAction.id);
                if (existingWithId) {
                  // ID conflict - need to re-seed all actions
                  console.warn('Action ID conflict detected. Re-seeding all actions with fixed IDs.');
                  await db.actions.clear();
                  const actionsWithIds = initialActions.map((action, index) => ({
                    ...action,
                    id: index + 1
                  }));
                  await db.actions.bulkAdd(actionsWithIds as any);
                  break;
                } else {
                  await db.actions.add(newAction as any);
                  console.log(`Added new action "${seedAction.name}" with ID ${newAction.id}`);
                }
              }
            }
            // Reload actions after adding
            const updatedActions = await db.actions.orderBy('id').toArray();
            // Update existing actions to include color field if missing or incorrect
            for (let i = 0; i < updatedActions.length && i < initialActions.length; i++) {
              const existingAction = updatedActions[i];
              const seedAction = initialActions[i];
              if (existingAction && existingAction.id && seedAction.color) {
                // Update color if it doesn't match or is missing
                if (!existingAction.color || existingAction.color !== seedAction.color) {
                  await db.actions.update(existingAction.id, { color: seedAction.color });
                  console.log(`Updated action "${existingAction.name}" color from ${existingAction.color || 'none'} to ${seedAction.color}`);
                }
              }
            }
          } else {
            // No new actions, just update existing ones
            for (let i = 0; i < existingActions.length && i < initialActions.length; i++) {
              const existingAction = existingActions[i];
              const seedAction = initialActions[i];
              if (existingAction && existingAction.id && seedAction.color) {
                // Update color if it doesn't match or is missing
                if (!existingAction.color || existingAction.color !== seedAction.color) {
                  await db.actions.update(existingAction.id, { color: seedAction.color });
                  console.log(`Updated action "${existingAction.name}" color from ${existingAction.color || 'none'} to ${seedAction.color}`);
                }
              }
            }
          }
        }

        // Get all actions to build name-to-ID mapping
        const dbActions = await db.actions.toArray();
        console.log(`Retrieved ${dbActions.length} actions from database (expected ${initialActions.length})`);
        const actionNameToId: { [name: string]: number } = {};
        dbActions.forEach(action => {
          if (action.id) {
            actionNameToId[action.name] = action.id;
          }
        });
        const actionNames = initialActions.map(a => a.name);
        
        // Verify all actions are mapped
        const missingActions = initialActions.filter(a => !actionNameToId[a.name]);
        if (missingActions.length > 0) {
          console.error(`Missing action mappings (${missingActions.length}):`, missingActions.map(a => a.name));
        }
        console.log(`Full action name to ID mapping (${Object.keys(actionNameToId).length} actions):`, actionNameToId);
        
        // Check if metrics exist, if not seed them
        const metricCount = await db.metrics.count();
        if (metricCount === 0) {
          // Map seed metrics to use actual action IDs
          const metricsToAdd = initialMetrics.map(seedMetric => {
            if (seedMetric.requiredActions) {
              // Map action IDs from seed (positional) to actual database IDs by name
              const mappedActionIds: number[] = [];
              
              for (const actionIndex of seedMetric.requiredActions) {
                // actionIndex is 1-based in seed data, but array is 0-based
                const actionName = actionNames[actionIndex - 1];
                const actualActionId = actionNameToId[actionName];
                if (actualActionId) {
                  mappedActionIds.push(actualActionId);
                } else {
                  console.warn(`Could not find action ID for: ${actionName} (index ${actionIndex}) in seed metric "${seedMetric.name}"`);
                }
              }
              
              return {
                ...seedMetric,
                requiredActions: mappedActionIds
              };
            }
            return seedMetric;
          });
          
          await db.metrics.bulkAdd(metricsToAdd);
        } else {
          // Update existing metrics and add new ones to match seed data (sync requiredActions from Metrics.md)
          const existingMetrics = await db.metrics.toArray();
          
          // Remove duplicate metrics (keep the first one, delete the rest)
          const metricNames = new Map<string, number>();
          const duplicatesToDelete: number[] = [];
          
          for (const metric of existingMetrics) {
            if (metric.id && metric.name) {
              const firstId = metricNames.get(metric.name);
              if (firstId === undefined) {
                metricNames.set(metric.name, metric.id);
              } else {
                // This is a duplicate, mark for deletion
                duplicatesToDelete.push(metric.id);
                console.log(`Found duplicate metric "${metric.name}" with ID ${metric.id}, will delete`);
              }
            }
          }
          
          // Delete duplicates
          if (duplicatesToDelete.length > 0) {
            console.log(`Deleting ${duplicatesToDelete.length} duplicate metrics`);
            for (const id of duplicatesToDelete) {
              await db.metrics.delete(id);
            }
            // Reload metrics after cleanup
            const cleanedMetrics = await db.metrics.toArray();
            console.log(`After cleanup: ${cleanedMetrics.length} metrics remain`);
          }
          
          console.log('Action name to ID mapping:', actionNameToId);
          console.log('Action names array:', actionNames);
          
          // Reload metrics after potential cleanup
          const currentMetrics = await db.metrics.toArray();
          
          for (const seedMetric of initialMetrics) {
            const existingMetric = currentMetrics.find(m => m.name === seedMetric.name);
            
            // Map action IDs from seed (positional) to actual database IDs by name
            const mappedActionIds: number[] = [];
            
            if (seedMetric.requiredActions) {
              for (const actionIndex of seedMetric.requiredActions) {
                // actionIndex is 1-based in seed data, but array is 0-based
                const actionName = actionNames[actionIndex - 1];
                const actualActionId = actionNameToId[actionName];
                if (actualActionId) {
                  mappedActionIds.push(actualActionId);
                } else {
                  console.warn(`Could not find action ID for: ${actionName} (index ${actionIndex})`);
                }
              }
            }
            
            if (existingMetric && existingMetric.id) {
              // Update existing metric
              console.log(`Updating metric "${seedMetric.name}" (ID: ${existingMetric.id}) requiredActions from [${existingMetric.requiredActions}] to [${mappedActionIds}]`);
              
              await db.metrics.update(existingMetric.id, {
                requiredActions: mappedActionIds,
                metricFormula: seedMetric.metricFormula,
                description: seedMetric.description,
                category: seedMetric.category,
                dependsOn: seedMetric.dependsOn,
                calculationType: seedMetric.calculationType
              });
            } else {
              // Add new metric that doesn't exist yet
              console.log(`Adding new metric "${seedMetric.name}" with requiredActions [${mappedActionIds}]`);
              
              const metricToAdd = {
                ...seedMetric,
                requiredActions: mappedActionIds
              };
              
              await db.metrics.add(metricToAdd);
            }
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
    console.log('updateGameAction called:', { gameId, actionId, count });
    // Query by gameId first, then filter by actionId (more reliable than compound index)
    const allGameActions = await db.gameActions.where('gameId').equals(gameId).toArray();
    const existing = allGameActions.find(ga => ga.actionId === actionId);
    console.log('Existing game action:', existing);
    if (existing && existing.id) {
      const result = await db.gameActions.update(existing.id, { count, timestamp: new Date() });
      console.log('Updated game action, result:', result);
      return result;
    } else {
      const result = await db.gameActions.add({ gameId, actionId, count, timestamp: new Date() });
      console.log('Added new game action, result:', result);
      return result;
    }
  };

  const getGameActions = async (gameId: number) => {
    console.log('getGameActions called for gameId:', gameId);
    const result = await db.gameActions.where('gameId').equals(gameId).toArray();
    console.log('Game actions retrieved:', result);
    return result;
  };

  const incrementGameAction = async (gameId: number, actionId: number) => {
    console.log('incrementGameAction called:', { gameId, actionId });
    // Query by gameId first, then filter by actionId (more reliable than compound index)
    const allGameActions = await db.gameActions.where('gameId').equals(gameId).toArray();
    const existing = allGameActions.find(ga => ga.actionId === actionId);
    console.log('Existing record:', existing);
    const newCount = existing ? existing.count + 1 : 1;
    console.log('New count will be:', newCount);
    return await updateGameAction(gameId, actionId, newCount);
  };

  // GameMetrics operations
  const addGameMetrics = async (gameId: number, metricIds: number[]) => {
    console.log('addGameMetrics called:', { gameId, metricIds });
    // First, delete any existing metrics for this game to avoid duplicates
    await db.gameMetrics.where('gameId').equals(gameId).delete();
    const gameMetrics: Omit<GameMetric, 'id'>[] = metricIds.map(metricId => ({
      gameId,
      metricId
    }));
    console.log('Adding game metrics:', gameMetrics);
    const result = await db.gameMetrics.bulkAdd(gameMetrics);
    console.log('Game metrics added, result:', result);
    return result;
  };

  const getGameMetrics = async (gameId: number) => {
    console.log('getGameMetrics called for gameId:', gameId);
    const result = await db.gameMetrics.where('gameId').equals(gameId).toArray();
    console.log('Game metrics retrieved:', result);
    return result;
  };

  const deleteGameMetrics = async (gameId: number) => {
    return await db.gameMetrics.where('gameId').equals(gameId).delete();
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

  const calculatePercentage = async (metric: any, actionCounts: { [actionId: number]: number }, calculatedValues: { [metricId: number]: number }): Promise<number> => {
    if (!metric.requiredActions || metric.requiredActions.length === 0) {
      console.warn(`Metric "${metric.name}" has no requiredActions`);
      return 0;
    }

    // Get actions to identify which are successful (green/light green) vs unsuccessful (light red/red)
    const allActions = await getActions();
    const actionMap: { [id: number]: { name: string; color?: string } } = {};
    allActions.forEach(action => {
      if (action.id) {
        actionMap[action.id] = { name: action.name, color: action.color };
      }
    });
    
    // Helper to determine if an action represents a successful outcome
    const isSuccessfulAction = (actionId: number): boolean => {
      const action = actionMap[actionId];
      if (!action) {
        console.warn(`Action with ID ${actionId} not found in actionMap`);
        return false;
      }
      // Green or light green actions are successful outcomes
      return action.color === 'green' || action.color === 'light green';
    };
    
    // Check if metric depends on another metric (e.g., Pass Completion Rate depends on Total Passes)
    if (metric.dependsOn && metric.dependsOn.length > 0) {
      // Use calculated value from dependency (denominator)
      const dependencyValue = calculatedValues[metric.dependsOn[0]];
      console.log(`Metric "${metric.name}" depends on metric ID ${metric.dependsOn[0]}, dependency value:`, dependencyValue);
      
      if (!dependencyValue || dependencyValue === 0) {
        console.log(`Dependency value is 0 or undefined for "${metric.name}", returning 0`);
        return 0;
      }
      
      // Calculate numerator: sum of successful actions from requiredActions
      let successful = 0;
      for (const actionId of metric.requiredActions) {
        if (isSuccessfulAction(actionId)) {
          const count = actionCounts[actionId] || 0;
          successful += count;
          console.log(`  Action ID ${actionId} (${actionMap[actionId]?.name}) is successful, count: ${count}`);
        }
      }
      
      console.log(`  Total successful: ${successful}, dependency value: ${dependencyValue}`);
      const result = (successful / dependencyValue) * 100;
      console.log(`  Calculated percentage: ${result}%`);
      return isNaN(result) ? 0 : result;
    }
    
    // For metrics without dependencies (e.g., Shots on Target %)
    // Calculate percentage: successful actions / total actions
    let successful = 0;
    let total = 0;
    
    for (const actionId of metric.requiredActions) {
      const count = actionCounts[actionId] || 0;
      total += count;
      if (isSuccessfulAction(actionId)) {
        successful += count;
        console.log(`  Action ID ${actionId} (${actionMap[actionId]?.name}) is successful, count: ${count}`);
      } else {
        console.log(`  Action ID ${actionId} (${actionMap[actionId]?.name}) is not successful, count: ${count}`);
      }
    }
    
    console.log(`Metric "${metric.name}": successful=${successful}, total=${total}`);
    
    if (total === 0) {
      console.log(`  Total is 0, returning 0`);
      return 0;
    }
    
    const result = (successful / total) * 100;
    console.log(`  Calculated percentage: ${result}%`);
    return isNaN(result) ? 0 : result;
  };

  // Enhanced calculate metrics with dependency resolution
  const calculateMetrics = async (gameId: number, selectedMetricIds?: number[]): Promise<MetricCalculation[]> => {
    const gameActions = await getGameActions(gameId);
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
            value = await calculatePercentage(metric, actionCounts, calculatedValues);
            break;
          case 'custom':
            // Fallback to old logic for custom calculations
            value = calculateCustomMetric(metric, actionCounts);
            break;
          default:
            value = calculateCustomMetric(metric, actionCounts);
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
  const calculateCustomMetric = (metric: any, actionCounts: { [actionId: number]: number }): number => {
    // Use requiredActions array if available
    if (metric.requiredActions && metric.requiredActions.length > 0) {
      return metric.requiredActions.reduce((sum: number, actionId: number) => {
        return sum + (actionCounts[actionId] || 0);
      }, 0);
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
    // Metric calculation
    calculateMetrics,
    resolveMetricDependencies,
    getRequiredActionsForMetrics
  };
};

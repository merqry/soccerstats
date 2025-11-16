import Dexie, { type Table } from 'dexie';
import type { Player, Game, Action, Metric, GameAction, GameMetric } from '../types';

export class SoccerStatsDB extends Dexie {
  players!: Table<Player>;
  games!: Table<Game>;
  actions!: Table<Action>;
  metrics!: Table<Metric>;
  gameActions!: Table<GameAction>;
  gameMetrics!: Table<GameMetric>;

  constructor() {
    super('SoccerStatsDB');
    this.version(3).stores({
      players: '++id, name, position, teamName, createdAt',
      games: '++id, playerId, opponent, gameDate, title, timestamp, notes, status',
      actions: '++id, name, description, category, color',
      metrics: '++id, name, description, metricFormula, category, dependsOn, requiredActions, calculationType',
      gameActions: '++id, gameId, actionId, [gameId+actionId], count, timestamp',
      gameMetrics: '++id, gameId, metricId'
    });
  }
}

export const db = new SoccerStatsDB();
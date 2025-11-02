import Dexie, { type Table } from 'dexie';
import type { Player, Game, Action, Metric, GameAction, GameMetric, MetricAction } from '../types';

export class SoccerStatsDB extends Dexie {
  players!: Table<Player>;
  games!: Table<Game>;
  actions!: Table<Action>;
  metrics!: Table<Metric>;
  gameActions!: Table<GameAction>;
  gameMetrics!: Table<GameMetric>;
  metricActions!: Table<MetricAction>;

  constructor() {
    super('SoccerStatsDB');
    this.version(2).stores({
      players: '++id, name, position, teamName, createdAt',
      games: '++id, playerId, opponent, gameDate, title, timestamp, notes, status',
      actions: '++id, name, description, category',
      metrics: '++id, name, description, metricFormula, category, dependsOn, requiredActions, calculationType',
      gameActions: '++id, gameId, actionId, count, timestamp',
      gameMetrics: '++id, gameId, metricId',
      metricActions: '++id, metricId, actionId'
    });
  }
}

export const db = new SoccerStatsDB();
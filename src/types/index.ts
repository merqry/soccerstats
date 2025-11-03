export interface Player {
  id?: number;
  name: string;
  position: string;
  teamName: string;
  createdAt: Date;
}

export interface Game {
  id?: number;
  playerId: number;
  opponent: string;
  gameDate: Date;
  title: string;
  timestamp: Date;
  notes?: string;
  status?: 'in_progress' | 'completed';
}

export interface Action {
  id?: number;
  name: string;
  description: string;
  category: string;
  color?: 'green' | 'light green' | 'light red' | 'red';
}

export interface Metric {
  id?: number;
  name: string;
  description: string;
  metricFormula: string;
  category: string;
  dependsOn?: number[];
  requiredActions?: number[];
  calculationType?: 'percentage' | 'sum' | 'average' | 'custom';
}

export interface GameAction {
  id?: number;
  gameId: number;
  actionId: number;
  count: number;
  timestamp: Date;
}

export interface GameMetric {
  id?: number;
  gameId: number;
  metricId: number;
}

export interface MetricAction {
  id?: number;
  metricId: number;
  actionId: number;
}

export interface MetricCalculation {
  metricId: number;
  metricName: string;
  value: number;
  formula: string;
}

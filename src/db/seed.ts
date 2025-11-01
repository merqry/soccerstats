import type { Action, Metric } from '../types';

export const initialActions: Omit<Action, 'id'>[] = [
  // Shooting
  { name: 'Shot on Target', description: 'Shot that hits the target/goal', category: 'Shooting' },
  { name: 'Shot off Target', description: 'Shot that misses the target/goal', category: 'Shooting' },
  
  // Dribbling
  { name: 'Successful Dribble', description: 'Successfully dribbled past an opponent', category: 'Dribbling' },
  { name: 'Unsuccessful Dribble', description: 'Failed to dribble past an opponent', category: 'Dribbling' },
  
  // Passing
  { name: 'Complete Pass', description: 'Successfully completed pass to teammate', category: 'Passing' },
  { name: 'Incomplete Pass', description: 'Pass that was intercepted or missed', category: 'Passing' },
  { name: 'Pass Forward', description: 'Forward pass to advance the ball', category: 'Passing' },
  { name: 'Line-breaking Pass', description: 'Pass that breaks through defensive lines', category: 'Passing' },
  
  // Defending
  { name: 'Successful Tackle', description: 'Successfully won the ball from opponent', category: 'Defending' },
  { name: 'Missed Tackle', description: 'Failed attempt to win the ball', category: 'Defending' },
  { name: 'Successful Interception', description: 'Successfully intercepted opponent pass', category: 'Defending' },
  
  // Possession
  { name: 'Progressive Carry', description: 'Carried ball forward into advanced position', category: 'Possession' },
  { name: 'Cross into the Box', description: 'Crossed ball into the penalty area', category: 'Possession' }
];

export const initialMetrics: Omit<Metric, 'id'>[] = [
  {
    name: 'Shots on Target %',
    description: 'Percentage of shots that hit the target',
    metricFormula: 'Shot on Target / (Shot on Target + Shot off Target)',
    category: 'Shooting',
    dependsOn: [],
    requiredActions: [1, 2], // Shot on Target, Shot off Target
    calculationType: 'percentage'
  },
  {
    name: 'Total Passes',
    description: 'Total number of passes attempted',
    metricFormula: 'Complete Pass + Incomplete Pass + Pass Forward + Line-breaking Pass',
    category: 'Passing',
    dependsOn: [],
    requiredActions: [3, 4, 5, 6], // Complete Pass, Incomplete Pass, Pass Forward, Line-breaking Pass
    calculationType: 'sum'
  },
  {
    name: 'Pass Completion Rate',
    description: 'Percentage of successful passes',
    metricFormula: '(Complete Pass + Pass Forward + Line-breaking Pass) / Total Passes',
    category: 'Passing',
    dependsOn: [2], // Depends on Total Passes (metric ID 2)
    requiredActions: [3, 4, 5, 6], // Same actions as Total Passes
    calculationType: 'percentage'
  },
  {
    name: 'Dribble Success Rate',
    description: 'Percentage of successful dribbles',
    metricFormula: 'Successful Dribble / (Successful Dribble + Unsuccessful Dribble)',
    category: 'Dribbling',
    dependsOn: [],
    requiredActions: [7, 8], // Successful Dribble, Unsuccessful Dribble
    calculationType: 'percentage'
  },
  {
    name: 'Successful Tackle Rate',
    description: 'Percentage of successful tackles',
    metricFormula: 'Successful Tackle / (Successful Tackle + Missed Tackle)',
    category: 'Defending',
    dependsOn: [],
    requiredActions: [9, 10], // Successful Tackle, Missed Tackle
    calculationType: 'percentage'
  },
  {
    name: 'Possession',
    description: 'Total possession actions',
    metricFormula: 'Complete Pass + Incomplete Pass + Successful Dribble + Unsuccessful Dribble',
    category: 'Possession',
    dependsOn: [],
    requiredActions: [3, 4, 7, 8], // Complete Pass, Incomplete Pass, Successful Dribble, Unsuccessful Dribble
    calculationType: 'sum'
  }
];
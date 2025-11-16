import type { Action, Metric } from '../types';

export const initialActions: Omit<Action, 'id'>[] = [
  // Shooting
  { name: 'Shot on Target', description: 'Shot that hits the target/goal', category: 'Shooting', color: 'green' },
  { name: 'Shot off Target', description: 'Shot that misses the target/goal', category: 'Shooting', color: 'light red' },
  
  // Dribbling
  { name: 'Successful Dribble', description: 'Successfully dribbled past an opponent', category: 'Dribbling', color: 'light green' },
  { name: 'Unsuccessful Dribble', description: 'Failed to dribble past an opponent', category: 'Dribbling', color: 'light red' },
  
  // Passing
  { name: 'Complete Pass', description: 'Successfully completed pass to teammate', category: 'Passing', color: 'light green' },
  { name: 'Incomplete Pass', description: 'Pass that was intercepted or missed', category: 'Passing', color: 'light red' },
  { name: 'Pass Forward', description: 'Forward pass to advance the ball', category: 'Passing', color: 'light green' },
  { name: 'Line-breaking Pass', description: 'Pass that breaks through defensive lines', category: 'Passing', color: 'green' },
  
  // Defending
  { name: 'Successful Tackle', description: 'Successfully won the ball from opponent', category: 'Defending', color: 'green' },
  { name: 'Missed Tackle', description: 'Failed attempt to win the ball', category: 'Defending', color: 'light red' },
  { name: 'Successful Interception', description: 'Successfully intercepted opponent pass', category: 'Defending', color: 'green' },
  
  // Possession
  { name: 'Progressive Carry', description: 'Carried ball forward into advanced position', category: 'Possession', color: 'light green' },
  { name: 'Cross into the Box', description: 'Crossed ball into the penalty area', category: 'Possession', color: 'light green' },
  
  // Aerial
  { name: 'Aerial duel won', description: 'Successfully won an aerial duel', category: 'Aerial', color: 'light green' },
  { name: 'Aerial duel lost', description: 'Failed to win an aerial duel', category: 'Aerial', color: 'light red' }
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
    requiredActions: [5, 6, 7, 8], // Complete Pass (index 4+1=5), Incomplete Pass (index 5+1=6), Pass Forward (index 6+1=7), Line-breaking Pass (index 7+1=8)
    calculationType: 'sum'
  },
  {
    name: 'Pass Completion Rate',
    description: 'Percentage of successful passes',
    metricFormula: '(Complete Pass + Pass Forward + Line-breaking Pass) / Total Passes',
    category: 'Passing',
    dependsOn: [2], // Depends on Total Passes (metric ID 2)
    requiredActions: [5, 6, 7, 8], // Complete Pass (5), Incomplete Pass (6), Pass Forward (7), Line-breaking Pass (8) - includes all actions from Total Passes dependency
    calculationType: 'percentage'
  },
  {
    name: 'Dribble Success Rate',
    description: 'Percentage of successful dribbles',
    metricFormula: 'Successful Dribble / (Successful Dribble + Unsuccessful Dribble)',
    category: 'Dribbling',
    dependsOn: [],
    requiredActions: [3, 4], // Successful Dribble (index 2+1=3), Unsuccessful Dribble (index 3+1=4)
    calculationType: 'percentage'
  },
  {
    name: 'Successful Tackle Rate',
    description: 'Percentage of successful tackles',
    metricFormula: 'Successful Tackle / (Successful Tackle + Missed Tackle)',
    category: 'Defending',
    dependsOn: [],
    requiredActions: [9, 10], // Successful Tackle (index 8+1=9), Missed Tackle (index 9+1=10)
    calculationType: 'percentage'
  },
  {
    name: 'Possession',
    description: 'Total possession actions',
    metricFormula: 'Complete Pass + Incomplete Pass + Pass Forward + Line-breaking Pass + Successful Dribble + Unsuccessful Dribble + Progressive Carry',
    category: 'Possession',
    dependsOn: [],
    requiredActions: [5, 6, 7, 8, 3, 4, 12], // Complete Pass (5), Incomplete Pass (6), Pass Forward (7), Line-breaking Pass (8), Successful Dribble (3), Unsuccessful Dribble (4), Progressive Carry (12)
    calculationType: 'sum'
  },
  {
    name: 'Interceptions',
    description: 'Count of successful interceptions',
    metricFormula: 'Successful Interception',
    category: 'Defending',
    dependsOn: [],
    requiredActions: [11], // Successful Interception (index 10+1=11)
    calculationType: 'sum'
  },
  {
    name: 'In-box plays',
    description: 'Count of crosses into the box',
    metricFormula: 'Cross into the Box',
    category: 'Possession',
    dependsOn: [],
    requiredActions: [13], // Cross into the Box (index 12+1=13)
    calculationType: 'sum'
  },
  {
    name: 'Aerial Success Rate',
    description: 'Percentage of successful aerial duels',
    metricFormula: 'Aerial duel won / (Aerial duel won + Aerial duel lost)',
    category: 'Aerial',
    dependsOn: [],
    requiredActions: [14, 15], // Aerial duel won (index 13+1=14), Aerial duel lost (index 14+1=15)
    calculationType: 'percentage'
  }
];
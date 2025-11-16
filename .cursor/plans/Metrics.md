# Metrics DEsign Plan

## Tracked actions: 

Each action has a color attribute with the following values: `green`, `light green`, `light red`, `red`

| Action | Color | Rationale |
|--------|-------|-----------|
| Shot on Target | green | Highly positive - direct scoring opportunity |
| Shot off Target | light red | Negative - missed opportunity |
| Successful Dribble | light green | Positive - successful offensive play |
| Unsuccessful Dribble | light red | Negative - failed attempt |
| Complete Pass | light green | Positive - successful pass |
| Incomplete Pass | light red | Negative - failed pass |
| Pass Forward | light green | Positive - attacking movement |
| Line-breaking Pass | green | Highly positive - excellent attacking play |
| Successful Tackle | green | Highly positive - excellent defensive play |
| Missed Tackle | light red | Negative - failed defensive attempt |
| Successful Interception | green | Highly positive - excellent defensive play |
| Progressive Carry | light green | Positive - ball advancement |
| Cross into the Box | light green | Positive - good attacking play |

## Calculated metrics: 
1. Shots on Target = Shots on Target / (Shot on Target + Shot off Target)
2. Total Passes = (Complete Pass + Incomplete Pass + Pass Forward + Line-breaking Pass)
3. Pass Completion Rate = (Complete Pass + Pass Forward + Line-breaking Pass) / Total Passes
4. Dribble Success Rate = Successful Dribble / (Successful Dribble + Unsuccessful Dribble)
5. Successful Tackle Rate = Successful Tackle / (Successful Tackle + Missed Tackle)
6. Possession = Complete Pass + Incomplete Pass + Pass Forward + Line-breaking Pass + Successful Dribble + Unsuccessful Dribble

## Metric Action associations

**Note**: Metric-Action associations are stored in the `requiredActions` array field of the Metrics table. There is no separate MetricActions table.

| Metric | Associated Actions |
|--------|-------------------|
| Shots on Target | Shot on Target, Shot off Target |
| Total Passes | Complete Pass, Incomplete Pass, Pass Forward, Line-breaking Pass |
| Pass Completion Rate | Complete Pass, Incomplete Pass, Pass Forward, Line-breaking Pass |
| Dribble Success Rate | Successful Dribble, Unsuccessful Dribble |
| Successful Tackle Rate | Successful Tackle, Missed Tackle |
| Possession | Complete Pass, Incomplete Pass, Pass Forward, Line-breaking Pass, Successful Dribble, Unsuccessful Dribble |
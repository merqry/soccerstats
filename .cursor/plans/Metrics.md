# Metrics DEsign Plan

## Tracked actions: 
-Shot on Target,
-Shot off Target,
-Successful Dribble,
-Unsuccessful Dribble,
-Complete Pass,
-Incomplete Pass,
-Pass Forward,
-Line-breaking Pass,
-Successful Tackle,
-Missed Tackle,
-Successful Interception,
-Progressive Carry,
-Cross into the Box

## Calculated metrics: 
1. Shots on Target = Shots on Target / (Shot on Target + Shot off Target)
2. Total Passes = (Complete Pass + Incomplete Pass + Pass Forward + Line-breaking Pass)
3. Pass Completion Rate = (Complete Pass + Pass Forward + Line-breaking Pass) / Total Passes
4. Dribble Success Rate = Successful Dribble / (Successful Dribble + Unsuccessful Dribble)
5. Successful Tackle Rate = Successful Tackle / (Successful Tackle + Missed Tackle)
6. Possession = Complete Pass + Incomplete Pass + Pass Forward + Line-breaking Pass + Successful Dribble + Unsuccessful Dribble

## Metric Action associations

| Metric | Associated Actions |
|--------|-------------------|
| Shots on Target | Shot on Target, Shot off Target |
| Total Passes | Complete Pass, Incomplete Pass, Pass Forward, Line-breaking Pass |
| Pass Completion Rate | Complete Pass, Incomplete Pass, Pass Forward, Line-breaking Pass |
| Dribble Success Rate | Successful Dribble, Unsuccessful Dribble |
| Successful Tackle Rate | Successful Tackle, Missed Tackle |
| Possession | Complete Pass, Incomplete Pass, Pass Forward, Line-breaking Pass, Successful Dribble, Unsuccessful Dribble |
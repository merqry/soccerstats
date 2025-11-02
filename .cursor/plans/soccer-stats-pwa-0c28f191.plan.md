<!-- 0c28f191-0a6f-402a-92bc-84e0d520b309 9eca3efa-c2de-4382-9b78-35907bf9f091 -->
# Soccer Stats Tracker PWA - Implementation Plan

## Current Status

**Completed:**

- Project setup with React + Vite + TypeScript
- Type definitions (`src/types/index.ts`)
- Database schema with Dexie.js (`src/db/database.ts`)
- Seed data for actions and metrics (`src/db/seed.ts`)
- useDB hook for database operations (`src/hooks/useDB.ts`)
- Home page with navigation (`src/pages/Home.tsx`)
- Players page with full CRUD operations (`src/pages/Players.tsx`)
- Routing setup (`src/App.tsx`)
- Basic styling with inline CSS
- PWA configuration (`vite.config.ts`, `public/manifest.json`)

**Remaining Work:**

- **Add GameMetrics table to database schema** (NEW)
- **Add status field to Game interface** (NEW)
- **Implement dynamic formula parsing system** (NEW)
- **Add metric dependency tracking** (NEW)
- Update database migration to version 2
- Implement NewGame page (player selection, opponent input, metric selection)
- Implement GameTracker component (action buttons, real-time metric calculations)
- Implement History page (game list with filtering)
- Implement GameDetails component (detailed game statistics)
- Add routes for new pages to App.tsx
- Test and refine PWA offline capabilities

## Database Schema Updates

### Entity Relationship Diagram

```
┌─────────────┐
│   Players   │
│─────────────│
│ id (PK)     │
│ name        │
│ position    │
│ teamName    │
│ createdAt   │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────────┐
│     Games       │
│─────────────────│
│ id (PK)         │
│ playerId (FK)   │
│ opponent        │
│ gameDate        │
│ title           │
│ timestamp       │
│ notes           │
│ status          │ ← NEW: 'in_progress' | 'completed'
└────┬─────┬──────┘
     │ 1   │ 1
     │     │
     │ N   │ N
     │     │
     │     └──────────────────┐
     │                        │
┌────▼─────────┐      ┌───────▼────────┐
│ GameActions  │      │  GameMetrics   │ ← NEW TABLE
│──────────────│      │────────────────│
│ id (PK)      │      │ id (PK)        │
│ gameId (FK)  │      │ gameId (FK)    │
│ actionId (FK)│      │ metricId (FK)  │
│ count        │      └───────┬────────┘
│ timestamp    │              │ N
└──────┬───────┘              │
       │ N                    │ 1
       │                      │
       │ 1              ┌─────▼──────┐
┌──────▼──────┐         │  Metrics   │
│   Actions   │         │────────────│
│─────────────│         │ id (PK)    │
│ id (PK)     │         │ name       │
│ name        │         │ description│
│ description │         │ formula    │
│ category    │         │ category   │
└─────────────┘         │ dependsOn  │ ← NEW: metric dependencies
                        └────────────┘
```

### Schema Changes Required

**New Table: GameMetrics**

- Purpose: Track which metrics were selected for each game
- Relationship: Many-to-many junction table between Games and Metrics
- Fields: `id`, `gameId`, `metricId`

**Updated Game Interface:**

- Add `status: 'in_progress' | 'completed'` field

**Updated Metric Interface:**

- Add `dependsOn: number[]` field for metric dependencies
- Update `metricFormula` to use structured format (see Formula Storage section)

### Tables Overview

1. **Players**: Core player information
2. **Games**: Game metadata and context
3. **Actions**: Pre-defined action types (seeded)
4. **Metrics**: Pre-defined calculated metrics (seeded)
5. **GameActions**: Junction table - tracks action counts per game
6. **GameMetrics**: Junction table - tracks selected metrics per game (NEW)
7. MetricActions: identifies which actions are associated with each metric (NEW)

## Implementation Steps

### 0. Update Database Schema (NEW STEP)

**Files to modify:**

- `src/types/index.ts` - Add GameMetric interface and update Game/Metric interfaces
- `src/db/database.ts` - Add gameMetrics table and migrate to version 2
- `src/hooks/useDB.ts` - Add functions for GameMetrics operations

**Changes:**

1. Add `GameMetric` interface with `gameId` and `metricId`
2. Add `status` field to `Game` interface
3. Add `dependsOn` field to `Metric` interface
4. Update Dexie schema to version 2 with new table
5. Add CRUD operations for GameMetrics in useDB hook

### 1. New Game Page

**File:** `src/pages/NewGame.tsx`

Create a multi-step form:

- Step 1: Select player from existing players
- Step 2: Enter opponent name and game date
- Step 3: Select metrics to track (from database)
- **Save selected metrics to GameMetrics table**
- Navigate to GameTracker on completion

### 2. Game Tracker Component

**File:** `src/components/GameTracker.tsx`

Build the core tracking interface:

- **Load selected metrics from GameMetrics table**
- Display selected metrics and their current calculated values
- Show action buttons for all actions needed by selected metrics
- Increment action counts on button press
- **Calculate metrics using dependency resolution algorithm**
- Calculate and display metrics in real-time using enhanced formulas
- Save game actions to database
- "End Game" button to update status to 'completed' and navigate to game details

### 3. History Page

**File:** `src/pages/History.tsx`

Display list of completed games:

- Show all games with `status = 'completed'`
- Display title, player name, opponent, date
- Filter by player (dropdown)
- Sort by date (newest first)
- Click game to view details
- Empty state when no games exist

### 4. Game Details Component

**File:** `src/components/GameDetails.tsx`

Show detailed game statistics:

- Game info (player, opponent, date, notes)
- **Load metrics from GameMetrics table**
- All tracked actions with counts
- All calculated metrics with values (using dependency resolution)
- Back button to history
- Option to delete game

### 5. Update Routing

**File:** `src/App.tsx`

Add routes:

- `/new-game` → NewGame page
- `/history` → History page
- `/game/:id` → GameDetails component

### 6. Enhance useDB Hook

**File:** `src/hooks/useDB.ts`

Add missing functions:

- `getGamesByPlayer(playerId, status?)`
- `getGameActions(gameId)`
- `getGameMetrics(gameId)` (NEW)
- `addGameMetrics(gameId, metricIds)` (NEW)
- `calculateMetrics(gameId)` (enhanced with dependency resolution)
- `deleteGame(gameId)`
- `resolveMetricDependencies(metricIds)` (NEW)
- `getRequiredActionsForMetrics(metricIds)` (NEW)

## Formula Storage System (PROPOSED)

### Current Problem

- Formulas stored as strings are hard to parse dynamically
- Hard-coded if/else logic for each metric type
- No support for metric dependencies
- Difficult to add new metrics without code changes

### Proposed Solution: Structured Formula Format

**Option 1: JSON-Based Formula Structure**

```typescript
interface FormulaNode {
  type: 'action' | 'metric' | 'operation' | 'number';
  value: string | number;
  children?: FormulaNode[];
}

interface Metric {
  id?: number;
  name: string;
  description: string;
  formula: FormulaNode;  // Instead of string
  category: string;
  dependsOn: number[];    // Array of metric IDs this depends on
}
```

**Example Formula Structure:**

```json
// "Shots on Target %" formula
{
  "type": "operation",
  "value": "/",
  "children": [
    {
      "type": "action",
      "value": "Shot on Target"
    },
    {
      "type": "operation", 
      "value": "+",
      "children": [
        {"type": "action", "value": "Shot on Target"},
        {"type": "action", "value": "Shot off Target"}
      ]
    }
  ]
}
```

**Option 2: Expression Tree Format**

```typescript
interface ExpressionTree {
  operator: '+' | '-' | '*' | '/' | 'percentage';
  operands: (ActionReference | MetricReference | ExpressionTree)[];
}

interface ActionReference {
  type: 'action';
  actionId: number;
}

interface MetricReference {
  type: 'metric';
  metricId: number;
}
```

**Option 3: Simple Dependency-Based System**

```typescript
interface Metric {
  id?: number;
  name: string;
  description: string;
  formula: string;           // Keep simple string for now
  category: string;
  dependsOn: number[];       // Metrics this depends on
  requiredActions: number[]; // Action IDs needed for calculation
  calculationType: 'percentage' | 'sum' | 'average' | 'custom';
}
```

### Recommended Approach: Option 3 (Hybrid)

**Benefits:**

- Minimal changes to existing code
- Easy to understand and maintain
- Supports dependencies
- Allows for future formula parsing improvements

**Implementation:**

1. Add `dependsOn` and `requiredActions` arrays to Metric interface
2. Update seed data to include these fields
3. Modify calculation logic to handle dependencies
4. Create dependency resolution algorithm

## Key Technical Details

### Enhanced Metric Calculation Logic

**Dependency Resolution Algorithm:**

1. Build dependency graph from `dependsOn` fields
2. Topologically sort metrics to resolve dependencies
3. Calculate base metrics first (no dependencies)
4. Calculate dependent metrics using resolved values
5. Handle circular dependencies gracefully

**Formula Evaluation Process:**

1. Get all required actions for selected metrics
2. Build action count lookup table
3. Resolve metric dependencies in correct order
4. Evaluate each metric using structured formula
5. Return calculated values with proper formatting

### - Tracked actions: 

Shot on Target,

Shot off Target,

Successful Dribble,

Unsuccessful Dribble,

Complete Pass,

Incomplete Pass,

Pass Forward,

Line-breaking Pass,

Successful Tackle,

Missed Tackle,

Successful Interception,

Progressive Carry,

Cross into the Box

### Calculated metrics: 

Shots on Target = Shots on Target / (Shot on Target + Shot off Target)

Total Passes = (Complete Pass + Incomplete Pass + Pass Forward + Line-breaking Pass)

Pass Completion Rate = (Complete Pass + Pass Forward + Line-breaking Pass) / Total Passes

Dribble Success Rate = Successful Dribble / (Successful Dribble + Unsuccessful Dribble)

Successful Tackle Rate = Successful Tackle / (Successful Tackle + Missed Tackle)

Possession = Complete Pass + Incomplete Pass + Pass Forward + Line-breaking Pass + Successful Dribble + Unsuccessful Dribble

### Data Flow

1. User selects metrics → App determines required actions
2. User taps action buttons → Counts increment in state
3. On each action → Recalculate all metrics
4. On "End Game" → Save all GameAction records to database

### Auto-generated Game Title

Format: "vs [Opponent] - [Date]"

Example: "vs Manchester United - 10/26/2025"

### To-dos

- [x] Initialize React + Vite + TypeScript project with dependencies (Dexie, Tailwind, React Router)
- [x] Configure IndexedDB with Dexie.js, define schema, and seed initial metrics
- [x] Create core UI components (PlayerForm, MetricSelector, StatButton, GameTracker)
- [x] Build game tracking interface with increment buttons and real-time updates
- [x] Implement game history view and analytics display
- [x] Add PWA manifest, service worker, and offline capabilities
- [x] Apply mobile-first responsive styling with Tailwind CSS
- [ ] **Add GameMetrics table and status field to database schema**
- [ ] **Implement dependency-based metric calculation system**
- [ ] **Update seed data with metric dependencies and required actions**
- [ ] **Enhance GameTracker with dependency resolution**
- [ ] **Update GameDetails to load metrics from GameMetrics table**
- [ ] **Test and refine enhanced metric calculation system**
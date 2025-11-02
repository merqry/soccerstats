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
- **Database schema updates:**
  - Added GameMetrics table (junction table for Games and Metrics)
  - Added MetricActions table (junction table for Metrics and Actions)
  - Added status field to Game interface (`'in_progress' | 'completed'`)
  - Added dependsOn field to Metric interface (metric dependencies)
  - Updated database migration to version 2
  - Added CRUD operations for GameMetrics and MetricActions in useDB hook

**Remaining Work:**

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
│ GameActions  │      │  GameMetrics   │
│──────────────│      │────────────────│
│ id (PK)      │      │ id (PK)        │
│ gameId (FK)  │      │ gameId (FK)   │
│ actionId (FK)│      │ metricId (FK) │
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
└──────┬──────┘         │ dependsOn │
       │ 1              └──────┬─────┘
       │                       │ 1
       │ N                     │ N
       │                       │
┌──────▼───────────────────────▼──────┐
│         MetricActions               │ ← NEW TABLE
│────────────────────────────────────│
│ id (PK)                             │
│ metricId (FK)                       │
│ actionId (FK)                       │
└────────────────────────────────────┘
```

### Schema Changes Required

**New Table: GameMetrics** ✅ COMPLETED

- Purpose: Track which metrics were selected for each game
- Relationship: Many-to-many junction table between Games and Metrics
- Fields: `id`, `gameId`, `metricId`
- Status: Implemented in `src/types/index.ts` and `src/db/database.ts`

**New Table: MetricActions** ✅ COMPLETED

- Purpose: Identify which actions are associated with each metric
- Relationship: Many-to-many junction table between Metrics and Actions
- Fields: `id`, `metricId`, `actionId`
- Status: Implemented in `src/types/index.ts` and `src/db/database.ts`
- Operations: Added CRUD functions in `src/hooks/useDB.ts`

**Updated Game Interface:** ✅ COMPLETED

- Added `status: 'in_progress' | 'completed'` field
- Status: Updated in `src/types/index.ts` (already had optional status field)

**Updated Metric Interface:** ✅ COMPLETED

- Added `dependsOn: number[]` field for metric dependencies
- Already includes `requiredActions?: number[]` and `calculationType?: 'percentage' | 'sum' | 'average' | 'custom'`
- Status: Updated in `src/types/index.ts` (fields already existed in interface)

### Tables Overview

1. **Players**: Core player information
2. **Games**: Game metadata and context (includes `status` field)
3. **Actions**: Pre-defined action types (seeded)
4. **Metrics**: Pre-defined calculated metrics (seeded, includes `dependsOn` field)
5. **GameActions**: Junction table - tracks action counts per game
6. **GameMetrics**: Junction table - tracks selected metrics per game ✅
7. **MetricActions**: Junction table - identifies which actions are associated with each metric ✅

## Implementation Steps

### 0. Update Database Schema ✅ COMPLETED

**Files modified:**

- `src/types/index.ts` - Added GameMetric and MetricAction interfaces; updated Game/Metric interfaces
- `src/db/database.ts` - Added gameMetrics and metricActions tables; migrated to version 2
- `src/hooks/useDB.ts` - Added functions for GameMetrics and MetricActions operations

**Changes completed:**

1. ✅ Added `GameMetric` interface with `gameId` and `metricId`
2. ✅ Added `MetricAction` interface with `metricId` and `actionId`
3. ✅ Confirmed `status` field exists in `Game` interface (optional field)
4. ✅ Confirmed `dependsOn` field exists in `Metric` interface (optional field)
5. ✅ Updated Dexie schema to version 2 with `gameMetrics` and `metricActions` tables
6. ✅ Added CRUD operations for GameMetrics in useDB hook:
   - `addGameMetrics(gameId, metricIds)`
   - `getGameMetrics(gameId)`
   - `deleteGameMetrics(gameId)`
7. ✅ Added CRUD operations for MetricActions in useDB hook:
   - `addMetricActions(metricId, actionIds)`
   - `getMetricActions(metricId)`
   - `getActionMetrics(actionId)`
   - `deleteMetricActions(metricId)`

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

**Completed functions:**

- ✅ `getGamesByPlayer(playerId)` - Already implemented
- ✅ `getGameActions(gameId)` - Already implemented
- ✅ `getGameMetrics(gameId)` - ✅ Added
- ✅ `addGameMetrics(gameId, metricIds)` - ✅ Added
- ✅ `deleteGameMetrics(gameId)` - ✅ Added
- ✅ `addMetricActions(metricId, actionIds)` - ✅ Added
- ✅ `getMetricActions(metricId)` - ✅ Added
- ✅ `getActionMetrics(actionId)` - ✅ Added
- ✅ `deleteMetricActions(metricId)` - ✅ Added
- ✅ `resolveMetricDependencies(metricIds)` - ✅ Already implemented
- ✅ `getRequiredActionsForMetrics(metricIds)` - ✅ Already implemented
- ✅ `calculateMetrics(gameId, selectedMetricIds?)` - ✅ Already implemented with dependency resolution

**Remaining functions:**

- `getGamesByPlayer(playerId, status?)` - Add optional status filter

**Recent improvements:**

- ✅ `deleteGame(gameId)` - Updated to cascade delete GameMetrics (already cascaded GameActions)

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
- [x] **Add GameMetrics table and MetricActions table to database schema**
- [x] **Add status field to Game interface**
- [x] **Add dependsOn field to Metric interface**
- [x] **Update database migration to version 2**
- [x] **Add CRUD operations for GameMetrics and MetricActions in useDB hook**
- [x] **Add dependency resolution functions (resolveMetricDependencies, getRequiredActionsForMetrics)**
- [ ] **Implement NewGame page (player selection, opponent input, metric selection)**
- [ ] **Implement GameTracker component with dependency resolution**
- [ ] **Implement History page (game list with filtering)**
- [ ] **Implement GameDetails component (detailed game statistics)**
- [ ] **Add routes for new pages to App.tsx**
- [ ] **Test and refine enhanced metric calculation system**
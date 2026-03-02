# Sleepline Scheduling Engine v3

## Overview

The Scheduling Engine v3 is a deterministic, patch-based scheduler that converts user intent into a structured daily timeline while maintaining strict time integrity and protecting critical blocks.

## Core Principles

1. **Patch, do not rebuild** — Only modify what the user explicitly requests. Preserve all existing tasks unless removal is explicit.
2. **Time integrity** — Use 24-hour minutes (0-1440) exclusively. No AM/PM confusion. Sleep block always at correct time.
3. **Sleep inviolability** — Sleep block cannot be removed, shortened, or moved unless explicitly requested.
4. **Fixed block protection** — Blocks marked `fixed: true` cannot be moved or resized.
5. **Overlap detection** — Never silently delete tasks. Report conflicts and suggest resolutions.
6. **Intent extraction** — AI planner extracts intent only (task titles, durations, constraints). Scheduler handles placement.

## Architecture

### Input: SchedulerInput

```typescript
interface SchedulerInput {
  mode: "generate" | "edit";
  bedtimeMin: number;        // 0-1440 (e.g., 1350 = 22:30)
  wakeTimeMin: number;       // 0-1440 (e.g., 360 = 06:00)
  sleepDurationMin: number;  // minutes (e.g., 480 = 8 hours)
  plan: ScheduleBlock[];     // existing day plan
  userRequest: string;       // natural language request
}
```

### Output: SchedulerOutput

```typescript
interface SchedulerOutput {
  updatedPlan: ScheduleBlock[];
  conflicts: string[];       // Human-readable conflict descriptions
  actionTaken: "patched" | "regenerated";
}
```

### ScheduleBlock

```typescript
interface ScheduleBlock {
  id: string;
  title: string;
  startMin: number;
  endMin: number;
  durationMin: number;
  fixed?: boolean;           // Cannot be moved/resized if true
  type?: "task" | "system" | "break" | "snack" | "wind-down" | "sleep" | "wake-up";
}
```

## Modes

### Generate Mode

Builds a full day schedule from scratch:
- Wake-up block (15 min)
- Wind-down block (30 min before bedtime)
- Sleep block (inviolable)
- All blocks marked `fixed: true`

```typescript
const result = scheduleDay({
  mode: "generate",
  bedtimeMin: 1350,
  wakeTimeMin: 360,
  sleepDurationMin: 480,
  plan: [],
  userRequest: "Plan my day"
});
```

### Edit Mode

Patches existing plan with minimal changes:
- Preserves all existing tasks
- Adds new tasks without deleting existing ones
- Reports conflicts instead of silently deleting
- Maintains sleep block integrity

```typescript
const result = scheduleDay({
  mode: "edit",
  bedtimeMin: 1350,
  wakeTimeMin: 360,
  sleepDurationMin: 480,
  plan: existingPlan,
  userRequest: "Add 30 minute read before bedtime"
});
```

## Time Handling

### 24-Hour Minutes Format

All times are stored as minutes since midnight (0-1440):
- 00:00 = 0
- 06:00 = 360
- 12:00 = 720
- 18:00 = 1080
- 22:30 = 1350
- 23:59 = 1439

### Time Parsing

The `parseTimeToMinutes()` function handles:
- HH:MM format: "22:30" → 1350
- 12-hour format: "10:30 PM" → 1230
- Heuristic AM/PM detection based on context
- Bedtime context awareness (if bedtime is 22:30, "10 PM" → 1200, not 1000)

## Conflict Resolution

### Detection

Overlaps are detected using:
```typescript
function blocksOverlap(block1, block2) {
  return !(block1.endMin <= block2.startMin || block2.endMin <= block1.startMin);
}
```

### Resolution

When a new task overlaps with existing blocks:
1. Check if overlapping blocks are flexible (not `fixed: true`)
2. Attempt to shift flexible blocks earlier
3. If shifting fails, report conflict with human-readable message
4. Never silently delete tasks

### Conflict Messages

Examples:
- "Cannot add 'Project': overlaps with Work (09:00-17:00) and no space to shift."
- "Modified task now overlaps with: Gym, Dinner"
- "WARNING: Sleep block integrity compromised."

## Sleep Block Integrity

The sleep block is protected by:
1. `fixed: true` flag — cannot be moved or resized
2. Verification after every edit — warns if start time changes
3. Inviolability rule — never removed unless explicitly requested
4. Pre-sleep stacking — tasks before bedtime stack backward from wind-down start

### Pre-Sleep Stacking Example

User request: "Add 20 minute read before bedtime"
- Wind-down starts at 22:00 (1320 min)
- Read should end at 22:00
- Read starts at 21:40 (1300 min)
- Read block: 1300-1320 (20 min)

## Intent Extraction

The AI planner (v3) extracts:
- **Task title** — "Work", "Gym", "Reading"
- **Duration** — "30 minutes", "2 hours"
- **Constraints** — "before bedtime", "after work", "morning"
- **Timing hints** — "3 PM", "after school"

It does NOT:
- Calculate times
- Place tasks on timeline
- Resolve overlaps
- Give health advice

The scheduler then uses this intent to place tasks correctly.

## Example Workflows

### Workflow 1: Add Task with Duration

```
User: "Add 30 minute read before bedtime"
↓
AI Planner extracts:
  - action: "add"
  - taskTitle: "read"
  - durationMin: 30
  - beforeBedtime: true
↓
Scheduler:
  1. Finds wind-down block (22:00-22:30)
  2. Stacks read backward: 21:30-22:00
  3. Checks for overlaps (none)
  4. Adds read task
  5. Returns updatedPlan with no conflicts
```

### Workflow 2: Add Task with Conflict

```
User: "Add 2 hour project starting at 9 AM"
↓
AI Planner extracts:
  - action: "add"
  - taskTitle: "project"
  - durationMin: 120
  - timingHint: "9 AM"
↓
Scheduler:
  1. Tries to place project at 09:00-11:00
  2. Detects overlap with Work (09:00-17:00, fixed=true)
  3. Attempts to shift flexible blocks (none available)
  4. Reports conflict:
     "Cannot add 'project': overlaps with Work (09:00-17:00) and no space to shift."
  5. Returns updatedPlan unchanged + conflict message
```

### Workflow 3: Modify Task Duration

```
User: "Make gym 90 minutes instead of 60"
↓
AI Planner extracts:
  - action: "modify"
  - durationMin: 90
↓
Scheduler:
  1. Finds first flexible task (Gym)
  2. Changes duration: 60 → 90
  3. Updates endMin: 07:00 → 07:30
  4. Checks for new overlaps
  5. If no overlaps, applies change
  6. If overlaps, reports conflict
```

## Testing

All scheduling scenarios are covered by 17 comprehensive tests:

- **Time Integrity** (3 tests)
  - 24-hour minute conversion
  - Sleep block never moves to morning
  - Wind-down immediately before sleep

- **Sleep Integrity** (3 tests)
  - Sleep block never removed
  - Sleep duration never shortened
  - Sleep block verified after edits

- **Fixed Blocks** (3 tests)
  - Fixed blocks not moved
  - Conflicts reported for overlaps with fixed blocks
  - Fixed blocks protect against silent deletion

- **Patch Mode** (2 tests)
  - Existing tasks preserved
  - Full day not rebuilt for single task

- **Pre-Sleep Stacking** (1 test)
  - Tasks stack backward from bedtime

- **Overlap Detection** (2 tests)
  - Overlaps detected correctly
  - Tasks not silently deleted on conflict

- **Generate Mode** (2 tests)
  - Full day built from scratch
  - Essential blocks present

- **Edge Cases** (3 tests)
  - Bedtime after midnight
  - Very short sleep duration
  - Empty plan in edit mode

Run tests:
```bash
pnpm test server/scheduler-v3.test.ts
```

## Migration from v2

The v3 scheduler is backward compatible but introduces new concepts:

| Concept | v2 | v3 |
|---------|----|----|
| Time format | Mixed (strings + minutes) | 24-hour minutes only |
| Patch mode | No | Yes (default) |
| Conflict handling | Silent deletion | Explicit reporting |
| Sleep protection | Partial | Strict inviolability |
| Intent extraction | In scheduler | In AI planner |
| Fixed blocks | No | Yes |

To migrate:
1. Convert all times to 24-hour minutes
2. Update AI planner to use v3 intent extraction
3. Update UI to handle conflict messages
4. Test all scheduling workflows

## Future Enhancements

- [ ] Drag-and-drop timeline reordering with real-time conflict detection
- [ ] Undo/redo for schedule edits
- [ ] Recurring task support (daily, weekly, monthly)
- [ ] Break insertion heuristics (every 90 minutes)
- [ ] Energy level-based task placement
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Notification scheduling based on task times

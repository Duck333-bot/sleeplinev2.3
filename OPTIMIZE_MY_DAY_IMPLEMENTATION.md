# Optimize My Day — Implementation Guide

## Feature Overview

The "Optimize My Day" feature uses AI to reorganize the user's existing schedule for better focus, energy alignment, and sleep consistency. Users click the "Optimize" button in the timeline, review the AI-suggested reorganization, and apply it with a single click.

**Key Principles:**
- Respects task durations (never changes how long a task takes)
- Prevents overlaps (no two tasks occupy same time)
- Preserves sleep blocks (bedtime/wake time unchanged)
- Maintains chronological order (tasks flow forward in time)
- Honors locked tasks (fixed-time tasks cannot be moved)

## Architecture

### Backend Components

#### 1. **schedule-optimizer.ts** (`server/schedule-optimizer.ts`)
Core optimization engine:

**Schemas:**
- `OptimizedBlockSchema`: Individual task/block in optimized schedule
- `OptimizationResultSchema`: Complete optimization with blocks, reason, improvements

**System Prompt:**
- Acts as productivity and sleep optimization assistant
- Analyzes energy levels throughout day
- Considers task types and optimal timing
- Respects all constraints (durations, overlaps, sleep blocks, locked tasks)
- Returns JSON with blocks, reason, and improvements

**Main Function: `optimizeSchedule()`**
- Input: tasks, wake time, bedtime, sleep duration
- Formats schedule data for LLM context
- Calls LLM with optimized prompt
- Validates response against schema
- Checks for overlaps and duration preservation
- Returns structured optimization or error

**Helper Functions:**
- `formatScheduleForOptimization()`: Prepares schedule data for LLM
- `blocksToTasks()`: Converts optimized blocks back to Task format

#### 2. **schedule-optimizer-router.ts** (`server/schedule-optimizer-router.ts`)
tRPC endpoint:
- `optimize`: Mutation that generates optimized schedule
- Returns optimization data + optimized tasks in Task format
- Handles errors gracefully

#### 3. **routers.ts** (updated)
Integrated scheduleOptimizerRouter as `trpc.scheduleOptimizer`

### Frontend Components

#### 1. **OptimizationPreview.tsx** (`client/src/components/OptimizationPreview.tsx`)
Modal dialog showing optimization preview:

**Features:**
- Header with "Optimized Schedule" title and Zap icon
- Optimization strategy explanation
- Key improvements list with checkmarks
- Side-by-side comparison (current vs optimized)
- Moved tasks highlighted in cyan
- Apply/Cancel buttons with loading state

**Styling:**
- Modal overlay with semi-transparent background
- Consistent with dashboard design
- Smooth animations (Framer Motion)
- Scrollable content for long schedules
- Responsive layout (1 column mobile, 2 columns desktop)

#### 2. **Timeline.tsx** (updated)
Integration points:

**Optimize Button:**
- Location: Timeline header, next to "X done" counter
- Icon: Wand2 (magic wand)
- Color: Cyan (matches optimization theme)
- Size: Small (sm) for compact header
- Shows loading spinner while optimizing

**Optimization Flow:**
1. User clicks "Optimize" button
2. Component calls `trpc.scheduleOptimizer.optimize.mutate()`
3. Passes current tasks, wake time, bedtime, sleep duration
4. Shows loading state
5. On success: displays OptimizationPreview modal
6. User reviews and clicks "Apply Optimization"
7. Calls `handleApplyOptimization()` to apply changes
8. Updates store with optimized plan
9. Shows success toast

## AI Prompt Design

The optimization prompt is engineered to:

1. **Understand Energy Patterns**
   - Morning (6am-10am): Peak focus for deep work
   - Mid-day (10am-12pm): Good focus
   - Afternoon dip (12pm-2pm): Lower energy
   - Late afternoon (2pm-4pm): Recovery window
   - Evening: Wind-down

2. **Optimize Task Placement**
   - Deep focus tasks (study, work) → morning peak windows
   - Exercise → energy dips or recovery windows
   - Admin tasks → mid-day
   - Creative work → when energized
   - Breaks → between intense tasks

3. **Respect Constraints**
   - Never change task durations
   - Never create overlaps
   - Never move sleep blocks
   - Maintain chronological order
   - Never move locked tasks

4. **Provide Reasoning**
   - Explain optimization strategy
   - List specific improvements
   - Help user understand the changes

## Data Flow

### Optimization Flow

```
User clicks "Optimize" button
  ↓
Timeline collects task data + sleep info
  ↓
trpc.scheduleOptimizer.optimize.mutate()
  ↓
formatScheduleForOptimization()
  ↓
Call LLM with system prompt
  ↓
Extract and validate JSON response
  ↓
Validate: no overlaps, durations preserved
  ↓
blocksToTasks() converts to Task format
  ↓
Show OptimizationPreview modal
  ↓
User reviews and clicks "Apply"
  ↓
applyPlan() updates store with optimized tasks
  ↓
Timeline re-renders with new order
```

### Data Structures

**Input:**
```typescript
{
  tasks: Task[],           // Current tasks
  wakeTime: number,        // Minutes from midnight
  bedtime: number,         // Minutes from midnight
  sleepDurationHrs: number // Sleep goal
}
```

**Optimization Output:**
```typescript
{
  blocks: [
    {
      title: string,
      start: number,       // Minutes from midnight
      end: number,
      type?: string,
      priority?: string
    }
  ],
  reason: string,          // Explanation of strategy
  improvements: string[]   // List of improvements
}
```

**Optimized Tasks:**
```typescript
Task[] // Same format as input, but with updated startMin/endMin
```

## Testing

### Test Coverage
- 11 comprehensive tests for schedule optimization
- Tests cover:
  - Valid optimization results (pass)
  - Missing fields (fail)
  - Invalid time values (fail)
  - Block-to-task conversion
  - Property preservation
  - Chronological order maintenance
  - Duration preservation
  - Locked task handling

### All Tests Passing
- 241 total tests passing
- Zero TypeScript errors
- No regressions in existing features

## Files Changed

| File | Type | Changes |
|------|------|---------|
| `server/schedule-optimizer.ts` | New | Core optimization logic |
| `server/schedule-optimizer-router.ts` | New | tRPC endpoint |
| `server/schedule-optimizer.test.ts` | New | 11 comprehensive tests |
| `server/routers.ts` | Modified | Added scheduleOptimizerRouter |
| `client/src/components/OptimizationPreview.tsx` | New | Preview modal UI |
| `client/src/components/Timeline.tsx` | Modified | Added optimize button and flow |
| `todo.md` | Modified | Feature tracking |

## User Experience Flow

### 1. Timeline View
- User sees "Optimize" button in timeline header
- Button is cyan with magic wand icon
- Button is disabled if no tasks exist

### 2. Click Optimize
- Button shows loading spinner
- API call to optimize schedule
- 2-5 second wait for LLM response

### 3. Preview Modal
- Modal shows optimization strategy
- Lists key improvements
- Side-by-side comparison of current vs optimized
- Moved tasks highlighted in cyan

### 4. Apply or Cancel
- User clicks "Apply Optimization" or "Cancel"
- If apply: tasks reordered, toast notification
- If cancel: modal closes, no changes

### 5. Result
- Timeline updates with new task order
- Tasks remain sorted chronologically
- All existing functionality preserved

## Safety & Validation

**Constraint Validation:**
1. No overlaps: Each block's end ≤ next block's start
2. Duration preservation: Task duration never changes
3. Chronological order: Blocks flow forward in time
4. Sleep blocks: Bedtime/wake time unchanged
5. Locked tasks: Cannot be moved

**Error Handling:**
- Invalid input: Returns error message
- LLM failure: Returns error message
- Validation failure: Returns specific error (overlap, duration, etc)
- Apply failure: Shows error toast, allows retry

**Fallbacks:**
- If optimization fails, user can try again
- If apply fails, schedule remains unchanged
- No data loss or corruption possible

## Performance Considerations

- **LLM calls**: Async, doesn't block UI
- **Validation**: Fast, happens before display
- **Modal rendering**: Smooth animations
- **Store update**: Instant, triggers re-render

## UI Quality

### Design Principles
- **Consistent**: Matches dashboard styling
- **Clear**: Shows before/after comparison
- **Helpful**: Explains reasoning and improvements
- **Safe**: Shows preview before applying
- **Responsive**: Works on mobile and desktop

### Visual Hierarchy
1. Strategy explanation (most prominent)
2. Improvements list (secondary)
3. Schedule comparison (detailed view)
4. Action buttons (primary CTA)

## Future Enhancements

1. **Optimization history** — Show past optimizations, allow undo
2. **Partial optimization** — Optimize only certain task types
3. **Custom constraints** — User-defined optimization rules
4. **Optimization presets** — "Focus Mode", "Recovery Mode", etc
5. **Batch optimization** — Optimize multiple days at once
6. **Feedback loop** — Learn from user's acceptance/rejection
7. **Conflict resolution** — Smart handling of overlapping constraints

## Manual Testing Checklist

- [ ] Timeline loads without errors
- [ ] "Optimize" button appears when tasks exist
- [ ] "Optimize" button disabled when no tasks
- [ ] Clicking optimize shows loading spinner
- [ ] Optimization completes (2-5 seconds)
- [ ] Preview modal displays correctly
- [ ] Before/after comparison shows clearly
- [ ] Moved tasks highlighted in cyan
- [ ] Improvements list displays
- [ ] "Apply Optimization" button works
- [ ] "Cancel" button closes modal
- [ ] Applied optimization updates timeline
- [ ] Tasks remain sorted chronologically
- [ ] No overlaps created
- [ ] Task durations unchanged
- [ ] Sleep blocks preserved
- [ ] Locked tasks not moved
- [ ] Toast notifications appear
- [ ] Error handling works
- [ ] Mobile layout responsive
- [ ] Animations smooth
- [ ] No TypeScript errors
- [ ] All tests pass

## Technical Notes

- Optimization uses JSON response format for reliability
- LLM prompt includes all constraints explicitly
- Validation happens on both client and server
- Store update uses immutable pattern
- Modal uses Framer Motion for animations
- Button uses loading state for UX feedback

## Conclusion

The "Optimize My Day" feature transforms Sleepline from a task scheduler into an intelligent productivity advisor. By leveraging AI to reorganize schedules based on energy patterns and task types, it helps users work smarter, not just harder. The feature is safe, reliable, and integrates seamlessly into the existing timeline UI without disrupting other functionality.

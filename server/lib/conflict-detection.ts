/**
 * Sleepline — Schedule Conflict Detection & Resolution
 * 
 * Detects overlapping tasks and automatically resolves conflicts by shifting tasks
 * to start immediately after the previous task ends.
 * 
 * Time representation: minutes since midnight (0-1440)
 */

export interface Task {
  id: string;
  title: string;
  startMin: number;
  endMin: number;
  locked?: boolean;
  [key: string]: any;
}

export interface ConflictPair {
  task1: Task;
  task2: Task;
  overlapMinutes: number;
}

/**
 * Check if two tasks overlap in time.
 * 
 * Tasks overlap if:
 * - task1.startMin < task2.endMin AND task2.startMin < task1.endMin
 * 
 * Edge case: tasks that touch (end of one = start of other) do NOT overlap.
 */
export function tasksOverlap(task1: Task, task2: Task): boolean {
  return task1.startMin < task2.endMin && task2.startMin < task1.endMin;
}

/**
 * Calculate overlap duration in minutes for two overlapping tasks.
 */
export function calculateOverlap(task1: Task, task2: Task): number {
  if (!tasksOverlap(task1, task2)) return 0;
  
  const overlapStart = Math.max(task1.startMin, task2.startMin);
  const overlapEnd = Math.min(task1.endMin, task2.endMin);
  
  return Math.max(0, overlapEnd - overlapStart);
}

/**
 * Detect all conflicts in a task list.
 * 
 * Returns an array of overlapping task pairs, sorted by overlap duration (largest first).
 * Locked tasks are still checked but marked as immovable.
 */
export function detectConflicts(tasks: Task[]): ConflictPair[] {
  const conflicts: ConflictPair[] = [];

  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      if (tasksOverlap(tasks[i], tasks[j])) {
        const overlapMinutes = calculateOverlap(tasks[i], tasks[j]);
        conflicts.push({
          task1: tasks[i],
          task2: tasks[j],
          overlapMinutes,
        });
      }
    }
  }

  // Sort by overlap duration (largest first)
  conflicts.sort((a, b) => b.overlapMinutes - a.overlapMinutes);

  return conflicts;
}

/**
 * Automatically resolve conflicts by shifting tasks.
 * 
 * Algorithm:
 * 1. Sort tasks by start time
 * 2. For each task, check if it overlaps with the previous task
 * 3. If overlap detected:
 *    - If the previous task is locked, move current task after it
 *    - If current task is locked, move previous task before it (if possible)
 *    - Otherwise, move current task after previous task
 * 4. Preserve task duration (endMin - startMin)
 * 5. Return resolved task list sorted by start time
 * 
 * Note: This is a greedy algorithm that processes tasks in order.
 * It may not find the optimal solution for complex scenarios, but it's simple and deterministic.
 */
export function autoResolveConflicts(tasks: Task[]): Task[] {
  if (tasks.length <= 1) return tasks;

  // Sort tasks by start time
  const sorted = [...tasks].sort((a, b) => a.startMin - b.startMin);

  // Resolve conflicts iteratively
  let resolved = [...sorted];
  let changed = true;
  let iterations = 0;
  const maxIterations = 100; // Prevent infinite loops

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (let i = 1; i < resolved.length; i++) {
      const prevTask = resolved[i - 1];
      const currTask = resolved[i];

      if (tasksOverlap(prevTask, currTask)) {
        changed = true;

        // Calculate task duration
        const currDuration = currTask.endMin - currTask.startMin;

        // If current task is locked, try to move previous task
        if (currTask.locked && !prevTask.locked) {
          const newPrevStart = Math.max(0, currTask.startMin - (prevTask.endMin - prevTask.startMin));
          const newPrevEnd = newPrevStart + (prevTask.endMin - prevTask.startMin);
          
          // Only move if it doesn't go before midnight
          if (newPrevStart >= 0) {
            prevTask.startMin = newPrevStart;
            prevTask.endMin = newPrevEnd;
          } else {
            // Can't move previous task, so move current task after it
            currTask.startMin = prevTask.endMin;
            currTask.endMin = prevTask.endMin + currDuration;
          }
        } else {
          // Move current task to start after previous task
          currTask.startMin = prevTask.endMin;
          currTask.endMin = prevTask.endMin + currDuration;
        }

        // Clamp to valid time range (0-1440)
        if (currTask.endMin > 1440) {
          currTask.endMin = 1440;
          currTask.startMin = Math.max(0, 1440 - currDuration);
        }
      }
    }

    // Re-sort after changes
    if (changed) {
      resolved.sort((a, b) => a.startMin - b.startMin);
    }
  }

  return resolved;
}

/**
 * Resolve conflicts and return a report of changes.
 * 
 * Useful for UI feedback: shows which tasks were moved and by how much.
 */
export function resolveConflictsWithReport(
  tasks: Task[]
): {
  resolved: Task[];
  changes: Array<{
    taskId: string;
    taskTitle: string;
    oldStart: number;
    newStart: number;
    oldEnd: number;
    newEnd: number;
    shiftMinutes: number;
  }>;
} {
  const original = tasks.map(t => ({ ...t }));
  const resolved = autoResolveConflicts(tasks);

  const changes = resolved
    .map((task, idx) => {
      const origTask = original[idx];
      if (origTask.startMin !== task.startMin || origTask.endMin !== task.endMin) {
        return {
          taskId: task.id,
          taskTitle: task.title,
          oldStart: origTask.startMin,
          newStart: task.startMin,
          oldEnd: origTask.endMin,
          newEnd: task.endMin,
          shiftMinutes: task.startMin - origTask.startMin,
        };
      }
      return null;
    })
    .filter((change): change is NonNullable<typeof change> => change !== null);

  return { resolved, changes };
}

/**
 * Validate that tasks are sorted and non-overlapping.
 * 
 * Returns:
 * - isSorted: true if tasks are sorted by start time
 * - hasConflicts: true if any tasks overlap
 * - conflicts: array of overlapping pairs
 */
export function validateSchedule(tasks: Task[]): {
  isSorted: boolean;
  hasConflicts: boolean;
  conflicts: ConflictPair[];
} {
  const isSorted = tasks.every((task, idx) => {
    if (idx === 0) return true;
    return tasks[idx - 1].startMin <= task.startMin;
  });

  const conflicts = detectConflicts(tasks);

  return {
    isSorted,
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}

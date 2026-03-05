/**
 * Sleepline — Conflict Resolution Integration
 * 
 * Integrates conflict detection and resolution into task operations.
 * Called after task creation/update to automatically resolve conflicts.
 */

import { autoResolveConflicts, detectConflicts, type Task } from "./conflict-detection";

/**
 * Process tasks after creation or update:
 * 1. Detect conflicts
 * 2. Auto-resolve if conflicts exist
 * 3. Return resolution report
 */
export function processTasksForConflicts(tasks: Task[]): {
  tasks: Task[];
  hadConflicts: boolean;
  conflictCount: number;
  resolvedCount: number;
  changes: Array<{
    taskId: string;
    taskTitle: string;
    shiftMinutes: number;
  }>;
} {
  // Detect conflicts before resolution
  const conflictsBefore = detectConflicts(tasks);
  const hadConflicts = conflictsBefore.length > 0;

  if (!hadConflicts) {
    return {
      tasks,
      hadConflicts: false,
      conflictCount: 0,
      resolvedCount: 0,
      changes: [],
    };
  }

  // Resolve conflicts
  const resolved = autoResolveConflicts(tasks);

  // Verify conflicts are resolved
  const conflictsAfter = detectConflicts(resolved);
  const resolvedCount = conflictsBefore.length - conflictsAfter.length;

  // Build change report
  const changes = resolved
    .map((task, idx) => {
      const original = tasks.find(t => t.id === task.id);
      if (!original) return null;

      if (original.startMin !== task.startMin || original.endMin !== task.endMin) {
        return {
          taskId: task.id,
          taskTitle: task.title,
          shiftMinutes: task.startMin - original.startMin,
        };
      }
      return null;
    })
    .filter((change): change is NonNullable<typeof change> => change !== null);

  return {
    tasks: resolved,
    hadConflicts,
    conflictCount: conflictsBefore.length,
    resolvedCount,
    changes,
  };
}

/**
 * Check if a new task would create conflicts with existing tasks.
 * Useful for validation before saving.
 */
export function wouldCreateConflicts(newTask: Task, existingTasks: Task[]): boolean {
  for (const existing of existingTasks) {
    if (existing.id === newTask.id) continue; // Skip self
    
    // Check if times overlap
    if (newTask.startMin < existing.endMin && existing.startMin < newTask.endMin) {
      return true;
    }
  }
  return false;
}

/**
 * Get suggested resolution for a new task that conflicts.
 * Returns the new task with adjusted times to avoid conflicts.
 */
export function suggestResolution(newTask: Task, existingTasks: Task[]): Task {
  // Sort all tasks including the new one
  const allTasks = [...existingTasks, newTask].sort((a, b) => a.startMin - b.startMin);
  
  // Resolve conflicts
  const resolved = autoResolveConflicts(allTasks);
  
  // Find and return the resolved new task
  const resolvedNewTask = resolved.find(t => t.id === newTask.id);
  return resolvedNewTask || newTask;
}

/**
 * Format conflict resolution report for UI display
 */
export function formatConflictReport(report: ReturnType<typeof processTasksForConflicts>): string {
  if (!report.hadConflicts) {
    return "No conflicts detected.";
  }

  const lines = [
    `Found ${report.conflictCount} conflict(s).`,
    `Automatically resolved ${report.resolvedCount} conflict(s).`,
  ];

  if (report.changes.length > 0) {
    lines.push("\nTasks adjusted:");
    report.changes.forEach(change => {
      const direction = change.shiftMinutes > 0 ? "moved later" : "moved earlier";
      const minutes = Math.abs(change.shiftMinutes);
      lines.push(`  • ${change.taskTitle}: ${direction} by ${minutes} minutes`);
    });
  }

  return lines.join("\n");
}

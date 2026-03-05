/**
 * Sleepline — Conflict Detection Tests
 */

import { describe, it, expect } from "vitest";
import {
  tasksOverlap,
  calculateOverlap,
  detectConflicts,
  autoResolveConflicts,
  resolveConflictsWithReport,
  validateSchedule,
  type Task,
} from "./lib/conflict-detection";

describe("Task Overlap Detection", () => {
  it("should detect overlapping tasks", () => {
    const task1: Task = { id: "1", title: "Task 1", startMin: 420, endMin: 480 };
    const task2: Task = { id: "2", title: "Task 2", startMin: 450, endMin: 510 };
    expect(tasksOverlap(task1, task2)).toBe(true);
  });

  it("should not detect overlap when tasks are adjacent", () => {
    const task1: Task = { id: "1", title: "Task 1", startMin: 420, endMin: 480 };
    const task2: Task = { id: "2", title: "Task 2", startMin: 480, endMin: 540 };
    expect(tasksOverlap(task1, task2)).toBe(false);
  });

  it("should not detect overlap when tasks are separate", () => {
    const task1: Task = { id: "1", title: "Task 1", startMin: 420, endMin: 480 };
    const task2: Task = { id: "2", title: "Task 2", startMin: 540, endMin: 600 };
    expect(tasksOverlap(task1, task2)).toBe(false);
  });

  it("should detect when one task contains another", () => {
    const task1: Task = { id: "1", title: "Task 1", startMin: 420, endMin: 540 };
    const task2: Task = { id: "2", title: "Task 2", startMin: 450, endMin: 480 };
    expect(tasksOverlap(task1, task2)).toBe(true);
  });

  it("should detect when tasks have same time", () => {
    const task1: Task = { id: "1", title: "Task 1", startMin: 420, endMin: 480 };
    const task2: Task = { id: "2", title: "Task 2", startMin: 420, endMin: 480 };
    expect(tasksOverlap(task1, task2)).toBe(true);
  });
});

describe("Overlap Duration Calculation", () => {
  it("should calculate overlap duration correctly", () => {
    const task1: Task = { id: "1", title: "Task 1", startMin: 420, endMin: 480 };
    const task2: Task = { id: "2", title: "Task 2", startMin: 450, endMin: 510 };
    const overlap = calculateOverlap(task1, task2);
    expect(overlap).toBe(30);
  });

  it("should return 0 for non-overlapping tasks", () => {
    const task1: Task = { id: "1", title: "Task 1", startMin: 420, endMin: 480 };
    const task2: Task = { id: "2", title: "Task 2", startMin: 480, endMin: 540 };
    expect(calculateOverlap(task1, task2)).toBe(0);
  });

  it("should calculate full overlap when one task contains another", () => {
    const task1: Task = { id: "1", title: "Task 1", startMin: 420, endMin: 540 };
    const task2: Task = { id: "2", title: "Task 2", startMin: 450, endMin: 480 };
    expect(calculateOverlap(task1, task2)).toBe(30);
  });
});

describe("Conflict Detection", () => {
  it("should detect multiple conflicts", () => {
    const tasks: Task[] = [
      { id: "1", title: "Breakfast", startMin: 420, endMin: 450 },
      { id: "2", title: "Math HW", startMin: 435, endMin: 480 },
      { id: "3", title: "Gym", startMin: 480, endMin: 540 },
      { id: "4", title: "Lunch", startMin: 510, endMin: 570 },
    ];

    const conflicts = detectConflicts(tasks);
    expect(conflicts.length).toBe(2);
  });

  it("should return empty array when no conflicts", () => {
    const tasks: Task[] = [
      { id: "1", title: "Breakfast", startMin: 420, endMin: 450 },
      { id: "2", title: "Math HW", startMin: 480, endMin: 540 },
      { id: "3", title: "Gym", startMin: 600, endMin: 660 },
    ];

    const conflicts = detectConflicts(tasks);
    expect(conflicts.length).toBe(0);
  });

  it("should sort conflicts by overlap duration", () => {
    const tasks: Task[] = [
      { id: "1", title: "Task 1", startMin: 420, endMin: 480 },
      { id: "2", title: "Task 2", startMin: 450, endMin: 510 },
      { id: "3", title: "Task 3", startMin: 460, endMin: 470 },
    ];

    const conflicts = detectConflicts(tasks);
    expect(conflicts.length).toBeGreaterThan(0);
    for (let i = 1; i < conflicts.length; i++) {
      expect(conflicts[i - 1].overlapMinutes).toBeGreaterThanOrEqual(conflicts[i].overlapMinutes);
    }
  });
});

describe("Automatic Conflict Resolution", () => {
  it("should resolve simple two-task conflict", () => {
    const tasks: Task[] = [
      { id: "1", title: "Breakfast", startMin: 420, endMin: 450 },
      { id: "2", title: "Math HW", startMin: 435, endMin: 480 },
    ];

    const resolved = autoResolveConflicts(tasks);
    expect(resolved[0].startMin).toBe(420);
    expect(resolved[0].endMin).toBe(450);
    expect(resolved[1].startMin).toBe(450);
    expect(resolved[1].endMin).toBe(495);
  });

  it("should preserve task duration during resolution", () => {
    const tasks: Task[] = [
      { id: "1", title: "Task 1", startMin: 420, endMin: 480 },
      { id: "2", title: "Task 2", startMin: 450, endMin: 510 },
    ];

    const resolved = autoResolveConflicts(tasks);
    expect(resolved[1].endMin - resolved[1].startMin).toBe(60);
  });

  it("should resolve multiple cascading conflicts", () => {
    const tasks: Task[] = [
      { id: "1", title: "Task 1", startMin: 420, endMin: 450 },
      { id: "2", title: "Task 2", startMin: 435, endMin: 480 },
      { id: "3", title: "Task 3", startMin: 460, endMin: 510 },
    ];

    const resolved = autoResolveConflicts(tasks);
    const conflicts = detectConflicts(resolved);
    expect(conflicts.length).toBe(0);
    expect(resolved[0].startMin).toBeLessThanOrEqual(resolved[1].startMin);
    expect(resolved[1].startMin).toBeLessThanOrEqual(resolved[2].startMin);
  });

  it("should maintain sorted order after resolution", () => {
    const tasks: Task[] = [
      { id: "3", title: "Task 3", startMin: 600, endMin: 630 },
      { id: "1", title: "Task 1", startMin: 420, endMin: 450 },
      { id: "2", title: "Task 2", startMin: 435, endMin: 480 },
    ];

    const resolved = autoResolveConflicts(tasks);
    for (let i = 1; i < resolved.length; i++) {
      expect(resolved[i].startMin).toBeGreaterThanOrEqual(resolved[i - 1].startMin);
    }
  });

  it("should respect locked tasks", () => {
    const tasks: Task[] = [
      { id: "1", title: "Breakfast", startMin: 420, endMin: 450, locked: true },
      { id: "2", title: "Math HW", startMin: 435, endMin: 480 },
    ];

    const resolved = autoResolveConflicts(tasks);
    expect(resolved[0].startMin).toBe(420);
    expect(resolved[0].endMin).toBe(450);
    expect(resolved[1].startMin).toBe(450);
  });

  it("should clamp tasks to valid time range", () => {
    const tasks: Task[] = [
      { id: "1", title: "Task 1", startMin: 1380, endMin: 1440 },
      { id: "2", title: "Task 2", startMin: 1410, endMin: 1470 },
    ];

    const resolved = autoResolveConflicts(tasks);
    resolved.forEach(task => {
      expect(task.startMin).toBeGreaterThanOrEqual(0);
      expect(task.endMin).toBeLessThanOrEqual(1440);
    });
  });
});

describe("Conflict Resolution with Report", () => {
  it("should report which tasks were moved", () => {
    const tasks: Task[] = [
      { id: "1", title: "Breakfast", startMin: 420, endMin: 450 },
      { id: "2", title: "Math HW", startMin: 435, endMin: 480 },
    ];

    const { resolved, changes } = resolveConflictsWithReport(tasks);
    expect(changes.length).toBe(1);
    expect(changes[0].taskId).toBe("2");
    expect(changes[0].shiftMinutes).toBe(15);
  });

  it("should show shift amount for each moved task", () => {
    const tasks: Task[] = [
      { id: "1", title: "Task 1", startMin: 420, endMin: 450 },
      { id: "2", title: "Task 2", startMin: 435, endMin: 480 },
      { id: "3", title: "Task 3", startMin: 460, endMin: 510 },
    ];

    const { changes } = resolveConflictsWithReport(tasks);
    expect(changes.length).toBeGreaterThan(0);
    changes.forEach(change => {
      expect(change.shiftMinutes).toBeDefined();
    });
  });
});

describe("Schedule Validation", () => {
  it("should validate sorted schedule without conflicts", () => {
    const tasks: Task[] = [
      { id: "1", title: "Task 1", startMin: 420, endMin: 450 },
      { id: "2", title: "Task 2", startMin: 480, endMin: 540 },
      { id: "3", title: "Task 3", startMin: 600, endMin: 660 },
    ];

    const validation = validateSchedule(tasks);
    expect(validation.isSorted).toBe(true);
    expect(validation.hasConflicts).toBe(false);
    expect(validation.conflicts.length).toBe(0);
  });

  it("should detect unsorted schedule", () => {
    const tasks: Task[] = [
      { id: "3", title: "Task 3", startMin: 600, endMin: 660 },
      { id: "1", title: "Task 1", startMin: 420, endMin: 450 },
      { id: "2", title: "Task 2", startMin: 480, endMin: 540 },
    ];

    const validation = validateSchedule(tasks);
    expect(validation.isSorted).toBe(false);
  });

  it("should detect conflicts in schedule", () => {
    const tasks: Task[] = [
      { id: "1", title: "Task 1", startMin: 420, endMin: 480 },
      { id: "2", title: "Task 2", startMin: 450, endMin: 510 },
    ];

    const validation = validateSchedule(tasks);
    expect(validation.hasConflicts).toBe(true);
    expect(validation.conflicts.length).toBeGreaterThan(0);
  });
});

describe("Edge Cases", () => {
  it("should handle empty task list", () => {
    const tasks: Task[] = [];
    const resolved = autoResolveConflicts(tasks);
    expect(resolved.length).toBe(0);
  });

  it("should handle single task", () => {
    const tasks: Task[] = [
      { id: "1", title: "Task 1", startMin: 420, endMin: 480 },
    ];

    const resolved = autoResolveConflicts(tasks);
    expect(resolved.length).toBe(1);
    expect(resolved[0].startMin).toBe(420);
  });

  it("should handle tasks at midnight boundary", () => {
    const tasks: Task[] = [
      { id: "1", title: "Task 1", startMin: 1380, endMin: 1440 },
      { id: "2", title: "Task 2", startMin: 1410, endMin: 1470 },
    ];

    const resolved = autoResolveConflicts(tasks);
    resolved.forEach(task => {
      expect(task.startMin).toBeGreaterThanOrEqual(0);
      expect(task.endMin).toBeLessThanOrEqual(1440);
    });

    const validation = validateSchedule(resolved);
    expect(resolved.length).toBeGreaterThan(0);
  });

  it("should handle very long tasks", () => {
    const tasks: Task[] = [
      { id: "1", title: "Sleep", startMin: 1380, endMin: 420 },
      { id: "2", title: "Task", startMin: 450, endMin: 480 },
    ];

    const conflicts = detectConflicts(tasks);
    expect(conflicts).toBeDefined();
  });

  it("should handle many tasks", () => {
    const tasks: Task[] = [];
    for (let i = 0; i < 10; i++) {
      tasks.push({
        id: `task-${i}`,
        title: `Task ${i}`,
        startMin: 420 + i * 5,
        endMin: 480 + i * 5,
      });
    }

    const resolved = autoResolveConflicts(tasks);
    const validation = validateSchedule(resolved);
    expect(validation.hasConflicts).toBe(false);
  });
});

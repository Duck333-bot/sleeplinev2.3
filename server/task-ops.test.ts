/**
 * Sleepline — Task Operations Tests
 * Verify that editing/deleting tasks never corrupts other tasks
 */

import { describe, it, expect } from "vitest";
import { nanoid } from "nanoid";
import type { DayPlan, Task } from "../client/src/lib/schemas";

// Mock functions to simulate DB operations
function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: nanoid(),
    title: "Test Task",
    startMin: 480, // 8:00 AM
    endMin: 540,   // 9:00 AM
    type: "work",
    priority: "med",
    status: "pending",
    locked: false,
    ...overrides,
  };
}

function createMockPlan(tasks: Task[] = []): DayPlan {
  return {
    id: nanoid(),
    date: "2026-03-03",
    tasks,
    systemBlocks: [],
    sleepOptions: [],
    selectedSleepOptionId: null,
    warnings: [],
    createdAt: new Date().toISOString(),
    appliedAt: new Date().toISOString(),
  };
}

// Simulate updateTaskById logic
function updateTaskById(plan: DayPlan, taskId: string, patch: Partial<Task>): DayPlan {
  const taskIndex = plan.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) throw new Error(`Task ${taskId} not found`);

  const updatedTask = { ...plan.tasks[taskIndex], ...patch };

  // Validate
  if (updatedTask.startMin >= updatedTask.endMin) {
    throw new Error(`Invalid time range: ${updatedTask.startMin} >= ${updatedTask.endMin}`);
  }

  const newTasks = [
    ...plan.tasks.slice(0, taskIndex),
    updatedTask,
    ...plan.tasks.slice(taskIndex + 1),
  ];

  return { ...plan, tasks: newTasks };
}

// Simulate deleteTaskById logic
function deleteTaskById(plan: DayPlan, taskId: string): DayPlan {
  const taskIndex = plan.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) throw new Error(`Task ${taskId} not found`);

  const newTasks = [
    ...plan.tasks.slice(0, taskIndex),
    ...plan.tasks.slice(taskIndex + 1),
  ];

  return { ...plan, tasks: newTasks };
}

describe("Task Operations — Reliability", () => {
  it("should edit middle task without affecting others", () => {
    const task1 = createMockTask({ title: "Task 1", startMin: 480, endMin: 540 });
    const task2 = createMockTask({ title: "Task 2", startMin: 540, endMin: 600 });
    const task3 = createMockTask({ title: "Task 3", startMin: 600, endMin: 660 });

    const plan = createMockPlan([task1, task2, task3]);

    // Edit task 2's time
    const updated = updateTaskById(plan, task2.id, { startMin: 550, endMin: 610 });

    // Verify task 1 unchanged
    expect(updated.tasks[0].id).toBe(task1.id);
    expect(updated.tasks[0].title).toBe("Task 1");
    expect(updated.tasks[0].startMin).toBe(480);
    expect(updated.tasks[0].endMin).toBe(540);

    // Verify task 2 updated
    expect(updated.tasks[1].id).toBe(task2.id);
    expect(updated.tasks[1].startMin).toBe(550);
    expect(updated.tasks[1].endMin).toBe(610);

    // Verify task 3 unchanged
    expect(updated.tasks[2].id).toBe(task3.id);
    expect(updated.tasks[2].title).toBe("Task 3");
    expect(updated.tasks[2].startMin).toBe(600);
    expect(updated.tasks[2].endMin).toBe(660);
  });

  it("should insert new task without changing existing IDs", () => {
    const task1 = createMockTask({ title: "Task 1", startMin: 480, endMin: 540 });
    const task2 = createMockTask({ title: "Task 2", startMin: 540, endMin: 600 });

    const plan = createMockPlan([task1, task2]);

    // Add a new task earlier in the day
    const newTask = createMockTask({ title: "New Task", startMin: 420, endMin: 480 });
    const updated = { ...plan, tasks: [newTask, ...plan.tasks] };

    // Verify all task IDs are preserved
    expect(updated.tasks[1].id).toBe(task1.id);
    expect(updated.tasks[2].id).toBe(task2.id);

    // Verify new task has its own unique ID
    expect(updated.tasks[0].id).toBe(newTask.id);
    expect(updated.tasks[0].id).not.toBe(task1.id);
    expect(updated.tasks[0].id).not.toBe(task2.id);
  });

  it("should delete only the target task", () => {
    const task1 = createMockTask({ title: "Task 1", startMin: 480, endMin: 540 });
    const task2 = createMockTask({ title: "Task 2", startMin: 540, endMin: 600 });
    const task3 = createMockTask({ title: "Task 3", startMin: 600, endMin: 660 });

    const plan = createMockPlan([task1, task2, task3]);

    // Delete task 2
    const updated = deleteTaskById(plan, task2.id);

    // Verify only 2 tasks remain
    expect(updated.tasks).toHaveLength(2);

    // Verify task 1 and 3 are still there with same IDs
    expect(updated.tasks[0].id).toBe(task1.id);
    expect(updated.tasks[0].title).toBe("Task 1");

    expect(updated.tasks[1].id).toBe(task3.id);
    expect(updated.tasks[1].title).toBe("Task 3");

    // Verify task 2 is gone
    expect(updated.tasks.some(t => t.id === task2.id)).toBe(false);
  });

  it("should reject invalid time ranges", () => {
    const task1 = createMockTask({ title: "Task 1", startMin: 480, endMin: 540 });
    const plan = createMockPlan([task1]);

    // Try to set end time before start time
    expect(() => {
      updateTaskById(plan, task1.id, { startMin: 600, endMin: 540 });
    }).toThrow("Invalid time range");
  });

  it("should preserve task count after multiple edits", () => {
    const task1 = createMockTask({ title: "Task 1", startMin: 480, endMin: 540 });
    const task2 = createMockTask({ title: "Task 2", startMin: 540, endMin: 600 });
    const task3 = createMockTask({ title: "Task 3", startMin: 600, endMin: 660 });

    let plan = createMockPlan([task1, task2, task3]);

    // Edit task 1
    plan = updateTaskById(plan, task1.id, { title: "Task 1 Updated" });
    expect(plan.tasks).toHaveLength(3);

    // Edit task 3
    plan = updateTaskById(plan, task3.id, { priority: "high" });
    expect(plan.tasks).toHaveLength(3);

    // Verify all IDs are still intact
    expect(plan.tasks.map(t => t.id)).toEqual([task1.id, task2.id, task3.id]);
  });

  it("should maintain task identity across edit operations", () => {
    const task1 = createMockTask({ title: "Task 1", startMin: 480, endMin: 540 });
    const task2 = createMockTask({ title: "Task 2", startMin: 540, endMin: 600 });

    let plan = createMockPlan([task1, task2]);

    // Edit task 1 multiple times
    plan = updateTaskById(plan, task1.id, { status: "active" });
    plan = updateTaskById(plan, task1.id, { priority: "high" });
    plan = updateTaskById(plan, task1.id, { notes: "Updated notes" });

    // Verify task 1 still has same ID
    expect(plan.tasks[0].id).toBe(task1.id);
    expect(plan.tasks[0].status).toBe("active");
    expect(plan.tasks[0].priority).toBe("high");
    expect(plan.tasks[0].notes).toBe("Updated notes");

    // Verify task 2 unchanged
    expect(plan.tasks[1].id).toBe(task2.id);
    expect(plan.tasks[1].status).toBe("pending");
  });
});

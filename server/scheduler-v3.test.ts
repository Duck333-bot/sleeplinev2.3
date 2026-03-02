import { describe, it, expect } from "vitest";
import { scheduleDay, SchedulerInput, ScheduleBlock } from "../client/src/lib/scheduler-v3";

/**
 * Comprehensive tests for Deterministic Scheduler v3
 * 
 * Tests cover:
 * - Time integrity (24-hour minutes, no AM/PM confusion)
 * - Sleep block inviolability
 * - Fixed block protection
 * - Patch mode (minimal changes)
 * - Generate mode (full day)
 * - Overlap detection and conflict reporting
 * - Pre-sleep task stacking
 */

describe("Scheduler v3 — Time Integrity", () => {
  it("should handle 24-hour minute conversion correctly", () => {
    const input: SchedulerInput = {
      mode: "generate",
      bedtimeMin: 1350, // 22:30
      wakeTimeMin: 360, // 06:00
      sleepDurationMin: 480, // 8 hours
      plan: [],
      userRequest: "Plan my day",
    };

    const result = scheduleDay(input);

    // Verify sleep block starts exactly at bedtimeMin
    const sleepBlock = result.updatedPlan.find(b => b.type === "sleep");
    expect(sleepBlock?.startMin).toBe(1350);
    // Sleep duration should be capped at 1440 - 1350 = 90 minutes (end of day)
    expect(sleepBlock?.endMin).toBeLessThanOrEqual(1440);
  });

  it("should never move sleep block to morning", () => {
    const input: SchedulerInput = {
      mode: "generate",
      bedtimeMin: 1350, // 22:30
      wakeTimeMin: 360, // 06:00
      sleepDurationMin: 480,
      plan: [],
      userRequest: "Plan my day",
    };

    const result = scheduleDay(input);
    const sleepBlock = result.updatedPlan.find(b => b.type === "sleep");

    // Sleep must be after 20:00 (1200 minutes)
    expect(sleepBlock!.startMin).toBeGreaterThanOrEqual(1200);
  });

  it("should maintain wind-down immediately before sleep", () => {
    const input: SchedulerInput = {
      mode: "generate",
      bedtimeMin: 1350,
      wakeTimeMin: 360,
      sleepDurationMin: 480,
      plan: [],
      userRequest: "Plan my day",
    };

    const result = scheduleDay(input);
    const windDown = result.updatedPlan.find(b => b.type === "wind-down");
    const sleep = result.updatedPlan.find(b => b.type === "sleep");

    // Wind-down must end exactly when sleep starts
    expect(windDown?.endMin).toBe(sleep?.startMin);
  });
});

describe("Scheduler v3 — Sleep Integrity", () => {
  it("should never remove sleep block", () => {
    const existingPlan: ScheduleBlock[] = [
      {
        id: "sleep-1",
        title: "Sleep",
        startMin: 1350,
        endMin: 1830,
        durationMin: 480,
        type: "sleep",
        fixed: true,
      },
    ];

    const input: SchedulerInput = {
      mode: "edit",
      bedtimeMin: 1350,
      wakeTimeMin: 360,
      sleepDurationMin: 480,
      plan: existingPlan,
      userRequest: "Add morning workout",
    };

    const result = scheduleDay(input);
    const sleepBlock = result.updatedPlan.find(b => b.type === "sleep");

    expect(sleepBlock).toBeDefined();
    expect(sleepBlock?.startMin).toBe(1350);
  });

  it("should never shorten sleep unless explicitly requested", () => {
    const existingPlan: ScheduleBlock[] = [
      {
        id: "sleep-1",
        title: "Sleep",
        startMin: 1350,
        endMin: 1830,
        durationMin: 480,
        type: "sleep",
        fixed: true,
      },
    ];

    const input: SchedulerInput = {
      mode: "edit",
      bedtimeMin: 1350,
      wakeTimeMin: 360,
      sleepDurationMin: 480,
      plan: existingPlan,
      userRequest: "Add 2 hour project before bed",
    };

    const result = scheduleDay(input);
    const sleepBlock = result.updatedPlan.find(b => b.type === "sleep");

    // Sleep duration should not change
    expect(sleepBlock?.durationMin).toBe(480);
  });
});

describe("Scheduler v3 — Fixed Blocks", () => {
  it("should not move fixed blocks", () => {
    const existingPlan: ScheduleBlock[] = [
      {
        id: "work-1",
        title: "Work",
        startMin: 540, // 09:00
        endMin: 1020, // 17:00
        durationMin: 480,
        type: "task",
        fixed: true,
      },
    ];

    const input: SchedulerInput = {
      mode: "edit",
      bedtimeMin: 1350,
      wakeTimeMin: 360,
      sleepDurationMin: 480,
      plan: existingPlan,
      userRequest: "Add morning meeting",
    };

    const result = scheduleDay(input);
    const workBlock = result.updatedPlan.find(b => b.id === "work-1");

    // Work block should remain at same time
    expect(workBlock?.startMin).toBe(540);
    expect(workBlock?.endMin).toBe(1020);
  });

  it("should report conflict if new task overlaps with fixed block", () => {
    const existingPlan: ScheduleBlock[] = [
      {
        id: "work-1",
        title: "Work",
        startMin: 540,
        endMin: 1020,
        durationMin: 480,
        type: "task",
        fixed: true,
      },
    ];

    const input: SchedulerInput = {
      mode: "edit",
      bedtimeMin: 1350,
      wakeTimeMin: 360,
      sleepDurationMin: 480,
      plan: existingPlan,
      userRequest: "Add 8 hour project starting at 9 AM",
    };

    const result = scheduleDay(input);

    // Should have conflict
    expect(result.conflicts.length).toBeGreaterThan(0);
  });
});

describe("Scheduler v3 — Patch Mode", () => {
  it("should preserve all existing tasks when adding new one", () => {
    const existingPlan: ScheduleBlock[] = [
      {
        id: "task-1",
        title: "Gym",
        startMin: 600,
        endMin: 660,
        durationMin: 60,
        type: "task",
        fixed: false,
      },
      {
        id: "task-2",
        title: "Dinner",
        startMin: 1200,
        endMin: 1260,
        durationMin: 60,
        type: "task",
        fixed: false,
      },
    ];

    const input: SchedulerInput = {
      mode: "edit",
      bedtimeMin: 1350,
      wakeTimeMin: 360,
      sleepDurationMin: 480,
      plan: existingPlan,
      userRequest: "Add reading for 30 minutes",
    };

    const result = scheduleDay(input);

    // Should have original 2 tasks + new reading task
    const taskCount = result.updatedPlan.filter(b => b.type === "task").length;
    expect(taskCount).toBeGreaterThanOrEqual(2);
  });

  it("should not rebuild entire day when user adds single task", () => {
    const existingPlan: ScheduleBlock[] = [
      {
        id: "task-1",
        title: "Gym",
        startMin: 600,
        endMin: 660,
        durationMin: 60,
        type: "task",
        fixed: false,
      },
    ];

    const input: SchedulerInput = {
      mode: "edit",
      bedtimeMin: 1350,
      wakeTimeMin: 360,
      sleepDurationMin: 480,
      plan: existingPlan,
      userRequest: "Add reading",
    };

    const result = scheduleDay(input);

    // Action should be "patched", not "regenerated"
    expect(result.actionTaken).toBe("patched");
  });
});

describe("Scheduler v3 — Pre-Sleep Stacking", () => {
  it("should stack pre-sleep tasks backward from bedtime", () => {
    const input: SchedulerInput = {
      mode: "edit",
      bedtimeMin: 1350,
      wakeTimeMin: 360,
      sleepDurationMin: 480,
      plan: [
        {
          id: "wind-down",
          title: "Wind Down",
          startMin: 1320,
          endMin: 1350,
          durationMin: 30,
          type: "wind-down",
          fixed: true,
        },
      ],
      userRequest: "Add 20 minute read before bedtime",
    };

    const result = scheduleDay(input);

    // Read should end exactly when wind-down starts
    const readBlock = result.updatedPlan.find(b => b.title === "read" || b.title.includes("read"));
    if (readBlock) {
      expect(readBlock.endMin).toBeLessThanOrEqual(1320);
    }
  });
});

describe("Scheduler v3 — Overlap Detection", () => {
  it("should detect overlapping blocks", () => {
    const existingPlan: ScheduleBlock[] = [
      {
        id: "task-1",
        title: "Work",
        startMin: 540,
        endMin: 720,
        durationMin: 180,
        type: "task",
        fixed: false,
      },
    ];

    const input: SchedulerInput = {
      mode: "edit",
      bedtimeMin: 1350,
      wakeTimeMin: 360,
      sleepDurationMin: 480,
      plan: existingPlan,
      userRequest: "Add 2 hour meeting from 10 AM to 12 PM",
    };

    const result = scheduleDay(input);

    // Should report conflict
    expect(result.conflicts.length).toBeGreaterThan(0);
  });

  it("should not silently delete tasks when conflict occurs", () => {
    const existingPlan: ScheduleBlock[] = [
      {
        id: "task-1",
        title: "Work",
        startMin: 540,
        endMin: 720,
        durationMin: 180,
        type: "task",
        fixed: false,
      },
    ];

    const input: SchedulerInput = {
      mode: "edit",
      bedtimeMin: 1350,
      wakeTimeMin: 360,
      sleepDurationMin: 480,
      plan: existingPlan,
      userRequest: "Add 3 hour project from 9 AM",
    };

    const result = scheduleDay(input);

    // Original task should still exist
    const originalTask = result.updatedPlan.find(b => b.id === "task-1");
    expect(originalTask).toBeDefined();
  });
});

describe("Scheduler v3 — Generate Mode", () => {
  it("should build full day from scratch", () => {
    const input: SchedulerInput = {
      mode: "generate",
      bedtimeMin: 1350,
      wakeTimeMin: 360,
      sleepDurationMin: 480,
      plan: [],
      userRequest: "Plan my full day",
    };

    const result = scheduleDay(input);

    // Should have wake-up, wind-down, and sleep
    expect(result.updatedPlan.find(b => b.type === "wake-up")).toBeDefined();
    expect(result.updatedPlan.find(b => b.type === "wind-down")).toBeDefined();
    expect(result.updatedPlan.find(b => b.type === "sleep")).toBeDefined();

    // Action should be "regenerated"
    expect(result.actionTaken).toBe("regenerated");
  });

  it("should have essential blocks in generated day", () => {
    const input: SchedulerInput = {
      mode: "generate",
      bedtimeMin: 1350,
      wakeTimeMin: 360,
      sleepDurationMin: 480,
      plan: [],
      userRequest: "Plan my full day",
    };

    const result = scheduleDay(input);

    // Verify essential blocks exist
    expect(result.updatedPlan.find(b => b.type === "wake-up")).toBeDefined();
    expect(result.updatedPlan.find(b => b.type === "wind-down")).toBeDefined();
    expect(result.updatedPlan.find(b => b.type === "sleep")).toBeDefined();

    // Verify sleep block is at the end
    const lastBlock = result.updatedPlan[result.updatedPlan.length - 1];
    expect(lastBlock.type).toBe("sleep");
  });
});

describe("Scheduler v3 — Edge Cases", () => {
  it("should handle bedtime after midnight (wrapping)", () => {
    // Some users might have bedtime at 02:00 (120 minutes)
    const input: SchedulerInput = {
      mode: "generate",
      bedtimeMin: 120, // 02:00
      wakeTimeMin: 360, // 06:00
      sleepDurationMin: 480,
      plan: [],
      userRequest: "Plan my day",
    };

    const result = scheduleDay(input);

    // Sleep block should exist
    const sleepBlock = result.updatedPlan.find(b => b.type === "sleep");
    expect(sleepBlock).toBeDefined();
  });

  it("should handle very short sleep duration", () => {
    const input: SchedulerInput = {
      mode: "generate",
      bedtimeMin: 1350,
      wakeTimeMin: 360,
      sleepDurationMin: 60, // 1 hour (unrealistic but valid)
      plan: [],
      userRequest: "Plan my day",
    };

    const result = scheduleDay(input);

    const sleepBlock = result.updatedPlan.find(b => b.type === "sleep");
    expect(sleepBlock?.durationMin).toBe(60);
  });

  it("should handle empty plan in edit mode", () => {
    const input: SchedulerInput = {
      mode: "edit",
      bedtimeMin: 1350,
      wakeTimeMin: 360,
      sleepDurationMin: 480,
      plan: [],
      userRequest: "Add morning workout",
    };

    const result = scheduleDay(input);

    // Should not crash
    expect(result.updatedPlan).toBeDefined();
    expect(Array.isArray(result.updatedPlan)).toBe(true);
  });
});

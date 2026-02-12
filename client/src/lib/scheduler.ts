/**
 * Sleepline — Deterministic Scheduler
 * 
 * Takes AI-parsed task list + constraints and produces a fully-timed DayPlan.
 * - Respects fixed time blocks
 * - Inserts breaks based on frequency
 * - Inserts snack windows at energy dip times
 * - Adds wind-down block before bedtime
 * - Avoids scheduling heavy work late
 * - Outputs start/end times for every task
 * - Produces overflow warnings
 */

import { nanoid } from "nanoid";
import type { Task, SystemBlock, AIPlanPreview, DayPlan, SleepOption } from "./schemas";

interface SchedulerInput {
  preview: AIPlanPreview;
  date: string;
}

interface SchedulerOutput {
  plan: DayPlan;
}

// Snack windows at typical energy dip times
const SNACK_WINDOWS = [
  { startMin: 600, endMin: 615, label: "Morning Snack" },    // 10:00
  { startMin: 900, endMin: 915, label: "Afternoon Snack" },   // 15:00
];

const WIND_DOWN_DURATION = 30; // minutes

export function buildDayPlan(input: SchedulerInput): SchedulerOutput {
  const { preview, date } = input;
  const { constraints, sleepOptions } = preview;
  const { wakeMin, bedtimeMin, breakFrequency, includeSnacks } = constraints;

  const warnings: string[] = [...preview.warnings];
  const tasks: Task[] = [];
  const systemBlocks: SystemBlock[] = [];

  // 1. Add wake-up block
  systemBlocks.push({
    id: nanoid(),
    type: "wake-up",
    title: "Wake Up",
    startMin: wakeMin,
    endMin: wakeMin + 15,
    auto: true,
  });

  // 2. Add wind-down block before bedtime
  const windDownStart = bedtimeMin - WIND_DOWN_DURATION;
  systemBlocks.push({
    id: nanoid(),
    type: "wind-down",
    title: "Wind Down",
    startMin: windDownStart,
    endMin: bedtimeMin,
    auto: true,
  });

  // 3. Add sleep block
  systemBlocks.push({
    id: nanoid(),
    type: "sleep",
    title: "Sleep",
    startMin: bedtimeMin,
    endMin: Math.min(bedtimeMin + 480, 1440), // 8 hours or end of day
    auto: true,
  });

  // 4. Add snack windows if enabled
  if (includeSnacks) {
    for (const sw of SNACK_WINDOWS) {
      if (sw.startMin >= wakeMin + 15 && sw.endMin <= windDownStart) {
        systemBlocks.push({
          id: nanoid(),
          type: "snack",
          title: sw.label,
          startMin: sw.startMin,
          endMin: sw.endMin,
          auto: true,
        });
      }
    }
  }

  // 5. Separate fixed and flexible tasks
  const fixedTasks = preview.tasks.filter(t => t.locked && t.fixedStartMin !== undefined);
  const flexTasks = preview.tasks.filter(t => !t.locked || t.fixedStartMin === undefined);

  // 6. Place fixed tasks first
  for (const ft of fixedTasks) {
    const startMin = ft.fixedStartMin!;
    tasks.push({
      id: nanoid(),
      title: ft.title,
      startMin,
      endMin: startMin + ft.durationMin,
      type: ft.type,
      priority: ft.priority,
      status: "pending",
      locked: true,
      notes: ft.notes,
    });
  }

  // 7. Build occupied intervals (fixed tasks + system blocks)
  const getOccupied = (): Array<{ start: number; end: number }> => {
    const intervals = [
      ...tasks.map(t => ({ start: t.startMin, end: t.endMin })),
      ...systemBlocks.map(b => ({ start: b.startMin, end: b.endMin })),
    ];
    return intervals.sort((a, b) => a.start - b.start);
  };

  // 8. Find free slots
  const findFreeSlots = (minStart: number, maxEnd: number): Array<{ start: number; end: number }> => {
    const occupied = getOccupied();
    const slots: Array<{ start: number; end: number }> = [];
    let cursor = minStart;

    for (const interval of occupied) {
      if (interval.start > cursor) {
        slots.push({ start: cursor, end: interval.start });
      }
      cursor = Math.max(cursor, interval.end);
    }
    if (cursor < maxEnd) {
      slots.push({ start: cursor, end: maxEnd });
    }
    return slots;
  };

  // 9. Get break duration based on frequency
  const breakDuration = breakFrequency === "none" ? 0 :
    breakFrequency === "every-30m" ? 5 :
    breakFrequency === "every-60m" ? 10 : 15;

  const breakInterval = breakFrequency === "none" ? Infinity :
    breakFrequency === "every-30m" ? 30 :
    breakFrequency === "every-60m" ? 60 : 90;

  // 10. Schedule flexible tasks with breaks
  const schedulableEnd = windDownStart;
  const schedulableStart = wakeMin + 15;
  let lastBreakAt = schedulableStart;

  // Sort by priority (high first), then by avoiding heavy work late
  const sortedFlex = [...flexTasks].sort((a, b) => {
    const priOrder = { high: 0, med: 1, low: 2 };
    return priOrder[a.priority] - priOrder[b.priority];
  });

  for (const ft of sortedFlex) {
    const freeSlots = findFreeSlots(schedulableStart, schedulableEnd);
    let placed = false;

    for (const slot of freeSlots) {
      // Check if we need a break before this task
      let effectiveStart = slot.start;
      if (breakDuration > 0 && effectiveStart - lastBreakAt >= breakInterval) {
        // Insert break
        systemBlocks.push({
          id: nanoid(),
          type: "break",
          title: "Break",
          startMin: effectiveStart,
          endMin: effectiveStart + breakDuration,
          auto: true,
        });
        effectiveStart += breakDuration;
        lastBreakAt = effectiveStart;
      }

      const availableTime = slot.end - effectiveStart;
      if (availableTime >= ft.durationMin) {
        // Avoid heavy work in last 2 hours before wind-down
        const isLateSlot = effectiveStart + ft.durationMin > windDownStart - 120;
        if (isLateSlot && ft.priority === "high" && ft.type === "work") {
          // Try next slot
          continue;
        }

        tasks.push({
          id: nanoid(),
          title: ft.title,
          startMin: effectiveStart,
          endMin: effectiveStart + ft.durationMin,
          type: ft.type,
          priority: ft.priority,
          status: "pending",
          locked: false,
          notes: ft.notes,
        });
        lastBreakAt = effectiveStart + ft.durationMin;
        placed = true;
        break;
      }
    }

    if (!placed) {
      warnings.push(`Could not schedule "${ft.title}" (${ft.durationMin}m) — not enough free time.`);
      // Add as unscheduled task at end of day
      tasks.push({
        id: nanoid(),
        title: ft.title,
        startMin: 0,
        endMin: 0,
        type: ft.type,
        priority: ft.priority,
        status: "pending",
        locked: false,
        notes: ft.notes,
      });
    }
  }

  // 11. Sort everything by start time
  tasks.sort((a, b) => a.startMin - b.startMin);
  systemBlocks.sort((a, b) => a.startMin - b.startMin);

  const plan: DayPlan = {
    id: nanoid(),
    date,
    tasks,
    systemBlocks,
    sleepOptions,
    selectedSleepOptionId: null,
    warnings,
    createdAt: new Date().toISOString(),
    appliedAt: null,
  };

  return { plan };
}

// Generate default sleep options based on onboarding preferences
export function generateDefaultSleepOptions(
  preferredBedtimeMin: number,
  preferredWakeMin: number,
  sleepGoalHrs: number
): SleepOption[] {
  const perfBedtime = preferredBedtimeMin - 60; // 1 hour earlier
  const perfWake = preferredWakeMin - 30;
  const recBedtime = preferredBedtimeMin + 30;
  const recWake = preferredWakeMin + 60;

  return [
    {
      id: nanoid(),
      mode: "performance",
      bedtimeMin: Math.max(perfBedtime, 1200), // not before 8pm
      wakeMin: Math.max(perfWake, 300), // not before 5am
      sleepDurationHrs: Math.round(((perfWake + 1440 - perfBedtime) % 1440) / 60 * 10) / 10,
      predictedEnergy: 9,
      rationale: "Early to bed, early to rise. Maximizes deep sleep cycles for peak cognitive performance tomorrow.",
    },
    {
      id: nanoid(),
      mode: "balanced",
      bedtimeMin: preferredBedtimeMin,
      wakeMin: preferredWakeMin,
      sleepDurationHrs: sleepGoalHrs,
      predictedEnergy: 7,
      rationale: "Your preferred schedule. Maintains your natural rhythm while hitting your sleep goal.",
    },
    {
      id: nanoid(),
      mode: "recovery",
      bedtimeMin: Math.min(recBedtime, 1410), // not after 11:30pm
      wakeMin: Math.min(recWake, 600), // not after 10am
      sleepDurationHrs: Math.round(((recWake + 1440 - recBedtime) % 1440) / 60 * 10) / 10,
      predictedEnergy: 6,
      rationale: "Extra rest for recovery. Ideal after a tough day or poor sleep last night.",
    },
  ];
}

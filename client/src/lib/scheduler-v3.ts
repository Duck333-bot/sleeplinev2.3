/**
 * Sleepline — Deterministic Scheduling Engine v3
 * 
 * CORE PRINCIPLES:
 * - Patch, do not rebuild (unless explicitly requested)
 * - Preserve time integrity (24-hour minutes, no AM/PM confusion)
 * - Preserve all existing tasks unless modification is explicit
 * - Sleep block is inviolable
 * - Fixed blocks cannot be moved or resized
 * - Overlap resolution with conflict reporting (never silent deletion)
 * 
 * INPUT: { mode: "generate" | "edit", bedtimeMin, wakeTimeMin, sleepDurationMin, plan, userRequest }
 * OUTPUT: { updatedPlan, conflicts, actionTaken }
 */

import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

export interface ScheduleBlock {
  id: string;
  title: string;
  startMin: number;
  endMin: number;
  durationMin: number;
  fixed?: boolean;
  type?: "task" | "system" | "break" | "snack" | "wind-down" | "sleep" | "wake-up";
}

export interface SchedulerInput {
  mode: "generate" | "edit";
  bedtimeMin: number;
  wakeTimeMin: number;
  sleepDurationMin: number;
  plan: ScheduleBlock[];
  userRequest: string;
}

export interface SchedulerOutput {
  updatedPlan: ScheduleBlock[];
  conflicts: string[];
  actionTaken: "patched" | "regenerated";
}

// ============================================================================
// CORE RULES
// ============================================================================

/**
 * Convert time string to 24-hour minutes (0-1440)
 * Handles: "10:30", "22:30", "3:00 PM", "3 PM", etc.
 */
function parseTimeToMinutes(timeStr: string, contextBedtimeMin?: number): number | null {
  const trimmed = timeStr.trim().toUpperCase();
  
  // Try HH:MM format first
  const colonMatch = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (colonMatch) {
    let hours = parseInt(colonMatch[1], 10);
    const minutes = parseInt(colonMatch[2], 10);
    
    // Heuristic: if hour is 1-12 and we have PM context, add 12
    if (hours <= 12 && trimmed.includes("PM")) {
      hours += 12;
    } else if (hours === 12 && !trimmed.includes("PM")) {
      hours = 0; // 12 AM = 00:00
    }
    
    // Heuristic: if hour is 1-12 and bedtime context suggests PM, assume PM
    if (hours <= 12 && contextBedtimeMin && contextBedtimeMin >= 1200 && !trimmed.includes("AM")) {
      hours += 12;
    }
    
    return Math.min(hours * 60 + minutes, 1440);
  }
  
  // Try "3 PM" or "3PM" format
  const ampmMatch = trimmed.match(/^(\d{1,2})\s*(AM|PM)/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const ampm = ampmMatch[2];
    
    if (ampm === "PM" && hours !== 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    
    return hours * 60;
  }
  
  return null;
}

/**
 * Check if two blocks overlap
 */
function blocksOverlap(block1: ScheduleBlock, block2: ScheduleBlock): boolean {
  return !(block1.endMin <= block2.startMin || block2.endMin <= block1.startMin);
}

/**
 * Find all overlaps with a given block
 */
function findOverlaps(block: ScheduleBlock, plan: ScheduleBlock[]): ScheduleBlock[] {
  return plan.filter(b => b.id !== block.id && blocksOverlap(block, b));
}

/**
 * Extract intent from user request
 * Returns: { action, taskTitle, durationMin, beforeBedtime, fixedTime }
 */
function extractIntent(userRequest: string, bedtimeMin: number): {
  action: "add" | "modify" | "move" | "remove";
  taskTitle?: string;
  durationMin?: number;
  beforeBedtime?: boolean;
  fixedTime?: number;
} {
  const lower = userRequest.toLowerCase();
  
  let action: "add" | "modify" | "move" | "remove" = "add";
  if (lower.includes("remove") || lower.includes("delete")) action = "remove";
  else if (lower.includes("move") || lower.includes("reschedule")) action = "move";
  else if (lower.includes("change") || lower.includes("update")) action = "modify";
  
  let durationMin: number | undefined;
  const durationMatch = userRequest.match(/(\d+)\s*(min|minute|hour|h)/i);
  if (durationMatch) {
    let val = parseInt(durationMatch[1], 10);
    if (durationMatch[2].toLowerCase().startsWith("h")) val *= 60;
    durationMin = val;
  }
  
  const beforeBedtime = lower.includes("before bed") || lower.includes("before sleep");
  
  return {
    action,
    taskTitle: userRequest.split(/add|insert|schedule/i)[1]?.trim(),
    durationMin,
    beforeBedtime,
  };
}

/**
 * Shift flexible blocks earlier to resolve overlap
 */
function shiftBlocksEarlier(
  conflictingBlock: ScheduleBlock,
  newBlock: ScheduleBlock,
  plan: ScheduleBlock[],
  wakeTimeMin: number
): { shifted: ScheduleBlock[]; canShift: boolean } {
  const shifted = [...plan];
  let canShift = true;
  
  // Find all blocks that need to shift
  const toShift = shifted.filter(b => 
    b.startMin >= newBlock.startMin && 
    !b.fixed && 
    b.type !== "sleep" && 
    b.type !== "wake-up"
  );
  
  // Try to shift each block earlier
  for (const block of toShift) {
    const gapBefore = block.startMin - wakeTimeMin;
    if (gapBefore < block.durationMin) {
      canShift = false;
      break;
    }
    
    // Move block earlier
    const idx = shifted.findIndex(b => b.id === block.id);
    if (idx >= 0) {
      shifted[idx] = {
        ...block,
        startMin: block.startMin - newBlock.durationMin,
        endMin: block.endMin - newBlock.durationMin,
      };
    }
  }
  
  return { shifted, canShift };
}

// ============================================================================
// MAIN SCHEDULER
// ============================================================================

export function scheduleDay(input: SchedulerInput): SchedulerOutput {
  const { mode, bedtimeMin, wakeTimeMin, sleepDurationMin, plan, userRequest } = input;
  const conflicts: string[] = [];
  
  // GENERATE MODE: Build full day from scratch
  if (mode === "generate") {
    return generateFullDay({
      bedtimeMin,
      wakeTimeMin,
      sleepDurationMin,
      userRequest,
      conflicts,
    });
  }
  
  // EDIT MODE: Patch existing plan
  return patchPlan({
    bedtimeMin,
    wakeTimeMin,
    sleepDurationMin,
    plan,
    userRequest,
    conflicts,
  });
}

/**
 * Generate a full day schedule from scratch
 */
function generateFullDay(input: {
  bedtimeMin: number;
  wakeTimeMin: number;
  sleepDurationMin: number;
  userRequest: string;
  conflicts: string[];
}): SchedulerOutput {
  const { bedtimeMin, wakeTimeMin, sleepDurationMin, userRequest, conflicts } = input;
  const updatedPlan: ScheduleBlock[] = [];
  
  // 1. Add wake-up block
  updatedPlan.push({
    id: nanoid(),
    title: "Wake Up",
    startMin: wakeTimeMin,
    endMin: wakeTimeMin + 15,
    durationMin: 15,
    type: "wake-up",
    fixed: true,
  });
  
  // 2. Add wind-down (30 min before bedtime)
  const windDownStart = Math.max(bedtimeMin - 30, wakeTimeMin + 15);
  updatedPlan.push({
    id: nanoid(),
    title: "Wind Down",
    startMin: windDownStart,
    endMin: bedtimeMin,
    durationMin: bedtimeMin - windDownStart,
    type: "wind-down",
    fixed: true,
  });
  
  // 3. Add sleep block (INVIOLABLE)
  const sleepEndMin = Math.min(bedtimeMin + sleepDurationMin, 1440);
  updatedPlan.push({
    id: nanoid(),
    title: "Sleep",
    startMin: bedtimeMin,
    endMin: sleepEndMin,
    durationMin: sleepEndMin - bedtimeMin,
    type: "sleep",
    fixed: true,
  });
  
  return {
    updatedPlan,
    conflicts,
    actionTaken: "regenerated",
  };
}

/**
 * Patch existing plan with minimal changes
 */
function patchPlan(input: {
  bedtimeMin: number;
  wakeTimeMin: number;
  sleepDurationMin: number;
  plan: ScheduleBlock[];
  userRequest: string;
  conflicts: string[];
}): SchedulerOutput {
  const { bedtimeMin, wakeTimeMin, sleepDurationMin, plan, userRequest, conflicts } = input;
  let updatedPlan = JSON.parse(JSON.stringify(plan)) as ScheduleBlock[]; // Deep copy
  
  const intent = extractIntent(userRequest, bedtimeMin);
  
  // CASE 1: Add a task
  if (intent.action === "add" && intent.taskTitle) {
    const newTask: ScheduleBlock = {
      id: nanoid(),
      title: intent.taskTitle,
      startMin: wakeTimeMin + 15,
      endMin: wakeTimeMin + 15 + (intent.durationMin || 60),
      durationMin: intent.durationMin || 60,
      type: "task",
      fixed: false,
    };
    
    // If "before bedtime", stack backward from bedtime
    if (intent.beforeBedtime) {
      const windDownBlock = updatedPlan.find(b => b.type === "wind-down");
      if (windDownBlock) {
        newTask.endMin = windDownBlock.startMin;
        newTask.startMin = newTask.endMin - (intent.durationMin || 60);
      }
    }
    
    // Check for overlaps
    const overlaps = findOverlaps(newTask, updatedPlan);
    if (overlaps.length > 0) {
      // Try to shift flexible blocks
      const { shifted, canShift } = shiftBlocksEarlier(overlaps[0], newTask, updatedPlan, wakeTimeMin);
      
      if (canShift) {
        updatedPlan = shifted;
        updatedPlan.push(newTask);
      } else {
        conflicts.push(`Cannot add "${intent.taskTitle}": overlaps with ${overlaps.map(b => b.title).join(", ")} and no space to shift.`);
      }
    } else {
      updatedPlan.push(newTask);
    }
  }
  
  // CASE 2: Modify duration
  if (intent.action === "modify" && intent.durationMin) {
    const taskToModify = updatedPlan.find(b => b.type === "task" && !b.fixed);
    if (taskToModify) {
      const oldDuration = taskToModify.durationMin;
      taskToModify.endMin = taskToModify.startMin + intent.durationMin;
      taskToModify.durationMin = intent.durationMin;
      
      // Check for new overlaps
      const overlaps = findOverlaps(taskToModify, updatedPlan);
      if (overlaps.length > 0) {
        conflicts.push(`Modified task now overlaps with: ${overlaps.map(b => b.title).join(", ")}`);
      }
    }
  }
  
  // CASE 3: Remove a task
  if (intent.action === "remove") {
    updatedPlan = updatedPlan.filter(b => b.type !== "task" || b.title !== intent.taskTitle);
  }
  
  // Sort by startMin, but keep sleep block at the end
  const sleepBlockToMove = updatedPlan.find(b => b.type === "sleep");
  const nonSleepBlocks = updatedPlan.filter(b => b.type !== "sleep");
  nonSleepBlocks.sort((a, b) => a.startMin - b.startMin);
  updatedPlan = sleepBlockToMove ? [...nonSleepBlocks, sleepBlockToMove] : nonSleepBlocks;
  
  // Verify sleep block is intact
  const sleepBlockVerify = updatedPlan.find(b => b.type === "sleep");
  if (!sleepBlockVerify || sleepBlockVerify.startMin !== bedtimeMin) {
    conflicts.push("WARNING: Sleep block integrity compromised.");
  }
  
  return {
    updatedPlan,
    conflicts,
    actionTaken: "patched",
  };
}

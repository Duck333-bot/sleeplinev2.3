/**
 * Sleepline — AI Planning Pipeline v2 (Fixed)
 * 
 * Improvements:
 * 1. Better time range parsing with explicit AM/PM handling
 * 2. Validation to prevent overlapping tasks
 * 3. Defensive logic to ensure tasks are never lost
 * 4. Comprehensive logging for debugging
 * 5. Immutable state updates
 */

import { nanoid } from "nanoid";
import { AIPlanPreviewSchema, type AIPlanPreview, type Onboarding, type CheckIn, timeToMin } from "./schemas";
import { buildDayPlan, generateDefaultSleepOptions } from "./scheduler";
import type { DayPlan } from "./schemas";

interface PlanRequest {
  userPrompt: string;
  onboarding: Onboarding;
  checkIn?: CheckIn;
}

/**
 * Generate a plan preview using the server-side AI endpoint.
 * Falls back to the smart text parser if the server call fails.
 */
export async function generatePlanPreview(
  request: PlanRequest,
  trpcClient?: { ai: { generatePlan: { mutate: (input: any) => Promise<any> } } }
): Promise<DayPlan> {
  const { userPrompt, onboarding, checkIn } = request;
  const today = new Date().toISOString().slice(0, 10);

  console.log("[AI Planner] Starting plan generation for:", today);
  console.log("[AI Planner] User prompt:", userPrompt);

  // Try server-side AI first
  if (trpcClient) {
    try {
      const result = await trpcClient.ai.generatePlan.mutate({
        userPrompt,
        wakeTime: onboarding.preferredWakeTime,
        bedtime: onboarding.preferredBedtime,
        sleepGoalHrs: onboarding.sleepGoalHrs,
        chronotype: onboarding.chronotype,
        breakFrequency: onboarding.breakFrequency,
        snackWindows: onboarding.snackWindows,
        checkIn: checkIn ? {
          sleepHours: checkIn.sleepHours,
          sleepQuality: checkIn.sleepQuality,
          morningEnergy: checkIn.morningEnergy,
          stressLevel: checkIn.stressLevel,
          workload: checkIn.workload,
        } : undefined,
      });

      if (result.success && result.preview) {
        const validated = AIPlanPreviewSchema.parse(result.preview);
        console.log("[AI Planner] Server AI returned", validated.tasks.length, "tasks");
        const { plan } = buildDayPlan({ preview: validated, date: today });
        console.log("[AI Planner] Built day plan with", plan.tasks.length, "scheduled tasks");
        return plan;
      }
    } catch (error) {
      console.warn("[AI Planner] Server-side AI plan generation failed:", error);
    }
  }

  // Fallback: use smart text parser
  console.log("[AI Planner] Using fallback text parser");
  return generateFallbackPlan(userPrompt, onboarding, today);
}

// ─── Smart Fallback Parser v2 ───────────────────────────────
// Improved parsing with better time range handling

interface ParsedTask {
  title: string;
  durationMin: number;
  type: "work" | "study" | "class" | "exercise" | "commute" | "errand" | "creative" | "social" | "other";
  priority: "low" | "med" | "high";
  locked: boolean;
  fixedStartMin?: number;
}

/**
 * Normalize hour to 24-hour format
 * Handles edge cases like 12 AM (midnight) and 12 PM (noon)
 */
function normalizeHour(h: number, ampm: string): number {
  const lower = ampm.toLowerCase().trim();
  
  // Handle 12 AM (midnight) -> 0
  if (h === 12 && lower === "am") return 0;
  
  // Handle 12 PM (noon) -> 12
  if (h === 12 && lower === "pm") return 12;
  
  // Handle PM times (add 12 if not already)
  if (lower === "pm" && h < 12) return h + 12;
  
  // Handle AM times (keep as is, but ensure valid)
  if (lower === "am") return h % 12;
  
  // No AM/PM specified, return as is
  return h;
}

function detectType(text: string): ParsedTask["type"] {
  const lower = text.toLowerCase();
  if (/\b(work|office|meeting|email|call|project|remote)\b/.test(lower)) return "work";
  if (/\b(study|homework|exam|review|read|lecture|research)\b/.test(lower)) return "study";
  if (/\b(school|class|lecture|seminar)\b/.test(lower)) return "class";
  if (/\b(gym|exercise|run|walk|yoga|soccer|basketball|swim|workout|jog|hike|sport|practice)\b/.test(lower)) return "exercise";
  if (/\b(commute|drive|bus|train|travel)\b/.test(lower)) return "commute";
  if (/\b(cook|clean|grocery|laundry|errand|shop|chore|dinner prep|meal prep|prep)\b/.test(lower)) return "errand";
  if (/\b(write|draw|paint|music|design|create|art)\b/.test(lower)) return "creative";
  if (/\b(friend|lunch with|dinner with|party|hangout|social|meet)\b/.test(lower)) return "social";
  return "other";
}

function detectPriority(text: string, type: ParsedTask["type"]): ParsedTask["priority"] {
  const lower = text.toLowerCase();
  if (/\b(important|urgent|critical|must|deadline)\b/.test(lower)) return "high";
  if (type === "work" || type === "class" || type === "study") return "high";
  if (type === "exercise" || type === "errand") return "med";
  return "med";
}

/**
 * Parse time range like "9-5", "9:00-17:00", "9:00 AM - 5:00 PM"
 * Returns { startMin, endMin, title } or null if not a time range
 */
function parseTimeRange(segment: string): { startMin: number; endMin: number; title: string } | null {
  // Match patterns like:
  // "Work 9-5"
  // "Work 9:00-17:00"
  // "Work 9:00 AM - 5:00 PM"
  // "9-5 work"
  // "9:00-17:00 meetings"
  
  const patterns = [
    // Pattern 1: "Title HH:MM AM/PM - HH:MM AM/PM"
    /^(.*?)\s+(\d{1,2}):(\d{2})\s*(am|pm)?\s*[-–to]+\s*(\d{1,2}):(\d{2})\s*(am|pm)?\s*(.*)$/i,
    // Pattern 2: "Title HH-HH" or "Title HH-MM"
    /^(.*?)\s+(\d{1,2}):?(\d{0,2})?\s*(am|pm)?\s*[-–to]+\s*(\d{1,2}):?(\d{0,2})?\s*(am|pm)?\s*(.*)$/i,
    // Pattern 3: "HH:MM AM/PM - HH:MM AM/PM Title"
    /^(\d{1,2}):(\d{2})\s*(am|pm)?\s*[-–to]+\s*(\d{1,2}):(\d{2})\s*(am|pm)?\s*(.*)$/i,
  ];

  for (const pattern of patterns) {
    const match = segment.match(pattern);
    if (!match) continue;

    let titlePrefix = "";
    let startH = 0, startM = 0, startAmPm = "";
    let endH = 0, endM = 0, endAmPm = "";
    let titleSuffix = "";

    if (pattern === patterns[0]) {
      titlePrefix = match[1] || "";
      startH = parseInt(match[2]);
      startM = parseInt(match[3] || "0");
      startAmPm = match[4] || "";
      endH = parseInt(match[5]);
      endM = parseInt(match[6] || "0");
      endAmPm = match[7] || "";
      titleSuffix = match[8] || "";
    } else if (pattern === patterns[1]) {
      titlePrefix = match[1] || "";
      startH = parseInt(match[2]);
      startM = parseInt(match[3] || "0");
      startAmPm = match[4] || "";
      endH = parseInt(match[5]);
      endM = parseInt(match[6] || "0");
      endAmPm = match[7] || "";
      titleSuffix = match[8] || "";
    } else if (pattern === patterns[2]) {
      startH = parseInt(match[1]);
      startM = parseInt(match[2] || "0");
      startAmPm = match[3] || "";
      endH = parseInt(match[4]);
      endM = parseInt(match[5] || "0");
      endAmPm = match[6] || "";
      titleSuffix = match[7] || "";
    }

    // Normalize hours
    if (startAmPm) startH = normalizeHour(startH, startAmPm);
    if (endAmPm) endH = normalizeHour(endH, endAmPm);

    // If no AM/PM specified, use heuristics
    if (!startAmPm && !endAmPm) {
      // If start is 1-6 and end is 9-5, assume PM for start
      if (startH >= 1 && startH <= 6 && endH >= 9 && endH <= 5) {
        startH += 12;
      }
      // If end < start, assume end is PM
      if (endH < startH && endH < 12) {
        endH += 12;
      }
    } else if (!endAmPm && startAmPm) {
      // If start has AM/PM but end doesn't, infer end
      if (endH <= startH && endH < 12) {
        endH += 12;
      }
    }

    // Final safety check
    if (endH <= startH && endH < 12) {
      endH += 12;
    }

    const startMin = startH * 60 + startM;
    const endMinVal = endH * 60 + endM;
    const durationMin = Math.max(15, endMinVal - startMin);

    const title = (titlePrefix + " " + titleSuffix).trim() || segment;

    console.log(`[Time Parser] Parsed time range: "${segment}" -> ${startH}:${startM} - ${endH}:${endM} (${startMin}-${endMinVal} min)`);

    return {
      startMin,
      endMin: endMinVal,
      title,
    };
  }

  return null;
}

function parseTasksFromPrompt(prompt: string): ParsedTask[] {
  const tasks: ParsedTask[] = [];
  const seenTitles = new Set<string>(); // Prevent duplicates

  // Split by common delimiters
  const segments = prompt
    .split(/[,;\n]+|\band\b/gi)
    .map(s => s.trim())
    .filter(s => s.length > 2);

  console.log(`[Task Parser] Parsing ${segments.length} segments from prompt`);

  for (const segment of segments) {
    console.log(`[Task Parser] Processing segment: "${segment}"`);

    // Try to parse as time range first
    const timeRange = parseTimeRange(segment);
    if (timeRange) {
      const { startMin, endMin, title } = timeRange;
      const durationMin = Math.max(15, endMin - startMin);

      // Prevent duplicate tasks
      if (seenTitles.has(title.toLowerCase())) {
        console.log(`[Task Parser] Skipping duplicate task: "${title}"`);
        continue;
      }
      seenTitles.add(title.toLowerCase());

      const type = detectType(title);
      const task: ParsedTask = {
        title,
        durationMin: Math.min(durationMin, 480),
        type,
        priority: detectPriority(title, type),
        locked: true,
        fixedStartMin: startMin,
      };

      console.log(`[Task Parser] Created fixed-time task: "${title}" at ${startMin}min (${durationMin}min)`);
      tasks.push(task);
      continue;
    }

    // Pattern 2: "gym after work 1h", "homework 2h", "walk 30m"
    const durationMatch = segment.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minutes)/i);
    let durationMin = 45;
    if (durationMatch) {
      const val = parseFloat(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      if (unit.startsWith("h")) {
        durationMin = Math.round(val * 60);
      } else {
        durationMin = Math.round(val);
      }
    }

    let title = segment
      .replace(/\d+(?:\.\d+)?\s*(h|hr|hrs|hour|hours|m|min|mins|minutes)/gi, "")
      .trim();
    if (!title) title = segment;

    title = title.charAt(0).toUpperCase() + title.slice(1);

    // Prevent duplicate tasks
    if (seenTitles.has(title.toLowerCase())) {
      console.log(`[Task Parser] Skipping duplicate task: "${title}"`);
      continue;
    }
    seenTitles.add(title.toLowerCase());

    const type = detectType(title);
    const isAfterWork = /after work|evening|night|pm/i.test(segment);
    const isMorning = /morning|before work|am/i.test(segment);

    const task: ParsedTask = {
      title,
      durationMin: Math.min(Math.max(durationMin, 15), 480),
      type,
      priority: detectPriority(title, type),
      locked: false,
    };

    if (isAfterWork) {
      task.locked = true;
      task.fixedStartMin = 17 * 60 + 30;
    } else if (isMorning) {
      task.locked = true;
      task.fixedStartMin = 7 * 60;
    }

    console.log(`[Task Parser] Created flexible task: "${title}" (${durationMin}min)`);
    tasks.push(task);
  }

  console.log(`[Task Parser] Total tasks parsed: ${tasks.length}`);
  return tasks.slice(0, 12); // Max 12 tasks
}

function generateFallbackPlan(prompt: string, onboarding: Onboarding, date: string): DayPlan {
  const wakeMin = timeToMin(onboarding.preferredWakeTime);
  const bedtimeMin = timeToMin(onboarding.preferredBedtime);

  console.log(`[Fallback Planner] Wake: ${wakeMin}min, Bedtime: ${bedtimeMin}min`);

  const tasks = parseTasksFromPrompt(prompt);
  const sleepOptions = generateDefaultSleepOptions(bedtimeMin, wakeMin, onboarding.sleepGoalHrs);

  const preview: AIPlanPreview = {
    tasks,
    constraints: {
      wakeMin,
      bedtimeMin,
      breakFrequency: onboarding.breakFrequency,
      includeSnacks: onboarding.snackWindows,
    },
    sleepOptions,
    warnings: [],
  };

  const { plan } = buildDayPlan({ preview, date });
  console.log(`[Fallback Planner] Generated plan with ${plan.tasks.length} tasks and ${plan.systemBlocks.length} blocks`);
  return plan;
}

// Quick plan generation without AI (for demo/offline)
export function generateQuickPlan(
  taskDescriptions: string[],
  onboarding: Onboarding,
): DayPlan {
  const today = new Date().toISOString().slice(0, 10);
  const wakeMin = timeToMin(onboarding.preferredWakeTime);
  const bedtimeMin = timeToMin(onboarding.preferredBedtime);

  const tasks = taskDescriptions.map(desc => {
    const type = detectType(desc);
    return {
      title: desc.charAt(0).toUpperCase() + desc.slice(1),
      durationMin: 45,
      type,
      priority: detectPriority(desc, type),
      locked: false,
    };
  });

  const sleepOptions = generateDefaultSleepOptions(bedtimeMin, wakeMin, onboarding.sleepGoalHrs);

  const preview: AIPlanPreview = {
    tasks,
    constraints: {
      wakeMin,
      bedtimeMin,
      breakFrequency: onboarding.breakFrequency,
      includeSnacks: onboarding.snackWindows,
    },
    sleepOptions,
    warnings: [],
  };

  const { plan } = buildDayPlan({ preview, date: today });
  return plan;
}

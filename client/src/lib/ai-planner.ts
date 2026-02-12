/**
 * Sleepline — AI Planning Pipeline (Client-side)
 * 
 * 1. Tries server-side LLM via tRPC (ai.generatePlan)
 * 2. Falls back to smart text parser if server fails
 * 3. Passes result to deterministic scheduler
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
        const { plan } = buildDayPlan({ preview: validated, date: today });
        return plan;
      }
    } catch (error) {
      console.warn("Server-side AI plan generation failed, using fallback:", error);
    }
  }

  // Fallback: use smart text parser
  return generateFallbackPlan(userPrompt, onboarding, today);
}

// ─── Smart Fallback Parser ──────────────────────────────────
// Parses natural language day descriptions into structured tasks

interface ParsedTask {
  title: string;
  durationMin: number;
  type: "work" | "study" | "class" | "exercise" | "commute" | "errand" | "creative" | "social" | "other";
  priority: "low" | "med" | "high";
  locked: boolean;
  fixedStartMin?: number;
}

function normalizeHour(h: number, ampm: string, _fullContext: string): number {
  const lower = ampm.toLowerCase();
  if (lower === "pm" && h < 12) return h + 12;
  if (lower === "am" && h === 12) return 0;
  if (lower === "am" || lower === "pm") return h;
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

function parseTasksFromPrompt(prompt: string): ParsedTask[] {
  const tasks: ParsedTask[] = [];

  // Split by common delimiters
  const segments = prompt
    .split(/[,;\n]+|\band\b/gi)
    .map(s => s.trim())
    .filter(s => s.length > 2);

  for (const segment of segments) {
    // Pattern 1: "Work 9-5", "school 8-3", "meetings 10-12"
    const timeRangeMatch = segment.match(
      /^(.*?)\s*(\d{1,2}):?(\d{2})?\s*(am|pm)?\s*[-–to]+\s*(\d{1,2}):?(\d{2})?\s*(am|pm)?\s*(.*)$/i
    );

    if (timeRangeMatch) {
      let startH = parseInt(timeRangeMatch[2]);
      const startM = parseInt(timeRangeMatch[3] || "0");
      const startAmPm = timeRangeMatch[4] || "";
      let endH = parseInt(timeRangeMatch[5]);
      const endM = parseInt(timeRangeMatch[6] || "0");
      const endAmPm = timeRangeMatch[7] || "";

      let title = (timeRangeMatch[1] + " " + (timeRangeMatch[8] || "")).trim();
      if (!title) title = segment;

      if (startAmPm) {
        startH = normalizeHour(startH, startAmPm, segment);
      }
      if (endAmPm) {
        endH = normalizeHour(endH, endAmPm, segment);
      }

      if (!startAmPm && !endAmPm) {
        if (startH >= 7 && startH <= 12) {
          // Start is likely AM
        } else if (startH >= 1 && startH <= 6) {
          startH += 12;
        }
        if (endH < startH) {
          if (endH <= 12) endH += 12;
        }
        if (startH === 9 && endH === 5) endH = 17;
        if (startH === 8 && endH === 3) endH = 15;
      } else if (!endAmPm && startAmPm) {
        if (endH <= startH && endH < 12) endH += 12;
      }

      if (endH <= startH && endH < 12) endH += 12;

      const fixedStartMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      const durationMin = Math.max(15, endMin - fixedStartMin);

      title = title.charAt(0).toUpperCase() + title.slice(1);

      const type = detectType(title);
      tasks.push({
        title,
        durationMin: Math.min(durationMin, 480),
        type,
        priority: detectPriority(title, type),
        locked: true,
        fixedStartMin,
      });
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

    tasks.push(task);
  }

  return tasks.slice(0, 12);
}

function generateFallbackPlan(prompt: string, onboarding: Onboarding, date: string): DayPlan {
  const wakeMin = timeToMin(onboarding.preferredWakeTime);
  const bedtimeMin = timeToMin(onboarding.preferredBedtime);

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

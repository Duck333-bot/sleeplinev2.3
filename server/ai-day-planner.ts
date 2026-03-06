/**
 * Enhanced AI Day Planning
 * 
 * Flagship feature: "Describe your day, and Sleepline builds the plan around your sleep."
 * 
 * This module provides:
 * 1. Optimized system prompt for natural language day planning
 * 2. Validation layer for generated plans
 * 3. Plan transformation utilities
 */

import { z } from "zod";
import { invokeLLM } from "./_core/llm";

// ─── Schemas ─────────────────────────────────────────────────

export const DayPlanBlockSchema = z.object({
  title: z.string().min(1).max(100),
  start: z.number().int().min(0).max(1440),
  end: z.number().int().min(0).max(1440),
  type: z.enum(["task", "break", "snack", "wind-down", "sleep"]).default("task"),
  priority: z.enum(["low", "med", "high"]).default("med"),
  locked: z.boolean().default(false),
});

export const DayPlanResponseSchema = z.object({
  summary: z.string().min(10).max(500),
  blocks: z.array(DayPlanBlockSchema).min(1).max(20),
  warnings: z.array(z.string()).default([]),
});

export type DayPlanBlock = z.infer<typeof DayPlanBlockSchema>;
export type DayPlanResponse = z.infer<typeof DayPlanResponseSchema>;

// ─── System Prompt ───────────────────────────────────────────

export const AI_DAY_PLANNING_PROMPT = `You are Sleepline AI, a sleep-aware day planner. Your mission: help users build realistic, sleep-optimized daily schedules from natural language descriptions.

When a user describes their day, you must:
1. Parse their tasks and commitments into concrete blocks
2. Estimate realistic durations (be generous, not optimistic)
3. Arrange blocks chronologically
4. Preserve sleep time (never remove or shorten sleep blocks)
5. Avoid overlaps
6. Add breaks and wind-down time naturally
7. Prefer deep work and high-priority tasks earlier in the day
8. Flag any impossible or overloaded schedules

CRITICAL: Return ONLY valid JSON matching this exact schema. No markdown, no explanation, no extra text.

{
  "summary": "Brief explanation of the plan (1-2 sentences)",
  "blocks": [
    {
      "title": "Task name",
      "start": 480,
      "end": 540,
      "type": "task" | "break" | "snack" | "wind-down" | "sleep",
      "priority": "low" | "med" | "high",
      "locked": false
    }
  ],
  "warnings": ["Optional warnings about schedule feasibility"]
}

TIME FORMAT: Minutes since midnight (0-1440)
- 06:00 = 360
- 09:00 = 540
- 12:00 = 720
- 15:00 = 900
- 18:00 = 1080
- 22:00 = 1320
- 23:00 = 1380

BLOCK TYPES:
- task: User's actual work/study/exercise
- break: 10-20 min break between tasks
- snack: 15-30 min snack/meal break
- wind-down: 30-60 min before sleep (no screens, relaxation)
- sleep: Sleep block (preserve from user's sleep goal)

RULES:
- Always include a sleep block (typically 22:00-07:00 or user's preferred time)
- Add 1-2 breaks per 2 hours of focused work
- Include wind-down time before sleep (at least 30 min)
- If user specifies exact times (e.g., "school 8-3"), lock those blocks
- If user specifies duration only (e.g., "2 hours of study"), place it in a good energy window
- Add snack/meal breaks between major blocks
- Be realistic: 8h work = 8h blocks + 1-2h breaks + 1h meals + 30m wind-down = full day
- Flag if the day is overloaded or has impossible timing

ENERGY ZONES (use these for task placement):
- 06:00-09:00: High focus (best for deep work)
- 09:00-12:00: Peak focus (optimal performance)
- 12:00-14:00: Post-lunch dip (lighter tasks, breaks)
- 14:00-17:00: Recovery (second wind, meetings)
- 17:00-20:00: Moderate energy (creative work, exercise)
- 20:00-22:00: Wind-down (light tasks, preparation)
- 22:00-06:00: Sleep

EXAMPLE INPUT: "I need to study math for 2 hours, finish chemistry homework, go to the gym for 1 hour, and I want to sleep by 10:45."

EXAMPLE OUTPUT:
{
  "summary": "Your day starts with deep math study in the morning, followed by chemistry homework after lunch, gym in the evening, and wind-down before your 10:45 bedtime.",
  "blocks": [
    {"title": "Wake & breakfast", "start": 360, "end": 420, "type": "snack", "priority": "low", "locked": false},
    {"title": "Math study", "start": 420, "end": 540, "type": "task", "priority": "high", "locked": false},
    {"title": "Break", "start": 540, "end": 560, "type": "break", "priority": "low", "locked": false},
    {"title": "Math study (continued)", "start": 560, "end": 680, "type": "task", "priority": "high", "locked": false},
    {"title": "Lunch", "start": 680, "end": 740, "type": "snack", "priority": "low", "locked": false},
    {"title": "Chemistry homework", "start": 740, "end": 860, "type": "task", "priority": "med", "locked": false},
    {"title": "Break", "start": 860, "end": 880, "type": "break", "priority": "low", "locked": false},
    {"title": "Gym", "start": 880, "end": 940, "type": "task", "priority": "med", "locked": false},
    {"title": "Dinner", "start": 940, "end": 1000, "type": "snack", "priority": "low", "locked": false},
    {"title": "Free time", "start": 1000, "end": 1080, "type": "task", "priority": "low", "locked": false},
    {"title": "Wind-down", "start": 1080, "end": 1140, "type": "wind-down", "priority": "low", "locked": false},
    {"title": "Sleep", "start": 1140, "end": 1440, "type": "sleep", "priority": "high", "locked": true}
  ],
  "warnings": []
}

Remember: Your goal is to make the user feel confident that their day is achievable and their sleep is protected.`;

// ─── Validation ──────────────────────────────────────────────

/**
 * Validate a generated day plan
 * Returns { valid: true } or { valid: false, errors: [...] }
 */
export function validateDayPlan(plan: DayPlanResponse): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate blocks array
  if (!plan.blocks || plan.blocks.length === 0) {
    errors.push("Plan must have at least one block");
    return { valid: false, errors };
  }

  // Validate each block
  plan.blocks.forEach((block, i) => {
    if (!block.title || block.title.trim().length === 0) {
      errors.push(`Block ${i + 1}: Title is required`);
    }

    if (typeof block.start !== "number" || block.start < 0 || block.start > 1440) {
      errors.push(`Block ${i + 1}: Start time must be 0-1440 minutes`);
    }

    if (typeof block.end !== "number" || block.end < 0 || block.end > 1440) {
      errors.push(`Block ${i + 1}: End time must be 0-1440 minutes`);
    }

    if (block.end <= block.start) {
      errors.push(`Block ${i + 1}: End time must be after start time`);
    }

    if (block.end - block.start < 5) {
      errors.push(`Block ${i + 1}: Duration must be at least 5 minutes`);
    }
  });

  // Check for overlaps
  const sortedBlocks = [...plan.blocks].sort((a, b) => a.start - b.start);
  for (let i = 0; i < sortedBlocks.length - 1; i++) {
    if (sortedBlocks[i].end > sortedBlocks[i + 1].start) {
      errors.push(`Overlap detected: "${sortedBlocks[i].title}" ends at ${sortedBlocks[i].end} but "${sortedBlocks[i + 1].title}" starts at ${sortedBlocks[i + 1].start}`);
    }
  }

  // Check for sleep block
  const hasSleep = plan.blocks.some(b => b.type === "sleep");
  if (!hasSleep) {
    errors.push("Plan must include a sleep block");
  }

  // Check total coverage
  const totalMinutes = plan.blocks.reduce((sum, b) => sum + (b.end - b.start), 0);
  if (totalMinutes > 1440) {
    errors.push(`Total duration ${totalMinutes} minutes exceeds 24 hours`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a day plan from natural language description
 * Uses the AI Day Planning prompt
 */
export async function generateDayPlanFromDescription(
  userDescription: string,
  wakeTime: string = "07:00",
  bedtime: string = "23:00"
): Promise<{
  success: boolean;
  plan?: DayPlanResponse;
  error?: string;
}> {
  if (!userDescription || userDescription.trim().length === 0) {
    return { success: false, error: "Description cannot be empty" };
  }

  const userMessage = `User's wake time: ${wakeTime}
User's preferred bedtime: ${bedtime}

Please plan this day:
"${userDescription}"`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: AI_DAY_PLANNING_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    });

    const content = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content
      : "";

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: "Failed to extract plan from response" };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const plan = DayPlanResponseSchema.parse(parsed);

    // Validate the plan
    const validation = validateDayPlan(plan);
    if (!validation.valid) {
      return {
        success: false,
        error: `Generated plan has issues: ${validation.errors.join("; ")}`,
      };
    }

    return { success: true, plan };
  } catch (error) {
    console.error("Day plan generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during plan generation",
    };
  }
}

/**
 * Convert DayPlanBlock to Task format for Sleepline
 */
export function blockToTask(block: DayPlanBlock, id: string) {
  return {
    id,
    title: block.title,
    startMin: block.start,
    endMin: block.end,
    type: block.type === "sleep" ? "other" : block.type === "wind-down" ? "other" : block.type,
    priority: block.priority,
    status: "pending" as const,
    locked: block.locked,
    notes: "",
  };
}

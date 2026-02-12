/**
 * Sleepline — Server-side AI Planning Router
 * Uses the built-in LLM helper to generate structured day plans
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

// ─── Schemas ─────────────────────────────────────────────────

const TaskTypeEnum = z.enum([
  "work", "study", "class", "exercise", "commute",
  "errand", "creative", "social", "other"
]);

const PriorityEnum = z.enum(["low", "med", "high"]);

const SleepModeEnum = z.enum(["performance", "balanced", "recovery"]);

const AITaskSchema = z.object({
  title: z.string(),
  durationMin: z.number().int().min(5).max(480),
  type: TaskTypeEnum,
  priority: PriorityEnum,
  locked: z.boolean().default(false),
  fixedStartMin: z.number().int().optional(),
  notes: z.string().optional(),
});

const SleepOptionSchema = z.object({
  id: z.string(),
  mode: SleepModeEnum,
  bedtimeMin: z.number().int().min(0).max(1439),
  wakeMin: z.number().int().min(0).max(1439),
  sleepDurationHrs: z.number().min(4).max(14),
  predictedEnergy: z.number().int().min(1).max(10),
  rationale: z.string(),
});

const AIPlanPreviewSchema = z.object({
  tasks: z.array(AITaskSchema),
  constraints: z.object({
    wakeMin: z.number().int(),
    bedtimeMin: z.number().int(),
    breakFrequency: z.enum(["every-30m", "every-60m", "every-90m", "none"]),
    includeSnacks: z.boolean(),
  }),
  sleepOptions: z.array(SleepOptionSchema).min(1).max(3),
  warnings: z.array(z.string()).default([]),
});

// ─── System Prompt ───────────────────────────────────────────

const SYSTEM_PROMPT = `You are Sleepline AI, a sleep-optimized day planner. You MUST return ONLY valid JSON matching the exact schema below. No markdown, no explanation, no extra text.

SCHEMA:
{
  "tasks": [
    {
      "title": "string (task name)",
      "durationMin": number (5-480, duration in minutes),
      "type": "work" | "study" | "class" | "exercise" | "commute" | "errand" | "creative" | "social" | "other",
      "priority": "low" | "med" | "high",
      "locked": boolean (true if user specified exact time),
      "fixedStartMin": number (optional, minutes from midnight if locked, e.g. 540 = 9:00 AM),
      "notes": "string (optional)"
    }
  ],
  "constraints": {
    "wakeMin": number (minutes from midnight),
    "bedtimeMin": number (minutes from midnight),
    "breakFrequency": "every-30m" | "every-60m" | "every-90m" | "none",
    "includeSnacks": boolean
  },
  "sleepOptions": [
    {
      "id": "string (unique id like 'perf-1', 'bal-1', 'rec-1')",
      "mode": "performance" | "balanced" | "recovery",
      "bedtimeMin": number,
      "wakeMin": number,
      "sleepDurationHrs": number,
      "predictedEnergy": number (1-10),
      "rationale": "string"
    }
  ],
  "warnings": ["string (any scheduling concerns)"]
}

RULES:
- Parse the user's description into discrete tasks with realistic durations
- Fixed commitments (school 8-3, work 9-5) should be locked with fixedStartMin
- Convert times to minutes from midnight: 9:00 AM = 540, 5:00 PM = 1020, 10:30 PM = 1350
- Assign appropriate types and priorities
- Generate exactly 3 sleep options (performance, balanced, recovery)
- Performance: earlier bedtime, earlier wake, 8+ hours sleep, high energy
- Balanced: user's preferred times, meets sleep goal
- Recovery: later bedtime, later wake, extra sleep for recovery
- Add warnings if the day seems overloaded or if heavy tasks are scheduled late
- Return ONLY the JSON object, nothing else`;

// ─── Router ──────────────────────────────────────────────────

export const aiRouter = router({
  generatePlan: publicProcedure
    .input(z.object({
      userPrompt: z.string().min(1),
      wakeTime: z.string(),
      bedtime: z.string(),
      sleepGoalHrs: z.number(),
      chronotype: z.string(),
      breakFrequency: z.string(),
      snackWindows: z.boolean(),
      checkIn: z.object({
        sleepHours: z.number(),
        sleepQuality: z.number(),
        morningEnergy: z.number(),
        stressLevel: z.number(),
        workload: z.string(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const { userPrompt, wakeTime, bedtime, sleepGoalHrs, chronotype, breakFrequency, snackWindows, checkIn } = input;

      const wakeMin = timeToMin(wakeTime);
      const bedtimeMin = timeToMin(bedtime);

      const contextMessage = `User context:
- Wake time: ${wakeTime}
- Preferred bedtime: ${bedtime}
- Sleep goal: ${sleepGoalHrs} hours
- Chronotype: ${chronotype}
- Break frequency: ${breakFrequency}
- Wants snack windows: ${snackWindows}
${checkIn ? `- Last night sleep: ${checkIn.sleepHours}h, quality ${checkIn.sleepQuality}/5, energy ${checkIn.morningEnergy}/5, stress ${checkIn.stressLevel}/5, workload: ${checkIn.workload}` : ""}

User's day description: "${userPrompt}"

Generate a structured day plan. Use wakeMin=${wakeMin} and bedtimeMin=${bedtimeMin} in constraints.`;

      let attempt = 0;
      const maxAttempts = 2;

      while (attempt < maxAttempts) {
        try {
          const result = await invokeLLM({
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: contextMessage },
            ],
            response_format: { type: "json_object" },
          });

          const content = typeof result.choices[0]?.message?.content === "string"
            ? result.choices[0].message.content
            : "";

          const jsonStr = extractJSON(content);
          const parsed = JSON.parse(jsonStr);

          // Ensure IDs exist on sleep options
          if (parsed.sleepOptions) {
            parsed.sleepOptions = parsed.sleepOptions.map((opt: any, i: number) => ({
              ...opt,
              id: opt.id || `opt-${i}`,
            }));
          }

          const validated = AIPlanPreviewSchema.parse(parsed);
          return { success: true, preview: validated };

        } catch (error) {
          attempt++;
          console.error(`AI plan generation attempt ${attempt} failed:`, error);
          if (attempt >= maxAttempts) {
            return { success: false, preview: null, error: "AI plan generation failed after retries" };
          }
        }
      }

      return { success: false, preview: null, error: "AI plan generation failed" };
    }),
});

// ─── Helpers ─────────────────────────────────────────────────

function timeToMin(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function extractJSON(text: string): string {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  return text;
}

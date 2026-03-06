/**
 * AI Day Review
 * 
 * Analyzes user's daily performance and generates intelligent coaching insights.
 * Provides observations on productivity, suggestions for tomorrow, and sleep insights.
 */

import { z } from "zod";
import { invokeLLM } from "./_core/llm";

// ─── Schemas ─────────────────────────────────────────────────

export const DayReviewSchema = z.object({
  productivityObservation: z.string().min(10).max(200),
  tomorrowSuggestion: z.string().min(10).max(200),
  sleepInsight: z.string().min(10).max(200),
  overallMood: z.enum(["great", "good", "neutral", "challenging"]).default("neutral"),
});

export type DayReview = z.infer<typeof DayReviewSchema>;

// ─── System Prompt ───────────────────────────────────────────

export const DAY_REVIEW_SYSTEM_PROMPT = `You are an intelligent sleep and productivity coach. Your role is to analyze a user's daily schedule and completion results, then provide thoughtful, actionable coaching insights.

When analyzing a day, consider:
- How many tasks were completed vs planned
- Task types and priorities
- Sleep timing and duration
- Energy patterns throughout the day
- Realistic assessment of productivity

Provide exactly 3 insights in JSON format:
1. productivityObservation: One short observation about today's productivity (max 200 chars)
2. tomorrowSuggestion: One specific, actionable suggestion for improving tomorrow's schedule (max 200 chars)
3. sleepInsight: One insight about sleep timing and its impact on the day (max 200 chars)
4. overallMood: Categorize the day as "great", "good", "neutral", or "challenging"

Be encouraging but honest. Focus on patterns, not perfection.
Keep tone warm, supportive, and practical.
Never be judgmental or discouraging.

Return ONLY valid JSON matching this schema:
{
  "productivityObservation": "string",
  "tomorrowSuggestion": "string",
  "sleepInsight": "string",
  "overallMood": "great" | "good" | "neutral" | "challenging"
}`;

// ─── Helper to format task data for LLM ───────────────────────

function formatTasksForReview(tasks: any[]): string {
  if (!tasks || tasks.length === 0) {
    return "No tasks scheduled for today.";
  }

  const taskSummary = tasks.map(t => {
    const status = t.status === "completed" ? "✓" : "○";
    const time = `${Math.floor(t.startMin / 60)}:${String(t.startMin % 60).padStart(2, "0")}`;
    return `${status} ${t.title} (${time}, ${t.type}, priority: ${t.priority})`;
  }).join("\n");

  const completed = tasks.filter(t => t.status === "completed").length;
  const total = tasks.length;

  return `Tasks: ${completed}/${total} completed\n${taskSummary}`;
}

// ─── Main function ───────────────────────────────────────────

export async function generateDayReview(data: {
  tasks: any[];
  completedTasks: number;
  sleepGoal: number; // hours
  actualBedtime?: number; // minutes from midnight
  wakeTime?: number; // minutes from midnight
}): Promise<{
  success: boolean;
  review?: DayReview;
  error?: string;
}> {
  // Validate input
  if (!data.tasks || data.tasks.length === 0) {
    return {
      success: false,
      error: "No tasks data available for review",
    };
  }

  // Build context message
  const tasksSummary = formatTasksForReview(data.tasks);
  const completionRate = ((data.completedTasks / data.tasks.length) * 100).toFixed(0);

  let sleepContext = `Sleep goal: ${data.sleepGoal} hours`;
  if (data.actualBedtime !== undefined && data.wakeTime !== undefined) {
    const bedtimeHour = Math.floor(data.actualBedtime / 60);
    const bedtimeMin = data.actualBedtime % 60;
    const wakeHour = Math.floor(data.wakeTime / 60);
    const wakeMin = data.wakeTime % 60;
    sleepContext += `\nActual bedtime: ${bedtimeHour}:${String(bedtimeMin).padStart(2, "0")}, Wake time: ${wakeHour}:${String(wakeMin).padStart(2, "0")}`;
  }

  const userMessage = `Please analyze this day:

${tasksSummary}

Completion rate: ${completionRate}%
${sleepContext}

Provide a brief, encouraging review with one observation, one suggestion for tomorrow, and one sleep insight.`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: DAY_REVIEW_SYSTEM_PROMPT },
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
      return {
        success: false,
        error: "Failed to parse review response",
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const review = DayReviewSchema.parse(parsed);

    return { success: true, review };
  } catch (error) {
    console.error("Day review generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during review generation",
    };
  }
}

/**
 * Get mood emoji for display
 */
export function getMoodEmoji(mood: DayReview["overallMood"]): string {
  const emojis: Record<DayReview["overallMood"], string> = {
    great: "🌟",
    good: "😊",
    neutral: "😐",
    challenging: "💪",
  };
  return emojis[mood];
}

/**
 * Get mood color for UI
 */
export function getMoodColor(mood: DayReview["overallMood"]): string {
  const colors: Record<DayReview["overallMood"], string> = {
    great: "text-[var(--sl-glow-mint)]",
    good: "text-[var(--sl-glow-cyan)]",
    neutral: "text-[var(--sl-text-muted)]",
    challenging: "text-[var(--sl-glow-amber)]",
  };
  return colors[mood];
}

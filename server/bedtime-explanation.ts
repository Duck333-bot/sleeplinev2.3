/**
 * Bedtime Explanation Generator
 * 
 * Generates calm, trustworthy explanations for recommended bedtimes.
 * Acts as a sleep coach to help users understand why a specific bedtime is recommended.
 */

import { invokeLLM } from "./_core/llm";

// ─── System Prompt ───────────────────────────────────────────

export const BEDTIME_EXPLANATION_PROMPT = `You are a calm, trustworthy sleep coach. Your role is to explain why a specific bedtime is recommended for the user.

Your explanation should:
- Be warm and reassuring, not clinical
- Mention the wake-up time and why it matters
- Reference the schedule intensity if relevant (many tasks, demanding day, etc)
- Explain how the recommended bedtime supports their goals
- Be concise: exactly 1-2 sentences, under 50 words
- Use simple, accessible language
- Never be preachy or judgmental
- Focus on the user's benefit, not sleep science

Tone: Premium, calm, trustworthy, like talking to a wise friend.

Example responses:
"You're waking up early tomorrow with a full schedule. This bedtime gives you enough rest to handle the day with focus and energy."
"With your morning wake-up and several important tasks, getting to bed by 10:30 will help you feel sharp and capable."
"Your schedule tomorrow is demanding. This bedtime ensures you'll have the mental clarity to tackle everything smoothly."`;

// ─── Types ───────────────────────────────────────────────────

export interface BedtimeExplanationInput {
  recommendedBedtime: number; // Minutes from midnight
  wakeTime: number;           // Minutes from midnight
  tasks: any[];               // Array of tasks
  sleepGoal: number;          // Hours
}

export interface BedtimeExplanationResult {
  success: boolean;
  explanation?: string;
  error?: string;
}

// ─── Helper to format time ───────────────────────────────────

function minToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${String(m).padStart(2, "0")} ${period}`;
}

// ─── Helper to analyze schedule intensity ─────────────────────

function analyzeScheduleIntensity(tasks: any[]): string {
  if (!tasks || tasks.length === 0) {
    return "a light schedule";
  }

  const highPriorityCount = tasks.filter(t => t.priority === "high").length;
  const totalTasks = tasks.length;

  if (highPriorityCount >= totalTasks * 0.5) {
    return "a demanding schedule with several important tasks";
  } else if (totalTasks >= 5) {
    return "a full schedule";
  } else if (totalTasks >= 3) {
    return "a moderately busy schedule";
  } else {
    return "a light schedule";
  }
}

// ─── Main function ───────────────────────────────────────────

export async function generateBedtimeExplanation(
  input: BedtimeExplanationInput
): Promise<BedtimeExplanationResult> {
  try {
    // Validate input
    if (input.recommendedBedtime < 0 || input.recommendedBedtime > 1439) {
      return {
        success: false,
        error: "Invalid bedtime",
      };
    }

    if (input.wakeTime < 0 || input.wakeTime > 1439) {
      return {
        success: false,
        error: "Invalid wake time",
      };
    }

    // Build context for LLM
    const bedtimeStr = minToTime(input.recommendedBedtime);
    const wakeTimeStr = minToTime(input.wakeTime);
    const scheduleIntensity = analyzeScheduleIntensity(input.tasks);
    const sleepGoalStr = input.sleepGoal.toFixed(1);

    const userContext = `Recommended bedtime: ${bedtimeStr}
Wake-up time: ${wakeTimeStr}
Sleep goal: ${sleepGoalStr} hours
Tomorrow's schedule: ${scheduleIntensity}
Number of tasks: ${input.tasks?.length || 0}

Please explain why this bedtime is recommended. Keep it to 1-2 sentences, under 50 words.`;

    // Call LLM
    const result = await invokeLLM({
      messages: [
        { role: "system", content: BEDTIME_EXPLANATION_PROMPT },
        { role: "user", content: userContext },
      ],
    });

    const content = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content.trim()
      : "";

    if (!content) {
      return {
        success: false,
        error: "Empty response from LLM",
      };
    }

    // Validate response length (should be under 50 words)
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 80) {
      // Allow some flexibility, but warn if too long
      console.warn(`Bedtime explanation is ${wordCount} words (target: <50)`);
    }

    return {
      success: true,
      explanation: content,
    };
  } catch (error) {
    console.error("Bedtime explanation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ─── Fallback explanation ───────────────────────────────────

export const FALLBACK_EXPLANATION =
  "This bedtime supports your wake-up goal and tomorrow's schedule.";

/**
 * Schedule Optimizer
 * 
 * Uses AI to reorganize tasks for better focus, energy alignment, and sleep consistency.
 * Respects constraints: task durations, no overlaps, sleep blocks, chronological order.
 */

import { z } from "zod";
import { invokeLLM } from "./_core/llm";

// ─── Schemas ─────────────────────────────────────────────────

export const OptimizedBlockSchema = z.object({
  title: z.string().min(1),
  start: z.number().int().min(0).max(1439),
  end: z.number().int().min(1).max(1440),
  type: z.string().optional(),
  priority: z.string().optional(),
});

export type OptimizedBlock = z.infer<typeof OptimizedBlockSchema>;

export const OptimizationResultSchema = z.object({
  blocks: z.array(OptimizedBlockSchema),
  reason: z.string().min(5).max(120), // Enforce short explanation
  improvements: z.array(z.string()).optional(),
});

export type OptimizationResult = z.infer<typeof OptimizationResultSchema>;

// ─── System Prompt ───────────────────────────────────────────

export const SCHEDULE_OPTIMIZATION_PROMPT = `You are a schedule optimization assistant.

Your task: Improve the user's daily schedule for better focus, energy, and sleep.

RULES (NEVER BREAK):
1. Keep task durations EXACTLY the same
2. Avoid overlaps
3. Preserve sleep blocks
4. Maintain chronological order
5. Do not move locked tasks

OPTIMIZATION STRATEGY:
- Move deep focus tasks (study, work) to morning (6am-10am)
- Place light tasks mid-day
- Use afternoon for exercise or recovery
- Keep sleep timing consistent

Return ONLY valid JSON:
{
  "blocks": [
    {
      "title": "Task Title",
      "start": 480,
      "end": 540,
      "type": "study",
      "priority": "high"
    }
  ],
  "reason": "Brief explanation under 120 characters"
}

IMPORTANT:
- Keep "reason" under 120 characters
- Include ALL tasks in "blocks"
- Times in minutes since midnight (0-1440)
- Return only JSON, no other text`;

// ─── Helper to format schedule for LLM ───────────────────────

function formatScheduleForOptimization(data: {
  tasks: any[];
  wakeTime: number;
  bedtime: number;
  sleepDurationHrs: number;
}): string {
  const { tasks, wakeTime, bedtime, sleepDurationHrs } = data;

  const timeStr = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const taskLines = tasks.map(t => {
    const locked = t.locked ? " [LOCKED]" : "";
    const duration = t.endMin - t.startMin;
    return `- ${t.title} (${timeStr(t.startMin)}-${timeStr(t.endMin)}, ${duration}min, type: ${t.type}, priority: ${t.priority})${locked}`;
  }).join("\n");

  return `Current Schedule:
Wake: ${timeStr(wakeTime)}
Sleep: ${timeStr(bedtime)}
Sleep Duration: ${sleepDurationHrs} hours

Tasks:
${taskLines}

Please optimize this schedule for better focus, energy alignment, and sleep consistency.`;
}

// ─── Main function ───────────────────────────────────────────

export async function optimizeSchedule(data: {
  tasks: any[];
  wakeTime: number;
  bedtime: number;
  sleepDurationHrs?: number;
}): Promise<{
  success: boolean;
  optimization?: OptimizationResult;
  error?: string;
}> {
  // Validate input
  if (!data.tasks || data.tasks.length === 0) {
    return {
      success: false,
      error: "No tasks to optimize",
    };
  }

  if (data.wakeTime < 0 || data.wakeTime > 1439) {
    return {
      success: false,
      error: "Invalid wake time",
    };
  }

  if (data.bedtime < 0 || data.bedtime > 1439) {
    return {
      success: false,
      error: "Invalid bedtime",
    };
  }

  const sleepDurationHrs = data.sleepDurationHrs || 8;

  // Build context message
  const scheduleContext = formatScheduleForOptimization({
    tasks: data.tasks,
    wakeTime: data.wakeTime,
    bedtime: data.bedtime,
    sleepDurationHrs,
  });

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: SCHEDULE_OPTIMIZATION_PROMPT },
        { role: "user", content: scheduleContext },
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
        error: "Failed to parse optimization response",
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Safeguard: truncate reason if it exceeds 120 characters
    if (parsed.reason && typeof parsed.reason === "string" && parsed.reason.length > 120) {
      parsed.reason = parsed.reason.slice(0, 120).trim();
    }
    
    const optimization = OptimizationResultSchema.parse(parsed);

    // Validate that blocks are properly ordered and non-overlapping
    for (let i = 0; i < optimization.blocks.length - 1; i++) {
      const current = optimization.blocks[i];
      const next = optimization.blocks[i + 1];

      // Check for overlap
      if (current.end > next.start) {
        return {
          success: false,
          error: "Optimization created overlapping tasks. Your schedule remains unchanged.",
        };
      }
      
      // Check that times are within valid range
      if (current.start < 0 || current.start > 1440 || current.end < 0 || current.end > 1440) {
        return {
          success: false,
          error: "Optimization produced invalid times. Your schedule remains unchanged.",
        };
      }
      
      // Check that end > start
      if (current.end <= current.start) {
        return {
          success: false,
          error: "Optimization produced invalid task duration. Your schedule remains unchanged.",
        };
      }
    }

    // Validate that durations match original tasks
    const originalDurations = new Map(
      data.tasks.map(t => [t.title, t.endMin - t.startMin])
    );

    for (const block of optimization.blocks) {
      const originalDuration = originalDurations.get(block.title);
      if (originalDuration !== undefined) {
        const newDuration = block.end - block.start;
        if (newDuration !== originalDuration) {
          return {
            success: false,
            error: `Task duration changed for "${block.title}": was ${originalDuration}min, now ${newDuration}min`,
          };
        }
      }
    }

    return { success: true, optimization };
  } catch (error) {
    console.error("Schedule optimization error:", error);
    
    // Provide user-friendly error message
    let errorMsg = "No optimization needed today";
    if (error instanceof z.ZodError) {
      errorMsg = "Optimization validation failed. Your schedule remains unchanged.";
    } else if (error instanceof Error) {
      errorMsg = error.message.includes("parse") 
        ? "Couldn't parse optimization response. Your schedule remains unchanged."
        : "Optimization failed. Your schedule remains unchanged.";
    }
    
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Convert optimized blocks back to Task format
 */
export function blocksToTasks(
  blocks: OptimizedBlock[],
  originalTasks: any[]
): any[] {
  const taskMap = new Map(originalTasks.map(t => [t.title, t]));

  return blocks.map(block => {
    const original = taskMap.get(block.title);
    if (!original) {
      // System block or new item
      return {
        id: `opt-${Date.now()}-${Math.random()}`,
        title: block.title,
        startMin: block.start,
        endMin: block.end,
        type: block.type || "other",
        priority: block.priority || "med",
        status: "pending",
        locked: false,
      };
    }

    // Preserve original properties, update times
    return {
      ...original,
      startMin: block.start,
      endMin: block.end,
    };
  });
}

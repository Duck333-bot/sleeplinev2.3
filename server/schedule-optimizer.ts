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
  reason: z.string().min(10).max(500),
  improvements: z.array(z.string()).optional(),
});

export type OptimizationResult = z.infer<typeof OptimizationResultSchema>;

// ─── System Prompt ───────────────────────────────────────────

export const SCHEDULE_OPTIMIZATION_PROMPT = `You are a productivity and sleep optimization assistant. Your role is to analyze a user's daily schedule and reorganize tasks to improve focus, energy alignment, and sleep consistency.

When optimizing a schedule, consider:
- Energy levels throughout the day (high focus in morning, dip after lunch, recovery in afternoon)
- Task types and their optimal times (deep work early, admin tasks mid-day, creative work when energized)
- Break frequency and recovery time
- Sleep timing and its impact on next day's energy
- Task priorities and dependencies
- Chronological order (tasks must flow forward in time)

CRITICAL CONSTRAINTS (NEVER BREAK):
1. Keep task durations EXACTLY the same (end - start must not change)
2. Avoid any overlaps between tasks
3. Preserve all sleep blocks exactly as they are
4. Maintain strict chronological order (no task can start before the previous one ends)
5. Do not move locked tasks (marked as "locked": true)
6. Keep system blocks (breaks, wind-down) in place

OPTIMIZATION GOALS:
1. Move deep focus tasks (study, work) to peak energy windows (usually 6am-10am, 2pm-4pm)
2. Place exercise during energy dips or recovery windows
3. Group similar task types together when possible
4. Ensure adequate breaks between intense tasks
5. Align bedtime with sleep goal

Return ONLY valid JSON matching this schema:
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
  "reason": "Explanation of optimization strategy and improvements",
  "improvements": ["Improvement 1", "Improvement 2"]
}

The "blocks" array should contain ALL tasks and system blocks in optimized order.
Include type and priority from original tasks.`;

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
    const optimization = OptimizationResultSchema.parse(parsed);

    // Validate that blocks are properly ordered and non-overlapping
    for (let i = 0; i < optimization.blocks.length - 1; i++) {
      const current = optimization.blocks[i];
      const next = optimization.blocks[i + 1];

      if (current.end > next.start) {
        return {
          success: false,
          error: `Optimization created overlap between "${current.title}" and "${next.title}"`,
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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during optimization",
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

/**
 * Sleepline — AI Planner v3
 * 
 * ROLE: Extract user intent from natural language
 * - Extract task titles
 * - Extract durations
 * - Extract constraints (before bedtime, after work, etc.)
 * - Extract timing hints (but NOT time math)
 * 
 * DO NOT: Calculate times, place blocks, resolve overlaps
 * That is the scheduler's job.
 */

import { invokeLLM } from "./_core/llm";
import { z } from "zod";

// ============================================================================
// SCHEMAS
// ============================================================================

const ExtractedTaskSchema = z.object({
  title: z.string().describe("Task name"),
  durationMin: z.number().describe("Duration in minutes"),
  constraints: z.array(z.string()).describe("Constraints like 'before bedtime', 'after work'"),
  timingHint: z.string().optional().describe("User's time hint (e.g., '3 PM', 'after school')"),
});

const IntentExtractionSchema = z.object({
  action: z.enum(["add", "modify", "remove", "rebuild"]).describe("What the user wants"),
  tasks: z.array(ExtractedTaskSchema).describe("Tasks to add/modify"),
  globalConstraints: z.array(z.string()).describe("Day-wide constraints"),
  errors: z.array(z.string()).describe("Parsing errors or ambiguities"),
});

type IntentExtraction = z.infer<typeof IntentExtractionSchema>;

// ============================================================================
// INTENT EXTRACTION (NO TIME MATH)
// ============================================================================

export async function extractUserIntent(userRequest: string): Promise<IntentExtraction> {
  const systemPrompt = `You are a structured intent extractor for a scheduling system.

Your ONLY job is to:
1. Extract task titles from user input
2. Extract task durations (in minutes)
3. Extract constraints (e.g., "before bedtime", "after work")
4. Extract timing hints (e.g., "3 PM", "after school")

You are NOT allowed to:
- Calculate times
- Place tasks on a timeline
- Resolve overlaps
- Give health advice
- Output anything except valid JSON

Output ONLY valid JSON matching this schema:
{
  "action": "add" | "modify" | "remove" | "rebuild",
  "tasks": [
    {
      "title": "Task name",
      "durationMin": 60,
      "constraints": ["before bedtime", "high priority"],
      "timingHint": "3 PM" or null
    }
  ],
  "globalConstraints": ["no meetings after 6 PM"],
  "errors": []
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: [{ type: "text" as const, text: systemPrompt }],
        },
        {
          role: "user",
          content: [{ type: "text" as const, text: userRequest }],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "intent_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["add", "modify", "remove", "rebuild"],
              },
              tasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    durationMin: { type: "number" },
                    constraints: { type: "array", items: { type: "string" } },
                    timingHint: { type: ["string", "null"] },
                  },
                  required: ["title", "durationMin", "constraints"],
                },
              },
              globalConstraints: {
                type: "array",
                items: { type: "string" },
              },
              errors: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["action", "tasks", "globalConstraints", "errors"],
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content) {
      return {
        action: "add",
        tasks: [],
        globalConstraints: [],
        errors: ["No response from LLM"],
      };
    }

    // Handle both string and array content
    let jsonStr = typeof content === "string" ? content : "";
    if (Array.isArray(content) && content[0]?.type === "text") {
      jsonStr = (content[0] as any).text;
    }

    const parsed = JSON.parse(jsonStr);
    const validated = IntentExtractionSchema.safeParse(parsed);
    if (!validated.success) {
      console.error("[AI Planner] Validation failed:", validated.error);
      return fallbackExtractIntent(userRequest);
    }
    return validated.data;
  } catch (error) {
    console.error("[AI Planner] LLM call failed:", error);
    
    // Fallback: simple regex-based extraction
    return fallbackExtractIntent(userRequest);
  }
}

// ============================================================================
// FALLBACK: Simple regex extraction (no LLM)
// ============================================================================

function fallbackExtractIntent(userRequest: string): IntentExtraction {
  const lower = userRequest.toLowerCase();
  
  let action: "add" | "modify" | "remove" | "rebuild" = "add";
  if (lower.includes("remove") || lower.includes("delete")) action = "remove";
  else if (lower.includes("change") || lower.includes("modify")) action = "modify";
  else if (lower.includes("rebuild") || lower.includes("redo")) action = "rebuild";
  
  const tasks: z.infer<typeof ExtractedTaskSchema>[] = [];
  const errors: string[] = [];
  
  // Extract duration
  let durationMin = 60; // default
  const durationMatch = userRequest.match(/(\d+)\s*(min|minute|hour|h)/i);
  if (durationMatch) {
    let val = parseInt(durationMatch[1], 10);
    if (durationMatch[2].toLowerCase().startsWith("h")) val *= 60;
    durationMin = val;
  }
  
  // Extract task title (simple heuristic)
  const taskMatch = userRequest.match(/(?:add|schedule|insert|do)\s+([^.]+?)(?:\s+for|\s+\d+|$)/i);
  const taskTitle = taskMatch ? taskMatch[1].trim() : "Task";
  
  // Extract constraints
  const constraints: string[] = [];
  if (lower.includes("before bed")) constraints.push("before bedtime");
  if (lower.includes("after work")) constraints.push("after work");
  if (lower.includes("morning")) constraints.push("morning");
  if (lower.includes("evening")) constraints.push("evening");
  
  // Extract timing hint
  let timingHint: string | undefined;
  const timeMatch = userRequest.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  if (timeMatch) {
    timingHint = timeMatch[0];
  }
  
  if (action === "add" || action === "modify") {
    tasks.push({
      title: taskTitle,
      durationMin,
      constraints,
      timingHint,
    });
  }
  
  if (tasks.length === 0 && action !== "remove") {
    errors.push("Could not extract task from request. Please be more specific.");
  }
  
  return {
    action,
    tasks,
    globalConstraints: [],
    errors,
  };
}

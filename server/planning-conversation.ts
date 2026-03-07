/**
 * AI Day Planning Conversation Module
 * 
 * Enables intelligent multi-turn conversation before generating plans.
 * The AI asks clarifying questions when key information is missing.
 */

import { z } from "zod";
import { invokeLLM } from "./_core/llm";

// ─── Schemas ─────────────────────────────────────────────────

export const ConversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const ClarifyingQuestionsSchema = z.object({
  needsMoreInfo: z.boolean(),
  questions: z.array(z.string()).max(2),
  reason: z.string().max(200),
});

export const PlanningConversationSchema = z.object({
  userInput: z.string(),
  messages: z.array(ConversationMessageSchema),
  clarifications: z.record(z.string(), z.string()),
  isReadyToGenerate: z.boolean(),
});

export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;
export type ClarifyingQuestions = z.infer<typeof ClarifyingQuestionsSchema>;
export type PlanningConversation = z.infer<typeof PlanningConversationSchema>;

// ─── Clarifying Questions Prompt ─────────────────────────────

export const CLARIFYING_QUESTIONS_PROMPT = `You are Sleepline AI, a sleep-aware day planner assistant.

A user has described their day. Your job is to decide if you need more information to build an accurate schedule.

User input: "{userInput}"

Analyze the input and decide:
1. Do you have enough information to build a complete schedule? (wake time, sleep time, task durations, priorities)
2. If NOT, what 1-2 clarifying questions would help you build a better plan?

Return ONLY valid JSON matching this schema:
{
  "needsMoreInfo": boolean,
  "questions": ["question 1", "question 2"],
  "reason": "brief explanation of why you need this info"
}

Key information to look for:
- Wake time (e.g., "wake at 7am")
- Sleep time (e.g., "sleep by 11pm")
- Task durations (e.g., "study 2 hours")
- Priorities (e.g., "study is most important")
- Preferences (e.g., "prefer morning workouts")

If the user has provided most of this, set needsMoreInfo to false and return empty questions array.`;

// ─── Helper Functions ────────────────────────────────────────

/**
 * Determine if AI needs clarifying questions
 */
export async function generateClarifyingQuestions(
  userInput: string
): Promise<ClarifyingQuestions> {
  try {
    const prompt = CLARIFYING_QUESTIONS_PROMPT.replace("{userInput}", userInput);

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a JSON-only assistant. Return ONLY valid JSON, no markdown or explanation.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const messageContent = response.choices[0].message.content;
    const content = typeof messageContent === "string" ? messageContent : "{}";
    const parsed = JSON.parse(content);

    return ClarifyingQuestionsSchema.parse(parsed);
  } catch (error) {
    console.error("Error generating clarifying questions:", error);
    // If LLM fails, assume we have enough info and proceed
    return {
      needsMoreInfo: false,
      questions: [],
      reason: "Unable to generate questions, proceeding with available info",
    };
  }
}

/**
 * Check if input has key planning information
 */
export function hasKeyPlanningInfo(input: string): boolean {
  const lowerInput = input.toLowerCase();

  // Check for time indicators
  const hasWakeTime =
    /wake.*?(at|by)?\s*\d{1,2}(:\d{2})?\s*(am|pm)?/i.test(input) ||
    /\d{1,2}(:\d{2})?\s*(am|pm)?\s*wake/i.test(input);

  const hasSleepTime =
    /sleep.*?(at|by)?\s*\d{1,2}(:\d{2})?\s*(am|pm)?/i.test(input) ||
    /bed.*?(at|by)?\s*\d{1,2}(:\d{2})?\s*(am|pm)?/i.test(input);

  // Check for duration indicators
  const hasDurations =
    /(\d+\s*(hour|hr|h|minute|min|m))|(\d+h)|(\d+m)/i.test(input);

  // Check for task count (at least 2 tasks mentioned)
  const taskCount = (input.match(/[,;]/g) || []).length + 1;

  // If we have wake time, sleep time, and durations, we have enough info
  if (hasWakeTime && hasSleepTime && hasDurations) {
    return true;
  }

  // If we have at least 3 of these signals, we have enough info
  const signals = [hasWakeTime, hasSleepTime, hasDurations, taskCount >= 2];
  return signals.filter(Boolean).length >= 3;
}

/**
 * Build conversation context for plan generation
 */
export function buildConversationContext(
  conversation: PlanningConversation
): string {
  const messages = conversation.messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const clarifications = Object.entries(conversation.clarifications)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  return `
Original request: ${conversation.userInput}

Conversation:
${messages}

Additional clarifications:
${clarifications}
`.trim();
}

/**
 * Initialize conversation state
 */
export function initializeConversation(
  userInput: string
): PlanningConversation {
  return {
    userInput,
    messages: [
      {
        role: "user",
        content: userInput,
      },
    ],
    clarifications: {},
    isReadyToGenerate: false,
  };
}

/**
 * Add user response to conversation
 */
export function addUserResponse(
  conversation: PlanningConversation,
  response: string
): PlanningConversation {
  return {
    ...conversation,
    messages: [
      ...conversation.messages,
      {
        role: "user",
        content: response,
      },
    ],
  };
}

/**
 * Add assistant message to conversation
 */
export function addAssistantMessage(
  conversation: PlanningConversation,
  message: string
): PlanningConversation {
  return {
    ...conversation,
    messages: [
      ...conversation.messages,
      {
        role: "assistant",
        content: message,
      },
    ],
  };
}

/**
 * Mark conversation as ready for plan generation
 */
export function markReadyToGenerate(
  conversation: PlanningConversation
): PlanningConversation {
  return {
    ...conversation,
    isReadyToGenerate: true,
  };
}

/**
 * Planning Conversation tRPC Router
 * 
 * Handles multi-turn conversation for AI day planning
 */

import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  generateClarifyingQuestions,
  hasKeyPlanningInfo,
  initializeConversation,
  addUserResponse,
  addAssistantMessage,
  markReadyToGenerate,
  buildConversationContext,
} from "./planning-conversation";
import { generateDayPlanFromDescription } from "./ai-day-planner";

export const planningConversationRouter = router({
  /**
   * Start conversation and determine if clarifying questions are needed
   */
  startConversation: publicProcedure
    .input(z.object({ userInput: z.string().min(1).max(1000) }))
    .mutation(async ({ input }) => {
      const { userInput } = input;

      // Initialize conversation
      const conversation = initializeConversation(userInput);

      // Check if we already have enough information
      if (hasKeyPlanningInfo(userInput)) {
        return {
          success: true,
          conversation: markReadyToGenerate(conversation),
          needsQuestions: false,
          questions: [],
        };
      }

      // Generate clarifying questions
      const clarifyingQuestions = await generateClarifyingQuestions(userInput);

      if (!clarifyingQuestions.needsMoreInfo) {
        return {
          success: true,
          conversation: markReadyToGenerate(conversation),
          needsQuestions: false,
          questions: [],
        };
      }

      // Add assistant message with questions
      const updatedConversation = addAssistantMessage(
        conversation,
        `Before I build your schedule, I need a bit more information.\n• ${clarifyingQuestions.questions.join("\n• ")}`
      );

      return {
        success: true,
        conversation: updatedConversation,
        needsQuestions: true,
        questions: clarifyingQuestions.questions,
        reason: clarifyingQuestions.reason,
      };
    }),

  /**
   * Process user response to clarifying questions
   */
  respondToQuestions: publicProcedure
    .input(
      z.object({
        conversation: z.any(), // PlanningConversation type
        userResponse: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ input }) => {
      const { conversation, userResponse } = input;

      // Add user response to conversation
      let updatedConversation = addUserResponse(conversation, userResponse);

      // Check if we now have enough information
      const fullContext = buildConversationContext(updatedConversation);
      if (hasKeyPlanningInfo(fullContext)) {
        updatedConversation = markReadyToGenerate(updatedConversation);
        return {
          success: true,
          conversation: updatedConversation,
          isReadyToGenerate: true,
        };
      }

      // Ask follow-up question if needed
      const followUpQuestions = await generateClarifyingQuestions(fullContext);

      if (!followUpQuestions.needsMoreInfo) {
        updatedConversation = markReadyToGenerate(updatedConversation);
        return {
          success: true,
          conversation: updatedConversation,
          isReadyToGenerate: true,
        };
      }

      // Add follow-up question
      updatedConversation = addAssistantMessage(
        updatedConversation,
        `Thanks! One more thing:\n• ${followUpQuestions.questions[0]}`
      );

      return {
        success: true,
        conversation: updatedConversation,
        isReadyToGenerate: false,
        followUpQuestion: followUpQuestions.questions[0],
      };
    }),

  /**
   * Generate day plan from conversation
   */
  generatePlanFromConversation: publicProcedure
    .input(
      z.object({
        conversation: z.any(),
        wakeTime: z.string().optional(),
        bedtime: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { conversation, wakeTime, bedtime } = input;

      if (!conversation.isReadyToGenerate) {
        return {
          success: false,
          error: "Conversation is not ready for plan generation",
        };
      }

      // Build full context from conversation
      const fullContext = buildConversationContext(conversation);

      try {
        // Generate plan using existing AI planner
        const plan = await generateDayPlanFromDescription(fullContext, wakeTime, bedtime);

        return {
          success: true,
          plan,
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate plan",
        };
      }
    }),
});

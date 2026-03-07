/**
 * Planning Conversation Tests
 */

import { describe, it, expect } from "vitest";
import {
  hasKeyPlanningInfo,
  buildConversationContext,
  initializeConversation,
  addUserResponse,
  addAssistantMessage,
  markReadyToGenerate,
} from "./planning-conversation";

describe("Planning Conversation", () => {
  describe("hasKeyPlanningInfo", () => {
    it("should detect wake time", () => {
      expect(hasKeyPlanningInfo("Wake at 7am, study 2h, sleep by 11pm")).toBe(
        true
      );
    });

    it("should detect sleep time", () => {
      expect(hasKeyPlanningInfo("Study 2h, gym 1h, sleep by 10:45pm")).toBe(
        true
      );
    });

    it("should detect task durations with time", () => {
      expect(
        hasKeyPlanningInfo("Wake 7am, study for 2 hours, homework 1.5 hours, sleep 11pm")
      ).toBe(true);
    });

    it("should detect multiple tasks with durations and times", () => {
      expect(
        hasKeyPlanningInfo("Wake 7am, study 2h, homework 1h, gym 1h, sleep 11pm")
      ).toBe(true);
    });

    it("should return false for vague input", () => {
      expect(hasKeyPlanningInfo("I have a lot to do")).toBe(false);
    });

    it("should require at least 3 signals for key info", () => {
      expect(hasKeyPlanningInfo("Study, homework, gym")).toBe(false);
    });

    it("should handle time formats like 07:00", () => {
      expect(
        hasKeyPlanningInfo("Wake 07:00, study 2h, sleep 23:00")
      ).toBe(true);
    });

    it("should handle abbreviated time formats", () => {
      expect(hasKeyPlanningInfo("Wake 7am, study 2h, sleep 11pm")).toBe(true);
    });
  });

  describe("Conversation state management", () => {
    it("should initialize conversation", () => {
      const conv = initializeConversation("Study 2h, gym 1h");
      expect(conv.userInput).toBe("Study 2h, gym 1h");
      expect(conv.messages.length).toBe(1);
      expect(conv.messages[0].role).toBe("user");
      expect(conv.isReadyToGenerate).toBe(false);
    });

    it("should add user response", () => {
      let conv = initializeConversation("Study 2h");
      conv = addUserResponse(conv, "I prefer morning study");
      expect(conv.messages.length).toBe(2);
      expect(conv.messages[1].role).toBe("user");
      expect(conv.messages[1].content).toBe("I prefer morning study");
    });

    it("should add assistant message", () => {
      let conv = initializeConversation("Study 2h");
      conv = addAssistantMessage(conv, "When do you want to wake up?");
      expect(conv.messages.length).toBe(2);
      expect(conv.messages[1].role).toBe("assistant");
      expect(conv.messages[1].content).toBe("When do you want to wake up?");
    });

    it("should mark conversation as ready", () => {
      let conv = initializeConversation("Study 2h, wake 7am, sleep 11pm");
      expect(conv.isReadyToGenerate).toBe(false);
      conv = markReadyToGenerate(conv);
      expect(conv.isReadyToGenerate).toBe(true);
    });
  });

  describe("buildConversationContext", () => {
    it("should build context from conversation", () => {
      let conv = initializeConversation("Study 2h");
      conv = addAssistantMessage(conv, "When do you want to wake up?");
      conv = addUserResponse(conv, "7am");
      const context = buildConversationContext(conv);
      expect(context).toContain("Study 2h");
      expect(context).toContain("When do you want to wake up?");
      expect(context).toContain("7am");
    });

    it("should include original request in context", () => {
      const conv = initializeConversation("Study math 2h, gym 1h");
      const context = buildConversationContext(conv);
      expect(context).toContain("Study math 2h, gym 1h");
    });
  });

  describe("Conversation flow", () => {
    it("should handle multi-turn conversation", () => {
      let conv = initializeConversation("Study 2h, gym 1h");
      conv = addAssistantMessage(conv, "When do you want to wake up?");
      conv = addUserResponse(conv, "7am");
      conv = addAssistantMessage(conv, "What time do you want to sleep?");
      conv = addUserResponse(conv, "11pm");
      conv = markReadyToGenerate(conv);

      expect(conv.messages.length).toBe(5);
      expect(conv.isReadyToGenerate).toBe(true);
      expect(conv.messages[0].role).toBe("user");
      expect(conv.messages[1].role).toBe("assistant");
      expect(conv.messages[2].role).toBe("user");
      expect(conv.messages[3].role).toBe("assistant");
      expect(conv.messages[4].role).toBe("user");
    });
  });
});

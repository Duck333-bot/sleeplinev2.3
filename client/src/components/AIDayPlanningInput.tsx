/**
 * AI Day Planning Input Component with Conversation Support
 * 
 * Flagship feature: "Describe your day, and Sleepline builds the plan around your sleep."
 * 
 * Features:
 * - Natural language input with smart placeholder
 * - Multi-turn conversation with clarifying questions
 * - Quick example prompts
 * - Real-time character count
 * - Loading state with animated feedback
 * - Error handling with retry
 * - Accessible keyboard navigation
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PlanningConversation, type ConversationMessage } from "./PlanningConversation";

interface AIDayPlanningInputProps {
  onPlanGenerated?: (plan: any) => void;
  wakeTime?: string;
  bedtime?: string;
  disabled?: boolean;
}

const EXAMPLE_PROMPTS = [
  {
    text: "I need to study math for 2 hours, finish chemistry homework, go to the gym for 1 hour, and sleep by 10:45.",
    label: "Study + Exercise",
  },
  {
    text: "School 8:00-15:00, homework 2 hours, soccer practice 1.5 hours, dinner with family.",
    label: "School Day",
  },
  {
    text: "Work 9-5 with meetings 10-12 and 2-3, deep work 2 hours, gym after work, dinner prep.",
    label: "Work Day",
  },
  {
    text: "Remote work, 4 hours of focused coding, lunch with friend, evening walk, wind down early for sleep.",
    label: "Deep Focus",
  },
];

type PlanningState = "input" | "conversation" | "generating";

interface ConversationState {
  messages: ConversationMessage[];
  isReadyToGenerate: boolean;
}

export default function AIDayPlanningInput({
  onPlanGenerated,
  wakeTime = "07:00",
  bedtime = "23:00",
  disabled = false,
}: AIDayPlanningInputProps) {
  const [input, setInput] = useState("");
  const [planningState, setPlanningState] = useState<PlanningState>("input");
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationState>({
    messages: [],
    isReadyToGenerate: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Start conversation mutation
  const startConversation = trpc.planningConversation.startConversation.useMutation({
    onSuccess: (result) => {
      setIsLoading(false);
      if (result.success) {
        setConversation({
          messages: result.conversation.messages,
          isReadyToGenerate: result.conversation.isReadyToGenerate,
        });

        if (result.needsQuestions && result.questions.length > 0) {
          setPlanningState("conversation");
          toast.info("I have a few questions", {
            description: "Help me build a better plan for you",
          });
        } else {
          // Skip directly to generation
          generatePlanFromConversation(result.conversation);
        }
      } else {
        setError("Failed to start conversation");
        toast.error("Failed to start conversation");
      }
    },
    onError: (error) => {
      setIsLoading(false);
      const message = error.message || "We couldn't generate that just now";
      setError(message);
      toast.error(message);
    },
  });

  // Respond to questions mutation
  const respondToQuestions = trpc.planningConversation.respondToQuestions.useMutation({
    onSuccess: (result) => {
      setIsLoading(false);
      if (result.success) {
        setConversation({
          messages: result.conversation.messages,
          isReadyToGenerate: result.conversation.isReadyToGenerate,
        });

        if (result.isReadyToGenerate) {
          generatePlanFromConversation(result.conversation);
        } else if (result.followUpQuestion) {
          toast.info("One more thing", {
            description: result.followUpQuestion,
          });
        }
      } else {
        setError("Failed to process response");
        toast.error("Failed to process response");
      }
    },
    onError: (error) => {
      setIsLoading(false);
      const message = error.message || "We couldn't process that";
      setError(message);
      toast.error(message);
    },
  });

  // Generate plan mutation
  const generatePlan = trpc.planningConversation.generatePlanFromConversation.useMutation({
    onSuccess: (result) => {
      setIsLoading(false);
      if (result.success && result.plan) {
        toast.success("Your plan is ready", {
          description: "Review and apply to your day",
        });
        onPlanGenerated?.(result.plan);
        resetForm();
      } else {
        const errorMsg = result.error || "We couldn't generate that just now";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    },
    onError: (error) => {
      setIsLoading(false);
      const message = error.message || "We couldn't generate that just now";
      setError(message);
      toast.error(message);
    },
  });

  const generatePlanFromConversation = (conv: any) => {
    setPlanningState("generating");
    setIsLoading(true);
    generatePlan.mutate({
      conversation: conv,
      wakeTime,
      bedtime,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();

    if (!text) {
      setError("Tell us what you need to do today");
      return;
    }

    if (text.length < 10) {
      setError("Add a bit more detail so we can build the best plan");
      return;
    }

    setError(null);
    setIsLoading(true);
    setPlanningState("conversation");
    startConversation.mutate({ userInput: text });
  };

  const handleConversationMessage = (message: string) => {
    setError(null);
    setIsLoading(true);
    respondToQuestions.mutate({
      conversation,
      userResponse: message,
    });
  };

  const handleSkipQuestions = () => {
    generatePlanFromConversation(conversation);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    setError(null);
  };

  const resetForm = () => {
    setInput("");
    setPlanningState("input");
    setConversation({ messages: [], isReadyToGenerate: false });
    setError(null);
  };

  const charCount = input.length;
  const maxChars = 2000;
  const isNearLimit = charCount > maxChars * 0.8;

  // Render conversation view
  if (planningState === "conversation" || planningState === "generating") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 h-full flex flex-col"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--sl-glow-amber)]" />
            <h2 className="text-lg font-bold tracking-tight">
              {planningState === "generating" ? "Building your plan..." : "Let's refine your plan"}
            </h2>
          </div>
          <p className="text-sm text-[var(--sl-text-muted)]">
            {planningState === "generating"
              ? "Creating your sleep-optimized schedule..."
              : "Help me understand your preferences better"}
          </p>
        </div>

        <div className="flex-1 min-h-0">
          <PlanningConversation
            messages={conversation.messages}
            isLoading={isLoading}
            onSendMessage={handleConversationMessage}
            onSkipQuestions={handleSkipQuestions}
            showSkipButton={!conversation.isReadyToGenerate && !isLoading}
          />
        </div>

        <Button
          onClick={resetForm}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          Start over
        </Button>
      </motion.div>
    );
  }

  // Render input view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Hero text */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--sl-glow-amber)]" />
          <h2
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Describe Your Day
          </h2>
        </div>
        <p
          className="text-sm text-[var(--sl-text-muted)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Tell Sleepline what you need to do, and it will build a sleep-optimized plan around your
          schedule.
        </p>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Text area */}
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            placeholder="e.g., Study math for 2 hours, finish chemistry, go to the gym, and sleep by 10:45."
            disabled={isLoading || disabled}
            maxLength={maxChars}
            rows={4}
            className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[var(--sl-text)] placeholder-[var(--sl-text-muted)] placeholder-opacity-50 focus:border-[var(--sl-glow-periwinkle)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--sl-glow-periwinkle)]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors resize-none"
            style={{ fontFamily: "var(--font-body)" }}
          />

          {/* Character count */}
          <div
            className={`absolute bottom-3 right-3 text-[10px] font-mono transition-colors ${
              isNearLimit
                ? "text-[var(--sl-glow-coral)]"
                : "text-[var(--sl-text-muted)] opacity-50"
            }`}
          >
            {charCount}/{maxChars}
          </div>
        </div>

        {/* Error state */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-start gap-2 p-3 rounded-lg bg-[var(--sl-glow-coral)]/10 border border-[var(--sl-glow-coral)]/20"
            >
              <AlertCircle className="w-4 h-4 text-[var(--sl-glow-coral)] flex-shrink-0 mt-0.5" />
              <p
                className="text-xs text-[var(--sl-glow-coral)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isLoading || disabled || input.trim().length === 0}
            className="flex-1 bg-[var(--sl-glow-periwinkle)] hover:bg-[var(--sl-glow-periwinkle)]/90 text-white font-semibold flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Building your day plan...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Generate Plan</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Quick prompts */}
      <div className="space-y-2">
        <p
          className="text-xs text-[var(--sl-text-muted)] uppercase tracking-[0.1em] font-semibold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Try these examples
        </p>
        <div className="grid grid-cols-2 gap-2">
          {EXAMPLE_PROMPTS.map((prompt, i) => (
            <Button
              key={i}
              onClick={() => handleQuickPrompt(prompt.text)}
              variant="outline"
              size="sm"
              disabled={isLoading || disabled}
              className="text-xs h-auto py-2 px-2 text-left"
            >
              <Zap className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate">{prompt.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

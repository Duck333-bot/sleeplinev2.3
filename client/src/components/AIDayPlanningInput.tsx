/**
 * AI Day Planning Input Component
 * 
 * Flagship feature: "Describe your day, and Sleepline builds the plan around your sleep."
 * 
 * Features:
 * - Natural language input with smart placeholder
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

export default function AIDayPlanningInput({
  onPlanGenerated,
  wakeTime = "07:00",
  bedtime = "23:00",
  disabled = false,
}: AIDayPlanningInputProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePlan = trpc.aiDayPlanner.generateFromDescription.useMutation({
    onSuccess: (result) => {
      setIsLoading(false);
      if (result.success && result.plan) {
        toast.success("Your plan is ready", { description: "Review and apply to your day" });
        onPlanGenerated?.(result.plan);
        setInput("");
        setError(null);
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
    generatePlan.mutate({
      description: text,
      wakeTime,
      bedtime,
    });
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    setError(null);
  };

  const charCount = input.length;
  const maxChars = 2000;
  const isNearLimit = charCount > maxChars * 0.8;

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
          <h2 className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Describe Your Day
          </h2>
        </div>
        <p className="text-sm text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-body)" }}>
          Tell Sleepline what you need to do, and it will build a sleep-optimized plan around your schedule.
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
          <div className={`absolute bottom-3 right-3 text-[10px] font-mono transition-colors ${
            isNearLimit ? "text-[var(--sl-glow-coral)]" : "text-[var(--sl-text-muted)] opacity-50"
          }`}>
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
              <p className="text-xs text-[var(--sl-glow-coral)]" style={{ fontFamily: "var(--font-body)" }}>
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
        <p className="text-xs text-[var(--sl-text-muted)] uppercase tracking-[0.1em] font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
          Try these examples
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EXAMPLE_PROMPTS.map((prompt, i) => (
            <motion.button
              key={i}
              onClick={() => handleQuickPrompt(prompt.text)}
              disabled={isLoading || disabled}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-left p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-[var(--sl-glow-periwinkle)]/30 hover:bg-white/[0.05] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-2">
                <Zap className="w-3 h-3 text-[var(--sl-glow-amber)] flex-shrink-0 mt-1" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[var(--sl-text)]" style={{ fontFamily: "var(--font-heading)" }}>
                    {prompt.label}
                  </p>
                  <p className="text-[9px] text-[var(--sl-text-muted)] line-clamp-2 mt-1" style={{ fontFamily: "var(--font-body)" }}>
                    {prompt.text}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Info text */}
      <div className="p-3 rounded-lg bg-[var(--sl-glow-periwinkle)]/5 border border-[var(--sl-glow-periwinkle)]/10">
        <p className="text-[10px] text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-body)" }}>
          💡 <strong>Tip:</strong> Include specific times (e.g., "school 8-3"), durations (e.g., "2 hours of study"), or just list what you need to do. Sleepline will arrange everything around your sleep.
        </p>
      </div>
    </motion.div>
  );
}

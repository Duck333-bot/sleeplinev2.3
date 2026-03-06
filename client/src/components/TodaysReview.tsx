/**
 * Today's Review Component
 * 
 * Displays AI-generated coaching insights about the day's performance.
 * Shows productivity observation, tomorrow's suggestion, and sleep insight.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, AlertCircle, TrendingUp, Lightbulb, Moon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

interface TodaysReviewProps {
  onClose?: () => void;
}

export default function TodaysReview({ onClose }: TodaysReviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [review, setReview] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const todayPlan = useStore(s => s.todayPlan());
  const generateReviewMutation = trpc.dayReview.generateReview.useMutation({
    onSuccess: (result) => {
      setIsLoading(false);
      if (result.success && result.review) {
        setReview(result.review);
        setError(null);
        toast.success("Review generated!");
      } else {
        setError(result.error || "Failed to generate review");
        toast.error(result.error || "Failed to generate review");
      }
    },
    onError: (error) => {
      setIsLoading(false);
      const message = error.message || "Failed to generate review";
      setError(message);
      toast.error(message);
    },
  });

  // Auto-generate review on mount if we have data
  useEffect(() => {
    if (todayPlan && !review && !isLoading && !error) {
      handleGenerateReview();
    }
  }, [todayPlan?.id]); // Only trigger on plan change

  const handleGenerateReview = () => {
    if (!todayPlan) {
      setError("No plan available for review");
      return;
    }

    setIsLoading(true);
    setError(null);

    const completedCount = todayPlan.tasks.filter(t => t.status === "completed").length;
    const sleepOption = todayPlan.sleepOptions.find(o => o.id === todayPlan.selectedSleepOptionId) || todayPlan.sleepOptions[0];

    generateReviewMutation.mutate({
      tasks: todayPlan.tasks,
      completedTasks: completedCount,
      sleepGoal: sleepOption.sleepDurationHrs,
      wakeTime: sleepOption.wakeMin,
      actualBedtime: sleepOption.bedtimeMin,
    });
  };

  // Empty state
  if (!todayPlan) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.05]"
      >
        <p className="text-xs text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-body)" }}>
          No review available yet.
        </p>
      </motion.div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center gap-3"
      >
        <Loader2 className="w-4 h-4 animate-spin text-[var(--sl-glow-periwinkle)]" />
        <span className="text-xs text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-body)" }}>
          Generating your review...
        </span>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="p-4 rounded-lg bg-[var(--sl-glow-coral)]/10 border border-[var(--sl-glow-coral)]/20 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[var(--sl-glow-coral)] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--sl-glow-coral)]" style={{ fontFamily: "var(--font-heading)" }}>
              Review unavailable
            </p>
            <p className="text-[10px] text-[var(--sl-glow-coral)] opacity-80 mt-1" style={{ fontFamily: "var(--font-body)" }}>
              {error}
            </p>
          </div>
        </div>
        <Button
          onClick={handleGenerateReview}
          size="sm"
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Try again</span>
        </Button>
      </motion.div>
    );
  }

  // Review ready state
  if (review) {
    const moodEmojis: Record<string, string> = {
      great: "🌟",
      good: "😊",
      neutral: "😐",
      challenging: "💪",
    };
    const moodEmoji = moodEmojis[review.overallMood] || "😊";

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {/* Header with mood */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--sl-glow-amber)]" />
            <h3 className="text-sm font-bold text-[var(--sl-text)]" style={{ fontFamily: "var(--font-heading)" }}>
              Today's Review
            </h3>
          </div>
          <span className="text-xl">{moodEmoji}</span>
        </div>

        {/* Productivity Observation */}
        <div className="p-3 rounded-lg bg-[var(--sl-glow-periwinkle)]/5 border border-[var(--sl-glow-periwinkle)]/10">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-[var(--sl-glow-periwinkle)] flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--sl-glow-periwinkle)]" style={{ fontFamily: "var(--font-heading)" }}>
                Productivity
              </p>
              <p className="text-xs text-[var(--sl-text)] mt-1" style={{ fontFamily: "var(--font-body)" }}>
                {review.productivityObservation}
              </p>
            </div>
          </div>
        </div>

        {/* Tomorrow's Suggestion */}
        <div className="p-3 rounded-lg bg-[var(--sl-glow-cyan)]/5 border border-[var(--sl-glow-cyan)]/10">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-[var(--sl-glow-cyan)] flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--sl-glow-cyan)]" style={{ fontFamily: "var(--font-heading)" }}>
                Tomorrow
              </p>
              <p className="text-xs text-[var(--sl-text)] mt-1" style={{ fontFamily: "var(--font-body)" }}>
                {review.tomorrowSuggestion}
              </p>
            </div>
          </div>
        </div>

        {/* Sleep Insight */}
        <div className="p-3 rounded-lg bg-[var(--sl-glow-mint)]/5 border border-[var(--sl-glow-mint)]/10">
          <div className="flex items-start gap-2">
            <Moon className="w-3.5 h-3.5 text-[var(--sl-glow-mint)] flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--sl-glow-mint)]" style={{ fontFamily: "var(--font-heading)" }}>
                Sleep
              </p>
              <p className="text-xs text-[var(--sl-text)] mt-1" style={{ fontFamily: "var(--font-body)" }}>
                {review.sleepInsight}
              </p>
            </div>
          </div>
        </div>

        {/* Regenerate button */}
        <Button
          onClick={handleGenerateReview}
          size="sm"
          variant="outline"
          className="w-full flex items-center justify-center gap-2 mt-2"
        >
          <RefreshCw className="w-3 h-3" />
          <span>New review</span>
        </Button>
      </motion.div>
    );
  }

  // Default: no review generated yet
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.05] text-center">
        <p className="text-xs text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-body)" }}>
          No review available yet.
        </p>
      </div>
      <Button
        onClick={handleGenerateReview}
        size="sm"
        className="w-full bg-[var(--sl-glow-periwinkle)] hover:bg-[var(--sl-glow-periwinkle)]/90 text-white flex items-center justify-center gap-2"
      >
        <Sparkles className="w-3 h-3" />
        <span>Generate review</span>
      </Button>
    </motion.div>
  );
}

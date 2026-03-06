/**
 * Bedtime Explanation Component
 * 
 * Displays a calm, trustworthy explanation for the recommended bedtime.
 * Shows loading state while generating, explanation when ready, or fallback if error.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { SleepOption, Task } from "@/lib/schemas";

interface BedtimeExplanationProps {
  sleepOption: SleepOption;
  tasks: Task[];
  sleepGoal: number;
}

export default function BedtimeExplanation({
  sleepOption,
  tasks,
  sleepGoal,
}: BedtimeExplanationProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const generateExplanationMutation = trpc.bedtimeExplanation.generate.useMutation({
    onSuccess: (result) => {
      setIsLoading(false);
      if (result.success && result.explanation) {
        setExplanation(result.explanation);
        setError(false);
      } else {
        setError(true);
      }
    },
    onError: () => {
      setIsLoading(false);
      setError(true);
    },
  });

  useEffect(() => {
    // Generate explanation when component mounts
    generateExplanationMutation.mutate({
      recommendedBedtime: sleepOption.bedtimeMin,
      wakeTime: sleepOption.wakeMin,
      tasks,
      sleepGoal,
    });
  }, [sleepOption.bedtimeMin, sleepOption.wakeMin, tasks.length, sleepGoal]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-3 p-3 rounded-lg bg-gradient-to-br from-[var(--sl-glow-periwinkle)]/8 to-[var(--sl-glow-cyan)]/5 border border-[var(--sl-glow-periwinkle)]/15"
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <Heart className="w-4 h-4 text-[var(--sl-glow-periwinkle)] flex-shrink-0 mt-0.5" />
        <h4 className="text-xs font-semibold text-[var(--sl-text)]" style={{ fontFamily: "var(--font-heading)" }}>
          Why this bedtime
        </h4>
      </div>

      {/* Content */}
      <div className="ml-6">
        {isLoading ? (
          // Loading state
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 text-[var(--sl-glow-periwinkle)] animate-spin" />
            <p className="text-[11px] text-[var(--sl-text-muted)] italic">
              Preparing your recommendation...
            </p>
          </div>
        ) : error ? (
          // Fallback state
          <p className="text-[11px] text-[var(--sl-text-muted)] leading-relaxed">
            This bedtime supports your wake-up goal and tomorrow's schedule.
          </p>
        ) : (
          // Explanation ready
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-[11px] text-[var(--sl-text-muted)] leading-relaxed"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {explanation}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

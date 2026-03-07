/**
 * Optimization Preview Component
 * 
 * Shows the AI-optimized schedule with before/after comparison.
 * Allows user to apply or cancel the optimization.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, Zap, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { minToDisplay, durationDisplay } from "@/lib/schemas";
import type { Task } from "@/lib/schemas";

interface OptimizationPreviewProps {
  original: Task[];
  optimized: Task[];
  reason: string;
  improvements: string[];
  onApply: () => void;
  onCancel: () => void;
  isApplying?: boolean;
}

export default function OptimizationPreview({
  original,
  optimized,
  reason,
  improvements,
  onApply,
  onCancel,
  isApplying = false,
}: OptimizationPreviewProps) {
  const [expandedReason, setExpandedReason] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--sl-bg-primary)] border border-white/[0.1] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[var(--sl-bg-primary)] border-b border-white/[0.05] p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--sl-glow-cyan)]/15 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[var(--sl-glow-cyan)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--sl-text)]" style={{ fontFamily: "var(--font-heading)" }}>
                Here's a suggested improvement
              </h2>
              <p className="text-xs text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-body)" }}>
                Review the changes and apply if it feels right
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
            disabled={isApplying}
          >
            <X className="w-5 h-5 text-[var(--sl-text-muted)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Reason */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--sl-glow-amber)]" />
              <h3 className="text-sm font-semibold text-[var(--sl-text)]" style={{ fontFamily: "var(--font-heading)" }}>
                Optimization Strategy
              </h3>
            </div>
            <p className="text-sm text-[var(--sl-text-muted)] leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
              {reason}
            </p>
          </div>

          {/* Improvements */}
          {improvements && improvements.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-heading)" }}>
                Key Improvements
              </h3>
              <div className="space-y-2">
                {improvements.map((improvement, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
                    <CheckCircle2 className="w-4 h-4 text-[var(--sl-glow-mint)] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--sl-text)]" style={{ fontFamily: "var(--font-body)" }}>
                      {improvement}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comparison */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-heading)" }}>
              Schedule Comparison
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-heading)" }}>
                  CURRENT
                </p>
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {original.map((task) => (
                    <div
                      key={task.id}
                      className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]"
                    >
                      <p className="text-[10px] font-medium text-[var(--sl-text)]" style={{ fontFamily: "var(--font-heading)" }}>
                        {task.title}
                      </p>
                      <p className="text-[9px] text-[var(--sl-text-muted)] mt-0.5" style={{ fontFamily: "var(--font-mono)" }}>
                        {minToDisplay(task.startMin)} – {minToDisplay(task.endMin)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optimized */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-[var(--sl-glow-cyan)]" style={{ fontFamily: "var(--font-heading)" }}>
                  OPTIMIZED
                </p>
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {optimized.map((task) => {
                    const originalTask = original.find(t => t.title === task.title);
                    const moved = originalTask && (originalTask.startMin !== task.startMin || originalTask.endMin !== task.endMin);

                    return (
                      <div
                        key={task.id}
                        className={`p-2 rounded-lg border transition-colors ${
                          moved
                            ? "bg-[var(--sl-glow-cyan)]/10 border-[var(--sl-glow-cyan)]/30"
                            : "bg-white/[0.02] border-white/[0.05]"
                        }`}
                      >
                        <p className="text-[10px] font-medium text-[var(--sl-text)]" style={{ fontFamily: "var(--font-heading)" }}>
                          {task.title}
                        </p>
                        <p className={`text-[9px] mt-0.5 ${moved ? "text-[var(--sl-glow-cyan)]" : "text-[var(--sl-text-muted)]"}`} style={{ fontFamily: "var(--font-mono)" }}>
                          {minToDisplay(task.startMin)} – {minToDisplay(task.endMin)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--sl-bg-primary)] border-t border-white/[0.05] p-4 flex gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
            disabled={isApplying}
          >
            Cancel
          </Button>
          <Button
            onClick={onApply}
            className="flex-1 bg-[var(--sl-glow-cyan)] hover:bg-[var(--sl-glow-cyan)]/90 text-white flex items-center justify-center gap-2"
            disabled={isApplying}
          >
            {isApplying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Applying optimization...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply to my day</span>
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

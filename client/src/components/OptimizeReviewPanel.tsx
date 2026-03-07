/**
 * Optimize Review Panel Component
 * 
 * Right-side slide-over panel for reviewing schedule optimizations.
 * Mounted at page level, not inside timeline.
 * Displays improvements summary, before/after comparison, and AI reasoning.
 */

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { minToDisplay } from "@/lib/schemas";
import type { Task } from "@/lib/schemas";

interface OptimizeReviewPanelProps {
  isOpen: boolean;
  original: Task[];
  optimized: Task[];
  summary: string[];
  reason: string;
  onApply: () => void;
  onCancel: () => void;
  isApplying?: boolean;
}

export default function OptimizeReviewPanel({
  isOpen,
  original,
  optimized,
  summary,
  reason,
  onApply,
  onCancel,
  isApplying = false,
}: OptimizeReviewPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/30 z-40"
            style={{ pointerEvents: isApplying ? "none" : "auto" }}
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[420px] bg-[var(--sl-bg-primary)] border-l border-white/[0.1] z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex-shrink-0 border-b border-white/[0.05] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[var(--sl-text)]" style={{ fontFamily: "var(--font-heading)" }}>
                    Optimize Schedule
                  </h2>
                  <p className="text-sm text-[var(--sl-text-muted)] mt-1" style={{ fontFamily: "var(--font-body)" }}>
                    Review the suggested improvements before applying them.
                  </p>
                </div>
                <button
                  onClick={onCancel}
                  className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors flex-shrink-0"
                  disabled={isApplying}
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-[var(--sl-text-muted)]" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Improvements Summary */}
              {summary.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-heading)" }}>
                    Improvements
                  </p>
                  <div className="space-y-2">
                    {summary.map((bullet, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--sl-glow-cyan)] mt-2 flex-shrink-0" />
                        <p className="text-sm text-[var(--sl-text)]" style={{ fontFamily: "var(--font-body)" }}>
                          {bullet}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Before / After Comparison */}
              <div className="space-y-4">
                {/* Before */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-heading)" }}>
                    Current
                  </p>
                  <div className="space-y-1.5">
                    {original.map((task) => (
                      <div key={task.id} className="text-sm text-[var(--sl-text)]" style={{ fontFamily: "var(--font-body)" }}>
                        <div className="font-medium">{task.title}</div>
                        <div className="text-xs text-[var(--sl-text-muted)] mt-0.5">
                          {minToDisplay(task.startMin)}–{minToDisplay(task.endMin)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* After */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--sl-glow-cyan)]" style={{ fontFamily: "var(--font-heading)" }}>
                    Suggested
                  </p>
                  <div className="space-y-1.5">
                    {optimized.map((task) => {
                      const orig = original.find(t => t.title === task.title);
                      const moved = orig && (orig.startMin !== task.startMin || orig.endMin !== task.endMin);
                      
                      return (
                        <div 
                          key={task.id} 
                          className={`text-sm ${moved ? "text-[var(--sl-glow-cyan)]" : "text-[var(--sl-text)]"}`}
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          <div className="font-medium">{task.title}</div>
                          <div className={`text-xs mt-0.5 ${moved ? "text-[var(--sl-glow-cyan)]/70" : "text-[var(--sl-text-muted)]"}`}>
                            {minToDisplay(task.startMin)}–{minToDisplay(task.endMin)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Why This Works */}
              {reason && (
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <p className="text-xs text-[var(--sl-text-muted)] uppercase tracking-[0.1em] font-semibold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                    Why this works
                  </p>
                  <p className="text-sm text-[var(--sl-text)]" style={{ fontFamily: "var(--font-body)" }}>
                    {reason}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex-shrink-0 border-t border-white/[0.05] p-4 bg-white/[0.01] space-y-3">
              <Button
                onClick={onCancel}
                variant="outline"
                className="w-full"
                disabled={isApplying}
              >
                Keep Current Plan
              </Button>
              <Button
                onClick={onApply}
                className="w-full bg-[var(--sl-glow-cyan)] hover:bg-[var(--sl-glow-cyan)]/90 text-white flex items-center justify-center gap-2"
                disabled={isApplying}
              >
                {isApplying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Applying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply Optimization</span>
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

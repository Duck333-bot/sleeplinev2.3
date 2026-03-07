/**
 * Optimization Review Sheet Component
 * 
 * Premium, minimal review modal for schedule optimization.
 * Shows suggested changes with before/after comparison.
 * Designed for quick scanning and confident decision-making.
 */

import { motion } from "framer-motion";
import { X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { minToDisplay } from "@/lib/schemas";
import type { Task } from "@/lib/schemas";

interface OptimizationReviewSheetProps {
  original: Task[];
  optimized: Task[];
  reason: string;
  onApply: () => void;
  onCancel: () => void;
  isApplying?: boolean;
}

export default function OptimizationReviewSheet({
  original,
  optimized,
  reason,
  onApply,
  onCancel,
  isApplying = false,
}: OptimizationReviewSheetProps) {
  // Generate summary of what changed
  const generateSummary = () => {
    const changes: string[] = [];
    
    optimized.forEach((opt) => {
      const orig = original.find(t => t.title === opt.title);
      if (!orig) return;
      
      const moved = orig.startMin !== opt.startMin || orig.endMin !== opt.endMin;
      if (!moved) return;
      
      const origTime = `${minToDisplay(orig.startMin)}–${minToDisplay(orig.endMin)}`;
      const optTime = `${minToDisplay(opt.startMin)}–${minToDisplay(opt.endMin)}`;
      
      // Determine direction and reason
      if (opt.startMin < orig.startMin) {
        changes.push(`Moved "${opt.title}" earlier for better focus`);
      } else if (opt.startMin > orig.startMin) {
        changes.push(`Moved "${opt.title}" later for better energy alignment`);
      }
    });
    
    // Return max 3 changes
    return changes.slice(0, 3);
  };

  const summary = generateSummary();
  const hasChanges = summary.length > 0;

  // Handle Escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
      onKeyDown={handleKeyDown}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--sl-bg-primary)] border border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl"
      >
        {/* Header */}
        <div className="relative p-6 border-b border-white/[0.05]">
          <div>
            <h2 className="text-xl font-bold text-[var(--sl-text)]" style={{ fontFamily: "var(--font-heading)" }}>
              Suggested changes
            </h2>
            <p className="text-sm text-[var(--sl-text-muted)] mt-1" style={{ fontFamily: "var(--font-body)" }}>
              Review the adjustments before applying them.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="absolute top-6 right-6 p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors"
            disabled={isApplying}
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[var(--sl-text-muted)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Summary Bullets */}
          {hasChanges && (
            <div className="space-y-2">
              {summary.map((change, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--sl-glow-cyan)] mt-2 flex-shrink-0" />
                  <p className="text-sm text-[var(--sl-text)]" style={{ fontFamily: "var(--font-body)" }}>
                    {change}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Before/After Comparison */}
          <div className="space-y-4">
            {/* Before */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-heading)" }}>
                Current
              </p>
              <div className="space-y-1.5">
                {original.map((task) => (
                  <div key={task.id} className="text-sm text-[var(--sl-text)]" style={{ fontFamily: "var(--font-body)" }}>
                    <span className="font-medium">{task.title}</span>
                    <span className="text-[var(--sl-text-muted)] ml-2">
                      {minToDisplay(task.startMin)}–{minToDisplay(task.endMin)}
                    </span>
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
                  const original_task = original.find(t => t.title === task.title);
                  const moved = original_task && (original_task.startMin !== task.startMin || original_task.endMin !== task.endMin);
                  
                  return (
                    <div 
                      key={task.id} 
                      className={`text-sm ${moved ? "text-[var(--sl-glow-cyan)]" : "text-[var(--sl-text)]"}`}
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      <span className="font-medium">{task.title}</span>
                      <span className={moved ? "text-[var(--sl-glow-cyan)]/70 ml-2" : "text-[var(--sl-text-muted)] ml-2"}>
                        {minToDisplay(task.startMin)}–{minToDisplay(task.endMin)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Reason */}
          {reason && (
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <p className="text-xs text-[var(--sl-text-muted)] uppercase tracking-[0.1em] font-semibold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                Why this works
              </p>
              <p className="text-sm text-[var(--sl-text)]" style={{ fontFamily: "var(--font-body)" }}>
                {reason}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.05] p-4 flex gap-3 bg-white/[0.01]">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
            disabled={isApplying}
          >
            Keep current plan
          </Button>
          <Button
            onClick={onApply}
            className="flex-1 bg-[var(--sl-glow-cyan)] hover:bg-[var(--sl-glow-cyan)]/90 text-white flex items-center justify-center gap-2"
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
                <span>Apply changes</span>
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * AIPlanPanel — Left Column
 * "Plan My Day" interface that:
 * - Gathers info via chat-like prompts
 * - Generates structured plan previews via server-side AI
 * - Renders Action Cards (not just chat bubbles)
 * 
 * IMPROVED: Premium hierarchy, clearer microcopy, better spacing
 */

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { generatePlanPreview } from "@/lib/ai-planner";
import { PlanPreviewCard } from "./ActionCard";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, Wand2, RotateCcw, Zap } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const QUICK_PROMPTS = [
  { text: "School 8:00-15:00, homework 2h, soccer practice 1h", label: "School Day" },
  { text: "Work 9-5, gym after work 1h, dinner prep 45m", label: "Work Day" },
  { text: "Study for exams 4h, lunch with friends, evening walk 30m", label: "Study Focus" },
  { text: "Remote work 9-5, meetings 10-12 and 2-3, deep work 2h", label: "Deep Work" },
];

export default function AIPlanPanel() {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const previewPlan = useStore(s => s.previewPlan);
  const setPreviewPlan = useStore(s => s.setPreviewPlan);
  const todayPlan = useStore(s => s.todayPlan());
  const user = useStore(s => s.user);
  const aiMessages = useStore(s => s.aiMessages);
  const addAiMessage = useStore(s => s.addAiMessage);
  const clearAiMessages = useStore(s => s.clearAiMessages);
  const todayCheckIn = useStore(s => s.todayCheckIn());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get tRPC client for server-side AI
  const trpcUtils = trpc.useUtils();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiMessages, previewPlan]);

  const handleSubmit = async (prompt?: string) => {
    const text = prompt || input.trim();
    if (!text || !user) return;

    setInput("");
    addAiMessage("user", text);
    setIsGenerating(true);

    try {
      // Pass the tRPC client to the planner for server-side AI
      const plan = await generatePlanPreview(
        {
          userPrompt: text,
          onboarding: user.onboarding,
          checkIn: todayCheckIn,
        },
        trpcUtils.client as any
      );

      setPreviewPlan(plan);
      addAiMessage("assistant", `Plan ready with ${plan.tasks.length} tasks and ${plan.systemBlocks.length} breaks. Review and apply when it feels right.`);
    } catch (error) {
      console.error("Plan generation failed:", error);
      addAiMessage("assistant", "We couldn't generate that plan. Try adding more details about your day.");
      toast.error("We couldn't generate that just now. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewPlan = () => {
    clearAiMessages();
    setPreviewPlan(null);
  };

  const showWelcome = aiMessages.length === 0 && !todayPlan;
  const showActivePlan = todayPlan && !previewPlan && aiMessages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--sl-glow-periwinkle)]/25 to-[var(--sl-glow-cyan)]/15 flex items-center justify-center ring-1 ring-[var(--sl-glow-periwinkle)]/20">
            <Wand2 className="w-4 h-4 text-[var(--sl-glow-periwinkle)]" />
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-heading)" }}>
              Plan Your Day
            </h2>
            <p className="text-[8px] text-[var(--sl-text-muted)] opacity-60 mt-0.5">
              AI-powered scheduling
            </p>
          </div>
        </div>
        {(aiMessages.length > 0 || todayPlan) && (
          <button
            onClick={handleNewPlan}
            className="text-[9px] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 text-[var(--sl-text-muted)] hover:bg-white/10 transition-colors font-medium"
            style={{ fontFamily: "var(--font-heading)" }}
            title="Start a new plan"
          >
            <RotateCcw className="w-3 h-3" /> New
          </button>
        )}
      </div>

      {/* Messages + Cards area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 min-h-0">
        {/* Welcome state */}
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.06]">
              <p className="text-xs text-[var(--sl-text-muted)] leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                Tell Sleepline what you need to do, and it will build a sleep-optimized plan around your schedule.
              </p>
            </div>

            {/* Quick prompts */}
            <div className="space-y-2">
              <p className="text-[8px] text-[var(--sl-text-muted)] uppercase tracking-[0.2em] font-semibold opacity-50" style={{ fontFamily: "var(--font-heading)" }}>
                Quick Start
              </p>
              <div className="space-y-2">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmit(prompt.text)}
                    disabled={isGenerating}
                    className="w-full text-left p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/[0.1] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-[10px] font-semibold text-[var(--sl-glow-periwinkle)] block mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                      {prompt.label}
                    </span>
                    <span className="text-[10px] text-[var(--sl-text-muted)] opacity-70 group-hover:opacity-100 transition-opacity line-clamp-1" style={{ fontFamily: "var(--font-mono)" }}>
                      {prompt.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Active plan state */}
        {showActivePlan && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="p-4 rounded-xl bg-[var(--sl-glow-mint)]/[0.08] border border-[var(--sl-glow-mint)]/15 ring-1 ring-[var(--sl-glow-mint)]/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-[var(--sl-glow-mint)]/20 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-[var(--sl-glow-mint)]" />
                </div>
                <span className="text-xs font-semibold text-[var(--sl-glow-mint)]" style={{ fontFamily: "var(--font-heading)" }}>
                  Plan Active
                </span>
              </div>
              <p className="text-xs text-[var(--sl-text-muted)] leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                Your plan is active with {todayPlan.tasks.length} tasks. Generate a new plan anytime to adjust.
              </p>
            </div>
          </motion.div>
        )}

        {/* Chat messages */}
        <AnimatePresence>
          {aiMessages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                text-xs leading-relaxed p-3 rounded-lg
                ${msg.role === "user"
                  ? "bg-[var(--sl-glow-periwinkle)]/10 text-[var(--sl-text)] ml-3 border border-[var(--sl-glow-periwinkle)]/15"
                  : "bg-white/[0.03] text-[var(--sl-text-muted)] mr-3 border border-white/[0.05]"
                }
              `}
              style={{ fontFamily: msg.role === "user" ? "var(--font-heading)" : "var(--font-body)" }}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Zap className="w-3 h-3 text-[var(--sl-glow-periwinkle)]" />
                  <span className="text-[9px] font-semibold text-[var(--sl-glow-periwinkle)]" style={{ fontFamily: "var(--font-heading)" }}>
                    Sleepline
                  </span>
                </div>
              )}
              {msg.content}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading state */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-[var(--sl-glow-periwinkle)]/[0.08] border border-[var(--sl-glow-periwinkle)]/15"
          >
            <Loader2 className="w-4 h-4 animate-spin text-[var(--sl-glow-periwinkle)] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-[var(--sl-glow-periwinkle)] font-semibold block" style={{ fontFamily: "var(--font-heading)" }}>
                Structuring your day...
              </span>
              <p className="text-[9px] text-[var(--sl-text-muted)] mt-1 opacity-70" style={{ fontFamily: "var(--font-body)" }}>
                Organizing tasks, adding breaks, planning wind-down
              </p>
            </div>
          </motion.div>
        )}

        {/* Plan preview card */}
        {previewPlan && <PlanPreviewCard plan={previewPlan} />}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 pt-3 border-t border-white/[0.04]">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your day..."
            disabled={isGenerating}
            className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-[var(--sl-text)] placeholder:text-[var(--sl-text-muted)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--sl-glow-periwinkle)]/40 focus:border-[var(--sl-glow-periwinkle)]/30 transition-all"
            style={{ fontFamily: "var(--font-body)" }}
          />
          <button
            type="submit"
            disabled={isGenerating || !input.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--sl-glow-periwinkle)]/20 text-[var(--sl-glow-periwinkle)] hover:bg-[var(--sl-glow-periwinkle)]/30 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all"
            title="Send"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

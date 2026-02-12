/**
 * AIPlanPanel — Left Column
 * "Plan My Day" interface that:
 * - Gathers info via chat-like prompts
 * - Generates structured plan previews via server-side AI
 * - Renders Action Cards (not just chat bubbles)
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
  { text: "School 8:00-15:00, homework 2h, soccer practice 1h", label: "Student Day" },
  { text: "Work 9-5, gym after work 1h, dinner prep 45m", label: "Office Worker" },
  { text: "Study for exams 4h, lunch with friends, evening walk 30m", label: "Exam Prep" },
  { text: "Remote work 9-5, meetings 10-12 and 2-3, deep work 2h", label: "Remote Work" },
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
      addAiMessage("assistant", `I've structured your day with ${plan.tasks.length} tasks and ${plan.systemBlocks.length} system blocks (breaks, snacks, wind-down). Review the preview below — tap Apply to lock it in.`);
    } catch (error) {
      console.error("Plan generation failed:", error);
      addAiMessage("assistant", "I had trouble generating your plan. Try describing your day again with specific tasks and times.");
      toast.error("Plan generation failed. Please try again.");
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--sl-glow-periwinkle)]/20 to-[var(--sl-glow-cyan)]/10 flex items-center justify-center">
            <Wand2 className="w-3.5 h-3.5 text-[var(--sl-glow-periwinkle)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              AI Planner
            </h2>
            <p className="text-[9px] text-[var(--sl-text-muted)] opacity-70">
              Describe your day, get a schedule
            </p>
          </div>
        </div>
        {(aiMessages.length > 0 || todayPlan) && (
          <button
            onClick={handleNewPlan}
            className="text-[9px] flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 text-[var(--sl-text-muted)] hover:bg-white/10 transition-colors"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <RotateCcw className="w-3 h-3" /> New
          </button>
        )}
      </div>

      {/* Messages + Cards area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 min-h-0">
        {/* Welcome state */}
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <p className="text-xs text-[var(--sl-text-muted)] leading-relaxed">
                Tell me about your day — fixed commitments, tasks, goals — and I'll create a structured schedule with breaks, snack windows, and bedtime options.
              </p>
            </div>

            {/* Quick prompts */}
            <div className="space-y-1.5">
              <p className="text-[9px] text-[var(--sl-text-muted)] uppercase tracking-[0.15em] font-medium" style={{ fontFamily: "var(--font-heading)" }}>
                Quick Start
              </p>
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(prompt.text)}
                  disabled={isGenerating}
                  className="w-full text-left p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all group"
                >
                  <span className="text-[10px] font-medium text-[var(--sl-glow-periwinkle)] block mb-0.5" style={{ fontFamily: "var(--font-heading)" }}>
                    {prompt.label}
                  </span>
                  <span className="text-[11px] text-[var(--sl-text-muted)] opacity-70 group-hover:opacity-100 transition-opacity" style={{ fontFamily: "var(--font-body)" }}>
                    {prompt.text}
                  </span>
                </button>
              ))}
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
            <div className="p-4 rounded-xl bg-[var(--sl-glow-mint)]/[0.05] border border-[var(--sl-glow-mint)]/10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[var(--sl-glow-mint)]" />
                <span className="text-xs font-semibold text-[var(--sl-glow-mint)]" style={{ fontFamily: "var(--font-heading)" }}>
                  Plan Active
                </span>
              </div>
              <p className="text-xs text-[var(--sl-text-muted)] leading-relaxed">
                Your day plan is running with {todayPlan.tasks.length} tasks and {todayPlan.systemBlocks.length} system blocks. You can create a new plan anytime.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <p className="text-[10px] text-[var(--sl-text-muted)] leading-relaxed">
                Want to adjust? Describe what changed and I'll rebuild your schedule.
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
                text-xs leading-relaxed p-3 rounded-xl
                ${msg.role === "user"
                  ? "bg-[var(--sl-glow-periwinkle)]/8 text-[var(--sl-text)] ml-4 border border-[var(--sl-glow-periwinkle)]/10"
                  : "bg-white/[0.03] text-[var(--sl-text-muted)] mr-4 border border-white/[0.04]"
                }
              `}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Zap className="w-3 h-3 text-[var(--sl-glow-periwinkle)]" />
                  <span className="text-[9px] font-medium text-[var(--sl-glow-periwinkle)]" style={{ fontFamily: "var(--font-heading)" }}>
                    Sleepline AI
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--sl-glow-periwinkle)]/[0.05] border border-[var(--sl-glow-periwinkle)]/10"
          >
            <Loader2 className="w-4 h-4 animate-spin text-[var(--sl-glow-periwinkle)]" />
            <div>
              <span className="text-xs text-[var(--sl-glow-periwinkle)] font-medium" style={{ fontFamily: "var(--font-heading)" }}>
                Building your schedule...
              </span>
              <p className="text-[9px] text-[var(--sl-text-muted)] mt-0.5">
                Parsing tasks, assigning times, inserting breaks
              </p>
            </div>
          </motion.div>
        )}

        {/* Plan preview card */}
        {previewPlan && <PlanPreviewCard plan={previewPlan} />}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 pt-2 border-t border-white/[0.04]">
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
            className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-[var(--sl-text)] placeholder:text-[var(--sl-text-muted)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--sl-glow-periwinkle)]/30 focus:border-[var(--sl-glow-periwinkle)]/20 transition-all"
            style={{ fontFamily: "var(--font-body)" }}
          />
          <button
            type="submit"
            disabled={isGenerating || !input.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--sl-glow-periwinkle)]/15 text-[var(--sl-glow-periwinkle)] hover:bg-[var(--sl-glow-periwinkle)]/25 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
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

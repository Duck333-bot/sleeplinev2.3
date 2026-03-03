/**
 * Onboarding — Multi-step Survey
 * Captures sleep preferences, chronotype, goals
 * Dreamy celestial UI with step progress
 */

import { useState } from "react";
import { useStore } from "@/lib/store";
import { nanoid } from "nanoid";
import type { Onboarding as OnboardingType } from "@/lib/schemas";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Coffee, Clock, Target, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

const ONBOARDING_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/hMkM5ef4lOzWk8WsKovwyH/sandbox/zmFmmK5TWQ1GOXTj3FQ5lV-img-2_1770930516000_na1fn_b25ib2FyZGluZy1iZw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvaE1rTTVlZjRsT3pXazhXc0tvdnd5SC9zYW5kYm94L3ptRm1tSzVUV1ExR09YVGozRlE1bFYtaW1nLTJfMTc3MDkzMDUxNjAwMF9uYTFmbl9iMjVpYjJGeVpHbHVaeTFpWncucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=HHJZ6QvkW70RFJiJmepz~EsIpLfir4LDRl3hnsY1veoXuRw4OaoVg55MhsHS6R3jJSTS314zawjprdovCdvNM20iLzmfEQLC-ytIt3RSkQDEVMzb4Y28UdHF3MObFTzBZoSzoL3izgL8TVuuu3WLFUiUDgnnh6sqrECzD2bAVyhj3Qi-RrkdukgfgnLQmzOKBZ8AUG~19wLeQvwNsYMaLQBirAXRDKJ6zqJCrHr3MdO2kHIH8vu3WNDyy9bT9Y6LtblAZhP5PmirFSsY0L5YSmdQHvvXt6rPbjhJa15nxcQgRXkAPHiwBstoyyPAtfo6Xpo9p~ag8ny~42FyUpFKUA__";

const GOALS = [
  "Better sleep quality",
  "More energy during the day",
  "Consistent schedule",
  "Reduce screen time before bed",
  "Wake up easier",
  "Manage stress better",
];

export default function OnboardingPage() {
  const setUser = useStore(s => s.setUser);
  const setPage = useStore(s => s.setPage);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [data, setData] = useState<Partial<OnboardingType>>({
    sleepGoalHrs: 8,
    preferredBedtime: "22:30",
    preferredWakeTime: "06:30",
    chronotype: "flexible",
    caffeineAfter3pm: false,
    breakFrequency: "every-60m",
    snackWindows: true,
    goals: [],
  });

  const totalSteps = 5;

  const handleComplete = () => {
    const onboarding: OnboardingType = {
      sleepGoalHrs: data.sleepGoalHrs || 8,
      preferredBedtime: data.preferredBedtime || "22:30",
      preferredWakeTime: data.preferredWakeTime || "06:30",
      chronotype: data.chronotype || "flexible",
      caffeineAfter3pm: data.caffeineAfter3pm || false,
      breakFrequency: data.breakFrequency || "every-60m",
      snackWindows: data.snackWindows ?? true,
      goals: data.goals || [],
      completedAt: new Date().toISOString(),
    };

    setUser({
      id: nanoid(),
      name: name || "Sleeper",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      onboarding,
      reminderSettings: {
        windDownReminder: true,
        windDownMinsBefore: 30,
        bedtimeReminder: true,
        nextTaskReminder: false,
        nextTaskMinsBefore: 5,
        quietHoursStart: 1380,
        quietHoursEnd: 420,
      },
      createdAt: new Date().toISOString(),
    });

    setPage("checkin");
  };

  const next = () => setStep(s => Math.min(s + 1, totalSteps - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-6">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? "bg-gradient-to-r from-[var(--sl-glow-periwinkle)] to-[var(--sl-glow-cyan)]" : "bg-white/5"
              }`}
            />
          ))}
        </div>

        <div className="glass-card p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* Step 0: Welcome + Name */}
            {step === 0 && (
              <StepWrapper key="step0">
                <div className="text-center mb-6">
                  <img
                    src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663348473965/TsKeQAKOxRVhYDWK.png"
                    alt="Sleepline logo"
                    className="w-16 h-16 mx-auto mb-4"
                  />
                  <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                    Welcome to Sleepline
                  </h2>
                  <p className="text-sm text-[var(--sl-text-muted)]">
                    Your AI-powered daily command center for better sleep and productivity.
                  </p>
                </div>
                <label className="block">
                  <span className="text-xs text-[var(--sl-text-muted)] mb-1.5 block" style={{ fontFamily: "var(--font-heading)" }}>
                    What should we call you?
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--sl-glow-periwinkle)]/30"
                    autoFocus
                  />
                </label>
              </StepWrapper>
            )}

            {/* Step 1: Sleep Schedule */}
            {step === 1 && (
              <StepWrapper key="step1">
                <StepHeader icon={<Clock className="w-5 h-5" />} title="Sleep Schedule" subtitle="When do you usually sleep and wake?" />
                <div className="space-y-4">
                  <TimeInput
                    label="Preferred Bedtime"
                    value={data.preferredBedtime || "22:30"}
                    onChange={v => setData(d => ({ ...d, preferredBedtime: v }))}
                    icon={<Moon className="w-4 h-4 text-[var(--sl-glow-cyan)]" />}
                  />
                  <TimeInput
                    label="Preferred Wake Time"
                    value={data.preferredWakeTime || "06:30"}
                    onChange={v => setData(d => ({ ...d, preferredWakeTime: v }))}
                    icon={<Sun className="w-4 h-4 text-[var(--sl-glow-amber)]" />}
                  />
                  <div>
                    <span className="text-xs text-[var(--sl-text-muted)] mb-2 block" style={{ fontFamily: "var(--font-heading)" }}>
                      Sleep Goal: {data.sleepGoalHrs}h
                    </span>
                    <input
                      type="range"
                      min={4} max={12} step={0.5}
                      value={data.sleepGoalHrs}
                      onChange={e => setData(d => ({ ...d, sleepGoalHrs: parseFloat(e.target.value) }))}
                      className="w-full accent-[var(--sl-glow-periwinkle)]"
                    />
                    <div className="flex justify-between text-[10px] text-[var(--sl-text-muted)]">
                      <span>4h</span><span>12h</span>
                    </div>
                  </div>
                </div>
              </StepWrapper>
            )}

            {/* Step 2: Chronotype */}
            {step === 2 && (
              <StepWrapper key="step2">
                <StepHeader icon={<Sun className="w-5 h-5" />} title="Your Chronotype" subtitle="When do you feel most alert?" />
                <div className="space-y-2">
                  {([
                    { value: "early-bird", label: "Early Bird", desc: "Most productive in the morning", icon: <Sun className="w-4 h-4" /> },
                    { value: "night-owl", label: "Night Owl", desc: "Peak energy in the evening", icon: <Moon className="w-4 h-4" /> },
                    { value: "flexible", label: "Flexible", desc: "Adaptable throughout the day", icon: <Sparkles className="w-4 h-4" /> },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setData(d => ({ ...d, chronotype: opt.value }))}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${
                        data.chronotype === opt.value
                          ? "bg-[var(--sl-glow-periwinkle)]/10 ring-1 ring-[var(--sl-glow-periwinkle)]/30"
                          : "bg-white/[0.03] hover:bg-white/[0.05]"
                      }`}
                    >
                      <span className={data.chronotype === opt.value ? "text-[var(--sl-glow-periwinkle)]" : "text-[var(--sl-text-muted)]"}>
                        {opt.icon}
                      </span>
                      <div>
                        <span className="text-sm font-medium block" style={{ fontFamily: "var(--font-heading)" }}>{opt.label}</span>
                        <span className="text-[11px] text-[var(--sl-text-muted)]">{opt.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.caffeineAfter3pm}
                      onChange={e => setData(d => ({ ...d, caffeineAfter3pm: e.target.checked }))}
                      className="rounded accent-[var(--sl-glow-periwinkle)]"
                    />
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-[var(--sl-text-muted)]" />
                      <span className="text-sm">I drink caffeine after 3 PM</span>
                    </div>
                  </label>
                </div>
              </StepWrapper>
            )}

            {/* Step 3: Day Preferences */}
            {step === 3 && (
              <StepWrapper key="step3">
                <StepHeader icon={<Clock className="w-5 h-5" />} title="Day Preferences" subtitle="How should we structure your breaks?" />
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-[var(--sl-text-muted)] mb-2 block" style={{ fontFamily: "var(--font-heading)" }}>
                      Break Frequency
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { value: "every-30m", label: "Every 30m" },
                        { value: "every-60m", label: "Every 60m" },
                        { value: "every-90m", label: "Every 90m" },
                        { value: "none", label: "No breaks" },
                      ] as const).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setData(d => ({ ...d, breakFrequency: opt.value }))}
                          className={`p-2.5 rounded-xl text-xs font-medium transition-all ${
                            data.breakFrequency === opt.value
                              ? "bg-[var(--sl-glow-periwinkle)]/10 ring-1 ring-[var(--sl-glow-periwinkle)]/30 text-[var(--sl-glow-periwinkle)]"
                              : "bg-white/[0.03] text-[var(--sl-text-muted)] hover:bg-white/[0.05]"
                          }`}
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.snackWindows}
                      onChange={e => setData(d => ({ ...d, snackWindows: e.target.checked }))}
                      className="rounded accent-[var(--sl-glow-periwinkle)]"
                    />
                    <span className="text-sm">Include snack windows for energy</span>
                  </label>
                </div>
              </StepWrapper>
            )}

            {/* Step 4: Goals */}
            {step === 4 && (
              <StepWrapper key="step4">
                <StepHeader icon={<Target className="w-5 h-5" />} title="Your Goals" subtitle="What matters most to you?" />
                <div className="space-y-2">
                  {GOALS.map(goal => {
                    const selected = data.goals?.includes(goal);
                    return (
                      <button
                        key={goal}
                        onClick={() => {
                          setData(d => ({
                            ...d,
                            goals: selected
                              ? d.goals?.filter(g => g !== goal)
                              : [...(d.goals || []), goal],
                          }));
                        }}
                        className={`w-full text-left p-3 rounded-xl text-sm transition-all ${
                          selected
                            ? "bg-[var(--sl-glow-periwinkle)]/10 ring-1 ring-[var(--sl-glow-periwinkle)]/30"
                            : "bg-white/[0.03] hover:bg-white/[0.05]"
                        }`}
                      >
                        {goal}
                      </button>
                    );
                  })}
                </div>
              </StepWrapper>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            {step > 0 ? (
              <button onClick={prev} className="pill-btn bg-white/5 text-[var(--sl-text-muted)] hover:bg-white/10">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : <div />}

            {step < totalSteps - 1 ? (
              <button onClick={next} className="pill-btn bg-[var(--sl-glow-periwinkle)]/15 text-[var(--sl-glow-periwinkle)] hover:bg-[var(--sl-glow-periwinkle)]/25">
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={handleComplete} className="pill-btn bg-gradient-to-r from-[var(--sl-glow-periwinkle)] to-[var(--sl-glow-cyan)] text-white hover:opacity-90">
                <Sparkles className="w-3.5 h-3.5" /> Start My Journey
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -30, scale: 0.98 }}
      transition={{
        duration: 0.35,
        ease: "easeInOut",
        opacity: { duration: 0.3 },
        x: { type: "spring", stiffness: 100, damping: 20 },
        scale: { duration: 0.35 },
      }}
    >
      {children}
    </motion.div>
  );
}

function StepHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[var(--sl-glow-periwinkle)]">{icon}</span>
        <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>{title}</h2>
      </div>
      <p className="text-xs text-[var(--sl-text-muted)] ml-7">{subtitle}</p>
    </div>
  );
}

function TimeInput({ label, value, onChange, icon }: { label: string; value: string; onChange: (v: string) => void; icon: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs text-[var(--sl-text-muted)] mb-1.5 flex items-center gap-1.5" style={{ fontFamily: "var(--font-heading)" }}>
        {icon} {label}
      </span>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--sl-glow-periwinkle)]/30"
        style={{ fontFamily: "var(--font-mono)" }}
      />
    </div>
  );
}

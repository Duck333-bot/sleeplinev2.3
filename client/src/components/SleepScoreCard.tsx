/**
 * Sleepline — Sleep Score Card Component
 * 
 * Displays daily sleep score (0-100) with feedback messages on the homepage.
 * Shows score, visual indicator, and 1-2 actionable feedback messages.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Moon, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

interface SleepScoreProps {
  score: number; // 0-100
  feedback: string[]; // 1-2 messages
  date?: string; // YYYY-MM-DD, defaults to today
}

/**
 * Get color and icon based on score range
 */
function getScoreStyle(score: number) {
  if (score >= 85) {
    return {
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      icon: CheckCircle,
      label: "Excellent",
    };
  } else if (score >= 70) {
    return {
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      icon: TrendingUp,
      label: "Good",
    };
  } else if (score >= 50) {
    return {
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      icon: AlertCircle,
      label: "Fair",
    };
  } else {
    return {
      color: "from-red-500 to-rose-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      icon: AlertCircle,
      label: "Poor",
    };
  }
}

/**
 * Sleep Score Card Component
 * 
 * Displays:
 * - Large score number (0-100) with visual indicator
 * - Score category (Excellent/Good/Fair/Poor)
 * - 1-2 feedback messages with actionable advice
 */
export function SleepScoreCard({ score, feedback, date }: SleepScoreProps) {
  const [mounted, setMounted] = useState(false);
  const style = getScoreStyle(score);
  const Icon = style.icon;

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayDate = date ? new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }) : new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm ${style.borderColor} ${style.bgColor} p-6 shadow-lg`}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${style.color} opacity-5`} />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Sleep Score</p>
            <p className="text-xs text-slate-500">{displayDate}</p>
          </div>
          <Icon className={`h-6 w-6 text-${style.color.split(" ")[0].split("-")[0]}-500`} />
        </div>

        {/* Score Display */}
        <div className="mb-6 flex items-baseline gap-2">
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className={`text-5xl font-bold bg-gradient-to-r ${style.color} bg-clip-text text-transparent`}
          >
            {score}
          </motion.span>
          <span className="text-lg font-medium text-slate-400">/100</span>
        </div>

        {/* Category Badge */}
        <div className="mb-6">
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold text-slate-200 bg-gradient-to-r ${style.color} bg-opacity-20`}>
            {style.label}
          </span>
        </div>

        {/* Feedback Messages */}
        <div className="space-y-3">
          {feedback.slice(0, 2).map((message, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.1, duration: 0.3 }}
              className="flex gap-2 rounded-lg bg-slate-800/50 p-3"
            >
              <div className={`mt-0.5 h-1 w-1 flex-shrink-0 rounded-full bg-gradient-to-r ${style.color}`} />
              <p className="text-sm leading-relaxed text-slate-300">
                {message}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            className={`h-full bg-gradient-to-r ${style.color} rounded-full`}
          />
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-slate-600/20 to-transparent blur-2xl" />
      <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-gradient-to-tr from-slate-600/20 to-transparent blur-2xl" />
    </motion.div>
  );
}

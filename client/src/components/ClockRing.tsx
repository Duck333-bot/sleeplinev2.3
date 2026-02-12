/**
 * ClockRing — Celestial Observatory Center Piece
 * Real-time SVG clock ring showing:
 * - Current time (digital, JetBrains Mono)
 * - Day progress arc
 * - Current block highlight
 * - Now/Next countdown
 * - Task block segments on the ring
 */

import { useEffect, useState, useMemo } from "react";
import { useStore, getCurrentBlock, getNextBlock } from "@/lib/store";
import { minToDisplay, durationDisplay } from "@/lib/schemas";
import { motion } from "framer-motion";

const RING_RADIUS = 118;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;
const INNER_RADIUS = 98;
const INNER_CIRC = 2 * Math.PI * INNER_RADIUS;
const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;

export default function ClockRing() {
  const [now, setNow] = useState(new Date());
  const todayPlan = useStore(s => s.todayPlan());
  const focusTimer = useStore(s => s.focusTimer);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const currentMin = now.getHours() * 60 + now.getMinutes();
  const currentBlock = useMemo(() => getCurrentBlock(todayPlan), [todayPlan, currentMin]);
  const nextBlock = useMemo(() => getNextBlock(todayPlan), [todayPlan, currentMin]);

  // Day progress (wake to bedtime)
  const wakeMin = todayPlan?.systemBlocks.find(b => b.type === "wake-up")?.startMin ?? 390;
  const bedtimeMin = todayPlan?.systemBlocks.find(b => b.type === "sleep")?.startMin ?? 1380;
  const dayLength = bedtimeMin - wakeMin;
  const dayProgress = Math.max(0, Math.min(1, (currentMin - wakeMin) / dayLength));

  // Current block progress
  let blockProgress = 0;
  if (currentBlock && "startMin" in currentBlock) {
    const blockLength = currentBlock.endMin - currentBlock.startMin;
    blockProgress = blockLength > 0 ? Math.max(0, Math.min(1, (currentMin - currentBlock.startMin) / blockLength)) : 0;
  }

  // Time display
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");

  // Next block countdown
  let countdownText = "";
  let nextTitle = "";
  if (nextBlock && "startMin" in nextBlock) {
    const minsUntil = nextBlock.startMin - currentMin;
    if (minsUntil > 0 && minsUntil <= 180) {
      countdownText = `in ${durationDisplay(minsUntil)}`;
      nextTitle = "title" in nextBlock ? nextBlock.title : "";
    }
  }

  // Focus timer display
  let focusText = "";
  if (focusTimer && !focusTimer.pausedAt) {
    const mins = Math.floor(focusTimer.remainingSec / 60);
    const secs = focusTimer.remainingSec % 60;
    focusText = `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  // Block name
  const blockName = currentBlock
    ? ("title" in currentBlock ? currentBlock.title : "")
    : (currentMin < wakeMin ? "Sleeping" : currentMin >= bedtimeMin ? "Rest" : "Free Time");

  // Task segments on outer ring
  const taskSegments = useMemo(() => {
    if (!todayPlan) return [];
    const allItems = [
      ...todayPlan.tasks.filter(t => t.startMin > 0),
      ...todayPlan.systemBlocks,
    ];
    return allItems.map(item => {
      const startFrac = Math.max(0, (item.startMin - wakeMin) / dayLength);
      const endFrac = Math.min(1, (item.endMin - wakeMin) / dayLength);
      const isTask = "status" in item;
      const isActive = item.startMin <= currentMin && item.endMin > currentMin;
      return {
        startFrac,
        endFrac,
        isTask,
        isActive,
        isCompleted: isTask && (item as any).status === "completed",
      };
    }).filter(s => s.startFrac < s.endFrac && s.startFrac >= 0);
  }, [todayPlan, wakeMin, dayLength, currentMin]);

  return (
    <motion.div
      className="relative flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]">
        {/* Ambient glow behind the ring */}
        <div className="absolute inset-0 rounded-full bg-[var(--sl-glow-periwinkle)]/[0.04] blur-3xl scale-110" />

        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full relative z-10" aria-label="Day progress clock">
          <defs>
            <linearGradient id="dayGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8b8ee0" />
              <stop offset="100%" stopColor="#69c7ec" />
            </linearGradient>
            <linearGradient id="blockGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f5a623" />
              <stop offset="100%" stopColor="#ff8a50" />
            </linearGradient>
            <linearGradient id="focusGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f5a623" />
              <stop offset="50%" stopColor="#ff6b6b" />
              <stop offset="100%" stopColor="#f5a623" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer ring background */}
          <circle
            cx={CX} cy={CY} r={RING_RADIUS}
            fill="none"
            stroke="rgba(139, 142, 224, 0.06)"
            strokeWidth="6"
          />

          {/* Task segments on outer ring */}
          {taskSegments.map((seg, i) => {
            const startOffset = RING_CIRC * (1 - seg.startFrac);
            const segLength = RING_CIRC * (seg.endFrac - seg.startFrac);
            const gapLength = RING_CIRC - segLength;
            return (
              <circle
                key={i}
                cx={CX} cy={CY} r={RING_RADIUS}
                fill="none"
                stroke={
                  seg.isCompleted ? "rgba(74, 222, 128, 0.3)" :
                  seg.isActive ? "rgba(245, 166, 35, 0.5)" :
                  seg.isTask ? "rgba(139, 142, 224, 0.25)" :
                  "rgba(105, 199, 236, 0.15)"
                }
                strokeWidth={seg.isActive ? "7" : "5"}
                strokeDasharray={`${segLength} ${gapLength}`}
                strokeDashoffset={startOffset}
                transform={`rotate(-90 ${CX} ${CY})`}
                className="transition-all duration-500"
              />
            );
          })}

          {/* Day progress arc (on top) */}
          <circle
            cx={CX} cy={CY} r={RING_RADIUS}
            fill="none"
            stroke="url(#dayGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={RING_CIRC}
            strokeDashoffset={RING_CIRC * (1 - dayProgress)}
            transform={`rotate(-90 ${CX} ${CY})`}
            className="transition-all duration-1000 ease-linear"
            opacity="0.6"
          />

          {/* Inner ring background */}
          <circle
            cx={CX} cy={CY} r={INNER_RADIUS}
            fill="none"
            stroke="rgba(245, 166, 35, 0.06)"
            strokeWidth="3"
          />

          {/* Inner ring - block progress */}
          <circle
            cx={CX} cy={CY} r={INNER_RADIUS}
            fill="none"
            stroke={focusTimer ? "url(#focusGradient)" : "url(#blockGradient)"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={INNER_CIRC}
            strokeDashoffset={INNER_CIRC * (1 - blockProgress)}
            transform={`rotate(-90 ${CX} ${CY})`}
            className="transition-all duration-1000 ease-linear"
            filter={focusTimer ? "url(#glow)" : undefined}
          />

          {/* Hour markers */}
          {Array.from({ length: 24 }, (_, i) => {
            const angle = (i / 24) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const isMajor = i % 6 === 0;
            const innerR = RING_RADIUS + 8;
            const outerR = RING_RADIUS + (isMajor ? 16 : 12);
            const x1 = CX + Math.cos(rad) * innerR;
            const y1 = CY + Math.sin(rad) * innerR;
            const x2 = CX + Math.cos(rad) * outerR;
            const y2 = CY + Math.sin(rad) * outerR;
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isMajor ? "rgba(245, 166, 35, 0.4)" : "rgba(139, 142, 224, 0.15)"}
                strokeWidth={isMajor ? 2 : 1}
              />
            );
          })}

          {/* Current time indicator dot */}
          {(() => {
            const timeFrac = Math.max(0, Math.min(1, (currentMin - wakeMin) / dayLength));
            const timeAngle = timeFrac * 360 - 90;
            const rad = (timeAngle * Math.PI) / 180;
            const x = CX + Math.cos(rad) * RING_RADIUS;
            const y = CY + Math.sin(rad) * RING_RADIUS;
            return (
              <g filter="url(#glow)">
                <circle
                  cx={x} cy={y} r="5"
                  fill="#f5a623"
                />
                <circle
                  cx={x} cy={y} r="8"
                  fill="none"
                  stroke="rgba(245, 166, 35, 0.3)"
                  strokeWidth="1"
                  className="animate-ping"
                  style={{ animationDuration: "2s" }}
                />
              </g>
            );
          })()}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          {focusText ? (
            <>
              <span className="text-[10px] font-semibold tracking-[0.25em] text-[var(--sl-glow-amber)] uppercase mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                Focus Mode
              </span>
              <span className="text-4xl sm:text-5xl font-light tracking-tight text-[var(--sl-glow-amber)]" style={{ fontFamily: "var(--font-mono)" }}>
                {focusText}
              </span>
            </>
          ) : (
            <>
              <span className="text-4xl sm:text-5xl font-light tracking-tight text-[var(--sl-text)]" style={{ fontFamily: "var(--font-mono)" }}>
                {hours}:{minutes}
              </span>
              <span className="text-sm text-[var(--sl-text-muted)] mt-0.5 opacity-60" style={{ fontFamily: "var(--font-mono)" }}>
                :{seconds}
              </span>
            </>
          )}

          <div className="mt-3 text-center max-w-[160px]">
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[var(--sl-glow-periwinkle)]" style={{ fontFamily: "var(--font-heading)" }}>
              {blockName}
            </p>
            {countdownText && nextTitle && (
              <p className="text-[10px] text-[var(--sl-text-muted)] mt-1 leading-snug" style={{ fontFamily: "var(--font-body)" }}>
                Next: <span className="text-[var(--sl-text)]">{nextTitle}</span> {countdownText}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Day progress label */}
      <div className="mt-4 flex items-center gap-3 text-xs text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-mono)" }}>
        <span className="text-[10px]">{minToDisplay(wakeMin)}</span>
        <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8b8ee0] to-[#69c7ec] transition-all duration-1000"
            style={{ width: `${dayProgress * 100}%` }}
          />
        </div>
        <span className="text-[10px]">{minToDisplay(bedtimeMin)}</span>
      </div>
    </motion.div>
  );
}

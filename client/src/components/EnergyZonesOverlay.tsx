/**
 * Energy Zones Overlay — Visual layer showing daily energy patterns
 * Displays behind timeline items to help users align tasks with peak focus periods
 */

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import type { EnergyZone } from "@/lib/energy-zones";

// Color mapping for energy zones
const zoneColors: Record<string, { bg: string; border: string; text: string }> = {
  highFocus: {
    bg: "bg-emerald-500/8",
    border: "border-l-emerald-500/30",
    text: "text-emerald-400",
  },
  peakFocus: {
    bg: "bg-emerald-400/12",
    border: "border-l-emerald-400/40",
    text: "text-emerald-300",
  },
  dip: {
    bg: "bg-amber-500/8",
    border: "border-l-amber-500/30",
    text: "text-amber-400",
  },
  recovery: {
    bg: "bg-emerald-500/8",
    border: "border-l-emerald-500/30",
    text: "text-emerald-400",
  },
  windDown: {
    bg: "bg-blue-500/8",
    border: "border-l-blue-500/30",
    text: "text-blue-400",
  },
  sleep: {
    bg: "bg-indigo-900/15",
    border: "border-l-indigo-600/40",
    text: "text-indigo-600",
  },
};

interface EnergyZonesOverlayProps {
  zones: EnergyZone[];
  wakeTimeMin: number;
  sleepTimeMin: number;
}

/**
 * Calculates pixel position for a time value within a 24-hour day
 * Assumes timeline spans from 0 to 1440 minutes
 */
function getPositionPercent(timeMin: number): number {
  return (timeMin / 1440) * 100;
}

/**
 * Calculates height percent for a zone duration
 */
function getHeightPercent(zone: EnergyZone): number {
  const duration = zone.end - zone.start;
  return (duration / 1440) * 100;
}

export default function EnergyZonesOverlay({
  zones,
  wakeTimeMin,
  sleepTimeMin,
}: EnergyZonesOverlayProps) {
  // Get current time
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  // Memoize zone rendering to avoid unnecessary recalculations
  const renderedZones = useMemo(() => {
    return zones.map((zone) => {
      const colors = zoneColors[zone.level];
      const isCurrentZone = currentMin >= zone.start && currentMin < zone.end;

      return (
        <div
          key={`${zone.level}-${zone.start}`}
          className={`
            absolute left-0 right-0 transition-opacity duration-300
            ${colors.bg}
            ${isCurrentZone ? "opacity-100" : "opacity-60 hover:opacity-80"}
          `}
          style={{
            top: `${getPositionPercent(zone.start)}%`,
            height: `${getHeightPercent(zone)}%`,
            borderLeft: `2px solid ${
              colors.border.includes("emerald-500")
                ? "rgba(16, 185, 129, 0.3)"
                : colors.border.includes("emerald-400")
                  ? "rgba(52, 211, 153, 0.4)"
                  : colors.border.includes("amber-500")
                    ? "rgba(245, 158, 11, 0.3)"
                    : colors.border.includes("blue-500")
                      ? "rgba(59, 130, 246, 0.3)"
                      : "rgba(79, 70, 229, 0.4)"
            }`,
          }}
          title={`${zone.label} (${zone.description})`}
        >
          {/* Zone label - only show if zone is tall enough */}
          {getHeightPercent(zone) > 8 && (
            <div
              className={`
                absolute top-1 left-2 text-[10px] font-medium
                ${colors.text} opacity-60 pointer-events-none
              `}
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {zone.label}
            </div>
          )}
        </div>
      );
    });
  }, [zones, currentMin]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
      {renderedZones}
    </div>
  );
}

/**
 * Wrapper component that integrates with Sleepline store
 * Automatically fetches wake/sleep times from today's plan
 */
export function EnergyZonesOverlayWithData({
  zones,
}: {
  zones: EnergyZone[];
}) {
  const todayPlan = useStore(s => s.todayPlan());

  // Extract wake and sleep times from plan
  const wakeTimeMin = useMemo(() => {
    const wakeBlock = todayPlan?.systemBlocks?.find(b => b.type === "wake-up");
    return wakeBlock?.startMin ?? 420; // Default 7 AM
  }, [todayPlan]);

  const sleepTimeMin = useMemo(() => {
    const sleepBlock = todayPlan?.systemBlocks?.find(b => b.type === "sleep");
    return sleepBlock?.startMin ?? 1380; // Default 11 PM
  }, [todayPlan]);

  return (
    <EnergyZonesOverlay
      zones={zones}
      wakeTimeMin={wakeTimeMin}
      sleepTimeMin={sleepTimeMin}
    />
  );
}

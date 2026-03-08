/**
 * Walking-optimized direction formatting for OSRM instructions.
 * Extracted for testability.
 */

/** Walking-optimized instruction text from OSRM (e.g. "turn left onto Main St" → "Turn left onto Main St"). */
export function formatDirection(instruction: string): string {
  if (instruction == null || typeof instruction !== "string") return "Continue straight";
  const lower = instruction.toLowerCase().trim();
  if (!lower) return "Continue straight";
  const ontoMatch = lower.match(/^(.+?)\s+onto\s+(.+)$/);
  const rest = ontoMatch ? ontoMatch[2] : "";
  const actionPart = ontoMatch ? ontoMatch[1] : lower;

  const street = rest ? ` onto ${rest}` : "";

  if (actionPart === "depart") return "Start walking" + (rest ? ` along ${rest}` : "");
  if (actionPart === "arrive") return "You have arrived";
  if (actionPart === "notification") return rest ? `Continue on ${rest}` : "Continue straight";
  if (actionPart === "continue" || actionPart.startsWith("new ")) return rest ? `Continue on ${rest}` : "Continue straight";
  if (actionPart.startsWith("turn ") || actionPart.startsWith("merge ")) {
    const dir = actionPart.includes("slight left") ? "slight left" : actionPart.includes("slight right") ? "slight right" : actionPart.includes("sharp left") ? "sharp left" : actionPart.includes("sharp right") ? "sharp right" : actionPart.includes("left") ? "left" : actionPart.includes("right") ? "right" : "";
    return (dir ? `Turn ${dir}` : "Turn") + street;
  }
  if (actionPart.startsWith("roundabout") || actionPart.startsWith("rotary")) {
    return (actionPart.includes("left") ? "Enter roundabout, take exit left" : actionPart.includes("right") ? "Enter roundabout, take exit right" : "Enter roundabout") + street;
  }
  if (actionPart.startsWith("fork")) return (actionPart.includes("left") ? "Take the left fork" : actionPart.includes("right") ? "Take the right fork" : "Take the fork") + street;
  if (actionPart === "end" || actionPart.startsWith("end ")) return "Continue to destination" + street;

  return instruction.charAt(0).toUpperCase() + instruction.slice(1);
}

const M_TO_MI = 1609.344;

/** Format distance for walking directions: "In 150 m" or "In 0.2 km". Use "Now" when distance is 0 or very small. */
export function formatDistanceForStep(distanceM: number, useImperial = false): string {
  const m = Number(distanceM);
  if (!Number.isFinite(m) || m < 0 || m < 10) return "Now";
  if (useImperial) {
    if (m >= 1000) return `In ${(m / M_TO_MI).toFixed(1)} mi`;
    return `In ${Math.round(m * 3.28084)} ft`;
  }
  if (m >= 1000) return `In ${(m / 1000).toFixed(1)} km`;
  return `In ${Math.round(m)} m`;
}

/**
 * Generate a lookahead summary of the next N turns.
 * Useful for "after this turn: left in 200m, then right in 350m" style previews.
 */
export interface DirectionLookahead {
  instruction: string;
  distanceM: number;
  formattedDistance: string;
  isLast: boolean;
}

export function getDirectionLookahead(
  steps: { instruction: string; distance: number }[],
  currentIdx: number,
  count = 3,
  useImperial = false
): DirectionLookahead[] {
  const result: DirectionLookahead[] = [];
  for (let i = currentIdx + 1; i < steps.length && result.length < count; i++) {
    const step = steps[i];
    if (!step) continue;
    const formatted = formatDirection(step.instruction);
    // Skip "Continue straight" entries in lookahead — they're not interesting turns
    if (formatted === "Continue straight" && i < steps.length - 1) continue;
    result.push({
      instruction: formatted,
      distanceM: step.distance ?? 0,
      formattedDistance: formatDistanceForStep(step.distance ?? 0, useImperial),
      isLast: i === steps.length - 1,
    });
  }
  return result;
}

/**
 * Calculate cumulative distance remaining from a step index to route end.
 */
export function remainingDistanceM(
  steps: { distance: number }[],
  fromIdx: number
): number {
  let total = 0;
  for (let i = fromIdx; i < steps.length; i++) {
    const d = steps[i]?.distance;
    if (Number.isFinite(d) && d > 0) total += d;
  }
  return total;
}

/**
 * Generate a human-readable direction summary for sharing/exporting.
 * Merges consecutive "Continue straight" steps for cleaner output.
 */
export function generateCompactDirections(
  steps: { instruction: string; distance: number }[],
  useImperial = false
): string {
  if (!steps?.length) return "No directions available.";
  
  const lines: string[] = [];
  let mergedDist = 0;

  for (let i = 0; i < steps.length; i++) {
    const formatted = formatDirection(steps[i].instruction);
    const dist = steps[i].distance ?? 0;

    // Merge consecutive "Continue straight" steps
    if (formatted === "Continue straight" && i < steps.length - 1) {
      mergedDist += dist;
      continue;
    }

    if (mergedDist > 0) {
      const totalDist = mergedDist + (formatted === "Continue straight" ? dist : 0);
      const distStr = useImperial
        ? (totalDist >= 1000 ? `${(totalDist / M_TO_MI).toFixed(1)} mi` : `${Math.round(totalDist * 3.28084)} ft`)
        : (totalDist >= 1000 ? `${(totalDist / 1000).toFixed(1)} km` : `${Math.round(totalDist)} m`);
      lines.push(`↑ Continue straight for ${distStr}`);
      mergedDist = 0;
      if (formatted === "Continue straight") continue;
    }

    const distStr = useImperial
      ? (dist >= 1000 ? `${(dist / M_TO_MI).toFixed(1)} mi` : `${Math.round(dist * 3.28084)} ft`)
      : (dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${Math.round(dist)} m`);
    
    const icon = formatted.toLowerCase().includes("left") ? "↰"
      : formatted.toLowerCase().includes("right") ? "↱"
      : formatted.toLowerCase().includes("arrive") ? "📍"
      : formatted.toLowerCase().includes("start") ? "▶"
      : formatted.toLowerCase().includes("roundabout") ? "↻"
      : "↑";
    
    lines.push(`${icon} ${formatted} (${distStr})`);
  }

  return lines.join("\n");
}

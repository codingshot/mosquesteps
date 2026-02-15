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

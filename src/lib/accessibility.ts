/**
 * Accessibility utilities for MosqueSteps.
 * Provides helpers for ARIA live announcements, focus trapping,
 * reduced-motion detection, and screen-reader-friendly formatting.
 */

// ── Live announcements ──

let liveRegion: HTMLElement | null = null;

/** Ensure the ARIA live region exists in the DOM. */
function ensureLiveRegion(): HTMLElement {
  if (liveRegion && document.body.contains(liveRegion)) return liveRegion;

  liveRegion = document.createElement("div");
  liveRegion.setAttribute("role", "status");
  liveRegion.setAttribute("aria-live", "polite");
  liveRegion.setAttribute("aria-atomic", "true");
  liveRegion.className = "sr-only"; // Tailwind screen-reader-only
  liveRegion.id = "a11y-live-region";
  document.body.appendChild(liveRegion);
  return liveRegion;
}

/** Announce a message to screen readers via an ARIA live region. */
export function announce(message: string, priority: "polite" | "assertive" = "polite"): void {
  const region = ensureLiveRegion();
  region.setAttribute("aria-live", priority);
  // Clear then set to trigger announcement even if same text
  region.textContent = "";
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

/** Announce an urgent/time-sensitive message (assertive). */
export function announceUrgent(message: string): void {
  announce(message, "assertive");
}

// ── Reduced motion ──

/** Check if user prefers reduced motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Subscribe to reduced-motion preference changes. */
export function onReducedMotionChange(fn: (reduced: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = (e: MediaQueryListEvent) => fn(e.matches);
  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}

// ── Focus management ──

/** Move focus to an element by ID, with a small delay to ensure DOM readiness. */
export function focusElement(id: string, delay = 50): void {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) {
      el.focus({ preventScroll: false });
    }
  }, delay);
}

/** Trap focus within a container (modal, dialog). Returns cleanup function. */
export function trapFocus(container: HTMLElement): () => void {
  const focusableSelector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== "Tab") return;
    const focusable = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  container.addEventListener("keydown", handleKeyDown);
  // Focus first focusable element
  const first = container.querySelector<HTMLElement>(focusableSelector);
  if (first) first.focus();

  return () => container.removeEventListener("keydown", handleKeyDown);
}

// ── Screen-reader formatting ──

/** Format a distance for screen readers (e.g. "1.2 kilometres" instead of "1.2 km"). */
export function srDistance(km: number, unit: "km" | "mi" = "km"): string {
  const value = Math.round(km * 10) / 10;
  if (unit === "mi") {
    const mi = Math.round(km * 0.621371 * 10) / 10;
    return `${mi} ${mi === 1 ? "mile" : "miles"}`;
  }
  return `${value} ${value === 1 ? "kilometre" : "kilometres"}`;
}

/** Format duration for screen readers (e.g. "12 minutes" instead of "12 min"). */
export function srDuration(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 1) return "less than a minute";
  if (m === 1) return "1 minute";
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    const hourStr = `${h} ${h === 1 ? "hour" : "hours"}`;
    return rem > 0 ? `${hourStr} and ${rem} ${rem === 1 ? "minute" : "minutes"}` : hourStr;
  }
  return `${m} minutes`;
}

/** Format step count for screen readers with comma grouping. */
export function srSteps(steps: number): string {
  return `${steps.toLocaleString()} ${steps === 1 ? "step" : "steps"}`;
}

/** Build an aria-label for a prayer time card. */
export function srPrayerCard(prayer: string, time: string, leaveBy?: string): string {
  let label = `${prayer} prayer at ${time}`;
  if (leaveBy) label += `. Leave by ${leaveBy}`;
  return label;
}

// ── Skip link helper ──

/** Create a skip-to-content link programmatically if not already present. */
export function ensureSkipLink(targetId = "main-content"): void {
  if (document.getElementById("skip-to-content")) return;
  const link = document.createElement("a");
  link.id = "skip-to-content";
  link.href = `#${targetId}`;
  link.textContent = "Skip to main content";
  link.className =
    "sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[99999] focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary";
  document.body.prepend(link);
}

// ── Cleanup ──

export function destroyA11yHelpers(): void {
  if (liveRegion && document.body.contains(liveRegion)) {
    document.body.removeChild(liveRegion);
  }
  liveRegion = null;
  const skip = document.getElementById("skip-to-content");
  if (skip) skip.remove();
}

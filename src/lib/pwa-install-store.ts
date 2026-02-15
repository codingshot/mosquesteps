/**
 * Persisted state for PWA install prompt on Dashboard.
 * Show prompt after first completed walk OR 2nd dashboard visit.
 */

const KEY_VISITS = "pwa_dashboard_visits";
const KEY_DISMISSED = "pwa_install_dismissed";
const DISMISS_COOLDOWN_DAYS = 7;

export function getDashboardVisitCount(): number {
  try {
    const v = localStorage.getItem(KEY_VISITS);
    return v ? Math.max(0, parseInt(v, 10)) : 0;
  } catch {
    return 0;
  }
}

export function incrementDashboardVisit(): number {
  const count = getDashboardVisitCount() + 1;
  try {
    localStorage.setItem(KEY_VISITS, String(count));
  } catch {
    // ignore
  }
  return count;
}

export function dismissInstallPrompt(): void {
  try {
    localStorage.setItem(KEY_DISMISSED, String(Date.now()));
  } catch {
    // ignore
  }
}

export function isInstallPromptDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(KEY_DISMISSED);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (Number.isNaN(ts)) return false;
    const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    return ageDays < DISMISS_COOLDOWN_DAYS;
  } catch {
    return false;
  }
}

/** Should we show the install prompt? (caller must also check !isInstalled) */
export function shouldShowInstallPrompt(
  totalWalks: number,
  dashboardVisits: number
): boolean {
  if (isInstallPromptDismissedRecently()) return false;
  // Show after first completed walk OR 2nd visit (stored count >= 1 means they've visited once before)
  return totalWalks >= 1 || dashboardVisits >= 1;
}

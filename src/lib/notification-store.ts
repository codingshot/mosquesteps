/**
 * Notification store — localStorage-backed notification history
 * with read/unread, categories, and settings
 */

export type NotificationType =
  | "prayer_reminder"
  | "walk_complete"
  | "streak"
  | "badge"
  | "weekly_summary"
  | "checkin"
  | "goal"
  | "health_tip"
  | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  timestamp: number; // ms
  data?: Record<string, string | number>;
}

export interface NotificationSettings {
  prayerReminders: boolean;
  walkUpdates: boolean;
  streakAlerts: boolean;
  badgeAlerts: boolean;
  weeklySummary: boolean;
  healthTips: boolean;
}

const STORE_KEY = "mosquesteps_notifications";
const SETTINGS_KEY = "mosquesteps_notification_settings";

const DEFAULT_SETTINGS: NotificationSettings = {
  prayerReminders: true,
  walkUpdates: true,
  streakAlerts: true,
  badgeAlerts: true,
  weeklySummary: true,
  healthTips: true,
};

// ---- Settings ----

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function saveNotificationSettings(s: NotificationSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// ---- Store ----

export function getNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function persist(notifications: AppNotification[]): void {
  // Keep max 200
  localStorage.setItem(STORE_KEY, JSON.stringify(notifications.slice(0, 200)));
}

export function addNotification(
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, string | number>
): AppNotification {
  const n: AppNotification = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    title,
    body,
    read: false,
    timestamp: Date.now(),
    data,
  };
  const all = getNotifications();
  all.unshift(n);
  persist(all);
  return n;
}

export function markAsRead(id: string): void {
  const all = getNotifications();
  const n = all.find((x) => x.id === id);
  if (n) {
    n.read = true;
    persist(all);
  }
}

export function markAllAsRead(): void {
  const all = getNotifications();
  all.forEach((n) => (n.read = true));
  persist(all);
}

export function deleteNotification(id: string): void {
  const all = getNotifications().filter((n) => n.id !== id);
  persist(all);
}

export function clearAllNotifications(): void {
  persist([]);
}

export function getUnreadCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

// ---- Seed demo data (for first-time users) ----

export function seedDemoNotifications(): void {
  if (getNotifications().length > 0) return;

  const now = Date.now();
  const demos: Omit<AppNotification, "id">[] = [
    { type: "prayer_reminder", title: "Time for Dhuhr 🕌", body: "Leave now to arrive on time for Dhuhr prayer.", read: false, timestamp: now - 5 * 60_000 },
    { type: "walk_complete", title: "Walk Complete! 🎉", body: "1,245 steps · 87 hasanat earned on your walk to Fajr.", read: false, timestamp: now - 2 * 3600_000 },
    { type: "streak", title: "3-Day Streak! 🔥", body: "You've walked to the mosque 3 days in a row. Keep it up!", read: false, timestamp: now - 8 * 3600_000 },
    { type: "badge", title: "New Badge Earned 🏅", body: "You unlocked 'Early Bird' — walked to Fajr 5 times.", read: true, timestamp: now - 24 * 3600_000 },
    { type: "weekly_summary", title: "📊 Weekly Summary", body: "You averaged 4,200 steps/day this week — 84% of your goal. 5 mosque walks completed.", read: true, timestamp: now - 2 * 24 * 3600_000 },
    { type: "checkin", title: "Checked in at Al-Noor Mosque ✅", body: "You checked in for Asr prayer. Keep building your streak!", read: true, timestamp: now - 3 * 24 * 3600_000 },
    { type: "goal", title: "Goal Progress 🎯", body: "You've reached 60% of your weekly step goal. 2 more walks to go!", read: true, timestamp: now - 4 * 24 * 3600_000 },
    { type: "health_tip", title: "💡 Health Tip", body: "Walking after meals helps regulate blood sugar. Try walking to Isha tonight!", read: true, timestamp: now - 5 * 24 * 3600_000 },
    { type: "system", title: "Welcome to MosqueSteps!", body: "Start by finding a nearby mosque and tracking your first walk.", read: true, timestamp: now - 7 * 24 * 3600_000 },
  ];

  const all = demos.map((d) => ({
    ...d,
    id: `${d.timestamp}_${Math.random().toString(36).slice(2, 8)}`,
  }));
  persist(all);
}

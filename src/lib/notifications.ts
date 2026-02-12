/**
 * Notification helpers for prayer reminders and weekly health insights.
 * Uses Browser Notifications API; reminders are persisted and polled so they
 * can fire even after tab refresh or when user returns to the app.
 */

import { getNotificationSettings } from "@/lib/notification-store";

const REMINDERS_STORAGE_KEY = "mosquesteps_scheduled_reminders";
const REMINDER_POLL_INTERVAL_MS = 60 * 1000; // 1 minute
let reminderPollIntervalId: ReturnType<typeof setInterval> | null = null;

export interface ScheduledReminder {
  prayerName: string;
  reminderAt: number; // Unix ms
}

function getStoredReminders(): ScheduledReminder[] {
  try {
    const raw = localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function setStoredReminders(list: ScheduledReminder[]): void {
  localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(list));
}

/** Clear all scheduled reminders (e.g. before rescheduling from fresh prayer times). */
export function clearScheduledReminders(): void {
  setStoredReminders([]);
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const result = await Notification.requestPermission();
  return result === "granted";
}

export function isNotificationSupported(): boolean {
  return "Notification" in window;
}

export function getNotificationPermission(): string {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Send a browser notification (Notification API). Call only when permission is granted.
 */
export function sendNotification(title: string, body: string, icon?: string): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      body,
      icon: icon ?? "/favicon.png",
      badge: "/favicon.png",
      tag: "mosquesteps",
    });
  } catch {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: icon ?? "/favicon.png",
          badge: "/favicon.png",
          tag: "mosquesteps",
        });
      });
    }
  }
}

/**
 * Schedule a prayer departure reminder. Stored in localStorage and fired by the
 * reminder poll when due (so it works after tab refresh / return to app).
 * Handles next-day Fajr (reminder time in the past => add one day).
 */
export function schedulePrayerReminder(
  prayerName: string,
  leaveByTime: string,
  minutesBefore: number = 5
): void {
  const [h, m] = leaveByTime.split(":").map(Number);
  const now = new Date();
  const reminderTime = new Date(now);
  reminderTime.setHours(h, m - minutesBefore, 0, 0);
  if (reminderTime.getTime() <= now.getTime()) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }
  const reminderAt = reminderTime.getTime();
  const list = getStoredReminders();
  if (list.some((r) => r.prayerName === prayerName && r.reminderAt === reminderAt)) return;
  list.push({ prayerName, reminderAt });
  list.sort((a, b) => a.reminderAt - b.reminderAt);
  setStoredReminders(list);
}

/**
 * Poll scheduled reminders and send browser notifications when due.
 * Call once when the app (e.g. Dashboard) mounts; cleanup on unmount.
 */
export function startReminderPolling(): () => void {
  if (reminderPollIntervalId) return () => {};
  reminderPollIntervalId = setInterval(() => {
    if (Notification.permission !== "granted") return;
    const list = getStoredReminders();
    const now = Date.now();
    const toRemove: number[] = [];
    list.forEach((r, i) => {
      if (r.reminderAt <= now) {
        sendNotification(
          `Time to leave for ${r.prayerName} 🕌`,
          "Leave now to arrive on time. Walk with tranquility and dignity."
        );
        toRemove.push(i);
      }
    });
    if (toRemove.length) {
      const next = list.filter((_, i) => !toRemove.includes(i));
      setStoredReminders(next);
    }
  }, REMINDER_POLL_INTERVAL_MS);
  return () => {
    if (reminderPollIntervalId) {
      clearInterval(reminderPollIntervalId);
      reminderPollIntervalId = null;
    }
  };
}

/**
 * Weekly health insight notification
 * Checks if 7 days have passed since last weekly summary and sends one.
 * Respects notification settings (weeklySummary).
 */
const WEEKLY_INSIGHT_KEY = "mosquesteps_weekly_insight_last";

export function checkAndSendWeeklyInsight(stats: {
  totalSteps: number;
  totalWalks: number;
  avgDailySteps: number;
  recommendedSteps: number;
  currentStreak: number;
}): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (!getNotificationSettings().weeklySummary) return;

  const lastSent = localStorage.getItem(WEEKLY_INSIGHT_KEY);
  const now = Date.now();

  // Only send once per 7 days
  if (lastSent && now - parseInt(lastSent) < 7 * 24 * 60 * 60 * 1000) return;

  const ratio = stats.recommendedSteps > 0 ? stats.avgDailySteps / stats.recommendedSteps : 0;
  const percent = Math.round(ratio * 100);

  let title: string;
  let body: string;

  if (ratio >= 1.2) {
    title = "🌟 Exceptional Week!";
    body = `You averaged ${stats.avgDailySteps.toLocaleString()} steps/day — ${percent}% of your goal! ${stats.currentStreak} day streak. MashaAllah!`;
  } else if (ratio >= 0.8) {
    title = "✅ Great Week!";
    body = `${stats.avgDailySteps.toLocaleString()} avg daily steps (${percent}% of ${stats.recommendedSteps.toLocaleString()} goal). ${stats.totalWalks} walks this week. Keep it up!`;
  } else if (ratio >= 0.5) {
    title = "📈 Your Weekly Summary";
    body = `${stats.avgDailySteps.toLocaleString()} avg steps/day — ${percent}% of your ${stats.recommendedSteps.toLocaleString()} step goal. Try one more daily walk!`;
  } else {
    title = "💪 Weekly Walking Summary";
    body = `You averaged ${stats.avgDailySteps.toLocaleString()} steps/day. Your goal is ${stats.recommendedSteps.toLocaleString()}. Every step to the mosque earns rewards!`;
  }

  sendNotification(title, body);
  localStorage.setItem(WEEKLY_INSIGHT_KEY, String(now));
}

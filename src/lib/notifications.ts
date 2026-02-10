/**
 * Notification helpers for prayer reminders and weekly health insights
 */

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

export function sendNotification(title: string, body: string, icon?: string): void {
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      body,
      icon: icon || "/favicon.png",
      badge: "/favicon.png",
      tag: "mosquesteps",
    });
  } catch {
    // Fallback for service worker environments
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: icon || "/favicon.png",
          badge: "/favicon.png",
          tag: "mosquesteps",
        });
      });
    }
  }
}

/**
 * Schedule a prayer departure reminder
 */
export function schedulePrayerReminder(
  prayerName: string,
  leaveByTime: string,
  minutesBefore: number = 5
): NodeJS.Timeout | null {
  const [h, m] = leaveByTime.split(":").map(Number);
  const now = new Date();
  const reminderTime = new Date();
  reminderTime.setHours(h, m - minutesBefore, 0, 0);

  const delay = reminderTime.getTime() - now.getTime();
  if (delay <= 0) return null;

  return setTimeout(() => {
    sendNotification(
      `Time to leave for ${prayerName} 🕌`,
      `Leave now to arrive on time. Walk with tranquility and dignity.`
    );
  }, delay);
}

/**
 * Weekly health insight notification
 * Checks if 7 days have passed since last weekly summary and sends one
 */
const WEEKLY_INSIGHT_KEY = "mosquesteps_weekly_insight_last";

export function checkAndSendWeeklyInsight(stats: {
  totalSteps: number;
  totalWalks: number;
  avgDailySteps: number;
  recommendedSteps: number;
  currentStreak: number;
}): void {
  if (Notification.permission !== "granted") return;

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

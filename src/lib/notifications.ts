/**
 * Notification helpers for prayer reminders
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

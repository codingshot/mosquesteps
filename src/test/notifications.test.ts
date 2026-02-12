/**
 * Notification helpers: permission, scheduling, and reminder polling.
 * Run with: npm test -- src/test/notifications.test.ts
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isNotificationSupported,
  getNotificationPermission,
  schedulePrayerReminder,
  clearScheduledReminders,
  startReminderPolling,
  sendNotification,
} from "@/lib/notifications";

const REMINDERS_KEY = "mosquesteps_scheduled_reminders";

describe("notifications", () => {
  beforeEach(() => {
    localStorage.removeItem(REMINDERS_KEY);
    vi.stubGlobal("Notification", {
      permission: "granted",
      requestPermission: vi.fn().mockResolvedValue("granted"),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isNotificationSupported", () => {
    it("returns true when Notification is in window", () => {
      expect(isNotificationSupported()).toBe(true);
    });
  });

  describe("getNotificationPermission", () => {
    it("returns permission string", () => {
      expect(getNotificationPermission()).toBe("granted");
    });
  });

  describe("schedulePrayerReminder and clearScheduledReminders", () => {
    it("stores reminder in localStorage with future time", () => {
      const now = new Date();
      const leaveBy = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes() + 30).padStart(2, "0")}`;
      schedulePrayerReminder("Dhuhr", leaveBy, 5);
      const raw = localStorage.getItem(REMINDERS_KEY);
      expect(raw).toBeTruthy();
      const list = JSON.parse(raw!);
      expect(list).toHaveLength(1);
      expect(list[0].prayerName).toBe("Dhuhr");
      expect(list[0].reminderAt).toBeGreaterThan(Date.now());
    });

    it("handles next-day when reminder time would be in the past", () => {
      schedulePrayerReminder("Fajr", "00:15", 5);
      const list = JSON.parse(localStorage.getItem(REMINDERS_KEY)!);
      expect(list).toHaveLength(1);
      expect(list[0].prayerName).toBe("Fajr");
      const reminderDate = new Date(list[0].reminderAt);
      expect(reminderDate.getHours()).toBe(0);
      expect(reminderDate.getMinutes()).toBe(10);
    });

    it("clearScheduledReminders removes all", () => {
      schedulePrayerReminder("Dhuhr", "14:00", 5);
      expect(localStorage.getItem(REMINDERS_KEY)).toBeTruthy();
      clearScheduledReminders();
      expect(localStorage.getItem(REMINDERS_KEY)).toBe("[]");
    });
  });

  describe("startReminderPolling", () => {
    it("returns cleanup function", () => {
      const stop = startReminderPolling();
      expect(typeof stop).toBe("function");
      stop();
    });

    it("removes due reminder from storage when poll runs", () => {
      vi.useFakeTimers();
      vi.stubGlobal("Notification", class MockNotification {
        constructor(_title: string, _opts?: { body: string }) {}
      });
      (globalThis as any).Notification.permission = "granted";
      const past = Date.now() - 1000;
      localStorage.setItem(REMINDERS_KEY, JSON.stringify([{ prayerName: "Dhuhr", reminderAt: past }]));
      const stop = startReminderPolling();
      vi.advanceTimersByTime(61 * 1000);
      const raw = localStorage.getItem(REMINDERS_KEY);
      expect(JSON.parse(raw!).length).toBe(0);
      stop();
      vi.useRealTimers();
    });
  });

  describe("sendNotification", () => {
    it("does not throw when permission is denied", () => {
      const orig = (globalThis as any).Notification;
      (globalThis as any).Notification = { ...orig, permission: "denied" };
      expect(() => sendNotification("Test", "Body")).not.toThrow();
      (globalThis as any).Notification = orig;
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchPrayerTimes,
  calculateLeaveByTime,
  estimateSteps,
  estimateWalkingTime,
  calculateHasanat,
} from "@/lib/prayer-times";
import { getSettings, saveSettings, addWalkEntry, getWalkHistory, deleteWalkEntry, getWalkingStats } from "@/lib/walking-history";
import { getBadges, getNewlyEarnedBadges } from "@/lib/badges";
import { getPaceCategory, isStepCountingAvailable } from "@/lib/step-counter";
import { isNotificationSupported, getNotificationPermission } from "@/lib/notifications";

// ── Prayer Times API Tests ──────────────────────────────────────────

describe("Prayer Times API", () => {
  it("fetchPrayerTimes returns valid structure from Aladhan API", async () => {
    // Mock fetch
    const mockResponse = {
      data: {
        timings: {
          Fajr: "05:30",
          Sunrise: "06:45",
          Dhuhr: "12:15",
          Asr: "15:30",
          Maghrib: "18:00",
          Isha: "19:30",
        },
        date: {
          readable: "10 Feb 2026",
          hijri: {
            date: "22-07-1447",
            month: { en: "Rajab", ar: "رجب" },
            year: "1447",
          },
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const result = await fetchPrayerTimes(51.5074, -0.1278);
    expect(result.prayers).toHaveLength(5);
    expect(result.prayers[0].name).toBe("Fajr");
    expect(result.prayers[0].time).toBe("05:30");
    expect(result.prayers[0].arabicName).toBe("الفجر");
    expect(result.hijriDate).toContain("Rajab");
    expect(result.readableDate).toBe("10 Feb 2026");
  });

  it("fetchPrayerTimes handles API error gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));
    await expect(fetchPrayerTimes(0, 0)).rejects.toThrow("Network error");
  });

  it("fetchPrayerTimes constructs correct API URL", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({
        data: {
          timings: { Fajr: "05:00", Sunrise: "06:00", Dhuhr: "12:00", Asr: "15:00", Maghrib: "18:00", Isha: "19:00" },
          date: { readable: "01 Jan 2026", hijri: { date: "01-01-1447", month: { en: "Muharram", ar: "محرم" }, year: "1447" } },
        },
      }),
    });

    await fetchPrayerTimes(21.4225, 39.8262);
    const url = (global.fetch as any).mock.calls[0][0] as string;
    expect(url).toContain("latitude=21.4225");
    expect(url).toContain("longitude=39.8262");
    expect(url).toContain("method=2");
  });
});

// ── calculateLeaveByTime Edge Cases ──────────────────────────────

describe("calculateLeaveByTime edge cases", () => {
  it("handles normal case", () => {
    expect(calculateLeaveByTime("12:00", 10)).toBe("11:45");
  });

  it("handles early morning wrap-around (Fajr with long walk)", () => {
    // Fajr at 05:00, walking 10 min + 5 buffer = 15 min before = 04:45
    expect(calculateLeaveByTime("05:00", 10)).toBe("04:45");
  });

  it("handles midnight wrap for very early Fajr", () => {
    // Fajr at 00:10, walking 10 min + 5 buffer = 15 min before → wraps to 23:55
    const result = calculateLeaveByTime("00:10", 10);
    expect(result).toBe("23:55");
  });

  it("handles zero walking time", () => {
    expect(calculateLeaveByTime("12:00", 0)).toBe("11:55");
  });
});

// ── Calculation Functions ────────────────────────────────────────

describe("Calculation functions", () => {
  it("estimateSteps returns correct for various distances", () => {
    expect(estimateSteps(0)).toBe(0);
    expect(estimateSteps(1)).toBe(1333);
    expect(estimateSteps(0.5)).toBe(667); // rounded
    expect(estimateSteps(2.5)).toBe(3333);
  });

  it("estimateWalkingTime with custom speed", () => {
    expect(estimateWalkingTime(5, 5)).toBe(60);
    expect(estimateWalkingTime(1, 4)).toBe(15);
    expect(estimateWalkingTime(0.5, 5)).toBe(6);
  });

  it("calculateHasanat doubles steps", () => {
    expect(calculateHasanat(0)).toBe(0);
    expect(calculateHasanat(100)).toBe(200);
    expect(calculateHasanat(1333)).toBe(2666);
  });
});

// ── Walking History & Streaks ────────────────────────────────────

describe("Walking history and streaks", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("settings round-trip", () => {
    saveSettings({ walkingSpeed: 6, cityName: "London" });
    const s = getSettings();
    expect(s.walkingSpeed).toBe(6);
    expect(s.cityName).toBe("London");
    expect(s.selectedMosqueName).toBe("My Mosque"); // default preserved
  });

  it("walk entry CRUD", () => {
    const entry = addWalkEntry({
      date: "2026-02-10T08:00:00.000Z",
      mosqueName: "Test Mosque",
      distanceKm: 0.8,
      steps: 1066,
      walkingTimeMin: 10,
      hasanat: 2132,
      prayer: "Fajr",
    });
    expect(entry.id).toBeTruthy();
    expect(getWalkHistory()).toHaveLength(1);

    deleteWalkEntry(entry.id);
    expect(getWalkHistory()).toHaveLength(0);
  });

  it("streak calculation for consecutive days", () => {
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      addWalkEntry({
        date: d.toISOString(),
        mosqueName: "Test",
        distanceKm: 0.5,
        steps: 666,
        walkingTimeMin: 6,
        hasanat: 1332,
        prayer: "Dhuhr",
      });
    }
    const stats = getWalkingStats();
    expect(stats.currentStreak).toBe(5);
    expect(stats.longestStreak).toBeGreaterThanOrEqual(5);
  });

  it("streak breaks on gap", () => {
    const today = new Date();
    // Walk today
    addWalkEntry({
      date: today.toISOString(),
      mosqueName: "Test",
      distanceKm: 0.5,
      steps: 666,
      walkingTimeMin: 6,
      hasanat: 1332,
      prayer: "Dhuhr",
    });
    // Walk 3 days ago (gap of 1 day)
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    addWalkEntry({
      date: threeDaysAgo.toISOString(),
      mosqueName: "Test",
      distanceKm: 0.5,
      steps: 666,
      walkingTimeMin: 6,
      hasanat: 1332,
      prayer: "Asr",
    });
    const stats = getWalkingStats();
    expect(stats.currentStreak).toBe(1); // only today
  });

  it("walksByPrayer tracks correctly", () => {
    addWalkEntry({ date: new Date().toISOString(), mosqueName: "T", distanceKm: 0.5, steps: 100, walkingTimeMin: 5, hasanat: 200, prayer: "Fajr" });
    addWalkEntry({ date: new Date().toISOString(), mosqueName: "T", distanceKm: 0.5, steps: 100, walkingTimeMin: 5, hasanat: 200, prayer: "Fajr" });
    addWalkEntry({ date: new Date().toISOString(), mosqueName: "T", distanceKm: 0.5, steps: 100, walkingTimeMin: 5, hasanat: 200, prayer: "Isha" });
    const stats = getWalkingStats();
    expect(stats.walksByPrayer.Fajr).toBe(2);
    expect(stats.walksByPrayer.Isha).toBe(1);
  });
});

// ── Badges ───────────────────────────────────────────────────────

describe("Badge system", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns all 15 badge definitions", () => {
    const badges = getBadges({ totalWalks: 0, totalSteps: 0, totalHasanat: 0, totalDistance: 0, currentStreak: 0, longestStreak: 0, walksByPrayer: {} });
    expect(badges).toHaveLength(15);
  });

  it("first_steps badge earned after 1 walk", () => {
    const badges = getBadges({ totalWalks: 1, totalSteps: 100, totalHasanat: 200, totalDistance: 0.5, currentStreak: 1, longestStreak: 1, walksByPrayer: { Dhuhr: 1 } });
    const firstSteps = badges.find((b) => b.badge.id === "first_steps");
    expect(firstSteps?.badge.earned).toBe(true);
    expect(firstSteps?.percent).toBe(100);
  });

  it("progress percentage capped at 100", () => {
    const badges = getBadges({ totalWalks: 100, totalSteps: 200000, totalHasanat: 400000, totalDistance: 100, currentStreak: 50, longestStreak: 50, walksByPrayer: {} });
    badges.forEach((b) => {
      expect(b.percent).toBeLessThanOrEqual(100);
    });
  });

  it("getNewlyEarnedBadges detects new badges", () => {
    // No badges earned yet
    const newBadges = getNewlyEarnedBadges({ totalWalks: 1, totalSteps: 100, totalHasanat: 200, totalDistance: 0.5, currentStreak: 1, longestStreak: 1, walksByPrayer: {} });
    expect(newBadges.length).toBeGreaterThan(0);
    expect(newBadges.some((b) => b.id === "first_steps")).toBe(true);
  });
});

// ── Step Counter ─────────────────────────────────────────────────

describe("Step counter utilities", () => {
  it("pace categories cover all ranges", () => {
    expect(getPaceCategory(0).label).toBe("Stationary");
    expect(getPaceCategory(50).label).toBe("Slow");
    expect(getPaceCategory(100).label).toBe("Dignified");
    expect(getPaceCategory(100).isTooFast).toBe(false);
    expect(getPaceCategory(140).label).toBe("Brisk");
    expect(getPaceCategory(160).label).toBe("Too Fast");
    expect(getPaceCategory(160).isTooFast).toBe(true);
    expect(getPaceCategory(160).sunnahLink).toContain("bukhari:636");
  });

  it("isStepCountingAvailable returns boolean", () => {
    const result = isStepCountingAvailable();
    expect(typeof result).toBe("boolean");
  });
});

// ── Notifications ────────────────────────────────────────────────

describe("Notification utilities", () => {
  it("isNotificationSupported detects API", () => {
    const result = isNotificationSupported();
    expect(typeof result).toBe("boolean");
  });

  it("getNotificationPermission returns string", () => {
    const perm = getNotificationPermission();
    expect(typeof perm).toBe("string");
  });
});

// ── Data integrity ───────────────────────────────────────────────

describe("Data integrity", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem("mosquesteps_history", "not json");
    expect(getWalkHistory()).toEqual([]);
  });

  it("handles corrupted settings gracefully", () => {
    localStorage.setItem("mosquesteps_settings", "{broken");
    const s = getSettings();
    expect(s.walkingSpeed).toBe(5); // default
  });

  it("settings merge preserves existing keys", () => {
    saveSettings({ walkingSpeed: 4, selectedMosqueName: "Al-Noor" });
    saveSettings({ cityName: "Cairo" });
    const s = getSettings();
    expect(s.walkingSpeed).toBe(4);
    expect(s.selectedMosqueName).toBe("Al-Noor");
    expect(s.cityName).toBe("Cairo");
  });

  it("walk entries maintain order (newest first)", () => {
    addWalkEntry({ date: "2026-01-01T08:00:00Z", mosqueName: "Old", distanceKm: 0.5, steps: 100, walkingTimeMin: 5, hasanat: 200, prayer: "Fajr" });
    addWalkEntry({ date: "2026-02-10T08:00:00Z", mosqueName: "New", distanceKm: 0.5, steps: 100, walkingTimeMin: 5, hasanat: 200, prayer: "Dhuhr" });
    const history = getWalkHistory();
    expect(history[0].mosqueName).toBe("New");
    expect(history[1].mosqueName).toBe("Old");
  });
});

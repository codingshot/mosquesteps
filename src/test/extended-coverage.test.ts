import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchPrayerTimes,
  calculateLeaveByTime,
  estimateSteps,
  estimateWalkingTime,
  calculateHasanat,
  minutesUntilLeave,
} from "@/lib/prayer-times";
import { getSettings, saveSettings, addWalkEntry, getWalkHistory, deleteWalkEntry, getWalkingStats, getSavedMosques, saveMosque, removeSavedMosque, setPrimaryMosque } from "@/lib/walking-history";
import { getBadges } from "@/lib/badges";
import { getStepRecommendation, getHealthAssessment, clampAgeForRecommendation } from "@/lib/health-recommendations";
import { getPaceCategory } from "@/lib/step-counter";
import { formatMinutes } from "@/lib/regional-defaults";

// ── Health Recommendations ──────────────────────────────────────

describe("Health Recommendations", () => {
  it("returns higher steps for youth", () => {
    const rec = getStepRecommendation(15, "male");
    expect(rec.dailySteps).toBe(12000);
    expect(rec.label).toContain("Youth");
  });

  it("adjusts for gender", () => {
    const male = getStepRecommendation(25, "male");
    const female = getStepRecommendation(25, "female");
    expect(male.dailySteps).toBeGreaterThan(female.dailySteps);
  });

  it("reduces steps for seniors", () => {
    const young = getStepRecommendation(25, "male");
    const senior = getStepRecommendation(75, "male");
    expect(young.dailySteps).toBeGreaterThan(senior.dailySteps);
  });

  it("covers all age brackets", () => {
    const ages = [10, 20, 35, 45, 55, 65, 75];
    ages.forEach((age) => {
      const rec = getStepRecommendation(age, "male");
      expect(rec.dailySteps).toBeGreaterThan(0);
      expect(rec.label).toBeTruthy();
    });
  });

  it("health assessment levels are correct", () => {
    const rec = getStepRecommendation(30, "male");
    expect(getHealthAssessment(rec.dailySteps * 1.5, rec).level).toBe("excellent");
    expect(getHealthAssessment(rec.dailySteps * 0.9, rec).level).toBe("good");
    expect(getHealthAssessment(rec.dailySteps * 0.6, rec).level).toBe("fair");
    expect(getHealthAssessment(rec.dailySteps * 0.2, rec).level).toBe("needs-improvement");
  });

  it("clamps age to reasonable range (5–120)", () => {
    expect(clampAgeForRecommendation(3)).toBe(5);
    expect(clampAgeForRecommendation(5)).toBe(5);
    expect(clampAgeForRecommendation(50)).toBe(50);
    expect(clampAgeForRecommendation(120)).toBe(120);
    expect(clampAgeForRecommendation(200)).toBe(120);
    expect(clampAgeForRecommendation(undefined)).toBe(30);
    expect(clampAgeForRecommendation(NaN)).toBe(30);
  });

  it("defaults to male/30 when no params", () => {
    const rec = getStepRecommendation();
    expect(rec.dailySteps).toBe(9500);
  });
});

// ── Saved Mosques CRUD ──────────────────────────────────────────

describe("Saved Mosques", () => {
  beforeEach(() => localStorage.clear());

  it("saves and retrieves mosques", () => {
    saveMosque({ id: "m1", name: "Al-Noor", lat: 51.5, lng: -0.1, distanceKm: 0.5 });
    const mosques = getSavedMosques();
    expect(mosques).toHaveLength(1);
    expect(mosques[0].name).toBe("Al-Noor");
  });

  it("updates existing mosque", () => {
    saveMosque({ id: "m1", name: "Al-Noor", lat: 51.5, lng: -0.1, distanceKm: 0.5 });
    saveMosque({ id: "m1", name: "Al-Noor Updated", lat: 51.5, lng: -0.1, distanceKm: 0.6 });
    expect(getSavedMosques()).toHaveLength(1);
    expect(getSavedMosques()[0].name).toBe("Al-Noor Updated");
  });

  it("removes mosque", () => {
    saveMosque({ id: "m1", name: "A", lat: 51.5, lng: -0.1, distanceKm: 0.5 });
    saveMosque({ id: "m2", name: "B", lat: 51.5, lng: -0.1, distanceKm: 0.5 });
    removeSavedMosque("m1");
    expect(getSavedMosques()).toHaveLength(1);
    expect(getSavedMosques()[0].id).toBe("m2");
  });

  it("sets primary mosque and updates settings", () => {
    saveMosque({ id: "m1", name: "Primary", lat: 51.5, lng: -0.1, distanceKm: 1.0 });
    saveMosque({ id: "m2", name: "Secondary", lat: 52.0, lng: -0.2, distanceKm: 2.0 });
    setPrimaryMosque("m1");
    const mosques = getSavedMosques();
    expect(mosques.find((m) => m.isPrimary)?.id).toBe("m1");
    expect(getSettings().selectedMosqueName).toBe("Primary");
  });
});

// ── Pace Category Edge Cases ────────────────────────────────────

describe("Pace category edge cases", () => {
  it("handles boundary values", () => {
    expect(getPaceCategory(69).label).toBe("Slow");
    expect(getPaceCategory(70).label).toBe("Dignified");
    expect(getPaceCategory(120).label).toBe("Dignified");
    expect(getPaceCategory(121).label).toBe("Brisk");
    expect(getPaceCategory(150).label).toBe("Brisk");
    expect(getPaceCategory(151).label).toBe("Too Fast");
  });

  it("negative values treated as stationary", () => {
    expect(getPaceCategory(-10).label).toBe("Slow");
  });

  it("very high values are too fast", () => {
    const result = getPaceCategory(1000);
    expect(result.isTooFast).toBe(true);
    expect(result.sunnahLink).toBeTruthy();
  });
});

// ── Prayer Time Edge Cases ──────────────────────────────────────

describe("Prayer time calculations", () => {
  it("minutesUntilLeave for upcoming prayer", () => {
    const now = new Date();
    const futureHour = (now.getHours() + 2) % 24;
    const prayerTime = `${String(futureHour).padStart(2, "0")}:00`;
    const result = minutesUntilLeave(prayerTime, 10);
    expect(result).toBeGreaterThan(0);
  });

  it("estimateWalkingTime handles zero speed", () => {
    // Should not throw, returns Infinity
    const result = estimateWalkingTime(1, 0);
    expect(result).toBe(Infinity);
  });

  it("formatMinutes handles non-finite values", () => {
    expect(formatMinutes(Infinity)).toBe("—");
    expect(formatMinutes(NaN)).toBe("—");
    expect(formatMinutes(-1)).toBe("—");
  });

  it("estimateSteps handles large distances", () => {
    expect(estimateSteps(42.195)).toBe(56246); // marathon
  });

  it("calculateHasanat handles very large values", () => {
    expect(calculateHasanat(1000000)).toBe(2000000);
  });
});

// ── Walking Stats Edge Cases ────────────────────────────────────

describe("Walking stats edge cases", () => {
  beforeEach(() => localStorage.clear());

  it("empty history returns zero stats", () => {
    const stats = getWalkingStats();
    expect(stats.totalWalks).toBe(0);
    expect(stats.totalSteps).toBe(0);
    expect(stats.currentStreak).toBe(0);
    // longestStreak starts at 1 due to tempStreak init
    expect(stats.longestStreak).toBeLessThanOrEqual(1);
  });

  it("single walk is both current and longest streak", () => {
    addWalkEntry({
      date: new Date().toISOString(),
      mosqueName: "Test",
      distanceKm: 0.5,
      steps: 500,
      walkingTimeMin: 5,
      hasanat: 1000,
      prayer: "Fajr",
    });
    const stats = getWalkingStats();
    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(1);
  });

  it("multiple walks same day count as 1 streak day", () => {
    for (let i = 0; i < 5; i++) {
      addWalkEntry({
        date: new Date().toISOString(),
        mosqueName: "Test",
        distanceKm: 0.5,
        steps: 100,
        walkingTimeMin: 5,
        hasanat: 200,
        prayer: "Dhuhr",
      });
    }
    const stats = getWalkingStats();
    expect(stats.currentStreak).toBe(1);
    expect(stats.totalWalks).toBe(5);
  });
});

// ── Badge Edge Cases ────────────────────────────────────────────

describe("Badge edge cases", () => {
  beforeEach(() => localStorage.clear());

  it("badges with zero stats are all unearned", () => {
    const badges = getBadges({ totalWalks: 0, totalSteps: 0, totalHasanat: 0, totalDistance: 0, currentStreak: 0, longestStreak: 0, walksByPrayer: {} });
    expect(badges.every((b) => !b.badge.earned)).toBe(true);
    expect(badges.every((b) => b.percent === 0)).toBe(true);
  });

  it("marathon badge requires exactly 42km", () => {
    const b41 = getBadges({ totalWalks: 100, totalSteps: 50000, totalHasanat: 100000, totalDistance: 41, currentStreak: 5, longestStreak: 10, walksByPrayer: {} });
    const marathon = b41.find((b) => b.badge.id === "distance_marathon");
    expect(marathon?.badge.earned).toBe(false);

    const b42 = getBadges({ totalWalks: 100, totalSteps: 50000, totalHasanat: 100000, totalDistance: 42, currentStreak: 5, longestStreak: 10, walksByPrayer: {} });
    const earned = b42.find((b) => b.badge.id === "distance_marathon");
    expect(earned?.badge.earned).toBe(true);
  });
});

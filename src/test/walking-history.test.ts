import { describe, it, expect, beforeEach } from "vitest";
import {
  getSettings,
  saveSettings,
  getWalkHistory,
  addWalkEntry,
  deleteWalkEntry,
  getWalkingStats,
} from "@/lib/walking-history";

describe("walking-history", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getSettings / saveSettings", () => {
    it("returns defaults when no settings saved", () => {
      const s = getSettings();
      expect(s.walkingSpeed).toBe(5);
      expect(s.selectedMosqueName).toBe("My Mosque");
      expect(s.selectedMosqueDistance).toBe(0.8);
    });

    it("saves and retrieves settings", () => {
      saveSettings({ walkingSpeed: 4, selectedMosqueName: "Al-Aqsa" });
      const s = getSettings();
      expect(s.walkingSpeed).toBe(4);
      expect(s.selectedMosqueName).toBe("Al-Aqsa");
      expect(s.selectedMosqueDistance).toBe(0.8); // unchanged default
    });

    it("merges partial settings with existing", () => {
      saveSettings({ walkingSpeed: 6 });
      saveSettings({ selectedMosqueDistance: 2.5 });
      const s = getSettings();
      expect(s.walkingSpeed).toBe(6);
      expect(s.selectedMosqueDistance).toBe(2.5);
    });
  });

  describe("walk history CRUD", () => {
    it("returns empty array when no history", () => {
      expect(getWalkHistory()).toEqual([]);
    });

    it("adds a walk entry", () => {
      const entry = addWalkEntry({
        date: "2026-02-10T12:00:00Z",
        mosqueName: "Test Mosque",
        distanceKm: 0.8,
        steps: 1066,
        walkingTimeMin: 10,
        hasanat: 2132,
        prayer: "Dhuhr",
      });
      expect(entry.id).toBeTruthy();
      expect(getWalkHistory()).toHaveLength(1);
      expect(getWalkHistory()[0].mosqueName).toBe("Test Mosque");
    });

    it("adds entries in reverse chronological order", () => {
      addWalkEntry({ date: "2026-02-09", mosqueName: "First", distanceKm: 1, steps: 1333, walkingTimeMin: 12, hasanat: 2666, prayer: "Fajr" });
      addWalkEntry({ date: "2026-02-10", mosqueName: "Second", distanceKm: 1, steps: 1333, walkingTimeMin: 12, hasanat: 2666, prayer: "Dhuhr" });
      const history = getWalkHistory();
      expect(history[0].mosqueName).toBe("Second");
    });

    it("deletes a walk entry", () => {
      const entry = addWalkEntry({ date: "2026-02-10", mosqueName: "Test", distanceKm: 1, steps: 1333, walkingTimeMin: 12, hasanat: 2666, prayer: "Asr" });
      expect(getWalkHistory()).toHaveLength(1);
      deleteWalkEntry(entry.id);
      expect(getWalkHistory()).toHaveLength(0);
    });
  });

  describe("getWalkingStats", () => {
    it("returns zeros when no history", () => {
      const stats = getWalkingStats();
      expect(stats.totalSteps).toBe(0);
      expect(stats.totalWalks).toBe(0);
      expect(stats.totalHasanat).toBe(0);
      expect(stats.totalDistance).toBe(0);
    });

    it("calculates totals correctly", () => {
      addWalkEntry({ date: "2026-02-10", mosqueName: "M1", distanceKm: 0.5, steps: 666, walkingTimeMin: 6, hasanat: 1332, prayer: "Fajr" });
      addWalkEntry({ date: "2026-02-10", mosqueName: "M1", distanceKm: 1.0, steps: 1333, walkingTimeMin: 12, hasanat: 2666, prayer: "Dhuhr" });
      const stats = getWalkingStats();
      expect(stats.totalSteps).toBe(1999);
      expect(stats.totalDistance).toBe(1.5);
      expect(stats.totalHasanat).toBe(3998);
      expect(stats.totalWalks).toBe(2);
    });

    it("counts walks by prayer", () => {
      addWalkEntry({ date: "2026-02-10", mosqueName: "M1", distanceKm: 1, steps: 1333, walkingTimeMin: 12, hasanat: 2666, prayer: "Fajr" });
      addWalkEntry({ date: "2026-02-10", mosqueName: "M1", distanceKm: 1, steps: 1333, walkingTimeMin: 12, hasanat: 2666, prayer: "Fajr" });
      addWalkEntry({ date: "2026-02-10", mosqueName: "M1", distanceKm: 1, steps: 1333, walkingTimeMin: 12, hasanat: 2666, prayer: "Isha" });
      const stats = getWalkingStats();
      expect(stats.walksByPrayer["Fajr"]).toBe(2);
      expect(stats.walksByPrayer["Isha"]).toBe(1);
    });
  });
});

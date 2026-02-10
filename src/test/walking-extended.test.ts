import { describe, it, expect, beforeEach } from "vitest";
import {
  addWalkEntry,
  getWalkHistory,
  getWalkingStats,
  deleteWalkEntry,
} from "@/lib/walking-history";

describe("Walking History - Extended", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("records prayer type in walk entries", () => {
    addWalkEntry({
      date: "2026-02-10T06:00:00Z",
      mosqueName: "Fajr Mosque",
      distanceKm: 0.5,
      steps: 666,
      walkingTimeMin: 6,
      hasanat: 1332,
      prayer: "Fajr",
    });
    const history = getWalkHistory();
    expect(history[0].prayer).toBe("Fajr");
  });

  it("tracks walks by prayer in stats", () => {
    addWalkEntry({ date: "2026-02-10", mosqueName: "M", distanceKm: 1, steps: 1333, walkingTimeMin: 12, hasanat: 2666, prayer: "Fajr" });
    addWalkEntry({ date: "2026-02-10", mosqueName: "M", distanceKm: 1, steps: 1333, walkingTimeMin: 12, hasanat: 2666, prayer: "Fajr" });
    addWalkEntry({ date: "2026-02-10", mosqueName: "M", distanceKm: 1, steps: 1333, walkingTimeMin: 12, hasanat: 2666, prayer: "Isha" });
    addWalkEntry({ date: "2026-02-10", mosqueName: "M", distanceKm: 1, steps: 1333, walkingTimeMin: 12, hasanat: 2666, prayer: "Dhuhr" });

    const stats = getWalkingStats();
    expect(stats.walksByPrayer["Fajr"]).toBe(2);
    expect(stats.walksByPrayer["Isha"]).toBe(1);
    expect(stats.walksByPrayer["Dhuhr"]).toBe(1);
    expect(stats.totalWalks).toBe(4);
  });

  it("handles multiple walk entries on same day", () => {
    addWalkEntry({ date: "2026-02-10T06:00:00Z", mosqueName: "M", distanceKm: 0.5, steps: 666, walkingTimeMin: 6, hasanat: 1332, prayer: "Fajr" });
    addWalkEntry({ date: "2026-02-10T13:00:00Z", mosqueName: "M", distanceKm: 0.5, steps: 666, walkingTimeMin: 6, hasanat: 1332, prayer: "Dhuhr" });
    addWalkEntry({ date: "2026-02-10T16:00:00Z", mosqueName: "M", distanceKm: 0.5, steps: 666, walkingTimeMin: 6, hasanat: 1332, prayer: "Asr" });

    const stats = getWalkingStats();
    expect(stats.totalWalks).toBe(3);
    expect(stats.totalSteps).toBe(1998);
  });

  it("deleting an entry updates stats", () => {
    const e1 = addWalkEntry({ date: "2026-02-10", mosqueName: "M", distanceKm: 1, steps: 1000, walkingTimeMin: 12, hasanat: 2000, prayer: "Fajr" });
    addWalkEntry({ date: "2026-02-10", mosqueName: "M", distanceKm: 2, steps: 2666, walkingTimeMin: 24, hasanat: 5332, prayer: "Dhuhr" });

    deleteWalkEntry(e1.id);
    const stats = getWalkingStats();
    expect(stats.totalWalks).toBe(1);
    expect(stats.totalSteps).toBe(2666);
  });
});

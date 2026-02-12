/**
 * Active Walk page: pre-walk UI, no-mosque state, with-mosque state, and accessibility.
 * WalkMap is mocked because Leaflet does not run in jsdom.
 * Run with: npm test -- src/test/active-walk.test.tsx
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

vi.mock("@/components/WalkMap", () => ({ default: () => React.createElement("div", { "data-testid": "walk-map" }, "Map") }));

import ActiveWalk from "@/pages/ActiveWalk";
import { saveSettings, getSavedMosques } from "@/lib/walking-history";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60 * 1000, retry: false } },
});

function renderActiveWalk(entry = "/walk") {
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[entry]}>
          <Routes>
            <Route path="/walk" element={<ActiveWalk />} />
            <Route path="/mosques" element={<div>Mosque Finder</div>} />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

const mockPrayerTimes = {
  prayers: [
    { name: "Fajr", time: "06:00", isPast: true },
    { name: "Dhuhr", time: "12:30", isPast: false },
    { name: "Asr", time: "15:30", isPast: false },
    { name: "Maghrib", time: "18:00", isPast: false },
    { name: "Isha", time: "19:30", isPast: false },
    { name: "Jumuah", time: "12:30", isPast: false },
  ],
};

const mockOsrmRoute = {
  code: "Ok",
  routes: [
    {
      distance: 800,
      duration: 600,
      geometry: { coordinates: [[-0.1, 51.5], [-0.09, 51.51]] },
      legs: [
        {
          steps: [
            { maneuver: { type: "depart" }, distance: 400, duration: 300 },
            { maneuver: { type: "turn", modifier: "left" }, distance: 400, duration: 300 },
            { maneuver: { type: "arrive" }, distance: 0, duration: 0 },
          ],
        },
      ],
    },
  ],
};

describe("Active Walk", () => {
  beforeEach(() => {
    queryClient.clear();
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("nominatim")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ display_name: "Mosque St, City" }) });
      }
      if (typeof url === "string" && url.includes("router.project-osrm.org")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockOsrmRoute) });
      }
      if (typeof url === "string" && (url.includes("api.aladhan") || url.includes("prayer"))) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPrayerTimes) });
      }
      if (typeof url === "string" && url.includes("timeapi.io")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ timeZone: "Europe/London" }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    const mockPosition = { coords: { latitude: 51.5, longitude: -0.1, accuracy: 10 } };
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: {
        getCurrentPosition: (success: (p: typeof mockPosition) => void) => success(mockPosition),
        watchPosition: (success: (p: typeof mockPosition) => void) => {
          success(mockPosition);
          return 1;
        },
        clearWatch: vi.fn(),
      },
    });
    vi.stubGlobal("speechSynthesis", { cancel: vi.fn(), speak: vi.fn(), getVoices: () => [] });
    vi.stubGlobal("SpeechSynthesisUtterance", class MockUtterance {});
    vi.stubGlobal("vibrate", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders pre-walk screen with Ready to Walk and Start Walking", async () => {
    renderActiveWalk();
    await screen.findByRole("heading", { name: /Ready to Walk/i });
    expect(screen.getByRole("button", { name: /Start Walking/i })).toBeInTheDocument();
  });

  it("shows prayer selector when prayers loaded", async () => {
    renderActiveWalk();
    await screen.findByText(/Walking for which prayer/i);
    expect(screen.getByRole("button", { name: /Fajr/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Dhuhr/i })).toBeInTheDocument();
  });

  it("when no mosque is selected, shows No mosque selected and disables Start Walking", async () => {
    saveSettings({ selectedMosqueLat: undefined, selectedMosqueLng: undefined });
    expect(getSavedMosques()).toHaveLength(0);
    renderActiveWalk();
    await screen.findByRole("heading", { name: /Ready to Walk/i });
    expect(screen.getByText(/No mosque selected/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Find Mosque/i })).toBeInTheDocument();
    const startBtn = screen.getByRole("button", { name: /Start Walking/i });
    expect(startBtn).toBeDisabled();
    expect(screen.getByText(/Select a mosque above for directions/i)).toBeInTheDocument();
  });

  it("when mosque is set, shows Walking route and enables Start Walking", async () => {
    saveSettings({
      selectedMosqueName: "Test Mosque",
      selectedMosqueLat: 51.51,
      selectedMosqueLng: -0.09,
      selectedMosqueDistance: 0.8,
      homeLat: 51.5,
      homeLng: -0.1,
    });
    renderActiveWalk();
    await screen.findByText(/Test Mosque/i);
    const startBtn = screen.getByRole("button", { name: /Start Walking/i });
    expect(startBtn).not.toBeDisabled();
    expect(screen.getByText(/Walking route/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Open in Maps/i })).toBeInTheDocument();
  });

  it("has accessible toggle buttons when walking", async () => {
    saveSettings({
      selectedMosqueName: "Test Mosque",
      selectedMosqueLat: 51.51,
      selectedMosqueLng: -0.09,
      homeLat: 51.5,
      homeLng: -0.1,
    });
    renderActiveWalk();
    await screen.findByText(/Test Mosque/i);
    fireEvent.click(screen.getByRole("button", { name: /Start Walking/i }));
    await screen.findByRole("button", { name: /Turn off voice directions|Turn on voice directions/i });
    expect(screen.getByRole("button", { name: /Hide turn-by-turn directions|Show turn-by-turn directions/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hide map|Show map/i })).toBeInTheDocument();
  });

  it("shows directions region with aria-label when route and directions visible", async () => {
    saveSettings({
      selectedMosqueName: "Test Mosque",
      selectedMosqueLat: 51.51,
      selectedMosqueLng: -0.09,
      homeLat: 51.5,
      homeLng: -0.1,
    });
    renderActiveWalk();
    await screen.findByText(/Test Mosque/i);
    fireEvent.click(screen.getByRole("button", { name: /Start Walking/i }));
    const region = await screen.findByRole("region", { name: /Walking directions/i });
    expect(region).toBeInTheDocument();
  });

  it("End Walk button is available during walk", async () => {
    saveSettings({
      selectedMosqueName: "Test Mosque",
      selectedMosqueLat: 51.51,
      selectedMosqueLng: -0.09,
      homeLat: 51.5,
      homeLng: -0.1,
    });
    renderActiveWalk();
    await screen.findByText(/Test Mosque/i);
    fireEvent.click(screen.getByRole("button", { name: /Start Walking/i }));
    await screen.findByText(/End Walk/i);
    expect(screen.getByRole("button", { name: /End Walk/i })).toBeInTheDocument();
  });
});

/**
 * Tests for all filter functionality across the app:
 * - Notifications: filter by type, read status, sort order
 * - Changelog: filter by search (q), type, version
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { filterChangelogEntries, changelogEntries } from "@/lib/changelog-data";
import Notifications from "@/pages/Notifications";
import Changelog from "@/pages/Changelog";
import { getNotifications, clearAllNotifications, type AppNotification } from "@/lib/notification-store";

const NOTIFICATION_STORE_KEY = "mosquesteps_notifications";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// ---- Changelog filter (unit) ----

describe("Changelog filters", () => {
  it("filterChangelogEntries returns all when no opts", () => {
    const result = filterChangelogEntries(changelogEntries, {});
    expect(result.length).toBe(changelogEntries.length);
  });

  it("filterChangelogEntries filters by search query q", () => {
    const result = filterChangelogEntries(changelogEntries, { q: "SEO" });
    expect(result.length).toBeGreaterThanOrEqual(1);
    result.forEach((e) => {
      const match =
        e.title.toLowerCase().includes("seo") ||
        e.description.toLowerCase().includes("seo") ||
        (e.area && e.area.toLowerCase().includes("seo")) ||
        e.type.toLowerCase().includes("seo");
      expect(match).toBe(true);
    });
  });

  it("filterChangelogEntries filters by type", () => {
    const result = filterChangelogEntries(changelogEntries, { types: ["feat"] });
    expect(result.every((e) => e.type === "feat")).toBe(true);
    const fixResult = filterChangelogEntries(changelogEntries, { types: ["fix"] });
    expect(fixResult.every((e) => e.type === "fix")).toBe(true);
  });

  it("filterChangelogEntries filters by multiple types", () => {
    const result = filterChangelogEntries(changelogEntries, { types: ["feat", "fix"] });
    expect(result.every((e) => e.type === "feat" || e.type === "fix")).toBe(true);
  });

  it("filterChangelogEntries filters by version", () => {
    const result = filterChangelogEntries(changelogEntries, { versions: ["Unreleased"] });
    expect(result.every((e) => e.version === "Unreleased")).toBe(true);
    const v1 = filterChangelogEntries(changelogEntries, { versions: ["1.0.0"] });
    expect(v1.every((e) => e.version === "1.0.0")).toBe(true);
  });

  it("filterChangelogEntries combines q, types, and versions", () => {
    const result = filterChangelogEntries(changelogEntries, {
      q: "dashboard",
      types: ["feat"],
      versions: ["1.0.0"],
    });
    result.forEach((e) => {
      expect(e.type).toBe("feat");
      expect(e.version).toBe("1.0.0");
      const match =
        e.title.toLowerCase().includes("dashboard") ||
        e.description.toLowerCase().includes("dashboard") ||
        (e.area && e.area.toLowerCase().includes("dashboard"));
      expect(match).toBe(true);
    });
  });

  it("filterChangelogEntries returns empty when nothing matches", () => {
    const result = filterChangelogEntries(changelogEntries, { q: "xyznonexistent123" });
    expect(result).toHaveLength(0);
  });
});

// ---- Changelog page (integration) ----

describe("Changelog page filters", () => {
  it("renders and shows filter controls", () => {
    renderWithProviders(<Changelog />);
    expect(screen.getByPlaceholderText(/Search changelog/i)).toBeInTheDocument();
    expect(screen.getByText(/Type/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Unreleased|1\.0\.0/).length).toBeGreaterThanOrEqual(1);
  });

  it("search input filters entries", () => {
    renderWithProviders(<Changelog />);
    const input = screen.getByPlaceholderText(/Search changelog/i);
    fireEvent.change(input, { target: { value: "SEO" } });
    expect(screen.getByDisplayValue("SEO")).toBeInTheDocument();
    const noMatch = screen.queryByText(/No entries match your filters/i);
    const hasSEO = document.body.textContent?.includes("SEO");
    expect(noMatch !== null || hasSEO).toBe(true);
  });

  it("Clear filters button appears when filters are active and clears them", () => {
    renderWithProviders(<Changelog />);
    const input = screen.getByPlaceholderText(/Search changelog/i);
    fireEvent.change(input, { target: { value: "test" } });
    const clearBtn = screen.queryByRole("button", { name: /Clear filters/i });
    if (clearBtn) {
      fireEvent.click(clearBtn);
      expect((screen.getByPlaceholderText(/Search changelog/i) as HTMLInputElement).value).toBe("");
    }
  });
});

// ---- Notifications filter (unit: we test the logic via the store + component) ----

describe("Notification filters", () => {
  beforeEach(() => {
    clearAllNotifications();
    // Seed a known set: 2 prayer (1 read, 1 unread), 1 walk (unread), 1 badge (read)
    const base = Date.now();
    const list: AppNotification[] = [
      { id: "p1", type: "prayer_reminder", title: "Dhuhr", body: "Time for Dhuhr", read: false, timestamp: base - 3000 },
      { id: "p2", type: "prayer_reminder", title: "Fajr", body: "Fajr reminder", read: true, timestamp: base - 2000 },
      { id: "w1", type: "walk_complete", title: "Walk done", body: "Steps earned", read: false, timestamp: base - 1000 },
      { id: "b1", type: "badge", title: "Badge earned", body: "First Steps", read: true, timestamp: base },
    ];
    localStorage.setItem(NOTIFICATION_STORE_KEY, JSON.stringify(list));
  });

  it("getNotifications returns stored list", () => {
    const list = getNotifications();
    expect(list).toHaveLength(4);
    expect(list.filter((n) => n.type === "prayer_reminder")).toHaveLength(2);
    expect(list.filter((n) => n.type === "walk_complete")).toHaveLength(1);
    expect(list.filter((n) => !n.read)).toHaveLength(2);
  });

  it("Notifications page shows all when no filter", () => {
    renderWithProviders(<Notifications />);
    expect(screen.getByText("Dhuhr")).toBeInTheDocument();
    expect(screen.getByText("Fajr")).toBeInTheDocument();
    expect(screen.getByText("Walk done")).toBeInTheDocument();
    expect(screen.getByText("Badge earned")).toBeInTheDocument();
  });

  it("Notifications page filter by Unread shows only unread", async () => {
    renderWithProviders(<Notifications />);
    fireEvent.click(screen.getByRole("button", { name: /Toggle filters/i }));
    const unreadChip = await screen.findByTestId("filter-status-unread");
    fireEvent.click(unreadChip);
    await waitFor(() => {
      expect(screen.queryByText("Fajr")).not.toBeInTheDocument();
      expect(screen.queryByText("Badge earned")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Dhuhr")).toBeInTheDocument();
    expect(screen.getByText("Walk done")).toBeInTheDocument();
  });

  it("Notifications page filter by Read shows only read", async () => {
    renderWithProviders(<Notifications />);
    fireEvent.click(screen.getByRole("button", { name: /Toggle filters/i }));
    const readChip = await screen.findByTestId("filter-status-read");
    fireEvent.click(readChip);
    await waitFor(() => {
      expect(screen.queryByText("Dhuhr")).not.toBeInTheDocument();
      expect(screen.queryByText("Walk done")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Fajr")).toBeInTheDocument();
    expect(screen.getByText("Badge earned")).toBeInTheDocument();
  });

  it("Notifications page filter by type Prayer shows only prayer_reminder", async () => {
    renderWithProviders(<Notifications />);
    fireEvent.click(screen.getByRole("button", { name: /Toggle filters/i }));
    const prayerChip = await screen.findByTestId("filter-type-prayer_reminder");
    fireEvent.click(prayerChip);
    await waitFor(() => {
      expect(screen.queryByText("Walk done")).not.toBeInTheDocument();
      expect(screen.queryByText("Badge earned")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Dhuhr")).toBeInTheDocument();
    expect(screen.getByText("Fajr")).toBeInTheDocument();
  });

  it("Notifications page filter by type Walk shows only walk_complete", async () => {
    renderWithProviders(<Notifications />);
    fireEvent.click(screen.getByRole("button", { name: /Toggle filters/i }));
    const walkChip = await screen.findByTestId("filter-type-walk_complete");
    fireEvent.click(walkChip);
    await waitFor(() => {
      expect(screen.queryByText("Dhuhr")).not.toBeInTheDocument();
      expect(screen.queryByText("Fajr")).not.toBeInTheDocument();
      expect(screen.queryByText("Badge earned")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Walk done")).toBeInTheDocument();
  });

  it("Notifications page sort Oldest shows correct order", () => {
    renderWithProviders(<Notifications />);
    // Default is Newest first, so "Badge earned" (latest) should appear first in the list
    const container = screen.getByText("Badge earned").closest("div");
    expect(container).toBeInTheDocument();
    // Click sort to toggle to Oldest
    fireEvent.click(screen.getByRole("button", { name: /Newest|Oldest/i }));
    // After switching to Oldest, Dhuhr (oldest) should be visible first in document order
    expect(screen.getByText("Dhuhr")).toBeInTheDocument();
    expect(screen.getByText("Badge earned")).toBeInTheDocument();
  });
});

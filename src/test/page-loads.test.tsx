/**
 * Ensures every app page loads without crashing and shows expected content.
 * Run with: npm test -- src/test/page-loads.test.tsx
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "@/pages/Index";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import MosqueFinder from "@/pages/MosqueFinder";
import Rewards from "@/pages/Rewards";
import ActiveWalk from "@/pages/ActiveWalk";
import History from "@/pages/History";
import Stats from "@/pages/Stats";
import Settings from "@/pages/Settings";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Legal from "@/pages/Legal";
import Guides from "@/pages/Guides";
import GuidePage from "@/pages/GuidePage";
import FAQPage from "@/pages/FAQPage";
import HowItWorksPage from "@/pages/HowItWorksPage";
import SunnahPage from "@/pages/SunnahPage";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import BrandPage from "@/pages/BrandPage";
import Notifications from "@/pages/Notifications";
import Contribute from "@/pages/Contribute";
import IssuesPage from "@/pages/IssuesPage";
import Changelog from "@/pages/Changelog";
import Content from "@/pages/Content";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, retry: false },
  },
});

function renderAt(path: string, element: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={path.split("?")[0]} element={element} />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function renderWithRoutes(
  initialEntry: string,
  routes: { path: string; element: React.ReactElement }[]
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            {routes.map((r) => (
              <Route key={r.path} path={r.path} element={r.element} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

describe("Page loads — every route renders", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Index (/) loads and shows hero", () => {
    renderAt("/", <Index />);
    expect(screen.getByRole("heading", { name: /Walk in the Footsteps/i })).toBeInTheDocument();
  });

  it("Onboarding (/onboarding) loads", () => {
    renderAt("/onboarding", <Onboarding />);
    expect(screen.getByText(/Get started|Welcome|MosqueSteps/i)).toBeInTheDocument();
  });

  it("Dashboard (/dashboard) loads", () => {
    renderWithRoutes("/dashboard", [{ path: "/dashboard", element: <Dashboard /> }]);
    expect(screen.getAllByText(/Dashboard|Prayer|Leave by|walk/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Mosque finder (/mosques) loads", () => {
    renderWithRoutes("/mosques", [{ path: "/mosques", element: <MosqueFinder /> }]);
    expect(screen.getAllByText(/Find|mosque|Near|search/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Rewards (/rewards) loads", () => {
    renderWithRoutes("/rewards", [{ path: "/rewards", element: <Rewards /> }]);
    expect(screen.getAllByText(/Reward|hasanat|step/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Active walk (/walk) loads", () => {
    renderWithRoutes("/walk", [{ path: "/walk", element: <ActiveWalk /> }]);
    expect(screen.getAllByText(/Start walk|Find a nearby mosque|Steps|Distance/i).length).toBeGreaterThanOrEqual(1);
  });

  it("History (/history) loads", () => {
    renderWithRoutes("/history", [{ path: "/history", element: <History /> }]);
    expect(screen.getAllByText(/History|walk|Walks/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Stats (/stats) loads", () => {
    renderWithRoutes("/stats", [{ path: "/stats", element: <Stats /> }]);
    expect(screen.getAllByText(/Stats|Steps|Streak|Distance/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Settings (/settings) loads", () => {
    renderWithRoutes("/settings", [{ path: "/settings", element: <Settings /> }]);
    expect(screen.getAllByText(/Settings|Location|Notification|Walking/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Privacy (/privacy) loads", () => {
    renderWithRoutes("/privacy", [{ path: "/privacy", element: <Privacy /> }]);
    expect(screen.getAllByText(/Privacy Policy|Overview/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Terms (/terms) loads", () => {
    renderWithRoutes("/terms", [{ path: "/terms", element: <Terms /> }]);
    expect(screen.getAllByText(/Terms of Service|Disclaimer/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Legal (/legal) loads", () => {
    renderWithRoutes("/legal", [{ path: "/legal", element: <Legal /> }]);
    expect(screen.getAllByText(/Legal|Open Source|Attribution/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Guides (/guides) loads", () => {
    renderWithRoutes("/guides", [{ path: "/guides", element: <Guides /> }]);
    expect(screen.getAllByText(/User Guides|Guides|Getting Started/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Guide page (/guides/getting-started) loads", () => {
    renderWithRoutes("/guides/getting-started", [
      { path: "/guides", element: <Guides /> },
      { path: "/guides/:guideId", element: <GuidePage /> },
    ]);
    expect(screen.getAllByText(/Getting Started/i).length).toBeGreaterThanOrEqual(1);
  });

  it("FAQ (/faq) loads", () => {
    renderWithRoutes("/faq", [{ path: "/faq", element: <FAQPage /> }]);
    expect(screen.getAllByText(/FAQ|Frequently|Question/i).length).toBeGreaterThanOrEqual(1);
  });

  it("How it works (/how-it-works) loads", () => {
    renderWithRoutes("/how-it-works", [{ path: "/how-it-works", element: <HowItWorksPage /> }]);
    expect(screen.getAllByText(/How it works|Walk|mosque/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Sunnah (/sunnah) loads", () => {
    renderWithRoutes("/sunnah", [{ path: "/sunnah", element: <SunnahPage /> }]);
    expect(screen.getAllByText(/Sunnah|Hadith|step|walk/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Blog (/blogs) loads", () => {
    renderWithRoutes("/blogs", [{ path: "/blogs", element: <Blog /> }]);
    expect(screen.getAllByText(/MosqueSteps Blog|Sunnah|Blog/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Blog post (/blogs/virtues-of-walking-to-mosque) loads", () => {
    renderWithRoutes("/blogs/virtues-of-walking-to-mosque", [
      { path: "/blogs", element: <Blog /> },
      { path: "/blogs/:slug", element: <BlogPost /> },
    ]);
    expect(screen.getAllByText(/Virtues|Walking|Mosque|reward/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Brand (/brand) loads", () => {
    renderWithRoutes("/brand", [{ path: "/brand", element: <BrandPage /> }]);
    expect(screen.getAllByText(/Brand|MosqueSteps|Guidelines/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Notifications (/notifications) loads", () => {
    renderWithRoutes("/notifications", [{ path: "/notifications", element: <Notifications /> }]);
    expect(screen.getAllByText(/Notification|Alert|reminder/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Contribute (/contribute) loads", () => {
    renderWithRoutes("/contribute", [{ path: "/contribute", element: <Contribute /> }]);
    expect(screen.getAllByText(/Contribute|contribution|open source/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Issues (/issues) loads", () => {
    renderWithRoutes("/issues", [{ path: "/issues", element: <IssuesPage /> }]);
    expect(screen.getAllByText(/Issue|GitHub|bug|feature/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Changelog (/changelog) loads", () => {
    renderWithRoutes("/changelog", [{ path: "/changelog", element: <Changelog /> }]);
    expect(screen.getAllByText(/Changelog|What's new|Unreleased/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Content (/content) loads", () => {
    renderWithRoutes("/content", [{ path: "/content", element: <Content /> }]);
    expect(screen.getAllByText(/Content|Blog|FAQ|Guide/i).length).toBeGreaterThanOrEqual(1);
  });

  it("NotFound (*) loads for unknown path", () => {
    renderWithRoutes("/some-unknown-path", [{ path: "*", element: <NotFound /> }]);
    expect(screen.getAllByText(/404|page doesn't exist|Quick actions/i).length).toBeGreaterThanOrEqual(1);
  });
});

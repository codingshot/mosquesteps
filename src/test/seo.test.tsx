import { describe, it, expect, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "@/pages/Index";
import FAQPage from "@/pages/FAQPage";
import HowItWorksPage from "@/pages/HowItWorksPage";
import SunnahPage from "@/pages/SunnahPage";
import Rewards from "@/pages/Rewards";
import MosqueFinder from "@/pages/MosqueFinder";
import Blog from "@/pages/Blog";
import NotFound from "@/pages/NotFound";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";

const renderAt = (path: string) =>
  render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/sunnah" element={<SunnahPage />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/mosques" element={<MosqueFinder />} />
          <Route path="/blogs" element={<Blog />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>
  );

describe("SEO and AI discoverability", () => {
  afterEach(() => {
    document.title = "";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "");
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.remove();
  });

  it("Index sets title and meta description", async () => {
    renderAt("/");
    await waitFor(() => {
      expect(document.title).toContain("MosqueSteps");
      expect(document.title).toMatch(/blessing|step/i);
    });
    const desc = document.querySelector('meta[name="description"]')?.getAttribute("content");
    expect(desc).toBeTruthy();
    expect(desc).toMatch(/track|walk|mosque|reward|hadith|prayer/i);
  });

  it("FAQ page sets title and description", async () => {
    renderAt("/faq");
    await waitFor(() => {
      expect(document.title).toMatch(/FAQ|Frequently/i);
      expect(document.title).toContain("MosqueSteps");
    });
    const desc = document.querySelector('meta[name="description"]')?.getAttribute("content");
    expect(desc).toMatch(/question|walking|mosque|tracker|reward/i);
  });

  it("How it works page has SEO meta", async () => {
    renderAt("/how-it-works");
    await waitFor(() => {
      expect(document.title).toMatch(/How|Works|MosqueSteps/i);
    });
    const desc = document.querySelector('meta[name="description"]')?.getAttribute("content");
    expect(desc).toBeTruthy();
  });

  it("Sunnah page has title and description", async () => {
    renderAt("/sunnah");
    await waitFor(() => {
      expect(document.title).toMatch(/Sunnah|Walking|MosqueSteps/i);
    });
    const desc = document.querySelector('meta[name="description"]')?.getAttribute("content");
    expect(desc).toMatch(/hadith|reward|step|blessing/i);
  });

  it("Rewards page has SEO meta", async () => {
    renderAt("/rewards");
    await waitFor(() => {
      expect(document.title).toMatch(/Reward|Badge|MosqueSteps/i);
    });
    const desc = document.querySelector('meta[name="description"]')?.getAttribute("content");
    expect(desc).toMatch(/hasanat|badge|hadith/i);
  });

  it("Privacy page has title and description", async () => {
    renderAt("/privacy");
    await waitFor(() => {
      expect(document.title).toMatch(/Privacy|MosqueSteps/i);
    });
    const desc = document.querySelector('meta[name="description"]')?.getAttribute("content");
    expect(desc).toMatch(/privacy|data|device/i);
  });

  it("Terms page has title and description", async () => {
    renderAt("/terms");
    await waitFor(() => {
      expect(document.title).toMatch(/Terms|MosqueSteps/i);
    });
  });

  it("NotFound sets page-not-found style title", async () => {
    renderAt("/nonexistent");
    await waitFor(() => {
      expect(document.title).toMatch(/Not Found|404|MosqueSteps/i);
    });
  });

  it("FAQ page injects FAQPage JSON-LD schema", async () => {
    renderAt("/faq");
    await waitFor(() => {
      const script = document.getElementById("faq-schema");
      expect(script).toBeInTheDocument();
      expect(script?.getAttribute("type")).toBe("application/ld+json");
      const json = JSON.parse(script?.textContent || "{}");
      expect(json["@type"]).toBe("FAQPage");
      expect(Array.isArray(json.mainEntity)).toBe(true);
      expect(json.mainEntity.length).toBeGreaterThan(0);
      expect(json.mainEntity[0]["@type"]).toBe("Question");
      expect(json.mainEntity[0].acceptedAnswer["@type"]).toBe("Answer");
    });
  });
});

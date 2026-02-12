import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import Rewards from "@/pages/Rewards";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderRewards() {
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter>
          <Rewards />
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

describe("Rewards page", () => {
  it("renders header and main title", () => {
    renderRewards();
    expect(screen.getByText("Spiritual Rewards")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Every Step is a Blessing/i })).toBeInTheDocument();
  });

  it("shows badges count and hasanat", () => {
    renderRewards();
    expect(screen.getByText(/\d+\/\d+ badges/)).toBeInTheDocument();
    expect(screen.getAllByText(/hasanat/).length).toBeGreaterThanOrEqual(1);
  });

  it("has Badges and Hadiths tabs", () => {
    renderRewards();
    expect(screen.getByRole("button", { name: /Badges/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hadiths/i })).toBeInTheDocument();
  });

  it("Badges tab shows How Rewards Are Calculated", () => {
    renderRewards();
    expect(screen.getByText(/How Rewards Are Calculated/i)).toBeInTheDocument();
    expect(screen.getByText(/Each step.*to.*the mosque/i)).toBeInTheDocument();
  });

  it("switching to Hadiths tab shows hadith content", () => {
    renderRewards();
    fireEvent.click(screen.getByRole("button", { name: /Hadiths/i }));
    expect(screen.getByText(/Explore more on Sunnah.com/i)).toBeInTheDocument();
  });

  it("link to dashboard is present", () => {
    renderRewards();
    const link = screen.getByRole("link", { name: /MosqueSteps/i });
    expect(link).toHaveAttribute("href", "/dashboard");
  });
});

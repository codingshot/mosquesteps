import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

// Test landing page components render
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";
import ProblemSolution from "@/components/landing/ProblemSolution";
import HowItWorks from "@/components/landing/HowItWorks";

const withRouter = (component: React.ReactNode) =>
  render(<BrowserRouter><TooltipProvider>{component}</TooltipProvider></BrowserRouter>);

describe("Landing Page Components", () => {
  it("Hero renders headline and CTA", () => {
    withRouter(<Hero />);
    expect(screen.getByText(/Walk in the Footsteps/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Your Blessed Journey/i)).toBeInTheDocument();
    expect(screen.getByText(/Count Every Step/i)).toBeInTheDocument();
  });

  it("Features renders all feature cards", () => {
    withRouter(<Features />);
    expect(screen.getByText("Smart Step Tracking")).toBeInTheDocument();
    expect(screen.getByText("Prayer Time Intelligence")).toBeInTheDocument();
    expect(screen.getByText("Spiritual Rewards Tracker")).toBeInTheDocument();
    expect(screen.getByText("Find Nearby Mosques")).toBeInTheDocument();
    expect(screen.getByText("Sunnah Education")).toBeInTheDocument();
    expect(screen.getByText("Progress & Streaks")).toBeInTheDocument();
  });

  it("FAQ renders questions", () => {
    withRouter(<FAQ />);
    expect(screen.getByText("How does MosqueSteps estimate my steps?")).toBeInTheDocument();
    expect(screen.getByText("Are the hadith references authentic?")).toBeInTheDocument();
  });

  it("Footer renders brand and legal links", () => {
    withRouter(<Footer />);
    expect(screen.getByText(/MosqueSteps/i)).toBeInTheDocument();
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    expect(screen.getByText("Terms of Service")).toBeInTheDocument();
    expect(screen.getByText("Legal Info")).toBeInTheDocument();
  });

  it("ProblemSolution renders both sections", () => {
    withRouter(<ProblemSolution />);
    expect(screen.getByText(/The Opportunity/i)).toBeInTheDocument();
    expect(screen.getByText(/The Solution/i)).toBeInTheDocument();
  });

  it("HowItWorks renders 3 steps", () => {
    withRouter(<HowItWorks />);
    expect(screen.getByText("Find Your Mosque")).toBeInTheDocument();
    expect(screen.getByText("Walk to Prayer")).toBeInTheDocument();
    expect(screen.getByText("Track Your Journey")).toBeInTheDocument();
  });
});

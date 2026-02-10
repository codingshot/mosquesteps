import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Legal from "@/pages/Legal";

const withRouter = (component: React.ReactNode) =>
  render(<BrowserRouter>{component}</BrowserRouter>);

describe("Legal Pages", () => {
  it("Privacy page renders key sections", () => {
    withRouter(<Privacy />);
    expect(screen.getAllByText("Privacy Policy").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("1. Overview")).toBeInTheDocument();
    expect(screen.getByText("4. Data Storage")).toBeInTheDocument();
  });

  it("Terms page renders disclaimer section", () => {
    withRouter(<Terms />);
    expect(screen.getAllByText("Terms of Service").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("3. Accuracy Disclaimer")).toBeInTheDocument();
  });

  it("Legal page renders attributions", () => {
    withRouter(<Legal />);
    expect(screen.getAllByText("Legal Information").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Open Source Attributions")).toBeInTheDocument();
  });
});

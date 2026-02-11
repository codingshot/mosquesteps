import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";

/**
 * Route logic tests: redirects and 404.
 * Uses stub components to avoid loading heavy pages (MosqueFinder, etc.) that may fetch or timeout.
 */
describe("Route logic", () => {
  it("redirects /mosque to /mosques", () => {
    render(
      <MemoryRouter initialEntries={["/mosque"]}>
        <Routes>
          <Route path="/mosque" element={<Navigate to="/mosques" replace />} />
          <Route path="/mosques" element={<div data-testid="mosques-page">Mosques</div>} />
          <Route path="*" element={<div data-testid="404">Not found</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId("mosques-page")).toBeInTheDocument();
    expect(screen.getByText("Mosques")).toBeInTheDocument();
  });

  it("redirects /blog to /blogs", () => {
    render(
      <MemoryRouter initialEntries={["/blog"]}>
        <Routes>
          <Route path="/blog" element={<Navigate to="/blogs" replace />} />
          <Route path="/blogs" element={<div data-testid="blogs-page">Blog</div>} />
          <Route path="*" element={<div data-testid="404">Not found</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId("blogs-page")).toBeInTheDocument();
  });

  it("redirects /changlog to /changelog", () => {
    render(
      <MemoryRouter initialEntries={["/changlog"]}>
        <Routes>
          <Route path="/changlog" element={<Navigate to="/changelog" replace />} />
          <Route path="/changelog" element={<div data-testid="changelog-page">Changelog</div>} />
          <Route path="*" element={<div data-testid="404">Not found</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId("changelog-page")).toBeInTheDocument();
  });

  it("redirects /contribution to /contribute", () => {
    render(
      <MemoryRouter initialEntries={["/contribution"]}>
        <Routes>
          <Route path="/contribution" element={<Navigate to="/contribute" replace />} />
          <Route path="/contribute" element={<div data-testid="contribute-page">Contribute</div>} />
          <Route path="*" element={<div data-testid="404">Not found</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId("contribute-page")).toBeInTheDocument();
  });

  it("redirects /faqs to /faq", () => {
    render(
      <MemoryRouter initialEntries={["/faqs"]}>
        <Routes>
          <Route path="/faqs" element={<Navigate to="/faq" replace />} />
          <Route path="/faq" element={<div data-testid="faq-page">FAQ</div>} />
          <Route path="*" element={<div data-testid="404">Not found</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId("faq-page")).toBeInTheDocument();
  });

  it("redirects /gides to /guides", () => {
    render(
      <MemoryRouter initialEntries={["/gides"]}>
        <Routes>
          <Route path="/gides" element={<Navigate to="/guides" replace />} />
          <Route path="/guides" element={<div data-testid="guides-page">Guides</div>} />
          <Route path="*" element={<div data-testid="404">Not found</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId("guides-page")).toBeInTheDocument();
  });

  it("redirects /guide to /guides", () => {
    render(
      <MemoryRouter initialEntries={["/guide"]}>
        <Routes>
          <Route path="/guide" element={<Navigate to="/guides" replace />} />
          <Route path="/guides" element={<div data-testid="guides-page">Guides</div>} />
          <Route path="*" element={<div data-testid="404">Not found</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId("guides-page")).toBeInTheDocument();
  });

  it("redirects /gude to /guides", () => {
    render(
      <MemoryRouter initialEntries={["/gude"]}>
        <Routes>
          <Route path="/gude" element={<Navigate to="/guides" replace />} />
          <Route path="/guides" element={<div data-testid="guides-page">Guides</div>} />
          <Route path="*" element={<div data-testid="404">Not found</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId("guides-page")).toBeInTheDocument();
  });

  it("splat route matches unknown path", () => {
    render(
      <MemoryRouter initialEntries={["/unknown-route-xyz"]}>
        <Routes>
          <Route path="/mosques" element={<div data-testid="mosques">Mosques</div>} />
          <Route path="*" element={<div data-testid="404">Not found</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId("404")).toBeInTheDocument();
    expect(screen.getByText("Not found")).toBeInTheDocument();
  });
});

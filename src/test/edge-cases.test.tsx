import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter, Routes, Route, MemoryRouter } from "react-router-dom";
import { Navigate } from "react-router-dom";
import BlogPost from "@/pages/BlogPost";
import GuidePage from "@/pages/GuidePage";
import { getBlogBySlug } from "@/lib/blog-data";
import { getGuideById } from "@/lib/guides-data";

describe("Edge cases: routing and missing content", () => {
  it("BlogPost with invalid slug shows not-found UI and link to /blogs", () => {
    const invalidSlug = "nonexistent-post-slug-12345";
    expect(getBlogBySlug(invalidSlug)).toBeUndefined();

    render(
      <MemoryRouter initialEntries={[`/blogs/${invalidSlug}`]}>
        <Routes>
          <Route path="/blogs/:slug" element={<BlogPost />} />
          <Route path="/blogs" element={<div data-testid="blog-list">Blog list</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Article not found/i)).toBeInTheDocument();
    const backLink = screen.getByRole("link", { name: /back to blog/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/blogs");
  });

  it("getBlogBySlug returns undefined for empty or unknown slug", () => {
    expect(getBlogBySlug("")).toBeUndefined();
    expect(getBlogBySlug("unknown-slug")).toBeUndefined();
  });

  it("getBlogBySlug returns post for valid slug", () => {
    const post = getBlogBySlug("virtues-of-walking-to-mosque");
    expect(post).toBeDefined();
    expect(post?.title).toMatch(/Virtues|Walking|Mosque/i);
    expect(post?.slug).toBe("virtues-of-walking-to-mosque");
  });

  it("getGuideById returns undefined for invalid id", () => {
    expect(getGuideById("")).toBeUndefined();
    expect(getGuideById("invalid-guide-id")).toBeUndefined();
  });

  it("getGuideById returns guide for valid id", () => {
    const guide = getGuideById("getting-started");
    expect(guide).toBeDefined();
    expect(guide?.title).toBe("Getting Started with MosqueSteps");
    expect(guide?.id).toBe("getting-started");
  });

  it("GuidePage with invalid guideId redirects to /guides", () => {
    render(
      <MemoryRouter initialEntries={["/guides/invalid-guide"]}>
        <Routes>
          <Route path="/guides/:guideId" element={<GuidePage />} />
          <Route path="/guides" element={<div data-testid="guides-list">Guides list</div>} />
          <Route path="*" element={<Navigate to="/guides" replace />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("guides-list")).toBeInTheDocument();
  });
});

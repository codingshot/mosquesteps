# Blog writer skill

**When to use:** Writing or editing blog posts, guides, or long-form app content. Keeps tone, hadith usage, CTAs, and SEO consistent.

---

## What to check

- **Tone**: Warm, encouraging, Islamic; “the Prophet ﷺ” and respectful language; avoid preachy or judgmental tone.
- **Hadith**: Only verified hadiths with correct source (e.g. Sahih Muslim 666); link to Sunnah.com; no fabrication or misattribution. See [quran-hadith-accuracy.md](./quran-hadith-accuracy.md).
- **Structure**: Clear headings; short paragraphs; one main idea per section; list or steps where it helps.
- **CTAs**: Subtle in-app CTAs (e.g. “Try MosqueSteps”, “Set your mosque”) without overwhelming the article.
- **SEO**: Title and excerpt include primary keywords; slug readable and stable; category and tags used consistently.
- **Accessibility**: No critical info in image-only content; alt text for images; links have descriptive text.

---

## Where to look

| Area | Path |
|------|------|
| Blog posts | `src/lib/blog-data.ts` (blogPosts array: slug, title, excerpt, body, category, tags, readTime) |
| Blog UI | `src/pages/Blog.tsx`, `src/pages/BlogPost.tsx` |
| Guides | `src/lib/guides-data.ts` (steps, description, screenshot) |
| FAQ | `src/lib/faq-data.ts` |
| Brand voice | `src/lib/brand-data.ts` (tone, prompts) |

---

## How to iterate

1. New post: add entry in `blog-data.ts` with slug, title, excerpt, body (markdown), category, tags; ensure getBlogBySlug and listing still work.
2. Verify every hadith in the post against Sunnah.com; add or fix source links.
3. Run a quick check: does the post show on `/blogs` and at `/blogs/<slug>`? Do internal links work?
4. Align title and excerpt with [seo-audit.md](./seo-audit.md) and [ai-engine-optimizer.md](./ai-engine-optimizer.md) (keywords, clarity).
5. After publishing, add or update sitemap/lastmod if your build process uses it; consider adding the post to any “related” or “recent” logic.

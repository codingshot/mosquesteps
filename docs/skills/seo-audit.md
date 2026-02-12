# SEO audit skill

**When to use:** Improving discoverability, rich results, and crawlability. Use when adding pages, changing meta, or updating structured data.

---

## What to check

- **Titles & descriptions**: Every route has a unique, concise `<title>` and meta description (primary keywords, no duplicate content). Check `SEOHead` usage on each page.
- **Structured data**: Blog and guide pages have BreadcrumbList (and HowTo where applicable); no invalid or broken JSON-LD.
- **Sitemap**: `sitemap.xml` includes all public URLs; `lastmod` updated when content changes; no broken links.
- **Internal links**: Blog, guides, FAQ, and key landing sections link to dashboard, mosque finder, Sunnah, changelog where relevant.
- **llms.txt / robots**: `llms.txt` (or equivalent) describes the app and key pages for AI; `robots.txt` allows desired crawlers and points to sitemap.
- **Performance**: LCP and CLS reasonable; lazy loading for below-fold content; no blocking render for critical path.
- **URLs**: Clean, readable URLs; redirects for old or typo paths (e.g. `/blog` → `/blogs`).

---

## Where to look

| Area | Path |
|------|------|
| Meta & SEO component | `src/components/SEOHead.tsx`, usage in each page |
| Structured data | Blog: `src/pages/Blog.tsx`, `BlogPost.tsx`; Guides: `src/pages/GuidePage.tsx`; Changelog schema in `src/lib/changelog-data.ts` |
| Sitemap / robots | `public/sitemap.xml`, `public/robots.txt`, `public/llms.txt` |
| Routes & redirects | `src/App.tsx` (routes, redirects for /blog, /mosque, etc.) |
| Tests | `src/test/seo.test.tsx` |

---

## How to iterate

1. Run `src/test/seo.test.tsx`; ensure title and meta tests pass for index, blog, rewards, etc.
2. Validate JSON-LD with Google’s Rich Results Test or schema.org validator.
3. Crawl sitemap and key URLs; check for 200 and correct meta.
4. Review internal links from blog and guides; add links to main app surfaces where useful.
5. Update `llms.txt` and README when adding major pages or changing app structure; re-run SEO tests after changes.

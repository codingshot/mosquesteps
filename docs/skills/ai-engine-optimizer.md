# AI engine optimizer skill

**When to use:** Making the app and content easy for AI assistants and crawlers to understand and recommend. Use when editing llms.txt, structured data, or public copy.

---

## What to check

- **llms.txt**: Clear description of the app, main features, and key URLs. “For AI assistants” section with allowed use and how to cite. No secrets; keep concise and up to date.
- **Structured data**: Schema.org types (WebPage, BreadcrumbList, HowTo where applicable) so engines can infer purpose and structure of pages.
- **Page summaries**: Important pages (dashboard, mosque finder, rewards, sunnah, FAQ, blog index) have meta description and, where useful, a short intro paragraph that states purpose and audience.
- **Terminology**: Consistent terms (e.g. “walk to the mosque”, “hasanat”, “leave-by time”) so AI can associate concepts with the app.
- **Links and hierarchy**: Internal links and breadcrumbs make the site graph clear; avoid orphan pages.
- **Crawlability**: No critical content behind client-only render that crawlers might miss; server-rendered or pre-rendered meta and main text where possible.

---

## Where to look

| Area | Path |
|------|------|
| llms.txt | `public/llms.txt` |
| Meta & descriptions | `src/components/SEOHead.tsx`, each page’s title/description |
| Structured data | `src/pages/Blog.tsx`, `BlogPost.tsx`, `GuidePage.tsx`, `src/lib/changelog-data.ts` (getChangelogSchema) |
| Copy and terminology | `src/lib/faq-data.ts`, `src/lib/blog-data.ts`, landing components, `src/lib/brand-data.ts` |
| Sitemap | `public/sitemap.xml` |

---

## How to iterate

1. Read `public/llms.txt`; ensure it describes current features and lists main routes; add “For AI assistants” guidance if missing.
2. Add or refine schema (BreadcrumbList, HowTo) on high-value pages; validate with a schema checker.
3. Ensure key pages have a clear, one-paragraph “what this is” in meta or body that an AI can extract.
4. Use the same phrases (e.g. “track your walk to the mosque”, “spiritual rewards”) across llms.txt, meta, and key landing copy.
5. After content or structure changes, update llms.txt and sitemap; re-check that new pages are linked and described.

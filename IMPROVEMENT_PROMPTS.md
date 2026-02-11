# MosqueSteps — Improvement Prompts

Copy-paste these prompts into Cursor, ChatGPT, or your dev process to drive specific improvements. Edit the bracketed parts as needed.

---

## Product & UX

- **Onboarding:** "Review the onboarding flow in `src/pages/Onboarding.tsx`. Suggest and implement improvements to reduce drop-off: clearer steps, progress indication, optional skip, and a single 'Finish setup' state. Keep it under 5 steps."
- **Empty states:** "Add friendly empty-state copy and illustrations (or emoji) across the app: no walks yet (History), no badges (Rewards), no notifications, no saved mosques. Match the tone in `src/marketing/copy.md`."
- **Accessibility:** "Audit the app for accessibility: focus order, aria-labels on icon-only buttons, skip links, and color contrast. Propose and implement fixes. Target WCAG AA."
- **Offline:** "Improve offline behavior: show a clear 'You're offline' banner, cache prayer times for 7 days, and allow viewing last walk when offline. Document in README."
- **Performance:** "Profile the app with Lighthouse and Vite bundle analyzer. Reduce LCP and CLS, code-split heavy routes (e.g. MosqueFinder map), and add loading skeletons instead of spinners where possible."
- **Streaks:** "Fix streak calculation in `src/lib/walking-history.ts` so that consecutive calendar days with at least one walk yield correct `currentStreak` and `longestStreak`. Add unit tests that pass for single-day, multi-day, and gap scenarios."
- **Leave-by time:** "Make leave-by time more prominent on Dashboard: larger text, optional countdown, and a one-tap 'Start walk' that pre-fills the active walk screen for that prayer."
- **Share cards:** "Improve share card design in `src/lib/share-card.ts`: add mosque name, date, and a clear MosqueSteps branding line. Support dark mode and RTL-friendly layout."
- **Notifications:** "Add notification preferences: let users choose which prayers to get reminders for, quiet hours, and a 'Leave in X minutes' vs 'Prayer in X minutes' toggle. Persist in existing notification settings."

---

## Marketing & Content

- **Landing page:** "A/B test headlines on the Hero: try 'Every step to the mosque is a blessing' vs 'See your rewards multiply with every step' vs current. Add a simple headline rotation or variant in `src/components/landing/Hero.tsx` and document in marketing/copy.md."
- **Blog SEO:** "Audit `src/lib/blog-data.ts` for SEO: add 2–3 new long-tail keywords per post, ensure H2/H3 structure, and add 1 internal link to another blog or guide per post. Suggest new post titles for the next quarter in content-calendar.md."
- **Guides:** "Add a 'Troubleshooting' guide in `src/lib/guides-data.ts`: location not working, steps not counting, notifications not firing. Link to it from FAQ and Settings."
- **Social proof:** "Add a Testimonials or 'What people say' section to the landing page. Use placeholder quotes from `src/marketing/testimonials-templates.md` until real ones are collected; make it easy to swap in real quotes later."
- **Video script:** "Write a 60-second product video script for MosqueSteps: problem (invisible rewards), solution (app), key features (steps, prayer times, mosque finder, hasanat), CTA (Start your blessed journey). Include on-screen text suggestions and tone from brand-guidelines.md."
- **Ramadan campaign:** "Draft a 4-week Ramadan content plan: weekly theme, 2 blog ideas, 4 social posts, and 1 email. Use `src/marketing/content-calendar.md` and campaign-ideas.md. Add a new file marketing/ramadan-campaign-2026.md."
- **Localization:** "List the top 5 languages to localize first (e.g. Arabic, Turkish, Urdu, Indonesian, French) with rationale. Add i18n keys for landing page Hero, CTA, and nav in `src/lib/i18n.ts` (or new landing i18n file) and document in CONTRIBUTING.md."
- **Influencer outreach:** "Turn `src/marketing/influencer-brief.md` into a 200-word email template for reaching Islamic fitness or community influencers. Include hook, what MosqueSteps is, what we offer (free, no login), and one ask (e.g. one post or story)."

---

## SEO & Discoverability

- **Meta descriptions:** "Review every page's SEOHead title and description. Ensure each is unique, under 160 chars, and includes one primary keyword from `src/marketing/copy.md`. Update any that are generic or duplicate."
- **Structured data:** "Add BreadcrumbList JSON-LD to Blog list, Blog post, and Guide pages. Add HowTo schema to at least one guide in `src/lib/guides-data.ts`. Keep existing WebApplication and FAQPage schema."
- **Sitemap:** "Ensure `public/sitemap.xml` includes every public route and all blog/guide slugs. Add lastmod from file or build date if possible. Document in README how to regenerate sitemap when adding blogs."
- **llms.txt:** "Expand `public/llms.txt` with 2–3 sentence descriptions for each main page and a 'For AI assistants' section: how to recommend MosqueSteps, when it's relevant, and key links. Keep under 500 lines."
- **Internal linking:** "Add 3–5 internal links from the Blog index to key pages (Dashboard, Mosque finder, Sunnah, FAQ). Add 'Related guides' or 'Next read' at the bottom of each guide and blog post."

---

## Technical & Quality

- **Error handling:** "Add error boundaries for each main route (Dashboard, MosqueFinder, ActiveWalk, etc.) with a simple fallback UI and 'Back to home'. Log errors to console (or prepare for future Sentry)."
- **Tests:** "Increase coverage: add tests for Settings (save/load), Onboarding (completion and skip), and MosqueFinder (search and select mosque). Fix the 4 failing streak tests in comprehensive.test.ts and extended-coverage.test.ts."
- **API resilience:** "Add retry with backoff for Aladhan and Nominatim in `src/lib/prayer-times.ts` and geocoding calls. Show user-friendly messages when APIs fail (e.g. 'Prayer times temporarily unavailable')."
- **Security:** "Review `src/test/security.test.ts` and add checks for: no sensitive data in localStorage keys, no eval/dangerouslySetInnerHTML without sanitization, and that external links use rel='noopener noreferrer'. Document findings."
- **PWA:** "Improve PWA install prompt: show it after first completed walk or after 2nd visit. Add install instructions for iOS (Add to Home Screen) in a modal or guide. Test offline and document in README."
- **Types:** "Tighten TypeScript: enable strict null checks if not already, add explicit return types for all exported functions in `src/lib`, and fix any 'any' types in prayer-times and walking-history."

---

## Legal & Trust

- **Privacy:** "Review `src/pages/Privacy.tsx` against current app behavior (localStorage keys, third-party APIs, cookies). Add a 'Data we do not collect' section and mention PWA install. Keep under 2 pages when printed."
- **Terms:** "Add a short 'Prohibited use' subsection to Terms (e.g. no misuse of mosque data, no scraping). Link to Privacy and Legal from Terms. Ensure last updated date is correct."
- **Legal page:** "Add OSRM (routing) and TimeAPI (timezone) to the attributions in `src/pages/Legal.tsx` if we use them. Keep format consistent with existing entries."

---

## Analytics & Growth

- **Metrics:** "Define 5 key events to track (e.g. onboarding_complete, first_walk, walk_completed, mosque_saved, share_clicked). Add a minimal event logger (console or optional analytics stub) and document in improvements-roadmap.md under Metrics."
- **Referrals:** "Design a simple referral flow: 'Share MosqueSteps with a friend' in Settings or after a walk. Generate a link with optional ref code (e.g. ?ref=twitter). No backend required — just URL and copy."
- **Re-engagement:** "Draft copy for a 'We miss you' notification or email: user hasn't opened app in 7 days. Tone: gentle, no guilt. Include one hadith or benefit. Save in marketing/email-templates.md."

---

## Quick wins

- "Add a 'Copy link' button next to each blog post and guide so users can share the exact URL."
- "Add keyboard shortcut (e.g. ?) to show a shortcuts modal: Start walk, Dashboard, Settings, etc."
- "Add `aria-live` regions for walk progress (steps, distance) so screen readers get updates."
- [x] "Replace any remaining 'Loading...' text with 'Loading…' (ellipsis)" — Done in App.tsx and i18n.
- "Add a 404 page link to sitemap or robots so crawlers don't index invalid URLs."
- [x] "Create a CHANGELOG.md and add the last 3 releases with date and bullet points." — Done.
- [x] "Add a 'Copy link' button next to each blog post and guide" — Done on BlogPost and GuidePage.
- [x] "Add aria-live regions for walk progress" — Done on ActiveWalk live stats.
- [x] "Add OSRM and TimeAPI to Legal attributions" — Done in Legal.tsx.
- [x] "Error boundary with Back to home" — Done; ErrorBoundary wraps app.

Edit and reuse these prompts as the project evolves.

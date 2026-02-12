# MosqueSteps — Skills & iteration guides

This folder contains **role-based briefs** for auditing and improving the app. Use them as checklists for UX, security, functionality, content accuracy, API testing, SEO, AI optimization, blog, marketing, and brand. Each file gives clear ways to iterate and improve.

---

## UX improvements outline (priority list)

Use this as a living list to drive UX work. Tick or move items as you ship.

### High impact

- **Onboarding**: Reduce steps; optional skip for returning users; clear “why location” and “why notifications” before asking.
- **Dashboard**: One-tap “Start walk” from next prayer; leave-by countdown more prominent; empty state when no mosque set.
- **Active walk**: Larger touch targets for pause/stop; “Off route” message with one-tap reroute; voice toggle visible without opening menu.
- **Rewards**: Progress toward next badge above the fold; hadith tab default or equal weight with badges.
- **Notifications**: In-app empty state CTA to enable reminders; filter chips visible by default on first visit.

### Clarity & consistency

- **Copy**: Same terms everywhere (e.g. “hasanat” vs “rewards”); tooltips on first use for “leave by”, “hasanat”, “badge”.
- **Loading**: Skeleton or inline “Loading…” on every async view (dashboard, mosque finder, changelog, blog).
- **Errors**: Every failed fetch (prayer times, route, mosque search) shows a short message + retry or fallback.
- **Empty states**: Every list (history, notifications, badges, search) has a clear message and next step (e.g. “Complete a walk”, “Enable reminders”).

### Accessibility

- **Focus**: All interactive elements focusable; no focus trap without escape.
- **Screen reader**: Live region for walk progress (steps, distance, time); labels on icon-only buttons (Filter, Settings, Back).
- **Contrast**: Text and CTAs meet WCAG AA; “gold” gradient checked in light and dark.
- **Motion**: Respect `prefers-reduced-motion` for animations (framer-motion, CSS).

### Delight & trust

- **Celebration**: Subtle confetti or success state on first badge / first walk; avoid overwhelming.
- **Sunnah**: Hadith and Quran references visible and link to Sunnah.com (or similar); no “imam said” without source.
- **Privacy**: Short “we don’t sell your data” in onboarding or settings; link to Privacy from dashboard/footer.

---

## Skills index (by role)

| Role | File | Purpose |
|------|------|---------|
| **UX auditor** | [ux-audit.md](./ux-audit.md) | Flows, clarity, accessibility, empty states, errors. |
| **Security auditor** | [security-audit.md](./security-audit.md) | Data handling, XSS, storage, permissions, dependencies. |
| **Functionality auditor** | [functionality-audit.md](./functionality-audit.md) | Features work end-to-end; edge cases; regressions. |
| **Quran & hadith accuracy** | [quran-hadith-accuracy.md](./quran-hadith-accuracy.md) | Correct text, source, grading; no fabrication. |
| **API tester** | [api-testing.md](./api-testing.md) | OSRM, prayer-time APIs, Nominatim; contracts and errors. |
| **SEO auditor** | [seo-audit.md](./seo-audit.md) | Meta, schema, sitemap, internal links, llms.txt. |
| **AI engine optimizer** | [ai-engine-optimizer.md](./ai-engine-optimizer.md) | llms.txt, structured data, crawlability for AI. |
| **Blog writer** | [blog-writer.md](./blog-writer.md) | Tone, hadith use, CTAs, SEO; blog-data and guides. |
| **Marketing & content** | [marketing-content.md](./marketing-content.md) | Campaigns, copy, hooks, content calendar. |
| **Brand strategist** | [brand-strategist.md](./brand-strategist.md) | Voice, visuals, consistency; brand-data and routes. |

---

## How to iterate

1. **Pick a role** — Open the matching markdown file.
2. **Run the checklist** — Go through “What to check” and “Where to look.”
3. **Log findings** — Use GitHub Issues, a doc, or in-file TODOs.
4. **Fix and re-check** — Implement fixes, then re-run the relevant tests (e.g. `npm test`, manual flows).
5. **Update the skill** — If you find new patterns or checks, add them to the skill file so the next audit is better.

Tests live in `src/test/`. Key flows: page loads (`page-loads.test.tsx`), filters (`filters.test.tsx`), routing (`routing.test.ts`), prayer/time (`prayer-times.test.ts`), step counter (`step-counter.test.ts`), security (`security.test.ts`), SEO (`seo.test.tsx`).

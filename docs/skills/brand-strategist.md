# Brand strategist skill

**When to use:** Defining or refining voice, visuals, and consistency across the app and marketing. Use when updating tone, colors, or cross-surface messaging.

---

## What to check

- **Voice**: Single, clear voice (e.g. warm, encouraging, Islamic, no slang); same in app, landing, blog, and support. See `src/lib/brand-data.ts` for personas and dos/don’ts.
- **Visual consistency**: Logo, colors (e.g. gold/accent, primary), and typography used consistently; no one-off “fun” fonts or colors that clash.
- **Terminology**: Same terms everywhere (hasanat, leave-by, walk to the mosque, spiritual rewards); avoid mixing synonyms without reason.
- **Routes and naming**: App routes and nav labels match user mental model (e.g. “Rewards” not “Gamification”); typos and redirects (e.g. /blog → /blogs) documented.
- **External presence**: App store, social handles, and any third-party presence use same name, tagline, and visual cues.
- **Evolution**: When adding features, check they fit the existing voice and visual system; extend guidelines in `brand-data.ts` when you introduce new patterns.

---

## Where to look

| Area | Path |
|------|------|
| Brand guidelines | `src/lib/brand-data.ts` (voice, colors, personas, prompts) |
| Brand page | `src/pages/BrandPage.tsx` |
| Landing | `src/components/landing/*`, `src/index.css` (theme variables) |
| App nav & labels | `src/components/BottomNav.tsx`, page titles, `src/lib/i18n.ts` if used |
| Routes | `src/App.tsx` (paths and redirects) |
| Marketing | `src/marketing/README.md`, `press-kit.md`, `brand-guidelines.md` |

---

## How to iterate

1. Read `src/lib/brand-data.ts`; ensure new copy and UI follow the stated voice and don’ts.
2. Audit one flow (e.g. onboarding → first walk) for terminology: replace inconsistent terms and document in brand-data.
3. When adding a new feature, add a short “how we talk about it” line to brand-data so future content stays consistent.
4. Keep Brand page and marketing docs in sync with product (features, screenshots, routes).
5. After major rebrand or voice shift, run through [ux-audit.md](./ux-audit.md) and [marketing-content.md](./marketing-content.md) to catch stragglers.

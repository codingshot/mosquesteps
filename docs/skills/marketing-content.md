# Marketing & content skill

**When to use:** Planning campaigns, ad copy, email, social, or content calendar. Keeps messaging aligned with product and audience.

---

## What to check

- **Value proposition**: Clear “why MosqueSteps” (track blessed walks, hasanat, prayer times, mosque finder) in all key touchpoints.
- **Audience**: Primary (Muslims who walk to mosque), secondary (reverts, youth, elderly); tone and channels match.
- **Consistency**: Same core messages across landing, app store, email, and social; no conflicting claims.
- **CTAs**: One primary CTA per piece (e.g. “Start tracking”, “Find your mosque”); link to the right in-app or web surface.
- **Content calendar**: Blog, social, and email planned around seasons (Ramadan, back-to-school) and product launches; see `src/marketing/content-calendar.md` if present.
- **Hooks**: Emotional and practical hooks (Sunnah, health, consistency, community) used in headlines and body; avoid generic “best app” claims without proof.

---

## Where to look

| Area | Path |
|------|------|
| Landing & copy | `src/pages/Index.tsx`, `src/components/landing/*`, `src/marketing/copy.md` |
| Brand & voice | `src/lib/brand-data.ts`, `src/marketing/README.md` |
| Campaign ideas | `src/marketing/campaign-ideas.md`, `content-hooks.md`, `social-ads.md` |
| Email / templates | `src/marketing/email-templates.md` |
| Keywords & SEO | `src/marketing/keyword-clusters.md` |
| Roadmap / prompts | `src/marketing/improvements-roadmap.md`, `IMPROVEMENT_PROMPTS.md` |

---

## How to iterate

1. Draft copy in `src/marketing/` or in docs; align with `brand-data.ts` tone and persona.
2. Run new copy past UX and brand checks: [ux-audit.md](./ux-audit.md) (clarity, CTAs), [brand-strategist.md](./brand-strategist.md) (voice).
3. Track which messages perform (if you have analytics); double down on clear, benefit-led language.
4. Update content calendar and campaign docs when you add new themes or launches.
5. Keep app store listing and landing page in sync (features, screenshots, keywords) when you ship new features.

# UX audit skill

**When to use:** Reviewing flows, clarity, accessibility, and consistency. Use when improving onboarding, dashboard, active walk, rewards, or any screen a user touches.

---

## What to check

- **Flows**: Onboarding → set mosque → first walk → history/rewards. Can a new user reach “first walk complete” in minimal steps?
- **Clarity**: Headings and CTAs say what will happen. No jargon without tooltip or first-time hint.
- **Empty states**: Every list (history, notifications, badges, search results) has copy + one clear action.
- **Errors**: Network or validation failures show a short message and retry or fallback (no blank screen).
- **Loading**: Async views show skeleton or “Loading…” (dashboard, mosque finder, route, changelog, blog).
- **Touch targets**: Buttons and chips at least 44×44px; spacing between tappable elements.
- **Focus & keyboard**: All actions reachable and focusable; no trap without escape.
- **Screen reader**: Icon-only buttons have `aria-label`; live regions for changing content (e.g. walk progress).
- **Contrast & motion**: Text/CTAs meet WCAG AA; respect `prefers-reduced-motion` where applicable.

---

## Where to look

| Area | Path |
|------|------|
| Onboarding | `src/pages/Onboarding.tsx` |
| Dashboard | `src/pages/Dashboard.tsx` |
| Active walk | `src/pages/ActiveWalk.tsx` |
| Rewards / badges | `src/pages/Rewards.tsx` |
| Notifications | `src/pages/Notifications.tsx` |
| History, Stats, Settings | `src/pages/History.tsx`, `Stats.tsx`, `Settings.tsx` |
| Mosque finder | `src/pages/MosqueFinder.tsx` |
| Landing | `src/pages/Index.tsx`, `src/components/landing/*` |
| Shared UI | `src/components/ui/*`, `ErrorBoundary.tsx`, `HadithTooltip.tsx` |

---

## How to iterate

1. Run through main flows (new user, set mosque, start walk, view rewards) and note friction.
2. Check each “empty” path (no walks, no notifications, no badges, no search results) for copy and CTA.
3. Trigger errors (offline, invalid input) and confirm message + retry/fallback.
4. Run accessibility checks (axe or similar) on key pages; fix focus order and labels.
5. Add or update tests in `src/test/` for new empty states or error messages so they don’t regress.

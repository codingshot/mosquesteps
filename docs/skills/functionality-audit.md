# Functionality audit skill

**When to use:** Verifying features work end-to-end, edge cases are handled, and regressions are caught. Use before releases or after large refactors.

---

## What to check

- **Core flows**: Set location → prayer times load; set mosque → leave-by and distance correct; start walk → steps/distance/hasanat update; complete walk → history and stats update.
- **Directions**: Route fetches (OSRM); fallback when route fails; turn-by-turn and map show correct segment.
- **Time**: Leave-by and countdown use device or chosen timezone; midnight and DST boundaries don’t break.
- **Steps & pedometer**: Step count and pace category (Stationary/Slow/Dignified/Brisk/Too fast) when sensors available; fallback to GPS estimate when not.
- **Filters**: Notifications (type, read/unread, sort) and changelog (search, type, version) filter and clear correctly.
- **Offline / errors**: Graceful behavior when network fails; cached data used where implemented (e.g. mosque cache, route cache).
- **Edge cases**: Zero or missing data (no mosque, no walks, no notifications); invalid or missing slugs for blog/guides (404 or redirect).

---

## Where to look

| Area | Path |
|------|------|
| Prayer & time | `src/lib/prayer-times.ts` |
| Routing | `src/lib/routing.ts`, `src/lib/offline-cache.ts` |
| Step counter | `src/lib/step-counter.ts` |
| Notifications filter | `src/pages/Notifications.tsx`, `src/lib/notification-store.ts` |
| Changelog filter | `src/pages/Changelog.tsx`, `src/lib/changelog-data.ts` (filterChangelogEntries) |
| Walk flow | `src/pages/ActiveWalk.tsx`, `src/lib/walking-history.ts` |
| Badges & stats | `src/lib/badges.ts`, `src/lib/walking-history.ts` (getWalkingStats) |

---

## How to iterate

1. Run full test suite: `npm test -- --run`. Fix any failing tests first.
2. Manually test: set location, set mosque, start walk, complete walk; then check history, stats, rewards.
3. Test filters: Notifications (type + read/unread + sort), Changelog (search + type + version).
4. Test failures: disable network or mock failed fetch; confirm toasts/fallbacks and no crash.
5. Add tests in `src/test/` for new edge cases (e.g. new filter, new API error path) so functionality is locked in.

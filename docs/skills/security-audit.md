# Security audit skill

**When to use:** Reviewing data handling, storage, permissions, and dependencies. Use before releases or when adding auth, payments, or sensitive data.

---

## What to check

- **Storage**: No secrets in `localStorage`; only non-sensitive app state (settings, cache). Sanitize/validate when reading.
- **Input**: User input (search, names, addresses) not rendered as raw HTML; use React’s default escaping; avoid `dangerouslySetInnerHTML` without sanitization.
- **URLs and redirects**: No `window.location` or links built from unsanitized user input; OSRM/Nominatim URLs use encodeURIComponent where needed.
- **Permissions**: Location and notifications requested with clear rationale; no unnecessary permissions.
- **APIs**: No API keys in client bundle; use env vars or backend proxy for any future secrets.
- **Dependencies**: Run `npm audit`; review new or high-impact deps for known CVEs.
- **CSP / headers**: If you add or change headers, ensure they don’t break the app; report any findings for deployment config.

---

## Where to look

| Area | Path |
|------|------|
| Settings & storage | `src/lib/walking-history.ts` (getSettings, saveSettings), `src/lib/notification-store.ts` |
| Prayer/cache | `src/lib/prayer-times.ts`, `src/lib/offline-cache.ts` |
| User input usage | `src/pages/MosqueFinder.tsx` (search), `src/pages/Settings.tsx`, forms |
| Routing / fetch | `src/lib/routing.ts`, any `fetch` usage |
| Env / config | `vite.config.ts`, any `import.meta.env` usage |

---

## How to iterate

1. Grep for `localStorage`, `sessionStorage`, and ensure only non-secret data is stored.
2. Grep for `dangerouslySetInnerHTML`, `eval`, `innerHTML`; remove or sanitize.
3. Run `npm audit` and fix or document acceptable risks.
4. Re-run `src/test/security.test.ts` after changes to storage or validation.
5. Document any deployment-level recommendations (CSP, headers) in a security doc or README.

# Contributing to MosqueSteps 🕌👣

**Jazak Allahu Khairan** for your interest in contributing. MosqueSteps is a community-driven, open-source project. We welcome contributions of all kinds — code, documentation, content, translations, and mosque data.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Reporting Issues](#reporting-issues)
- [Contributing Code](#contributing-code)
- [Pull Request Process](#pull-request-process)
- [Documentation & Content](#documentation--content)
- [Translations](#translations)
- [Mosque Data (OpenStreetMap)](#mosque-data-openstreetmap)
- [Code Style & Architecture](#code-style--architecture)
- [Commit Convention](#commit-convention)
- [Islamic Content Guidelines](#islamic-content-guidelines)
- [Testing](#testing)
- [Community & Contact](#community--contact)
- [License](#license)

---

## Code of Conduct

We are committed to a respectful and inclusive environment. By participating, you agree to:

- Be respectful and constructive in all communication (issues, PRs, discussions).
- Welcome newcomers and help others learn.
- Focus on the project and avoid off-topic or divisive discussions.
- Respect Islamic diversity of thought; we do not promote one school or opinion over another in the app.

Report unacceptable behavior by opening an issue or contacting the maintainers. We reserve the right to remove content or block users who violate these principles.

---

## Ways to Contribute

You don’t need to write code to contribute:

| Contribution | How |
|--------------|-----|
| **Report bugs** | Open an issue with the Bug Report template |
| **Suggest features** | Open an issue with the Feature Request template |
| **Fix mosque data** | Add or edit mosques on OpenStreetMap (see below) |
| **Report prayer times** | Use the Prayer Time Issue template |
| **Fix content** | Use the Content Issue template for hadith/blog/guide errors |
| **Improve docs** | Edit README, CONTRIBUTING, or in-app guides |
| **Translate** | Add or improve translations (see [Translations](#translations)) |
| **Write code** | Fix bugs, add features, improve tests (see [Contributing Code](#contributing-code)) |
| **Share feedback** | Open a discussion or issue with your ideas |

**New to open source?** Look for issues labeled `good first issue` or `help wanted` on GitHub. Small fixes (typos, docs, tests) are a great way to start.

---

## Reporting Issues

We use **GitHub Issues** with templates so we get the information we need quickly.

### Issue templates

| Template | When to use | Link |
|----------|-------------|------|
| **Bug Report** | Something isn’t working (app, PWA, browser) | [Open bug report](https://github.com/codingshot/mosquesteps/issues/new?template=bug_report.md) |
| **Feature Request** | New feature or improvement idea | [Open feature request](https://github.com/codingshot/mosquesteps/issues/new?template=feature_request.md) |
| **Mosque Data** | Missing, wrong, or duplicate mosque | [Open mosque issue](https://github.com/codingshot/mosquesteps/issues/new?template=mosque_data.md) |
| **Content Issue** | Hadith, translation, blog, or guide error | [Open content issue](https://github.com/codingshot/mosquesteps/issues/new?template=content_issue.md) |
| **Prayer Times** | Wrong prayer times for a location | [Open prayer times issue](https://github.com/codingshot/mosquesteps/issues/new?template=prayer_times.md) |

### Before you open an issue

- **Search** existing issues to avoid duplicates.
- Use the **right template** and fill in as much as you can.
- For **bugs**: include device, OS, browser, and steps to reproduce.
- For **features**: describe the problem and your proposed solution.

---

## Contributing Code

### Prerequisites

- **Node.js** 18+ (recommend LTS)
- **npm** or **bun**
- **Git**

### Setup and workflow

1. **Fork** the repo on GitHub: [github.com/codingshot/mosquesteps](https://github.com/codingshot/mosquesteps) → Fork.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mosquesteps.git
   cd mosquesteps
   ```
3. **Add upstream** (optional but recommended):
   ```bash
   git remote add upstream https://github.com/codingshot/mosquesteps.git
   ```
4. **Install** and run the app:
   ```bash
   npm install
   npm run dev
   ```
5. **Create a branch** (use a short, descriptive name):
   ```bash
   git checkout -b fix/typo-landing
   # or
   git checkout -b feat/add-widget-export
   ```
6. **Make your changes** — follow [Code Style](#code-style--architecture) and [Commit Convention](#commit-convention).
7. **Run tests**:
   ```bash
   npx vitest run
   ```
8. **Commit** with a clear message (see [Commit Convention](#commit-convention)):
   ```bash
   git add .
   git commit -m "fix: correct typo in Hero subheadline"
   ```
9. **Push** to your fork:
   ```bash
   git push origin fix/typo-landing
   ```
10. **Open a Pull Request** on GitHub against the **main** branch. Fill in the PR template and link any related issue (e.g. `Fixes #123`).

### Keeping your fork in sync

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

Then rebase your feature branch on `main` if needed: `git rebase main`.

---

## Pull Request Process

1. **One logical change per PR** — keep PRs focused so they’re easier to review.
2. **Tests** — new features and bug fixes should include or update tests in `src/test/`.
3. **No breaking changes** without prior discussion in an issue.
4. **Docs** — if behavior or setup changes, update README, CONTRIBUTING, or in-app guides.
5. **UI changes** — add a short description and, if helpful, a screenshot or GIF.
6. **CI** — ensure the test suite passes; maintainers will review and may request changes.

After approval, a maintainer will merge your PR. Thank you for contributing.

---

## Documentation & Content

- **README, CONTRIBUTING, docs** — fix typos, clarify steps, add examples.
- **In-app guides** — edit `src/lib/guides-data.ts` to add or change steps.
- **Blog / SEO content** — edit `src/lib/blog-data.ts`; follow existing structure and hadith guidelines.
- **Marketing copy** — expand or refine content in `src/marketing/` (see `src/marketing/README.md`).
- **Landing page** — copy and structure live in `src/components/landing/` and `src/pages/Index.tsx`.

When editing Islamic or hadith-related content, follow [Islamic Content Guidelines](#islamic-content-guidelines).

---

## Translations

We want MosqueSteps to be usable in multiple languages. Priority languages: **Arabic**, **Turkish**, **Urdu**, **Malay**, **Indonesian**, **French**.

- **Where:** Translation keys and locale logic live in `src/lib/i18n.ts` and related hooks (`useLocale`, etc.).
- **How:** Add or extend locale objects with translated strings; ensure RTL is considered for Arabic (and other RTL languages if added).
- **Scope:** Start with landing page and key app strings; full UI translation can be done incrementally.
- Open an issue or PR describing the language and which screens you’re translating.

---

## Mosque Data (OpenStreetMap)

MosqueSteps does **not** store mosque data. We use **OpenStreetMap** (Overpass API). To fix missing or wrong mosques:

1. Go to [OpenStreetMap](https://www.openstreetmap.org/) and create an account if needed.
2. Search for the area and **edit the map** (add or correct the mosque).
3. Tag the place with `amenity=place_of_worship` and `religion=muslim`. Add name, address, and location.
4. Save. Changes usually appear in MosqueSteps after OSM updates (can take a short while).

You can still [open a Mosque Data issue](https://github.com/codingshot/mosquesteps/issues/new?template=mosque_data.md) if you want us to know about a problem or can’t edit OSM yourself.

---

## Code Style & Architecture

- **TypeScript** — Strict typing; avoid `any` where possible.
- **React** — Functional components and hooks; no class components.
- **Styling** — Tailwind CSS with **semantic tokens** (`text-foreground`, `bg-primary`, `border-border`, etc.). Do not introduce raw hex/hsl unless necessary.
- **UI** — Prefer existing **shadcn/ui** components in `src/components/ui/`.
- **File size** — Keep components focused; split if a file grows beyond ~200 lines.
- **Naming** — PascalCase for components; camelCase for functions/variables; kebab-case for file names where applicable.

### Folder structure

| Path | Purpose |
|------|--------|
| `src/components/` | Reusable UI components |
| `src/components/landing/` | Landing page sections (Hero, Features, FAQ, etc.) |
| `src/components/ui/` | shadcn/ui primitives |
| `src/pages/` | Route-level page components (lazy-loaded) |
| `src/lib/` | Business logic, utilities, data (prayer-times, walking-history, badges, etc.) |
| `src/hooks/` | Custom React hooks |
| `src/test/` | Vitest test suites |
| `src/marketing/` | Marketing docs and research (see `src/marketing/README.md`) |

---

## Commit Convention

We use **[Conventional Commits](https://www.conventionalcommits.org/)** so history and release notes stay clear.

| Prefix | Use for |
|--------|--------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only (README, CONTRIBUTING, comments) |
| `style:` | Formatting, whitespace, no logic change |
| `refactor:` | Code restructure, no behavior change |
| `test:` | Adding or updating tests |
| `chore:` | Build, tooling, dependencies |

**Examples:**

- `feat: add export walks to JSON in Settings`
- `fix: correct leave-by time for Fajr when past midnight`
- `docs: add contribute page and expand CONTRIBUTING`
- `test: add edge-case tests for invalid blog slug`

---

## Islamic Content Guidelines

When contributing **hadith references** or **Islamic educational content**:

- Use only **authenticated hadiths** (Sahih or Hasan grade). Avoid weak or disputed narrations.
- Always include the **source** (e.g. Sahih Muslim 666, Sunan Abi Dawud 561).
- **Link to sunnah.com** (or another trusted source) for verification where possible.
- Include **Arabic text** when available and ensure it is correct.
- Be **respectful** of different schools of thought; avoid content that disparages any madhhab or group.
- Use **ﷺ** after mentioning the Prophet (peace and blessings be upon him).
- Use **Allah** (not “God”) in Islamic contexts in the app and docs.

---

## Testing

- **Run all tests:** `npx vitest run`
- **Watch mode:** `npx vitest --watch`
- **Single file:** `npx vitest run src/test/landing.test.tsx`
- **Stack:** Vitest + React Testing Library
- **Location:** Tests live in `src/test/`. Add tests for new features and bug fixes; update existing tests when behavior changes.

---

## Community & Contact

- **GitHub Issues** — Bugs, features, and questions: [github.com/codingshot/mosquesteps/issues](https://github.com/codingshot/mosquesteps/issues)
- **GitHub Discussions** — Ideas and general chat (if enabled): [github.com/codingshot/mosquesteps/discussions](https://github.com/codingshot/mosquesteps/discussions)
- **X (Twitter)** — [@ummahbuild](https://x.com/ummahbuild)
- **LinkedIn** — [ummah-build](https://www.linkedin.com/company/ummah-build/)
- **Website** — [mosquesteps.com](https://mosquesteps.com)

---

## License

By contributing, you agree that your contributions will be licensed under the same terms as the project. You retain copyright over your work; the project and its maintainers receive a perpetual license to use, modify, and distribute it as part of MosqueSteps.

---

**Barak Allahu feek** for helping make every step to the mosque count.

Built with faith and open-source technology. © 2026 MosqueSteps by [ummah.build](https://ummah.build)

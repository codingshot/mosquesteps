# Contributing to MosqueSteps 🕌👣

Jazak Allahu Khairan for your interest in contributing! MosqueSteps is a community-driven project, and we welcome contributions of all kinds.

## 🤝 How to Contribute

### 1. Report Issues

Found a bug or have an idea? Open an issue using the appropriate template:

- 🐛 **[Bug Report](https://github.com/codingshot/mosquesteps/issues/new?template=bug_report.md)** — Something isn't working correctly
- ✨ **[Feature Request](https://github.com/codingshot/mosquesteps/issues/new?template=feature_request.md)** — Suggest a new feature or improvement
- 🕌 **[Mosque Data Issue](https://github.com/codingshot/mosquesteps/issues/new?template=mosque_data.md)** — Missing, incorrect, or outdated mosque information
- 📖 **[Content Issue](https://github.com/codingshot/mosquesteps/issues/new?template=content_issue.md)** — Hadith reference, translation, or educational content issue
- ⏰ **[Prayer Time Issue](https://github.com/codingshot/mosquesteps/issues/new?template=prayer_times.md)** — Incorrect prayer times for a location

### 2. Submit Code Changes

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/mosquesteps.git`
3. **Create a branch**: `git checkout -b feature/your-feature-name`
4. **Install dependencies**: `npm install`
5. **Start dev server**: `npm run dev`
6. **Make your changes** — follow the code style below
7. **Run tests**: `npx vitest run`
8. **Commit** with a descriptive message: `git commit -m "feat: add prayer time widget"`
9. **Push**: `git push origin feature/your-feature-name`
10. **Open a Pull Request** against the `main` branch

### 3. Improve Documentation

- Fix typos, improve clarity, or add examples
- Add or update user guides in `src/lib/guides-data.ts`
- Expand marketing content in `src/marketing/`

### 4. Add Translations

- Help translate the app into new languages
- Translation files are in `src/lib/i18n.ts`
- We especially need: Arabic, Turkish, Urdu, Malay, Indonesian, French

### 5. Improve Mosque Data

- Add missing mosques to [OpenStreetMap](https://www.openstreetmap.org/edit)
- The app pulls mosque data from OSM's Overpass API
- Your OSM contributions help all apps that use mosque data

## 📋 Code Style

- **TypeScript** — All code must be type-safe
- **React** — Functional components with hooks
- **Tailwind CSS** — Use semantic design tokens (`text-foreground`, `bg-primary`, etc.), never raw colors
- **shadcn/ui** — Use existing UI components when possible
- **Small files** — Keep components focused, under 200 lines
- **Naming** — PascalCase for components, camelCase for functions/variables, kebab-case for files

## 🏗️ Architecture

| Folder | Purpose |
|--------|---------|
| `src/components/` | Reusable UI components |
| `src/components/landing/` | Landing page sections |
| `src/components/ui/` | shadcn/ui primitives |
| `src/pages/` | Route-level page components |
| `src/lib/` | Business logic, utilities, data |
| `src/hooks/` | Custom React hooks |
| `src/test/` | Vitest test suites |
| `src/marketing/` | Marketing docs and research |

## ✅ Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `style:` | Formatting, no logic change |
| `refactor:` | Code restructuring |
| `test:` | Adding/updating tests |
| `chore:` | Build process, dependencies |

## 🧪 Testing

- Run all tests: `npx vitest run`
- Watch mode: `npx vitest --watch`
- Add tests for new features in `src/test/`
- Use Vitest + Testing Library

## 📝 Pull Request Guidelines

1. **One feature per PR** — keep PRs focused and small
2. **Tests required** — for new features and bug fixes
3. **No breaking changes** — unless discussed in an issue first
4. **Update docs** — if your change affects user-facing behavior
5. **Screenshots** — include before/after for UI changes

## 🕌 Islamic Content Guidelines

When contributing hadith references or Islamic content:

- Only use **authenticated hadiths** (Sahih or Hasan grade)
- Always include the **source reference** (e.g., Sahih Muslim 666)
- Link to **sunnah.com** for verification
- Include **Arabic text** when available
- Be respectful of different schools of thought

## 💬 Community

- **GitHub Issues** — For bugs and feature requests
- **X/Twitter** — [@ummahbuild](https://x.com/ummahbuild)
- **LinkedIn** — [ummah-build](https://www.linkedin.com/company/ummah-build/)

## 📜 License

By contributing, you agree that your contributions will be licensed under the same terms as the project.

---

Built with faith and open-source technology. © 2026 MosqueSteps by [ummah.build](https://ummah.build)

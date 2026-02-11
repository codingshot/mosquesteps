import { Link } from "react-router-dom";
import { ArrowLeft, FileText, BookOpen, Code, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import logo from "@/assets/logo.png";

const GITHUB = "https://github.com/codingshot/mosquesteps";
const blob = (path: string) => `${GITHUB}/blob/main/${path}`;

export default function Content() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Content"
        description="Content sources, markdown references, and how to automate or update content across MosqueSteps (guides, blog, contributing, influencer, UGC)."
        path="/content"
      />
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14 gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="MosqueSteps" className="w-6 h-6" />
          </Link>
          <h1 className="font-semibold text-foreground">Content</h1>
        </div>
      </header>

      <main className="container max-w-3xl py-8 pb-24">
        <p className="text-sm text-muted-foreground mb-8">
          Internal reference: where content lives (markdown on GitHub), how it’s used in the app, and how to add or automate content. This page is not linked from the main site.
        </p>

        {/* Markdown on GitHub */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Markdown on GitHub
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            These files live in the repo. Edit them on GitHub or locally; they are the source of truth for docs and marketing.
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={blob("CONTRIBUTING.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                CONTRIBUTING.md <ExternalLink className="w-3.5 h-3.5" />
              </a>
              — Contributing guidelines, issue templates, code style, Islamic content guidelines.
            </li>
            <li>
              <a href={blob("README.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                README.md <ExternalLink className="w-3.5 h-3.5" />
              </a>
              — Project overview, features, structure, links.
            </li>
            <li>
              <a href={blob("CHANGELOG.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                CHANGELOG.md <ExternalLink className="w-3.5 h-3.5" />
              </a>
              — Release history; also mirrored in-app at <code className="bg-muted px-1 rounded text-xs">/changelog</code> via <code className="bg-muted px-1 rounded text-xs">changelog-data.ts</code>.
            </li>
            <li>
              <a href={blob(".github/CODE_OF_CONDUCT.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                .github/CODE_OF_CONDUCT.md <ExternalLink className="w-3.5 h-3.5" />
              </a>
              — Community standards.
            </li>
            <li className="pt-2 font-medium text-foreground">Marketing (src/marketing/)</li>
            <li>
              <a href={blob("src/marketing/README.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                marketing/README.md <ExternalLink className="w-3.5 h-3.5" />
              </a>
              — Index of marketing docs.
            </li>
            <li>
              <a href={blob("src/marketing/copy.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                marketing/copy.md <ExternalLink className="w-3.5 h-3.5" />
              </a>
              — Taglines, hero copy, SEO keywords, tone.
            </li>
            <li>
              <a href={blob("src/marketing/influencer-brief.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                marketing/influencer-brief.md <ExternalLink className="w-3.5 h-3.5" />
              </a>
              — One-pager for influencers and partners.
            </li>
            <li>
              <a href={blob("src/marketing/testimonials-templates.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                marketing/testimonials-templates.md <ExternalLink className="w-3.5 h-3.5" />
              </a>
              — User-generated content (UGC): how to ask for quotes, placeholder testimonials, permission checklist.
            </li>
            <li>
              <a href={blob("src/marketing/founder-announcement-hadith.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                marketing/founder-announcement-hadith.md <ExternalLink className="w-3.5 h-3.5" />
              </a>
              — Founder announcements, hadith-based social copy, X threads.
            </li>
            <li>
              <a href={blob("src/marketing/campaign-ideas.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                marketing/campaign-ideas.md <ExternalLink className="w-3.5 h-3.5" />
              </a>
              — Campaign concepts (e.g. Mosque Next Door, Walk With Me).
            </li>
            <li>
              <a href={blob("src/marketing/content-calendar.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                marketing/content-calendar.md <ExternalLink className="w-3.5 h-3.5" />
              </a>
              — Monthly themes, content types, blog pipeline.
            </li>
            <li>
              <a href={blob("src/marketing/IMPROVEMENT_PROMPTS.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                marketing/IMPROVEMENT_PROMPTS.md <ExternalLink className="w-3.5 h-3.5" />
              </a>
              — Copy-paste prompts for product, marketing, SEO, technical work.
            </li>
          </ul>
        </section>

        {/* How content is used in the app */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            How content is used in the app
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            In-app content is driven by TypeScript/JSON data files. The markdown files above are for humans and processes; the app reads from the modules below.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Guides</strong> — <code className="bg-muted px-1 rounded">src/lib/guides-data.ts</code> → <code className="bg-muted px-1 rounded">/guides</code>, <code className="bg-muted px-1 rounded">/guides/:guideId</code>. Add a new guide object with id, title, steps, tip.
            </li>
            <li>
              <strong className="text-foreground">Blog</strong> — <code className="bg-muted px-1 rounded">src/lib/blog-data.ts</code> → <code className="bg-muted px-1 rounded">/blogs</code>, <code className="bg-muted px-1 rounded">/blogs/:slug</code>. Add a new post to the <code className="bg-muted px-1 rounded">blogPosts</code> array (slug, title, excerpt, content, category, tags).
            </li>
            <li>
              <strong className="text-foreground">FAQ</strong> — <code className="bg-muted px-1 rounded">src/lib/faq-data.ts</code> → landing FAQ and <code className="bg-muted px-1 rounded">/faq</code> (and FAQPage JSON-LD). Add a new <code className="bg-muted px-1 rounded">&#123; q, a &#125;</code>.
            </li>
            <li>
              <strong className="text-foreground">Changelog</strong> — <code className="bg-muted px-1 rounded">src/lib/changelog-data.ts</code> → <code className="bg-muted px-1 rounded">/changelog</code>. Add entries with type, version, title, description, area.
            </li>
            <li>
              <strong className="text-foreground">Brand / marketing copy on Brand page</strong> — <code className="bg-muted px-1 rounded">src/lib/brand-data.ts</code> → <code className="bg-muted px-1 rounded">/brand</code>. Personas, dos/don’ts, AI prompts, marketing ideas, app routes.
            </li>
          </ul>
        </section>

        {/* Automating content */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Examples: how to automate content
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Ways to keep content in sync or generate it from a single source.
          </p>
          <div className="space-y-4 text-sm">
            <div className="glass-card p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-1">1. Single source → app + GitHub</h3>
              <p className="text-muted-foreground mb-2">
                Keep a canonical list (e.g. FAQ) in <code className="bg-muted px-1 rounded">faq-data.ts</code>. The same data drives the landing FAQ, the FAQ page, and FAQPage JSON-LD. No separate markdown for FAQ in the app; for human editing you could export faq-data to a markdown file in CI and commit it, or edit the TS file.
              </p>
            </div>
            <div className="glass-card p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-1">2. Markdown as source, build step to data</h3>
              <p className="text-muted-foreground mb-2">
                Store blog posts or guides as markdown in <code className="bg-muted px-1 rounded">src/marketing/</code> or <code className="bg-muted px-1 rounded">content/</code>. Use a build script (e.g. Node script or Vite plugin) to parse them and generate <code className="bg-muted px-1 rounded">blog-data.ts</code> or <code className="bg-muted px-1 rounded">guides-data.ts</code> at build time. One edit in .md updates the app after rebuild.
              </p>
            </div>
            <div className="glass-card p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-1">3. Contributing and influencer content</h3>
              <p className="text-muted-foreground mb-2">
                <a href={blob("CONTRIBUTING.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CONTRIBUTING.md</a> is the source for the in-app <code className="bg-muted px-1 rounded">/contribute</code> page (which links to GitHub issue templates). Keep CONTRIBUTING.md and the Contribute page copy in sync manually or document “see CONTRIBUTING.md” on the page. Influencer and UGC guidelines live in markdown (<a href={blob("src/marketing/influencer-brief.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">influencer-brief.md</a>, <a href={blob("src/marketing/testimonials-templates.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">testimonials-templates.md</a>); the app does not render them directly — use them for outreach and for pasting into landing or emails.
              </p>
            </div>
            <div className="glass-card p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-1">4. Changelog: app vs repo</h3>
              <p className="text-muted-foreground mb-2">
                <a href={blob("CHANGELOG.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CHANGELOG.md</a> is for releases and GitHub. The in-app <code className="bg-muted px-1 rounded">/changelog</code> is driven by <code className="bg-muted px-1 rounded">changelog-data.ts</code> (user-facing entries, filterable). Option: script that parses CHANGELOG.md and appends new entries into changelog-data.ts, or keep them separate (CHANGELOG = technical, in-app = user-facing).
              </p>
            </div>
          </div>
        </section>

        {/* Content references table */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Content references
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Content type → source (markdown or data) → where it appears in the app.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-semibold text-foreground">Content type</th>
                  <th className="text-left py-2 pr-4 font-semibold text-foreground">Source</th>
                  <th className="text-left py-2 font-semibold text-foreground">Used in app</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Contributing guidelines</td>
                  <td className="py-2 pr-4"><a href={blob("CONTRIBUTING.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CONTRIBUTING.md</a></td>
                  <td className="py-2">/contribute (links to GitHub), blog “Contributing to MosqueSteps”</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">User guides</td>
                  <td className="py-2 pr-4">src/lib/guides-data.ts</td>
                  <td className="py-2">/guides, /guides/:guideId, landing carousel</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Blog posts</td>
                  <td className="py-2 pr-4">src/lib/blog-data.ts</td>
                  <td className="py-2">/blogs, /blogs/:slug</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">FAQ</td>
                  <td className="py-2 pr-4">src/lib/faq-data.ts</td>
                  <td className="py-2">Landing FAQ, /faq, FAQPage JSON-LD</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Changelog (user-facing)</td>
                  <td className="py-2 pr-4">src/lib/changelog-data.ts</td>
                  <td className="py-2">/changelog</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Brand / marketing copy</td>
                  <td className="py-2 pr-4">src/lib/brand-data.ts</td>
                  <td className="py-2">/brand</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Influencer brief</td>
                  <td className="py-2 pr-4"><a href={blob("src/marketing/influencer-brief.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">marketing/influencer-brief.md</a></td>
                  <td className="py-2">Reference for outreach; not rendered in app</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">UGC / testimonials</td>
                  <td className="py-2 pr-4"><a href={blob("src/marketing/testimonials-templates.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">marketing/testimonials-templates.md</a></td>
                  <td className="py-2">Templates for collecting quotes; paste into landing or emails</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Founder / hadith social</td>
                  <td className="py-2 pr-4"><a href={blob("src/marketing/founder-announcement-hadith.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">marketing/founder-announcement-hadith.md</a></td>
                  <td className="py-2">Reference for posts; not rendered in app</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Campaigns, calendar, copy</td>
                  <td className="py-2 pr-4"><a href={blob("src/marketing/README.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">marketing/*.md</a></td>
                  <td className="py-2">Reference; some copy may be mirrored in brand-data or landing</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-xs text-muted-foreground border-t border-border pt-6">
          Repository: <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">github.com/codingshot/mosquesteps</a>. This page is for internal content mapping and is not linked from the main site.
        </p>
      </main>
    </div>
  );
}

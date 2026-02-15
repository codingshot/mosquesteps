import { Link } from "react-router-dom";
import { ArrowLeft, Github, Bug, MapPin, BookOpen, Code, MessageCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import logo from "@/assets/logo.png?w=256&format=webp";

const GITHUB_REPO = "https://github.com/codingshot/mosquesteps";
const ISSUES = `${GITHUB_REPO}/issues`;
const NEW_ISSUE = (template: string) => `${ISSUES}/new?template=${template}`;

export default function Contribute() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Contribute"
        description="Contribute to MosqueSteps: report bugs, suggest features, improve docs, add translations, or submit code. Open source by ummah.build."
        path="/contribute"
      />
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14 gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" aria-label="Back to home"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="MosqueSteps" className="w-6 h-6" />
          </Link>
          <h1 className="font-semibold text-foreground">Contribute</h1>
        </div>
      </header>

      <main className="container max-w-3xl py-8 pb-24 space-y-10">
        <section>
          <p className="text-muted-foreground leading-relaxed">
            Jazak Allahu Khairan for your interest. MosqueSteps is community-driven and open source. You can contribute in many ways — no coding required unless you want to.
          </p>
        </section>

        {/* Ways to contribute */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Ways to contribute</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong className="text-foreground">Report bugs</strong> — Something not working? Open a bug report.</li>
            <li>• <strong className="text-foreground">Suggest features</strong> — Ideas for new features or improvements.</li>
            <li>• <strong className="text-foreground">Fix mosque data</strong> — Add or correct mosques on OpenStreetMap (see below).</li>
            <li>• <strong className="text-foreground">Report prayer times</strong> — Wrong times for your location? Use the prayer times template.</li>
            <li>• <strong className="text-foreground">Fix content</strong> — Hadith, translation, or guide errors.</li>
            <li>• <strong className="text-foreground">Improve docs</strong> — README, guides, or marketing copy.</li>
            <li>• <strong className="text-foreground">Translate</strong> — Add or improve languages (Arabic, Turkish, Urdu, etc.).</li>
            <li>• <strong className="text-foreground">Write code</strong> — Fix bugs, add features, add tests.</li>
          </ul>
        </section>

        {/* Report issues */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
            <Bug className="w-5 h-5 text-primary" />
            Report an issue
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            We use GitHub Issues with templates so we get the right information. Pick the one that fits:
          </p>
          <div className="grid gap-2">
            <a href={NEW_ISSUE("bug_report.md")} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left">
              <span className="font-medium text-foreground">🐛 Bug report</span>
              <span className="text-xs text-muted-foreground">Something isn’t working</span>
            </a>
            <a href={NEW_ISSUE("feature_request.md")} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left">
              <span className="font-medium text-foreground">✨ Feature request</span>
              <span className="text-xs text-muted-foreground">New feature or improvement</span>
            </a>
            <a href={NEW_ISSUE("mosque_data.md")} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left">
              <span className="font-medium text-foreground">🕌 Mosque data</span>
              <span className="text-xs text-muted-foreground">Missing or wrong mosque</span>
            </a>
            <a href={NEW_ISSUE("content_issue.md")} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left">
              <span className="font-medium text-foreground">📖 Content issue</span>
              <span className="text-xs text-muted-foreground">Hadith, translation, or guide</span>
            </a>
            <a href={NEW_ISSUE("prayer_times.md")} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left">
              <span className="font-medium text-foreground">⏰ Prayer times</span>
              <span className="text-xs text-muted-foreground">Wrong times for a location</span>
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <a href={ISSUES} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View all issues</a> · Search first to avoid duplicates.
          </p>
        </section>

        {/* Code contributions */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Contribute code
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-4">
            <li>Fork the repo on GitHub and clone your fork.</li>
            <li>Create a branch: <code className="bg-muted px-1 rounded text-foreground">git checkout -b fix/your-fix</code></li>
            <li>Install and run: <code className="bg-muted px-1 rounded text-foreground">npm install && npm run dev</code></li>
            <li>Make your changes and run tests: <code className="bg-muted px-1 rounded text-foreground">npx vitest run</code></li>
            <li>Commit with Conventional Commits (e.g. <code className="bg-muted px-1 rounded text-foreground">feat:</code>, <code className="bg-muted px-1 rounded text-foreground">fix:</code>, <code className="bg-muted px-1 rounded text-foreground">docs:</code>).</li>
            <li>Push and open a Pull Request against <strong className="text-foreground">main</strong>.</li>
          </ol>
          <a href={`${GITHUB_REPO}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <FileText className="w-4 h-4" />
            Full contributing guide (CONTRIBUTING.md)
          </a>
        </section>

        {/* Docs & content */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Docs & content
          </h2>
          <p className="text-sm text-muted-foreground mb-2">
            You can improve documentation and in-app content without touching app logic:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>README and CONTRIBUTING (in the repo)</li>
            <li>User guides in the app (<code className="bg-muted px-1 rounded text-foreground">src/lib/guides-data.ts</code>)</li>
            <li>Blog and SEO content (<code className="bg-muted px-1 rounded text-foreground">src/lib/blog-data.ts</code>)</li>
            <li>Marketing copy (<code className="bg-muted px-1 rounded text-foreground">src/marketing/</code>)</li>
          </ul>
        </section>

        {/* Mosque data */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Mosque data (OpenStreetMap)
          </h2>
          <p className="text-sm text-muted-foreground mb-2">
            MosqueSteps uses <strong className="text-foreground">OpenStreetMap</strong> for mosque locations. We don’t store mosque data ourselves. To add or fix a mosque:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground mb-2">
            <li>Go to <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openstreetmap.org</a> and create an account.</li>
            <li>Edit the map: add or correct the mosque (tag: <code className="bg-muted px-1 rounded text-foreground">amenity=place_of_worship</code>, <code className="bg-muted px-1 rounded text-foreground">religion=muslim</code>).</li>
            <li>Save. Changes will appear in MosqueSteps after OSM updates.</li>
          </ol>
          <p className="text-xs text-muted-foreground">
            You can still <a href={NEW_ISSUE("mosque_data.md")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">report a mosque issue</a> if you can’t edit OSM.
          </p>
        </section>

        {/* Code of conduct & PRs */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Code of conduct & PRs</h2>
          <p className="text-sm text-muted-foreground mb-2">
            We expect respectful, constructive communication. Please read our{" "}
            <a href={`${GITHUB_REPO}/blob/main/.github/CODE_OF_CONDUCT.md`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Code of Conduct</a>
            . Pull requests should be focused, include tests where relevant, and follow the{" "}
            <a href={`${GITHUB_REPO}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">contributing guide</a>.
          </p>
        </section>

        {/* Community */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Community
          </h2>
          <p className="text-sm text-muted-foreground mb-3">Questions or ideas? Get in touch:</p>
          <div className="flex flex-wrap gap-3">
            <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors">
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <a href={ISSUES} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors">
              Issues
            </a>
            <a href="https://x.com/ummahbuild" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors">
              X / Twitter
            </a>
            <a href="https://www.linkedin.com/company/ummah-build/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors">
              LinkedIn
            </a>
          </div>
        </section>

        <p className="text-sm text-muted-foreground border-t border-border pt-6">
          Barak Allahu feek for helping make every step to the mosque count. For a longer read with the same links, see our blog:{" "}
          <Link to="/blogs/contributing-to-mosquesteps" className="text-primary hover:underline font-medium">How to Contribute to MosqueSteps</Link>.
          Built with faith and open-source technology by{" "}
          <a href="https://ummah.build" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ummah.build</a>.
        </p>
      </main>
    </div>
  );
}

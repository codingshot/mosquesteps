import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bug, Sparkles, MapPin, BookOpen, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import logo from "@/assets/logo.png";

const SITE_URL = "https://mosquesteps.com";
const GITHUB_REPO = "https://github.com/codingshot/mosquesteps";
const ISSUES = `${GITHUB_REPO}/issues`;
const NEW_ISSUE = (template: string) => `${ISSUES}/new?template=${template}`;

const ISSUE_TYPES = [
  {
    id: "bug",
    href: NEW_ISSUE("bug_report.md"),
    icon: Bug,
    label: "Report a Bug",
    description: "Something isn’t working as expected.",
  },
  {
    id: "feature",
    href: NEW_ISSUE("feature_request.md"),
    icon: Sparkles,
    label: "Request a Feature",
    description: "Suggest a new feature or improvement.",
  },
  {
    id: "mosque",
    href: NEW_ISSUE("mosque_data.md"),
    icon: MapPin,
    label: "Mosque Data Issue",
    description: "Missing or incorrect mosque on the map.",
  },
  {
    id: "content",
    href: NEW_ISSUE("content_issue.md"),
    icon: BookOpen,
    label: "Content Issue",
    description: "Hadith, translation, or guide correction.",
  },
  {
    id: "prayer",
    href: NEW_ISSUE("prayer_times.md"),
    icon: Clock,
    label: "Prayer Time Issue",
    description: "Wrong prayer times for your location.",
  },
] as const;

export default function IssuesPage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "issues-page-schema";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Report an Issue | MosqueSteps",
      description: "Report bugs, request features, or report mosque, content, or prayer time issues for MosqueSteps. Choose a template and submit on GitHub.",
      url: `${SITE_URL}/issues`,
      publisher: { "@type": "Organization", name: "MosqueSteps", url: SITE_URL },
      mainEntity: {
        "@type": "HowTo",
        name: "How to report an issue for MosqueSteps",
        step: [
          { "@type": "HowToStep", name: "Choose your issue type", text: "Select one of: bug report, feature request, mosque data, content issue, or prayer time issue." },
          { "@type": "HowToStep", name: "Open GitHub", text: "You will open GitHub with a pre-filled issue template." },
          { "@type": "HowToStep", name: "Submit", text: "Complete the form and submit. The team will respond on GitHub." },
        ],
      },
    });
    const existing = document.getElementById(script.id);
    if (existing) existing.remove();
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById(script.id);
      if (el) el.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Report an Issue — Bug, Feature, Mosque, Prayer Times | MosqueSteps"
        description="Report a bug, request a feature, or report mosque, content, or prayer time issues. Choose a template and submit on GitHub. MosqueSteps is open source."
        path="/issues"
      />
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14 gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" aria-label="Back to home">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="MosqueSteps" className="w-6 h-6" />
          </Link>
          <h1 className="font-semibold text-foreground truncate">Report an Issue</h1>
        </div>
      </header>

      <main className="container max-w-lg py-8 pb-24">
        <section className="mb-8">
          <p className="text-muted-foreground leading-relaxed">
            Found a bug, have a feature idea, or spotted wrong mosque or prayer times? Use the flow below to open the right form on GitHub. Each option opens a pre-filled template so we get the details we need.
          </p>
        </section>

        <section aria-labelledby="issue-flow-heading" className="space-y-6">
          <h2 id="issue-flow-heading" className="text-lg font-semibold text-foreground">
            How to report
          </h2>
          <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
            <li><strong className="text-foreground">Choose your issue type</strong> below (bug, feature, mosque data, content, or prayer times).</li>
            <li><strong className="text-foreground">You’ll open GitHub</strong> with a template already selected.</li>
            <li><strong className="text-foreground">Fill in the form and submit.</strong> We’ll respond on GitHub.</li>
          </ol>
        </section>

        <section aria-labelledby="issue-types-heading" className="mt-8">
          <h2 id="issue-types-heading" className="text-lg font-semibold text-foreground mb-4">
            Choose an issue type
          </h2>
          <div className="space-y-2">
            {ISSUE_TYPES.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-4 flex items-center justify-between gap-3 hover:border-primary/30 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary" aria-hidden>
                      <Icon className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden />
                </a>
              );
            })}
          </div>
        </section>

        <section className="mt-8 pt-6 border-t border-border space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Other ways to help</h2>
          <p className="text-xs text-muted-foreground">
            <a href={ISSUES} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              View all issues on GitHub
            </a>
            {" "}— search first to avoid duplicates.
          </p>
          <p className="text-xs text-muted-foreground">
            <Link to="/contribute" className="text-primary hover:underline">
              Contribute code, docs, or translations
            </Link>
            {" "}— see the Contribute page for more ways to help.
          </p>
        </section>
      </main>
    </div>
  );
}

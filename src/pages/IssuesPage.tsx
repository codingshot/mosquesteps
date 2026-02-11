import { Link } from "react-router-dom";
import { ArrowLeft, Bug, Sparkles, MapPin, BookOpen, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import logo from "@/assets/logo.png";

const GITHUB_REPO = "https://github.com/codingshot/mosquesteps";
const ISSUES = `${GITHUB_REPO}/issues`;
const NEW_ISSUE = (template: string) => `${ISSUES}/new?template=${template}`;

const ISSUE_TYPES = [
  {
    id: "bug",
    href: NEW_ISSUE("bug_report.md"),
    icon: Bug,
    label: "Report a Bug",
    description: "Something isn’t working",
  },
  {
    id: "feature",
    href: NEW_ISSUE("feature_request.md"),
    icon: Sparkles,
    label: "Request a Feature",
    description: "New feature or improvement",
  },
  {
    id: "mosque",
    href: NEW_ISSUE("mosque_data.md"),
    icon: MapPin,
    label: "Mosque Data Issue",
    description: "Missing or wrong mosque",
  },
  {
    id: "content",
    href: NEW_ISSUE("content_issue.md"),
    icon: BookOpen,
    label: "Content Issue",
    description: "Hadith, translation, or guide",
  },
  {
    id: "prayer",
    href: NEW_ISSUE("prayer_times.md"),
    icon: Clock,
    label: "Prayer Time Issue",
    description: "Wrong times for a location",
  },
] as const;

export default function IssuesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Report an Issue"
        description="Report a bug, request a feature, or report mosque, content, or prayer time issues. Opens the right GitHub issue template."
        path="/issues"
      />
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14 gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" aria-label="Back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="MosqueSteps" className="w-6 h-6" />
          </Link>
          <h1 className="font-semibold text-foreground">Report an Issue</h1>
        </div>
      </header>

      <main className="container max-w-lg py-8 pb-24">
        <p className="text-muted-foreground text-sm mb-6">
          Pick the type of issue that fits. Each opens GitHub with a pre-filled template so we get the right information.
        </p>
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
                  <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden />
              </a>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          <a href={ISSUES} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            View all issues on GitHub
          </a>
          {" "}· Search first to avoid duplicates.
        </p>
        <div className="mt-8 pt-6 border-t border-border">
          <Link to="/contribute" className="text-sm text-primary hover:underline">
            ← Contribute (code, docs, translate)
          </Link>
        </div>
      </main>
    </div>
  );
}

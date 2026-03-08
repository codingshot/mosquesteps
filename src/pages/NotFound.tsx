import { useLocation, Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { Home, LayoutDashboard, BookOpen, MapPin, HelpCircle, BookMarked, Search, Footprints, Trophy } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";

/** Suggest a likely correct route based on the attempted path */
export function suggestRoute(pathname: string): { to: string; label: string } | null {
  const lower = pathname.toLowerCase().replace(/^\/+|\/+$/g, "");
  const suggestions: Record<string, { to: string; label: string }> = {
    "mosque": { to: "/mosques", label: "Mosque Finder" },
    "mosques": { to: "/mosques", label: "Mosque Finder" },
    "masjid": { to: "/mosques", label: "Mosque Finder" },
    "pray": { to: "/walk", label: "Start a Walk" },
    "prayer": { to: "/dashboard", label: "Dashboard (Prayer Times)" },
    "walk": { to: "/walk", label: "Start Walking" },
    "walking": { to: "/walk", label: "Start Walking" },
    "steps": { to: "/stats", label: "Walking Stats" },
    "stat": { to: "/stats", label: "Walking Stats" },
    "statistics": { to: "/stats", label: "Walking Stats" },
    "reward": { to: "/rewards", label: "Rewards & Badges" },
    "badge": { to: "/rewards", label: "Rewards & Badges" },
    "badges": { to: "/rewards", label: "Rewards & Badges" },
    "hasanat": { to: "/rewards", label: "Spiritual Rewards" },
    "blog": { to: "/blogs", label: "Blog" },
    "article": { to: "/blogs", label: "Blog" },
    "articles": { to: "/blogs", label: "Blog" },
    "guide": { to: "/guides", label: "User Guides" },
    "help": { to: "/faq", label: "FAQ" },
    "support": { to: "/faq", label: "FAQ" },
    "setting": { to: "/settings", label: "Settings" },
    "config": { to: "/settings", label: "Settings" },
    "preference": { to: "/settings", label: "Settings" },
    "preferences": { to: "/settings", label: "Settings" },
    "hadith": { to: "/sunnah", label: "Sunnah & Hadiths" },
    "sunnah": { to: "/sunnah", label: "Sunnah & Hadiths" },
    "about": { to: "/how-it-works", label: "How It Works" },
    "install": { to: "/onboarding", label: "Get Started" },
    "download": { to: "/onboarding", label: "Get Started" },
    "app": { to: "/dashboard", label: "Dashboard" },
    "home": { to: "/", label: "Home" },
    "notify": { to: "/notifications", label: "Notifications" },
    "notification": { to: "/notifications", label: "Notifications" },
    "history": { to: "/history", label: "Walk History" },
  };

  // Direct match
  if (suggestions[lower]) return suggestions[lower];

  // Partial match
  for (const [key, val] of Object.entries(suggestions)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }

  return null;
}

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const suggestion = useMemo(() => suggestRoute(location.pathname), [location.pathname]);

  const quickActions = [
    { to: "/", label: "Home", icon: Home },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/blogs", label: "Blog", icon: BookOpen },
    { to: "/mosques", label: "Mosque finder", icon: MapPin },
    { to: "/faq", label: "FAQ", icon: HelpCircle },
    { to: "/guides", label: "Guides", icon: BookMarked },
    { to: "/walk", label: "Start Walk", icon: Footprints },
    { to: "/rewards", label: "Rewards", icon: Trophy },
  ] as const;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <SEOHead
        title="Page Not Found"
        description="Page not found. Return to MosqueSteps — track your walk to the mosque and spiritual rewards."
        path={location.pathname}
        noindex
      />
      <div className="text-center max-w-md w-full space-y-6">
        <h1 className="text-5xl font-bold text-foreground">404</h1>
        <p className="text-lg text-muted-foreground">This page doesn't exist or may have moved.</p>
        <p className="text-sm text-muted-foreground">
          You tried: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">{location.pathname}</code>
        </p>

        {/* Smart suggestion */}
        {suggestion && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-2">Did you mean?</p>
            <Link to={suggestion.to}>
              <Button variant="default" size="sm" className="gap-2">
                <Search className="w-4 h-4" />
                {suggestion.label}
              </Button>
            </Link>
          </div>
        )}

        <div className="pt-4">
          <p className="text-sm font-medium text-foreground mb-3">Quick actions</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}>
                <Button variant="outline" className="w-full justify-start gap-2 h-10" size="sm">
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* Search redirect */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-2">Or search for what you need:</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement)?.value?.trim();
              if (q) {
                const match = suggestRoute("/" + q);
                if (match) window.location.href = match.to;
                else window.location.href = `/faq`;
              }
            }}
            className="flex gap-2 max-w-xs mx-auto"
          >
            <input
              name="q"
              type="text"
              placeholder="e.g. mosque, walk, rewards…"
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button type="submit" size="sm" variant="outline" className="gap-1">
              <Search className="w-4 h-4" /> Go
            </Button>
          </form>
        </div>

        <Link to="/" className="inline-block">
          <Button variant="default" size="lg" className="mt-2">
            <Home className="w-4 h-4 mr-2" />
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
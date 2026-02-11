import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, LayoutDashboard, BookOpen, MapPin, HelpCircle, BookMarked } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const quickActions = [
    { to: "/", label: "Home", icon: Home },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/blogs", label: "Blog", icon: BookOpen },
    { to: "/mosques", label: "Mosque finder", icon: MapPin },
    { to: "/faq", label: "FAQ", icon: HelpCircle },
    { to: "/guides", label: "Guides", icon: BookMarked },
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
        <p className="text-lg text-muted-foreground">This page doesn’t exist or may have moved.</p>
        <p className="text-sm text-muted-foreground">
          You tried: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">{location.pathname}</code>
        </p>

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

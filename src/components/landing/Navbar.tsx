import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png?w=256&format=webp";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Sunnah", href: "/sunnah", isRoute: true },
    { label: "How It Works", href: "/how-it-works", isRoute: true },
    { label: "FAQ", href: "/faq", isRoute: true },
    { label: "Blog", href: "/blogs", isRoute: true },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <img src={logo} alt="MosqueSteps" className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0" />
          <span className="text-lg sm:text-xl font-bold text-foreground truncate">
            Mosque<span className="text-primary">Steps</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
            link.isRoute ? (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                title={link.href === "/sunnah" ? "Hadiths on walking to the mosque — rewards, sources, and links to Sunnah.com" : undefined}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            )
          )}
          <Link to="/dashboard">
            <Button variant="hero" size="sm">
              Start Tracking
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2.5 -mr-1 text-foreground touch-manipulation"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 sm:px-6 pt-4 pb-6">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className="block py-3 px-1 text-sm font-medium text-muted-foreground hover:text-primary active:bg-muted/50 rounded-md -mx-1 min-h-[44px] flex items-center"
                  onClick={() => setMobileOpen(false)}
                  title={link.href === "/sunnah" ? "Hadiths on walking to the mosque — rewards, sources, and links to Sunnah.com" : undefined}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="block py-3 px-1 text-sm font-medium text-muted-foreground hover:text-primary active:bg-muted/50 rounded-md -mx-1 min-h-[44px] flex items-center"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              )
            )}
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="mt-2 min-h-[44px] flex items-center justify-center"
            >
              <Button variant="hero" className="w-full">
                Start Tracking
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

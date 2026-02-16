import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Download, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { guides } from "@/lib/guides-data";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import logo from "@/assets/logo.png?w=256&format=webp";

const SITE_URL = "https://mosquesteps.com";

const Guides = () => {
  const navigate = useNavigate();
  const { canInstall, isInstalled, install } = usePWAInstall();

  useEffect(() => {
    // Breadcrumb
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "breadcrumb-guides";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
        { "@type": "ListItem", position: 2, name: "Guides", item: SITE_URL + "/guides" },
      ],
    });
    const existing = document.getElementById(script.id);
    if (existing) existing.remove();
    document.head.appendChild(script);

    // ItemList schema for GEO/AEO — helps AI engines understand guide collection
    const itemList = document.createElement("script");
    itemList.type = "application/ld+json";
    itemList.id = "itemlist-guides";
    itemList.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "MosqueSteps User Guides",
      description: "Complete walkthrough guides for the MosqueSteps mosque walking tracker app.",
      numberOfItems: guides.length,
      itemListElement: guides.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: g.title,
        url: SITE_URL + "/guides/" + g.id,
        description: g.description,
      })),
    });
    const exList = document.getElementById(itemList.id);
    if (exList) exList.remove();
    document.head.appendChild(itemList);

    return () => {
      document.getElementById(script.id)?.remove();
      document.getElementById(itemList.id)?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="User Guides — How to Use MosqueSteps" description="Complete step-by-step guides: set up MosqueSteps, find nearby mosques, track walks with GPS, earn spiritual rewards, and view walking statistics." path="/guides" />
      <header className="bg-gradient-teal text-primary-foreground">
        <div className="container py-4 flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground hover:opacity-80 transition-opacity" aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
          </button>
          <span className="font-bold">User Guides</span>
        </div>
        <div className="container pb-8 text-center">
          <BookOpen className="w-10 h-10 mx-auto mb-2" />
          <h1 className="text-2xl font-bold">How to Use MosqueSteps</h1>
          <p className="text-sm text-primary-foreground/70 mt-2 max-w-md mx-auto">
            Step-by-step guides to help you get the most out of your walking journey to the mosque.
          </p>
        </div>
      </header>

      <div className="container py-8 space-y-4 max-w-2xl">
        {guides.map((guide, i) => (
          <motion.div
            key={guide.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to={`/guides/${guide.id}`} className="block">
              <div className="glass-card overflow-hidden hover:shadow-teal transition-shadow group">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-teal flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{guide.iconEmoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-foreground group-hover:text-primary transition-colors">{guide.title}</h2>
                    <p className="text-xs text-muted-foreground line-clamp-2">{guide.description}</p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180 flex-shrink-0" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {/* PWA Install */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-5 space-y-3"
        >
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" /> Install as App (PWA)
          </h2>
          {isInstalled ? (
            <p className="text-sm text-primary font-medium">✓ MosqueSteps is already installed on this device!</p>
          ) : canInstall ? (
            <>
              <p className="text-sm text-muted-foreground">Install MosqueSteps directly to your home screen for the best experience.</p>
              <Button onClick={install} className="w-full" variant="hero" size="lg">
                <Download className="w-5 h-5 mr-2" /> Install MosqueSteps
              </Button>
            </>
          ) : (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>iOS Safari:</strong> Tap the Share button → "Add to Home Screen"</p>
              <p><strong>Android Chrome:</strong> Tap the menu (⋮) → "Add to Home Screen" or "Install App"</p>
              <p><strong>Desktop Chrome/Edge:</strong> Click the install icon in the address bar</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground italic">
            Installing as a PWA enables offline support, push notifications, and a native app-like experience.
          </p>
        </motion.div>

        <div className="text-center pt-4">
          <Link to="/" className="text-sm text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Guides;

import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Download, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { guides } from "@/lib/guides-data";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import logo from "@/assets/logo.png";

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
              <div className="glass-card overflow-hidden hover:shadow-teal transition-shadow group flex items-stretch">
                {/* Mini live phone preview */}
                <div className="w-[90px] flex-shrink-0 bg-muted/30 flex items-center justify-center p-2 border-r border-border/50">
                  <div className="relative w-full">
                    <div className="rounded-[10px] border-2 border-foreground/20 bg-background overflow-hidden shadow-md"
                      style={{ paddingTop: "6px", paddingBottom: "4px" }}>
                      {/* tiny notch */}
                      <div className="w-8 h-1.5 bg-foreground/20 rounded-b-md mx-auto mb-0.5" />
                      <div className="overflow-hidden rounded-[4px] mx-0.5" style={{ height: "130px" }}>
                        <iframe
                          src={guide.page}
                          title={guide.title}
                          className="border-0 pointer-events-none select-none"
                          style={{
                            width: "390px",
                            height: "844px",
                            transform: "scale(0.196)",
                            transformOrigin: "top left",
                          }}
                          loading="lazy"
                          tabIndex={-1}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-0.5 flex justify-center">
                        <div className="w-6 h-0.5 rounded-full bg-foreground/20" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Text */}
                <div className="flex items-center gap-3 p-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-teal flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">{guide.iconEmoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">{guide.title}</h2>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{guide.description}</p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180 flex-shrink-0" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {/* PWA Install */}
        {/* Install prompt — hidden when already installed */}
        {!isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-4 space-y-3 border-primary/20"
          >
            <div className="flex items-center gap-3">
              <Smartphone className="w-8 h-8 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-foreground text-sm">Add to Home Screen</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Install for offline access, faster loading &amp; a native app feel.
                </p>
              </div>
            </div>
            {canInstall ? (
              <Button
                onClick={async () => { await install(); }}
                className="w-full"
                variant="hero"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" /> Add to Home Screen
              </Button>
            ) : (
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p>🍎 <strong>iPhone/iPad:</strong> Safari → Share → "Add to Home Screen"</p>
                <p>🤖 <strong>Android:</strong> Chrome menu (⋮) → "Add to Home Screen"</p>
                <p>💻 <strong>Desktop:</strong> Click the install icon in the address bar</p>
              </div>
            )}
          </motion.div>
        )}

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

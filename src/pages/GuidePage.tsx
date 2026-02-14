import { useEffect } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronRight, Copy, Download, Smartphone, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { guides, getGuideById } from "@/lib/guides-data";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const SITE_URL = "https://mosquesteps.com";

const GuidePage = () => {
  const { guideId } = useParams<{ guideId: string }>();
  const navigate = useNavigate();
  const guide = getGuideById(guideId || "");
  const { canInstall, isInstalled, install } = usePWAInstall();
  const { toast } = useToast();

  const currentIndex = guide ? guides.findIndex((g) => g.id === guide.id) : -1;
  const prevGuide = currentIndex > 0 ? guides[currentIndex - 1] : null;
  const nextGuide = currentIndex >= 0 && currentIndex < guides.length - 1 ? guides[currentIndex + 1] : null;

  useEffect(() => {
    if (!guide) return;
    // Breadcrumb structured data
    const breadcrumb = document.createElement("script");
    breadcrumb.type = "application/ld+json";
    breadcrumb.id = "breadcrumb-guide";
    breadcrumb.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
        { "@type": "ListItem", position: 2, name: "Guides", item: SITE_URL + "/guides" },
        { "@type": "ListItem", position: 3, name: guide.title, item: SITE_URL + "/guides/" + guide.id },
      ],
    });
    const existing = document.getElementById(breadcrumb.id);
    if (existing) existing.remove();
    document.head.appendChild(breadcrumb);

    // HowTo structured data for ALL guides (AEO/GEO optimized)
    const howToScript = document.createElement("script");
    howToScript.type = "application/ld+json";
    howToScript.id = "howto-guide";
    howToScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: guide.title,
      description: guide.description,
      image: SITE_URL + guide.screenshot,
      totalTime: `PT${guide.steps.length * 2}M`,
      tool: [{ "@type": "HowToTool", name: "MosqueSteps app" }],
      step: guide.steps.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.text.slice(0, 80) + (s.text.length > 80 ? "…" : ""),
        text: s.text,
        url: s.link ? SITE_URL + s.link : SITE_URL + "/guides/" + guide.id,
      })),
    });
    const exHowTo = document.getElementById(howToScript.id);
    if (exHowTo) exHowTo.remove();
    document.head.appendChild(howToScript);

    return () => {
      document.getElementById(breadcrumb.id)?.remove();
      document.getElementById("howto-guide")?.remove();
    };
  }, [guide?.id, guide?.title, guide?.description, guide?.steps, guide?.screenshot]);

  const copyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast({ title: "Link copied", description: "Share this guide with anyone." });
      });
    } catch {
      toast({ title: "Copy failed", description: "Use your browser's share feature." });
    }
  };

  if (!guide) return <Navigate to="/guides" replace />;

  return (
    <div className="min-h-screen bg-background pb-bottom-nav">
      <SEOHead
        title={`${guide.title} — User Guide`}
        description={guide.description}
        path={`/guides/${guide.id}`}
      />

      <header className="bg-gradient-teal text-primary-foreground">
        <div className="container py-4 flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
          </button>
          <Link to="/guides" className="font-bold text-sm hover:underline">Guides</Link>
          <ChevronRight className="w-4 h-4 text-primary-foreground/50" />
          <span className="font-bold text-sm truncate">{guide.title}</span>
        </div>
        <div className="container pb-6 text-center">
          <span className="text-4xl mb-2 block">{guide.iconEmoji}</span>
          <h1 className="text-2xl font-bold">{guide.title}</h1>
          <p className="text-sm text-primary-foreground/70 mt-1 max-w-md mx-auto">{guide.description}</p>
          <Button variant="ghost" size="sm" className="mt-3 gap-2 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" onClick={copyLink} aria-label="Copy link to this guide">
            <Copy className="w-4 h-4" /> Copy link
          </Button>
        </div>
      </header>

      <div className="container py-6 space-y-6 max-w-2xl">
        {/* Screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden"
        >
          <div className="bg-muted/50 flex justify-center p-4">
            <img
              src={guide.screenshot}
              alt={`${guide.title} screenshot`}
              className="rounded-xl shadow-lg max-h-80 w-auto object-contain"
              loading="lazy"
            />
          </div>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5 space-y-4"
        >
          <h2 className="font-semibold text-foreground text-lg">Step-by-Step</h2>
          <ol className="space-y-3">
            {guide.steps.map((step, j) => (
              <li key={j} className="flex gap-3 text-sm">
                <span className="w-7 h-7 rounded-full bg-gradient-gold text-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {j + 1}
                </span>
                <div className="pt-1 flex-1">
                  <span className="text-muted-foreground leading-relaxed">{step.text}</span>
                  {step.link && (
                    <Link
                      to={step.link}
                      className="inline-flex items-center gap-1 ml-2 text-primary text-xs font-medium hover:underline"
                    >
                      {step.linkLabel || "Go →"}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </motion.div>

        {/* Tip */}
        {guide.tip && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-secondary rounded-xl p-4 text-sm text-secondary-foreground space-y-3"
          >
            <p><span className="font-semibold">💡 Tip:</span> {guide.tip}</p>
            {guide.tipCTA && (
              <a
                href={guide.tipCTA.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="w-4 h-4" />
                {guide.tipCTA.label}
              </a>
            )}
          </motion.div>
        )}

        {/* CTA to open the related page */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link to={guide.page}>
            <Button className="w-full" size="lg">
              {guide.pageLabel} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </motion.div>

        {/* PWA Install - show on all guide pages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-5 space-y-3"
        >
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" /> Install as App
          </h3>
          {isInstalled ? (
            <p className="text-sm text-primary font-medium">✓ MosqueSteps is already installed!</p>
          ) : canInstall ? (
            <Button onClick={install} className="w-full" variant="hero">
              <Download className="w-4 h-4 mr-2" /> Install MosqueSteps
            </Button>
          ) : (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>iOS Safari:</strong> Tap Share → "Add to Home Screen"</p>
              <p><strong>Android Chrome:</strong> Tap menu (⋮) → "Install App"</p>
              <p><strong>Desktop Chrome/Edge:</strong> Click install icon in address bar</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground italic">
            Installing enables offline support, push notifications, and native app-like experience.
          </p>
        </motion.div>

        {/* Prev/Next navigation */}
        <div className="flex gap-3">
          {prevGuide ? (
            <Link to={`/guides/${prevGuide.id}`} className="flex-1">
              <div className="glass-card p-3 hover:shadow-teal transition-shadow">
                <p className="text-[10px] text-muted-foreground">← Previous</p>
                <p className="text-sm font-medium text-foreground truncate">{prevGuide.iconEmoji} {prevGuide.title}</p>
              </div>
            </Link>
          ) : <div className="flex-1" />}
          {nextGuide ? (
            <Link to={`/guides/${nextGuide.id}`} className="flex-1 text-right">
              <div className="glass-card p-3 hover:shadow-teal transition-shadow">
                <p className="text-[10px] text-muted-foreground">Next →</p>
                <p className="text-sm font-medium text-foreground truncate">{nextGuide.iconEmoji} {nextGuide.title}</p>
              </div>
            </Link>
          ) : <div className="flex-1" />}
        </div>

        <div className="text-center pt-2">
          <Link to="/guides" className="text-sm text-primary hover:underline">← All Guides</Link>
        </div>
      </div>
    </div>
  );
};

export default GuidePage;

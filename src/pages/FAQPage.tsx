import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import FAQ from "@/components/landing/FAQ";
import SEOHead from "@/components/SEOHead";
import { faqs } from "@/lib/faq-data";

const FAQPage = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    });
    script.id = "faq-schema";
    const existing = document.getElementById("faq-schema");
    if (existing) existing.remove();
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById("faq-schema");
      if (el) el.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Frequently Asked Questions" description="FAQ: steps, prayer times, mosque finder, privacy, and spiritual rewards. MosqueSteps — walk to the mosque, track your blessing." path="/faq" />
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14 gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" aria-label="Back to home"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="font-semibold text-foreground">FAQ</h1>
        </div>
      </header>
      <main className="pt-4 pb-20">
        <FAQ />
      </main>
    </div>
  );
};

export default FAQPage;

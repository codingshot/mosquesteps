import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import FAQ from "@/components/landing/FAQ";
import SEOHead from "@/components/SEOHead";

const FAQPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Frequently Asked Questions" description="Common questions about MosqueSteps — walking tracker, prayer times, mosque finder, and spiritual rewards." path="/faq" />
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14 gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
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

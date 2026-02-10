import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import HowItWorks from "@/components/landing/HowItWorks";
import SEOHead from "@/components/SEOHead";

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="How MosqueSteps Works" description="Learn how MosqueSteps tracks your walk to the mosque using GPS, step counting, and prayer time intelligence." path="/how-it-works" />
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14 gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="font-semibold text-foreground">How It Works</h1>
        </div>
      </header>
      <main className="pt-4 pb-20">
        <HowItWorks />
      </main>
    </div>
  );
};

export default HowItWorksPage;

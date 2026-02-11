import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import IslamicFoundation from "@/components/landing/IslamicFoundation";
import SEOHead from "@/components/SEOHead";

const SunnahPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Sunnah of Walking to Prayer" description="Hadiths on walking to the mosque: spiritual rewards, Fajr & Isha, and tranquility. Authentic sources — every step earns blessings." path="/sunnah" />
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14 gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="font-semibold text-foreground">Sunnah of Walking to Prayer</h1>
        </div>
      </header>
      <main className="pt-4 pb-20">
        <IslamicFoundation />
      </main>
    </div>
  );
};

export default SunnahPage;

import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import ProblemSolution from "@/components/landing/ProblemSolution";
import Features from "@/components/landing/Features";
import GuidesCarousel from "@/components/landing/GuidesCarousel";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="MosqueSteps — Every Step is a Blessing"
        description="Track your walk to the mosque and earn spiritual rewards. Prayer times, steps, mosque finder, and hasanat from authentic hadiths. Free PWA — every step counts."
        path="/"
      />
      <Navbar />
      <main>
        <Hero />
        <ProblemSolution />
        <Features />
        <GuidesCarousel />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

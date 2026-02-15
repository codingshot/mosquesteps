import { lazy, Suspense } from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Footer from "@/components/landing/Footer";
import SEOHead from "@/components/SEOHead";

const ProblemSolution = lazy(() => import("@/components/landing/ProblemSolution"));
const Features = lazy(() => import("@/components/landing/Features"));
const GuidesCarousel = lazy(() => import("@/components/landing/GuidesCarousel"));
const CTA = lazy(() => import("@/components/landing/CTA"));

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
        <Suspense fallback={null}>
          <ProblemSolution />
          <Features />
          <GuidesCarousel />
          <CTA />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Index;

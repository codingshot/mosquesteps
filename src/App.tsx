import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { hasCompletedOnboarding } from "./pages/Onboarding";
import BottomNav from "./components/BottomNav";
import Index from "./pages/Index";

// Lazy-load non-critical routes for performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MosqueFinder = lazy(() => import("./pages/MosqueFinder"));
const Rewards = lazy(() => import("./pages/Rewards"));
const ActiveWalk = lazy(() => import("./pages/ActiveWalk"));
const History = lazy(() => import("./pages/History"));
const Stats = lazy(() => import("./pages/Stats"));
const Settings = lazy(() => import("./pages/Settings"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Legal = lazy(() => import("./pages/Legal"));
const Guides = lazy(() => import("./pages/Guides"));
const GuidePage = lazy(() => import("./pages/GuidePage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const SunnahPage = lazy(() => import("./pages/SunnahPage"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Apply saved theme on load
function ThemeInit() {
  useEffect(() => {
    const saved = localStorage.getItem("mosquesteps_theme") || "system";
    const resolved = saved === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : saved;
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeInit />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/mosques" element={<MosqueFinder />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/walk" element={<ActiveWalk />} />
            <Route path="/history" element={<History />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/guides/:guideId" element={<GuidePage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/sunnah" element={<SunnahPage />} />
            <Route path="/blogs" element={<Blog />} />
            <Route path="/blogs/:slug" element={<BlogPost />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

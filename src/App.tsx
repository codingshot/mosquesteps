import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { hasCompletedOnboarding } from "./pages/Onboarding";
import BottomNav from "./components/BottomNav";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OfflineBanner } from "./components/OfflineBanner";
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
const BrandPage = lazy(() => import("./pages/BrandPage"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Contribute = lazy(() => import("./pages/Contribute"));
const IssuesPage = lazy(() => import("./pages/IssuesPage"));
const Changelog = lazy(() => import("./pages/Changelog"));
const Content = lazy(() => import("./pages/Content"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false },
  },
});

/** Redirects /blog/:slug to /blogs/:slug so the slug is preserved. */
function RedirectTo({ path }: { path: string }) {
  const params = useParams();
  const slug = params.slug ?? "";
  return <Navigate to={slug ? `${path}/${slug}` : path} replace />;
}

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-sm text-muted-foreground">Loading…</p>
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
      <OfflineBanner />
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ErrorBoundary>
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
            <Route path="/blogs/" element={<Navigate to="/blogs" replace />} />
            <Route path="/blogs/:slug" element={<BlogPost />} />
            <Route path="/blogs/:slug/" element={<RedirectTo path="/blogs" />} />
            <Route path="/brand" element={<BrandPage />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/contribute" element={<Contribute />} />
            <Route path="/issues" element={<IssuesPage />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/content" element={<Content />} />
            {/* /blog -> /blogs */}
            <Route path="/blog" element={<Navigate to="/blogs" replace />} />
            <Route path="/blog/:slug" element={<RedirectTo path="/blogs" />} />
            {/* Common typos -> correct routes */}
            <Route path="/blg" element={<Navigate to="/blogs" replace />} />
            <Route path="/bloggs" element={<Navigate to="/blogs" replace />} />
            <Route path="/gides" element={<Navigate to="/guides" replace />} />
            <Route path="/gude" element={<Navigate to="/guides" replace />} />
            <Route path="/guide" element={<Navigate to="/guides" replace />} />
            <Route path="/mosque" element={<Navigate to="/mosques" replace />} />
            <Route path="/faqs" element={<Navigate to="/faq" replace />} />
            <Route path="/contribution" element={<Navigate to="/contribute" replace />} />
            <Route path="/changlog" element={<Navigate to="/changelog" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
            <BottomNav />
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

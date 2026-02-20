import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { blogPosts, BlogPost } from "@/lib/blog-data";
import SEOHead from "@/components/SEOHead";
import logo from "@/assets/logo.png";

const SITE_URL = "https://mosquesteps.com";

function injectBreadcrumbList(items: { name: string; url: string }[]) {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "breadcrumb-blog";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  });
  const existing = document.getElementById(script.id);
  if (existing) existing.remove();
  document.head.appendChild(script);
  return () => {
    const el = document.getElementById(script.id);
    if (el) el.remove();
  };
}

const categoryLabels: Record<BlogPost["category"], string> = {
  sunnah: "Sunnah & Hadith",
  guide: "App Guides",
  tips: "Tips & Motivation",
  health: "Health & Exercise",
  community: "Community",
};

const categoryColors: Record<BlogPost["category"], string> = {
  sunnah: "bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary",
  guide: "bg-accent/15 text-foreground dark:bg-accent/30 dark:text-foreground",
  tips: "bg-muted text-foreground dark:bg-muted/80 dark:text-foreground border border-border",
  health: "bg-destructive/15 text-destructive dark:bg-destructive/25 dark:text-destructive-foreground",
  community: "bg-gold/15 text-foreground dark:bg-gold/25 dark:text-foreground border border-border",
};

const CATEGORY_ORDER: BlogPost["category"][] = ["sunnah", "guide", "tips", "health", "community"];

const Blog = () => {
  const categories = CATEGORY_ORDER.filter((cat) => blogPosts.some((p) => p.category === cat));

  useEffect(() => {
    return injectBreadcrumbList([
      { name: "Home", url: SITE_URL + "/" },
      { name: "Blog", url: SITE_URL + "/blogs" },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog — Sunnah, Guides & Walking Tips"
        description="Articles on walking to the mosque: Sunnah, hadiths, app guides, and tips. Build a blessed walking habit with MosqueSteps."
        path="/blogs"
      />

      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14 gap-3">
          <Link to="/" className="p-2 -ml-2 rounded-lg border border-border bg-background text-foreground hover:text-primary hover:border-primary/50 hover:bg-muted/50 transition-colors inline-flex" aria-label="Back to home">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="MosqueSteps" className="w-6 h-6" />
            <span className="font-bold text-foreground">Blog</span>
          </Link>
        </div>
      </header>

      <main className="container py-8 max-w-3xl space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">MosqueSteps Blog</h1>
          <p className="text-muted-foreground">Sunnah insights, app guides, and tips for your walking journey.</p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No articles yet. Check back soon.</p>
          </div>
        ) : (
        categories.map((cat) => {
          const posts = blogPosts.filter((p) => p.category === cat);
          if (posts.length === 0) return null;
          return (
            <section key={cat}>
              <h2 className="text-xl font-bold text-foreground mb-4">{categoryLabels[cat]}</h2>
              <div className="grid gap-4">
                {posts.map((post, i) => (
                  <motion.div
                    key={post.slug}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={`/blogs/${post.slug}`}
                      className="glass-card p-5 flex gap-4 items-start hover:border-primary/30 transition-colors block"
                    >
                      <span className="text-3xl flex-shrink-0">{post.image}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border/50 ${categoryColors[post.category]}`}>
                            {categoryLabels[post.category]}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{post.readTime}</span>
                        </div>
                        <h3 className="font-semibold text-foreground text-sm leading-snug">{post.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          );
        })
        )}

        {/* Internal links for SEO and discovery */}
        <section className="mt-10 pt-8 border-t border-border">
          <h2 className="text-sm font-semibold text-foreground mb-3">Explore the app</h2>
          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard" className="text-sm text-primary hover:underline">Dashboard</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/mosques" className="text-sm text-primary hover:underline">Mosque finder</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/sunnah" className="text-sm text-primary hover:underline" title="Hadiths about walking to prayer: each step erases a sin and raises a degree, Fajr/Isha rewards, walk with tranquility.">Sunnah & hadiths</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/faq" className="text-sm text-primary hover:underline">FAQ</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/how-it-works" className="text-sm text-primary hover:underline">How it works</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/guides" className="text-sm text-primary hover:underline">Guides</Link>
          </div>
        </section>

        <div className="text-center pt-4">
          <Link to="/" className="text-sm text-primary hover:underline">← Back to Home</Link>
        </div>
      </main>
    </div>
  );
};

export default Blog;

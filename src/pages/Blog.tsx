import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { blogPosts, BlogPost } from "@/lib/blog-data";
import SEOHead from "@/components/SEOHead";
import logo from "@/assets/logo.png";

const categoryLabels: Record<BlogPost["category"], string> = {
  sunnah: "Sunnah & Hadith",
  guide: "App Guides",
  tips: "Tips & Motivation",
  health: "Health & Exercise",
  community: "Community",
};

const categoryColors: Record<BlogPost["category"], string> = {
  sunnah: "bg-primary/10 text-primary",
  guide: "bg-accent/10 text-accent-foreground",
  tips: "bg-secondary text-secondary-foreground",
  health: "bg-destructive/10 text-destructive",
  community: "bg-gold/10 text-foreground",
};

const Blog = () => {
  const categories = ["sunnah", "guide", "tips"] as const;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog — Sunnah, Guides & Walking Tips"
        description="Explore articles on the Sunnah of walking to the mosque, app guides, and tips for building a consistent walking habit. Rooted in authentic Islamic sources."
        path="/blogs"
      />

      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14 gap-3">
          <Link to="/">
            <button className="p-2 -ml-2 text-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
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

        {categories.map((cat) => {
          const posts = blogPosts.filter((p) => p.category === cat);
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
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColors[post.category]}`}>
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
        })}

        <div className="text-center pt-4">
          <Link to="/" className="text-sm text-primary hover:underline">← Back to Home</Link>
        </div>
      </main>
    </div>
  );
};

export default Blog;

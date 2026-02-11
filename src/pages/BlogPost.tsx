import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { getBlogBySlug, getRelatedPosts, BlogPost as BlogPostType } from "@/lib/blog-data";
import SEOHead from "@/components/SEOHead";
import logo from "@/assets/logo.png";

const categoryLabels: Record<BlogPostType["category"], string> = {
  sunnah: "Sunnah & Hadith",
  guide: "App Guides",
  tips: "Tips & Motivation",
  health: "Health & Exercise",
  community: "Community",
};

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogBySlug(slug) : undefined;

  if (!post) return <Navigate to="/blogs" replace />;

  const related = getRelatedPosts(post.slug, 3);

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} />;
      if (trimmed.startsWith("## "))
        return <h2 key={i} className="text-lg font-bold text-foreground mt-6 mb-2">{trimmed.slice(3)}</h2>;
      if (trimmed.startsWith("### "))
        return <h3 key={i} className="text-base font-semibold text-foreground mt-4 mb-1">{trimmed.slice(4)}</h3>;
      if (trimmed.match(/^\d+\.\s/))
        return <li key={i} className="text-sm text-muted-foreground ml-4 list-decimal">{renderInline(trimmed.replace(/^\d+\.\s/, ""))}</li>;
      if (trimmed.startsWith("- "))
        return <li key={i} className="text-sm text-muted-foreground ml-4 list-disc">{renderInline(trimmed.slice(2))}</li>;
      return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{renderInline(trimmed)}</p>;
    });
  };

  const renderInline = (text: string) => {
    // Bold **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={post.title}
        description={post.excerpt}
        path={`/blogs/${post.slug}`}
        type="article"
      />

      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14 gap-3">
          <Link to="/blogs">
            <button className="p-2 -ml-2 text-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="MosqueSteps" className="w-6 h-6" />
          </Link>
          <span className="text-xs text-muted-foreground truncate">{post.title}</span>
        </div>
      </header>

      <main className="container py-8 max-w-2xl">
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <span className="text-4xl mb-3 block">{post.image}</span>
            <span className="text-xs font-semibold text-primary">{categoryLabels[post.category]} · {post.readTime}</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-2 leading-tight">{post.title}</h1>
            <p className="text-muted-foreground text-sm mt-3 max-w-lg mx-auto">{post.excerpt}</p>
          </div>

          <div className="space-y-1">
            {renderContent(post.content)}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-8">
            {post.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                #{tag}
              </span>
            ))}
          </div>
        </motion.article>

        {/* Related Posts */}
        {related.length > 0 && (
          <section className="mt-12 pt-8 border-t border-border">
            <h2 className="text-lg font-bold text-foreground mb-4">Related Articles</h2>
            <div className="grid gap-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/blogs/${r.slug}`}
                  className="glass-card p-4 flex gap-3 items-center hover:border-primary/30 transition-colors"
                >
                  <span className="text-2xl">{r.image}</span>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{r.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.readTime}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="text-center pt-8">
          <Link to="/blogs" className="text-sm text-primary hover:underline">← All Articles</Link>
        </div>
      </main>
    </div>
  );
};

export default BlogPostPage;

import { useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { getBlogBySlug, getRelatedPosts, BlogPost as BlogPostType } from "@/lib/blog-data";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const SITE_URL = "https://mosquesteps.com";

const categoryLabels: Record<BlogPostType["category"], string> = {
  sunnah: "Sunnah & Hadith",
  guide: "App Guides",
  tips: "Tips & Motivation",
  health: "Health & Exercise",
  community: "Community",
};

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const normalizedSlug = slug
    ? (() => {
        try {
          return decodeURIComponent(slug).trim().replace(/\/+$/, "");
        } catch {
          return slug.trim().replace(/\/+$/, "");
        }
      })()
    : "";
  const post = normalizedSlug ? getBlogBySlug(normalizedSlug) : undefined;
  const { toast } = useToast();

  useEffect(() => {
    if (normalizedSlug && !post) {
      toast({ title: "Article not found", description: "The article may have been moved or doesn't exist.", variant: "destructive" });
    }
  }, [normalizedSlug, post, toast]);

  if (!post) {
    if (!normalizedSlug) return <Navigate to="/blogs" replace />;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <SEOHead title="Article Not Found" description="Blog article not found." path={`/blogs/${normalizedSlug}`} noindex />
        <p className="text-muted-foreground mb-4">Article not found.</p>
        <Link to="/blogs" className="text-primary font-medium hover:underline">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  const related = getRelatedPosts(post.slug, 3);

  useEffect(() => {
    // Breadcrumb schema
    const bcScript = document.createElement("script");
    bcScript.type = "application/ld+json";
    bcScript.id = "breadcrumb-blogpost";
    bcScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: SITE_URL + "/blogs" },
        { "@type": "ListItem", position: 3, name: post.title, item: SITE_URL + "/blogs/" + post.slug },
      ],
    });
    const existingBc = document.getElementById(bcScript.id);
    if (existingBc) existingBc.remove();
    document.head.appendChild(bcScript);

    // Article schema (AEO + SEO)
    const artScript = document.createElement("script");
    artScript.type = "application/ld+json";
    artScript.id = "article-blogpost";
    artScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.excerpt,
      url: SITE_URL + "/blogs/" + post.slug,
      publisher: {
        "@type": "Organization",
        name: "MosqueSteps",
        url: SITE_URL,
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": SITE_URL + "/blogs/" + post.slug,
      },
      articleSection: categoryLabels[post.category],
      keywords: post.tags.join(", "),
    });
    const existingArt = document.getElementById(artScript.id);
    if (existingArt) existingArt.remove();
    document.head.appendChild(artScript);

    return () => {
      document.getElementById("breadcrumb-blogpost")?.remove();
      document.getElementById("article-blogpost")?.remove();
    };
  }, [post.slug, post.title, post.excerpt, post.category, post.tags]);

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Link copied", description: "Share this article with anyone." });
    });
  };

  // Enhanced markdown-like rendering with table + code block support
  const renderContent = (content: string) => {
    const lines = content.split("\n");
    const result: JSX.Element[] = [];
    let i = 0;
    while (i < lines.length) {
      const trimmed = lines[i].trim();

      // Table detection
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
          tableLines.push(lines[i].trim());
          i++;
        }
        if (tableLines.length >= 2) {
          const headerCells = tableLines[0].split("|").filter(c => c.trim()).map(c => c.trim());
          const bodyRows = tableLines.slice(2).map(row => row.split("|").filter(c => c.trim()).map(c => c.trim()));
          result.push(
            <div key={`table-${i}`} className="overflow-x-auto my-4">
              <table className="w-full text-sm border border-border rounded-lg">
                <thead>
                  <tr className="bg-muted/50">
                    {headerCells.map((cell, ci) => (
                      <th key={ci} className="px-3 py-2 text-left font-semibold text-foreground border-b border-border">{cell}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, ri) => (
                    <tr key={ri} className="border-b border-border/50 last:border-0">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2 text-muted-foreground">{renderInline(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Code block
      if (trimmed.startsWith("```")) {
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        result.push(
          <pre key={`code-${i}`} className="bg-muted/60 border border-border rounded-lg p-3 my-3 overflow-x-auto">
            <code className="text-xs text-foreground font-mono">{codeLines.join("\n")}</code>
          </pre>
        );
        continue;
      }

      if (!trimmed) { result.push(<br key={i} />); i++; continue; }
      if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
        result.push(<h1 key={i} className="text-xl font-bold text-foreground mt-8 mb-3">{trimmed.slice(2)}</h1>);
        i++; continue;
      }
      if (trimmed.startsWith("## ")) {
        result.push(<h2 key={i} className="text-lg font-bold text-foreground mt-6 mb-2">{trimmed.slice(3)}</h2>);
        i++; continue;
      }
      if (trimmed.startsWith("### ")) {
        result.push(<h3 key={i} className="text-base font-semibold text-foreground mt-4 mb-1">{trimmed.slice(4)}</h3>);
        i++; continue;
      }
      if (trimmed.startsWith("---")) {
        result.push(<hr key={i} className="my-6 border-border" />);
        i++; continue;
      }
      if (trimmed.match(/^\d+\.\s/)) {
        result.push(<li key={i} className="text-sm text-muted-foreground ml-4 list-decimal">{renderInline(trimmed.replace(/^\d+\.\s/, ""))}</li>);
        i++; continue;
      }
      if (trimmed.startsWith("- ")) {
        result.push(<li key={i} className="text-sm text-muted-foreground ml-4 list-disc">{renderInline(trimmed.slice(2))}</li>);
        i++; continue;
      }
      if (trimmed.startsWith("> ")) {
        result.push(
          <blockquote key={i} className="border-l-4 border-primary/40 pl-4 my-3 italic text-sm text-muted-foreground">
            {renderInline(trimmed.slice(2))}
          </blockquote>
        );
        i++; continue;
      }
      result.push(<p key={i} className="text-sm text-muted-foreground leading-relaxed">{renderInline(trimmed)}</p>);
      i++;
    }
    return result;
  };

  const renderBold = (text: string) => {
    // Handle bold, inline code, and italic
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={i} className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground">{part.slice(1, -1)}</code>;
      if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**"))
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      return <span key={i}>{part}</span>;
    });
  };

  const renderInline = (text: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const segments: { type: "text" | "link"; content: string; url?: string }[] = [];
    let lastIndex = 0;
    let m;
    while ((m = linkRegex.exec(text)) !== null) {
      if (m.index > lastIndex) segments.push({ type: "text", content: text.slice(lastIndex, m.index) });
      segments.push({ type: "link", content: m[1], url: m[2] });
      lastIndex = linkRegex.lastIndex;
    }
    if (lastIndex < text.length) segments.push({ type: "text", content: text.slice(lastIndex) });
    return segments.map((seg, i) => {
      if (seg.type === "link" && seg.url)
        return (
          <a key={i} href={seg.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
            {seg.content}
          </a>
        );
      return <span key={i}>{renderBold(seg.content)}</span>;
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
          <Link to="/blogs" className="p-2 -ml-2 rounded-lg border border-border bg-background text-foreground hover:text-primary hover:border-primary/50 hover:bg-muted/50 transition-colors inline-flex" aria-label="Back to blog">
            <ArrowLeft className="w-5 h-5" />
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
            <Button variant="outline" size="sm" className="mt-3 gap-2 text-foreground border-border" onClick={copyLink} aria-label="Copy link to this article">
              <Copy className="w-4 h-4" /> Copy link
            </Button>
          </div>

          <div className="space-y-1">
            {renderContent(post.content)}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-8">
            {post.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-muted/80 text-foreground border border-border ring-1 ring-border/50">
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

        <div className="text-center pt-6 flex flex-wrap justify-center gap-x-3 gap-y-1">
          <Link to="/blogs" className="text-sm text-primary hover:underline">← All Articles</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/guides" className="text-sm text-primary hover:underline">User guides</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/faq" className="text-sm text-primary hover:underline">FAQ</Link>
        </div>
      </main>
    </div>
  );
};

export default BlogPostPage;

import { useEffect } from "react";

const SITE_URL = "https://mosquesteps.com";
/** Default social preview image (1200×630 recommended for og:image / twitter:card) */
const DEFAULT_OG_IMAGE = `${SITE_URL}/mosquestepsmeta.jpg`;

export interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  type?: "website" | "article";
  /** Absolute URL or path (e.g. /og-image.png) for og:image and twitter:image */
  image?: string;
  /** Set to true for app-only pages you don't want indexed (e.g. dashboard, settings) */
  noindex?: boolean;
  /** For type="article": ISO date string */
  publishedTime?: string;
  /** For type="article": author name */
  author?: string;
}

const SEOHead = ({
  title,
  description,
  path = "",
  type = "website",
  image,
  noindex = false,
  publishedTime,
  author,
}: SEOHeadProps) => {
  useEffect(() => {
    const fullTitle = title.includes("MosqueSteps") ? title : `${title} | MosqueSteps`;
    document.title = fullTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const url = `${SITE_URL}${path}`;
    const imageUrl = image?.startsWith("http") ? image : image ? `${SITE_URL}${image}` : DEFAULT_OG_IMAGE;

    setMeta("name", "description", description);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("property", "og:type", type);
    setMeta("property", "og:image", imageUrl);
    setMeta("property", "og:image:alt", fullTitle);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", imageUrl);

    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    if (type === "article" && publishedTime) setMeta("property", "article:published_time", publishedTime);
    if (type === "article" && author) setMeta("property", "article:author", author);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
  }, [title, description, path, type, image, noindex, publishedTime, author]);

  return null;
};

export default SEOHead;

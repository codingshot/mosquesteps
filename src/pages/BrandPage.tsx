import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Copy, Check, Download, Palette, Type, MousePointerClick,
  Users, ThumbsUp, ThumbsDown, Sparkles, Lightbulb, Map, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import logo from "@/assets/logo.png?w=256&format=webp";
import logoFull from "@/assets/logo.png";
import {
  brandColors, brandFonts, brandButtons, brandIcons,
  brandPersonas, brandDos, brandDonts, aiPrompts, marketingIdeas, appRoutes,
} from "@/lib/brand-data";

function hslToHex(hsl: string): string {
  const parts = hsl.split(" ");
  if (parts.length < 3) return "#000";
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const a2 = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a2 * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

const CopyButton = ({ text, label }: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
      title={`Copy ${label || text}`}
    >
      {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : (label || text)}
    </button>
  );
};

const Section = ({ id, icon: Icon, title, children }: { id: string; icon: any; title: string; children: React.ReactNode }) => (
  <motion.section
    id={id}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="space-y-4"
  >
    <h2 className="text-xl font-bold text-foreground flex items-center gap-2 sticky top-14 bg-background/95 backdrop-blur-sm py-2 z-10">
      <Icon className="w-5 h-5 text-primary" /> {title}
    </h2>
    {children}
  </motion.section>
);

const BrandPage = () => {
  const [colorFormat, setColorFormat] = useState<"hex" | "rgb" | "hsl">("hex");

  const sections = [
    { id: "colors", label: "Colors" },
    { id: "typography", label: "Typography" },
    { id: "buttons", label: "Buttons" },
    { id: "icons", label: "Iconography" },
    { id: "routes", label: "Routes" },
    { id: "personas", label: "Personas" },
    { id: "dos-donts", label: "Do's & Don'ts" },
    { id: "ai-prompts", label: "AI Prompts" },
    { id: "marketing", label: "Marketing" },
    { id: "downloads", label: "Downloads" },
  ];

  const getColorValue = (c: typeof brandColors[0]) => {
    if (colorFormat === "hex") return c.hex;
    if (colorFormat === "rgb") return `rgb(${c.rgb})`;
    return `hsl(${c.lightHSL})`;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Brand Guidelines & Assets — MosqueSteps"
        description="MosqueSteps brand guidelines: colors, typography, iconography, tone of voice, target personas, AI prompts for content generation, and downloadable assets."
        path="/brand"
      />

      {/* Header */}
      <header className="bg-gradient-teal text-primary-foreground">
        <div className="container py-4 flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 text-primary-foreground">
            <ArrowLeft className="w-5 h-5" />
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
          </Link>
          <span className="font-bold">Brand Guidelines</span>
        </div>
        <div className="container pb-8 text-center">
          <Palette className="w-10 h-10 mx-auto mb-2" />
          <h1 className="text-2xl font-bold">MosqueSteps Brand Kit</h1>
          <p className="text-sm text-primary-foreground/70 mt-2 max-w-lg mx-auto">
            Everything you need to represent MosqueSteps — colors, typography, tone, personas, AI content prompts, and downloadable assets.
          </p>
        </div>
      </header>

      {/* Sticky nav */}
      <nav className="sticky top-0 z-30 bg-card/90 backdrop-blur-lg border-b border-border overflow-x-auto">
        <div className="container flex gap-1 py-2">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="container py-8 space-y-12 max-w-3xl">

        {/* ===== COLORS ===== */}
        <Section id="colors" icon={Palette} title="Color Palette">
          <div className="flex gap-2 mb-4">
            {(["hex", "rgb", "hsl"] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setColorFormat(fmt)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  colorFormat === fmt ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10"
                }`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {brandColors.map((c) => (
              <div key={c.name} className="glass-card overflow-hidden">
                <div className="h-16 flex">
                  <div className="flex-1" style={{ background: `hsl(${c.lightHSL})` }} />
                  <div className="flex-1" style={{ background: `hsl(${c.darkHSL})` }} />
                </div>
                <div className="p-3 space-y-1">
                  <p className="font-semibold text-sm text-foreground">{c.name}</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">{getColorValue(c)}</code>
                    <CopyButton text={getColorValue(c)} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Token: <CopyButton text={`var(${c.token})`} label={c.token} /></p>
                  <p className="text-[10px] text-muted-foreground">{c.usage}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Gradients */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Gradients</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: "Teal Gradient", class: "bg-gradient-teal", css: "linear-gradient(135deg, hsl(174 80% 26%), hsl(174 80% 18%))" },
                { name: "Gold Gradient", class: "bg-gradient-gold", css: "linear-gradient(135deg, hsl(39 95% 55%), hsl(39 95% 40%))" },
                { name: "Hero Gradient", class: "bg-gradient-hero", css: "linear-gradient(180deg, hsl(174 40% 92%), hsl(42 100% 97%))" },
              ].map((g) => (
                <div key={g.name} className="glass-card overflow-hidden">
                  <div className={`h-12 ${g.class}`} />
                  <div className="p-2">
                    <p className="text-xs font-medium text-foreground">{g.name}</p>
                    <CopyButton text={g.css} label="Copy CSS" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ===== TYPOGRAPHY ===== */}
        <Section id="typography" icon={Type} title="Typography">
          {brandFonts.map((font) => (
            <div key={font.name} className="glass-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">{font.name}</h3>
                <CopyButton text={font.css} label="Copy font-family" />
              </div>
              <p className="text-xs text-muted-foreground">{font.usage}</p>
              <div className="flex flex-wrap gap-2">
                {font.weights.map((w) => (
                  <span key={w} className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{w}</span>
                ))}
              </div>
              <div className={`p-4 bg-muted/50 rounded-lg ${font.name === "Amiri" ? "font-arabic text-2xl text-right" : ""}`}>
                <p className={font.name === "Amiri" ? "font-arabic text-xl" : "text-lg font-semibold text-foreground"}>
                  {font.sample}
                </p>
                {font.name !== "Amiri" && (
                  <div className="mt-2 space-y-1">
                    <p className="text-3xl font-extrabold text-foreground">Heading — ExtraBold 800</p>
                    <p className="text-xl font-bold text-foreground">Subheading — Bold 700</p>
                    <p className="text-base font-medium text-foreground">Body — Medium 500</p>
                    <p className="text-sm text-muted-foreground">Caption — Regular 400</p>
                    <p className="text-xs font-light text-muted-foreground">Small — Light 300</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </Section>

        {/* ===== BUTTONS ===== */}
        <Section id="buttons" icon={MousePointerClick} title="Button Variants">
          <div className="glass-card p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {brandButtons.map((b) => (
                <div key={b.variant} className="flex items-center gap-3">
                  <Button variant={b.variant as any} size="sm">{b.label}</Button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{b.description}</p>
                    <CopyButton text={`variant="${b.variant}"`} label={b.variant} />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">
                <strong>Sizes:</strong> <code className="bg-muted px-1 rounded">sm</code> <code className="bg-muted px-1 rounded">default</code> <code className="bg-muted px-1 rounded">lg</code> <code className="bg-muted px-1 rounded">icon</code>
              </p>
            </div>
          </div>
        </Section>

        {/* ===== ICONOGRAPHY ===== */}
        <Section id="icons" icon={Sparkles} title="Iconography">
          <p className="text-sm text-muted-foreground">
            Icons from <a href="https://lucide.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Lucide React</a> + emoji for Islamic features.
          </p>
          <div className="space-y-3">
            {brandIcons.map((group) => (
              <div key={group.name} className="glass-card p-4">
                <p className="text-sm font-semibold text-foreground mb-2">{group.name}</p>
                <div className="flex flex-wrap gap-3 mb-2">
                  {group.icons.map((icon) => (
                    <div key={icon} className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg" title={icon}>
                      {icon.length <= 2 ? icon : <span className="text-xs text-muted-foreground font-mono">{icon.slice(0, 3)}</span>}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{group.usage}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ===== APP ROUTES ===== */}
        <Section id="routes" icon={Map} title="App Routes">
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-semibold text-foreground">Path</th>
                    <th className="text-left p-3 font-semibold text-foreground">Page</th>
                    <th className="text-left p-3 font-semibold text-foreground hidden sm:table-cell">Description</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {appRoutes.map((r) => (
                    <tr key={r.path} className="border-t border-border/50">
                      <td className="p-3">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-primary">{r.path}</code>
                      </td>
                      <td className="p-3 text-foreground font-medium">{r.label}</td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">{r.description}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <CopyButton text={r.path} label="" />
                          <Link to={r.path} className="text-primary hover:underline">
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* ===== PERSONAS ===== */}
        <Section id="personas" icon={Users} title="Target Personas">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {brandPersonas.map((p) => (
              <div key={p.name} className="glass-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{p.emoji}</span>
                  <h3 className="font-bold text-foreground">{p.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{p.description}</p>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">Key Needs:</p>
                  <ul className="space-y-1">
                    {p.needs.map((n) => (
                      <li key={n} className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> {n}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ===== DO'S & DON'TS ===== */}
        <Section id="dos-donts" icon={ThumbsUp} title="Brand Do's & Don'ts">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-5 space-y-3">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" /> Do's ✅
              </h3>
              <ul className="space-y-2">
                {brandDos.map((d, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card p-5 space-y-3">
              <h3 className="font-bold text-destructive flex items-center gap-2">
                <ThumbsDown className="w-4 h-4" /> Don'ts ❌
              </h3>
              <ul className="space-y-2">
                {brandDonts.map((d, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-destructive font-bold mt-0.5">✕</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* ===== AI PROMPTS ===== */}
        <Section id="ai-prompts" icon={Sparkles} title="AI Content Prompts">
          <p className="text-sm text-muted-foreground">
            Copy these prompts to generate on-brand content with any AI tool (ChatGPT, Claude, Gemini, etc.).
          </p>
          <div className="space-y-4">
            {aiPrompts.map((ap) => (
              <div key={ap.category} className="glass-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">{ap.category}</h3>
                  <CopyButton text={ap.prompt} label="Copy prompt" />
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
                  {ap.prompt}
                </div>
                <p className="text-xs text-muted-foreground italic">
                  <span className="font-semibold">Example:</span> {ap.example}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* ===== MARKETING IDEAS ===== */}
        <Section id="marketing" icon={Lightbulb} title="Marketing Ideas">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {marketingIdeas.map((idea) => (
              <div key={idea.title} className="glass-card p-5 space-y-2">
                <h3 className="font-bold text-foreground text-sm">{idea.title}</h3>
                <p className="text-xs text-muted-foreground">{idea.description}</p>
                <span className="inline-block text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                  {idea.channel}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* ===== DOWNLOADS ===== */}
        <Section id="downloads" icon={Download} title="Download Assets">
          <div className="glass-card p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <img src={logo} alt="MosqueSteps Logo" className="w-16 h-16 rounded-xl" />
                <div>
                  <p className="font-semibold text-foreground text-sm">Logo (PNG)</p>
                  <p className="text-xs text-muted-foreground mb-2">192×192px, transparent background</p>
                  <a href={logoFull} download="mosquesteps-logo.png">
                    <Button size="sm" variant="outline">
                      <Download className="w-3 h-3 mr-1" /> Download
                    </Button>
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="w-16 h-16 rounded-xl bg-gradient-teal flex items-center justify-center">
                  <img src="/favicon.png" alt="Favicon" className="w-10 h-10" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Favicon (PNG)</p>
                  <p className="text-xs text-muted-foreground mb-2">Square, web-optimized</p>
                  <a href="/favicon.png" download="mosquesteps-favicon.png">
                    <Button size="sm" variant="outline">
                      <Download className="w-3 h-3 mr-1" /> Download
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Color Palette Export</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const css = brandColors.map((c) => `  ${c.token}: ${c.lightHSL};`).join("\n");
                    navigator.clipboard.writeText(`:root {\n${css}\n}`);
                  }}
                >
                  <Copy className="w-3 h-3 mr-1" /> Copy CSS Variables
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const json = JSON.stringify(
                      brandColors.reduce((acc, c) => ({ ...acc, [c.name]: { hex: c.hex, rgb: c.rgb, hsl: c.lightHSL } }), {}),
                      null, 2
                    );
                    navigator.clipboard.writeText(json);
                  }}
                >
                  <Copy className="w-3 h-3 mr-1" /> Copy as JSON
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const scss = brandColors.map((c) => `$${c.name.toLowerCase().replace(/\s+/g, "-")}: ${c.hex};`).join("\n");
                    navigator.clipboard.writeText(scss);
                  }}
                >
                  <Copy className="w-3 h-3 mr-1" /> Copy as SCSS
                </Button>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Brand Guidelines</h3>
              <div className="flex flex-wrap gap-2">
                <Link to="/brand">
                  <Button size="sm" variant="outline">
                    <ExternalLink className="w-3 h-3 mr-1" /> Share Brand Page
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                >
                  <Copy className="w-3 h-3 mr-1" /> Copy URL
                </Button>
              </div>
            </div>
          </div>
        </Section>

        {/* Footer nav */}
        <div className="text-center pt-4 pb-8">
          <Link to="/" className="text-sm text-primary hover:underline">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default BrandPage;

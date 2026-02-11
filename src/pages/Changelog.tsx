import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, Sparkles, Bug, FileText, Zap, Accessibility, Wrench, Filter, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEOHead from "@/components/SEOHead";
import {
  changelogEntries,
  changelogTypes,
  changelogVersions,
  filterChangelogEntries,
  getChangelogSchema,
  type ChangelogEntry,
  type ChangelogType,
} from "@/lib/changelog-data";
import logo from "@/assets/logo.png";

const typeIcons: Record<ChangelogType, typeof Sparkles> = {
  feat: Sparkles,
  fix: Bug,
  docs: FileText,
  improvement: Zap,
  accessibility: Accessibility,
  technical: Wrench,
  privacy: Shield,
  seo: Globe,
};

function parseSearchParams(searchParams: URLSearchParams): {
  q: string;
  types: ChangelogType[];
  versions: string[];
} {
  const q = searchParams.get("q") ?? "";
  const typesParam = searchParams.get("type") ?? "";
  const types = typesParam ? (typesParam.split(",").filter(Boolean) as ChangelogType[]) : [];
  const versionsParam = searchParams.get("version") ?? "";
  const versions = versionsParam ? versionsParam.split(",").filter(Boolean) : [];
  return { q, types, versions };
}

function setSearchParams(
  searchParams: URLSearchParams,
  updates: { q?: string; types?: ChangelogType[]; versions?: string[] }
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  if (updates.q !== undefined) {
    if (updates.q) next.set("q", updates.q);
    else next.delete("q");
  }
  if (updates.types !== undefined) {
    if (updates.types.length) next.set("type", updates.types.join(","));
    else next.delete("type");
  }
  if (updates.versions !== undefined) {
    if (updates.versions.length) next.set("version", updates.versions.join(","));
    else next.delete("version");
  }
  return next;
}

export default function Changelog() {
  const [searchParams, setSearchParamsState] = useSearchParams();
  const { q: qParam, types: typesParam, versions: versionsParam } = parseSearchParams(searchParams);

  const [q, setQ] = useState(qParam);
  const [types, setTypes] = useState<ChangelogType[]>(typesParam);
  const [versions, setVersions] = useState<string[]>(versionsParam);

  // Sync URL -> state when user navigates back/forward
  useEffect(() => {
    const { q: qq, types: tt, versions: vv } = parseSearchParams(searchParams);
    setQ(qq);
    setTypes(tt);
    setVersions(vv);
  }, [searchParams]);

  const updateUrl = useCallback(
    (updates: { q?: string; types?: ChangelogType[]; versions?: string[] }) => {
      const next = setSearchParams(searchParams, {
        q: updates.q !== undefined ? updates.q : q,
        types: updates.types !== undefined ? updates.types : types,
        versions: updates.versions !== undefined ? updates.versions : versions,
      });
      setSearchParamsState(next, { replace: true });
    },
    [searchParams, q, types, versions, setSearchParamsState]
  );

  const filtered = useMemo(
    () => filterChangelogEntries(changelogEntries, { q: q || undefined, types: types.length ? types : undefined, versions: versions.length ? versions : undefined }),
    [q, types, versions]
  );

  const groupedByVersion = useMemo(() => {
    const map = new Map<string, ChangelogEntry[]>();
    for (const e of filtered) {
      const list = map.get(e.version) ?? [];
      list.push(e);
      map.set(e.version, list);
    }
    const order = ["Unreleased", "1.0.0"];
    return order.filter((v) => map.has(v)).map((v) => ({ version: v, entries: map.get(v)! }));
  }, [filtered]);

  const toggleType = (t: ChangelogType) => {
    const next = types.includes(t) ? types.filter((x) => x !== t) : [...types, t];
    setTypes(next);
    updateUrl({ types: next });
  };

  const toggleVersion = (v: string) => {
    const next = versions.includes(v) ? versions.filter((x) => x !== v) : [...versions, v];
    setVersions(next);
    updateUrl({ versions: next });
  };

  const handleSearch = (value: string) => {
    setQ(value);
    updateUrl({ q: value });
  };

  const clearFilters = () => {
    setQ("");
    setTypes([]);
    setVersions([]);
    setSearchParamsState(new URLSearchParams(), { replace: true });
  };

  const hasActiveFilters = q || types.length > 0 || versions.length > 0;

  // SEO: JSON-LD
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(getChangelogSchema(changelogEntries));
    script.id = "changelog-schema";
    const existing = document.getElementById("changelog-schema");
    if (existing) existing.remove();
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById("changelog-schema");
      if (el) el.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Changelog"
        description="See what’s new in MosqueSteps: features, fixes, and improvements. Search and filter by type and version. User-facing updates only."
        path="/changelog"
      />
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center h-14 gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="MosqueSteps" className="w-6 h-6" />
          </Link>
          <h1 className="font-semibold text-foreground">Changelog</h1>
        </div>
      </header>

      <main className="container max-w-3xl py-6 pb-24">
        <p className="text-sm text-muted-foreground mb-6">
          User-facing changes only. Search and filter below; your choices are reflected in the URL so you can share or bookmark a view.
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            placeholder="Search changelog…"
            value={q}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
            aria-label="Search changelog entries"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Type
          </span>
          {changelogTypes.map(({ value, label }) => {
            const Icon = typeIcons[value];
            const active = types.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleType(value)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                aria-pressed={active}
              >
                <Icon className="w-3 h-3" /> {label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-medium text-muted-foreground">Version</span>
          {changelogVersions.map((v) => {
            const active = versions.includes(v);
            return (
              <button
                key={v}
                type="button"
                onClick={() => toggleVersion(v)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                aria-pressed={active}
              >
                {v}
              </button>
            );
          })}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-primary font-medium hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-medium text-foreground">No entries match your filters</p>
            <p className="text-sm mt-1">Try a different search or clear filters.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedByVersion.map(({ version, entries }) => (
              <section key={version} aria-labelledby={`version-${version}`}>
                <h2 id={`version-${version}`} className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  {version === "Unreleased" ? "Unreleased" : `Version ${version}`}
                  <span className="text-xs font-normal text-muted-foreground">({entries.length})</span>
                </h2>
                <ul className="space-y-3 list-none p-0 m-0">
                  {entries.map((entry) => {
                    const Icon = typeIcons[entry.type];
                    return (
                      <li key={entry.id} className="glass-card p-4 rounded-lg">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-primary" aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground text-sm">{entry.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{entry.description}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {changelogTypes.find((t) => t.value === entry.type)?.label ?? entry.type}
                              </span>
                              {entry.area && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/70 text-muted-foreground capitalize">
                                  {entry.area}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-8 border-t border-border pt-6">
          For full release history and technical details, see the repository{" "}
          <a href="https://github.com/codingshot/mosquesteps/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            CHANGELOG.md
          </a>.
        </p>
      </main>
    </div>
  );
}

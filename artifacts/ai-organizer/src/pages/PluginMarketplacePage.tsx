/**
 * PluginMarketplacePage — GitHub Marketplace equivalent for research plugins
 * Features: browse plugins, categories, install/uninstall, ratings, featured plugins
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { PageShell } from "../components/layout/PageShell";
import { useIsMobile } from "../hooks/useMediaQuery";

// ─── Types ───────────────────────────────────────────────────
type PluginCategory = "analysis" | "export" | "visualization" | "integration" | "utility" | "ai" | "collaboration";
type SortMode = "popular" | "newest" | "rating" | "name";

interface MarketplacePlugin {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  author: string;
  authorAvatar: string;
  version: string;
  category: PluginCategory;
  icon: string;
  stars: number;
  downloads: number;
  rating: number;
  reviewCount: number;
  installed: boolean;
  enabled: boolean;
  verified: boolean;
  featured: boolean;
  tags: string[];
  permissions: string[];
  lastUpdated: number;
  createdAt: number;
  screenshots: string[];
  changelog: string;
}

// ─── Constants ───────────────────────────────────────────────
const STORAGE_KEY = "thinkspace-plugin-marketplace";

const CATEGORY_CONFIG: Record<PluginCategory, { icon: string; label: string; color: string }> = {
  analysis:      { icon: "📊", label: "Analysis",      color: "#6366f1" },
  export:        { icon: "📤", label: "Export",         color: "#22c55e" },
  visualization: { icon: "📈", label: "Visualization",  color: "#f59e0b" },
  integration:   { icon: "🔗", label: "Integration",    color: "#3b82f6" },
  utility:       { icon: "🔧", label: "Utility",        color: "#64748b" },
  ai:            { icon: "🤖", label: "AI & ML",        color: "#8b5cf6" },
  collaboration: { icon: "👥", label: "Collaboration",   color: "#ec4899" },
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

// ─── Sample Data ─────────────────────────────────────────────
function createSamplePlugins(): MarketplacePlugin[] {
  const now = Date.now();
  return [
    {
      id: generateId(), name: "Statistical Analysis Pro", description: "Advanced statistical tests, regression analysis, and hypothesis testing toolkit.",
      longDescription: "Comprehensive statistical analysis suite including t-tests, ANOVA, chi-square, regression (linear, logistic, polynomial), Bayesian inference, and effect size calculations. Integrates directly with your research data.",
      author: "StatLab Team", authorAvatar: "📊", version: "3.2.1", category: "analysis", icon: "📊",
      stars: 1245, downloads: 8934, rating: 4.8, reviewCount: 234, installed: true, enabled: true, verified: true, featured: true,
      tags: ["statistics", "regression", "hypothesis-testing", "ANOVA"], permissions: ["read-data", "compute"],
      lastUpdated: now - 86400000 * 3, createdAt: now - 86400000 * 365, screenshots: [], changelog: "v3.2.1: Added Bayesian inference module",
    },
    {
      id: generateId(), name: "LaTeX Export Suite", description: "Export your research documents, claims, and theories to publication-ready LaTeX.",
      longDescription: "Full LaTeX export with support for multiple journal templates (Nature, Science, IEEE, ACM, Springer). Includes BibTeX bibliography management, equation rendering, and figure placement optimization.",
      author: "Academic Tools", authorAvatar: "📝", version: "2.1.0", category: "export", icon: "📄",
      stars: 892, downloads: 5621, rating: 4.6, reviewCount: 178, installed: false, enabled: false, verified: true, featured: true,
      tags: ["LaTeX", "export", "publishing", "BibTeX"], permissions: ["read-data", "file-system"],
      lastUpdated: now - 86400000 * 7, createdAt: now - 86400000 * 200, screenshots: [], changelog: "v2.1.0: Added Nature template",
    },
    {
      id: generateId(), name: "Network Graph Visualizer", description: "Interactive network graphs for citation networks, co-authorship, and concept maps.",
      longDescription: "Create beautiful, interactive network visualizations. Supports force-directed layouts, hierarchical trees, circular layouts, and geographic mapping. Export to SVG, PNG, or interactive HTML.",
      author: "VizLab", authorAvatar: "🎨", version: "1.8.3", category: "visualization", icon: "🕸️",
      stars: 678, downloads: 3456, rating: 4.5, reviewCount: 89, installed: true, enabled: false, verified: true, featured: false,
      tags: ["graphs", "networks", "visualization", "citations"], permissions: ["read-data", "ui-render"],
      lastUpdated: now - 86400000 * 14, createdAt: now - 86400000 * 150, screenshots: [], changelog: "v1.8.3: Performance improvements for large graphs",
    },
    {
      id: generateId(), name: "Zotero Sync", description: "Two-way synchronization with your Zotero library for seamless reference management.",
      longDescription: "Keep your Think!Hub library in sync with Zotero. Import references, PDFs, and annotations. Export new findings back to Zotero collections. Supports Zotero groups for team collaboration.",
      author: "Integration Hub", authorAvatar: "🔗", version: "1.3.0", category: "integration", icon: "📚",
      stars: 1567, downloads: 12340, rating: 4.9, reviewCount: 456, installed: false, enabled: false, verified: true, featured: true,
      tags: ["Zotero", "references", "sync", "bibliography"], permissions: ["read-data", "write-data", "network"],
      lastUpdated: now - 86400000 * 2, createdAt: now - 86400000 * 300, screenshots: [], changelog: "v1.3.0: Added Zotero group support",
    },
    {
      id: generateId(), name: "AI Research Assistant", description: "GPT-powered research assistant for literature review, summarization, and hypothesis generation.",
      longDescription: "Leverage large language models to accelerate your research. Features include automated literature review, paper summarization, hypothesis generation, methodology suggestions, and writing assistance. Supports multiple AI providers.",
      author: "AI Research Co", authorAvatar: "🤖", version: "2.5.0", category: "ai", icon: "🧠",
      stars: 2345, downloads: 18900, rating: 4.7, reviewCount: 567, installed: true, enabled: true, verified: true, featured: true,
      tags: ["AI", "GPT", "literature-review", "summarization"], permissions: ["read-data", "network", "ai-compute"],
      lastUpdated: now - 86400000, createdAt: now - 86400000 * 180, screenshots: [], changelog: "v2.5.0: Added Claude and Gemini support",
    },
    {
      id: generateId(), name: "Markdown Toolkit", description: "Enhanced Markdown editing with live preview, templates, and academic extensions.",
      longDescription: "Supercharge your Markdown editing with academic extensions: footnotes, citations, cross-references, math equations (KaTeX), diagrams (Mermaid), and custom admonitions. Includes 20+ templates for common academic documents.",
      author: "DevTools Inc", authorAvatar: "⌨️", version: "1.5.2", category: "utility", icon: "📝",
      stars: 456, downloads: 2890, rating: 4.4, reviewCount: 67, installed: false, enabled: false, verified: false, featured: false,
      tags: ["markdown", "editing", "templates", "KaTeX"], permissions: ["read-data", "ui-render"],
      lastUpdated: now - 86400000 * 21, createdAt: now - 86400000 * 120, screenshots: [], changelog: "v1.5.2: Added Mermaid diagram support",
    },
    {
      id: generateId(), name: "Team Analytics Dashboard", description: "Track team productivity, contribution metrics, and collaboration patterns.",
      longDescription: "Comprehensive analytics for research teams. Track individual contributions, collaboration patterns, review turnaround times, and project velocity. Includes customizable dashboards and automated reports.",
      author: "CollabMetrics", authorAvatar: "📈", version: "1.2.0", category: "collaboration", icon: "👥",
      stars: 345, downloads: 1890, rating: 4.3, reviewCount: 45, installed: false, enabled: false, verified: true, featured: false,
      tags: ["analytics", "team", "productivity", "metrics"], permissions: ["read-data", "team-data"],
      lastUpdated: now - 86400000 * 10, createdAt: now - 86400000 * 90, screenshots: [], changelog: "v1.2.0: Added burndown charts",
    },
    {
      id: generateId(), name: "Semantic Search Engine", description: "AI-powered semantic search across all your documents, claims, and evidence.",
      longDescription: "Go beyond keyword search with vector embeddings and semantic understanding. Find related concepts, similar claims, and connected evidence across your entire research corpus. Supports natural language queries.",
      author: "SearchAI Labs", authorAvatar: "🔍", version: "2.0.1", category: "ai", icon: "🔍",
      stars: 789, downloads: 4567, rating: 4.6, reviewCount: 123, installed: true, enabled: true, verified: true, featured: false,
      tags: ["search", "semantic", "AI", "embeddings"], permissions: ["read-data", "ai-compute"],
      lastUpdated: now - 86400000 * 5, createdAt: now - 86400000 * 240, screenshots: [], changelog: "v2.0.1: Improved relevance ranking",
    },
    {
      id: generateId(), name: "Data Visualization Pack", description: "30+ chart types for scientific data visualization with interactive features.",
      longDescription: "Create publication-quality charts and figures. Includes scatter plots, heatmaps, violin plots, radar charts, Sankey diagrams, and more. All charts are interactive with zoom, pan, and tooltip support. Export to SVG, PNG, or PDF.",
      author: "ChartMaster", authorAvatar: "📊", version: "3.0.0", category: "visualization", icon: "📈",
      stars: 1023, downloads: 7890, rating: 4.7, reviewCount: 234, installed: false, enabled: false, verified: true, featured: true,
      tags: ["charts", "visualization", "data", "figures"], permissions: ["read-data", "ui-render"],
      lastUpdated: now - 86400000 * 4, createdAt: now - 86400000 * 280, screenshots: [], changelog: "v3.0.0: Major redesign with 10 new chart types",
    },
    {
      id: generateId(), name: "ORCID Integration", description: "Link your ORCID profile and automatically sync publications and affiliations.",
      longDescription: "Connect your ORCID iD to automatically import your publication history, affiliations, and funding information. Keep your Think!Hub profile synchronized with your ORCID record.",
      author: "Academic ID", authorAvatar: "🆔", version: "1.1.0", category: "integration", icon: "🔗",
      stars: 567, downloads: 3210, rating: 4.5, reviewCount: 89, installed: false, enabled: false, verified: true, featured: false,
      tags: ["ORCID", "profile", "publications", "identity"], permissions: ["read-data", "write-data", "network"],
      lastUpdated: now - 86400000 * 8, createdAt: now - 86400000 * 160, screenshots: [], changelog: "v1.1.0: Added automatic publication sync",
    },
  ];
}

function loadPlugins(): MarketplacePlugin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return createSamplePlugins();
}

function savePlugins(plugins: MarketplacePlugin[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(plugins)); } catch { /* ignore */ }
}

// ─── Component ───────────────────────────────────────────────
export default function PluginMarketplacePage() {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const accent = "hsl(var(--primary))";
  const textColor = 'hsl(var(--foreground))';
  const bgColor = 'hsl(var(--background))';

  const [plugins, setPlugins] = useState<MarketplacePlugin[]>(loadPlugins);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<PluginCategory | "all">("all");
  const [filterInstalled, setFilterInstalled] = useState<"all" | "installed" | "available">("all");
  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);

  useEffect(() => { savePlugins(plugins); }, [plugins]);

  // ─── Handlers ──────────────────────────────────────────
  const handleInstall = useCallback((pluginId: string) => {
    setPlugins((prev) => prev.map((p) => p.id === pluginId ? { ...p, installed: true, enabled: true, downloads: p.downloads + 1 } : p));
  }, []);

  const handleUninstall = useCallback((pluginId: string) => {
    setPlugins((prev) => prev.map((p) => p.id === pluginId ? { ...p, installed: false, enabled: false } : p));
  }, []);

  const handleToggleEnabled = useCallback((pluginId: string) => {
    setPlugins((prev) => prev.map((p) => p.id === pluginId ? { ...p, enabled: !p.enabled } : p));
  }, []);

  // ─── Filtered & Sorted ────────────────────────────────
  const filteredPlugins = useMemo(() => {
    let result = [...plugins];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)));
    }
    if (filterCategory !== "all") result = result.filter((p) => p.category === filterCategory);
    if (filterInstalled === "installed") result = result.filter((p) => p.installed);
    if (filterInstalled === "available") result = result.filter((p) => !p.installed);

    switch (sortMode) {
      case "popular": result.sort((a, b) => b.downloads - a.downloads); break;
      case "newest": result.sort((a, b) => b.createdAt - a.createdAt); break;
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return result;
  }, [plugins, searchQuery, filterCategory, filterInstalled, sortMode]);

  const featuredPlugins = useMemo(() => plugins.filter((p) => p.featured), [plugins]);
  const selectedPluginData = useMemo(() => plugins.find((p) => p.id === selectedPlugin), [plugins, selectedPlugin]);

  const stats = useMemo(() => ({
    total: plugins.length,
    installed: plugins.filter((p) => p.installed).length,
    enabled: plugins.filter((p) => p.enabled).length,
    verified: plugins.filter((p) => p.verified).length,
  }), [plugins]);

  // ─── Styles ────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
    borderRadius: "10px", padding: "20px", transition: "all 0.2s", cursor: "pointer",
  };

  const btnStyle = (primary = false): React.CSSProperties => ({
    padding: "8px 16px", borderRadius: "10px", border: primary ? "none" : "1px solid hsl(var(--border))",
    background: primary ? 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' : "hsl(var(--muted) / 0.4)", color: primary ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
    cursor: "pointer", fontSize: "13px", fontWeight: 600,
  });

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: "5px 12px", borderRadius: "20px",
    border: `1px solid ${active ? 'hsl(var(--primary))' : "hsl(var(--border))"}`,
    background: active ? 'hsl(var(--primary) / 0.1)' : "transparent",
    color: active ? 'hsl(var(--primary))' : "hsl(var(--muted-foreground))",
    cursor: "pointer", fontSize: "12px", fontWeight: 500,
  });

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: "10px",
    border: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.4)",
    color: textColor, fontSize: "14px", outline: "none", boxSizing: "border-box",
  };

  const formatNumber = (n: number): string => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    return (
      <span style={{ fontSize: "12px", color: "#f59e0b" }}>
        {"★".repeat(full)}{half ? "½" : ""}{"☆".repeat(5 - full - (half ? 1 : 0))}
        <span style={{ color: "hsl(var(--muted-foreground))", marginLeft: "4px" }}>{rating.toFixed(1)}</span>
      </span>
    );
  };

  // ─── Plugin Detail Modal ───────────────────────────────
  if (selectedPluginData) {
    const catConf = CATEGORY_CONFIG[selectedPluginData.category];
    return (
    <div style={{ minHeight: "100vh", background: bgColor, color: textColor, padding: isMobile ? "16px 12px" : "32px 24px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <button onClick={() => setSelectedPlugin(null)} style={{ ...btnStyle(), marginBottom: "20px" }}>
            ← {t("common.back") || "Back"}
          </button>

          <div style={cardStyle}>
            {/* Header */}
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "20px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: `${catConf.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", flexShrink: 0 }}>
                {selectedPluginData.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <h2 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>{selectedPluginData.name}</h2>
                  {selectedPluginData.verified && <span style={{ fontSize: "14px" }} title="Verified">✅</span>}
                </div>
                <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "13px" }}>
                  {selectedPluginData.authorAvatar} {selectedPluginData.author} · v{selectedPluginData.version}
                </div>
                <div style={{ marginTop: "6px" }}>{renderStars(selectedPluginData.rating)} ({selectedPluginData.reviewCount} reviews)</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {selectedPluginData.installed ? (
                  <>
                    <button onClick={() => handleToggleEnabled(selectedPluginData.id)} style={btnStyle(selectedPluginData.enabled)}>
                      {selectedPluginData.enabled ? "✅ Enabled" : "⏸ Disabled"}
                    </button>
                    <button onClick={() => handleUninstall(selectedPluginData.id)} style={{ ...btnStyle(), color: "#ef4444", borderColor: "#ef444444" }}>
                      🗑 {t("marketplace.uninstall")}
                    </button>
                  </>
                ) : (
                  <button onClick={() => handleInstall(selectedPluginData.id)} style={btnStyle(true)}>
                    📥 {t("marketplace.install")}
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "12px", marginBottom: "20px", padding: "14px", background: "hsl(var(--muted) / 0.3)", borderRadius: "10px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: "18px" }}>{formatNumber(selectedPluginData.downloads)}</div>
                <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>{t("marketplace.downloads")}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: "18px" }}>⭐ {selectedPluginData.stars}</div>
                <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>{t("marketplace.stars")}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: "18px" }}>{selectedPluginData.rating.toFixed(1)}</div>
                <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>{t("marketplace.rating")}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: "18px" }}>{selectedPluginData.reviewCount}</div>
                <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>{t("marketplace.reviews")}</div>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>{t("common.description")}</h3>
              <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "14px", lineHeight: 1.7 }}>{selectedPluginData.longDescription}</p>
            </div>

            {/* Tags */}
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>{t("marketplace.tags")}</h3>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {selectedPluginData.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: "12px", color: accent, background: `${accent}15`, padding: "3px 10px", borderRadius: "10px", border: `1px solid ${accent}30` }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>{t("marketplace.permissions")}</h3>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {selectedPluginData.permissions.map((perm) => (
                  <span key={perm} style={{ fontSize: "12px", color: "#f59e0b", background: "#f59e0b15", padding: "3px 10px", borderRadius: "10px", border: "1px solid #f59e0b30" }}>
                    🔐 {perm}
                  </span>
                ))}
              </div>
            </div>

            {/* Changelog */}
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>{t("marketplace.changelog")}</h3>
              <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "13px" }}>{selectedPluginData.changelog}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main View ─────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: bgColor, color: textColor, padding: isMobile ? "16px 12px" : "32px 24px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>🧩 {t("marketplace.title")}</h1>
          <p style={{ color: "hsl(var(--muted-foreground))", margin: "8px 0 0", fontSize: "15px" }}>{t("marketplace.subtitle")}</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: t("marketplace.totalPlugins"), value: stats.total, icon: "🧩" },
            { label: t("marketplace.installed"), value: stats.installed, icon: "📥" },
            { label: t("marketplace.enabled"), value: stats.enabled, icon: "✅" },
            { label: t("marketplace.verified"), value: stats.verified, icon: "🛡️" },
          ].map((stat) => (
            <div key={stat.label} style={{ ...cardStyle, textAlign: "center", cursor: "default" }}>
              <div style={{ fontSize: "20px", marginBottom: "4px" }}>{stat.icon}</div>
              <div style={{ fontSize: "20px", fontWeight: 700 }}>{stat.value}</div>
              <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Featured */}
        {featuredPlugins.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "14px" }}>⭐ {t("marketplace.featured")}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {featuredPlugins.map((plugin) => {
                const catConf = CATEGORY_CONFIG[plugin.category];
                return (
                  <div key={plugin.id} onClick={() => setSelectedPlugin(plugin.id)} style={{ ...cardStyle, borderTop: `3px solid ${catConf.color}` }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontSize: "28px" }}>{plugin.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "14px" }}>
                          {plugin.name} {plugin.verified && "✅"}
                        </div>
                        <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "11px" }}>{plugin.author} · v{plugin.version}</div>
                      </div>
                    </div>
                    <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "12px", margin: "0 0 10px", lineHeight: 1.4 }}>{plugin.description}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {renderStars(plugin.rating)}
                      <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>📥 {formatNumber(plugin.downloads)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search + Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("marketplace.searchPlaceholder")} style={{ ...inputStyle, maxWidth: "300px" }} />
          <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} style={{ ...inputStyle, maxWidth: "150px", padding: "8px 10px" }}>
            <option value="popular">{t("marketplace.sortPopular")}</option>
            <option value="newest">{t("marketplace.sortNewest")}</option>
            <option value="rating">{t("marketplace.sortRating")}</option>
            <option value="name">{t("marketplace.sortName")}</option>
          </select>
          <div style={{ display: "flex", gap: "6px" }}>
            {(["all", "installed", "available"] as const).map((f) => (
              <button key={f} onClick={() => setFilterInstalled(f)} style={pillStyle(filterInstalled === f)}>
                {f === "all" ? t("common.all") : f === "installed" ? t("marketplace.installed") : t("marketplace.available")}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
          <button onClick={() => setFilterCategory("all")} style={pillStyle(filterCategory === "all")}>{t("common.all")}</button>
          {(Object.keys(CATEGORY_CONFIG) as PluginCategory[]).map((cat) => (
            <button key={cat} onClick={() => setFilterCategory(cat)} style={pillStyle(filterCategory === cat)}>
              {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
            </button>
          ))}
        </div>

        {/* Plugin Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
          {filteredPlugins.map((plugin) => {
            const catConf = CATEGORY_CONFIG[plugin.category];
            return (
              <div key={plugin.id} onClick={() => setSelectedPlugin(plugin.id)} style={cardStyle}>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${catConf.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
                    {plugin.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontWeight: 600, fontSize: "14px" }}>{plugin.name}</span>
                      {plugin.verified && <span style={{ fontSize: "12px" }}>✅</span>}
                      {plugin.installed && (
                        <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "8px", background: plugin.enabled ? "#22c55e22" : "#f59e0b22", color: plugin.enabled ? "#22c55e" : "#f59e0b", border: `1px solid ${plugin.enabled ? "#22c55e44" : "#f59e0b44"}` }}>
                          {plugin.enabled ? "Active" : "Paused"}
                        </span>
                      )}
                    </div>
                    <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "11px" }}>{plugin.author} · v{plugin.version}</div>
                  </div>
                </div>
                <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "12px", margin: "0 0 10px", lineHeight: 1.4 }}>{plugin.description}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    {renderStars(plugin.rating)}
                    <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>📥 {formatNumber(plugin.downloads)}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: catConf.color, background: `${catConf.color}15`, padding: "2px 8px", borderRadius: "10px" }}>
                    {catConf.icon} {catConf.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredPlugins.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "hsl(var(--muted-foreground))" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🧩</div>
            <p style={{ fontWeight: 600 }}>{t("marketplace.noPlugins")}</p>
            <p style={{ fontSize: "13px" }}>{t("marketplace.noPluginsHint")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

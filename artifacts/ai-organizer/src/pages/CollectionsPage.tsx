/**
 * CollectionsPage — Research Collections / Reading Lists
 * Pinterest-style curated collections of documents and segments
 */
import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useUserData } from "../context/UserDataContext";
import { PageShell } from "../components/layout/PageShell";
import { useMediaQuery } from "../hooks/useMediaQuery";

interface CollectionItem {
  id: string;
  type: "document" | "segment";
  title: string;
  preview?: string;
  addedAt: number;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  visibility: "private" | "team" | "public";
  items: CollectionItem[];
  createdAt: number;
  updatedAt: number;
  color: string;
}

const COLLECTION_COLORS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#10b981,#059669)",
  "linear-gradient(135deg,#f59e0b,#d97706)",
  "linear-gradient(135deg,#ef4444,#dc2626)",
  "linear-gradient(135deg,#06b6d4,#0891b2)",
  "linear-gradient(135deg,#ec4899,#db2777)",
];

const VISIBILITY_CONFIG = {
  private: { icon: "🔒", labelKey: "collections.visibility.private", label: "Private", color: "#94a3b8" },
  team: { icon: "👥", labelKey: "collections.visibility.team", label: "Team", color: "#6366f1" },
  public: { icon: "🌐", labelKey: "collections.visibility.public", label: "Public", color: "#10b981" },
};

function loadCollections(): Collection[] {
  try {
    const raw = localStorage.getItem("research-collections");
    if (!raw) return [];
    return JSON.parse(raw).map((c: Collection) => ({ ...c }));
  } catch { return []; }
}

function saveCollections(cols: Collection[]) {
  try { localStorage.setItem("research-collections", JSON.stringify(cols)); } catch {}
}

export default function CollectionsPage() {
  const nav = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const colors = { textPrimary: 'hsl(var(--foreground))', textSecondary: 'hsl(var(--muted-foreground))', textMuted: 'hsl(var(--muted-foreground))', borderPrimary: 'hsl(var(--border))', bgInput: 'hsl(var(--muted) / 0.4)' };
  const isDark = false;
  const { t } = useLanguage();
  const { addActivity, refreshStats } = useUserData();

  const [collections, setCollections] = useState<Collection[]>(() => {
    const stored = loadCollections();
    if (stored.length > 0) return stored;
    // Sample collections for demo
    return [
      {
        id: "col-1",
        name: "Cognitive Science Essentials",
        description: "Key papers and segments on cognitive load theory and working memory",
        visibility: "team",
        color: COLLECTION_COLORS[0],
        items: [
          { id: "i-1", type: "document", title: "Working Memory and Cognitive Load", addedAt: Date.now() - 86400000 * 3 },
          { id: "i-2", type: "segment", title: "Neural correlates of attention", preview: "Recent fMRI studies show...", addedAt: Date.now() - 86400000 },
        ],
        createdAt: Date.now() - 86400000 * 7,
        updatedAt: Date.now() - 86400000,
      },
      {
        id: "col-2",
        name: "Methodology Toolkit",
        description: "Research methodology references and best practices",
        visibility: "private",
        color: COLLECTION_COLORS[1],
        items: [
          { id: "i-3", type: "document", title: "Qualitative Research Methods", addedAt: Date.now() - 86400000 * 2 },
        ],
        createdAt: Date.now() - 86400000 * 14,
        updatedAt: Date.now() - 86400000 * 2,
      },
    ];
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newVisibility, setNewVisibility] = useState<"private" | "team" | "public">("private");
  const [newColor, setNewColor] = useState(COLLECTION_COLORS[0]);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [filterVisibility, setFilterVisibility] = useState<"all" | "private" | "team" | "public">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<"updated" | "name" | "size">("updated");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editVisibility, setEditVisibility] = useState<"private" | "team" | "public">("private");
  const [editColor, setEditColor] = useState(COLLECTION_COLORS[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts: N = new collection, Escape = close panels
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setShowCreate(true); }
      if (e.key === "Escape") { setShowCreate(false); setActiveCollection(null); setConfirmDeleteId(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (showCreate) setTimeout(() => nameInputRef.current?.focus(), 60);
  }, [showCreate]);

  const filtered = useMemo(() => {
    let list = collections.filter(c => {
      const matchesVis = filterVisibility === "all" || c.visibility === filterVisibility;
      const matchesSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesVis && matchesSearch;
    });
    return [...list].sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name);
      if (sortMode === "size") return b.items.length - a.items.length;
      return b.updatedAt - a.updatedAt;
    });
  }, [collections, filterVisibility, searchQuery, sortMode]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const col: Collection = {
      id: `col-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim(),
      visibility: newVisibility,
      color: newColor,
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [col, ...collections];
    setCollections(updated);
    saveCollections(updated);
    addActivity({ type: "collection", title: `Created collection: ${col.name}`, description: col.description });
    refreshStats();
    setNewName(""); setNewDesc(""); setNewVisibility("private"); setShowCreate(false);
  };

  const handleDelete = (id: string) => {
    const updated = collections.filter(c => c.id !== id);
    setCollections(updated);
    saveCollections(updated);
    refreshStats();
    if (activeCollection === id) setActiveCollection(null);
    setConfirmDeleteId(null);
  };

  const handleToggleVisibility = (id: string) => {
    const order: Array<"private" | "team" | "public"> = ["private", "team", "public"];
    const updated = collections.map(c => {
      if (c.id !== id) return c;
      const next = order[(order.indexOf(c.visibility) + 1) % order.length];
      return { ...c, visibility: next, updatedAt: Date.now() };
    });
    setCollections(updated);
    saveCollections(updated);
  };

  const startEdit = (col: Collection) => {
    setEditingId(col.id);
    setEditName(col.name);
    setEditDesc(col.description);
    setEditVisibility(col.visibility);
    setEditColor(col.color);
  };

  const handleSaveEdit = () => {
    if (!editName.trim() || !editingId) return;
    const updated = collections.map(c =>
      c.id === editingId ? { ...c, name: editName.trim(), description: editDesc.trim(), visibility: editVisibility, color: editColor, updatedAt: Date.now() } : c
    );
    setCollections(updated);
    saveCollections(updated);
    setEditingId(null);
  };

  const handleRemoveItem = (colId: string, itemId: string) => {
    const updated = collections.map(c =>
      c.id === colId ? { ...c, items: c.items.filter(i => i.id !== itemId), updatedAt: Date.now() } : c
    );
    setCollections(updated);
    saveCollections(updated);
  };

  const handleShare = (col: Collection) => {
    const url = `${window.location.origin}/collections?id=${col.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(col.id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
    if (col.visibility === "private") {
      const updated = collections.map(c => c.id === col.id ? { ...c, visibility: "public" as const, updatedAt: Date.now() } : c);
      setCollections(updated);
      saveCollections(updated);
    }
  };

  const cardStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "10px",
    overflow: "hidden" as const,
    transition: "all 0.2s ease",
    cursor: "pointer" as const,
  };

  const activeCol = collections.find(c => c.id === activeCollection);

  return (
    <PageShell>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: isMobile ? "16px 12px" : "32px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: colors.textPrimary }}>
              📂 {t("nav.collections") || "Collections"}
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: "14px", color: colors.textSecondary }}>
              {t("collections.subtitle") || "Curated reading lists and research collections"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: colors.textMuted, padding: "4px 8px", borderRadius: "6px", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: `1px solid ${colors.borderPrimary}` }}>Press <kbd style={{ fontFamily: "monospace", fontWeight: 700 }}>N</kbd> to create</span>
            <button
              onClick={() => setShowCreate(true)}
              style={{ padding: "10px 20px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}
            >
              + {t("collections.create") || "New Collection"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 200px" }}>
            <svg style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: colors.textMuted, pointerEvents: "none" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t("action.search") || "Search collections..."}
              style={{ width: "100%", padding: "9px 32px 9px 38px", borderRadius: "10px", border: `1px solid ${colors.borderPrimary}`, background: isDark ? "rgba(30,30,40,0.6)" : colors.bgInput, color: colors.textPrimary, fontSize: "13px", boxSizing: "border-box", outline: "none" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: "16px", lineHeight: 1 }}>×</button>
            )}
          </div>
          {(["all", "private", "team", "public"] as const).map(v => (
            <button
              key={v}
              onClick={() => setFilterVisibility(v)}
              style={{
                padding: "8px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                background: filterVisibility === v ? "rgba(99,102,241,0.2)" : "transparent",
                border: filterVisibility === v ? "1px solid rgba(99,102,241,0.4)" : `1px solid ${colors.borderPrimary}`,
                color: filterVisibility === v ? "#a5b4fc" : colors.textSecondary,
              }}
            >
              {v === "all" ? (t("common.all") || "All") : VISIBILITY_CONFIG[v].icon + " " + (t(VISIBILITY_CONFIG[v].labelKey) || VISIBILITY_CONFIG[v].label)}
            </button>
          ))}
          <select value={sortMode} onChange={e => setSortMode(e.target.value as "updated" | "name" | "size")} style={{ padding: "7px 12px", borderRadius: "9px", border: `1px solid ${colors.borderPrimary}`, background: isDark ? "rgba(30,30,40,0.7)" : colors.bgInput, color: colors.textPrimary, fontSize: "12px", cursor: "pointer", marginLeft: "auto" }}>
            <option value="updated">{t("collections.sort.updated") || "Recently Updated"}</option>
            <option value="name">{t("collections.sort.name") || "Name A–Z"}</option>
            <option value="size">{t("collections.sort.size") || "Most Items"}</option>
          </select>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div style={{ ...cardStyle, marginBottom: "24px", padding: "22px", border: "1px solid rgba(99,102,241,0.35)", background: isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.03)", cursor: "default" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: colors.textPrimary }}>🆕 {t("collections.createNew") || "Create New Collection"}</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: "20px", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input ref={nameInputRef} value={newName} onChange={e => setNewName(e.target.value)} placeholder={t("collections.namePlaceholder") || "Collection name..."} style={{ padding: "10px 14px", borderRadius: "10px", border: `1px solid ${colors.borderPrimary}`, background: isDark ? "rgba(30,30,40,0.6)" : colors.bgInput, color: colors.textPrimary, fontSize: "14px", outline: "none" }} onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setShowCreate(false); }} />
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder={t("collections.descPlaceholder") || "Description (optional)..."} rows={2} style={{ padding: "10px 14px", borderRadius: "10px", border: `1px solid ${colors.borderPrimary}`, background: isDark ? "rgba(30,30,40,0.6)" : colors.bgInput, color: colors.textPrimary, fontSize: "14px", resize: "vertical" }} />
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  {COLLECTION_COLORS.map(c => (
                    <button key={c} onClick={() => setNewColor(c)} style={{ width: "28px", height: "28px", borderRadius: "50%", background: c, border: newColor === c ? "3px solid #fff" : "2px solid transparent", cursor: "pointer", boxShadow: newColor === c ? "0 0 0 2px #6366f1" : "none" }} />
                  ))}
                </div>
                <select value={newVisibility} onChange={e => setNewVisibility(e.target.value as "private" | "team" | "public")} style={{ padding: "8px 12px", borderRadius: "8px", border: `1px solid ${colors.borderPrimary}`, background: isDark ? "rgba(30,30,40,0.6)" : colors.bgInput, color: colors.textPrimary, fontSize: "13px" }}>
                  <option value="private">🔒 Private</option>
                  <option value="team">👥 Team</option>
                  <option value="public">🌐 Public</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleCreate} disabled={!newName.trim()} style={{ padding: "8px 20px", background: newName.trim() ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px", color: newName.trim() ? "#fff" : colors.textMuted, fontWeight: 600, fontSize: "13px", cursor: newName.trim() ? "pointer" : "not-allowed" }}>
                  {t("action.create") || "Create"}
                </button>
                <button onClick={() => setShowCreate(false)} style={{ padding: "8px 20px", background: "transparent", border: `1px solid ${colors.borderPrimary}`, borderRadius: "8px", color: colors.textSecondary, fontSize: "13px", cursor: "pointer" }}>
                  {t("action.cancel") || "Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collections Grid + Detail Panel */}
        <div style={{ display: "grid", gridTemplateColumns: activeCollection && !isMobile ? "1fr 360px" : "1fr", gap: "20px" }}>
          {/* Grid */}
          <div>
            {filtered.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: "center", padding: "64px 24px", cursor: "default" }}>
                <div style={{ fontSize: "52px", marginBottom: "16px" }}>{searchQuery ? "🔍" : "📂"}</div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: colors.textPrimary, marginBottom: "8px" }}>
                  {searchQuery ? `${t("common.noResults") || "No collections matching"} "${searchQuery}"` : t("collections.empty.title") || "No collections yet"}
                </h3>
                <p style={{ fontSize: "14px", color: colors.textSecondary, maxWidth: "380px", margin: "0 auto 20px", lineHeight: 1.6 }}>
                  {searchQuery
                    ? "Try a different search term or clear the filter."
                    : t("collections.empty.description") || "Create collections to organize your research documents and segments into curated reading lists."
                  }
                </p>
                {searchQuery ? (
                  <button onClick={() => setSearchQuery("")} style={{ padding: "9px 20px", background: "transparent", border: `1px solid ${colors.borderPrimary}`, borderRadius: "9px", color: colors.textSecondary, fontSize: "13px", cursor: "pointer" }}>{t("action.clearSearch") || "Clear Search"}</button>
                ) : (
                  <button onClick={() => setShowCreate(true)} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>+ {t("collections.create") || "New Collection"}</button>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(270px, 1fr))", gap: "14px" }}>
                {filtered.map(col => {
                  const vis = VISIBILITY_CONFIG[col.visibility];
                  const isActive = activeCollection === col.id;
                  return (
                    <div key={col.id} style={{ ...cardStyle, border: isActive ? "1px solid rgba(99,102,241,0.4)" : `1px solid ${colors.borderPrimary}`, boxShadow: isActive ? "0 0 0 2px rgba(99,102,241,0.2)" : "none" }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? "0 8px 24px rgba(0,0,0,0.3)" : "0 8px 24px rgba(0,0,0,0.08)"; }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                    >
                      <div style={{ height: "6px", background: col.color }} />
                      {editingId === col.id ? (
                        /* ── Inline Edit Form ── */
                        <div style={{ padding: "14px" }} onClick={e => e.stopPropagation()}>
                          <input value={editName} onChange={e => setEditName(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: `1px solid ${colors.borderPrimary}`, background: isDark ? "rgba(30,30,40,0.7)" : colors.bgInput, color: colors.textPrimary, fontSize: "14px", fontWeight: 700, marginBottom: "8px", boxSizing: "border-box", outline: "none" }} onKeyDown={e => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") setEditingId(null); }} autoFocus />
                          <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: `1px solid ${colors.borderPrimary}`, background: isDark ? "rgba(30,30,40,0.7)" : colors.bgInput, color: colors.textPrimary, fontSize: "12px", resize: "vertical", marginBottom: "8px", boxSizing: "border-box" }} />
                          <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap", alignItems: "center" }}>
                            {COLLECTION_COLORS.map(c => (
                              <button key={c} onClick={() => setEditColor(c)} style={{ width: "22px", height: "22px", borderRadius: "50%", background: c, border: editColor === c ? "3px solid #fff" : "2px solid transparent", cursor: "pointer", boxShadow: editColor === c ? "0 0 0 2px #6366f1" : "none" }} />
                            ))}
                            <select value={editVisibility} onChange={e => setEditVisibility(e.target.value as "private" | "team" | "public")} style={{ padding: "4px 8px", borderRadius: "6px", border: `1px solid ${colors.borderPrimary}`, background: isDark ? "rgba(30,30,40,0.7)" : colors.bgInput, color: colors.textPrimary, fontSize: "11px" }}>
                              <option value="private">🔒 Private</option>
                              <option value="team">👥 Team</option>
                              <option value="public">🌐 Public</option>
                            </select>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button onClick={handleSaveEdit} style={{ flex: 1, padding: "6px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: "7px", color: "#fff", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>{t("collections.save") || "Save"}</button>
                            <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: "6px", background: "transparent", border: `1px solid ${colors.borderPrimary}`, borderRadius: "7px", color: colors.textSecondary, fontSize: "12px", cursor: "pointer" }}>{t("action.cancel") || "Cancel"}</button>
                          </div>
                        </div>
                      ) : (
                        /* ── Normal Card View ── */
                        <div style={{ padding: "16px" }} onClick={() => setActiveCollection(isActive ? null : col.id)}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: colors.textPrimary, flex: 1, marginRight: "8px" }}>{col.name}</h3>
                            <div style={{ display: "flex", gap: "2px" }}>
                              <button onClick={e => { e.stopPropagation(); handleShare(col); }} title="Share / Copy link" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", padding: "3px 5px", borderRadius: "5px", color: copiedId === col.id ? "#10b981" : colors.textMuted }}>
                                {copiedId === col.id ? "✓" : "🔗"}
                              </button>
                              <button onClick={e => { e.stopPropagation(); startEdit(col); }} title="Edit collection" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", padding: "3px 5px", borderRadius: "5px", color: colors.textMuted }}>✏️</button>
                              <button onClick={e => { e.stopPropagation(); handleToggleVisibility(col.id); }} title={`Visibility: ${vis.label}`} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", padding: "3px 5px", borderRadius: "5px" }}>{vis.icon}</button>
                              <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(col.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: "15px", padding: "3px 5px", borderRadius: "5px" }} title="Delete">×</button>
                            </div>
                          </div>
                          {col.description && <p style={{ margin: "0 0 12px", fontSize: "12px", color: colors.textSecondary, lineHeight: 1.5 }}>{col.description}</p>}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: colors.textMuted }}>{col.items.length} {t("collections.items") || "items"}</span>
                            <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px", background: `${vis.color}22`, color: vis.color }}>{vis.label}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {activeCol && (
            <div style={{ ...cardStyle, cursor: "default", height: "fit-content", position: "sticky", top: "24px" }}>
              <div style={{ height: "6px", background: activeCol.color }} />
              <div style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: colors.textPrimary, flex: 1, marginRight: "8px" }}>{activeCol.name}</h3>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() => handleShare(activeCol)}
                      title="Copy share link"
                      style={{ padding: "5px 10px", borderRadius: "7px", border: `1px solid ${colors.borderPrimary}`, background: copiedId === activeCol.id ? "rgba(16,185,129,0.15)" : "transparent", color: copiedId === activeCol.id ? "#10b981" : colors.textSecondary, fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                    >
                      {copiedId === activeCol.id ? "✓ Copied!" : "🔗 Share"}
                    </button>
                    <button onClick={() => setActiveCollection(null)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: "20px", padding: "0 4px" }}>×</button>
                  </div>
                </div>
                {activeCol.description && <p style={{ margin: "0 0 12px", fontSize: "13px", color: colors.textSecondary }}>{activeCol.description}</p>}
                <div style={{ fontSize: "12px", color: colors.textMuted, marginBottom: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span>{VISIBILITY_CONFIG[activeCol.visibility].icon} {VISIBILITY_CONFIG[activeCol.visibility].label}</span>
                  <span>·</span>
                  <span>{activeCol.items.length} {t("collections.items") || "items"}</span>
                  <span>·</span>
                  <span>{t("common.updated") || "Updated"} {new Date(activeCol.updatedAt).toLocaleDateString()}</span>
                </div>
                {activeCol.items.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px", color: colors.textSecondary, fontSize: "13px", borderRadius: "10px", border: `1px dashed ${colors.borderPrimary}` }}>
                    {t("collections.detail.empty") || "No items in this collection yet."}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {activeCol.items.map(item => (
                      <div key={item.id} style={{ padding: "10px 12px", background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderRadius: "8px", border: `1px solid ${colors.borderPrimary}` }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "14px" }}>{item.type === "document" ? "📄" : "📌"}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                            {item.preview && <div style={{ fontSize: "11px", color: colors.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.preview}</div>}
                          </div>
                          <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: "10px", color: colors.textMuted }}>{new Date(item.addedAt).toLocaleDateString()}</span>
                            <button
                              onClick={() => handleRemoveItem(activeCol.id, item.id)}
                              title="Remove from collection"
                              style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: "14px", padding: "1px 4px", borderRadius: "4px", lineHeight: 1 }}
                              onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; }}
                              onMouseLeave={e => { e.currentTarget.style.color = colors.textMuted; }}
                            >×</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Delete Modal */}
        {confirmDeleteId && (() => {
          const col = collections.find(c => c.id === confirmDeleteId);
          if (!col) return null;
          return (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setConfirmDeleteId(null)}>
              <div style={{ background: isDark ? "#1a1a2e" : "#ffffff", borderRadius: "16px", padding: "28px", maxWidth: "400px", width: "90%", border: `1px solid ${colors.borderPrimary}`, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: "0 0 12px", fontSize: "17px", fontWeight: 700, color: colors.textPrimary }}>⚠️ {t("action.delete") || "Delete"} {t("nav.collections") || "Collection"}</h3>
                <p style={{ margin: "0 0 20px", fontSize: "14px", color: colors.textSecondary, lineHeight: 1.6 }}>
                  {t("action.delete") || "Delete"} <strong style={{ color: colors.textPrimary }}>{col.name}</strong>? {t("collections.delete.warning") || `This will remove the collection and all ${col.items.length} items inside. This cannot be undone.`}
                </p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => handleDelete(confirmDeleteId)} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: "9px", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>{t("action.delete") || "Delete"}</button>
                  <button onClick={() => setConfirmDeleteId(null)} style={{ flex: 1, padding: "10px", background: "transparent", border: `1px solid ${colors.borderPrimary}`, borderRadius: "9px", color: colors.textSecondary, fontSize: "14px", cursor: "pointer" }}>{t("action.cancel") || "Cancel"}</button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Keyboard shortcut hint */}
        <div style={{ marginTop: "20px", fontSize: "11px", color: colors.textMuted, display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <span><kbd style={{ fontFamily: "monospace", fontWeight: 700, padding: "1px 5px", borderRadius: "4px", border: `1px solid ${colors.borderPrimary}`, fontSize: "11px" }}>N</kbd> New collection</span>
          <span><kbd style={{ fontFamily: "monospace", fontWeight: 700, padding: "1px 5px", borderRadius: "4px", border: `1px solid ${colors.borderPrimary}`, fontSize: "11px" }}>Esc</kbd> Close panels</span>
        </div>
      </div>
    </PageShell>
  );
}

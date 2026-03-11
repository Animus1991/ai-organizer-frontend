// src/components/TheoryEvolutionTimeline.tsx
// Time-Series Theory Evolution — timeline showing how theory changed over sessions
import { useState, useMemo, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";

// ─── Types ───────────────────────────────────────────────────────────
type EventType = "claim_added" | "claim_modified" | "claim_removed" | "evidence_added" | "evidence_removed" | "boundary_added" | "contradiction_found" | "contradiction_resolved" | "version_created" | "milestone" | "insight" | "refutation";

interface TimelineEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  date: string;
  session: string;
  impact: "major" | "minor" | "neutral";
  relatedClaims: string[];
  tags: string[];
}

interface TheoryEvolutionTimelineProps {
  open: boolean;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────
const STORAGE_KEY = "thinkspace-theory-evolution";

const EVENT_META: Record<EventType, { icon: string; color: string; label: string }> = {
  claim_added:            { icon: "➕", color: "#22c55e", label: "Claim Added" },
  claim_modified:         { icon: "✏️", color: "#3b82f6", label: "Claim Modified" },
  claim_removed:          { icon: "➖", color: "#ef4444", label: "Claim Removed" },
  evidence_added:         { icon: "📊", color: "#60a5fa", label: "Evidence Added" },
  evidence_removed:       { icon: "📉", color: "#f97316", label: "Evidence Removed" },
  boundary_added:         { icon: "🛡️", color: "#06b6d4", label: "Boundary Defined" },
  contradiction_found:    { icon: "⚡", color: "#ef4444", label: "Contradiction Found" },
  contradiction_resolved: { icon: "✅", color: "#22c55e", label: "Contradiction Resolved" },
  version_created:        { icon: "🔄", color: "#a78bfa", label: "Version Created" },
  milestone:              { icon: "🏆", color: "#fbbf24", label: "Milestone" },
  insight:                { icon: "💡", color: "#f472b6", label: "Insight" },
  refutation:             { icon: "🚫", color: "#dc2626", label: "Refutation" },
};

const IMPACT_META: Record<string, { color: string; label: string }> = {
  major:   { color: "#ef4444", label: "Major" },
  minor:   { color: "#f59e0b", label: "Minor" },
  neutral: { color: "#94a3b8", label: "Neutral" },
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function loadEvents(): TimelineEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveEvents(events: TimelineEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

// ─── Auto-sync from other Think!Hub tools ────────────────────────────
function autoSyncFromTools(existingEvents: TimelineEvent[]): TimelineEvent[] {
  const newEvents: TimelineEvent[] = [];
  const existingIds = new Set(existingEvents.map(e => e.id));
  const now = new Date().toISOString();

  try {
    // Sync from ClaimChangelog
    const changelog = JSON.parse(localStorage.getItem("thinkspace-claim-changelog") || "{}");
    const entries = changelog.entries || [];
    for (const entry of entries) {
      const syncId = `sync-changelog-${entry.id}`;
      if (!existingIds.has(syncId)) {
        newEvents.push({
          id: syncId,
          type: entry.changeType === "created" ? "claim_added" : entry.changeType === "deleted" ? "claim_removed" : "claim_modified",
          title: `${entry.changeType}: ${entry.claimText?.slice(0, 60) || "Unknown claim"}`,
          description: entry.description || "",
          date: entry.timestamp || now,
          session: entry.session || "auto-synced",
          impact: "minor",
          relatedClaims: entry.claimId ? [entry.claimId] : [],
          tags: ["auto-synced", "changelog"],
        });
      }
    }

    // Sync from Contradictions
    const contras = JSON.parse(localStorage.getItem("thinkspace-contradictions") || "{}");
    for (const c of (contras.contradictions || [])) {
      const syncId = `sync-contra-${c.id}`;
      if (!existingIds.has(syncId)) {
        newEvents.push({
          id: syncId,
          type: c.status === "resolved" ? "contradiction_resolved" : "contradiction_found",
          title: `Contradiction: ${c.claim1?.slice(0, 30)} vs ${c.claim2?.slice(0, 30)}`,
          description: c.description || "",
          date: c.createdAt || now,
          session: "auto-synced",
          impact: "major",
          relatedClaims: [],
          tags: ["auto-synced", "contradiction"],
        });
      }
    }

    // Sync from TheoryVersionManager
    const versions = JSON.parse(localStorage.getItem("thinkspace-theory-versions") || "{}");
    for (const v of (versions.versions || [])) {
      const syncId = `sync-version-${v.id}`;
      if (!existingIds.has(syncId)) {
        newEvents.push({
          id: syncId,
          type: "version_created",
          title: `Version: ${v.name || "Unnamed"}`,
          description: v.description || "",
          date: v.createdAt || now,
          session: "auto-synced",
          impact: "major",
          relatedClaims: [],
          tags: ["auto-synced", "version"],
        });
      }
    }
  } catch {
    // Silently fail on sync errors
  }

  return newEvents;
}

// ─── Component ───────────────────────────────────────────────────────
export function TheoryEvolutionTimeline({ open, onClose }: TheoryEvolutionTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>(loadEvents);
  const [filterType, setFilterType] = useState<EventType | "all">("all");
  const [filterImpact, setFilterImpact] = useState<"all" | "major" | "minor" | "neutral">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "insight" as EventType, title: "", description: "", session: "", impact: "minor" as "major" | "minor" | "neutral", tags: "" });

  const persist = useCallback((items: TimelineEvent[]) => {
    setEvents(items);
    saveEvents(items);
  }, []);

  // Auto-sync on open
  const syncFromTools = useCallback(() => {
    const newEvents = autoSyncFromTools(events);
    if (newEvents.length > 0) {
      persist([...events, ...newEvents]);
    }
  }, [events, persist]);

  const addEvent = useCallback(() => {
    if (!form.title.trim()) return;
    const event: TimelineEvent = {
      id: generateId(),
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      date: new Date().toISOString(),
      session: form.session.trim() || `Session ${events.length + 1}`,
      impact: form.impact,
      relatedClaims: [],
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
    };
    persist([event, ...events]);
    setForm({ type: "insight", title: "", description: "", session: "", impact: "minor", tags: "" });
    setShowForm(false);
  }, [form, events, persist]);

  const removeEvent = useCallback((id: string) => {
    persist(events.filter(e => e.id !== id));
  }, [events, persist]);

  const filtered = useMemo(() => {
    let items = events;
    if (filterType !== "all") items = items.filter(e => e.type === filterType);
    if (filterImpact !== "all") items = items.filter(e => e.impact === filterImpact);
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events, filterType, filterImpact]);

  // Group by month
  const groupedByMonth = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>();
    for (const e of filtered) {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const existing = groups.get(key) || [];
      existing.push(e);
      groups.set(key, existing);
    }
    return groups;
  }, [filtered]);

  // Stats
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const e of events) byType[e.type] = (byType[e.type] || 0) + 1;
    const major = events.filter(e => e.impact === "major").length;
    const sessions = new Set(events.map(e => e.session)).size;
    return { total: events.length, major, sessions, byType };
  }, [events]);

  if (!open) return null;

  const { colors, isDark } = useTheme();

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: isDark ? "linear-gradient(135deg, #0f1117 0%, #13151d 100%)" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 16, width: "min(95vw, 900px)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.5)" : "0 24px 64px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 22 }}>📅</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 18, color: colors.textPrimary, fontWeight: 700 }}>Think!Hub Evolution Timeline</h2>
            <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>{stats.total} events • {stats.sessions} sessions • {stats.major} major changes</p>
          </div>
          <button onClick={syncFromTools} style={{ padding: "6px 12px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 6, color: "#6ee7b7", cursor: "pointer", fontSize: 11 }}>↻ Sync</button>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: "6px 12px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, color: "#a5b4fc", cursor: "pointer", fontSize: 11 }}>{showForm ? "Cancel" : "+ Add Event"}</button>
          <button onClick={onClose} style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div style={{ padding: "14px 24px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.entries(EVENT_META).map(([key, meta]) => (
                <button key={key} onClick={() => setForm({ ...form, type: key as EventType })} style={{ padding: "3px 8px", background: form.type === key ? `${meta.color}22` : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"), border: `1px solid ${form.type === key ? meta.color + "44" : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)")}`, borderRadius: 6, color: meta.color, cursor: "pointer", fontSize: 9 }}>
                  {meta.icon} {meta.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} onKeyDown={e => e.key === "Enter" && addEvent()} placeholder="Event title..." style={{ flex: 1, padding: "8px 12px", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 6, color: colors.textPrimary, fontSize: 12, outline: "none" }} />
              <input value={form.session} onChange={e => setForm({ ...form, session: e.target.value })} placeholder="Session name..." style={{ width: 140, padding: "8px 12px", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 6, color: colors.textPrimary, fontSize: 11, outline: "none" }} />
              <select value={form.impact} onChange={e => setForm({ ...form, impact: e.target.value as any })} style={{ padding: "8px 10px", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 6, color: colors.textPrimary, fontSize: 11 }}>
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="neutral">Neutral</option>
              </select>
              <button onClick={addEvent} style={{ padding: "8px 16px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, color: "#a5b4fc", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Add</button>
            </div>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)..." rows={2} style={{ padding: "8px 12px", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 6, color: colors.textPrimary, fontSize: 11, outline: "none", resize: "vertical" }} />
          </div>
        )}

        {/* Filters */}
        <div style={{ padding: "10px 24px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", flexShrink: 0 }}>
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)} style={{ padding: "4px 8px", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 6, color: colors.textPrimary, fontSize: 11 }}>
            <option value="all">All Types</option>
            {Object.entries(EVENT_META).map(([k, m]) => <option key={k} value={k}>{m.icon} {m.label}</option>)}
          </select>
          <div style={{ display: "flex", gap: 4 }}>
            {(["all", "major", "minor", "neutral"] as const).map(imp => (
              <button key={imp} onClick={() => setFilterImpact(imp)} style={{ padding: "4px 8px", background: filterImpact === imp ? (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)") : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"), border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 6, color: imp === "all" ? colors.textPrimary : IMPACT_META[imp]?.color || "#94a3b8", cursor: "pointer", fontSize: 10, textTransform: "capitalize" }}>
                {imp}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: colors.textMuted }}>{filtered.length} events shown</span>
        </div>

        {/* Timeline */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: colors.textMuted }}>
              <p style={{ fontSize: 36, margin: "0 0 12px" }}>📅</p>
              <p style={{ fontSize: 14, margin: 0, color: colors.textMuted }}>No events yet. Add events or sync from other Think!Hub tools.</p>
            </div>
          ) : (
            Array.from(groupedByMonth.entries()).map(([month, monthEvents]) => (
              <div key={month} style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "rgba(99,102,241,0.4)", border: "2px solid rgba(99,102,241,0.6)" }} />
                  <h3 style={{ margin: 0, fontSize: 14, color: "#a5b4fc", fontWeight: 700 }}>
                    {new Date(month + "-01").toLocaleDateString(undefined, { year: "numeric", month: "long" })}
                  </h3>
                  <span style={{ fontSize: 11, color: colors.textMuted }}>({monthEvents.length} events)</span>
                </div>
                <div style={{ borderLeft: "2px solid rgba(99,102,241,0.15)", marginLeft: 5, paddingLeft: 20 }}>
                  {monthEvents.map(event => {
                    const meta = EVENT_META[event.type];
                    const impMeta = IMPACT_META[event.impact];
                    return (
                      <div key={event.id} style={{ position: "relative", padding: "10px 14px", marginBottom: 8, background: `${meta.color}06`, border: `1px solid ${meta.color}15`, borderRadius: 8, transition: "all 0.2s" }}>
                        {/* Timeline dot */}
                        <div style={{ position: "absolute", left: -27, top: 14, width: 8, height: 8, borderRadius: "50%", background: meta.color }} />
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <span style={{ fontSize: 18 }}>{meta.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                              <span style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 600 }}>{event.title}</span>
                              <span style={{ fontSize: 9, padding: "1px 6px", background: `${impMeta.color}15`, border: `1px solid ${impMeta.color}33`, borderRadius: 8, color: impMeta.color }}>{impMeta.label}</span>
                              {event.tags.filter(t => t !== "auto-synced").map(tag => (
                                <span key={tag} style={{ fontSize: 8, padding: "1px 5px", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", borderRadius: 6, color: colors.textMuted }}>{tag}</span>
                              ))}
                            </div>
                            {event.description && <p style={{ margin: "2px 0 0", fontSize: 11, color: colors.textMuted, lineHeight: 1.4 }}>{event.description}</p>}
                            <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 10, color: colors.textMuted }}>
                              <span>{new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              {event.session && <span>📁 {event.session}</span>}
                              {event.tags.includes("auto-synced") && <span style={{ color: "#6ee7b7" }}>🔄 auto-synced</span>}
                            </div>
                          </div>
                          <button onClick={() => removeEvent(event.id)} style={{ padding: "3px 6px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 4, color: "#fca5a5", cursor: "pointer", fontSize: 10 }}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ReleasePublicationPage — GitHub Releases equivalent for academic research
 * 
 * Features:
 * - Create versioned releases (v1.0.0, v1.1.0, etc.)
 * - Release notes with changelog
 * - Publication status workflow (draft → preprint → submitted → peer-review → published)
 * - Link releases to theory branches/commits
 * - DOI assignment tracking
 * - Export release as publication package
 * - Timeline view of all releases
 */

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { PageShell } from "../components/layout/PageShell";
import { useIsMobile } from "../hooks/useMediaQuery";

// ─── Types ───────────────────────────────────────────────────────────

type PublicationStatus = "draft" | "preprint" | "submitted" | "peer-review" | "revision" | "accepted" | "published" | "retracted";
type ReleaseType = "major" | "minor" | "patch" | "prerelease";

interface Release {
  id: string;
  version: string;
  title: string;
  description: string;
  releaseNotes: string;
  status: PublicationStatus;
  releaseType: ReleaseType;
  createdAt: number;
  updatedAt: number;
  publishedAt: number | null;
  author: string;
  /** Linked theory branch */
  branchId: string | null;
  /** Linked commit */
  commitId: string | null;
  /** DOI if assigned */
  doi: string | null;
  /** Target journal/venue */
  targetVenue: string;
  /** Reviewers */
  reviewers: string[];
  /** Key changes in this release */
  changelog: ChangelogEntry[];
  /** Attached files/assets */
  assets: ReleaseAsset[];
  /** Tags for categorization */
  tags: string[];
  /** Whether this is marked as latest */
  isLatest: boolean;
  /** Whether this is a pre-release */
  isPreRelease: boolean;
}

interface ChangelogEntry {
  id: string;
  type: "added" | "changed" | "fixed" | "removed" | "deprecated" | "security";
  description: string;
}

interface ReleaseAsset {
  id: string;
  name: string;
  type: "pdf" | "data" | "code" | "supplementary" | "presentation" | "other";
  size: string;
  url: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const STORAGE_KEY = "release_publications";

const STATUS_CONFIG: Record<PublicationStatus, { label: string; icon: string; color: string; order: number }> = {
  draft: { label: "Draft", icon: "📝", color: "#6b7280", order: 0 },
  preprint: { label: "Preprint", icon: "📄", color: "#6366f1", order: 1 },
  submitted: { label: "Submitted", icon: "📮", color: "#06b6d4", order: 2 },
  "peer-review": { label: "Peer Review", icon: "🔍", color: "hsl(var(--warning))", order: 3 },
  revision: { label: "Revision", icon: "✏️", color: "#f97316", order: 4 },
  accepted: { label: "Accepted", icon: "✅", color: "#10b981", order: 5 },
  published: { label: "Published", icon: "🎉", color: "hsl(var(--success))", order: 6 },
  retracted: { label: "Retracted", icon: "🚫", color: "hsl(var(--destructive))", order: 7 },
};

const RELEASE_TYPE_CONFIG: Record<ReleaseType, { label: string; color: string; description: string }> = {
  major: { label: "Major", color: "hsl(var(--destructive))", description: "Breaking changes or new theory formulation" },
  minor: { label: "Minor", color: "hsl(var(--warning))", description: "New claims, evidence, or methodology additions" },
  patch: { label: "Patch", color: "#10b981", description: "Bug fixes, typo corrections, citation updates" },
  prerelease: { label: "Pre-release", color: "#8b5cf6", description: "Experimental or unstable version" },
};

const CHANGELOG_TYPE_CONFIG: Record<ChangelogEntry["type"], { label: string; icon: string; color: string }> = {
  added: { label: "Added", icon: "➕", color: "#10b981" },
  changed: { label: "Changed", icon: "🔄", color: "hsl(var(--warning))" },
  fixed: { label: "Fixed", icon: "🐛", color: "#06b6d4" },
  removed: { label: "Removed", icon: "➖", color: "hsl(var(--destructive))" },
  deprecated: { label: "Deprecated", icon: "⚠️", color: "#6b7280" },
  security: { label: "Security", icon: "🔒", color: "#8b5cf6" },
};

const ASSET_TYPE_CONFIG: Record<ReleaseAsset["type"], { icon: string; color: string }> = {
  pdf: { icon: "📄", color: "hsl(var(--destructive))" },
  data: { icon: "📊", color: "#10b981" },
  code: { icon: "💻", color: "#6366f1" },
  supplementary: { icon: "📎", color: "hsl(var(--warning))" },
  presentation: { icon: "📽", color: "#06b6d4" },
  other: { icon: "📁", color: "#6b7280" },
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ─── Sample Data ─────────────────────────────────────────────────────

function createSampleData(): Release[] {
  const now = Date.now();
  const day = 86400000;

  return [
    {
      id: "rel-1",
      version: "v1.0.0",
      title: "Cognitive Load Theory — Extended Model (Initial Release)",
      description: "First stable formulation of the Extended Cognitive Load Theory integrating dual-process framework with boundary conditions.",
      releaseNotes: "This release establishes the foundational framework for the Extended Cognitive Load Theory. It integrates Kahneman's dual-process theory with Sweller's original CLT, defining clear boundary conditions for applicability.",
      status: "published",
      releaseType: "major",
      createdAt: now - 30 * day,
      updatedAt: now - 25 * day,
      publishedAt: now - 25 * day,
      author: "Dr. Elena Vasquez",
      branchId: "branch-main",
      commitId: "commit-3",
      doi: "10.1234/thinkhub.2026.001",
      targetVenue: "Journal of Educational Psychology",
      reviewers: ["Prof. Marcus Chen", "Dr. Sarah Kim"],
      changelog: [
        { id: "cl-1", type: "added", description: "Core theory formulation with 4 foundational claims" },
        { id: "cl-2", type: "added", description: "Dual-process integration (System 1/System 2)" },
        { id: "cl-3", type: "added", description: "Boundary conditions for novice-intermediate learners" },
        { id: "cl-4", type: "added", description: "Evidence base with 4 key references" },
      ],
      assets: [
        { id: "a-1", name: "CLT_Extended_v1.0.0.pdf", type: "pdf", size: "2.4 MB", url: "#" },
        { id: "a-2", name: "supplementary_data.zip", type: "data", size: "15.8 MB", url: "#" },
        { id: "a-3", name: "analysis_scripts.zip", type: "code", size: "340 KB", url: "#" },
      ],
      tags: ["cognitive-load", "dual-process", "educational-psychology"],
      isLatest: false,
      isPreRelease: false,
    },
    {
      id: "rel-2",
      version: "v1.1.0",
      title: "Methodology Update & Statistical Analysis Plan",
      description: "Incorporates reviewer feedback on methodology and adds pre-registered Bayesian statistical analysis plan.",
      releaseNotes: "Based on peer review feedback, this release updates the methodology section with a mixed-methods approach (eye-tracking + fMRI + think-aloud) and introduces a pre-registered Bayesian hierarchical analysis plan.",
      status: "peer-review",
      releaseType: "minor",
      createdAt: now - 10 * day,
      updatedAt: now - 2 * day,
      publishedAt: null,
      author: "Prof. Marcus Chen",
      branchId: "branch-revision",
      commitId: "commit-7",
      doi: null,
      targetVenue: "Journal of Educational Psychology",
      reviewers: ["Dr. Elena Vasquez", "Dr. James Wright"],
      changelog: [
        { id: "cl-5", type: "changed", description: "Revised methodology section based on reviewer feedback" },
        { id: "cl-6", type: "added", description: "Pre-registered Bayesian hierarchical analysis plan" },
        { id: "cl-7", type: "added", description: "Mixed-methods approach: eye-tracking + fMRI + think-aloud" },
        { id: "cl-8", type: "added", description: "New claim: Bayesian analysis preferred for theory comparison" },
        { id: "cl-9", type: "fixed", description: "Corrected citation format for Paas & van Merriënboer (2020)" },
      ],
      assets: [
        { id: "a-4", name: "CLT_Extended_v1.1.0_draft.pdf", type: "pdf", size: "3.1 MB", url: "#" },
        { id: "a-5", name: "statistical_analysis_plan.pdf", type: "supplementary", size: "890 KB", url: "#" },
      ],
      tags: ["methodology", "bayesian", "pre-registration"],
      isLatest: true,
      isPreRelease: false,
    },
    {
      id: "rel-3",
      version: "v2.0.0-alpha",
      title: "Quantum Cognition Extension (Experimental)",
      description: "Experimental extension exploring quantum probability models for cognitive phenomena.",
      releaseNotes: "This pre-release explores the application of quantum probability theory to cognitive load phenomena. It proposes that quantum models may better explain conjunction fallacy and order effects in judgment. This is highly experimental and not yet peer-reviewed.",
      status: "preprint",
      releaseType: "prerelease",
      createdAt: now - 5 * day,
      updatedAt: now - 1 * day,
      publishedAt: null,
      author: "Dr. Elena Vasquez",
      branchId: "branch-hypothesis",
      commitId: "commit-5",
      doi: null,
      targetVenue: "arXiv (preprint)",
      reviewers: [],
      changelog: [
        { id: "cl-10", type: "added", description: "Quantum probability model for conjunction fallacy" },
        { id: "cl-11", type: "added", description: "Testable prediction: order effects follow quantum interference" },
        { id: "cl-12", type: "added", description: "New evidence: Busemeyer & Bruza (2012), Wang et al. (2014)" },
        { id: "cl-13", type: "changed", description: "Extended assumptions to include quantum superposition model" },
      ],
      assets: [
        { id: "a-6", name: "quantum_cognition_preprint.pdf", type: "pdf", size: "1.8 MB", url: "#" },
      ],
      tags: ["quantum-cognition", "experimental", "preprint"],
      isLatest: false,
      isPreRelease: true,
    },
  ];
}

// ─── Helpers ─────────────────────────────────────────────────────────

function loadReleases(): Release[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  const sample = createSampleData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
  return sample;
}

function saveReleases(releases: Release[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(releases));
}

// ─── Styles ──────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "hsl(var(--card) / 0.5)",
  border: "1px solid hsl(var(--border) / 0.5)",
  borderRadius: 10,
  padding: 20,
};

const btnStyle = (active: boolean, color = "hsl(var(--primary))"): React.CSSProperties => ({
  padding: "6px 14px",
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 600,
  border: active ? `1px solid ${color}` : "1px solid hsl(var(--border))",
  background: active ? `${color}15` : "transparent",
  color: active ? color : "hsl(var(--muted-foreground))",
  cursor: "pointer",
  transition: "all 0.2s ease",
});

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: 10,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--muted) / 0.3)",
  color: "hsl(var(--foreground))",
  fontSize: 12,
  outline: "none",
  boxSizing: "border-box" as const,
};

// ─── Component ───────────────────────────────────────────────────────

const ReleasePublicationPage: React.FC = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [releases, setReleases] = useState<Release[]>(() => loadReleases());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<PublicationStatus | "all">("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<"timeline" | "list" | "workflow">("timeline");

  // New release form
  const [newRelease, setNewRelease] = useState({
    version: "",
    title: "",
    description: "",
    releaseType: "minor" as ReleaseType,
    targetVenue: "",
    isPreRelease: false,
  });

  useEffect(() => {
    saveReleases(releases);
  }, [releases]);

  // ─── Computed ──────────────────────────────────────────────────────

  const filteredReleases = useMemo(() => {
    let result = [...releases].sort((a, b) => b.createdAt - a.createdAt);
    if (filterStatus !== "all") {
      result = result.filter((r) => r.status === filterStatus);
    }
    return result;
  }, [releases, filterStatus]);

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const r of releases) {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    }
    return {
      total: releases.length,
      published: releases.filter((r) => r.status === "published").length,
      inReview: releases.filter((r) => r.status === "peer-review" || r.status === "submitted").length,
      drafts: releases.filter((r) => r.status === "draft" || r.status === "preprint").length,
      withDoi: releases.filter((r) => r.doi).length,
      byStatus,
    };
  }, [releases]);

  // ─── Actions ───────────────────────────────────────────────────────

  const createRelease = useCallback(() => {
    if (!newRelease.version.trim() || !newRelease.title.trim()) return;
    const release: Release = {
      id: generateId(),
      version: newRelease.version.trim(),
      title: newRelease.title.trim(),
      description: newRelease.description.trim(),
      releaseNotes: "",
      status: newRelease.isPreRelease ? "preprint" : "draft",
      releaseType: newRelease.releaseType,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      publishedAt: null,
      author: "Current User",
      branchId: null,
      commitId: null,
      doi: null,
      targetVenue: newRelease.targetVenue.trim(),
      reviewers: [],
      changelog: [],
      assets: [],
      tags: [],
      isLatest: false,
      isPreRelease: newRelease.isPreRelease,
    };
    setReleases((prev) => [release, ...prev]);
    setNewRelease({ version: "", title: "", description: "", releaseType: "minor", targetVenue: "", isPreRelease: false });
    setShowCreateForm(false);
    setSelectedId(release.id);
  }, [newRelease]);

  const updateRelease = useCallback((id: string, updates: Partial<Release>) => {
    setReleases((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r))
    );
  }, []);

  const deleteRelease = useCallback((id: string) => {
    setReleases((prev) => prev.filter((r) => r.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const advanceStatus = useCallback((id: string) => {
    const release = releases.find((r) => r.id === id);
    if (!release) return;
    const statusOrder: PublicationStatus[] = ["draft", "preprint", "submitted", "peer-review", "revision", "accepted", "published"];
    const currentIdx = statusOrder.indexOf(release.status);
    if (currentIdx < statusOrder.length - 1) {
      const nextStatus = statusOrder[currentIdx + 1];
      updateRelease(id, {
        status: nextStatus,
        publishedAt: nextStatus === "published" ? Date.now() : release.publishedAt,
      });
    }
  }, [releases, updateRelease]);

  const addChangelogEntry = useCallback((releaseId: string, type: ChangelogEntry["type"], description: string) => {
    const release = releases.find((r) => r.id === releaseId);
    if (!release || !description.trim()) return;
    const entry: ChangelogEntry = { id: generateId(), type, description: description.trim() };
    updateRelease(releaseId, { changelog: [...release.changelog, entry] });
  }, [releases, updateRelease]);

  const removeChangelogEntry = useCallback((releaseId: string, entryId: string) => {
    const release = releases.find((r) => r.id === releaseId);
    if (!release) return;
    updateRelease(releaseId, { changelog: release.changelog.filter((e) => e.id !== entryId) });
  }, [releases, updateRelease]);

  const markAsLatest = useCallback((id: string) => {
    setReleases((prev) =>
      prev.map((r) => ({ ...r, isLatest: r.id === id, updatedAt: r.id === id ? Date.now() : r.updatedAt }))
    );
  }, []);

  // ─── Changelog form state ─────────────────────────────────────────

  const [changelogType, setChangelogType] = useState<ChangelogEntry["type"]>("added");
  const [changelogDesc, setChangelogDesc] = useState("");

  // ─── Render: Timeline View ────────────────────────────────────────

  const renderTimelineView = () => (
    <div style={{ position: "relative", paddingLeft: 32 }}>
      {/* Timeline line */}
      <div style={{
        position: "absolute",
        left: 14,
        top: 0,
        bottom: 0,
        width: 2,
        background: "linear-gradient(to bottom, rgba(99,102,241,0.3), rgba(99,102,241,0.05))",
      }} />

      {filteredReleases.map((release) => {
        const sCfg = STATUS_CONFIG[release.status];
        const rtCfg = RELEASE_TYPE_CONFIG[release.releaseType];
        const isSelected = selectedId === release.id;

        return (
          <div key={release.id} style={{ position: "relative", marginBottom: 16 }}>
            {/* Timeline dot */}
            <div style={{
              position: "absolute",
              left: -24,
              top: 16,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: sCfg.color,
              border: "2px solid #0a0b14",
              zIndex: 1,
            }} />

            <div
              style={{
                ...cardStyle,
                borderColor: isSelected ? `${sCfg.color}30` : undefined,
                cursor: "pointer",
              }}
              onClick={() => setSelectedId(isSelected ? null : release.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: rtCfg.color,
                  fontFamily: "monospace",
                }}>
                  {release.version}
                </span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: `${sCfg.color}15`,
                  color: sCfg.color,
                }}>
                  {sCfg.icon} {sCfg.label}
                </span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: `${rtCfg.color}15`,
                  color: rtCfg.color,
                }}>
                  {rtCfg.label}
                </span>
                {release.isLatest && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.15)", color: "#6ee7b7" }}>
                    ⭐ Latest
                  </span>
                )}
                {release.isPreRelease && (
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "rgba(139,92,246,0.15)", color: "#c4b5fd" }}>
                    Pre-release
                  </span>
                )}
                {release.doi && (
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "rgba(6,182,212,0.15)", color: "#67e8f9", fontFamily: "monospace" }}>
                    DOI: {release.doi}
                  </span>
                )}
              </div>

              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{release.title}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8, lineHeight: 1.5 }}>{release.description}</div>

              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "rgba(255,255,255,0.3)", flexWrap: "wrap" }}>
                <span>👤 {release.author}</span>
                <span>📅 {new Date(release.createdAt).toLocaleDateString()}</span>
                {release.publishedAt && <span>🎉 Published: {new Date(release.publishedAt).toLocaleDateString()}</span>}
                {release.targetVenue && <span>🏛 {release.targetVenue}</span>}
                <span>📋 {release.changelog.length} changes</span>
                <span>📎 {release.assets.length} assets</span>
              </div>

              {/* Expanded detail */}
              {isSelected && (
                <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                  {/* Release Notes */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>
                      {t("release.notes") || "Release Notes"}
                    </label>
                    <textarea
                      value={release.releaseNotes}
                      onChange={(e) => updateRelease(release.id, { releaseNotes: e.target.value })}
                      placeholder="Write release notes..."
                      rows={4}
                      style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                    />
                  </div>

                  {/* Changelog */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                        {t("release.changelog") || "Changelog"} ({release.changelog.length})
                      </label>
                    </div>
                    {release.changelog.map((entry) => {
                      const clCfg = CHANGELOG_TYPE_CONFIG[entry.type];
                      return (
                        <div key={entry.id} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "4px 8px",
                          borderRadius: 6,
                          background: "rgba(255,255,255,0.02)",
                          marginBottom: 4,
                        }}>
                          <span style={{ fontSize: 12 }}>{clCfg.icon}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 3, background: `${clCfg.color}15`, color: clCfg.color, minWidth: 60, textAlign: "center" }}>
                            {clCfg.label}
                          </span>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", flex: 1 }}>{entry.description}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeChangelogEntry(release.id, entry.id); }}
                            style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.15)", cursor: "pointer", fontSize: 11 }}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                    {/* Add changelog entry */}
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <select
                        value={changelogType}
                        onChange={(e) => setChangelogType(e.target.value as ChangelogEntry["type"])}
                        style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.3)", color: "#eaeaea", fontSize: 11, outline: "none" }}
                      >
                        {Object.entries(CHANGELOG_TYPE_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.icon} {v.label}</option>
                        ))}
                      </select>
                      <input
                        value={changelogDesc}
                        onChange={(e) => setChangelogDesc(e.target.value)}
                        placeholder="Change description..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addChangelogEntry(release.id, changelogType, changelogDesc);
                            setChangelogDesc("");
                          }
                        }}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        onClick={() => { addChangelogEntry(release.id, changelogType, changelogDesc); setChangelogDesc(""); }}
                        style={btnStyle(true, "#10b981")}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Assets */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 6 }}>
                      {t("release.assets") || "Assets"} ({release.assets.length})
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {release.assets.map((asset) => {
                        const aCfg = ASSET_TYPE_CONFIG[asset.type];
                        return (
                          <div key={asset.id} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 10px",
                            borderRadius: 8,
                            background: `${aCfg.color}08`,
                            border: `1px solid ${aCfg.color}15`,
                          }}>
                            <span style={{ fontSize: 14 }}>{aCfg.icon}</span>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{asset.name}</div>
                              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{asset.size}</div>
                            </div>
                          </div>
                        );
                      })}
                      {release.assets.length === 0 && (
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>No assets attached</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={(e) => { e.stopPropagation(); advanceStatus(release.id); }} style={btnStyle(true, "#10b981")}>
                      ▶ Advance Status
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); markAsLatest(release.id); }} style={btnStyle(false, "#f59e0b")}>
                      ⭐ Mark as Latest
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteRelease(release.id); }}
                      style={btnStyle(false, "#ef4444")}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {filteredReleases.length === 0 && (
        <div style={{ ...cardStyle, textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{t("release.noReleases") || "No releases yet"}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>{t("release.noReleasesHint") || "Create your first release to start the publication workflow"}</div>
        </div>
      )}
    </div>
  );

  // ─── Render: Workflow View ────────────────────────────────────────

  const renderWorkflowView = () => {
    const statusOrder: PublicationStatus[] = ["draft", "preprint", "submitted", "peer-review", "revision", "accepted", "published"];

    return (
      <div>
        {/* Workflow pipeline visualization */}
        <div style={{ ...cardStyle, marginBottom: 20, overflow: "auto" }}>
          <div style={{ display: "flex", gap: 0, minWidth: 800 }}>
            {statusOrder.map((status, idx) => {
              const cfg = STATUS_CONFIG[status];
              const count = releases.filter((r) => r.status === status).length;
              return (
                <React.Fragment key={status}>
                  <div style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "12px 8px",
                    borderRadius: 10,
                    background: count > 0 ? `${cfg.color}08` : "transparent",
                    border: `1px solid ${count > 0 ? `${cfg.color}20` : "rgba(255,255,255,0.04)"}`,
                    minWidth: 100,
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{cfg.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: count > 0 ? cfg.color : "rgba(255,255,255,0.15)", marginTop: 4 }}>{count}</div>
                  </div>
                  {idx < statusOrder.length - 1 && (
                    <div style={{ display: "flex", alignItems: "center", padding: "0 4px", color: "rgba(255,255,255,0.15)", fontSize: 16 }}>→</div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Releases grouped by status */}
        {statusOrder.map((status) => {
          const statusReleases = releases.filter((r) => r.status === status);
          if (statusReleases.length === 0) return null;
          const cfg = STATUS_CONFIG[status];
          return (
            <div key={status} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                {cfg.icon} {cfg.label} ({statusReleases.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {statusReleases.map((release) => (
                  <div key={release.id} style={{
                    ...cardStyle,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    borderColor: selectedId === release.id ? `${cfg.color}30` : undefined,
                  }} onClick={() => setSelectedId(selectedId === release.id ? null : release.id)}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: RELEASE_TYPE_CONFIG[release.releaseType].color, fontFamily: "monospace" }}>
                      {release.version}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", flex: 1 }}>{release.title}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); advanceStatus(release.id); }}
                      style={btnStyle(true, "#10b981")}
                    >
                      ▶ Next
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Render: List View ────────────────────────────────────────────

  const renderListView = () => (
    <div style={{ overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {["Version", "Title", "Status", "Type", "Venue", "DOI", "Date", "Actions"].map((h) => (
              <th key={h} style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 11 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredReleases.map((release) => {
            const sCfg = STATUS_CONFIG[release.status];
            const rtCfg = RELEASE_TYPE_CONFIG[release.releaseType];
            return (
              <tr key={release.id} style={{ cursor: "pointer" }} onClick={() => setSelectedId(selectedId === release.id ? null : release.id)}>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontWeight: 700, fontFamily: "monospace", color: rtCfg.color }}>
                  {release.version}
                  {release.isLatest && <span style={{ marginLeft: 4, fontSize: 10 }}>⭐</span>}
                </td>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#fff", fontWeight: 600, maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {release.title}
                </td>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: `${sCfg.color}15`, color: sCfg.color }}>
                    {sCfg.icon} {sCfg.label}
                  </span>
                </td>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: rtCfg.color }}>{rtCfg.label}</span>
                </td>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                  {release.targetVenue || "—"}
                </td>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "monospace", fontSize: 10, color: release.doi ? "#67e8f9" : "rgba(255,255,255,0.2)" }}>
                  {release.doi || "—"}
                </td>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                  {new Date(release.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); advanceStatus(release.id); }}
                    style={{ ...btnStyle(true, "#10b981"), padding: "3px 8px", fontSize: 10 }}
                  >
                    ▶
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // ─── Main Render ───────────────────────────────────────────────────

  return (
    <PageShell>
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "12px" : "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "hsl(var(--foreground))", display: "flex", alignItems: "center", gap: 10 }}>
            📦 {t("release.title") || "Releases & Publications"}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "hsl(var(--muted-foreground))" }}>
            {t("release.subtitle") || "Manage versioned releases and track the publication workflow"}
          </p>
        </div>
        <button onClick={() => setShowCreateForm(true)} style={btnStyle(true, "#10b981")}>
          + {!isMobile ? (t("release.new") || "New Release") : ""}
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: t("release.total") || "Total", value: stats.total, color: "#6366f1" },
          { label: t("release.published") || "Published", value: stats.published, color: "hsl(var(--success))" },
          { label: t("release.inReview") || "In Review", value: stats.inReview, color: "hsl(var(--warning))" },
          { label: t("release.drafts") || "Drafts", value: stats.drafts, color: "#6b7280" },
          { label: "With DOI", value: stats.withDoi, color: "#06b6d4" },
        ].map((s) => (
          <div key={s.label} style={{
            ...cardStyle,
            borderColor: `${s.color}20`,
            background: `${s.color}06`,
            textAlign: "center",
            minWidth: 100,
            flex: 1,
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* View Mode & Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {(["timeline", "workflow", "list"] as const).map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={btnStyle(viewMode === mode)}>
              {mode === "timeline" ? "📅 Timeline" : mode === "workflow" ? "🔄 Workflow" : "📋 List"}
            </button>
          ))}
        </div>
        <span style={{ color: "rgba(255,255,255,0.1)", margin: "0 4px" }}>|</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setFilterStatus("all")} style={btnStyle(filterStatus === "all", "#71717a")}>All</button>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button key={key} onClick={() => setFilterStatus(key as PublicationStatus)} style={btnStyle(filterStatus === key, cfg.color)}>
              {cfg.icon} {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div style={{ ...cardStyle, borderColor: "rgba(16,185,129,0.2)", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
            {t("release.new") || "New Release"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>Version</label>
              <input value={newRelease.version} onChange={(e) => setNewRelease((p) => ({ ...p, version: e.target.value }))} placeholder="v1.2.0" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>Type</label>
              <select value={newRelease.releaseType} onChange={(e) => setNewRelease((p) => ({ ...p, releaseType: e.target.value as ReleaseType }))} style={{ ...inputStyle }}>
                {Object.entries(RELEASE_TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label} — {v.description}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>Target Venue</label>
              <input value={newRelease.targetVenue} onChange={(e) => setNewRelease((p) => ({ ...p, targetVenue: e.target.value }))} placeholder="Journal name..." style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>Title</label>
            <input value={newRelease.title} onChange={(e) => setNewRelease((p) => ({ ...p, title: e.target.value }))} placeholder="Release title..." style={inputStyle} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>Description</label>
            <textarea value={newRelease.description} onChange={(e) => setNewRelease((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description..." rows={2} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
              <input type="checkbox" checked={newRelease.isPreRelease} onChange={(e) => setNewRelease((p) => ({ ...p, isPreRelease: e.target.checked }))} />
              Pre-release
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setShowCreateForm(false)} style={btnStyle(false)}>Cancel</button>
            <button onClick={createRelease} style={btnStyle(true, "#10b981")}>Create Release</button>
          </div>
        </div>
      )}

      {/* Content */}
      {viewMode === "timeline" && renderTimelineView()}
      {viewMode === "workflow" && renderWorkflowView()}
      {viewMode === "list" && renderListView()}
    </div>
    </PageShell>
  );
};

export default ReleasePublicationPage;

/**
 * ClaimStatusChecksPage — CI/CD equivalent for scientific research
 * 
 * Shows automated check pipelines, their results, and status checks
 * on claims/theories before publishing. Uses AutomatedChecksContext.
 * 
 * Features:
 * - Pipeline overview with run history
 * - Individual check results with pass/fail/warning status
 * - Run pipelines manually or view scheduled runs
 * - Check configuration management
 * - Merge-blocking status indicators
 */

import React, { useState, useMemo, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import { PageShell } from "../components/layout/PageShell";
import { useIsMobile } from "../hooks/useMediaQuery";
import {
  useAutomatedChecks,
  CHECK_CATEGORY_CONFIG,
  CHECK_STATUS_CONFIG,
  PIPELINE_STATUS_CONFIG,
} from "../context/AutomatedChecksContext";
import type { CheckCategory, CheckStatus, AutomatedCheck, CheckPipeline, CheckRun } from "../context/AutomatedChecksContext";

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

const statCardStyle = (color: string): React.CSSProperties => ({
  ...cardStyle,
  borderColor: `${color}20`,
  background: `${color}06`,
  textAlign: "center" as const,
  minWidth: 110,
  flex: 1,
});

// ─── Sub-components ──────────────────────────────────────────────────

type TabView = "pipelines" | "checks" | "history" | "config";

interface CheckResultBadgeProps {
  status: CheckStatus;
  small?: boolean;
}

const CheckResultBadge: React.FC<CheckResultBadgeProps> = ({ status, small }) => {
  const cfg = CHECK_STATUS_CONFIG[status];
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: small ? 10 : 11,
      fontWeight: 600,
      padding: small ? "1px 6px" : "2px 8px",
      borderRadius: 4,
      background: cfg.bg,
      color: cfg.color,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

interface PipelineStatusBadgeProps {
  status: CheckPipeline["status"];
}

const PipelineStatusBadge: React.FC<PipelineStatusBadgeProps> = ({ status }) => {
  const cfg = PIPELINE_STATUS_CONFIG[status];
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: 4,
      background: `${cfg.color}15`,
      color: cfg.color,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ─── Main Component ──────────────────────────────────────────────────

const ClaimStatusChecksPage: React.FC = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const {
    checks,
    pipelines,
    checkRuns,
    createCheck,
    updateCheck,
    deleteCheck,
    toggleCheck,
    createPipeline,
    deletePipeline,
    runPipeline,
    getLatestRun,
    getRunsForPipeline,
    stats,
  } = useAutomatedChecks();

  const [activeTab, setActiveTab] = useState<TabView>("pipelines");
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [showAddCheck, setShowAddCheck] = useState(false);
  const [showAddPipeline, setShowAddPipeline] = useState(false);

  // New check form
  const [newCheck, setNewCheck] = useState({
    name: "",
    description: "",
    category: "consistency" as CheckCategory,
    enabled: true,
    required: false,
  });

  // New pipeline form
  const [newPipeline, setNewPipeline] = useState({
    name: "",
    description: "",
    resourceId: "branch-main",
    checkIds: [] as string[],
    runOnCommit: false,
    blockMergeOnFailure: false,
  });

  // ─── Computed ──────────────────────────────────────────────────────

  const selectedPipeline = useMemo(
    () => pipelines.find((p) => p.id === selectedPipelineId) || null,
    [pipelines, selectedPipelineId]
  );

  const selectedPipelineRuns = useMemo(
    () => selectedPipelineId ? getRunsForPipeline(selectedPipelineId) : [],
    [selectedPipelineId, getRunsForPipeline]
  );

  const sortedCheckRuns = useMemo(
    () => [...checkRuns].sort((a, b) => b.startedAt - a.startedAt),
    [checkRuns]
  );

  // ─── Actions ───────────────────────────────────────────────────────

  const handleCreateCheck = useCallback(() => {
    if (!newCheck.name.trim()) return;
    createCheck({
      name: newCheck.name.trim(),
      description: newCheck.description.trim(),
      category: newCheck.category,
      enabled: newCheck.enabled,
      required: newCheck.required,
      autoRunIntervalMs: 0,
      config: {},
    });
    setNewCheck({ name: "", description: "", category: "consistency", enabled: true, required: false });
    setShowAddCheck(false);
  }, [newCheck, createCheck]);

  const handleCreatePipeline = useCallback(() => {
    if (!newPipeline.name.trim() || newPipeline.checkIds.length === 0) return;
    createPipeline({
      name: newPipeline.name.trim(),
      description: newPipeline.description.trim(),
      resourceId: newPipeline.resourceId,
      resourceType: "branch",
      checkIds: newPipeline.checkIds,
      runOnCommit: newPipeline.runOnCommit,
      blockMergeOnFailure: newPipeline.blockMergeOnFailure,
    });
    setNewPipeline({ name: "", description: "", resourceId: "branch-main", checkIds: [], runOnCommit: false, blockMergeOnFailure: false });
    setShowAddPipeline(false);
  }, [newPipeline, createPipeline]);

  const handleRunPipeline = useCallback((pipelineId: string) => {
    runPipeline(pipelineId);
  }, [runPipeline]);

  const togglePipelineCheck = useCallback((checkId: string) => {
    setNewPipeline((prev) => ({
      ...prev,
      checkIds: prev.checkIds.includes(checkId)
        ? prev.checkIds.filter((id) => id !== checkId)
        : [...prev.checkIds, checkId],
    }));
  }, []);

  // ─── Render: Pipelines Tab ────────────────────────────────────────

  const renderPipelinesTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Add Pipeline Form */}
      {showAddPipeline && (
        <div style={{ ...cardStyle, borderColor: "rgba(99,102,241,0.2)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
            {t("checks.newPipeline") || "New Pipeline"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>Name</label>
              <input
                value={newPipeline.name}
                onChange={(e) => setNewPipeline((p) => ({ ...p, name: e.target.value }))}
                placeholder="Pipeline name..."
                style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>Description</label>
              <input
                value={newPipeline.description}
                onChange={(e) => setNewPipeline((p) => ({ ...p, description: e.target.value }))}
                placeholder="Pipeline description..."
                style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 6 }}>
              Select Checks ({newPipeline.checkIds.length} selected)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {checks.map((check) => {
                const catCfg = CHECK_CATEGORY_CONFIG[check.category];
                const selected = newPipeline.checkIds.includes(check.id);
                return (
                  <button
                    key={check.id}
                    onClick={() => togglePipelineCheck(check.id)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      border: selected ? `1px solid ${catCfg.color}50` : "1px solid rgba(255,255,255,0.08)",
                      background: selected ? `${catCfg.color}15` : "transparent",
                      color: selected ? catCfg.color : "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                    }}
                  >
                    {catCfg.icon} {check.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={newPipeline.runOnCommit}
                onChange={(e) => setNewPipeline((p) => ({ ...p, runOnCommit: e.target.checked }))}
              />
              Run on commit
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={newPipeline.blockMergeOnFailure}
                onChange={(e) => setNewPipeline((p) => ({ ...p, blockMergeOnFailure: e.target.checked }))}
              />
              Block merge on failure
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setShowAddPipeline(false)} style={btnStyle(false)}>Cancel</button>
            <button onClick={handleCreatePipeline} style={btnStyle(true, "#10b981")}>Create Pipeline</button>
          </div>
        </div>
      )}

      {/* Pipeline List */}
      {pipelines.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚙️</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{t("checks.noPipelines") || "No pipelines configured"}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>{t("checks.noPipelinesHint") || "Create a pipeline to start running automated checks"}</div>
        </div>
      ) : (
        pipelines.map((pipeline) => {
          const latestRun = getLatestRun(pipeline.id);
          const pipelineChecks = pipeline.checkIds.map((cid) => checks.find((c) => c.id === cid)).filter(Boolean) as AutomatedCheck[];
          const isSelected = selectedPipelineId === pipeline.id;

          return (
            <div
              key={pipeline.id}
              style={{
                ...cardStyle,
                borderColor: isSelected ? "rgba(99,102,241,0.3)" : undefined,
                cursor: "pointer",
              }}
              onClick={() => setSelectedPipelineId(isSelected ? null : pipeline.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>⚙️</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{pipeline.name}</span>
                    <PipelineStatusBadge status={pipeline.status} />
                    {pipeline.blockMergeOnFailure && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: "rgba(239,68,68,0.1)", color: "#fca5a5" }}>
                        🔒 Merge-blocking
                      </span>
                    )}
                    {pipeline.runOnCommit && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: "rgba(99,102,241,0.1)", color: "#a5b4fc" }}>
                        🔄 Auto-run
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{pipeline.description}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRunPipeline(pipeline.id); }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    border: "1px solid rgba(16,185,129,0.3)",
                    background: "rgba(16,185,129,0.1)",
                    color: "#6ee7b7",
                    cursor: "pointer",
                  }}
                >
                  ▶ {t("checks.run") || "Run"}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deletePipeline(pipeline.id); }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    border: "1px solid rgba(239,68,68,0.2)",
                    background: "rgba(239,68,68,0.06)",
                    color: "#fca5a5",
                    cursor: "pointer",
                  }}
                >
                  🗑
                </button>
              </div>

              {/* Check list within pipeline */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {pipelineChecks.map((check) => {
                  const catCfg = CHECK_CATEGORY_CONFIG[check.category];
                  return (
                    <div key={check.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}>
                      <span style={{ fontSize: 12 }}>{catCfg.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{check.name}</span>
                      {check.lastResult && <CheckResultBadge status={check.lastResult.status} small />}
                      {check.required && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "0 4px", borderRadius: 3, background: "rgba(239,68,68,0.1)", color: "#fca5a5" }}>REQ</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Last run info */}
              {latestRun && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "flex", gap: 12 }}>
                  <span>Last run: {new Date(latestRun.startedAt).toLocaleString()}</span>
                  <span>Duration: {latestRun.completedAt ? `${latestRun.completedAt - latestRun.startedAt}ms` : "—"}</span>
                  <span>Triggered by: {latestRun.triggeredBy}</span>
                  <span>Type: {latestRun.triggerType}</span>
                </div>
              )}

              {/* Expanded: show latest run results */}
              {isSelected && latestRun && (
                <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
                    Latest Run Results
                  </div>
                  {latestRun.results.map((result) => {
                    const check = checks.find((c) => c.id === result.checkId);
                    const catCfg = check ? CHECK_CATEGORY_CONFIG[check.category] : null;
                    const statusCfg = CHECK_STATUS_CONFIG[result.status];
                    return (
                      <div key={result.id} style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: statusCfg.bg,
                        border: `1px solid ${statusCfg.color}15`,
                        marginBottom: 6,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          {catCfg && <span style={{ fontSize: 14 }}>{catCfg.icon}</span>}
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{check?.name || "Unknown"}</span>
                          <CheckResultBadge status={result.status} />
                          <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{result.duration}ms</span>
                        </div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{result.message}</div>
                        {result.details.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {result.details.map((detail, i) => (
                              <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", paddingLeft: 8, borderLeft: `2px solid ${statusCfg.color}20` }}>
                                {detail}
                              </div>
                            ))}
                          </div>
                        )}
                        {result.affectedItems.length > 0 && (
                          <div style={{ marginTop: 4, fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                            Affected: {result.affectedItems.join(", ")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  // ─── Render: Checks Tab ───────────────────────────────────────────

  const renderChecksTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Add Check Form */}
      {showAddCheck && (
        <div style={{ ...cardStyle, borderColor: "rgba(99,102,241,0.2)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
            {t("checks.newCheck") || "New Check"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>Name</label>
              <input
                value={newCheck.name}
                onChange={(e) => setNewCheck((p) => ({ ...p, name: e.target.value }))}
                placeholder="Check name..."
                style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>Category</label>
              <select
                value={newCheck.category}
                onChange={(e) => setNewCheck((p) => ({ ...p, category: e.target.value as CheckCategory }))}
                style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 12, outline: "none" }}
              >
                {Object.entries(CHECK_CATEGORY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>Description</label>
            <input
              value={newCheck.description}
              onChange={(e) => setNewCheck((p) => ({ ...p, description: e.target.value }))}
              placeholder="What does this check verify?"
              style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
              <input type="checkbox" checked={newCheck.required} onChange={(e) => setNewCheck((p) => ({ ...p, required: e.target.checked }))} />
              Required for publishing
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setShowAddCheck(false)} style={btnStyle(false)}>Cancel</button>
            <button onClick={handleCreateCheck} style={btnStyle(true, "#10b981")}>Create Check</button>
          </div>
        </div>
      )}

      {/* Check List */}
      {checks.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{t("checks.noChecks") || "No checks configured"}</div>
        </div>
      ) : (
        checks.map((check) => {
          const catCfg = CHECK_CATEGORY_CONFIG[check.category];
          return (
            <div key={check.id} style={{
              ...cardStyle,
              borderColor: `${catCfg.color}15`,
              opacity: check.enabled ? 1 : 0.5,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{catCfg.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{check.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: `${catCfg.color}15`, color: catCfg.color }}>{catCfg.label}</span>
                    {check.required && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 3, background: "rgba(239,68,68,0.1)", color: "#fca5a5" }}>REQUIRED</span>
                    )}
                    {check.lastResult && <CheckResultBadge status={check.lastResult.status} />}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{check.description}</div>
                  {check.lastResult && (
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                      Last: {check.lastResult.message} ({check.lastResult.duration}ms)
                    </div>
                  )}
                </div>
                <button
                  onClick={() => toggleCheck(check.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    border: check.enabled ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.1)",
                    background: check.enabled ? "rgba(16,185,129,0.1)" : "transparent",
                    color: check.enabled ? "#6ee7b7" : "rgba(255,255,255,0.3)",
                    cursor: "pointer",
                  }}
                >
                  {check.enabled ? "✓ Enabled" : "Disabled"}
                </button>
                <button
                  onClick={() => deleteCheck(check.id)}
                  style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.15)", cursor: "pointer", fontSize: 14, padding: "4px 8px" }}
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // ─── Render: History Tab ──────────────────────────────────────────

  const renderHistoryTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {sortedCheckRuns.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{t("checks.noRuns") || "No check runs yet"}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>{t("checks.noRunsHint") || "Run a pipeline to see results here"}</div>
        </div>
      ) : (
        sortedCheckRuns.map((run) => {
          const pipeline = pipelines.find((p) => p.id === run.pipelineId);
          const statusCfg = PIPELINE_STATUS_CONFIG[run.status];
          const passed = run.results.filter((r) => r.status === "pass").length;
          const failed = run.results.filter((r) => r.status === "fail").length;
          const warnings = run.results.filter((r) => r.status === "warning").length;

          return (
            <div key={run.id} style={{
              ...cardStyle,
              borderColor: `${statusCfg.color}15`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{statusCfg.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{pipeline?.name || "Unknown Pipeline"}</span>
                    <PipelineStatusBadge status={run.status} />
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                      {run.triggerType}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                    {new Date(run.startedAt).toLocaleString()} · {run.triggeredBy} · {run.completedAt ? `${run.completedAt - run.startedAt}ms` : "running..."}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, fontSize: 11, fontWeight: 600 }}>
                  {passed > 0 && <span style={{ color: "#10b981" }}>✅ {passed}</span>}
                  {failed > 0 && <span style={{ color: "#ef4444" }}>❌ {failed}</span>}
                  {warnings > 0 && <span style={{ color: "#f59e0b" }}>⚠️ {warnings}</span>}
                </div>
              </div>

              {/* Results summary */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {run.results.map((result) => {
                  const check = checks.find((c) => c.id === result.checkId);
                  return (
                    <div key={result.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: CHECK_STATUS_CONFIG[result.status].bg,
                      fontSize: 10,
                    }}>
                      <span>{CHECK_STATUS_CONFIG[result.status].icon}</span>
                      <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{check?.name || "?"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // ─── Render: Config Tab ───────────────────────────────────────────

  const renderConfigTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
          {t("checks.configTitle") || "Check Configuration"}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16, lineHeight: 1.6 }}>
          {t("checks.configDesc") || "Configure which checks are required before publishing, and set up automated pipelines to run on every commit or merge request."}
        </div>

        {/* Required checks summary */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
            Required Checks ({checks.filter((c) => c.required).length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {checks.filter((c) => c.required).map((check) => {
              const catCfg = CHECK_CATEGORY_CONFIG[check.category];
              return (
                <div key={check.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: `${catCfg.color}08`,
                  border: `1px solid ${catCfg.color}20`,
                }}>
                  <span>{catCfg.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: catCfg.color }}>{check.name}</span>
                  {check.lastResult && <CheckResultBadge status={check.lastResult.status} small />}
                </div>
              );
            })}
            {checks.filter((c) => c.required).length === 0 && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No required checks configured</span>
            )}
          </div>
        </div>

        {/* Merge-blocking pipelines */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
            Merge-Blocking Pipelines ({pipelines.filter((p) => p.blockMergeOnFailure).length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {pipelines.filter((p) => p.blockMergeOnFailure).map((pipeline) => (
              <div key={pipeline.id} style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.15)",
              }}>
                <span>🔒</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fca5a5" }}>{pipeline.name}</span>
                <PipelineStatusBadge status={pipeline.status} />
              </div>
            ))}
            {pipelines.filter((p) => p.blockMergeOnFailure).length === 0 && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No merge-blocking pipelines</span>
            )}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
          Checks by Category
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
          {Object.entries(CHECK_CATEGORY_CONFIG).map(([key, cfg]) => {
            const categoryChecks = checks.filter((c) => c.category === key);
            return (
              <div key={key} style={{
                padding: "12px 16px",
                borderRadius: 10,
                background: `${cfg.color}06`,
                border: `1px solid ${cfg.color}15`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{cfg.description}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                  {categoryChecks.length} check{categoryChecks.length !== 1 ? "s" : ""} · {categoryChecks.filter((c) => c.enabled).length} enabled
                </div>
              </div>
            );
          })}
        </div>
      </div>
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
            ✅ {t("checks.title") || "Claim Status Checks"}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "hsl(var(--muted-foreground))" }}>
            {t("checks.subtitle") || "Automated validation pipelines for claims, evidence, and methodology"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowAddCheck(true)} style={btnStyle(false, "#6366f1")}>
            + {!isMobile ? (t("checks.newCheck") || "New Check") : ""}</button>
          <button onClick={() => setShowAddPipeline(true)} style={btnStyle(false, "#10b981")}>
            + {t("checks.newPipeline") || "New Pipeline"}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={statCardStyle("#6366f1")}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#a5b4fc" }}>{stats.totalChecks}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{t("checks.totalChecks") || "Total Checks"}</div>
        </div>
        <div style={statCardStyle("#10b981")}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#6ee7b7" }}>{stats.enabledChecks}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{t("checks.enabled") || "Enabled"}</div>
        </div>
        <div style={statCardStyle("#f59e0b")}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#fcd34d" }}>{stats.totalPipelines}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{t("checks.pipelines") || "Pipelines"}</div>
        </div>
        <div style={statCardStyle("#06b6d4")}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#67e8f9" }}>{stats.totalRuns}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{t("checks.runs") || "Runs"}</div>
        </div>
        <div style={statCardStyle(stats.passRate >= 80 ? "#10b981" : stats.passRate >= 50 ? "#f59e0b" : "#ef4444")}>
          <div style={{ fontSize: 24, fontWeight: 700, color: stats.passRate >= 80 ? "#6ee7b7" : stats.passRate >= 50 ? "#fcd34d" : "#fca5a5" }}>{stats.passRate}%</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{t("checks.passRate") || "Pass Rate"}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {(["pipelines", "checks", "history", "config"] as TabView[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={btnStyle(activeTab === tab)}>
            {tab === "pipelines" ? "⚙️ Pipelines" : tab === "checks" ? "🔍 Checks" : tab === "history" ? "📋 History" : "🔧 Config"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "pipelines" && renderPipelinesTab()}
      {activeTab === "checks" && renderChecksTab()}
      {activeTab === "history" && renderHistoryTab()}
      {activeTab === "config" && renderConfigTab()}
    </div>
    </PageShell>
  );
};

export default ClaimStatusChecksPage;

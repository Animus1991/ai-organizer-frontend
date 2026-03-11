/**
 * BranchProtectionRules — GitHub-style branch protection & auto-merge UI
 * Manages protection rules for theory branches
 * Persists to localStorage
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheoryBranching } from "../context/TheoryBranchingContext";

// ─── Types ───────────────────────────────────────────────────
export interface BranchRule {
  id: string; branchPattern: string; enabled: boolean; requireReviews: boolean; requiredReviewCount: number;
  dismissStaleReviews: boolean; requireStatusChecks: boolean; statusChecks: string[];
  restrictPushAccess: boolean; allowedPushers: string[]; requireLinearHistory: boolean;
  allowForcePush: boolean; allowDeletion: boolean; autoMergeEnabled: boolean;
  autoMergeMethod: "merge" | "squash" | "rebase"; locked: boolean; createdAt: number; updatedAt: number;
}

export interface MergeRequest {
  id: string; title: string; sourceBranch: string; targetBranch: string; author: string;
  status: "open" | "approved" | "changes_requested" | "merged" | "closed";
  reviewers: { name: string; status: "pending" | "approved" | "changes_requested" }[];
  checksPass: boolean; autoMerge: boolean; createdAt: number; updatedAt: number;
}

interface BranchProtectionRulesProps { open: boolean; onClose: () => void; }

const STORAGE_KEYS = { rules: "bp-rules", mergeRequests: "bp-merge-requests" };
function loadFromStorage<T>(key: string, fallback: T): T { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
function saveToStorage<T>(key: string, data: T) { localStorage.setItem(key, JSON.stringify(data)); }
function generateId(): string { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
function timeAgo(ts: number): string { const diff = Date.now() - ts; const mins = Math.floor(diff / 60000); if (mins < 1) return "just now"; if (mins < 60) return `${mins}m ago`; const hrs = Math.floor(mins / 60); if (hrs < 24) return `${hrs}h ago`; const days = Math.floor(hrs / 24); return `${days}d ago`; }

const DEFAULT_STATUS_CHECKS = ["Evidence Coverage Check", "Contradiction Scan", "Citation Verification", "Methodology Review", "Statistical Validation", "Peer Review Approval"];

function generateDefaultRules(): BranchRule[] {
  const now = Date.now();
  return [
    { id: generateId(), branchPattern: "main", enabled: true, requireReviews: true, requiredReviewCount: 2, dismissStaleReviews: true, requireStatusChecks: true, statusChecks: ["Evidence Coverage Check", "Contradiction Scan", "Citation Verification"], restrictPushAccess: true, allowedPushers: ["Principal Investigator"], requireLinearHistory: false, allowForcePush: false, allowDeletion: false, autoMergeEnabled: false, autoMergeMethod: "squash", locked: false, createdAt: now - 14 * 86400000, updatedAt: now - 2 * 86400000 },
    { id: generateId(), branchPattern: "develop", enabled: true, requireReviews: true, requiredReviewCount: 1, dismissStaleReviews: false, requireStatusChecks: true, statusChecks: ["Evidence Coverage Check"], restrictPushAccess: false, allowedPushers: [], requireLinearHistory: false, allowForcePush: false, allowDeletion: false, autoMergeEnabled: true, autoMergeMethod: "merge", locked: false, createdAt: now - 10 * 86400000, updatedAt: now - 1 * 86400000 },
  ];
}

// ─── Component ───────────────────────────────────────────────
export default function BranchProtectionRules({ open, onClose }: BranchProtectionRulesProps) {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { branches, mergeRequests: contextMRs, updateMergeRequest, executeMerge, closeMergeRequest } = useTheoryBranching();

  type Tab = "rules" | "merges";
  const [activeTab, setActiveTab] = useState<Tab>("rules");
  const [editingRule, setEditingRule] = useState<BranchRule | null>(null);
  const [selectedMR, setSelectedMR] = useState<MergeRequest | null>(null);

  const [rules, setRules] = useState<BranchRule[]>(() => { const stored = loadFromStorage<BranchRule[]>(STORAGE_KEYS.rules, []); return stored.length > 0 ? stored : generateDefaultRules(); });

  const mergeRequests: MergeRequest[] = useMemo(() => {
    return contextMRs.map(mr => {
      const sourceBranch = branches.find(b => b.id === mr.sourceBranchId);
      const targetBranch = branches.find(b => b.id === mr.targetBranchId);
      return { id: mr.id, title: mr.title, sourceBranch: sourceBranch?.name || mr.sourceBranchId, targetBranch: targetBranch?.name || mr.targetBranchId, author: mr.author, status: mr.status === 'conflict' ? 'changes_requested' : mr.status as MergeRequest['status'], reviewers: mr.reviewers.map(name => ({ name, status: 'pending' as const })), checksPass: mr.conflicts.length === 0, autoMerge: false, createdAt: mr.createdAt, updatedAt: mr.updatedAt };
    });
  }, [contextMRs, branches]);

  useEffect(() => { saveToStorage(STORAGE_KEYS.rules, rules); }, [rules]);
  const openMRCount = useMemo(() => mergeRequests.filter((mr) => mr.status === "open" || mr.status === "approved").length, [mergeRequests]);

  const toggleRule = useCallback((id: string) => { setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled, updatedAt: Date.now() } : r)); }, []);
  const deleteRule = useCallback((id: string) => { if (!window.confirm("Delete this branch protection rule?")) return; setRules((prev) => prev.filter((r) => r.id !== id)); if (editingRule?.id === id) setEditingRule(null); }, [editingRule]);
  const saveRule = useCallback((rule: BranchRule) => {
    setRules((prev) => { const exists = prev.find((r) => r.id === rule.id); if (exists) return prev.map((r) => r.id === rule.id ? { ...rule, updatedAt: Date.now() } : r); return [...prev, { ...rule, createdAt: Date.now(), updatedAt: Date.now() }]; });
    setEditingRule(null);
  }, []);
  const createNewRule = useCallback(() => { setEditingRule({ id: generateId(), branchPattern: "", enabled: true, requireReviews: false, requiredReviewCount: 1, dismissStaleReviews: false, requireStatusChecks: false, statusChecks: [], restrictPushAccess: false, allowedPushers: [], requireLinearHistory: false, allowForcePush: false, allowDeletion: true, autoMergeEnabled: false, autoMergeMethod: "merge", locked: false, createdAt: Date.now(), updatedAt: Date.now() }); }, []);

  const updateMRStatus = useCallback((id: string, status: MergeRequest["status"]) => {
    const contextStatus = status === 'changes_requested' ? 'conflict' : status;
    if (status === 'merged') executeMerge(id); else if (status === 'closed') closeMergeRequest(id); else updateMergeRequest(id, { status: contextStatus as 'open' | 'merged' | 'closed' | 'conflict' });
    if (selectedMR?.id === id) setSelectedMR((prev) => prev ? { ...prev, status, updatedAt: Date.now() } : prev);
  }, [selectedMR, updateMergeRequest, executeMerge, closeMergeRequest]);

  const toggleAutoMerge = useCallback((_id: string) => {}, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") { if (editingRule) setEditingRule(null); else if (selectedMR) setSelectedMR(null); else onClose(); } };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, [open, editingRule, selectedMR, onClose]);

  if (!open) return null;

  const inputCls = "w-full px-2.5 py-2 rounded-md border border-border bg-muted/30 text-foreground text-xs outline-none font-inherit focus:border-primary transition-colors";

  const STATUS_COLORS: Record<MergeRequest["status"], { color: string; icon: string; label: string }> = {
    open: { color: "#10b981", icon: "🟢", label: "Open" }, approved: { color: "#6366f1", icon: "✅", label: "Approved" },
    changes_requested: { color: "#f59e0b", icon: "🔄", label: "Changes Requested" }, merged: { color: "#8b5cf6", icon: "🟣", label: "Merged" },
    closed: { color: "#6b7280", icon: "⚫", label: "Closed" },
  };

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-foreground">{label}</span>
      <button onClick={() => onChange(!checked)} className="relative w-9 h-5 rounded-full border-0 cursor-pointer transition-colors" style={{ background: checked ? "#6366f1" : "hsl(var(--muted))" }}>
        <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-[left]" style={{ left: checked ? "18px" : "2px" }} />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[680px] max-w-[95vw] max-h-[90vh] bg-background border border-border rounded-2xl flex flex-col overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {(editingRule || selectedMR) && <button onClick={() => { setEditingRule(null); setSelectedMR(null); }} className="px-2 py-1 rounded-md border border-border bg-transparent text-muted-foreground text-xs cursor-pointer hover:bg-muted">← Back</button>}
            <span className="text-lg">🛡️</span>
            <div>
              <div className="text-[15px] font-bold text-foreground">{editingRule ? (editingRule.branchPattern ? `Edit: ${editingRule.branchPattern}` : "New Rule") : selectedMR ? `MR: ${selectedMR.title.slice(0, 30)}...` : t("branchProtection.title") || "Branch Protection"}</div>
              <div className="text-[11px] text-muted-foreground">{rules.length} rules · {openMRCount} open merge requests</div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md border border-border bg-transparent text-muted-foreground text-sm cursor-pointer flex items-center justify-center hover:bg-muted">✕</button>
        </div>

        {/* Tabs */}
        {!editingRule && !selectedMR && (
          <div className="flex border-b border-border">
            {([{ key: "rules" as Tab, label: "Protection Rules", icon: "🛡️", count: rules.length }, { key: "merges" as Tab, label: "Merge Requests", icon: "🔀", count: openMRCount }]).map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer bg-transparent border-x-0 border-t-0 ${activeTab === tab.key ? "font-semibold text-foreground border-primary" : "font-normal text-muted-foreground border-transparent"}`}>
                <span>{tab.icon}</span> {tab.label}
                <span className="px-1.5 py-0.5 rounded-lg text-[10px] bg-muted">{tab.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* RULES LIST */}
          {activeTab === "rules" && !editingRule && (
            <div className="p-4">
              <button onClick={createNewRule} className="w-full p-2.5 mb-3 rounded-lg border border-dashed border-border bg-transparent text-primary text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 hover:bg-primary/5">+ Add Branch Protection Rule</button>
              {rules.map((rule) => (
                <div key={rule.id} className="p-3.5 rounded-xl border border-border bg-muted/20 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono bg-primary/10 text-primary border border-primary/30">🌿 {rule.branchPattern}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${rule.enabled ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>{rule.enabled ? "ACTIVE" : "DISABLED"}</span>
                      {rule.locked && <span className="text-xs" title="Branch is locked">🔒</span>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toggleRule(rule.id)} className="px-2 py-1 rounded text-[10px] border border-border bg-transparent text-muted-foreground cursor-pointer hover:bg-muted">{rule.enabled ? "Disable" : "Enable"}</button>
                      <button onClick={() => setEditingRule({ ...rule })} className="px-2 py-1 rounded text-[10px] border border-border bg-transparent text-muted-foreground cursor-pointer hover:bg-muted">Edit</button>
                      <button onClick={() => deleteRule(rule.id)} className="px-2 py-1 rounded text-[10px] border border-destructive/30 bg-transparent text-destructive cursor-pointer hover:bg-destructive/10">Delete</button>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap text-[10px]">
                    {rule.requireReviews && <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400">👥 {rule.requiredReviewCount} review{rule.requiredReviewCount !== 1 ? "s" : ""}</span>}
                    {rule.requireStatusChecks && <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">✓ {rule.statusChecks.length} checks</span>}
                    {rule.restrictPushAccess && <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">🔒 Push restricted</span>}
                    {rule.autoMergeEnabled && <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400">🤖 Auto-merge ({rule.autoMergeMethod})</span>}
                    {!rule.allowForcePush && <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">No force push</span>}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1.5">Updated {timeAgo(rule.updatedAt)}</div>
                </div>
              ))}
            </div>
          )}

          {/* RULE EDITOR */}
          {editingRule && (
            <div className="p-4 space-y-3">
              <div><label className="text-[11px] font-semibold text-muted-foreground block mb-1">Branch Pattern *</label><input type="text" value={editingRule.branchPattern} onChange={(e) => setEditingRule({ ...editingRule, branchPattern: e.target.value })} placeholder="e.g., main, develop, release/*" className={inputCls} autoFocus /></div>

              <div className="border-t border-border pt-3">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Review Requirements</div>
                <Toggle checked={editingRule.requireReviews} onChange={(v) => setEditingRule({ ...editingRule, requireReviews: v })} label="Require pull request reviews before merging" />
                {editingRule.requireReviews && (
                  <div className="ml-4 mb-2">
                    <div className="flex items-center gap-2 mb-1"><span className="text-[11px] text-muted-foreground">Required approving reviews:</span>
                      <select value={editingRule.requiredReviewCount} onChange={(e) => setEditingRule({ ...editingRule, requiredReviewCount: parseInt(e.target.value) })} className={`${inputCls} w-[60px]`}>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}</select>
                    </div>
                    <Toggle checked={editingRule.dismissStaleReviews} onChange={(v) => setEditingRule({ ...editingRule, dismissStaleReviews: v })} label="Dismiss stale reviews when new changes are pushed" />
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-3">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status Checks</div>
                <Toggle checked={editingRule.requireStatusChecks} onChange={(v) => setEditingRule({ ...editingRule, requireStatusChecks: v })} label="Require status checks to pass before merging" />
                {editingRule.requireStatusChecks && (
                  <div className="ml-4 mb-2">
                    {DEFAULT_STATUS_CHECKS.map((check) => {
                      const isSelected = editingRule.statusChecks.includes(check);
                      return <button key={check} onClick={() => { const checks = isSelected ? editingRule.statusChecks.filter((c) => c !== check) : [...editingRule.statusChecks, check]; setEditingRule({ ...editingRule, statusChecks: checks }); }}
                        className={`flex items-center gap-1.5 w-full px-2 py-1.5 mb-0.5 rounded border-0 text-[11px] cursor-pointer text-left transition-colors ${isSelected ? "bg-emerald-500/10 text-emerald-400" : "bg-transparent text-muted-foreground hover:bg-muted/50"}`}>
                        <span>{isSelected ? "✓" : "○"}</span> {check}
                      </button>;
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-3">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Merge Settings</div>
                <Toggle checked={editingRule.autoMergeEnabled} onChange={(v) => setEditingRule({ ...editingRule, autoMergeEnabled: v })} label="Enable auto-merge when all checks pass" />
                {editingRule.autoMergeEnabled && (
                  <div className="ml-4 mb-2 flex gap-1.5">
                    {(["merge", "squash", "rebase"] as const).map((method) => (
                      <button key={method} onClick={() => setEditingRule({ ...editingRule, autoMergeMethod: method })} className="px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors" style={{ border: editingRule.autoMergeMethod === method ? "2px solid #6366f1" : "1px solid hsl(var(--border))", background: editingRule.autoMergeMethod === method ? "rgba(99,102,241,0.12)" : "transparent", color: editingRule.autoMergeMethod === method ? "#818cf8" : "hsl(var(--muted-foreground))" }}>{method}</button>
                    ))}
                  </div>
                )}
                <Toggle checked={editingRule.requireLinearHistory} onChange={(v) => setEditingRule({ ...editingRule, requireLinearHistory: v })} label="Require linear history" />
                <Toggle checked={!editingRule.allowForcePush} onChange={(v) => setEditingRule({ ...editingRule, allowForcePush: !v })} label="Block force pushes" />
                <Toggle checked={!editingRule.allowDeletion} onChange={(v) => setEditingRule({ ...editingRule, allowDeletion: !v })} label="Block branch deletion" />
                <Toggle checked={editingRule.locked} onChange={(v) => setEditingRule({ ...editingRule, locked: v })} label="Lock branch (read-only)" />
              </div>

              <button onClick={() => saveRule(editingRule)} disabled={!editingRule.branchPattern.trim()} className={`w-full py-2.5 mt-4 rounded-lg border-0 text-[13px] font-semibold transition-colors ${editingRule.branchPattern.trim() ? "bg-primary text-primary-foreground cursor-pointer hover:opacity-90" : "bg-muted text-muted-foreground/40 cursor-not-allowed"}`}>🛡️ Save Protection Rule</button>
            </div>
          )}

          {/* MERGE REQUESTS */}
          {activeTab === "merges" && !selectedMR && (
            <div className="p-4">
              {mergeRequests.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground"><div className="text-3xl mb-2">🔀</div><div className="text-sm font-semibold">No merge requests</div></div>
              ) : mergeRequests.map((mr) => {
                const statusCfg = STATUS_COLORS[mr.status];
                return (
                  <button key={mr.id} onClick={() => setSelectedMR(mr)} className="w-full p-3 rounded-lg border border-border bg-muted/20 mb-1.5 cursor-pointer text-left transition-all hover:bg-muted/40">
                    <div className="flex items-start gap-2.5">
                      <span className="text-sm">{statusCfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-foreground mb-1">{mr.title}</div>
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground">
                          <span className="font-mono">{mr.sourceBranch}</span><span>→</span><span className="font-mono">{mr.targetBranch}</span>
                          <span>·</span><span>{mr.author}</span><span>·</span><span>{timeAgo(mr.updatedAt)}</span>
                          {mr.autoMerge && <span className="text-violet-400">🤖 auto-merge</span>}
                          {mr.checksPass ? <span className="text-emerald-400">✓ checks</span> : <span className="text-destructive">✗ checks</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* MR DETAIL */}
          {selectedMR && (
            <div className="p-4">
              <h3 className="text-base font-bold text-foreground mb-2">{selectedMR.title}</h3>
              <div className="flex items-center gap-2 flex-wrap mb-3 text-[11px]">
                <span className="px-2 py-0.5 rounded-xl font-semibold" style={{ background: `${STATUS_COLORS[selectedMR.status].color}18`, color: STATUS_COLORS[selectedMR.status].color }}>{STATUS_COLORS[selectedMR.status].icon} {STATUS_COLORS[selectedMR.status].label}</span>
                <span className="font-mono text-muted-foreground">{selectedMR.sourceBranch} → {selectedMR.targetBranch}</span>
                <span className="text-muted-foreground">by {selectedMR.author} · {timeAgo(selectedMR.createdAt)}</span>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-muted/20 mb-3">
                <div className="text-[11px] font-semibold text-muted-foreground mb-1.5">Status Checks</div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={selectedMR.checksPass ? "text-emerald-400" : "text-destructive"}>{selectedMR.checksPass ? "✓ All checks passed" : "✗ Some checks failed"}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-muted/20 mb-3">
                <div className="text-[11px] font-semibold text-muted-foreground mb-1.5">Reviewers</div>
                {selectedMR.reviewers.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1 text-xs">
                    <span className="text-foreground">{r.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${r.status === "approved" ? "bg-emerald-500/10 text-emerald-400" : r.status === "changes_requested" ? "bg-amber-500/10 text-amber-400" : "text-muted-foreground"}`}>
                      {r.status === "approved" ? "✓ Approved" : r.status === "changes_requested" ? "🔄 Changes" : "⏳ Pending"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-muted/20 mb-3">
                <Toggle checked={selectedMR.autoMerge} onChange={() => toggleAutoMerge(selectedMR.id)} label="Enable auto-merge when all requirements are met" />
              </div>

              <div className="flex gap-2 flex-wrap">
                {selectedMR.status !== "merged" && selectedMR.status !== "closed" && (
                  <>
                    <button onClick={() => updateMRStatus(selectedMR.id, "merged")} className="px-4 py-2 rounded-lg border-0 bg-primary text-primary-foreground text-xs font-semibold cursor-pointer hover:opacity-90">🔀 Merge</button>
                    <button onClick={() => updateMRStatus(selectedMR.id, "closed")} className="px-4 py-2 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs font-semibold cursor-pointer hover:bg-destructive/20">Close</button>
                  </>
                )}
                {selectedMR.status === "closed" && (
                  <button onClick={() => updateMRStatus(selectedMR.id, "open")} className="px-4 py-2 rounded-lg border border-border bg-transparent text-foreground text-xs font-semibold cursor-pointer hover:bg-muted">Reopen</button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground flex justify-between">
          <span>{rules.filter((r) => r.enabled).length} active rules</span>
          <span>Esc to {editingRule || selectedMR ? "go back" : "close"}</span>
        </div>
      </div>
    </div>
  );
}

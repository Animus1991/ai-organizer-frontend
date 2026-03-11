/**
 * IssueTemplates — GitHub-style Issue Templates for research workflows
 * Templates: New Hypothesis, Evidence Gap, Methodology Question,
 *            Contradiction Report, Peer Review Request, Data Request
 * Persists issues to localStorage, supports labels, priority, assignment
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

// ─── Types ───────────────────────────────────────────────────
export type IssuePriority = "critical" | "high" | "medium" | "low";
export type IssueStatus = "open" | "in_progress" | "resolved" | "closed";
export type IssueLabel = "hypothesis" | "evidence-gap" | "methodology" | "contradiction" | "peer-review" | "data-request" | "enhancement" | "bug";

export interface IssueTemplate { id: string; name: string; icon: string; description: string; label: IssueLabel; color: string; fields: TemplateField[]; }
export interface TemplateField { key: string; label: string; type: "text" | "textarea" | "select" | "tags"; placeholder?: string; required?: boolean; options?: string[]; defaultValue?: string; }
export interface ResearchIssue { id: string; templateId: string; title: string; body: string; fields: Record<string, string>; labels: IssueLabel[]; priority: IssuePriority; status: IssueStatus; assignee: string; createdAt: number; updatedAt: number; comments: IssueComment[]; }
export interface IssueComment { id: string; author: string; body: string; timestamp: number; }

interface IssueTemplatesProps { open: boolean; onClose: () => void; userName?: string; }

const STORAGE_KEY = "research-issues";
function loadIssues(): ResearchIssue[] { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } }
function saveIssues(issues: ResearchIssue[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(issues)); }
function generateId(): string { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
function timeAgo(ts: number): string { const diff = Date.now() - ts; const mins = Math.floor(diff / 60000); if (mins < 1) return "just now"; if (mins < 60) return `${mins}m ago`; const hrs = Math.floor(mins / 60); if (hrs < 24) return `${hrs}h ago`; const days = Math.floor(hrs / 24); if (days < 7) return `${days}d ago`; return new Date(ts).toLocaleDateString(); }

const ISSUE_TEMPLATES: IssueTemplate[] = [
  { id: "new-hypothesis", name: "New Hypothesis", icon: "💡", description: "Propose a new hypothesis for investigation", label: "hypothesis", color: "#6366f1",
    fields: [{ key: "hypothesis", label: "Hypothesis Statement", type: "textarea", placeholder: "State your hypothesis clearly and concisely...", required: true }, { key: "rationale", label: "Rationale", type: "textarea", placeholder: "Why do you believe this hypothesis is worth investigating?" }, { key: "predictions", label: "Testable Predictions", type: "textarea", placeholder: "What specific predictions does this hypothesis make?" }, { key: "methodology", label: "Proposed Methodology", type: "select", options: ["Qualitative", "Quantitative", "Mixed Methods", "Meta-Analysis", "Case Study", "Experimental"] }, { key: "scope", label: "Scope", type: "select", options: ["Narrow", "Moderate", "Broad"] }] },
  { id: "evidence-gap", name: "Evidence Gap", icon: "🔍", description: "Identify missing evidence or data needed", label: "evidence-gap", color: "#f59e0b",
    fields: [{ key: "claim", label: "Related Claim", type: "text", placeholder: "Which claim lacks sufficient evidence?", required: true }, { key: "gap", label: "Gap Description", type: "textarea", placeholder: "Describe what evidence is missing...", required: true }, { key: "impact", label: "Impact on Theory", type: "textarea", placeholder: "How does this gap affect the overall theory?" }, { key: "sources", label: "Potential Sources", type: "textarea", placeholder: "Where might this evidence be found?" }, { key: "urgency", label: "Urgency", type: "select", options: ["Blocking", "High", "Medium", "Low"] }] },
  { id: "methodology-question", name: "Methodology Question", icon: "🔬", description: "Raise a question about research methodology", label: "methodology", color: "#10b981",
    fields: [{ key: "question", label: "Methodology Question", type: "textarea", placeholder: "What aspect of the methodology needs clarification?", required: true }, { key: "context", label: "Context", type: "textarea", placeholder: "Provide context for why this question arose..." }, { key: "alternatives", label: "Alternative Approaches", type: "textarea", placeholder: "Are there alternative methodological approaches to consider?" }, { key: "domain", label: "Domain", type: "select", options: ["Data Collection", "Analysis", "Sampling", "Measurement", "Design", "Ethics", "Reproducibility"] }] },
  { id: "contradiction-report", name: "Contradiction Report", icon: "⚠️", description: "Report a contradiction or inconsistency found", label: "contradiction", color: "#ef4444",
    fields: [{ key: "claim_a", label: "Claim A", type: "text", placeholder: "First conflicting claim...", required: true }, { key: "claim_b", label: "Claim B", type: "text", placeholder: "Second conflicting claim...", required: true }, { key: "analysis", label: "Contradiction Analysis", type: "textarea", placeholder: "Explain how these claims contradict each other..." }, { key: "resolution", label: "Proposed Resolution", type: "textarea", placeholder: "How might this contradiction be resolved?" }, { key: "severity", label: "Severity", type: "select", options: ["Critical - Undermines core theory", "Major - Affects key claims", "Minor - Peripheral inconsistency"] }] },
  { id: "peer-review", name: "Peer Review Request", icon: "👥", description: "Request peer review for a section or claim", label: "peer-review", color: "#8b5cf6",
    fields: [{ key: "section", label: "Section for Review", type: "text", placeholder: "Which section needs review?", required: true }, { key: "focus", label: "Review Focus", type: "textarea", placeholder: "What should reviewers focus on?", required: true }, { key: "deadline", label: "Review Deadline", type: "text", placeholder: "When is the review needed by?" }, { key: "type", label: "Review Type", type: "select", options: ["Content Accuracy", "Methodology", "Writing Quality", "Statistical Analysis", "Comprehensive"] }] },
  { id: "data-request", name: "Data Request", icon: "📊", description: "Request specific data or datasets needed", label: "data-request", color: "#22d3ee",
    fields: [{ key: "data_needed", label: "Data Needed", type: "textarea", placeholder: "Describe the specific data or dataset required...", required: true }, { key: "purpose", label: "Purpose", type: "textarea", placeholder: "How will this data be used in the research?" }, { key: "format", label: "Preferred Format", type: "select", options: ["CSV", "JSON", "Excel", "PDF", "Database", "API", "Other"] }, { key: "constraints", label: "Constraints", type: "textarea", placeholder: "Any constraints on data source, time period, etc.?" }] },
];

const LABEL_CONFIG: Record<IssueLabel, { color: string; bg: string }> = {
  hypothesis: { color: "#818cf8", bg: "rgba(99, 102, 241, 0.15)" },
  "evidence-gap": { color: "#fbbf24", bg: "rgba(245, 158, 11, 0.15)" },
  methodology: { color: "#34d399", bg: "rgba(16, 185, 129, 0.15)" },
  contradiction: { color: "#f87171", bg: "rgba(239, 68, 68, 0.15)" },
  "peer-review": { color: "#a78bfa", bg: "rgba(139, 92, 246, 0.15)" },
  "data-request": { color: "#67e8f9", bg: "rgba(34, 211, 238, 0.15)" },
  enhancement: { color: "#60a5fa", bg: "rgba(96, 165, 250, 0.15)" },
  bug: { color: "#fb923c", bg: "rgba(251, 146, 60, 0.15)" },
};

const PRIORITY_CONFIG: Record<IssuePriority, { color: string; icon: string }> = {
  critical: { color: "#ef4444", icon: "🔴" }, high: { color: "#f59e0b", icon: "🟠" },
  medium: { color: "#6366f1", icon: "🔵" }, low: { color: "#10b981", icon: "🟢" },
};

const STATUS_CONFIG: Record<IssueStatus, { color: string; icon: string; label: string }> = {
  open: { color: "#10b981", icon: "🟢", label: "Open" }, in_progress: { color: "#f59e0b", icon: "🟡", label: "In Progress" },
  resolved: { color: "#8b5cf6", icon: "🟣", label: "Resolved" }, closed: { color: "#6b7280", icon: "⚫", label: "Closed" },
};

function generateSampleIssues(): ResearchIssue[] {
  const now = Date.now(); const day = 86400000;
  return [
    { id: generateId(), templateId: "new-hypothesis", title: "Cognitive load reduces analytical accuracy in multi-document comparison", body: "When researchers compare more than 3 documents simultaneously, cognitive load significantly reduces the accuracy of their analytical conclusions.", fields: { hypothesis: "Cognitive load reduces analytical accuracy", methodology: "Mixed Methods", scope: "Moderate" }, labels: ["hypothesis"], priority: "high", status: "open", assignee: "You", createdAt: now - 2 * day, updatedAt: now - 1 * day, comments: [{ id: generateId(), author: "Dr. Elena Vasquez", body: "This aligns with Sweller's CLT. Consider measuring working memory capacity as a covariate.", timestamp: now - 1 * day }] },
    { id: generateId(), templateId: "evidence-gap", title: "Missing longitudinal data on theory revision patterns", body: "We lack longitudinal evidence showing how researchers revise their theories over extended periods (>6 months).", fields: { claim: "Theory revision is iterative", gap: "No longitudinal data available", urgency: "High" }, labels: ["evidence-gap"], priority: "medium", status: "in_progress", assignee: "Prof. Marcus Chen", createdAt: now - 5 * day, updatedAt: now - 3 * day, comments: [] },
    { id: generateId(), templateId: "contradiction-report", title: "Conflicting results on segmentation accuracy metrics", body: "Two analyses show contradictory results for segmentation accuracy when using different tokenization methods.", fields: { claim_a: "BPE tokenization yields 94% accuracy", claim_b: "WordPiece tokenization yields 97% accuracy", severity: "Major - Affects key claims" }, labels: ["contradiction"], priority: "critical", status: "open", assignee: "You", createdAt: now - 1 * day, updatedAt: now - 1 * day, comments: [] },
  ];
}

// ─── Component ───────────────────────────────────────────────
export default function IssueTemplates({ open, onClose, userName = "You" }: IssueTemplatesProps) {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  type View = "list" | "create" | "detail";
  const [view, setView] = useState<View>("list");
  const [selectedTemplate, setSelectedTemplate] = useState<IssueTemplate | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<ResearchIssue | null>(null);
  const [filterStatus, setFilterStatus] = useState<IssueStatus | "all">("all");
  const [filterLabel, setFilterLabel] = useState<IssueLabel | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formFields, setFormFields] = useState<Record<string, string>>({});
  const [formPriority, setFormPriority] = useState<IssuePriority>("medium");
  const [newComment, setNewComment] = useState("");

  const [issues, setIssues] = useState<ResearchIssue[]>(() => { const stored = loadIssues(); return stored.length > 0 ? stored : generateSampleIssues(); });
  useEffect(() => { saveIssues(issues); }, [issues]);

  const filteredIssues = useMemo(() => {
    let result = issues;
    if (filterStatus !== "all") result = result.filter((i) => i.status === filterStatus);
    if (filterLabel !== "all") result = result.filter((i) => i.labels.includes(filterLabel));
    if (searchQuery) { const q = searchQuery.toLowerCase(); result = result.filter((i) => i.title.toLowerCase().includes(q) || i.body.toLowerCase().includes(q)); }
    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [issues, filterStatus, filterLabel, searchQuery]);

  const openCounts = useMemo(() => ({ open: issues.filter((i) => i.status === "open").length, in_progress: issues.filter((i) => i.status === "in_progress").length, resolved: issues.filter((i) => i.status === "resolved").length, closed: issues.filter((i) => i.status === "closed").length }), [issues]);

  const startCreate = useCallback((template: IssueTemplate) => { setSelectedTemplate(template); setFormTitle(""); setFormBody(""); setFormFields({}); setFormPriority("medium"); setView("create"); }, []);
  const submitIssue = useCallback(() => {
    if (!selectedTemplate || !formTitle.trim()) return;
    const issue: ResearchIssue = { id: generateId(), templateId: selectedTemplate.id, title: formTitle.trim(), body: formBody.trim(), fields: { ...formFields }, labels: [selectedTemplate.label], priority: formPriority, status: "open", assignee: userName, createdAt: Date.now(), updatedAt: Date.now(), comments: [] };
    setIssues((prev) => [issue, ...prev]); setView("list"); setSelectedTemplate(null);
  }, [selectedTemplate, formTitle, formBody, formFields, formPriority, userName]);
  const updateIssueStatus = useCallback((issueId: string, status: IssueStatus) => {
    setIssues((prev) => prev.map((i) => i.id === issueId ? { ...i, status, updatedAt: Date.now() } : i));
    if (selectedIssue?.id === issueId) setSelectedIssue((prev) => prev ? { ...prev, status, updatedAt: Date.now() } : prev);
  }, [selectedIssue]);
  const addComment = useCallback((issueId: string) => {
    if (!newComment.trim()) return;
    const comment: IssueComment = { id: generateId(), author: userName, body: newComment.trim(), timestamp: Date.now() };
    setIssues((prev) => prev.map((i) => i.id === issueId ? { ...i, comments: [...i.comments, comment], updatedAt: Date.now() } : i));
    if (selectedIssue?.id === issueId) setSelectedIssue((prev) => prev ? { ...prev, comments: [...prev.comments, comment], updatedAt: Date.now() } : prev);
    setNewComment("");
  }, [newComment, userName, selectedIssue]);
  const deleteIssue = useCallback((issueId: string) => {
    if (!window.confirm("Delete this issue? This cannot be undone.")) return;
    setIssues((prev) => prev.filter((i) => i.id !== issueId));
    if (selectedIssue?.id === issueId) { setSelectedIssue(null); setView("list"); }
  }, [selectedIssue]);
  const openDetail = useCallback((issue: ResearchIssue) => { setSelectedIssue(issue); setNewComment(""); setView("detail"); }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") { if (view !== "list") { setView("list"); setSelectedTemplate(null); setSelectedIssue(null); } else onClose(); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, view, onClose]);

  if (!open) return null;

  const inputCls = "w-full px-2.5 py-2 rounded-md border border-border bg-muted/30 text-foreground text-xs outline-none font-inherit focus:border-primary transition-colors";

  const renderLabel = (label: IssueLabel) => {
    const cfg = LABEL_CONFIG[label];
    return <span key={label} style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: 600, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33` }}>{label.replace("-", " ")}</span>;
  };

  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[720px] max-w-[95vw] max-h-[90vh] bg-background border border-border rounded-2xl flex flex-col overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {view !== "list" && (
              <button onClick={() => { setView("list"); setSelectedTemplate(null); setSelectedIssue(null); }} className="px-2 py-1 rounded-md border border-border bg-transparent text-muted-foreground text-xs cursor-pointer hover:bg-muted">← Back</button>
            )}
            <span className="text-lg">📋</span>
            <div>
              <div className="text-[15px] font-bold text-foreground">
                {view === "create" && selectedTemplate ? `New: ${selectedTemplate.name}` : view === "detail" && selectedIssue ? `#${selectedIssue.id.slice(-6)}` : t("issueTemplates.title") || "Issue Templates"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {view === "list" ? `${openCounts.open} open · ${openCounts.in_progress} in progress · ${issues.length} total` : view === "create" ? selectedTemplate?.description : selectedIssue?.title}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md border border-border bg-transparent text-muted-foreground text-sm cursor-pointer flex items-center justify-center hover:bg-muted">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* LIST VIEW */}
          {view === "list" && (
            <div>
              <div className="p-4 border-b border-border">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Create New Issue</div>
                <div className="grid grid-cols-3 gap-2">
                  {ISSUE_TEMPLATES.map((tmpl) => (
                    <button key={tmpl.id} onClick={() => startCreate(tmpl)} className="p-3 rounded-xl border text-left cursor-pointer transition-all hover:-translate-y-0.5" style={{ borderColor: `${tmpl.color}33`, background: `${tmpl.color}0a` }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = `${tmpl.color}18`; }} onMouseLeave={(e) => { e.currentTarget.style.background = `${tmpl.color}0a`; }}>
                      <div className="text-lg mb-1.5">{tmpl.icon}</div>
                      <div className="text-xs font-semibold text-foreground mb-0.5">{tmpl.name}</div>
                      <div className="text-[10px] text-muted-foreground leading-snug">{tmpl.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 border-b border-border flex gap-2 items-center flex-wrap">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search issues..." className={`${inputCls} flex-1 min-w-[150px]`} />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as IssueStatus | "all")} className={`${inputCls} w-auto cursor-pointer`}>
                  <option value="all">All Status</option><option value="open">Open ({openCounts.open})</option><option value="in_progress">In Progress ({openCounts.in_progress})</option><option value="resolved">Resolved ({openCounts.resolved})</option><option value="closed">Closed ({openCounts.closed})</option>
                </select>
                <select value={filterLabel} onChange={(e) => setFilterLabel(e.target.value as IssueLabel | "all")} className={`${inputCls} w-auto cursor-pointer`}>
                  <option value="all">All Labels</option>
                  {ISSUE_TEMPLATES.map((t) => <option key={t.label} value={t.label}>{t.icon} {t.name}</option>)}
                </select>
              </div>

              <div className="px-4 py-2">
                {filteredIssues.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground"><div className="text-3xl mb-2">📋</div><div className="text-sm font-semibold">No issues found</div><div className="text-xs mt-1">Create one using the templates above</div></div>
                ) : filteredIssues.map((issue) => {
                  const statusCfg = STATUS_CONFIG[issue.status]; const priorityCfg = PRIORITY_CONFIG[issue.priority];
                  return (
                    <button key={issue.id} onClick={() => openDetail(issue)} className="w-full p-3 rounded-lg border border-border bg-muted/20 mb-1.5 cursor-pointer text-left transition-all hover:bg-muted/40">
                      <div className="flex items-start gap-2.5">
                        <span className="text-sm mt-0.5">{statusCfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-foreground mb-1">{issue.title}</div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {issue.labels.map(renderLabel)}
                            <span className="text-[10px]" style={{ color: priorityCfg.color }}>{priorityCfg.icon} {issue.priority}</span>
                            <span className="text-[10px] text-muted-foreground">#{issue.id.slice(-6)} · {issue.assignee} · {timeAgo(issue.updatedAt)}</span>
                            {issue.comments.length > 0 && <span className="text-[10px] text-muted-foreground">💬 {issue.comments.length}</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CREATE VIEW */}
          {view === "create" && selectedTemplate && (
            <div className="p-4 space-y-3">
              <div><label className="text-[11px] font-semibold text-muted-foreground block mb-1">Title *</label><input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Issue title..." className={inputCls} autoFocus /></div>
              <div><label className="text-[11px] font-semibold text-muted-foreground block mb-1">Description</label><textarea value={formBody} onChange={(e) => setFormBody(e.target.value)} placeholder="Describe the issue in detail..." rows={3} className={`${inputCls} resize-y`} /></div>
              {selectedTemplate.fields.map((field) => (
                <div key={field.key}>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">{field.label} {field.required && "*"}</label>
                  {field.type === "textarea" ? <textarea value={formFields[field.key] || ""} onChange={(e) => setFormFields((prev) => ({ ...prev, [field.key]: e.target.value }))} placeholder={field.placeholder} rows={3} className={`${inputCls} resize-y`} />
                    : field.type === "select" ? <select value={formFields[field.key] || ""} onChange={(e) => setFormFields((prev) => ({ ...prev, [field.key]: e.target.value }))} className={`${inputCls} cursor-pointer`}><option value="">Select...</option>{field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}</select>
                    : <input type="text" value={formFields[field.key] || ""} onChange={(e) => setFormFields((prev) => ({ ...prev, [field.key]: e.target.value }))} placeholder={field.placeholder} className={inputCls} />}
                </div>
              ))}
              <div><label className="text-[11px] font-semibold text-muted-foreground block mb-1">Priority</label>
                <div className="flex gap-1.5">
                  {(["low", "medium", "high", "critical"] as IssuePriority[]).map((p) => {
                    const cfg = PRIORITY_CONFIG[p];
                    return <button key={p} onClick={() => setFormPriority(p)} className="px-3 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer transition-colors" style={{ border: formPriority === p ? `2px solid ${cfg.color}` : "1px solid hsl(var(--border))", background: formPriority === p ? `${cfg.color}18` : "transparent", color: formPriority === p ? cfg.color : "hsl(var(--muted-foreground))" }}>{cfg.icon} {p}</button>;
                  })}
                </div>
              </div>
              <button onClick={submitIssue} disabled={!formTitle.trim()} className={`w-full py-2.5 rounded-lg border-0 text-[13px] font-semibold transition-colors ${formTitle.trim() ? "text-white cursor-pointer hover:opacity-90" : "bg-muted text-muted-foreground/40 cursor-not-allowed"}`} style={{ background: formTitle.trim() ? selectedTemplate.color : undefined }}>
                {selectedTemplate.icon} Create {selectedTemplate.name}
              </button>
            </div>
          )}

          {/* DETAIL VIEW */}
          {view === "detail" && selectedIssue && (
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-base font-bold text-foreground mb-2">{selectedIssue.title}</h3>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {selectedIssue.labels.map(renderLabel)}
                  <span className="text-[10px]" style={{ color: PRIORITY_CONFIG[selectedIssue.priority].color }}>{PRIORITY_CONFIG[selectedIssue.priority].icon} {selectedIssue.priority}</span>
                  <span className="text-[10px] text-muted-foreground">by {selectedIssue.assignee} · {timeAgo(selectedIssue.createdAt)}</span>
                </div>
                <div className="flex gap-1.5 mb-3">
                  {(["open", "in_progress", "resolved", "closed"] as IssueStatus[]).map((s) => {
                    const cfg = STATUS_CONFIG[s];
                    return <button key={s} onClick={() => updateIssueStatus(selectedIssue.id, s)} className="px-2.5 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-colors" style={{ border: selectedIssue.status === s ? `2px solid ${cfg.color}` : "1px solid hsl(var(--border))", background: selectedIssue.status === s ? `${cfg.color}18` : "transparent", color: selectedIssue.status === s ? cfg.color : "hsl(var(--muted-foreground))" }}>{cfg.icon} {cfg.label}</button>;
                  })}
                </div>
              </div>
              {selectedIssue.body && <div className="p-3 rounded-lg border border-border bg-muted/20 mb-4 text-[13px] text-foreground leading-relaxed">{selectedIssue.body}</div>}
              {Object.keys(selectedIssue.fields).length > 0 && (
                <div className="mb-4">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Details</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedIssue.fields).filter(([, v]) => v).map(([key, value]) => (
                      <div key={key} className="px-2.5 py-2 rounded-md border border-border bg-muted/20">
                        <div className="text-[10px] text-muted-foreground mb-0.5">{key.replace(/_/g, " ")}</div>
                        <div className="text-xs text-foreground">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mb-4">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Comments ({selectedIssue.comments.length})</div>
                {selectedIssue.comments.map((comment) => (
                  <div key={comment.id} className="p-2.5 rounded-lg border border-border bg-muted/20 mb-1.5">
                    <div className="flex justify-between mb-1"><span className="text-[11px] font-semibold text-foreground">{comment.author}</span><span className="text-[10px] text-muted-foreground">{timeAgo(comment.timestamp)}</span></div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{comment.body}</div>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className={`${inputCls} flex-1`} onKeyDown={(e) => { if (e.key === "Enter") addComment(selectedIssue.id); }} />
                  <button onClick={() => addComment(selectedIssue.id)} disabled={!newComment.trim()} className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90">Send</button>
                </div>
              </div>
              <button onClick={() => deleteIssue(selectedIssue.id)} className="text-xs text-destructive bg-transparent border-0 cursor-pointer hover:underline">Delete this issue</button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground flex justify-between">
          <span>{issues.filter((i) => i.status === "open").length} open · {issues.filter((i) => i.status === "in_progress").length} in progress</span>
          <span>Esc to {view !== "list" ? "go back" : "close"}</span>
        </div>
      </div>
    </div>
  );
}

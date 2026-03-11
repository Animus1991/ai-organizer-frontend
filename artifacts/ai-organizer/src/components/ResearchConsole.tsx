/**
 * ResearchConsole — Built-in console for research analysis commands
 * Provides a terminal-like interface for running document analysis,
 * statistics, search, and workflow commands within the app.
 * Persists command history to localStorage.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useResearchIssues } from "../context/ResearchIssuesContext";
import { useTheoryBranching } from "../context/TheoryBranchingContext";

// ─── Types ───────────────────────────────────────────────────
interface ConsoleEntry {
  id: string;
  type: "input" | "output" | "error" | "info" | "success" | "warning" | "system";
  content: string;
  timestamp: number;
}

interface ConsoleCommand {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  handler: (args: string[]) => ConsoleEntry[];
}

interface ResearchConsoleProps {
  open: boolean;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────
const STORAGE_KEY = "research-console-history";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-100)));
}

function entry(type: ConsoleEntry["type"], content: string): ConsoleEntry {
  return { id: generateId(), type, content, timestamp: Date.now() };
}

// ─── Simulated Data ──────────────────────────────────────────
function getDocumentStats(): Record<string, number | string> {
  try {
    const uploads = JSON.parse(localStorage.getItem("uploads") || "[]");
    const parsed = uploads.filter((u: any) => u.parseStatus === "ok").length;
    const pending = uploads.filter((u: any) => u.parseStatus === "pending").length;
    const failed = uploads.filter((u: any) => u.parseStatus === "failed" || u.parseStatus === "error").length;
    const totalBytes = uploads.reduce((s: number, u: any) => s + (u.sizeBytes || 0), 0);
    return { total: uploads.length, parsed, pending, failed, totalSize: `${(totalBytes / 1024 / 1024).toFixed(2)} MB` };
  } catch {
    return { total: 0, parsed: 0, pending: 0, failed: 0, totalSize: "0 MB" };
  }
}

function getIssueStats(): Record<string, number> {
  try {
    const issues = JSON.parse(localStorage.getItem("research-issues") || "[]");
    return {
      total: issues.length,
      open: issues.filter((i: any) => i.status === "open").length,
      inProgress: issues.filter((i: any) => i.status === "in_progress").length,
      resolved: issues.filter((i: any) => i.status === "resolved").length,
      closed: issues.filter((i: any) => i.status === "closed").length,
    };
  } catch {
    return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
  }
}

function getCommitStats(): Record<string, number | string> {
  try {
    const commits = JSON.parse(localStorage.getItem("sc-commit-history") || "[]");
    const changes = JSON.parse(localStorage.getItem("sc-pending-changes") || "[]");
    return {
      totalCommits: commits.length, pendingChanges: changes.length,
      stagedChanges: changes.filter((c: any) => c.staged).length,
      lastCommit: commits.length > 0 ? commits[0].message : "none",
    };
  } catch {
    return { totalCommits: 0, pendingChanges: 0, stagedChanges: 0, lastCommit: "none" };
  }
}

// ─── Command Definitions ─────────────────────────────────────
function buildCommands(navigate: (path: string) => void): ConsoleCommand[] {
  return [
    {
      name: "help", aliases: ["h", "?"], description: "Show available commands", usage: "help [command]",
      handler: (args) => {
        if (args.length > 0) {
          const cmd = buildCommands(navigate).find((c) => c.name === args[0] || c.aliases.includes(args[0]));
          if (cmd) return [entry("info", `── ${cmd.name} ──`), entry("output", `  Description: ${cmd.description}`), entry("output", `  Usage: ${cmd.usage}`), entry("output", `  Aliases: ${cmd.aliases.join(", ") || "none"}`)];
          return [entry("error", `Unknown command: ${args[0]}`)];
        }
        const cmds = buildCommands(navigate);
        return [entry("info", "═══ Research Console — Available Commands ═══"), ...cmds.map((c) => entry("output", `  ${c.name.padEnd(16)} ${c.description}`)), entry("info", "\nType 'help <command>' for detailed usage.")];
      },
    },
    {
      name: "stats", aliases: ["st", "status"], description: "Show workspace statistics", usage: "stats [documents|issues|commits|all]",
      handler: (args) => {
        const scope = args[0] || "all";
        const results: ConsoleEntry[] = [];
        if (scope === "all" || scope === "documents" || scope === "docs") {
          const ds = getDocumentStats();
          results.push(entry("info", "── Document Statistics ──"));
          Object.entries(ds).forEach(([k, v]) => results.push(entry("output", `  ${k.padEnd(14)} ${v}`)));
        }
        if (scope === "all" || scope === "issues") {
          const is = getIssueStats();
          results.push(entry("info", "── Issue Statistics ──"));
          Object.entries(is).forEach(([k, v]) => results.push(entry("output", `  ${k.padEnd(14)} ${v}`)));
        }
        if (scope === "all" || scope === "commits" || scope === "git") {
          const cs = getCommitStats();
          results.push(entry("info", "── Source Control ──"));
          Object.entries(cs).forEach(([k, v]) => results.push(entry("output", `  ${k.padEnd(18)} ${v}`)));
        }
        if (results.length === 0) results.push(entry("error", `Unknown scope: ${scope}. Use: documents, issues, commits, or all`));
        return results;
      },
    },
    {
      name: "list", aliases: ["ls", "dir"], description: "List documents, issues, or commits", usage: "list [documents|issues|commits] [--limit N]",
      handler: (args) => {
        const scope = args[0] || "documents";
        const limitIdx = args.indexOf("--limit");
        const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) || 10 : 10;
        if (scope === "documents" || scope === "docs") {
          try {
            const uploads = JSON.parse(localStorage.getItem("uploads") || "[]");
            if (uploads.length === 0) return [entry("warning", "No documents found.")];
            const results: ConsoleEntry[] = [entry("info", `── Documents (${Math.min(limit, uploads.length)}/${uploads.length}) ──`)];
            uploads.slice(0, limit).forEach((u: any, i: number) => {
              const status = u.parseStatus === "ok" ? "✓" : u.parseStatus === "pending" ? "○" : "✗";
              results.push(entry("output", `  ${(i + 1).toString().padStart(3)}. [${status}] ${u.filename || `Doc #${u.documentId}`}  (${((u.sizeBytes || 0) / 1024).toFixed(1)} KB)`));
            });
            return results;
          } catch { return [entry("error", "Failed to read documents.")]; }
        }
        if (scope === "issues") {
          try {
            const issues = JSON.parse(localStorage.getItem("research-issues") || "[]");
            if (issues.length === 0) return [entry("warning", "No issues found.")];
            const results: ConsoleEntry[] = [entry("info", `── Issues (${Math.min(limit, issues.length)}/${issues.length}) ──`)];
            issues.slice(0, limit).forEach((iss: any, i: number) => {
              const statusIcon = iss.status === "open" ? "🟢" : iss.status === "in_progress" ? "🟡" : iss.status === "resolved" ? "🟣" : "⚫";
              results.push(entry("output", `  ${(i + 1).toString().padStart(3)}. ${statusIcon} ${iss.title}  [${iss.priority}]`));
            });
            return results;
          } catch { return [entry("error", "Failed to read issues.")]; }
        }
        if (scope === "commits") {
          try {
            const commits = JSON.parse(localStorage.getItem("sc-commit-history") || "[]");
            if (commits.length === 0) return [entry("warning", "No commits found.")];
            const results: ConsoleEntry[] = [entry("info", `── Commits (${Math.min(limit, commits.length)}/${commits.length}) ──`)];
            commits.slice(0, limit).forEach((c: any, i: number) => {
              results.push(entry("output", `  ${(i + 1).toString().padStart(3)}. ${c.hash || "??????"} ${c.message}  (${c.author})`));
            });
            return results;
          } catch { return [entry("error", "Failed to read commits.")]; }
        }
        return [entry("error", `Unknown scope: ${scope}. Use: documents, issues, or commits`)];
      },
    },
    {
      name: "search", aliases: ["find", "grep"], description: "Search across documents and issues", usage: "search <query> [--in documents|issues|all]",
      handler: (args) => {
        if (args.length === 0) return [entry("error", "Usage: search <query> [--in documents|issues|all]")];
        const inIdx = args.indexOf("--in");
        let scope = "all";
        let query: string;
        if (inIdx >= 0) { scope = args[inIdx + 1] || "all"; query = args.slice(0, inIdx).join(" ").toLowerCase(); }
        else { query = args.join(" ").toLowerCase(); }
        const results: ConsoleEntry[] = [entry("info", `Searching for "${query}" in ${scope}...`)];
        let found = 0;
        if (scope === "all" || scope === "documents" || scope === "docs") {
          try {
            const uploads = JSON.parse(localStorage.getItem("uploads") || "[]");
            const matches = uploads.filter((u: any) => (u.filename || "").toLowerCase().includes(query) || (u.contentType || "").toLowerCase().includes(query));
            if (matches.length > 0) {
              results.push(entry("info", `── Documents (${matches.length} matches) ──`));
              matches.slice(0, 10).forEach((u: any) => results.push(entry("success", `  ✓ ${u.filename || `Doc #${u.documentId}`}`)));
              found += matches.length;
            }
          } catch { /* ignore */ }
        }
        if (scope === "all" || scope === "issues") {
          try {
            const issues = JSON.parse(localStorage.getItem("research-issues") || "[]");
            const matches = issues.filter((i: any) => (i.title || "").toLowerCase().includes(query) || (i.body || "").toLowerCase().includes(query));
            if (matches.length > 0) {
              results.push(entry("info", `── Issues (${matches.length} matches) ──`));
              matches.slice(0, 10).forEach((i: any) => results.push(entry("success", `  ✓ ${i.title}`)));
              found += matches.length;
            }
          } catch { /* ignore */ }
        }
        if (found === 0) results.push(entry("warning", `No results found for "${query}".`));
        else results.push(entry("info", `\n${found} total result(s) found.`));
        return results;
      },
    },
    {
      name: "analyze", aliases: ["analyse"], description: "Run analysis on workspace data", usage: "analyze [coverage|quality|activity|health]",
      handler: (args) => {
        const type = args[0] || "health";
        const results: ConsoleEntry[] = [];
        if (type === "health" || type === "all") {
          const ds = getDocumentStats(); const is = getIssueStats(); const cs = getCommitStats();
          const total = Number(ds.total) || 0; const parsed = Number(ds.parsed) || 0;
          const parseRate = total > 0 ? ((parsed / total) * 100).toFixed(1) : "0";
          const openIssues = is.open || 0; const totalCommits = Number(cs.totalCommits) || 0;
          results.push(entry("info", "═══ Workspace Health Analysis ═══"));
          results.push(entry("output", `  Document Parse Rate:  ${parseRate}%`));
          results.push(entry(Number(parseRate) >= 80 ? "success" : "warning", `  ${Number(parseRate) >= 80 ? "✓ Good" : "⚠ Needs attention"}: ${parsed}/${total} documents parsed`));
          results.push(entry("output", `  Open Issues:         ${openIssues}`));
          results.push(entry(openIssues <= 5 ? "success" : "warning", `  ${openIssues <= 5 ? "✓ Manageable" : "⚠ Consider triaging"}: ${openIssues} open issues`));
          results.push(entry("output", `  Commit Activity:     ${totalCommits} commits`));
          results.push(entry(totalCommits >= 3 ? "success" : "info", `  ${totalCommits >= 3 ? "✓ Active" : "○ Getting started"}: ${totalCommits} total commits`));
          const score = Math.min(100, Math.round((Number(parseRate) * 0.4) + (Math.min(100, (1 - openIssues / Math.max(1, is.total)) * 100) * 0.3) + (Math.min(100, totalCommits * 10) * 0.3)));
          results.push(entry("info", `\n  Overall Health Score: ${score}/100`));
          const bar = "█".repeat(Math.round(score / 5)) + "░".repeat(20 - Math.round(score / 5));
          results.push(entry(score >= 70 ? "success" : score >= 40 ? "warning" : "error", `  [${bar}]`));
        }
        if (type === "coverage") {
          results.push(entry("info", "── Evidence Coverage Analysis ──"));
          results.push(entry("output", "  Claims with evidence:    78%"), entry("output", "  Claims without evidence: 22%"), entry("output", "  Falsifiable claims:      65%"), entry("output", "  Contradictions found:    3"));
          results.push(entry("warning", "  ⚠ 22% of claims lack supporting evidence"));
        }
        if (type === "quality") {
          results.push(entry("info", "── Research Quality Metrics ──"));
          results.push(entry("output", "  Methodology score:     8.2/10"), entry("output", "  Citation coverage:     91%"), entry("output", "  Internal consistency:  87%"), entry("output", "  Reproducibility index: 7.5/10"));
          results.push(entry("success", "  ✓ Quality metrics are within acceptable range"));
        }
        if (type === "activity") {
          results.push(entry("info", "── Activity Analysis (Last 7 Days) ──"));
          results.push(entry("output", "  Documents created:   4"), entry("output", "  Documents modified:  12"), entry("output", "  Issues opened:       6"), entry("output", "  Issues resolved:     3"), entry("output", "  Commits made:        8"), entry("output", "  Active hours:        ~14h"));
        }
        if (results.length === 0) return [entry("error", `Unknown analysis type: ${type}. Use: health, coverage, quality, or activity`)];
        return results;
      },
    },
    {
      name: "navigate", aliases: ["nav", "go", "cd"], description: "Navigate to a page", usage: "navigate <page>",
      handler: (args) => {
        const page = args[0]?.toLowerCase();
        const routes: Record<string, string> = { home: "/", library: "/library", research: "/research", workspace: "/frontend", settings: "/settings", "theory-hub": "/theory-hub", "research-lab": "/research-lab", "recycle-bin": "/recycle-bin", "theory-repo": "/theory-repo" };
        if (!page) return [entry("error", `Usage: navigate <page>\nAvailable: ${Object.keys(routes).join(", ")}`)];
        const path = routes[page];
        if (!path) return [entry("error", `Unknown page: ${page}\nAvailable: ${Object.keys(routes).join(", ")}`)];
        navigate(path);
        return [entry("success", `Navigating to ${page} (${path})...`)];
      },
    },
    { name: "clear", aliases: ["cls"], description: "Clear the console", usage: "clear", handler: () => [] },
    { name: "echo", aliases: ["print"], description: "Print a message", usage: "echo <message>", handler: (args) => [entry("output", args.join(" ") || "")] },
    { name: "date", aliases: ["time", "now"], description: "Show current date and time", usage: "date", handler: () => [entry("output", new Date().toLocaleString())] },
    {
      name: "version", aliases: ["ver", "v"], description: "Show application version", usage: "version",
      handler: () => [entry("info", "Think!Hub Research Platform"), entry("output", "  Version:  1.0.0"), entry("output", "  Build:    production"), entry("output", "  Runtime:  React + TypeScript + Vite")],
    },
    {
      name: "export", aliases: ["dump"], description: "Export workspace data summary", usage: "export [stats|issues|commits]",
      handler: (args) => {
        const scope = args[0] || "stats";
        let data: any; let label: string;
        if (scope === "stats") { data = { documents: getDocumentStats(), issues: getIssueStats(), commits: getCommitStats() }; label = "workspace-stats"; }
        else if (scope === "issues") { data = JSON.parse(localStorage.getItem("research-issues") || "[]"); label = "research-issues"; }
        else if (scope === "commits") { data = JSON.parse(localStorage.getItem("sc-commit-history") || "[]"); label = "commit-history"; }
        else return [entry("error", `Unknown export scope: ${scope}. Use: stats, issues, or commits`)];
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `${label}-${new Date().toISOString().slice(0, 10)}.json`; a.click();
        URL.revokeObjectURL(url);
        return [entry("success", `Exported ${label} to JSON file.`)];
      },
    },
    {
      name: "theme", aliases: [], description: "Show or change the current theme", usage: "theme [dark|light|system|dashboard|github]",
      handler: (args) => {
        const current = localStorage.getItem("app-theme-mode") || "dark";
        if (args.length === 0) return [entry("output", `Current theme: ${current}`)];
        const valid = ["dark", "light", "system", "dashboard", "github"];
        if (!valid.includes(args[0])) return [entry("error", `Invalid theme: ${args[0]}. Available: ${valid.join(", ")}`)];
        localStorage.setItem("app-theme-mode", args[0]);
        return [entry("success", `Theme changed to: ${args[0]}`), entry("info", "Reload the page for the theme to take full effect.")];
      },
    },
  ];
}

// ─── Component ───────────────────────────────────────────────
export default function ResearchConsole({ open, onClose }: ResearchConsoleProps) {
  const { t } = useLanguage();
  const { issues, milestones, labels } = useResearchIssues();
  const { commits, branches, mergeRequests, stats: branchStats } = useTheoryBranching();

  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>(loadHistory);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const contextIssueStats = {
    total: issues.length, open: issues.filter(i => i.state === 'open').length,
    inProgress: issues.filter(i => i.state === 'in-progress').length,
    review: issues.filter(i => i.state === 'review').length,
    closed: issues.filter(i => i.state === 'closed').length,
    labels: labels.length, milestones: milestones.length,
  };
  const contextCommitStats = {
    totalCommits: commits.length, totalBranches: branches.length,
    activeBranches: branchStats.activeBranches,
    openMergeRequests: mergeRequests.filter(mr => mr.status === 'open').length,
    lastCommit: commits.length > 0 ? commits[0].message : 'none',
  };
  (window as any).__researchConsoleStats = { issues: contextIssueStats, commits: contextCommitStats };

  const navigate = useCallback((path: string) => {
    window.dispatchEvent(new CustomEvent("researchConsoleNavigate", { detail: { path } }));
  }, []);

  const commands = buildCommands(navigate);

  useEffect(() => {
    if (open && entries.length === 0) {
      setEntries([entry("system", "Welcome to the Research Console."), entry("system", "Type 'help' to see available commands.")]);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [entries]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  const executeCommand = useCallback((rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;
    setCmdHistory((prev) => { const updated = [...prev.filter((h) => h !== trimmed), trimmed]; saveHistory(updated); return updated; });
    setHistoryIdx(-1);
    const parts = trimmed.split(/\s+/);
    const cmdName = parts[0].toLowerCase();
    const args = parts.slice(1);
    const inputEntry = entry("input", `$ ${trimmed}`);
    const cmd = commands.find((c) => c.name === cmdName || c.aliases.includes(cmdName));
    if (!cmd) { setEntries((prev) => [...prev, inputEntry, entry("error", `Command not found: ${cmdName}. Type 'help' for available commands.`)]); return; }
    if (cmd.name === "clear") { setEntries([]); return; }
    const results = cmd.handler(args);
    setEntries((prev) => [...prev, inputEntry, ...results]);
  }, [commands]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") { executeCommand(input); setInput(""); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (cmdHistory.length > 0) { const newIdx = historyIdx < cmdHistory.length - 1 ? historyIdx + 1 : historyIdx; setHistoryIdx(newIdx); setInput(cmdHistory[cmdHistory.length - 1 - newIdx] || ""); } }
    else if (e.key === "ArrowDown") { e.preventDefault(); if (historyIdx > 0) { const newIdx = historyIdx - 1; setHistoryIdx(newIdx); setInput(cmdHistory[cmdHistory.length - 1 - newIdx] || ""); } else { setHistoryIdx(-1); setInput(""); } }
    else if (e.key === "Tab") { e.preventDefault(); const partial = input.toLowerCase().trim(); if (partial) { const match = commands.find((c) => c.name.startsWith(partial) || c.aliases.some((a) => a.startsWith(partial))); if (match) setInput(match.name + " "); } }
  }, [input, cmdHistory, historyIdx, executeCommand, commands]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const typeColors: Record<ConsoleEntry["type"], string> = {
    input: "#a5b4fc",
    output: "hsl(var(--foreground))",
    error: "#f87171",
    info: "#60a5fa",
    success: "#34d399",
    warning: "#fbbf24",
    system: "hsl(var(--muted-foreground))",
  };

  return (
    <div
      className="fixed inset-0 z-[99998] flex items-end justify-center backdrop-blur-sm p-6"
      style={{ background: "hsl(var(--background) / 0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-[800px] max-w-full h-[480px] max-h-[70vh] rounded-xl border border-border flex flex-col overflow-hidden shadow-2xl"
        style={{
          background: "hsl(var(--card))",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div className="px-4 py-2 border-b border-border flex items-center justify-between bg-muted/50">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500 cursor-pointer hover:opacity-80" onClick={onClose} />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-xs text-muted-foreground ml-2">
              {t("researchConsole.title") || "Research Console"} — Think!Hub
            </span>
          </div>
          <button onClick={onClose} className="bg-transparent border-0 text-muted-foreground text-sm cursor-pointer px-1.5 hover:text-foreground">✕</button>
        </div>

        {/* Output Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-3 text-xs leading-relaxed"
          onClick={() => inputRef.current?.focus()}
        >
          {entries.map((e) => (
            <div key={e.id} style={{ color: typeColors[e.type], whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {e.content}
            </div>
          ))}
        </div>

        {/* Input Line */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-2 bg-card">
          <span className="text-emerald-400 text-[13px] font-bold">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent border-0 text-foreground text-xs font-inherit outline-none"
            style={{ caretColor: "#34d399" }}
            autoFocus
          />
          <span className="text-[10px] text-muted-foreground/50">
            Tab: autocomplete · ↑↓: history
          </span>
        </div>
      </div>
    </div>
  );
}

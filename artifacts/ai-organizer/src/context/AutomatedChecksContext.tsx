/**
 * AutomatedChecksContext — GitHub Actions equivalent for scientific research
 * 
 * Provides automated check pipelines for:
 * - Claim consistency (no contradictions between claims)
 * - Evidence sufficiency (all claims have supporting evidence)
 * - Citation completeness (all references are valid)
 * - Methodology validation (methodology meets standards)
 * - Statistical rigor (analysis approach is sound)
 * 
 * Each check has a status (pass/fail/warning/running/pending) like CI/CD checks.
 * Uses localStorage for persistence.
 */

import React, { useState, useCallback, useEffect, createContext, useContext, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────

export type CheckStatus = "pass" | "fail" | "warning" | "running" | "pending" | "skipped";
export type CheckCategory = "consistency" | "evidence" | "citation" | "methodology" | "statistical" | "custom";
export type PipelineStatus = "idle" | "running" | "passed" | "failed" | "partial";

export interface CheckResult {
  id: string;
  checkId: string;
  status: CheckStatus;
  message: string;
  details: string[];
  timestamp: number;
  duration: number; // ms
  /** Affected items (claim IDs, evidence IDs, etc.) */
  affectedItems: string[];
}

export interface AutomatedCheck {
  id: string;
  name: string;
  description: string;
  category: CheckCategory;
  /** Whether this check is enabled */
  enabled: boolean;
  /** Whether this check is required before publishing */
  required: boolean;
  /** The latest result */
  lastResult: CheckResult | null;
  /** How often to auto-run (0 = manual only) */
  autoRunIntervalMs: number;
  /** Custom configuration */
  config: Record<string, unknown>;
  createdAt: number;
}

export interface CheckPipeline {
  id: string;
  name: string;
  description: string;
  /** Which document/theory this pipeline is for */
  resourceId: string;
  resourceType: "document" | "theory" | "branch";
  /** Ordered list of check IDs */
  checkIds: string[];
  status: PipelineStatus;
  lastRunAt: number | null;
  lastRunDuration: number | null;
  /** Whether to run on every commit */
  runOnCommit: boolean;
  /** Whether all required checks must pass before merge */
  blockMergeOnFailure: boolean;
  createdAt: number;
}

export interface CheckRun {
  id: string;
  pipelineId: string;
  status: PipelineStatus;
  startedAt: number;
  completedAt: number | null;
  results: CheckResult[];
  triggeredBy: string;
  triggerType: "manual" | "commit" | "schedule" | "merge-request";
}

// ─── Context Type ────────────────────────────────────────────────────

interface AutomatedChecksContextType {
  // Checks
  checks: AutomatedCheck[];
  createCheck: (check: Omit<AutomatedCheck, "id" | "lastResult" | "createdAt">) => AutomatedCheck;
  updateCheck: (id: string, updates: Partial<AutomatedCheck>) => void;
  deleteCheck: (id: string) => void;
  toggleCheck: (id: string) => void;

  // Pipelines
  pipelines: CheckPipeline[];
  createPipeline: (pipeline: Omit<CheckPipeline, "id" | "status" | "lastRunAt" | "lastRunDuration" | "createdAt">) => CheckPipeline;
  updatePipeline: (id: string, updates: Partial<CheckPipeline>) => void;
  deletePipeline: (id: string) => void;

  // Runs
  checkRuns: CheckRun[];
  runPipeline: (pipelineId: string, triggeredBy?: string, triggerType?: CheckRun["triggerType"]) => void;
  getLatestRun: (pipelineId: string) => CheckRun | null;
  getRunsForPipeline: (pipelineId: string) => CheckRun[];

  // Quick checks
  runSingleCheck: (checkId: string, resourceId: string) => CheckResult;

  // Stats
  stats: {
    totalChecks: number;
    enabledChecks: number;
    totalPipelines: number;
    totalRuns: number;
    passRate: number;
    lastRunStatus: PipelineStatus;
  };
}

// ─── Constants ───────────────────────────────────────────────────────

const STORAGE_KEYS = {
  checks: "automated_checks",
  pipelines: "automated_pipelines",
  checkRuns: "automated_check_runs",
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const CHECK_CATEGORY_CONFIG: Record<CheckCategory, { label: string; icon: string; color: string; description: string }> = {
  consistency: { label: "Consistency", icon: "🔗", color: "#6366f1", description: "Check for contradictions between claims" },
  evidence: { label: "Evidence", icon: "🔬", color: "#10b981", description: "Verify all claims have supporting evidence" },
  citation: { label: "Citation", icon: "📚", color: "#06b6d4", description: "Validate all references and citations" },
  methodology: { label: "Methodology", icon: "📋", color: "#f59e0b", description: "Ensure methodology meets standards" },
  statistical: { label: "Statistical", icon: "📊", color: "#ec4899", description: "Verify statistical analysis rigor" },
  custom: { label: "Custom", icon: "⚙️", color: "#8b5cf6", description: "User-defined custom checks" },
};

export const CHECK_STATUS_CONFIG: Record<CheckStatus, { label: string; icon: string; color: string; bg: string }> = {
  pass: { label: "Passed", icon: "✅", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  fail: { label: "Failed", icon: "❌", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  warning: { label: "Warning", icon: "⚠️", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  running: { label: "Running", icon: "🔄", color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
  pending: { label: "Pending", icon: "⏳", color: "#71717a", bg: "rgba(113,113,122,0.1)" },
  skipped: { label: "Skipped", icon: "⏭", color: "#a1a1aa", bg: "rgba(161,161,170,0.1)" },
};

export const PIPELINE_STATUS_CONFIG: Record<PipelineStatus, { label: string; icon: string; color: string }> = {
  idle: { label: "Idle", icon: "⏸", color: "#71717a" },
  running: { label: "Running", icon: "🔄", color: "#6366f1" },
  passed: { label: "All Passed", icon: "✅", color: "#10b981" },
  failed: { label: "Failed", icon: "❌", color: "#ef4444" },
  partial: { label: "Partial", icon: "⚠️", color: "#f59e0b" },
};

// ─── Simulated Check Logic ───────────────────────────────────────────

function simulateCheck(check: AutomatedCheck): CheckResult {
  const startTime = Date.now();
  // Simulate different outcomes based on category
  const outcomes: Record<CheckCategory, () => CheckResult> = {
    consistency: () => {
      const pass = Math.random() > 0.2;
      return {
        id: generateId(),
        checkId: check.id,
        status: pass ? "pass" : Math.random() > 0.5 ? "warning" : "fail",
        message: pass ? "No contradictions found between claims" : "Potential contradiction detected",
        details: pass
          ? ["All 12 claims checked", "No logical contradictions found", "Cross-reference validation passed"]
          : ["Claim #3 may contradict Claim #7", "Review suggested: check assumption consistency", "2 claims share conflicting evidence"],
        timestamp: Date.now(),
        duration: Date.now() - startTime + Math.floor(Math.random() * 500),
        affectedItems: pass ? [] : ["claim-3", "claim-7"],
      };
    },
    evidence: () => {
      const pass = Math.random() > 0.3;
      return {
        id: generateId(),
        checkId: check.id,
        status: pass ? "pass" : "warning",
        message: pass ? "All claims have sufficient evidence" : "Some claims lack strong evidence",
        details: pass
          ? ["8/8 claims have ≥2 evidence sources", "Evidence quality score: 87%", "No unsupported claims"]
          : ["Claim #5 has only 1 weak evidence source", "3 claims rely on single-study evidence", "Recommend: add replication studies"],
        timestamp: Date.now(),
        duration: Date.now() - startTime + Math.floor(Math.random() * 800),
        affectedItems: pass ? [] : ["claim-5"],
      };
    },
    citation: () => {
      const pass = Math.random() > 0.15;
      return {
        id: generateId(),
        checkId: check.id,
        status: pass ? "pass" : "fail",
        message: pass ? "All citations are valid and complete" : "Citation issues found",
        details: pass
          ? ["15 citations verified", "All DOIs resolved", "No broken links", "Bibliography format consistent"]
          : ["2 citations have invalid DOIs", "1 reference is missing year", "Suggest: update Smith (2019) to Smith (2020)"],
        timestamp: Date.now(),
        duration: Date.now() - startTime + Math.floor(Math.random() * 300),
        affectedItems: pass ? [] : ["ref-12", "ref-8"],
      };
    },
    methodology: () => {
      const pass = Math.random() > 0.25;
      return {
        id: generateId(),
        checkId: check.id,
        status: pass ? "pass" : "warning",
        message: pass ? "Methodology meets quality standards" : "Methodology improvements suggested",
        details: pass
          ? ["Sample size adequate (n=120)", "Control group present", "Randomization confirmed", "Pre-registration found"]
          : ["Sample size may be insufficient for effect size", "Consider adding control condition", "Pre-registration recommended"],
        timestamp: Date.now(),
        duration: Date.now() - startTime + Math.floor(Math.random() * 600),
        affectedItems: [],
      };
    },
    statistical: () => {
      const pass = Math.random() > 0.2;
      return {
        id: generateId(),
        checkId: check.id,
        status: pass ? "pass" : "warning",
        message: pass ? "Statistical analysis is rigorous" : "Statistical concerns identified",
        details: pass
          ? ["Effect sizes reported", "Confidence intervals included", "Multiple comparison correction applied", "Power analysis adequate"]
          : ["Missing effect size for 2 comparisons", "Consider Bonferroni correction", "Power analysis suggests n=150 needed"],
        timestamp: Date.now(),
        duration: Date.now() - startTime + Math.floor(Math.random() * 400),
        affectedItems: [],
      };
    },
    custom: () => ({
      id: generateId(),
      checkId: check.id,
      status: "pass",
      message: "Custom check completed",
      details: ["Custom validation passed"],
      timestamp: Date.now(),
      duration: Date.now() - startTime + Math.floor(Math.random() * 200),
      affectedItems: [],
    }),
  };

  return outcomes[check.category]();
}

// ─── Sample Data ─────────────────────────────────────────────────────

function createSampleData(): {
  checks: AutomatedCheck[];
  pipelines: CheckPipeline[];
  checkRuns: CheckRun[];
} {
  const now = Date.now();

  const checks: AutomatedCheck[] = [
    {
      id: "check-consistency",
      name: "Claim Consistency Check",
      description: "Verifies no logical contradictions exist between claims in the theory",
      category: "consistency",
      enabled: true,
      required: true,
      lastResult: null,
      autoRunIntervalMs: 0,
      config: {},
      createdAt: now - 86400000 * 20,
    },
    {
      id: "check-evidence",
      name: "Evidence Sufficiency",
      description: "Ensures every claim has at least 2 supporting evidence sources",
      category: "evidence",
      enabled: true,
      required: true,
      lastResult: null,
      autoRunIntervalMs: 0,
      config: { minEvidencePerClaim: 2 },
      createdAt: now - 86400000 * 20,
    },
    {
      id: "check-citation",
      name: "Citation Validator",
      description: "Validates all citations have valid DOIs and complete metadata",
      category: "citation",
      enabled: true,
      required: false,
      lastResult: null,
      autoRunIntervalMs: 0,
      config: {},
      createdAt: now - 86400000 * 15,
    },
    {
      id: "check-methodology",
      name: "Methodology Standards",
      description: "Checks methodology against established research quality standards",
      category: "methodology",
      enabled: true,
      required: false,
      lastResult: null,
      autoRunIntervalMs: 0,
      config: { standard: "APA" },
      createdAt: now - 86400000 * 10,
    },
    {
      id: "check-statistical",
      name: "Statistical Rigor",
      description: "Verifies statistical analysis includes effect sizes, CIs, and power analysis",
      category: "statistical",
      enabled: true,
      required: true,
      lastResult: null,
      autoRunIntervalMs: 0,
      config: { requireEffectSizes: true, requirePowerAnalysis: true },
      createdAt: now - 86400000 * 10,
    },
  ];

  const pipelines: CheckPipeline[] = [
    {
      id: "pipeline-main",
      name: "Main Theory Validation",
      description: "Full validation pipeline for the main theory branch",
      resourceId: "branch-main",
      resourceType: "branch",
      checkIds: ["check-consistency", "check-evidence", "check-citation", "check-methodology", "check-statistical"],
      status: "idle",
      lastRunAt: null,
      lastRunDuration: null,
      runOnCommit: true,
      blockMergeOnFailure: true,
      createdAt: now - 86400000 * 15,
    },
    {
      id: "pipeline-quick",
      name: "Quick Consistency Check",
      description: "Fast check for consistency and evidence only",
      resourceId: "branch-main",
      resourceType: "branch",
      checkIds: ["check-consistency", "check-evidence"],
      status: "idle",
      lastRunAt: null,
      lastRunDuration: null,
      runOnCommit: false,
      blockMergeOnFailure: false,
      createdAt: now - 86400000 * 10,
    },
  ];

  return { checks, pipelines, checkRuns: [] };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Context ─────────────────────────────────────────────────────────

const AutomatedChecksContext = createContext<AutomatedChecksContextType | null>(null);

interface AutomatedChecksProviderProps {
  children: React.ReactNode;
  currentUserName?: string;
}

export const AutomatedChecksProvider: React.FC<AutomatedChecksProviderProps> = ({
  children,
  currentUserName = "Dr. Elena Vasquez",
}) => {
  const [checks, setChecks] = useState<AutomatedCheck[]>(() => {
    const stored = loadFromStorage<AutomatedCheck[]>(STORAGE_KEYS.checks, []);
    if (stored.length === 0) {
      const sample = createSampleData();
      saveToStorage(STORAGE_KEYS.checks, sample.checks);
      saveToStorage(STORAGE_KEYS.pipelines, sample.pipelines);
      saveToStorage(STORAGE_KEYS.checkRuns, sample.checkRuns);
      return sample.checks;
    }
    return stored;
  });

  const [pipelines, setPipelines] = useState<CheckPipeline[]>(() =>
    loadFromStorage<CheckPipeline[]>(STORAGE_KEYS.pipelines, [])
  );

  const [checkRuns, setCheckRuns] = useState<CheckRun[]>(() =>
    loadFromStorage<CheckRun[]>(STORAGE_KEYS.checkRuns, [])
  );

  // Persist
  useEffect(() => { saveToStorage(STORAGE_KEYS.checks, checks); }, [checks]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.pipelines, pipelines); }, [pipelines]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.checkRuns, checkRuns); }, [checkRuns]);

  // ─── Check Operations ────────────────────────────────────────────

  const createCheck = useCallback(
    (check: Omit<AutomatedCheck, "id" | "lastResult" | "createdAt">): AutomatedCheck => {
      const newCheck: AutomatedCheck = {
        ...check,
        id: `check-${generateId()}`,
        lastResult: null,
        createdAt: Date.now(),
      };
      setChecks((prev) => [...prev, newCheck]);
      return newCheck;
    },
    []
  );

  const updateCheck = useCallback((id: string, updates: Partial<AutomatedCheck>) => {
    setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteCheck = useCallback((id: string) => {
    setChecks((prev) => prev.filter((c) => c.id !== id));
    // Remove from pipelines
    setPipelines((prev) =>
      prev.map((p) => ({ ...p, checkIds: p.checkIds.filter((cid) => cid !== id) }))
    );
  }, []);

  const toggleCheck = useCallback((id: string) => {
    setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));
  }, []);

  // ─── Pipeline Operations ─────────────────────────────────────────

  const createPipeline = useCallback(
    (pipeline: Omit<CheckPipeline, "id" | "status" | "lastRunAt" | "lastRunDuration" | "createdAt">): CheckPipeline => {
      const newPipeline: CheckPipeline = {
        ...pipeline,
        id: `pipeline-${generateId()}`,
        status: "idle",
        lastRunAt: null,
        lastRunDuration: null,
        createdAt: Date.now(),
      };
      setPipelines((prev) => [...prev, newPipeline]);
      return newPipeline;
    },
    []
  );

  const updatePipeline = useCallback((id: string, updates: Partial<CheckPipeline>) => {
    setPipelines((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const deletePipeline = useCallback((id: string) => {
    setPipelines((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ─── Run Operations ──────────────────────────────────────────────

  const runSingleCheck = useCallback(
    (checkId: string, _resourceId: string): CheckResult => {
      const check = checks.find((c) => c.id === checkId);
      if (!check) {
        return {
          id: generateId(),
          checkId,
          status: "fail",
          message: "Check not found",
          details: [],
          timestamp: Date.now(),
          duration: 0,
          affectedItems: [],
        };
      }
      const result = simulateCheck(check);
      updateCheck(checkId, { lastResult: result });
      return result;
    },
    [checks, updateCheck]
  );

  const runPipeline = useCallback(
    (pipelineId: string, triggeredBy?: string, triggerType?: CheckRun["triggerType"]) => {
      const pipeline = pipelines.find((p) => p.id === pipelineId);
      if (!pipeline) return;

      const startTime = Date.now();

      // Mark pipeline as running
      updatePipeline(pipelineId, { status: "running" });

      // Create check run
      const run: CheckRun = {
        id: `run-${generateId()}`,
        pipelineId,
        status: "running",
        startedAt: startTime,
        completedAt: null,
        results: [],
        triggeredBy: triggeredBy || currentUserName,
        triggerType: triggerType || "manual",
      };

      // Run each check
      const results: CheckResult[] = [];
      for (const checkId of pipeline.checkIds) {
        const check = checks.find((c) => c.id === checkId);
        if (!check || !check.enabled) {
          results.push({
            id: generateId(),
            checkId,
            status: "skipped",
            message: check ? "Check disabled" : "Check not found",
            details: [],
            timestamp: Date.now(),
            duration: 0,
            affectedItems: [],
          });
          continue;
        }
        const result = simulateCheck(check);
        results.push(result);
        updateCheck(checkId, { lastResult: result });
      }

      const completedAt = Date.now();
      const hasFailure = results.some((r) => r.status === "fail");
      const hasWarning = results.some((r) => r.status === "warning");
      const allPassed = results.every((r) => r.status === "pass" || r.status === "skipped");

      const finalStatus: PipelineStatus = hasFailure ? "failed" : hasWarning ? "partial" : allPassed ? "passed" : "partial";

      const completedRun: CheckRun = {
        ...run,
        status: finalStatus,
        completedAt,
        results,
      };

      setCheckRuns((prev) => [completedRun, ...prev].slice(0, 100)); // Keep last 100 runs
      updatePipeline(pipelineId, {
        status: finalStatus,
        lastRunAt: completedAt,
        lastRunDuration: completedAt - startTime,
      });
    },
    [pipelines, checks, currentUserName, updatePipeline, updateCheck]
  );

  const getLatestRun = useCallback(
    (pipelineId: string): CheckRun | null => {
      return checkRuns.find((r) => r.pipelineId === pipelineId) || null;
    },
    [checkRuns]
  );

  const getRunsForPipeline = useCallback(
    (pipelineId: string): CheckRun[] => {
      return checkRuns.filter((r) => r.pipelineId === pipelineId);
    },
    [checkRuns]
  );

  // ─── Stats ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const allResults = checkRuns.flatMap((r) => r.results);
    const passedResults = allResults.filter((r) => r.status === "pass").length;
    const totalResults = allResults.filter((r) => r.status !== "skipped").length;
    const latestRun = checkRuns[0];

    return {
      totalChecks: checks.length,
      enabledChecks: checks.filter((c) => c.enabled).length,
      totalPipelines: pipelines.length,
      totalRuns: checkRuns.length,
      passRate: totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0,
      lastRunStatus: (latestRun?.status || "idle") as PipelineStatus,
    };
  }, [checks, pipelines, checkRuns]);

  // ─── Context Value ────────────────────────────────────────────────

  const value: AutomatedChecksContextType = useMemo(
    () => ({
      checks,
      createCheck,
      updateCheck,
      deleteCheck,
      toggleCheck,
      pipelines,
      createPipeline,
      updatePipeline,
      deletePipeline,
      checkRuns,
      runPipeline,
      getLatestRun,
      getRunsForPipeline,
      runSingleCheck,
      stats,
    }),
    [
      checks, createCheck, updateCheck, deleteCheck, toggleCheck,
      pipelines, createPipeline, updatePipeline, deletePipeline,
      checkRuns, runPipeline, getLatestRun, getRunsForPipeline,
      runSingleCheck, stats,
    ]
  );

  return (
    <AutomatedChecksContext.Provider value={value}>
      {children}
    </AutomatedChecksContext.Provider>
  );
};

export const useAutomatedChecks = () => {
  const context = useContext(AutomatedChecksContext);
  if (!context) {
    throw new Error("useAutomatedChecks must be used within an AutomatedChecksProvider");
  }
  return context;
};

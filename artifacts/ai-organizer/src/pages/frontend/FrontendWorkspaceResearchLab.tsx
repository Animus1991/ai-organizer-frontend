// src/pages/frontend/FrontendWorkspaceResearchLab.tsx
// Research Laboratory - 4-panel scientific workflow for theory development
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { SearchPanel } from "./components/SearchPanel";
import { FloatingNotepads } from "./components/FloatingNotepads";
import { DocumentPickerPanel } from "../../components/DocumentPickerPanel";
import { SegmentsList } from "./components/SegmentsList";
import { EnhancedCompareModal } from "./components/EnhancedCompareModal";
import { PreviewDrawer } from "./components/PreviewDrawer";
import { useSlots } from "./hooks/useSlots";
import type { SearchHit } from "./types";
import type { SegmentRow } from "../../hooks/home/useHomeState";
import "katex/dist/katex.min.css";

import { RichTextEditor } from "../../editor/RichTextEditor";
import { plainTextToHtml } from "../../editor/utils/text";

// Think!Hub Theory Operating System imports
import { 
  ClaimVerification, PropositionTypeCategorizer, ConceptMapper, BoundaryConditionsPanel,
  FalsificationPrompts, PeerReviewSimulator, ContradictionFinder, ConsistencyChecker,
  EvidenceRequirementsGenerator, EvidenceChainBuilder
} from "../../components/research";

// Modern UI Components
import { TourStep, useTour } from '../../components/UniversalTourGuide';
import { ScreenshotMode } from "../../components/ScreenshotMode";
import { AIChatManager } from "../../components/ai-chat/AIChatManager";
import { useTheme, DASHBOARD_CARD, DASHBOARD_CARD_LIGHT } from "../../context/ThemeContext";
import GlobalBurgerMenu from "../../components/GlobalBurgerMenu";

// CoFounderBay-inspired Lab Components
import { LabButton, LabCard, LabPanel as LabPanelComponent } from "../../components/lab";

// Research Laboratory Panel Types
type LabPanel = "documents" | "claims" | "evidence" | "analytics";
type TheoryPhase = "discovery" | "formulation" | "validation" | "refinement";

// Theory workflow configuration with color codes — titles/descriptions resolved via t() inside component
const theoryWorkflowConfig = {
  discovery: {
    icon: "🔍",
    titleKey: "researchLab.phase.discovery",
    descKey: "researchLab.phase.discovery.desc",
    primaryPanel: "documents" as LabPanel,
    tools: ["DocumentPickerPanel", "SearchPanel", "SegmentsList"],
    color: "#6366f1",
  },
  formulation: {
    icon: "🏗️",
    titleKey: "researchLab.phase.formulation",
    descKey: "researchLab.phase.formulation.desc",
    primaryPanel: "claims" as LabPanel,
    tools: ["ClaimVerification", "PropositionTypeCategorizer", "ConceptMapper", "BoundaryConditionsPanel"],
    color: "#10b981",
  },
  validation: {
    icon: "🧪",
    titleKey: "researchLab.phase.validation",
    descKey: "researchLab.phase.validation.desc",
    primaryPanel: "evidence" as LabPanel,
    tools: ["FalsificationPrompts", "PeerReviewSimulator", "ContradictionFinder", "ConsistencyChecker"],
    color: "#f59e0b",
  },
  refinement: {
    icon: "⚡",
    titleKey: "researchLab.phase.refinement",
    descKey: "researchLab.phase.refinement.desc",
    primaryPanel: "analytics" as LabPanel,
    tools: ["EvidenceRequirementsGenerator", "EvidenceChainBuilder"],
    color: "#ef4444",
  },
};

export default function FrontendWorkspaceResearchLab() {
  const { t } = useLanguage();
  const { colors, mode: themeMode, isDark } = useTheme();
  const slots = useSlots();
  const nav = useNavigate();

  // Resolve theoryWorkflow with translations
  const theoryWorkflow = useMemo(() => {
    const resolved: Record<TheoryPhase, { title: string; description: string; primaryPanel: LabPanel; tools: string[]; color: string }> = {} as any;
    for (const [phase, cfg] of Object.entries(theoryWorkflowConfig)) {
      resolved[phase as TheoryPhase] = {
        title: `${cfg.icon} ${t(cfg.titleKey)}`,
        description: t(cfg.descKey),
        primaryPanel: cfg.primaryPanel,
        tools: cfg.tools,
        color: cfg.color,
      };
    }
    return resolved;
  }, [t]);
  
  // Tour management using UniversalTourGuide (same stable behavior as Home & Theory Hub)
  const researchLabTourSteps: TourStep[] = [
    {
      id: "lab-welcome",
      title: t("tour.researchLab.welcome.title") || "Research Lab tour",
      content: t("tour.researchLab.welcome.content") || "Overview of the Research Laboratory workflow.",
      position: "custom",
      customPosition: { x: 600, y: 80 },
      highlight: false,
    },
    {
      id: "lab-phase-selector",
      title: t("tour.researchLab.phaseSelector.title") || "Theory phases",
      content: t("tour.researchLab.phaseSelector.content") || "Switch between discovery, formulation, validation and refinement.",
      target: "[data-tour=\"lab-phase-selector\"]",
      highlight: true,
    },
    {
      id: "lab-documents",
      title: t("tour.researchLab.documents.title") || "Documents & sources",
      content: t("tour.researchLab.documents.content") || "Upload, select and segment your source documents.",
      target: "[data-tour=\"lab-documents\"]",
      highlight: true,
    },
    {
      id: "lab-claims",
      title: t("tour.researchLab.claims.title") || "Claims workspace",
      content: t("tour.researchLab.claims.content") || "Work with claims, propositions and concept maps.",
      target: "[data-tour=\"lab-claims\"]",
      highlight: true,
    },
    {
      id: "lab-evidence",
      title: t("tour.researchLab.evidence.title") || "Evidence & validation",
      content: t("tour.researchLab.evidence.content") || "Test your theory and gather supporting evidence.",
      target: "[data-tour=\"lab-evidence\"]",
      highlight: true,
    },
    {
      id: "lab-analytics",
      title: t("tour.researchLab.analytics.title") || "Analytics & refinement",
      content: t("tour.researchLab.analytics.content") || "See analytics and refine your theory.",
      target: "[data-tour=\"lab-analytics\"]",
      highlight: true,
    },
    {
      id: "lab-complete",
      title: t("tour.researchLab.complete.title") || "End of tour",
      content: t("tour.researchLab.complete.content") || "You can restart this tour any time from the Start Tour button.",
      position: "custom",
      customPosition: { x: 600, y: 80 },
      highlight: false,
    },
  ];

  const { startTour: startResearchLabTour, TourComponent: ResearchLabTourComponent } = useTour(
    researchLabTourSteps,
    "researchLabTourSeen"
  );
  
  // Core state
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [segmentQuery, setSegmentQuery] = useState("");
  const [searchK, setSearchK] = useState(5);
  const [previewItem, setPreviewItem] = useState<SearchHit | SegmentRow | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showEnhancedCompare, setShowEnhancedCompare] = useState(false);
  const [screenshotModeActive, setScreenshotModeActive] = useState(false);
  
  // Research Laboratory specific state
  const [currentPhase, setCurrentPhase] = useState<TheoryPhase>("discovery");
  const [activePanel, setActivePanel] = useState<LabPanel>("documents");
  const [widgetPopup, setWidgetPopup] = useState<{ id: string; title: string; icon: string } | null>(null);
  
  // Layout mode: horizontal (2x2 grid) or vertical (panels left 1/4, editor right 3/4)
  const [layoutMode, setLayoutMode] = useState<"horizontal" | "vertical">(() => {
    const saved = localStorage.getItem("researchLabLayoutMode");
    return saved === "vertical" ? "vertical" : "horizontal";
  });
  const toggleLayoutMode = useCallback(() => {
    setLayoutMode(prev => {
      const next = prev === "horizontal" ? "vertical" : "horizontal";
      localStorage.setItem("researchLabLayoutMode", next);
      return next;
    });
  }, []);

  type ChunkTab = {
    key: string;
    segmentId: number;
    title: string;
    html: string;
    lastSavedHtml?: string;
  };

  const [chunkTabs, setChunkTabs] = useState<ChunkTab[]>([]);
  const [activeChunkTabKey, setActiveChunkTabKey] = useState<string | null>(null);

  const defaultEditorHeight = 320;
  const minEditorHeight = 160;
  const collapsedDockHeight = 44;
  const [editorHeight, setEditorHeight] = useState<number>(0);
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [showDiffView, setShowDiffView] = useState(false);
  const lastExpandedHeightRef = useRef<number>(defaultEditorHeight);

  const [collapsedPanels, setCollapsedPanels] = useState<Record<LabPanel, boolean>>({
    documents: false,
    claims: false,
    evidence: false,
    analytics: false,
  });
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  const resizingRef = useRef(false);
  const resizeStartRef = useRef<{ y: number; h: number }>({ y: 0, h: defaultEditorHeight });

  useEffect(() => {
    if (!editorCollapsed && editorHeight > 0) {
      lastExpandedHeightRef.current = editorHeight;
    }
  }, [editorCollapsed, editorHeight]);

  const openSegmentInTab = useCallback(
    (seg: SegmentRow) => {
      setChunkTabs((prev) => {
        const existing = prev.find((t) => t.segmentId === seg.id);
        if (existing) {
          setActiveChunkTabKey(existing.key);
          return prev;
        }

        const key = `seg-${seg.id}`;
        const stored = localStorage.getItem(`researchLabChunkEditor:${seg.id}`);
        const html = stored ?? plainTextToHtml(seg.content || "");

        const next: ChunkTab = {
          key,
          segmentId: seg.id,
          title: seg.title || `Segment ${seg.id}`,
          html,
          lastSavedHtml: stored ?? undefined,
        };

        setActiveChunkTabKey(key);
        return [...prev, next];
      });

      setEditorCollapsed(false);
      setEditorHeight((h) => (h > 0 ? h : defaultEditorHeight));
    },
    [defaultEditorHeight]
  );

  const openSegmentsInTabs = useCallback(
    (segs: SegmentRow[]) => {
      for (const s of segs) openSegmentInTab(s);
    },
    [openSegmentInTab]
  );

  const closeChunkTab = useCallback((key: string) => {
    setChunkTabs((prev) => {
      const idx = prev.findIndex((t) => t.key === key);
      if (idx === -1) return prev;
      const next = prev.filter((t) => t.key !== key);
      setActiveChunkTabKey((current) => {
        if (current !== key) return current;
        const fallback = next[idx - 1] ?? next[idx] ?? next[0] ?? null;
        return fallback?.key ?? null;
      });
      if (next.length === 0) {
        setEditorHeight(0);
      }
      return next;
    });
  }, []);

  const activeChunkTab = useMemo(() => {
    if (!activeChunkTabKey) return null;
    return chunkTabs.find((t) => t.key === activeChunkTabKey) ?? null;
  }, [activeChunkTabKey, chunkTabs]);

  const setActiveTabHtml = useCallback((key: string, html: string) => {
    setChunkTabs((prev) => prev.map((t) => (t.key === key ? { ...t, html } : t)));
  }, []);

  const saveActiveTabLocal = useCallback(() => {
    if (!activeChunkTab) return;
    localStorage.setItem(`researchLabChunkEditor:${activeChunkTab.segmentId}`, activeChunkTab.html);
    setChunkTabs((prev) =>
      prev.map((t) =>
        t.key === activeChunkTab.key ? { ...t, lastSavedHtml: activeChunkTab.html } : t
      )
    );
  }, [activeChunkTab]);

  const loadActiveTabLocal = useCallback(() => {
    if (!activeChunkTab) return;
    const stored = localStorage.getItem(`researchLabChunkEditor:${activeChunkTab.segmentId}`);
    if (!stored) return;
    setChunkTabs((prev) => prev.map((t) => (t.key === activeChunkTab.key ? { ...t, html: stored, lastSavedHtml: stored } : t)));
  }, [activeChunkTab]);

  // Save All tabs at once
  const saveAllTabs = useCallback(() => {
    setChunkTabs((prev) => prev.map((t) => {
      localStorage.setItem(`researchLabChunkEditor:${t.segmentId}`, t.html);
      return { ...t, lastSavedHtml: t.html };
    }));
    setAutoSaveStatus("saved");
    setTimeout(() => setAutoSaveStatus(null), 2000);
  }, []);

  // Auto-save indicator
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saving" | "saved" | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save debounce: save 3s after last edit
  useEffect(() => {
    if (!activeChunkTab) return;
    const isDirty = activeChunkTab.lastSavedHtml !== undefined && activeChunkTab.html !== activeChunkTab.lastSavedHtml;
    if (!isDirty) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus("saving");
    autoSaveTimerRef.current = setTimeout(() => {
      saveActiveTabLocal();
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus(null), 2000);
    }, 3000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [activeChunkTab?.html, activeChunkTab?.lastSavedHtml, activeChunkTab?.key, saveActiveTabLocal]);

  // Word count from active tab
  const activeTabWordCount = useMemo(() => {
    if (!activeChunkTab) return 0;
    const text = activeChunkTab.html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
    return text ? text.split(/\s+/).filter(Boolean).length : 0;
  }, [activeChunkTab?.html]);

  const beginResize = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      const startH = editorHeight || lastExpandedHeightRef.current || defaultEditorHeight;
      if (editorCollapsed) {
        setEditorCollapsed(false);
        setEditorHeight(startH);
      }
      resizingRef.current = true;
      resizeStartRef.current = { y: e.clientY, h: startH };
      document.body.style.cursor = "row-resize";
      e.preventDefault();
    },
    [editorHeight, defaultEditorHeight, editorCollapsed]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;

      const delta = resizeStartRef.current.y - e.clientY;
      const nextH = resizeStartRef.current.h + delta;
      const maxH = Math.max(minEditorHeight, Math.round(window.innerHeight * 0.75));
      setEditorHeight(Math.max(minEditorHeight, Math.min(nextH, maxH)));
    };

    const onUp = () => {
      if (!resizingRef.current) return;
      resizingRef.current = false;
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [minEditorHeight]);

  // Auto-detect current theory phase based on activity
  useEffect(() => {
    const claims = JSON.parse(localStorage.getItem("thinkspace-claim-builder") || "[]");
    const contradictions = JSON.parse(localStorage.getItem("thinkspace-contradictions") || "{}");
    const evidence = JSON.parse(localStorage.getItem("thinkspace-evidence-requirements") || "[]");
    
    let detectedPhase: TheoryPhase = "discovery";
    
    if (claims.length >= 3 && contradictions.contradictions?.length === 0) {
      detectedPhase = "formulation";
    } else if (contradictions.contradictions?.length > 0 && evidence.length < claims.length) {
      detectedPhase = "validation";
    } else if (evidence.length >= claims.length && contradictions.contradictions?.some((c: any) => c.status === "resolved")) {
      detectedPhase = "refinement";
    }
    
    setCurrentPhase(detectedPhase);
    setActivePanel(theoryWorkflow[detectedPhase].primaryPanel);
  }, []);

  // Auto-start tour on first visit (mirror Home & Theory Hub behavior)
  useEffect(() => {
    const seen = localStorage.getItem("researchLabTourSeen");
    if (!seen) {
      const timer = setTimeout(() => {
        startResearchLabTour();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [startResearchLabTour]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showPreview) {
        setShowPreview(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPreview]);

  // i18n tool metadata for Research Lab — memoized for performance
  const labToolMeta = useMemo<Record<string, { icon: string; label: string; desc: string; color: string }>>(() => ({
    ClaimVerification: { icon: "✅", label: t("theory.tool.claimVerification.title"), desc: t("theory.tool.claimVerification.beginner"), color: "#10b981" },
    PropositionTypeCategorizer: { icon: "🏷️", label: t("theory.tool.propositionTypeCategorizer.title"), desc: t("theory.tool.propositionTypeCategorizer.beginner"), color: "#10b981" },
    ConceptMapper: { icon: "🗺️", label: t("theory.tool.conceptMapper.title"), desc: t("theory.tool.conceptMapper.beginner"), color: "#10b981" },
    BoundaryConditionsPanel: { icon: "🎯", label: t("theory.tool.boundaryConditions.title"), desc: t("theory.tool.boundaryConditions.beginner"), color: "#10b981" },
    FalsificationPrompts: { icon: "❌", label: t("theory.tool.falsificationPrompts.title"), desc: t("theory.tool.falsificationPrompts.beginner"), color: "#f59e0b" },
    PeerReviewSimulator: { icon: "👥", label: t("theory.tool.peerReviewSimulator.title"), desc: t("theory.tool.peerReviewSimulator.beginner"), color: "#f59e0b" },
    ContradictionFinder: { icon: "🔍", label: t("theory.tool.contradictionFinder.title"), desc: t("theory.tool.contradictionFinder.beginner"), color: "#f59e0b" },
    ConsistencyChecker: { icon: "✓", label: t("theory.tool.consistencyChecker.title"), desc: t("theory.tool.consistencyChecker.beginner"), color: "#f59e0b" },
    EvidenceRequirementsGenerator: { icon: "📝", label: t("theory.tool.evidenceRequirements.title"), desc: t("theory.tool.evidenceRequirements.beginner"), color: "#ef4444" },
    EvidenceChainBuilder: { icon: "⛓️", label: t("theory.tool.evidenceChainBuilder.title"), desc: t("theory.tool.evidenceChainBuilder.beginner"), color: "#ef4444" },
  }), [t]);

  // Panel i18n titles — memoized to prevent unnecessary re-renders
  const panelTitles = useMemo<Record<LabPanel, { icon: string; title: string }>>(() => ({
    documents: { icon: "📚", title: t("researchLab.documents") || "Documents & Sources" },
    claims: { icon: "🏗️", title: t("researchLab.claims") || "Claims Workspace" },
    evidence: { icon: "🧪", title: t("researchLab.evidence") || "Evidence & Validation" },
    analytics: { icon: "📊", title: t("researchLab.analytics") || "Analytics & Insights" },
  }), [t]);

  // Reusable tool card renderer — CoFounderBay-inspired interactive card style with enhanced UX
  const renderToolCard = useCallback((toolId: string) => {
    const meta = labToolMeta[toolId] || { icon: "🔧", label: toolId, desc: "", color: "#6366f1" };
    return (
      <button
        key={toolId}
        onClick={() => setWidgetPopup({ id: toolId, title: meta.label, icon: meta.icon })}
        aria-label={`Open ${meta.label} tool`}
        style={{
          width: "100%",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          textAlign: "left",
          background: isDark 
            ? `linear-gradient(135deg, ${meta.color}0c 0%, rgba(255,255,255,0.04) 100%)` 
            : `linear-gradient(135deg, ${meta.color}08 0%, rgba(255,255,255,0.95) 100%)`,
          border: `1px solid ${isDark ? meta.color + '25' : meta.color + '18'}`,
          borderLeft: `4px solid ${meta.color}`,
          borderRadius: "10px",
          cursor: "pointer",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          color: "inherit",
          fontFamily: "inherit",
          boxShadow: isDark 
            ? "0 2px 8px rgba(0,0,0,0.15)" 
            : "0 2px 8px rgba(0,0,0,0.06)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isDark 
            ? `linear-gradient(135deg, ${meta.color}1a 0%, rgba(255,255,255,0.08) 100%)` 
            : `linear-gradient(135deg, ${meta.color}12 0%, rgba(255,255,255,1) 100%)`;
          e.currentTarget.style.borderColor = `${meta.color}50`;
          e.currentTarget.style.transform = "translateX(3px) scale(1.01)";
          e.currentTarget.style.boxShadow = isDark 
            ? `0 4px 16px ${meta.color}25` 
            : `0 4px 16px ${meta.color}20`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isDark 
            ? `linear-gradient(135deg, ${meta.color}0c 0%, rgba(255,255,255,0.04) 100%)` 
            : `linear-gradient(135deg, ${meta.color}08 0%, rgba(255,255,255,0.95) 100%)`;
          e.currentTarget.style.borderColor = isDark ? `${meta.color}25` : `${meta.color}18`;
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = isDark 
            ? "0 2px 8px rgba(0,0,0,0.15)" 
            : "0 2px 8px rgba(0,0,0,0.06)";
        }}
        onFocus={(e) => {
          e.currentTarget.style.outline = `2px solid ${meta.color}60`;
          e.currentTarget.style.outlineOffset = "2px";
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = "none";
        }}
      >
        <span style={{
          fontSize: "20px",
          lineHeight: 1,
          flexShrink: 0,
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `${meta.color}18`,
          borderRadius: "10px",
          boxShadow: isDark ? `inset 0 1px 0 rgba(255,255,255,0.1)` : `inset 0 1px 0 rgba(255,255,255,0.3)`,
        }}>{meta.icon}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ 
            fontSize: "13px", 
            fontWeight: "600", 
            color: colors.textPrimary, 
            marginBottom: "3px",
            letterSpacing: "-0.01em",
          }}>
            {meta.label}
          </div>
          <div style={{ 
            fontSize: "11px", 
            color: colors.textSecondary, 
            lineHeight: "1.4", 
            overflow: "hidden", 
            textOverflow: "ellipsis", 
            whiteSpace: "nowrap",
            opacity: 0.85,
          }}>
            {meta.desc}
          </div>
        </div>
        <span style={{ 
          fontSize: "14px", 
          color: meta.color, 
          opacity: 0.7, 
          flexShrink: 0,
          transition: "transform 0.2s ease, opacity 0.2s ease",
        }}>→</span>
      </button>
    );
  }, [isDark, colors.textPrimary, colors.textSecondary, labToolMeta]);

  // Render panel content based on type
  const renderPanelContent = (panel: LabPanel): React.ReactNode => {
    switch (panel) {
      case "documents":
        return (
          <div style={{ height: "100%", overflow: "auto", padding: "12px" }}>
            <DocumentPickerPanel 
              onSegmentsChange={(segs) => setSegments(segs)}
            />
            <div style={{ margin: "12px 0" }}>
              <SearchPanel 
              query={segmentQuery}
              setQuery={setSegmentQuery}
              k={searchK}
              setK={setSearchK}
              onSearch={() => {}}
            />
            </div>
            {segments.length > 0 ? (
              <SegmentsList 
                segments={segments}
                query={segmentQuery}
                setQuery={setSegmentQuery}
                onPick={(segment) => {
                  openSegmentInTab(segment);
                }}
                onExport={() => {}}
                onBatchOpen={(segs) => openSegmentsInTabs(segs)}
              />
            ) : (
              <div style={{
                padding: "24px 16px",
                textAlign: "center",
                color: colors.textSecondary,
                fontSize: "12px",
                lineHeight: "1.6",
              }}>
                <div style={{ fontSize: "32px", marginBottom: "8px", opacity: 0.5 }}>📄</div>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                  {t("researchLab.emptyDocuments") || "No segments loaded"}
                </div>
                <div style={{ opacity: 0.7 }}>
                  {t("researchLab.emptyDocumentsHint") || "Select a document above to load its segments"}
                </div>
              </div>
            )}
          </div>
        );
      
      case "claims":
        return (
          <div style={{ height: "100%", overflow: "auto", padding: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {renderToolCard("ClaimVerification")}
              {renderToolCard("PropositionTypeCategorizer")}
              {renderToolCard("ConceptMapper")}
              {renderToolCard("BoundaryConditionsPanel")}
            </div>
          </div>
        );
      
      case "evidence":
        return (
          <div style={{ height: "100%", overflow: "auto", padding: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {renderToolCard("FalsificationPrompts")}
              {renderToolCard("PeerReviewSimulator")}
              {renderToolCard("ContradictionFinder")}
              {renderToolCard("ConsistencyChecker")}
            </div>
          </div>
        );
      
      case "analytics":
        return (
          <div style={{ height: "100%", overflow: "auto", padding: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {renderToolCard("EvidenceRequirementsGenerator")}
              {renderToolCard("EvidenceChainBuilder")}
            </div>
            
            {/* Theory Phase Indicator */}
            <div style={{
              padding: "14px",
              marginTop: "12px",
              background: `${theoryWorkflow[currentPhase].color}08`,
              border: `1px solid ${theoryWorkflow[currentPhase].color}25`,
              borderRadius: "10px",
            }}>
              <div style={{ 
                fontSize: "11px", 
                fontWeight: "600", 
                color: colors.textSecondary, 
                textTransform: "uppercase" as const, 
                letterSpacing: "0.05em", 
                marginBottom: "6px" 
              }}>
                {t("researchLab.currentPhase") || "Current Phase"}
              </div>
              <div style={{
                padding: "6px 10px",
                background: `${theoryWorkflow[currentPhase].color}18`,
                border: `1px solid ${theoryWorkflow[currentPhase].color}30`,
                borderRadius: "6px",
                color: theoryWorkflow[currentPhase].color,
                fontSize: "13px",
                fontWeight: "600",
              }}>
                {theoryWorkflow[currentPhase].title}
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "10px", color: colors.textSecondary, lineHeight: "1.4" }}>
                {theoryWorkflow[currentPhase].description}
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Render widget by ID
  const renderWidgetById = (id: string): React.ReactNode => {
    const widgetMap: Record<string, () => React.ReactNode> = {
      'ClaimVerification': () => <ClaimVerification segmentText={segments[0]?.content || ""} />,
      'PropositionTypeCategorizer': () => <PropositionTypeCategorizer open={true} onClose={() => setWidgetPopup(null)} />,
      'ConceptMapper': () => <ConceptMapper segments={segments} open={true} onClose={() => setWidgetPopup(null)} />,
      'BoundaryConditionsPanel': () => <BoundaryConditionsPanel open={true} onClose={() => setWidgetPopup(null)} />,
      'FalsificationPrompts': () => <FalsificationPrompts />,
      'PeerReviewSimulator': () => <PeerReviewSimulator />,
      'ContradictionFinder': () => <ContradictionFinder open={true} onClose={() => setWidgetPopup(null)} />,
      'ConsistencyChecker': () => <ConsistencyChecker open={true} onClose={() => setWidgetPopup(null)} />,
      'EvidenceRequirementsGenerator': () => <EvidenceRequirementsGenerator open={true} onClose={() => setWidgetPopup(null)} />,
      'EvidenceChainBuilder': () => <EvidenceChainBuilder open={true} onClose={() => setWidgetPopup(null)} />,
    };
    const renderer = widgetMap[id];
    return renderer ? renderer() : <div>Widget not found</div>;
  };

  return (
    <div
      className="research-lab-page"
      data-page="research-lab"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: themeMode === "dashboard"
          ? (isDark ? "linear-gradient(135deg, #0a0a0a 0%, #0f0f1a 50%, #0a0a0a 100%)" : "#faf9f7")
          : colors.bgPrimary,
        color: colors.textPrimary,
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <GlobalBurgerMenu />
      {/* Light mode: comprehensive border removal + white backgrounds for ALL elements */}
      <style>{`
        /* Remove ALL black borders from buttons in light mode */
        html[data-theme="light"] .research-lab-page button,
        html[data-theme="light"] .research-lab-page .research-lab-main button {
          border-color: transparent !important;
          outline: none !important;
          box-shadow: none !important;
        }
        html[data-theme="light"] .research-lab-page button:focus-visible,
        html[data-theme="light"] .research-lab-page .research-lab-main button:focus-visible {
          box-shadow: 0 0 0 2px rgba(99,102,241,0.45) !important;
          border-color: transparent !important;
        }
        
        /* Remove black borders from ALL form elements + ensure white backgrounds */
        html[data-theme="light"] .research-lab-page input,
        html[data-theme="light"] .research-lab-page textarea,
        html[data-theme="light"] .research-lab-page select,
        html[data-theme="light"] .research-lab-page .research-lab-main input,
        html[data-theme="light"] .research-lab-page .research-lab-main textarea,
        html[data-theme="light"] .research-lab-page .research-lab-main select {
          border-color: rgba(47, 41, 65, 0.08) !important;
          outline: none !important;
          background: #ffffff !important;
          color: #2f2941 !important;
          box-shadow: none !important;
        }
        
        /* Remove forced backgrounds from layout containers - allow transparency */
        html[data-theme="light"] .research-lab-page .lab-panels-vertical-grid,
        html[data-theme="light"] .research-lab-page .research-lab-main {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Panel cards should have white backgrounds */
        html[data-theme="light"] .research-lab-page [data-tour^="lab-"],
        html[data-theme="light"] .research-lab-page .panel-card {
          background: #ffffff !important;
          background-color: #ffffff !important;
        }
        
        /* CRITICAL FIX: Preserve tour overlay — must NOT be forced white */
        html[data-theme="light"] .research-lab-page .tourOverlay {
          background-color: transparent !important;
          background: radial-gradient(circle at center, rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0.25)) !important;
        }
        html[data-theme="light"] .research-lab-page .tourTooltip {
          background: linear-gradient(135deg, #ffffff, #f8fafc) !important;
          background-color: #ffffff !important;
        }
        html[data-theme="light"] .research-lab-page .tourTooltipHeader {
          background: rgba(248, 250, 252, 0.85) !important;
          background-color: rgba(248, 250, 252, 0.85) !important;
        }
        html[data-theme="light"] .research-lab-page .tourTooltipActions {
          background: rgba(0, 0, 0, 0.04) !important;
          background-color: rgba(0, 0, 0, 0.04) !important;
        }
        html[data-theme="light"] .research-lab-page .tourTooltipContent {
          background: transparent !important;
          background-color: transparent !important;
        }
        html[data-theme="light"] .research-lab-page .tourTooltipProgress {
          background: transparent !important;
          background-color: transparent !important;
        }
        html[data-theme="light"] .research-lab-page .tour-highlight {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Transparent background for layout containers (not panel cards) */
        html[data-theme="light"] .research-lab-page .lab-panels-vertical-grid {
          background: transparent !important;
          background-color: transparent !important;
        }
        html[data-theme="light"] .research-lab-page .research-lab-main {
          background-color: transparent !important;
          background: transparent !important;
        }
        
        /* Ensure chunk tabs have white background with black text */
        html[data-theme="light"] .research-lab-page .chunk-tab,
        html[data-theme="light"] .research-lab-page .research-lab-main .chunk-tab,
        html[data-theme="light"] .research-lab-page .chunk-field,
        html[data-theme="light"] .research-lab-page .research-lab-main .chunk-field {
          background: #ffffff !important;
          color: #2f2941 !important;
          border-color: rgba(47, 41, 65, 0.08) !important;
        }
        html[data-theme="light"] .research-lab-page input:focus,
        html[data-theme="light"] .research-lab-page textarea:focus,
        html[data-theme="light"] .research-lab-page select:focus,
        html[data-theme="light"] .research-lab-page .research-lab-main input:focus,
        html[data-theme="light"] .research-lab-page .research-lab-main textarea:focus,
        html[data-theme="light"] .research-lab-page .research-lab-main select:focus {
          border-color: rgba(99,102,241,0.3) !important;
          box-shadow: 0 0 0 2px rgba(99,102,241,0.2) !important;
        }
        
        /* Chunk tabs - WHITE background with BLACK text in light mode */
        html[data-theme="light"] .research-lab-page .chunk-tab,
        html[data-theme="light"] .research-lab-page .research-lab-main .chunk-tab {
          border-color: rgba(47, 41, 65, 0.06) !important;
          background: #ffffff !important;
          color: #2f2941 !important;
          box-shadow: none !important;
        }
        html[data-theme="light"] .research-lab-page .chunk-tab.active,
        html[data-theme="light"] .research-lab-page .research-lab-main .chunk-tab.active {
          border-color: rgba(99,102,241,0.3) !important;
          background: rgba(99,102,241,0.08) !important;
          color: #2f2941 !important;
        }
        
        /* Chunk tab buttons */
        html[data-theme="light"] .research-lab-page .chunk-tab-btn,
        html[data-theme="light"] .research-lab-page .research-lab-main .chunk-tab-btn {
          border-color: rgba(47, 41, 65, 0.08) !important;
          background: #ffffff !important;
          color: #2f2941 !important;
          box-shadow: none !important;
        }
        html[data-theme="light"] .research-lab-page .chunk-tab-btn:hover,
        html[data-theme="light"] .research-lab-page .research-lab-main .chunk-tab-btn:hover {
          border-color: rgba(99,102,241,0.2) !important;
        }
        
        /* Remove black borders from ALL cards and panels */
        html[data-theme="light"] .research-lab-page .tool-card,
        html[data-theme="light"] .research-lab-page .panel-card,
        html[data-theme="light"] .research-lab-page .research-lab-main .tool-card,
        html[data-theme="light"] .research-lab-page .research-lab-main .panel-card {
          border-color: rgba(47, 41, 65, 0.08) !important;
          background: #ffffff !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
        }
        
        /* Remove black borders from ALL divs with borders */
        html[data-theme="light"] .research-lab-page div[style*="border"],
        html[data-theme="light"] .research-lab-page .research-lab-main div[style*="border"] {
          border-color: rgba(47, 41, 65, 0.08) !important;
        }
        
        /* Ensure ALL text is black in light mode */
        html[data-theme="light"] .research-lab-page *,
        html[data-theme="light"] .research-lab-page .research-lab-main * {
          color: #2f2941 !important;
        }
        html[data-theme="light"] .research-lab-page button,
        html[data-theme="light"] .research-lab-page .research-lab-main button {
          color: #2f2941 !important;
        }
      `}</style>
      {/* Fixed top navigation actions: Home (left) + Start Tour (right) */}
      <button
        onClick={() => nav("/")}
        style={{
          position: "fixed",
          top: 22, // Aligned with burger/notifications buttons (7px lower)
          left: 135, // Aligned next to notifications button
          zIndex: 10002,
          padding: "8px 14px",
          background: themeMode === "light" ? "#ffffff" : "rgba(15,23,42,0.85)",
          border: themeMode === "light" ? "1px solid rgba(47, 41, 65, 0.15)" : "1px solid rgba(148, 163, 184, 0.5)",
          borderRadius: "999px",
          color: themeMode === "light" ? "#2f2941" : colors.textPrimary,
          fontSize: "12px",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          cursor: "pointer",
          boxShadow: themeMode === "light" ? "0 4px 16px rgba(0,0,0,0.1)" : "0 4px 16px rgba(15,23,42,0.6)",
          backdropFilter: "blur(12px)",
        }}
      >
        🏠 {t("nav.home")}
      </button>

      <button
        onClick={startResearchLabTour}
        style={{
          position: "fixed",
          top: 22, // Aligned with screenshot button (7px lower)
          right: 100, // 15px more left to align next to screenshot button
          zIndex: 10002,
          padding: "8px 18px",
          background: themeMode === "light" ? "#ffffff" : "rgba(15,23,42,0.85)",
          border: themeMode === "light" ? "1px solid rgba(47, 41, 65, 0.15)" : "1px solid rgba(148, 163, 184, 0.5)",
          borderRadius: "999px",
          color: themeMode === "light" ? "#2f2941" : colors.textPrimary,
          fontSize: "12px",
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          boxShadow: themeMode === "light" ? "0 4px 16px rgba(0,0,0,0.1)" : "0 4px 16px rgba(15,23,42,0.6)",
          backdropFilter: "blur(12px)",
        }}
      >
        🎓 {t("tour.researchLab.startTour") || "Start Lab Tour"}
      </button>

      <div
        className="research-lab-main"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh", // Allow full height expansion
          paddingTop: 71, // Moved 5px higher (76 → 71) per user request
          boxSizing: "border-box",
          overflowY: "auto", // Enable vertical scrolling
          overflowX: "hidden", // Prevent horizontal scrolling
          scrollBehavior: "smooth", // Smooth scrolling
        }}
      >
        <div
          style={{
            flex: layoutMode === "vertical" ? 1 : (() => {
              const collapsedCount = [collapsedPanels.documents, collapsedPanels.claims, collapsedPanels.evidence, collapsedPanels.analytics].filter(Boolean).length;
              const hasOpenEditor = chunkTabs.length > 0 && !editorCollapsed;
              if (hasOpenEditor && collapsedCount === 4) return "0 0 auto";
              if (hasOpenEditor && collapsedCount >= 2) return "1 1 auto";
              return 1;
            })(),
            minHeight: "auto",
            display: "flex",
            flexDirection: "column",
            transition: "flex 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Header Card — collapsible for more panel space */}
          <div style={{
            ...(themeMode === "light" ? DASHBOARD_CARD_LIGHT : DASHBOARD_CARD),
            margin: "12px 16px",
            padding: headerCollapsed ? "0" : "16px 20px",
            overflow: "hidden",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            {/* Always-visible compact header bar */}
            <div
              onClick={() => setHeaderCollapsed(!headerCollapsed)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: headerCollapsed ? "10px 16px" : "0 0 12px 0",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1 style={{ margin: 0, fontSize: headerCollapsed ? "14px" : "20px", fontWeight: "700", color: colors.textPrimary, transition: "font-size 0.2s" }}>
                  {t("researchLab.title") || "Research Laboratory"}
                </h1>
                {headerCollapsed && (
                  <div style={{
                    padding: "3px 10px",
                    background: `${theoryWorkflow[currentPhase].color}15`,
                    border: `1px solid ${theoryWorkflow[currentPhase].color}30`,
                    borderRadius: "6px",
                    color: theoryWorkflow[currentPhase].color,
                    fontSize: "11px",
                    fontWeight: "600",
                  }}>
                    {theoryWorkflow[currentPhase].title}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {!headerCollapsed && (
                  <div style={{
                    padding: "6px 14px",
                    background: `${theoryWorkflow[currentPhase].color}15`,
                    border: `1px solid ${theoryWorkflow[currentPhase].color}30`,
                    borderRadius: "8px",
                    color: theoryWorkflow[currentPhase].color,
                    fontSize: "13px",
                    fontWeight: "600",
                  }}>
                    {theoryWorkflow[currentPhase].title}
                  </div>
                )}
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: "24px", height: "24px", borderRadius: "6px",
                  background: isDark ? "rgba(255,255,255,0.06)" : "rgba(47,41,65,0.06)", border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(47,41,65,0.12)",
                  color: colors.textSecondary, fontSize: "11px",
                  transition: "transform 0.3s ease",
                  transform: headerCollapsed ? "rotate(0deg)" : "rotate(180deg)",
                }}>▾</span>
              </div>
            </div>

            {/* Expandable content: subtitle + phase selector */}
            {!headerCollapsed && (
              <>
                <p style={{ margin: "0 0 12px", fontSize: "13px", color: colors.textSecondary }}>
                  {t("researchLab.subtitle") || "Scientific workflow for theory development"}
                </p>
                {/* Phase Selector + Layout Toggle */}
                <div data-tour="lab-phase-selector" style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  {Object.entries(theoryWorkflow).map(([phase, config]) => (
                    <button
                      key={phase}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhase(phase as TheoryPhase);
                        setActivePanel(config.primaryPanel);
                      }}
                      style={{
                        padding: "8px 16px",
                        background: currentPhase === phase ? `${config.color}20` : (isDark ? "rgba(255,255,255,0.05)" : "rgba(47,41,65,0.05)"),
                        border: `1px solid ${currentPhase === phase ? `${config.color}40` : (isDark ? "rgba(255,255,255,0.1)" : "rgba(47,41,65,0.1)")}`,
                        borderRadius: "8px",
                        color: currentPhase === phase ? config.color : colors.textSecondary,
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {config.title}
                    </button>
                  ))}
                  <div style={{ marginLeft: "auto" }} />
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLayoutMode(); }}
                    title={layoutMode === "horizontal" ? (t("researchLab.switchVertical") || "Switch to vertical layout") : (t("researchLab.switchHorizontal") || "Switch to horizontal layout")}
                    style={{
                      padding: "6px 12px",
                      background: isDark ? "rgba(255,255,255,0.06)" : "rgba(47,41,65,0.06)",
                      border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(47,41,65,0.12)",
                      borderRadius: "8px",
                      color: colors.textSecondary,
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                    }}
                  >
                    {layoutMode === "horizontal" ? "⬜" : "▯"} {layoutMode === "horizontal" ? (t("researchLab.vertical") || "Vertical") : (t("researchLab.horizontal") || "Horizontal")}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Layout wrapper: column in horizontal mode, row in vertical mode */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: layoutMode === "vertical" ? "row" as const : "column" as const,
            minHeight: 0,
            overflow: "hidden",
          }}>

            {/* Panel Grid — horizontal (2x2) or vertical (single column left side) */}
            <div className={layoutMode === "vertical" ? "lab-panels-vertical-grid" : undefined} style={{
              ...(layoutMode === "vertical" ? {
                flex: "0 0 25%",
                minWidth: "260px",
                maxWidth: "380px",
                display: "flex",
                flexDirection: "column" as const,
                gap: "8px",
                padding: "0 0 16px 16px",
                overflowY: "auto" as const,
              } : {
                flex: (() => {
                  const collapsedCount = [collapsedPanels.documents, collapsedPanels.claims, collapsedPanels.evidence, collapsedPanels.analytics].filter(Boolean).length;
                  const hasOpenEditor = chunkTabs.length > 0 && !editorCollapsed;
                  if (hasOpenEditor) {
                    if (collapsedCount === 4) return "0 0 auto";
                    if (collapsedCount >= 3) return "1 1 30%";
                    if (collapsedCount >= 2) return "1 1 50%";
                    if (collapsedCount >= 1) return "2 1 60%";
                  }
                  return 1;
                })(),
                minHeight: (() => {
                  const collapsedCount = [collapsedPanels.documents, collapsedPanels.claims, collapsedPanels.evidence, collapsedPanels.analytics].filter(Boolean).length;
                  if (collapsedCount === 4) return "98px";
                  if (collapsedCount >= 2) return "140px";
                  return 0;
                })(),
                display: "grid" as const,
                gridTemplateColumns: "1fr 1fr",
                gridTemplateRows: (() => {
                  const topCollapsed = collapsedPanels.documents && collapsedPanels.claims;
                  const bottomCollapsed = collapsedPanels.evidence && collapsedPanels.analytics;
                  const topHasOneCollapsed = collapsedPanels.documents || collapsedPanels.claims;
                  const bottomHasOneCollapsed = collapsedPanels.evidence || collapsedPanels.analytics;
                  if (topCollapsed && bottomCollapsed) return "44px 44px";
                  if (topCollapsed && !bottomCollapsed) return "44px 1fr";
                  if (!topCollapsed && bottomCollapsed) return "1fr 44px";
                  if (topHasOneCollapsed && !bottomHasOneCollapsed) return "minmax(44px, 1fr) 1fr";
                  if (!topHasOneCollapsed && bottomHasOneCollapsed) return "1fr minmax(44px, 1fr)";
                  if (topHasOneCollapsed && bottomHasOneCollapsed) return "minmax(44px, 1fr) minmax(44px, 1fr)";
                  return "1fr 1fr";
                })(),
                gap: "10px",
                padding: "0 16px 16px",
                overflow: "hidden",
                transition: "grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }),
            }}>
              {(["documents", "claims", "evidence", "analytics"] as LabPanel[]).map((panel) => (
                <div
                  key={panel}
                  data-tour={`lab-${panel}`}
                  style={{
                    ...(themeMode === "light" ? DASHBOARD_CARD_LIGHT : DASHBOARD_CARD),
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    overflow: "hidden",
                    maxHeight: collapsedPanels[panel] ? "44px" : undefined,
                    minHeight: "44px",
                    transition: "max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  {/* Panel Header — entire bar is clickable for collapse/expand */}
                  <div
                    onClick={() => {
                      setCollapsedPanels((prev) => {
                        const isCurrentlyCollapsed = prev[panel];
                        if (isCurrentlyCollapsed) {
                          // Expanding this panel → collapse all others (accordion)
                          return {
                            documents: panel !== "documents",
                            claims: panel !== "claims",
                            evidence: panel !== "evidence",
                            analytics: panel !== "analytics",
                          };
                        }
                        // Collapsing the open panel → just collapse it
                        return { ...prev, [panel]: true };
                      });
                      setActivePanel(panel);
                    }}
                    style={{
                      padding: "10px 14px",
                      borderBottom: collapsedPanels[panel] ? "none" : `1px solid ${colors.borderPrimary}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: collapsedPanels[panel]
                        ? `linear-gradient(135deg, ${theoryWorkflow[currentPhase].color}06, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(47,41,65,0.02)'})`
                        : activePanel === panel ? `${theoryWorkflow[currentPhase].color}08` : "transparent",
                      flexShrink: 0,
                      height: "44px",
                      boxSizing: "border-box",
                      cursor: "pointer",
                      userSelect: "none",
                      borderRadius: collapsedPanels[panel] ? "inherit" : undefined,
                      transition: "background 0.2s ease",
                    }}
                    title={collapsedPanels[panel] ? `Expand ${panelTitles[panel].title}` : `Collapse ${panelTitles[panel].title}`}
                  >
                    <div
                      style={{
                        color: activePanel === panel ? colors.textPrimary : colors.textSecondary,
                        fontSize: "13px",
                        fontWeight: activePanel === panel ? "600" : "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {panelTitles[panel].icon} {panelTitles[panel].title}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "24px",
                          height: "24px",
                          borderRadius: "6px",
                          background: themeMode === "light" ? "rgba(47, 41, 65, 0.06)" : "rgba(255,255,255,0.06)",
                          border: themeMode === "light" ? "1px solid rgba(47, 41, 65, 0.12)" : "1px solid rgba(255,255,255,0.10)",
                          color: colors.textSecondary,
                          fontSize: "11px",
                          transition: "transform 0.3s ease, background 0.2s ease",
                          transform: collapsedPanels[panel] ? "rotate(0deg)" : "rotate(180deg)",
                        }}
                      >
                        ▾
                      </span>
                      {activePanel === panel && (
                        <div style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: theoryWorkflow[currentPhase].color,
                          flexShrink: 0,
                        }} />
                      )}
                    </div>
                  </div>
                  
                  {/* Panel Content */}
                  {!collapsedPanels[panel] && (
                    <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
                      {renderPanelContent(panel)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Editor section — always visible as persistent dock */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                ...(layoutMode === "vertical" ? {
                  flex: 1,
                  minWidth: 0,
                  borderLeft: themeMode === "light" ? "1px solid rgba(47, 41, 65, 0.12)" : "1px solid rgba(255,255,255,0.08)",
                } : {}),
              }}>
                {layoutMode !== "vertical" && (
                  <div
                    onMouseDown={beginResize}
                    style={{
                      height: "8px",
                      cursor: "row-resize",
                      background: themeMode === "light" ? "rgba(47, 41, 65, 0.06)" : "rgba(255,255,255,0.06)",
                      borderTop: themeMode === "light" ? "1px solid rgba(47, 41, 65, 0.1)" : "1px solid rgba(255,255,255,0.08)",
                      borderBottom: themeMode === "light" ? "1px solid rgba(47, 41, 65, 0.15)" : "1px solid rgba(0,0,0,0.35)",
                      flexShrink: 0,
                    }}
                  />
                )}

                <div
                  style={{
                    ...(layoutMode === "vertical" ? {
                      flex: 1,
                      minHeight: 0,
                    } : (chunkTabs.length === 0 || editorCollapsed)
                      ? { height: collapsedDockHeight, minHeight: collapsedDockHeight, maxHeight: collapsedDockHeight }
                      : (() => {
                          const collapsedCount = [collapsedPanels.documents, collapsedPanels.claims, collapsedPanels.evidence, collapsedPanels.analytics].filter(Boolean).length;
                          if (collapsedCount === 4) return { flex: 1, minHeight: minEditorHeight };
                          if (collapsedCount >= 2) return { flex: "1 1 auto" as any, minHeight: minEditorHeight, maxHeight: Math.round(window.innerHeight * 0.75) };
                          return { height: editorHeight || defaultEditorHeight, minHeight: minEditorHeight, maxHeight: Math.round(window.innerHeight * 0.75) };
                        })()
                    ),
                    overflow: "hidden",
                    background: isDark ? "rgba(10, 10, 18, 0.55)" : "#ffffff",
                    borderTop: layoutMode !== "vertical" ? (isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(47, 41, 65, 0.08)") : "none",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: editorCollapsed ? "8px" : "10px",
                  padding: editorCollapsed ? "6px 10px" : "10px 12px",
                  borderBottom: themeMode === "light" ? "1px solid rgba(47, 41, 65, 0.1)" : "1px solid rgba(255,255,255,0.08)",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0, overflowX: "auto" }}>
                  {chunkTabs.length === 0 && (
                    <span style={{ fontSize: "12px", color: colors.textSecondary, opacity: 0.6, whiteSpace: "nowrap" }}>
                      📝 {t("researchLab.chunkDockHint") || "Select a segment from Documents to start editing"}
                    </span>
                  )}
                  {chunkTabs.map((tab) => {
                    const active = tab.key === activeChunkTabKey;
                    const dirty = tab.lastSavedHtml !== undefined && tab.html !== tab.lastSavedHtml;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveChunkTabKey(tab.key)}
                        className="chunk-tab-btn chunk-tab"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: editorCollapsed ? "4px 8px" : "6px 10px",
                          borderRadius: "999px",
                          border: active 
                            ? "1px solid rgba(74, 222, 128, 0.45)" 
                            : (isDark ? `1px solid ${colors.borderPrimary}` : "1px solid rgba(47, 41, 65, 0.08)"),
                          background: active 
                            ? (isDark ? "rgba(74, 222, 128, 0.12)" : "rgba(74, 222, 128, 0.15)") 
                            : (isDark ? "rgba(255,255,255,0.04)" : "#ffffff"),
                          color: isDark ? colors.textPrimary : "#2f2941",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          maxWidth: 280,
                          fontSize: editorCollapsed ? "12px" : undefined,
                        }}
                        title={tab.title}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                          {dirty ? "● " : ""}{tab.title}
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            closeChunkTab(tab.key);
                          }}
                          style={{
                            display: "inline-flex",
                            width: 18,
                            height: 18,
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 6,
                            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(47,41,65,0.06)",
                            border: `1px solid ${colors.borderPrimary}`,
                          }}
                        >
                          ×
                        </span>
                      </button>
                    );
                  })}
                </div>

                {chunkTabs.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {/* Word count + auto-save status */}
                  {!editorCollapsed && (
                    <span style={{ fontSize: "11px", color: colors.textSecondary, marginRight: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                      {activeTabWordCount > 0 && <span>{activeTabWordCount} {activeTabWordCount === 1 ? t("editor.word") || "word" : t("editor.words") || "words"}</span>}
                      {autoSaveStatus === "saving" && <span style={{ color: "#f59e0b" }}>⏳</span>}
                      {autoSaveStatus === "saved" && <span style={{ color: "#10b981" }}>✓ {t("editor.saved") || "saved"}</span>}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={saveActiveTabLocal}
                    className="chunk-tab-btn"
                    style={{
                      padding: editorCollapsed ? "4px 8px" : "6px 10px",
                      borderRadius: "10px",
                      border: `1px solid ${colors.borderPrimary}`,
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(47,41,65,0.04)",
                      color: colors.textPrimary,
                      cursor: "pointer",
                      fontSize: editorCollapsed ? "11px" : "12px",
                    }}
                  >
                    {t("action.save") || "Save"}
                  </button>
                  {chunkTabs.length > 1 && (
                    <button
                      type="button"
                      onClick={saveAllTabs}
                      title={t("editor.saveAllTabs") || "Save all open tabs"}
                      style={{
                        padding: editorCollapsed ? "4px 8px" : "6px 10px",
                        borderRadius: "10px",
                        border: "1px solid rgba(74, 222, 128, 0.25)",
                        background: "rgba(74, 222, 128, 0.08)",
                        color: "#4ade80",
                        cursor: "pointer",
                        fontSize: editorCollapsed ? "11px" : "12px",
                      }}
                    >
                      {t("action.saveAll") || "Save All"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={loadActiveTabLocal}
                    className="chunk-tab-btn"
                    style={{
                      padding: editorCollapsed ? "4px 8px" : "6px 10px",
                      borderRadius: "10px",
                      border: `1px solid ${colors.borderPrimary}`,
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(47,41,65,0.04)",
                      color: colors.textPrimary,
                      cursor: "pointer",
                      fontSize: editorCollapsed ? "11px" : "12px",
                    }}
                  >
                    {t("action.load") || "Load"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDiffView(d => !d)}
                    style={{
                      padding: editorCollapsed ? "4px 8px" : "6px 10px",
                      borderRadius: "10px",
                      border: showDiffView ? "1px solid rgba(99, 102, 241, 0.4)" : `1px solid ${colors.borderPrimary}`,
                      background: showDiffView ? "rgba(99, 102, 241, 0.15)" : (isDark ? "rgba(255,255,255,0.04)" : "rgba(47,41,65,0.04)"),
                      color: showDiffView ? "#a5b4fc" : colors.textPrimary,
                      cursor: "pointer",
                      fontSize: editorCollapsed ? "11px" : "12px",
                    }}
                    title={showDiffView ? "Hide diff view" : "Show changes since last save"}
                  >
                    Δ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!editorCollapsed) {
                        lastExpandedHeightRef.current = editorHeight || defaultEditorHeight;
                        setEditorCollapsed(true);
                        return;
                      }
                      setEditorCollapsed(false);
                      setEditorHeight((h) => (h > 0 ? h : lastExpandedHeightRef.current || defaultEditorHeight));
                    }}
                    style={{
                      padding: editorCollapsed ? "4px 8px" : "6px 10px",
                      borderRadius: "10px",
                      border: `1px solid ${colors.borderPrimary}`,
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(47,41,65,0.04)",
                      color: colors.textPrimary,
                      cursor: "pointer",
                      fontSize: editorCollapsed ? "11px" : "12px",
                    }}
                    title={editorCollapsed ? "Expand editor" : "Collapse editor"}
                  >
                    {editorCollapsed ? "▾" : "▴"}
                  </button>
                </div>
                )}
              </div>

              {!editorCollapsed && chunkTabs.length > 0 && (
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  {/* Editor */}
                  <div style={{ flex: showDiffView ? "0 0 auto" : 1, minHeight: 0, overflowY: "scroll", overflowX: "hidden", padding: "10px 12px", ...(showDiffView ? { maxHeight: "50%" } : {}) }}>
                    {activeChunkTab ? (
                      <RichTextEditor
                        valueHtml={activeChunkTab.html}
                        onChange={({ html }) => setActiveTabHtml(activeChunkTab.key, html)}
                        placeholder="Edit chunk…"
                        onSaveLocal={saveActiveTabLocal}
                        onLoadLocal={loadActiveTabLocal}
                      />
                    ) : (
                      <div style={{ padding: "14px", color: colors.textSecondary, fontSize: "12px" }}>
                        {t("researchLab.noChunkSelected") || "No chunk selected"}
                      </div>
                    )}
                  </div>
                  {/* Diff View Panel */}
                  {showDiffView && activeChunkTab && (() => {
                    const stripHtml = (h: string) => h.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
                    const currentText = stripHtml(activeChunkTab.html);
                    const savedText = stripHtml(activeChunkTab.lastSavedHtml || "");
                    const isDirty = currentText !== savedText;
                    const currentLines = currentText.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
                    const savedLines = savedText.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
                    return (
                      <div style={{
                        flex: 1, minHeight: 0, borderTop: "1px solid rgba(99, 102, 241, 0.3)",
                        background: isDark ? "rgba(10, 10, 18, 0.7)" : "#ffffff", overflowY: "auto", padding: "10px 12px",
                      }}>
                        <div style={{ fontSize: "11px", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(47, 41, 65, 0.5)", marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                          <span>Δ {isDirty ? "Changes since last save" : "No unsaved changes"}</span>
                          <span>{currentLines.length} sentences current · {savedLines.length} saved</span>
                        </div>
                        {isDirty ? (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
                            <div>
                              <div style={{ fontSize: "10px", color: "#f85149", fontWeight: 600, marginBottom: "4px" }}>— Last Saved</div>
                              {savedLines.length > 0 ? savedLines.map((line, i) => (
                                <div key={i} style={{
                                  padding: "3px 6px", marginBottom: "2px", borderRadius: "4px",
                                  background: !currentLines.includes(line) ? "rgba(248, 81, 73, 0.12)" : "transparent",
                                  color: !currentLines.includes(line) ? (isDark ? "#ffa198" : "#b91c1c") : (isDark ? "rgba(255,255,255,0.5)" : "rgba(47, 41, 65, 0.5)"),
                                  borderLeft: !currentLines.includes(line) ? "2px solid #f85149" : "2px solid transparent",
                                }}>{line}.</div>
                              )) : <div style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(47, 41, 65, 0.3)", fontStyle: "italic" }}>Empty</div>}
                            </div>
                            <div>
                              <div style={{ fontSize: "10px", color: "#3fb950", fontWeight: 600, marginBottom: "4px" }}>+ Current</div>
                              {currentLines.map((line, i) => (
                                <div key={i} style={{
                                  padding: "3px 6px", marginBottom: "2px", borderRadius: "4px",
                                  background: !savedLines.includes(line) ? "rgba(63, 185, 80, 0.12)" : "transparent",
                                  color: !savedLines.includes(line) ? (isDark ? "#7ee787" : "#15803d") : (isDark ? "rgba(255,255,255,0.5)" : "rgba(47, 41, 65, 0.5)"),
                                  borderLeft: !savedLines.includes(line) ? "2px solid #3fb950" : "2px solid transparent",
                                }}>{line}.</div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ textAlign: "center", padding: "20px", color: isDark ? "rgba(255,255,255,0.3)" : "rgba(47, 41, 65, 0.3)", fontSize: "12px" }}>
                            ✓ Content matches last saved version
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
              </div>
          </div>
        </div>
      </div>

      {/* Widget Popup Modal */}
      {widgetPopup && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
        }}>
          <div style={{
            ...(isDark ? DASHBOARD_CARD : DASHBOARD_CARD_LIGHT),
            width: "80%",
            maxWidth: "800px",
            height: "80%",
            maxHeight: "600px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: colors.textPrimary }}>
                {widgetPopup.title}
              </h3>
              <button
                onClick={() => setWidgetPopup(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: colors.textSecondary,
                  cursor: "pointer",
                  fontSize: "20px",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflow: "auto" }}>
              {renderWidgetById(widgetPopup.id)}
            </div>
          </div>
        </div>
      )}

      {/* Functional overlay components only */}
      <FloatingNotepads
        pads={slots.floatingPads}
        onClose={slots.closeFloatingPad}
        onChange={slots.updateFloatingPad}
        onBringToFront={slots.bringToFront}
        onDownload={slots.downloadFloatingPad}
        onDock={(id) => slots.dockFloatingToSlot(id)}
        onAdd={() => slots.newFloatingNotepad()}
      />
      <EnhancedCompareModal chunks={[]} isOpen={showEnhancedCompare} onClose={() => setShowEnhancedCompare(false)} />
      <PreviewDrawer isOpen={showPreview} item={previewItem} onClose={() => setShowPreview(false)} onOpen={(item) => { setPreviewItem(item); setShowPreview(true); }} />
      <AIChatManager />
      <ScreenshotMode isActive={screenshotModeActive} onToggle={() => setScreenshotModeActive(!screenshotModeActive)} />
      
      {/* Tour Guide - UniversalTourGuide variant for Research Lab */}
      <ResearchLabTourComponent />
    </div>
  );
}

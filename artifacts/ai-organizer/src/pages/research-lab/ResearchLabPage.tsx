/**
 * Research Lab Page - Modular 4-panel scientific workflow
 * v2: Inline tools, no modal, no dead features, multi-open panels
 */

import { useState, useEffect, useCallback } from "react";
import { useSwipeGesture } from "../../hooks/useSwipeGesture";
import { useLanguage } from "../../context/LanguageContext";
import { useIsMobile } from "../../hooks/use-mobile";
import { useSlots } from "../frontend/hooks/useSlots";
import type { SegmentRow } from "../../hooks/home/useHomeState";
import type { LabPanel } from "./types";
import "katex/dist/katex.min.css";
import "./research-lab.css";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../../components/ui/resizable";

// Hooks
import { useLabState } from "./hooks/useLabState";
import { useChunkEditor } from "./hooks/useChunkEditor";
import { usePhaseDetection } from "./hooks/usePhaseDetection";

// Components
import { LabHeader } from "./components/LabHeader";
import { LabPanelCard } from "./components/LabPanelCard";
import { ChunkEditorDock } from "./components/ChunkEditorDock";
import { DocumentsPanel } from "./components/panels/DocumentsPanel";
import { ClaimsPanel } from "./components/panels/ClaimsPanel";
import { EvidencePanel } from "./components/panels/EvidencePanel";
import { AnalyticsPanel } from "./components/panels/AnalyticsPanel";

// Overlays (only essential ones)
import { TourStep, useTour } from "../../components/UniversalTourGuide";
import { FloatingNotepads } from "../frontend/components/FloatingNotepads";
import { AIChatManager } from "../../components/ai-chat/AIChatManager";
import GlobalBurgerMenu from "../../components/GlobalBurgerMenu";

export default function ResearchLabPage() {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const slots = useSlots();

  // Core state
  const lab = useLabState();
  const editor = useChunkEditor();

  // Local state for documents
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [segmentQuery, setSegmentQuery] = useState("");
  const [searchK, setSearchK] = useState(5);

  // Auto-detect phase on mount
  usePhaseDetection(lab.selectPhase);

  // Tour — manual only (no auto-start per design philosophy)
  const tourSteps: TourStep[] = [
    { id: "lab-welcome", title: t("tour.researchLab.welcome.title") || "Research Lab tour", content: t("tour.researchLab.welcome.content") || "Overview of the Research Laboratory workflow.", position: "custom", customPosition: { x: 600, y: 80 }, highlight: false },
    { id: "lab-phase-selector", title: t("tour.researchLab.phaseSelector.title") || "Theory phases", content: t("tour.researchLab.phaseSelector.content") || "Switch between discovery, formulation, validation and refinement.", target: "[data-tour=\"lab-phase-selector\"]", highlight: true },
    { id: "lab-documents", title: t("tour.researchLab.documents.title") || "Documents & sources", content: t("tour.researchLab.documents.content") || "Upload, select and segment your source documents.", target: "[data-tour=\"lab-documents\"]", highlight: true },
    { id: "lab-claims", title: t("tour.researchLab.claims.title") || "Claims workspace", content: t("tour.researchLab.claims.content") || "Work with claims, propositions and concept maps.", target: "[data-tour=\"lab-claims\"]", highlight: true },
    { id: "lab-evidence", title: t("tour.researchLab.evidence.title") || "Evidence & validation", content: t("tour.researchLab.evidence.content") || "Test your theory and gather supporting evidence.", target: "[data-tour=\"lab-evidence\"]", highlight: true },
    { id: "lab-analytics", title: t("tour.researchLab.analytics.title") || "Analytics & refinement", content: t("tour.researchLab.analytics.content") || "See analytics and refine your theory.", target: "[data-tour=\"lab-analytics\"]", highlight: true },
    { id: "lab-complete", title: t("tour.researchLab.complete.title") || "End of tour", content: t("tour.researchLab.complete.content") || "You can restart this tour any time.", position: "custom", customPosition: { x: 600, y: 80 }, highlight: false },
  ];

  const { startTour, TourComponent } = useTour(tourSteps, "researchLabTourSeen");

  // Helper to create onOpenTool for a specific panel
  const makeOpenTool = useCallback((panel: LabPanel) => {
    return (toolId: string, _title: string, _icon: string) => {
      lab.openToolInline(panel, toolId);
    };
  }, [lab.openToolInline]);

  // Panel content renderer
  const renderPanelContent = useCallback((panel: LabPanel) => {
    switch (panel) {
      case "documents":
        return (
          <DocumentsPanel
            segments={segments}
            onSegmentsChange={setSegments}
            segmentQuery={segmentQuery}
            setSegmentQuery={setSegmentQuery}
            searchK={searchK}
            setSearchK={setSearchK}
            onPick={editor.openSegmentInTab}
            onBatchOpen={editor.openSegmentsInTabs}
          />
        );
      case "claims":
        return (
          <ClaimsPanel
            activeTool={lab.activeTools.claims}
            onOpenTool={makeOpenTool("claims")}
            onCloseTool={() => lab.closeToolInline("claims")}
            segments={segments}
          />
        );
      case "evidence":
        return (
          <EvidencePanel
            activeTool={lab.activeTools.evidence}
            onOpenTool={makeOpenTool("evidence")}
            onCloseTool={() => lab.closeToolInline("evidence")}
            segments={segments}
          />
        );
      case "analytics":
        return (
          <AnalyticsPanel
            activeTool={lab.activeTools.analytics}
            onOpenTool={makeOpenTool("analytics")}
            onCloseTool={() => lab.closeToolInline("analytics")}
            segments={segments}
            currentPhase={lab.currentPhase}
            phaseTitle={lab.resolvedPhases[lab.currentPhase].title}
            phaseDescription={lab.resolvedPhases[lab.currentPhase].description}
          />
        );
    }
  }, [segments, segmentQuery, searchK, editor.openSegmentInTab, editor.openSegmentsInTabs, lab.activeTools, lab.currentPhase, lab.resolvedPhases, makeOpenTool, lab.closeToolInline]);

  const panels: LabPanel[] = ["documents", "claims", "evidence", "analytics"];

  const panelLabels: Record<LabPanel, string> = {
    documents: t("researchLab.panel.documents") || "Documents",
    claims: t("researchLab.panel.claims") || "Claims",
    evidence: t("researchLab.panel.evidence") || "Evidence",
    analytics: t("researchLab.panel.analytics") || "Analytics",
  };

  const panelIcons: Record<LabPanel, string> = {
    documents: "📄",
    claims: "💡",
    evidence: "🔬",
    analytics: "📊",
  };

  // Swipe between panels on mobile (center area only — edges reserved for burger/chat)
  const swipeToNextPanel = useCallback(() => {
    const idx = panels.indexOf(lab.activePanel);
    if (idx < panels.length - 1) lab.selectTab(panels[idx + 1]);
  }, [lab.activePanel, lab.selectTab]);

  const swipeToPrevPanel = useCallback(() => {
    const idx = panels.indexOf(lab.activePanel);
    if (idx > 0) lab.selectTab(panels[idx - 1]);
  }, [lab.activePanel, lab.selectTab]);

  // Only enable center swipes on mobile tabs mode, with enough threshold to avoid conflict with edge gestures
  useSwipeGesture({
    direction: "left",
    threshold: 70,
    edgeZone: 0, // No edge zone — center swipe
    enabled: isMobile && lab.layoutMode === "tabs",
    onSwipe: swipeToNextPanel,
  });

  useSwipeGesture({
    direction: "right",
    threshold: 70,
    edgeZone: 0,
    enabled: isMobile && lab.layoutMode === "tabs",
    onSwipe: swipeToPrevPanel,
  });

  return (
    <div className="research-lab" data-page="research-lab">
      <GlobalBurgerMenu />

      {/* Tour button — hide on mobile */}
      {!isMobile && (
        <button className="lab-nav-btn lab-nav-btn--tour" onClick={startTour}>
          🎓 {t("tour.researchLab.startTour") || "Start Tour"}
        </button>
      )}

      {/* Main content area */}
      <div className="research-lab-main" style={isMobile ? { paddingBottom: 56 } : undefined}>
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header with phase breadcrumb */}
          <LabHeader
            collapsed={lab.headerCollapsed}
            onToggleCollapse={() => lab.setHeaderCollapsed(!lab.headerCollapsed)}
            currentPhase={lab.currentPhase}
            resolvedPhases={lab.resolvedPhases}
            onSelectPhase={lab.selectPhase}
            layoutMode={lab.layoutMode}
            onToggleLayout={lab.toggleLayoutMode}
          />

          {/* Layout: panels + editor */}
          {lab.layoutMode === "vertical" ? (
            /* Vertical: side-by-side with flex */
            <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
              <div className="lab-grid-vertical">
                {panels.map(panel => (
                  <LabPanelCard
                    key={panel}
                    panel={panel}
                    isActive={lab.activePanel === panel}
                    isCollapsed={lab.collapsedPanels[panel]}
                    onToggle={() => lab.togglePanel(panel)}
                  >
                    {renderPanelContent(panel)}
                  </LabPanelCard>
                ))}
              </div>
              <div className="flex flex-col flex-1 min-w-0 border-l border-border">
                <div className="overflow-hidden bg-card flex flex-col" style={{ flex: 1, minHeight: 0 }}>
                  <ChunkEditorDock
                    chunkTabs={editor.chunkTabs}
                    activeChunkTabKey={editor.activeChunkTabKey}
                    activeChunkTab={editor.activeChunkTab}
                    activeTabWordCount={editor.activeTabWordCount}
                    editorCollapsed={editor.editorCollapsed}
                    showDiffView={editor.showDiffView}
                    autoSaveStatus={editor.autoSaveStatus}
                    onSelectTab={editor.setActiveChunkTabKey}
                    onCloseTab={editor.closeChunkTab}
                    onHtmlChange={editor.setActiveTabHtml}
                    onSave={editor.saveActiveTabLocal}
                    onSaveAll={editor.saveAllTabs}
                    onLoad={editor.loadActiveTabLocal}
                    onToggleDiff={() => editor.setShowDiffView(d => !d)}
                    onToggleCollapse={editor.toggleEditorCollapse}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Tabs / Horizontal: use ResizablePanelGroup vertical split */
            <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
              <ResizablePanel defaultSize={65} minSize={25}>
                {lab.layoutMode === "tabs" ? (
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* On mobile, the tab bar moves to bottom nav — hide inline tabs */}
                    {!isMobile && (
                      <div className="lab-tab-bar">
                        {panels.map(panel => (
                          <button
                            key={panel}
                            onClick={() => lab.selectTab(panel)}
                            className={`lab-tab-item ${lab.activePanel === panel ? "lab-tab-item--active" : ""}`}
                            data-active={lab.activePanel === panel}
                          >
                            <span className="lab-tab-icon">{panelIcons[panel]}</span>
                            <span className="lab-tab-label">{panelLabels[panel]}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex-1 overflow-auto min-h-0 p-2 sm:p-4">
                      {renderPanelContent(lab.activePanel)}
                    </div>
                  </div>
                ) : (
                  <div className="lab-grid-horizontal h-full">
                    {panels.map(panel => (
                      <LabPanelCard
                        key={panel}
                        panel={panel}
                        isActive={lab.activePanel === panel}
                        isCollapsed={lab.collapsedPanels[panel]}
                        onToggle={() => lab.togglePanel(panel)}
                      >
                        {renderPanelContent(panel)}
                      </LabPanelCard>
                    ))}
                  </div>
                )}
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel
                defaultSize={35}
                minSize={isMobile ? 10 : 8}
                maxSize={75}
                collapsible
                collapsedSize={4}
              >
                <div className="overflow-hidden bg-card flex flex-col h-full">
                  <ChunkEditorDock
                    chunkTabs={editor.chunkTabs}
                    activeChunkTabKey={editor.activeChunkTabKey}
                    activeChunkTab={editor.activeChunkTab}
                    activeTabWordCount={editor.activeTabWordCount}
                    editorCollapsed={editor.editorCollapsed}
                    showDiffView={editor.showDiffView}
                    autoSaveStatus={editor.autoSaveStatus}
                    onSelectTab={editor.setActiveChunkTabKey}
                    onCloseTab={editor.closeChunkTab}
                    onHtmlChange={editor.setActiveTabHtml}
                    onSave={editor.saveActiveTabLocal}
                    onSaveAll={editor.saveAllTabs}
                    onLoad={editor.loadActiveTabLocal}
                    onToggleDiff={() => editor.setShowDiffView(d => !d)}
                    onToggleCollapse={editor.toggleEditorCollapse}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </div>
      </div>

      {/* Overlays — only essential */}
      <FloatingNotepads
        pads={slots.floatingPads}
        onClose={slots.closeFloatingPad}
        onChange={slots.updateFloatingPad}
        onBringToFront={slots.bringToFront}
        onDownload={slots.downloadFloatingPad}
        onDock={(id) => slots.dockFloatingToSlot(id)}
        onAdd={() => slots.newFloatingNotepad()}
      />
      <AIChatManager />
      <TourComponent />

      {/* Mobile bottom nav for Research Lab */}
      {isMobile && lab.layoutMode === "tabs" && (
        <nav
          aria-label="Lab panel navigation"
          className="fixed bottom-0 left-0 right-0 z-[9998] flex items-stretch border-t border-border bg-card/95 backdrop-blur-xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", height: "52px" }}
        >
          {panels.map(panel => {
            const isActive = lab.activePanel === panel;
            const shortLabels: Record<LabPanel, string> = {
              documents: "Docs",
              claims: "Claims",
              evidence: "Evidence",
              analytics: "Analytics",
            };
            return (
              <button
                key={panel}
                onClick={() => lab.selectTab(panel)}
                className={`
                  flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 relative
                  transition-colors duration-150 border-none bg-transparent cursor-pointer
                  ${isActive ? "text-primary" : "text-muted-foreground"}
                `}
              >
                <span className={`text-base transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>
                  {panelIcons[panel]}
                </span>
                <span className={`text-[10px] leading-tight ${isActive ? "font-semibold" : "font-medium"}`}>
                  {shortLabels[panel]}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

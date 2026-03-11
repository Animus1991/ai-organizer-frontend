// src/pages/HomeTheoryHub.tsx
// Theory Development Hub - Scientific workflow optimized for theory construction
import { useState, useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useTheme, DASHBOARD_CARD, DASHBOARD_BTN, DASHBOARD_CARD_LIGHT, DASHBOARD_BTN_LIGHT } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useMediaQuery";

// Light mode color helpers
const getLightModeColors = (isDark: boolean) => ({
  btnBg: isDark ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.95)",
  btnBorder: isDark ? "rgba(148, 163, 184, 0.5)" : "rgba(47, 41, 65, 0.2)",
  btnShadow: isDark ? "0 4px 16px rgba(15,23,42,0.6)" : "0 4px 16px rgba(47, 41, 65, 0.12)",
  cardBgHover: isDark ? "rgba(255,255,255,0.05)" : "rgba(47, 41, 65, 0.04)",
  cardBgActive: isDark ? "rgba(255,255,255,0.02)" : "rgba(47, 41, 65, 0.02)",
  borderLight: isDark ? "rgba(255,255,255,0.1)" : "rgba(47, 41, 65, 0.12)",
  progressBg: isDark ? "rgba(255,255,255,0.1)" : "rgba(47, 41, 65, 0.1)",
  starInactive: isDark ? "rgba(255,255,255,0.25)" : "rgba(47, 41, 65, 0.3)",
});

// Core imports
import SearchModal from "../components/SearchModal";
import { useHomeState } from "../hooks/home";
import { useHomeOperations } from "../hooks/home/useHomeOperations";

// Think!Hub Theory Operating System imports - only essential ones
import { 
  TheoryStrengthScorecard, TheoryEvolutionTimeline, OntologyManager,
  ClaimVerification, PropositionTypeCategorizer, ConceptMapper, BoundaryConditionsPanel,
  FalsificationPrompts, PeerReviewSimulator, ContradictionFinder, ConsistencyChecker,
  PublicationReadinessChecker, EvidenceRequirementsGenerator, CounterTheoryRegistry, EvidenceChainBuilder
} from "../components/research";

// Modern UI components
import { TourStep, useTour } from '../components/UniversalTourGuide';
import GlobalBurgerMenu from "../components/GlobalBurgerMenu";
import { CompactExpandedToggle } from "../components/ui/CompactExpandedToggle";
import { ScreenshotMode } from "../components/ScreenshotMode";
import { ContributionGraph } from "../components/ContributionGraph";
import { ActivityFeed } from "../components/ActivityFeed";

// Theory Health Score calculation
const calculateTheoryHealth = () => {
  try {
    const claims = JSON.parse(localStorage.getItem("thinkspace-claim-builder") || "[]");
    const props = JSON.parse(localStorage.getItem("thinkspace-proposition-types") || "[]");
    const evReqs = JSON.parse(localStorage.getItem("thinkspace-evidence-requirements") || "[]");
    const contradictions = JSON.parse(localStorage.getItem("thinkspace-contradictions") || "{}");
    const boundaries = JSON.parse(localStorage.getItem("thinkspace-boundary-conditions") || "{}");
    const ontology = JSON.parse(localStorage.getItem("thinkspace-ontology") || "[]");
    const versions = JSON.parse(localStorage.getItem("thinkspace-theory-versions") || "{}");
    const reviews = JSON.parse(localStorage.getItem("thinkspace-peer-review") || "[]");
    const readiness = JSON.parse(localStorage.getItem("thinkspace-publication-readiness") || "[]");
    
    const metrics = {
      claimCount: claims.length,
      categorizedClaims: props.filter((p: any) => p.manualType || p.autoType !== "uncategorized").length,
      evidenceCoverage: evReqs.length > 0 ? evReqs.filter((r: any) => r.status === "found").length / evReqs.length : 0,
      contradictionsResolved: contradictions.contradictions?.filter((c: any) => c.status === "resolved").length || 0,
      contradictionsActive: contradictions.contradictions?.filter((c: any) => c.status === "active").length || 0,
      boundariesDefined: boundaries.conditions?.length || 0,
      ontologyTerms: ontology.length,
      versionCount: versions.versions?.length || 0,
      peerReviews: reviews.length,
      readinessScore: readiness.length > 0 ? readiness.filter((r: any) => r.status === "pass").length / readiness.length : 0,
    };
    
    let score = 0;
    const weights = {
      claimCount: 10, categorizedClaims: 15, evidenceCoverage: 20,
      contradictionsResolved: 15, boundariesDefined: 10, ontologyTerms: 10,
      versionCount: 5, peerReviews: 10, readinessScore: 5,
    };
    
    if (metrics.claimCount >= 3) score += weights.claimCount;
    if (metrics.claimCount > 0) score += (metrics.categorizedClaims / metrics.claimCount) * weights.categorizedClaims;
    score += metrics.evidenceCoverage * weights.evidenceCoverage;
    if (metrics.contradictionsActive === 0 && metrics.contradictionsResolved > 0) score += weights.contradictionsResolved;
    if (metrics.boundariesDefined >= 2) score += weights.boundariesDefined;
    if (metrics.ontologyTerms >= 5) score += weights.ontologyTerms;
    if (metrics.versionCount >= 1) score += weights.versionCount;
    if (metrics.peerReviews >= 1) score += weights.peerReviews;
    score += metrics.readinessScore * weights.readinessScore;
    
    return {
      score: Math.round(Math.min(100, score)),
      grade: score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B+" : score >= 60 ? "B" : score >= 50 ? "C" : "D",
      metrics,
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return { score: 0, grade: "F", metrics: {}, lastUpdated: new Date().toISOString() };
  }
};

export default function HomeTheoryHub() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { colors, mode: themeMode, isDark } = useTheme();
  const lm = getLightModeColors(isDark);
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const CARD = isDark ? DASHBOARD_CARD : DASHBOARD_CARD_LIGHT;
  const BTN = isDark ? DASHBOARD_BTN : DASHBOARD_BTN_LIGHT;
  
  // Tour management (use the same UniversalTourGuide behavior as Home.tsx)
  const theoryHubTourSteps: TourStep[] = [
    {
      id: "theory-welcome",
      title: t("tour.theoryHub.welcome.title"),
      content: t("tour.theoryHub.welcome.content"),
      position: "custom",
      customPosition: { x: 600, y: 80 },
      highlight: false,
    },
    {
      id: "theory-health-score",
      title: t("tour.theoryHub.healthScore.title"),
      content: t("tour.theoryHub.healthScore.content"),
      target: "[data-tour=\"theory-health-score\"]",
      highlight: true,
    },
    {
      id: "theory-tabs",
      title: t("tour.theoryHub.overview.title"),
      content: t("tour.theoryHub.overview.content"),
      target: "[data-tour=\"theory-tabs\"]",
      highlight: true,
    },
    {
      id: "theory-tools",
      title: t("tour.theoryHub.tools.title"),
      content: t("tour.theoryHub.tools.content"),
      target: "[data-tour=\"theory-tools\"]",
      highlight: true,
    },
    {
      id: "theory-widget-area",
      title: t("tour.theoryHub.construction.title"),
      content: t("tour.theoryHub.construction.content"),
      target: "[data-tour=\"theory-widget-area\"]",
      highlight: true,
    },
    {
      id: "theory-doc-stats",
      title: t("tour.theoryHub.validation.title"),
      content: t("tour.theoryHub.validation.content"),
      target: "[data-tour=\"theory-doc-stats\"]",
      highlight: true,
    },
    {
      id: "theory-analytics",
      title: t("tour.theoryHub.analytics.title"),
      content: t("tour.theoryHub.analytics.content"),
      target: "[data-tour=\"theory-analytics\"]",
      highlight: true,
    },
    {
      id: "theory-complete",
      title: t("tour.theoryHub.publication.title"),
      content: t("tour.theoryHub.publication.content"),
      position: "custom",
      customPosition: { x: 600, y: 80 },
      highlight: false,
    },
  ];

  const { startTour: startTheoryHubTour, TourComponent: TheoryHubTourComponent } = useTour(
    theoryHubTourSteps,
    "theoryHubTourSeen"
  );

  // State management
  const state = useHomeState();
  const {
    searchOpen, setSearchOpen, hasFetchedRef, setSegSummary,
    documentId, segments,
    uploads,
  } = state;

  // Operations - simplified for Theory Hub (only fetch operations needed)
  const noopSetLoading = (_key: string, _loading: boolean) => {};
  async function executeFetch<T>(fn: () => Promise<T>): Promise<T | null> {
    try { return await fn(); } catch { return null; }
  }
  const ops = useHomeOperations(state, noopSetLoading, null as any, () => {}, null, executeFetch);
  const { fetchUploads, loadSegmentationSummary } = ops;

  // UI state
  const [theoryHealth, setTheoryHealth] = useState(calculateTheoryHealth());
  const [prevHealthScore, setPrevHealthScore] = useState<number | null>(() => {
    const stored = localStorage.getItem("theoryHealthPrevScore");
    return stored ? Number(stored) : null;
  });
  const [activeTheorySection, setActiveTheorySection] = useState<"overview" | "construction" | "validation" | "publication">("overview");
  const [widgetPopup, setWidgetPopup] = useState<{ id: string; title: string; icon: string } | null>(null);
  const [screenshotModeActive, setScreenshotModeActive] = useState(false);

  // Recently used tools + favorites (persisted)
  const [recentTools, setRecentTools] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("theoryHub-recentTools") || "[]"); } catch { return []; }
  });
  const [favoriteTools, setFavoriteTools] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("theoryHub-favoriteTools") || "[]"); } catch { return []; }
  });

  const trackToolUse = (toolId: string) => {
    setRecentTools(prev => {
      const updated = [toolId, ...prev.filter(t => t !== toolId)].slice(0, 10);
      localStorage.setItem("theoryHub-recentTools", JSON.stringify(updated));
      return updated;
    });
  };

  const toggleFavorite = (toolId: string) => {
    setFavoriteTools(prev => {
      const updated = prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId];
      localStorage.setItem("theoryHub-favoriteTools", JSON.stringify(updated));
      return updated;
    });
  };

  // Calculate theory health periodically + track trend
  useEffect(() => {
    const interval = setInterval(() => {
      const newHealth = calculateTheoryHealth();
      setPrevHealthScore(theoryHealth.score);
      localStorage.setItem("theoryHealthPrevScore", String(theoryHealth.score));
      setTheoryHealth(newHealth);
    }, 5000);
    return () => clearInterval(interval);
  }, [theoryHealth.score]);

  // Document tracking
  useEffect(() => {
    if (user) {
      fetchUploads();
      hasFetchedRef.current = true;
    }
  }, [user]);

  useEffect(() => {
    if (documentId) loadSegmentationSummary(documentId);
    else setSegSummary([]);
  }, [documentId]);

  // Auto-start tour on first visit (mirror Home.tsx behavior)
  useEffect(() => {
    const seen = localStorage.getItem("theoryHubTourSeen");
    if (!seen) {
      const timer = setTimeout(() => {
        startTheoryHubTour();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [startTheoryHubTour]);

  // Calculate stats
  const uploadsList = Array.isArray(uploads) ? uploads : [];
  const parsedCount = uploadsList.filter((u: any) => u.parseStatus === "ok").length;
  const pendingCount = uploadsList.filter((u: any) => u.parseStatus === "pending").length;
  const failedCount = uploadsList.filter((u: any) => u.parseStatus === "failed" || u.parseStatus === "error").length;

  // Tool display metadata with i18n
  const toolMeta: Record<string, { icon: string; label: string; desc: string }> = {
    TheoryStrengthScorecard: { icon: "📊", label: t("theory.tool.theoryStrength.title"), desc: t("theory.tool.theoryStrength.beginner") },
    TheoryEvolutionTimeline: { icon: "📈", label: t("theory.tool.theoryEvolution.title"), desc: t("theory.tool.theoryEvolution.beginner") },
    OntologyManager: { icon: "🧬", label: t("theory.tool.ontologyManager.title"), desc: t("theory.tool.ontologyManager.beginner") },
    ClaimVerification: { icon: "✅", label: t("theory.tool.claimVerification.title"), desc: t("theory.tool.claimVerification.beginner") },
    PropositionTypeCategorizer: { icon: "🏷️", label: t("theory.tool.propositionTypeCategorizer.title"), desc: t("theory.tool.propositionTypeCategorizer.beginner") },
    ConceptMapper: { icon: "🗺️", label: t("theory.tool.conceptMapper.title"), desc: t("theory.tool.conceptMapper.beginner") },
    BoundaryConditionsPanel: { icon: "🎯", label: t("theory.tool.boundaryConditions.title"), desc: t("theory.tool.boundaryConditions.beginner") },
    FalsificationPrompts: { icon: "❌", label: t("theory.tool.falsificationPrompts.title"), desc: t("theory.tool.falsificationPrompts.beginner") },
    PeerReviewSimulator: { icon: "👥", label: t("theory.tool.peerReviewSimulator.title"), desc: t("theory.tool.peerReviewSimulator.beginner") },
    ContradictionFinder: { icon: "🔍", label: t("theory.tool.contradictionFinder.title"), desc: t("theory.tool.contradictionFinder.beginner") },
    ConsistencyChecker: { icon: "✓", label: t("theory.tool.consistencyChecker.title"), desc: t("theory.tool.consistencyChecker.beginner") },
    PublicationReadinessChecker: { icon: "📋", label: t("theory.tool.publicationReadiness.title"), desc: t("theory.tool.publicationReadiness.beginner") },
    EvidenceRequirementsGenerator: { icon: "📝", label: t("theory.tool.evidenceRequirements.title"), desc: t("theory.tool.evidenceRequirements.beginner") },
    CounterTheoryRegistry: { icon: "⚔️", label: t("theory.tool.counterTheory.title"), desc: t("theory.tool.counterTheory.beginner") },
    EvidenceChainBuilder: { icon: "⛓️", label: t("theory.tool.evidenceChainBuilder.title"), desc: t("theory.tool.evidenceChainBuilder.beginner") },
  };

  // Theory sections configuration with internationalization
  const theorySections = {
    overview: {
      title: t("theory.phase.discovery") + " & Overview",
      icon: "🏗️",
      description: t("theoryHub.healthScore") + " — " + t("theory.tool.theoryStrength.beginner"),
      color: "#6366f1",
      tools: ["TheoryStrengthScorecard", "TheoryEvolutionTimeline", "OntologyManager"],
    },
    construction: {
      title: t("theory.phase.formulation"),
      icon: "🔨",
      description: t("theory.tool.claimVerification.beginner"),
      color: "#10b981",
      tools: ["ClaimVerification", "PropositionTypeCategorizer", "ConceptMapper", "BoundaryConditionsPanel"],
    },
    validation: {
      title: t("theory.phase.validation"),
      icon: "🧪",
      description: t("theory.tool.falsificationPrompts.beginner"),
      color: "#f59e0b",
      tools: ["FalsificationPrompts", "PeerReviewSimulator", "ContradictionFinder", "ConsistencyChecker"],
    },
    publication: {
      title: t("theory.phase.publication"),
      icon: "📑",
      description: t("theory.tool.publicationReadiness.beginner"),
      color: "#ef4444",
      tools: ["PublicationReadinessChecker", "EvidenceRequirementsGenerator", "CounterTheoryRegistry", "EvidenceChainBuilder"],
    },
  };

  // Render widget by ID
  const renderWidgetById = (id: string): React.ReactNode => {
    const widgetMap: Record<string, () => React.ReactNode> = {
      'TheoryStrengthScorecard': () => <TheoryStrengthScorecard open={true} onClose={() => setWidgetPopup(null)} />,
      'TheoryEvolutionTimeline': () => <TheoryEvolutionTimeline open={true} onClose={() => setWidgetPopup(null)} />,
      'OntologyManager': () => <OntologyManager open={true} onClose={() => setWidgetPopup(null)} />,
      'ClaimVerification': () => <ClaimVerification segmentText={segments[0]?.content || ""} />,
      'PropositionTypeCategorizer': () => <PropositionTypeCategorizer open={true} onClose={() => setWidgetPopup(null)} />,
      'ConceptMapper': () => <ConceptMapper segments={segments} open={true} onClose={() => setWidgetPopup(null)} />,
      'BoundaryConditionsPanel': () => <BoundaryConditionsPanel open={true} onClose={() => setWidgetPopup(null)} />,
      'FalsificationPrompts': () => <FalsificationPrompts />,
      'PeerReviewSimulator': () => <PeerReviewSimulator />,
      'ContradictionFinder': () => <ContradictionFinder open={true} onClose={() => setWidgetPopup(null)} />,
      'ConsistencyChecker': () => <ConsistencyChecker open={true} onClose={() => setWidgetPopup(null)} />,
      'PublicationReadinessChecker': () => <PublicationReadinessChecker open={true} onClose={() => setWidgetPopup(null)} />,
      'EvidenceRequirementsGenerator': () => <EvidenceRequirementsGenerator open={true} onClose={() => setWidgetPopup(null)} />,
      'CounterTheoryRegistry': () => <CounterTheoryRegistry open={true} onClose={() => setWidgetPopup(null)} />,
      'EvidenceChainBuilder': () => <EvidenceChainBuilder open={true} onClose={() => setWidgetPopup(null)} />,
    };
    const renderer = widgetMap[id];
    return renderer ? renderer() : <div>Widget not found</div>;
  };

  if (!user) return null;

  return (
    <div
      style={{
        background: themeMode === "dashboard"
          ? (isDark ? "linear-gradient(135deg, #0a0a0a 0%, #0f0f1a 50%, #0a0a0a 100%)" : "#faf9f7")
          : colors.bgPrimary,
        maxWidth: 1600,
        margin: "0 auto",
        color: colors.textPrimary,
        padding: "24px",
        paddingTop: 80,
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        minHeight: "100vh",
      }}
    >
      <GlobalBurgerMenu />
      <CompactExpandedToggle
        mode="expanded"
        onModeChange={(mode) => nav(mode === "compact" ? "/home-compact" : "/")}
      />
      {/* Fixed top navigation actions: Home (static, next to burger/notifications) + Start Tour (static, next to screenshot) */}
      <button
        onClick={() => nav("/")}
        style={{
          position: "fixed",
          top: 16,
          left: 152, // 40px right of burger/notifications (burger at ~16px, width ~100px, +40px gap = 152px)
          zIndex: 10002,
          padding: "8px 14px",
          background: lm.btnBg,
          border: `1px solid ${lm.btnBorder}`,
          borderRadius: "12px", // Consistent with burger/notification buttons
          color: colors.textPrimary,
          fontSize: "12px",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          cursor: "pointer",
          boxShadow: lm.btnShadow,
          backdropFilter: "blur(12px)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = isDark ? "0 6px 20px rgba(15,23,42,0.7)" : "0 6px 20px rgba(47, 41, 65, 0.18)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = lm.btnShadow;
        }}
      >
        🏠 {t("nav.home")}
      </button>

      <button
        onClick={startTheoryHubTour}
        style={{
          position: "fixed",
          top: 16,
          right: 114, // 40px left of screenshot mode button (screenshot at right:24px, ~50px width + 40px gap = 114px)
          zIndex: 10002,
          padding: "8px 18px",
          background: lm.btnBg,
          border: `1px solid ${lm.btnBorder}`,
          borderRadius: "12px", // Consistent with burger/notification buttons
          color: colors.textPrimary,
          fontSize: "12px",
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          boxShadow: lm.btnShadow,
          backdropFilter: "blur(12px)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = isDark ? "0 6px 20px rgba(15,23,42,0.7)" : "0 6px 20px rgba(47, 41, 65, 0.18)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = lm.btnShadow;
        }}
      >
        🎓 {t("tour.theoryHub.startTour") || "Start Tour"}
      </button>

      {/* Theory Health Header */}
      <div style={{ marginBottom: "32px" }}>
        <div data-tour="theory-health-score" style={{
          ...CARD,
          padding: "24px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: `linear-gradient(90deg, #ef4444 0%, #f59e0b 25%, #10b981 50%, #6366f1 75%, #8b5cf6 100%)`,
          }} />
          
          <div style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: `conic-gradient(from 0deg, #ef4444 0%, #f59e0b ${theoryHealth.score * 0.25 * 3.6}deg, #10b981 ${theoryHealth.score * 0.5 * 3.6}deg, #6366f1 ${theoryHealth.score * 0.75 * 3.6}deg, #8b5cf6 ${theoryHealth.score * 3.6}deg, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(47,41,65,0.12)'} ${theoryHealth.score * 3.6}deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}>
            <div style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: isDark ? (themeMode === "dashboard" ? "#0a0a0a" : colors.bgPrimary) : "#ffffff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ fontSize: "32px", fontWeight: "bold", color: theoryHealth.score >= 80 ? "#10b981" : theoryHealth.score >= 60 ? "#f59e0b" : "#ef4444" }}>
                {theoryHealth.grade}
              </span>
              <span style={{ fontSize: "14px", color: colors.textSecondary, display: "flex", alignItems: "center", gap: "4px" }}>
                {theoryHealth.score}%
                {prevHealthScore !== null && prevHealthScore !== theoryHealth.score && (
                  <span style={{
                    fontSize: "12px",
                    color: theoryHealth.score > prevHealthScore ? "#10b981" : "#ef4444",
                    fontWeight: 700,
                  }}>
                    {theoryHealth.score > prevHealthScore ? "↑" : "↓"}
                  </span>
                )}
              </span>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ margin: "0 0 8px", fontSize: "24px", fontWeight: "700", color: colors.textPrimary }}>
              {t("theoryHub.title") || "Theory Development Hub"}
            </h1>
            <p style={{ margin: "0 0 16px", fontSize: "14px", color: colors.textSecondary }}>
              {t("theoryHub.ecosystemDesc") || "Complete Think!Hub ecosystem for scientific theory construction and validation"}
            </p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "#6366f1" }}>📊</span>
                <span style={{ fontSize: "12px", color: colors.textSecondary }}>
                  {(theoryHealth.metrics as any).claimCount || 0} {t("theoryHub.statClaims") || "claims"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "#10b981" }}>✅</span>
                <span style={{ fontSize: "12px", color: colors.textSecondary }}>
                  {Math.round(((theoryHealth.metrics as any).evidenceCoverage || 0) * 100)}% {t("theoryHub.statEvidence") || "evidence"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "#f59e0b" }}>🔍</span>
                <span style={{ fontSize: "12px", color: colors.textSecondary }}>
                  {(theoryHealth.metrics as any).contradictionsActive || 0} {t("theoryHub.statContradictions") || "active contradictions"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "#8b5cf6" }}>📚</span>
                <span style={{ fontSize: "12px", color: colors.textSecondary }}>
                  {(theoryHealth.metrics as any).ontologyTerms || 0} {t("theoryHub.statConcepts") || "concepts"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Theory Section Tabs */}
        <div data-tour="theory-tabs" style={{
          display: "flex",
          gap: "8px",
          marginTop: "16px",
          padding: "0 4px",
        }}>
          {Object.entries(theorySections).map(([key, section]) => (
            <button
              key={key}
              onClick={() => setActiveTheorySection(key as any)}
              style={{
                padding: "8px 16px",
                background: activeTheorySection === key ? (isDark ? `${section.color}20` : `${section.color}15`) : (isDark ? lm.cardBgHover : "rgba(255,255,255,0.5)"),
                border: `1px solid ${activeTheorySection === key ? section.color : lm.borderLight}`,
                borderRadius: "8px",
                color: activeTheorySection === key ? section.color : colors.textSecondary,
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s",
              }}
            >
              <span>{section.icon}</span>
              <span>{section.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 2fr",
        gap: "24px",
        marginBottom: "32px",
      }}>
        {/* Left Panel - Theory Tools */}
        <div data-tour="theory-tools">
          <div style={{
            ...CARD,
            padding: "20px",
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "600", color: colors.textPrimary }}>
              {theorySections[activeTheorySection].title} — {t("theoryHub.tools") || "Tools"}
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: "12px", color: colors.textSecondary }}>
              {theorySections[activeTheorySection].description}
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[...theorySections[activeTheorySection].tools].sort((a, b) => {
                const aFav = favoriteTools.includes(a) ? 0 : 1;
                const bFav = favoriteTools.includes(b) ? 0 : 1;
                if (aFav !== bFav) return aFav - bFav;
                const aRecent = recentTools.indexOf(a);
                const bRecent = recentTools.indexOf(b);
                if (aRecent !== -1 && bRecent === -1) return -1;
                if (aRecent === -1 && bRecent !== -1) return 1;
                if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent;
                return 0;
              }).map(tool => {
                const meta = toolMeta[tool] || { icon: "🔧", label: tool, desc: "" };
                const isFav = favoriteTools.includes(tool);
                const isRecent = recentTools.includes(tool);
                return (
                  <div key={tool} style={{ display: "flex", alignItems: "stretch", gap: "0" }}>
                    <button
                      onClick={() => {
                        trackToolUse(tool);
                        setWidgetPopup({ id: tool, title: meta.label, icon: meta.icon });
                      }}
                      style={{
                        ...BTN,
                        flex: 1,
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        justifyContent: "flex-start",
                        textAlign: "left",
                        borderLeft: `3px solid ${isFav ? "#f59e0b" : theorySections[activeTheorySection].color}`,
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    >
                      <span style={{ fontSize: "18px", lineHeight: 1 }}>{meta.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: colors.textPrimary, marginBottom: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                          {meta.label}
                          {isRecent && <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "4px", background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>recent</span>}
                        </div>
                        <div style={{ fontSize: "11px", color: colors.textSecondary, lineHeight: "1.4" }}>
                          {meta.desc}
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(tool); }}
                      title={isFav ? "Remove from favorites" : "Add to favorites"}
                      style={{
                        ...BTN,
                        padding: "0 10px",
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        borderLeft: "none",
                        fontSize: "14px",
                        color: isFav ? "#f59e0b" : lm.starInactive,
                        transition: "color 0.2s",
                        minWidth: "36px",
                      }}
                    >
                      {isFav ? "★" : "☆"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Document Stats */}
          <div data-tour="theory-doc-stats" style={{
            ...CARD,
            padding: "20px",
            marginTop: "16px",
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "600", color: colors.textPrimary }}>
              {t("theoryHub.documentLibrary") || "Document Library"}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#6366f1" }}>{uploadsList.length}</div>
                <div style={{ fontSize: "11px", color: colors.textSecondary }}>{t("theoryHub.statTotal") || "Total"}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}>{parsedCount}</div>
                <div style={{ fontSize: "11px", color: colors.textSecondary }}>{t("theoryHub.statParsed") || "Parsed"}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f59e0b" }}>{pendingCount}</div>
                <div style={{ fontSize: "11px", color: colors.textSecondary }}>{t("theoryHub.statPending") || "Pending"}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ef4444" }}>{failedCount}</div>
                <div style={{ fontSize: "11px", color: colors.textSecondary }}>{t("theoryHub.statFailed") || "Failed"}</div>
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <button
                onClick={() => nav("/frontend")}
                style={{
                  ...BTN,
                  width: "100%",
                  padding: "10px",
                }}
              >
                {t("theoryHub.openWorkspace") || "Open Workspace"} →
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Main Content */}
        <div data-tour="theory-widget-area">
          {widgetPopup ? (
            <div style={{
              ...CARD,
              padding: "20px",
              minHeight: "400px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: colors.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{toolMeta[widgetPopup.id]?.icon || widgetPopup.icon}</span>
                  {widgetPopup.title}
                </h3>
                <button
                  onClick={() => setWidgetPopup(null)}
                  style={{
                    ...BTN,
                    padding: "6px 14px",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ maxHeight: "600px", overflow: "auto" }}>
                {renderWidgetById(widgetPopup.id)}
              </div>
            </div>
          ) : (
            <div style={{
              ...CARD,
              padding: "24px",
              minHeight: "400px",
              display: "flex",
              flexDirection: "column",
            }}>
              <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: "600", color: colors.textPrimary }}>
                {t("theoryHub.selectTool") || "Select a Theory Tool"}
              </h3>
              <p style={{ margin: "0 0 20px", fontSize: "13px", color: colors.textSecondary }}>
                {t("theoryHub.selectToolHint") || `Choose from the ${theorySections[activeTheorySection].tools.length} tools in the ${theorySections[activeTheorySection].title} section`}
              </p>
              
              {/* Quick-launch grid for current section tools */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", flex: 1 }}>
                {theorySections[activeTheorySection].tools.map(tool => {
                  const meta = toolMeta[tool] || { icon: "🔧", label: tool, desc: "" };
                  return (
                    <button
                      key={tool}
                      onClick={() => setWidgetPopup({ id: tool, title: meta.label, icon: meta.icon })}
                      style={{
                        ...BTN,
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        textAlign: "center",
                        borderTop: `3px solid ${theorySections[activeTheorySection].color}`,
                        transition: "all 0.2s",
                      }}
                    >
                      <span style={{ fontSize: "28px" }}>{meta.icon}</span>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: colors.textPrimary }}>{meta.label}</span>
                      <span style={{ fontSize: "10px", color: colors.textSecondary, lineHeight: "1.3" }}>{meta.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Theory Workflow Progress */}
      <div data-tour="theory-analytics" style={{
        ...CARD,
        padding: "20px",
        marginBottom: "32px",
      }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "600", color: colors.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#6366f1" }}>�</span> {t("theoryHub.workflowProgress") || "Theory Workflow Progress"}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "16px" }}>
          {Object.entries(theorySections).map(([key, section]) => {
            const isActive = activeTheorySection === key;
            // Calculate real progress from localStorage data
            const calcProgress = () => {
              try {
                if (key === "overview") {
                  return theoryHealth.score;
                } else if (key === "construction") {
                  const claims = JSON.parse(localStorage.getItem("thinkspace-claim-builder") || "[]");
                  const props = JSON.parse(localStorage.getItem("thinkspace-proposition-types") || "[]");
                  const categorized = props.filter((p: any) => p.manualType || p.autoType !== "uncategorized").length;
                  return claims.length > 0 ? Math.round((categorized / Math.max(claims.length, 1)) * 100) : 0;
                } else if (key === "validation") {
                  const contradictions = JSON.parse(localStorage.getItem("thinkspace-contradictions") || "{}");
                  const resolved = contradictions.contradictions?.filter((c: any) => c.status === "resolved").length || 0;
                  const total = contradictions.contradictions?.length || 0;
                  return total > 0 ? Math.round((resolved / total) * 100) : 0;
                } else {
                  const evReqs = JSON.parse(localStorage.getItem("thinkspace-evidence-requirements") || "[]");
                  const found = evReqs.filter((r: any) => r.status === "found").length;
                  return evReqs.length > 0 ? Math.round((found / evReqs.length) * 100) : 0;
                }
              } catch { return 0; }
            };
            const progress = calcProgress();
            return (
              <div
                key={key}
                onClick={() => setActiveTheorySection(key as any)}
                style={{
                  padding: "16px",
                  background: isActive ? (isDark ? `${section.color}15` : `${section.color}10`) : (isDark ? lm.cardBgActive : "rgba(255,255,255,0.8)"),
                  border: `1px solid ${isActive ? section.color : lm.borderLight}`,
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>{section.icon}</div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: isActive ? section.color : colors.textPrimary, marginBottom: "4px" }}>
                  {section.title}
                </div>
                <div style={{ fontSize: "11px", color: colors.textSecondary, marginBottom: "8px" }}>
                  {section.tools.length} {t("theoryHub.tools") || "tools"}
                </div>
                {/* Progress bar */}
                <div style={{ height: "4px", background: lm.progressBg, borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: section.color, transition: "width 0.3s" }} />
                </div>
                <div style={{ fontSize: "10px", color: colors.textSecondary, marginTop: "4px" }}>{progress}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GitHub-style Contribution Graph & Activity Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
        <ContributionGraph
          title={t("theoryHub.researchActivity") || "Research Activity"}
          subtitle={t("theoryHub.contributionsLastYear") || "Contributions in the last year"}
          colorScheme="purple"
          weeks={40}
          showYearSelector
          showColorToggle
          style={{ minHeight: "480px" }}
        />
        <ActivityFeed
          title={t("theoryHub.recentActivity") || "Recent Activity"}
          maxItems={20}
          compact={false}
          style={{ maxHeight: "480px", overflow: "auto" }}
        />
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ScreenshotMode isActive={screenshotModeActive} onToggle={() => setScreenshotModeActive(!screenshotModeActive)} />
      
      {/* Tour Guide - UniversalTourGuide variant for Theory Hub */}
      <TheoryHubTourComponent />
    </div>
  );
}

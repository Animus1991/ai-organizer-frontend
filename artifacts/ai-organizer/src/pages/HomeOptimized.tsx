// src/pages/HomeOptimized.tsx
// OPTIMIZED: Theory Development Hub - Scientific workflow for theory construction
import { useState, useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useTheme, DASHBOARD_CARD, DASHBOARD_BTN } from "../context/ThemeContext";

// Core imports
import { useLoading } from "../hooks/useLoading";
import SearchModal from "../components/SearchModal";
import { UploadItemDTO } from "../lib/api";
import { useHomeState } from "../hooks/home";
import { useHomeOperations } from "../hooks/home/useHomeOperations";
import { useFileUpload } from "../hooks/useFileUpload";

// Theory Operating System (Think!Hub) imports
import { 
  ClaimVerification, FalsificationPrompts, PeerReviewSimulator,
  PropositionTypeCategorizer, EvidenceRequirementsGenerator,
  PublicationReadinessChecker, CounterTheoryRegistry,
  EvidenceChainBuilder, TheoryEvolutionTimeline,
  BoundaryConditionsPanel, ContradictionFinder,
  TheoryStrengthScorecard, OntologyManager, ConceptMapper,
  ConsistencyChecker
} from "../components/research";

// Modern UI components
import ResearchDashboard from "../components/ResearchDashboard";
import SmartDocumentSuggestions from "../components/SmartDocumentSuggestions";
import AIInsightsAnalytics from "../components/AIInsightsAnalytics";
import GlobalBurgerMenu from "../components/GlobalBurgerMenu";
import { CompactExpandedToggle } from "../components/ui/CompactExpandedToggle";
import { ScreenshotMode } from "../components/ScreenshotMode";

// Helper function to convert UploadItemDTO to DocumentDTO
const convertUploadsToDocuments = (uploads: UploadItemDTO[] | null | undefined) => {
  if (!uploads || !Array.isArray(uploads)) return [];
  return uploads.map(upload => ({
    id: upload.documentId,
    title: upload.filename,
    filename: upload.filename,
    parseStatus: upload.parseStatus,
    parseError: upload.parseError,
    sourceType: upload.contentType,
    text: '',
    upload: {
      id: upload.uploadId,
      contentType: upload.contentType,
      sizeBytes: upload.sizeBytes,
    }
  }));
};

// Theory Health Score calculation
const calculateTheoryHealth = () => {
  try {
    // Collect data from all Think!Hub components
    const claims: any[] = JSON.parse(localStorage.getItem("thinkspace-claim-builder") || "[]");
    const props: any[] = JSON.parse(localStorage.getItem("thinkspace-proposition-types") || "[]");
    const evReqs: any[] = JSON.parse(localStorage.getItem("thinkspace-evidence-requirements") || "[]");
    const contradictions: any = JSON.parse(localStorage.getItem("thinkspace-contradictions") || "{}");
    const boundaries: any = JSON.parse(localStorage.getItem("thinkspace-boundary-conditions") || "{}");
    const ontology: any[] = JSON.parse(localStorage.getItem("thinkspace-ontology") || "[]");
    const versions: any = JSON.parse(localStorage.getItem("thinkspace-theory-versions") || "{}");
    const reviews: any[] = JSON.parse(localStorage.getItem("thinkspace-peer-review") || "[]");
    const readiness: any[] = JSON.parse(localStorage.getItem("thinkspace-publication-readiness") || "[]");
    
    // Calculate health metrics
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
    
    // Calculate overall health score (0-100)
    let score = 0;
    const weights = {
      claimCount: 10,           // Base: having claims
      categorizedClaims: 15,    // Organization
      evidenceCoverage: 20,     // Evidence support
      contradictionsResolved: 15, // Logical consistency
      boundariesDefined: 10,    // Scope definition
      ontologyTerms: 10,        // Concept clarity
      versionCount: 5,          // Iteration
      peerReviews: 10,          // Validation
      readinessScore: 5,        // Publication readiness
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
    return {
      score: 0,
      grade: "F",
      metrics: {
        claimCount: 0,
        categorizedClaims: 0,
        evidenceCoverage: 0,
        contradictionsResolved: 0,
        contradictionsActive: 0,
        boundariesDefined: 0,
        ontologyTerms: 0,
        versionCount: 0,
        peerReviews: 0,
        readinessScore: 0,
      },
      lastUpdated: new Date().toISOString(),
    };
  }
};

export default function HomeOptimized() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { colors, isDark, mode: themeMode } = useTheme();
  useLanguage();

  // State management
  const { upload: uploadWithProgress, reset: resetUpload, error: uploadError } = useFileUpload();
  const { execute: executeFetch } = useLoading();

  // Home state
  const state = useHomeState();
  const {
    searchOpen, setSearchOpen, hasFetchedRef, setSegSummary,
    documentId,
    segments,
    uploads,
    segSummaryByMode,
  } = state;

  // Operations
  const setLoading = (_key: string, _loading: boolean) => {};
  const ops = useHomeOperations(state, setLoading, uploadWithProgress, resetUpload, uploadError, executeFetch);
  const { fetchUploads, loadSegmentationSummary } = ops;

  // UI state
  const [screenshotModeActive, setScreenshotModeActive] = useState(false);
  const [_homeWidgetViewMode] = useState<"grid" | "carousel3d" | "carousel">("grid");
  const [widgetPopup, setWidgetPopup] = useState<{ id: string; title: string; icon: string } | null>(null);
  const [theoryHealth, setTheoryHealth] = useState(calculateTheoryHealth());
  const [activeTheorySection, setActiveTheorySection] = useState<"overview" | "construction" | "validation" | "publication">("overview");
  const [showTheoryDetails, setShowTheoryDetails] = useState(false);

  // Calculate theory health periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTheoryHealth(calculateTheoryHealth());
    }, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

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

  // Calculate stats
  const uploadsList = Array.isArray(uploads) ? uploads : [];
  const parsedCount = uploadsList.filter((u: any) => u.parseStatus === "ok").length;
  const pendingCount = uploadsList.filter((u: any) => u.parseStatus === "pending").length;
  const failedCount = uploadsList.filter((u: any) => u.parseStatus === "failed" || u.parseStatus === "error").length;
  void segSummaryByMode; // used by loadSegmentationSummary effect

  // Theory sections configuration
  const theorySections = {
    overview: {
      title: "Theory Overview",
      icon: "🏗️",
      description: "Health score and overall progress",
      color: "#6366f1",
      tools: ["TheoryStrengthScorecard", "TheoryEvolutionTimeline", "OntologyManager"],
    },
    construction: {
      title: "Theory Construction",
      icon: "🔨",
      description: "Build and structure your claims",
      color: "#10b981",
      tools: ["ClaimVerification", "PropositionTypeCategorizer", "ConceptMapper", "BoundaryConditionsPanel"],
    },
    validation: {
      title: "Theory Validation",
      icon: "🧪",
      description: "Test and verify your theory",
      color: "#f59e0b",
      tools: ["FalsificationPrompts", "PeerReviewSimulator", "ContradictionFinder", "ConsistencyChecker"],
    },
    publication: {
      title: "Publication Ready",
      icon: "📑",
      description: "Prepare for academic publication",
      color: "#ef4444",
      tools: ["PublicationReadinessChecker", "EvidenceRequirementsGenerator", "CounterTheoryRegistry", "EvidenceChainBuilder"],
    },
  };

  // Render widget by ID
  const renderWidgetById = (id: string): React.ReactNode => {
    const widgetMap: Record<string, () => React.ReactNode> = {
      'TheoryStrengthScorecard': () => <TheoryStrengthScorecard open={true} onClose={() => {}} />,
      'TheoryEvolutionTimeline': () => <TheoryEvolutionTimeline open={true} onClose={() => {}} />,
      'OntologyManager': () => <OntologyManager open={true} onClose={() => {}} />,
      'ClaimVerification': () => <ClaimVerification segmentText={segments[0]?.content || ""} />,
      'PropositionTypeCategorizer': () => <PropositionTypeCategorizer open={true} onClose={() => {}} />,
      'ConceptMapper': () => <ConceptMapper segments={segments} open={true} onClose={() => {}} />,
      'BoundaryConditionsPanel': () => <BoundaryConditionsPanel open={true} onClose={() => {}} />,
      'FalsificationPrompts': () => <FalsificationPrompts />,
      'PeerReviewSimulator': () => <PeerReviewSimulator />,
      'ContradictionFinder': () => <ContradictionFinder open={true} onClose={() => {}} />,
      'ConsistencyChecker': () => <ConsistencyChecker open={true} onClose={() => {}} />,
      'PublicationReadinessChecker': () => <PublicationReadinessChecker open={true} onClose={() => {}} />,
      'EvidenceRequirementsGenerator': () => <EvidenceRequirementsGenerator open={true} onClose={() => {}} />,
      'CounterTheoryRegistry': () => <CounterTheoryRegistry open={true} onClose={() => {}} />,
      'EvidenceChainBuilder': () => <EvidenceChainBuilder open={true} onClose={() => {}} />,
    };
    const renderer = widgetMap[id];
    return renderer ? renderer() : <div>Widget not found</div>;
  };

  if (!user) return null;

  return (
    <div
      style={{
        background: themeMode === "dashboard"
          ? "linear-gradient(135deg, #0a0a0a 0%, #0f0f1a 50%, #0a0a0a 100%)"
          : isDark 
            ? `radial-gradient(1200px 800px at 20% 10%, rgba(99, 102, 241, 0.08), transparent 60%),
               radial-gradient(1000px 600px at 80% 40%, rgba(16, 185, 129, 0.06), transparent 65%),
               linear-gradient(180deg, ${colors.bgPrimary} 0%, ${colors.bgSecondary} 50%, ${colors.bgPrimary} 100%)`
            : `radial-gradient(1200px 800px at 20% 10%, rgba(99, 102, 241, 0.05), transparent 60%),
               radial-gradient(1000px 600px at 80% 40%, rgba(16, 185, 129, 0.04), transparent 65%),
               ${colors.bgPrimary}`,
        maxWidth: 1600,
        margin: "0 auto",
        color: colors.textPrimary,
        padding: "24px",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        minHeight: "100vh",
      }}
    >
      <GlobalBurgerMenu />
      <CompactExpandedToggle
        mode="expanded"
        onModeChange={(mode) => nav(mode === "compact" ? "/home-compact" : "/")}
      />

      {/* Theory Health Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{
          ...DASHBOARD_CARD,
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
            background: `conic-gradient(from 0deg, #ef4444 0%, #f59e0b ${theoryHealth.score * 0.25 * 3.6}deg, #10b981 ${theoryHealth.score * 0.5 * 3.6}deg, #6366f1 ${theoryHealth.score * 0.75 * 3.6}deg, #8b5cf6 ${theoryHealth.score * 3.6}deg, rgba(255,255,255,0.1) ${theoryHealth.score * 3.6}deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}>
            <div style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: themeMode === "dashboard" ? "#0a0a0a" : colors.bgPrimary,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ fontSize: "32px", fontWeight: "bold", color: theoryHealth.score >= 80 ? "#10b981" : theoryHealth.score >= 60 ? "#f59e0b" : "#ef4444" }}>
                {theoryHealth.grade}
              </span>
              <span style={{ fontSize: "14px", color: colors.textSecondary }}>
                {theoryHealth.score}%
              </span>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ margin: "0 0 8px", fontSize: "24px", fontWeight: "700", color: colors.textPrimary }}>
              Theory Development Hub
            </h1>
            <p style={{ margin: "0 0 16px", fontSize: "14px", color: colors.textSecondary }}>
              Complete Think!Hub ecosystem for scientific theory construction and validation
            </p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "#6366f1" }}>📊</span>
                <span style={{ fontSize: "12px", color: colors.textSecondary }}>
                  {theoryHealth.metrics.claimCount || 0} claims
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "#10b981" }}>✅</span>
                <span style={{ fontSize: "12px", color: colors.textSecondary }}>
                  {Math.round((theoryHealth.metrics.evidenceCoverage || 0) * 100)}% evidence
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "#f59e0b" }}>🔍</span>
                <span style={{ fontSize: "12px", color: colors.textSecondary }}>
                  {theoryHealth.metrics.contradictionsActive || 0} active contradictions
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "#8b5cf6" }}>📚</span>
                <span style={{ fontSize: "12px", color: colors.textSecondary }}>
                  {theoryHealth.metrics.ontologyTerms || 0} concepts
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowTheoryDetails(!showTheoryDetails)}
            style={{
              ...DASHBOARD_BTN,
              padding: "12px 24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>{showTheoryDetails ? "Hide" : "Show"} Details</span>
            <span style={{ transform: showTheoryDetails ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
              ▼
            </span>
          </button>
        </div>

        {/* Theory Section Tabs */}
        <div style={{
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
                background: activeTheorySection === key ? `${section.color}20` : "rgba(255,255,255,0.05)",
                border: `1px solid ${activeTheorySection === key ? section.color : "rgba(255,255,255,0.1)"}`,
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
        <div>
          <div style={{
            ...DASHBOARD_CARD,
            padding: "20px",
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "600", color: colors.textPrimary }}>
              {theorySections[activeTheorySection].title} Tools
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: "12px", color: colors.textSecondary }}>
              {theorySections[activeTheorySection].description}
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {theorySections[activeTheorySection].tools.map(tool => (
                <button
                  key={tool}
                  onClick={() => setWidgetPopup({ id: tool, title: tool, icon: "🔧" })}
                  style={{
                    ...DASHBOARD_BTN,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    justifyContent: "flex-start",
                    textAlign: "left",
                  }}
                >
                  <span>🔧</span>
                  <span>{tool}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Document Stats */}
          <div style={{
            ...DASHBOARD_CARD,
            padding: "20px",
            marginTop: "16px",
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "600", color: colors.textPrimary }}>
              Document Library
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#6366f1" }}>{uploadsList.length}</div>
                <div style={{ fontSize: "11px", color: colors.textSecondary }}>Total</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}>{parsedCount}</div>
                <div style={{ fontSize: "11px", color: colors.textSecondary }}>Parsed</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f59e0b" }}>{pendingCount}</div>
                <div style={{ fontSize: "11px", color: colors.textSecondary }}>Pending</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ef4444" }}>{failedCount}</div>
                <div style={{ fontSize: "11px", color: colors.textSecondary }}>Failed</div>
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <button
                onClick={() => nav("/workspace")}
                style={{
                  ...DASHBOARD_BTN,
                  width: "100%",
                  padding: "10px",
                }}
              >
                Open Workspace →
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Main Content */}
        <div>
          {widgetPopup ? (
            <div style={{
              ...DASHBOARD_CARD,
              padding: "20px",
              minHeight: "400px",
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
              <div style={{ maxHeight: "600px", overflow: "auto" }}>
                {renderWidgetById(widgetPopup.id)}
              </div>
            </div>
          ) : (
            <div style={{
              ...DASHBOARD_CARD,
              padding: "20px",
              minHeight: "400px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "16px",
            }}>
              <span style={{ fontSize: "48px" }}>🏗️</span>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: colors.textPrimary }}>
                Select a Theory Tool
              </h3>
              <p style={{ margin: 0, fontSize: "14px", color: colors.textSecondary, textAlign: "center" }}>
                Choose from the {theorySections[activeTheorySection].tools.length} tools in the {theorySections[activeTheorySection].title} section
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Analytics Bar */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "16px",
      }}>
        <div style={{ ...DASHBOARD_CARD, padding: "16px" }}>
          <ResearchDashboard documents={convertUploadsToDocuments(uploads)} />
        </div>
        <div style={{ ...DASHBOARD_CARD, padding: "16px" }}>
          <SmartDocumentSuggestions 
            documents={convertUploadsToDocuments(uploads)} 
            currentDocumentId={documentId || undefined} 
            userActivity={{ recentlyViewed: [], searchHistory: [], categories: [] }} 
            maxSuggestions={3} 
          />
        </div>
        <div style={{ ...DASHBOARD_CARD, padding: "16px" }}>
          <AIInsightsAnalytics documentId={documentId || 1} showRecommendations={true} />
        </div>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ScreenshotMode isActive={screenshotModeActive} onToggle={() => setScreenshotModeActive(!screenshotModeActive)} />
    </div>
  );
}

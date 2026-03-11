// src/pages/DocumentViewer.tsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { getDocument, type DocumentDTO } from "../lib/api";
import { useLoading } from "../hooks/useLoading";
import { highlightSearch } from "../lib/searchUtils";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useAIClaimDetection, type DetectedClaim } from "../hooks/useAIClaimDetection";
import { useDocumentVersionControl } from "../hooks/useDocumentVersionControl";
import { PaperTemplateSelector } from "../components/PaperTemplateSelector";
import { 
  exportDocumentToJSON, 
  exportDocumentToTXT, 
  exportDocumentToMD, 
  downloadFile,
  calculateDocumentStats 
} from "../lib/exportUtils";
import { useTour } from "../components/tour/useTour";
import { TourPanel } from "../components/tour/TourPanel";
import { ScreenshotMode } from "../components/ScreenshotMode";
import GlobalBurgerMenu from "../components/GlobalBurgerMenu";
import { useIsMobile } from "../hooks/useMediaQuery";

export default function DocumentViewer() {
  const { documentId } = useParams<{ documentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [document, setDocument] = useState<DocumentDTO | null>(null);
  const { loading, error, execute } = useLoading();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState(0);
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const tourRefs = {
    header: useRef<HTMLDivElement | null>(null),
    metadata: useRef<HTMLDivElement | null>(null),
    actions: useRef<HTMLDivElement | null>(null),
    content: useRef<HTMLDivElement | null>(null),
  };

  // Screenshot Mode state
  const [screenshotModeActive, setScreenshotModeActive] = useState(false);

  // AI Claim Detection
  const { detectClaims, isDetecting: isDetectingClaims, progress: claimDetectionProgress } = useAIClaimDetection();
  const [detectedClaims, setDetectedClaims] = useState<DetectedClaim[]>([]);
  const [showClaimsPanel, setShowClaimsPanel] = useState(false);

  // Version Control
  const { 
    versions, 
    createSnapshot, 
    isLoading: isLoadingVersions 
  } = useDocumentVersionControl(Number(documentId) || 0);
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  // Paper Templates
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  // Readable width toggle (synced with workspace preference)
  const [readableWidth, setReadableWidth] = useState(false);
  
  // Statistics
  const stats = useMemo(() => {
    if (!document?.text) return null;
    return calculateDocumentStats(document.text);
  }, [document?.text]);

  useEffect(() => {
    if (!documentId || !user) return;

    // Reset document state when documentId changes to prevent showing stale data
    setDocument(null);

    const loadDocument = async () => {
      const doc = await execute(async () => {
        return await getDocument(Number(documentId));
      });
      
      // Only set document if we got a valid result (not null from error)
      if (doc) {
        setDocument(doc);
      }
    };

    loadDocument();
  }, [documentId, user, execute]);

  // Search functionality
  useEffect(() => {
    if (!document?.text || !searchQuery.trim()) {
      setSearchMatches([]);
      setSearchIndex(0);
      return;
    }

    const query = searchQuery.trim().toLowerCase();
    const text = document.text.toLowerCase();
    const matches: number[] = [];
    let index = text.indexOf(query);

    while (index !== -1) {
      matches.push(index);
      index = text.indexOf(query, index + 1);
    }

    setSearchMatches(matches);
    setSearchIndex(0);
  }, [document?.text, searchQuery]);

  // Export functions
  const handleExport = (format: 'json' | 'txt' | 'md') => {
    if (!document) return;

    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'json':
        content = exportDocumentToJSON(document, { format: 'json', includeMetadata: true });
        filename = `${document.filename || 'document'}.json`;
        mimeType = 'application/json';
        break;
      case 'txt':
        content = exportDocumentToTXT(document, { format: 'txt', includeMetadata: true });
        filename = `${document.filename || 'document'}.txt`;
        mimeType = 'text/plain';
        break;
      case 'md':
        content = exportDocumentToMD(document, { format: 'md', includeMetadata: true });
        filename = `${document.filename || 'document'}.md`;
        mimeType = 'text/markdown';
        break;
    }

    downloadFile(content, filename, mimeType);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNextMatch = () => {
    if (searchMatches.length > 0) {
      setSearchIndex((prev) => (prev + 1) % searchMatches.length);
    }
  };

  const handlePrevMatch = () => {
    if (searchMatches.length > 0) {
      setSearchIndex((prev) => (prev - 1 + searchMatches.length) % searchMatches.length);
    }
  };

  const handleDetectClaims = async () => {
    if (!document?.text) return;
    const claims = await detectClaims(document.text, { minConfidence: 0.7, maxClaims: 20 });
    setDetectedClaims(claims);
    setShowClaimsPanel(true);
  };

  const handleCreateVersion = () => {
    if (!document?.text || !user?.email) return;
    createSnapshot(document.text, `Manual snapshot by ${user.email}`, user.email, 'manual-snapshot');
    alert('Version saved!');
  };

  const tourSteps = [
    {
      key: "welcome",
      title: "Document Viewer",
      body: "Review document metadata, search within content, and export in common formats.",
      ref: null as React.RefObject<HTMLDivElement | null> | null,
    },
    {
      key: "header",
      title: "Header & Navigation",
      body: "Return to the previous page or jump back to Home from here.",
      ref: tourRefs.header,
    },
    {
      key: "metadata",
      title: "Document Metadata",
      body: "Check parse status, file type, and key details at a glance.",
      ref: tourRefs.metadata,
    },
    {
      key: "actions",
      title: "Export & Actions",
      body: "Export the document to JSON, TXT, or Markdown for reuse.",
      ref: tourRefs.actions,
    },
    {
      key: "content",
      title: "Document Content",
      body: "Search within the document and browse highlighted matches.",
      ref: tourRefs.content,
    },
  ];

  const {
    tourOpen,
    tourStepIndex,
    tourPopoverPos,
    startTour,
    closeTour,
    nextTourStep,
    prevTourStep,
    getTourHighlightStyle,
  } = useTour({
    storageKey: "documentViewerTourSeen",
    steps: tourSteps,
    containerRef: pageContainerRef,
  });

  // Show loading state if we're actively loading OR if we don't have a document yet and haven't encountered an error
  // This prevents the "Document not found" flash during initial load
  // IMPORTANT: Check loading first, then check if document exists
  // If loading is false but document is null and no error, we're still in initial state (show loading)
  if (loading || (!document && !error && documentId)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "hsl(var(--background))",
        }}
      >
        <div
          style={{
            background: "hsl(var(--card))",
            backdropFilter: "blur(20px)",
            border: "1px solid hsl(var(--border))",
            borderRadius: "20px",
            padding: "40px",
            boxShadow: "0 8px 32px hsl(var(--background) / 0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <svg className="animate-spin w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" style={{ width: "24px", height: "24px", color: "#6366f1" }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span style={{ color: "hsl(var(--primary))", fontWeight: 600, fontSize: "16px" }}>Loading document...</span>
          </div>
        </div>
        <TourPanel
          open={tourOpen}
          popoverPos={tourPopoverPos}
          stepIndex={tourStepIndex}
          steps={tourSteps}
          onClose={closeTour}
          onNext={nextTourStep}
          onPrev={prevTourStep}
        />
      </div>
    );
  }

  // Only show error state if we've finished loading AND there's an actual error, OR document is null after loading completes
  // IMPORTANT: Must check !loading first to ensure we've actually attempted to load
  // Also check documentId exists to avoid showing error on initial mount
  if (!loading && documentId && (error || !document)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "hsl(var(--background))",
        }}
      >
        <div
          style={{
            background: "hsl(var(--card))",
            backdropFilter: "blur(20px)",
            border: "1px solid hsl(var(--border))",
            borderRadius: "20px",
            padding: isMobile ? "24px" : "40px",
            maxWidth: "500px",
            boxShadow: "0 8px 32px hsl(var(--background) / 0.4)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                background: "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "32px", height: "32px", color: "#f87171" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 style={{ fontSize: "22px", fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: "12px" }}>Document Not Found</h3>
            <p style={{ color: "hsl(var(--muted-foreground))", marginBottom: "24px", fontSize: "14px" }}>{error || "The requested document could not be loaded."}</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <Link
                to="/"
                style={{
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  border: "none",
                  borderRadius: "12px",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "14px",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
                }}
              >
                Back to Home
              </Link>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "12px 24px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "#eaeaea",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // but add a defensive return to satisfy strict null checks
  if (!document) {
    return null;
  }

  return (
    <ErrorBoundary fallback={
      <div style={{ padding: 20, textAlign: "center", color: "#ef4444" }}>
        An error occurred in the document viewer. Please refresh.
      </div>
    }>
      <div
        ref={pageContainerRef}
        className="min-h-screen"
        style={{
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          paddingTop: tourPopoverPos?.pushDownPadding
            ? `calc(32px + ${Math.round(tourPopoverPos.pushDownPadding)}px)`
            : "72px",
        }}
      >
      <GlobalBurgerMenu />
      <div className={`page-shell${readableWidth ? "" : " page-shell--full"}`}>
      {/* Header */}
      <div
        ref={tourRefs.header}
        className="page-header"
        style={{ ...(getTourHighlightStyle(tourRefs.header) || {}) }}
      >
        <div
          style={{
            background: "hsl(var(--card))",
            backdropFilter: "blur(20px)",
            border: "1px solid hsl(var(--border))",
            borderRadius: readableWidth ? "20px" : "0",
            padding: isMobile ? "16px" : "28px 32px",
            width: readableWidth ? "100%" : "calc(100% + 64px)",
            flex: "1 1 auto",
            margin: readableWidth ? "0 0 24px 0" : "0 -32px 24px -32px",
            boxShadow: "0 8px 32px hsl(var(--background) / 0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "16px", marginBottom: "24px", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate(-1)}
              style={{
                padding: "12px",
                background: "hsl(var(--muted) / 0.4)",
                border: "1px solid hsl(var(--border))",
                borderRadius: "10px",
                color: "hsl(var(--foreground))",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  margin: 0,
                  marginBottom: "4px",
                  letterSpacing: "-0.3px",
                }}
              >
                {document.title}
              </h1>
            {document.filename && (
                <p style={{ margin: 0, fontSize: "13px", color: "hsl(var(--muted-foreground))", fontWeight: 400 }}>{document.filename}</p>
            )}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setReadableWidth((v) => !v)}
              className={readableWidth ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
              aria-label={readableWidth ? "Switch to full width" : "Switch to readable width (focused reading mode)"}
              title={readableWidth ? "Switch to full width" : "Switch to readable width (focused reading mode)"}
            >
              ↔️ {readableWidth ? "Full width" : "Readable width"}
            </button>
            {readableWidth && (
              <span
                style={{
                  fontSize: "11px",
                  color: "rgba(99, 102, 241, 0.9)",
                  background: "rgba(99, 102, 241, 0.1)",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  fontWeight: 500,
                  whiteSpace: "nowrap"
                }}
                title="Focused reading mode: narrower width for comfortable long-form reading"
              >
                📖 Focused reading
              </span>
            )}
            <button
              onClick={startTour}
              className="btn btn-tertiary btn-sm"
              aria-label="Start tour"
              title="Take a guided tour of the document viewer"
            >
              🚀 Start tour
            </button>
          </div>
        </div>

        {/* Metadata */}
          <div
            ref={tourRefs.metadata}
            style={{
              background: "hsl(var(--card))",
              backdropFilter: "blur(20px)",
              border: "1px solid hsl(var(--border))",
              borderRadius: "10px",
              padding: isMobile ? "16px" : "24px",
              marginBottom: "24px",
              ...(getTourHighlightStyle(tourRefs.metadata) || {}),
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: "20px" }}>Document Information</h2>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px" }}>
            <div>
                <h3 style={{ fontSize: "13px", fontWeight: 600, color: "hsl(var(--muted-foreground))", marginBottom: "8px" }}>Source Type</h3>
                <p style={{ color: "hsl(var(--foreground))", fontSize: "14px", fontWeight: 500, textTransform: "capitalize" }}>{document.sourceType}</p>
            </div>
            <div>
                <h3 style={{ fontSize: "13px", fontWeight: 600, color: "hsl(var(--muted-foreground))", marginBottom: "8px" }}>Parse Status</h3>
                <span
                  style={{
                    display: "inline-flex",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    ...(document.parseStatus === "ok"
                      ? {
                          background: "rgba(16, 185, 129, 0.2)",
                          color: "#6ee7b7",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                        }
                      : document.parseStatus === "failed"
                      ? {
                          background: "rgba(239, 68, 68, 0.2)",
                          color: "#fca5a5",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                        }
                      : {
                          background: "rgba(251, 191, 36, 0.2)",
                          color: "#fcd34d",
                          border: "1px solid rgba(251, 191, 36, 0.3)",
                        }),
                  }}
                >
                  {document.parseStatus}
                </span>
            </div>
            {document.upload && (
              <>
                <div>
                    <h3 style={{ fontSize: "13px", fontWeight: 600, color: "hsl(var(--muted-foreground))", marginBottom: "8px" }}>File Size</h3>
                    <p style={{ color: "hsl(var(--foreground))", fontSize: "14px", fontWeight: 500 }}>{document.upload.sizeBytes?.toLocaleString()} bytes</p>
                </div>
                <div>
                    <h3 style={{ fontSize: "13px", fontWeight: 600, color: "hsl(var(--muted-foreground))", marginBottom: "8px" }}>Content Type</h3>
                    <p style={{ color: "hsl(var(--foreground))", fontSize: "14px", fontWeight: 500 }}>{document.upload.contentType}</p>
                </div>
              </>
            )}
          </div>
          
          {document.parseError && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "16px",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "10px",
                }}
              >
                <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#fca5a5", marginBottom: "8px" }}>Parse Error</h3>
                <p style={{ color: "#f87171", fontSize: "13px", margin: 0 }}>{document.parseError}</p>
            </div>
            )}
          </div>

          {/* Enhanced Statistics Cards */}
          {stats && (
            <div
              style={{
                marginTop: "20px",
                padding: isMobile ? "12px" : "20px",
                background: "hsl(var(--muted) / 0.15)",
                border: "1px solid hsl(var(--border))",
                borderRadius: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                }}>
                  <span style={{ fontSize: "16px" }}>📊</span>
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "hsl(var(--foreground))", margin: 0 }}>Document Statistics</h3>
              </div>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(120px, 1fr))", 
                gap: "12px" 
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: isMobile ? "10px" : "14px",
                  background: "rgba(99, 102, 241, 0.08)",
                  borderRadius: "10px",
                  border: "1px solid rgba(99, 102, 241, 0.15)",
                }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "14px",
                  }}>📝</div>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#6366f1" }}>
                      {stats.words.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "10px", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Words
                    </div>
                  </div>
                </div>
                
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "14px",
                  background: "rgba(16, 185, 129, 0.08)",
                  borderRadius: "12px",
                  border: "1px solid rgba(16, 185, 129, 0.15)",
                }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "14px",
                  }}>🔤</div>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#10b981" }}>
                      {stats.characters.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Characters
                    </div>
                  </div>
                </div>
                
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "14px",
                  background: "rgba(245, 158, 11, 0.08)",
                  borderRadius: "12px",
                  border: "1px solid rgba(245, 158, 11, 0.15)",
                }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "14px",
                  }}>💬</div>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#f59e0b" }}>
                      {stats.sentences.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Sentences
                    </div>
                  </div>
                </div>
                
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "14px",
                  background: "rgba(139, 92, 246, 0.08)",
                  borderRadius: "12px",
                  border: "1px solid rgba(139, 92, 246, 0.15)",
                }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "14px",
                  }}>📄</div>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#8b5cf6" }}>
                      {stats.paragraphs.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Paragraphs
                    </div>
                  </div>
                </div>
                
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "14px",
                  background: "rgba(236, 72, 153, 0.08)",
                  borderRadius: "12px",
                  border: "1px solid rgba(236, 72, 153, 0.15)",
                }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    background: "linear-gradient(135deg, #ec4899, #db2777)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "14px",
                  }}>📏</div>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#ec4899" }}>
                      {stats.lines.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Lines
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Tools Section */}
          {stats && (
            <div
              style={{
                marginTop: "20px",
                padding: "16px 20px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                {/* Reading Time */}
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  padding: "8px 14px",
                  background: "rgba(59, 130, 246, 0.1)",
                  borderRadius: "8px",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                }}>
                  <span style={{ fontSize: "14px" }}>⏱️</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#60a5fa" }}>
                      {Math.ceil(stats.words / 200)} min
                    </div>
                    <div style={{ fontSize: "9px", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>
                      Read Time
                    </div>
                  </div>
                </div>
                
                {/* Avg Words Per Sentence */}
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  padding: "8px 14px",
                  background: "rgba(16, 185, 129, 0.1)",
                  borderRadius: "8px",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                }}>
                  <span style={{ fontSize: "14px" }}>📐</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#34d399" }}>
                      {stats.sentences > 0 ? Math.round(stats.words / stats.sentences) : 0}
                    </div>
                    <div style={{ fontSize: "9px", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>
                      Words/Sent
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* Bookmark Button */}
                <button
                  onClick={() => {
                    const bookmarks = JSON.parse(localStorage.getItem('documentBookmarks') || '[]');
                    const docId = document?.id;
                    if (docId) {
                      if (bookmarks.includes(docId)) {
                        const updated = bookmarks.filter((id: number) => id !== docId);
                        localStorage.setItem('documentBookmarks', JSON.stringify(updated));
                        alert('Bookmark removed!');
                      } else {
                        bookmarks.push(docId);
                        localStorage.setItem('documentBookmarks', JSON.stringify(bookmarks));
                        alert('Document bookmarked!');
                      }
                    }
                  }}
                  style={{
                    padding: "8px 12px",
                    background: "rgba(251, 191, 36, 0.1)",
                    border: "1px solid rgba(251, 191, 36, 0.2)",
                    borderRadius: "8px",
                    color: "#fbbf24",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(251, 191, 36, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(251, 191, 36, 0.1)";
                  }}
                >
                  ⭐ Bookmark
                </button>
                
                {/* Share Button */}
                <button
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    alert('Link copied to clipboard!');
                  }}
                  style={{
                    padding: "8px 12px",
                    background: "rgba(139, 92, 246, 0.1)",
                    border: "1px solid rgba(139, 92, 246, 0.2)",
                    borderRadius: "8px",
                    color: "#a78bfa",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(139, 92, 246, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(139, 92, 246, 0.1)";
                  }}
                >
                  🔗 Share
                </button>
                
                {/* Go to Segments */}
                <Link
                  to={`/documents/${document?.id}`}
                  style={{
                    padding: "8px 12px",
                    background: "rgba(236, 72, 153, 0.1)",
                    border: "1px solid rgba(236, 72, 153, 0.2)",
                    borderRadius: "8px",
                    color: "#f472b6",
                    textDecoration: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(236, 72, 153, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(236, 72, 153, 0.1)";
                  }}
                >
                  📑 Segments
                </Link>
              </div>
            </div>
          )}

          {/* Actions */}
          <div
            ref={tourRefs.actions}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: isMobile ? "8px" : "12px",
              marginTop: "24px",
              ...(getTourHighlightStyle(tourRefs.actions) || {}),
            }}
          >
          <Link
            to={`/documents/${document.id}`}
              style={{
                padding: isMobile ? "10px 14px" : "12px 20px",
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                border: "none",
                borderRadius: "10px",
                color: "white",
                fontWeight: 600,
                fontSize: "14px",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(59, 130, 246, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Open Workspace
          </Link>
          <button
            onClick={() => {
              navigator.clipboard.writeText(document.text);
              alert("Document text copied to clipboard!");
            }}
              style={{
                padding: isMobile ? "10px 14px" : "12px 20px",
                background: "hsl(var(--muted) / 0.3)",
                border: "1px solid hsl(var(--border))",
                borderRadius: "10px",
                color: "hsl(var(--foreground))",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Text
          </button>
            <button
              onClick={handlePrint}
              style={{
                padding: "12px 20px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                color: "#eaeaea",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <div style={{ position: "relative" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const menu = window.document.getElementById('export-menu');
                  if (menu) {
                    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
                  }
                }}
                style={{
                  padding: "12px 20px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "#eaeaea",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
              <div
                id="export-menu"
                style={{
                  display: "none",
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "8px",
                  background: "rgba(20, 20, 30, 0.95)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "8px",
                  minWidth: "150px",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                  zIndex: 1000,
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              >
                <button
                  onClick={() => {
                    handleExport('json');
                    const menu = window.document.getElementById('export-menu');
                    if (menu) menu.style.display = 'none';
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    background: "transparent",
                    border: "none",
                    borderRadius: "8px",
                    color: "#eaeaea",
                    fontSize: "14px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Export as JSON
                </button>
                <button
                  onClick={() => {
                    handleExport('txt');
                    const menu = window.document.getElementById('export-menu');
                    if (menu) menu.style.display = 'none';
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    background: "transparent",
                    border: "none",
                    borderRadius: "8px",
                    color: "#eaeaea",
                    fontSize: "14px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Export as TXT
                </button>
                <button
                  onClick={() => {
                    handleExport('md');
                    const menu = window.document.getElementById('export-menu');
                    if (menu) menu.style.display = 'none';
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    background: "transparent",
                    border: "none",
                    borderRadius: "8px",
                    color: "#eaeaea",
                    fontSize: "14px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Export as Markdown
                </button>
              </div>
            </div>
          <Link
            to="/"
              style={{
                padding: "12px 20px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                color: "#eaeaea",
                fontWeight: 600,
                fontSize: "14px",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Link>

          {/* AI Claim Detection */}
          <button
            onClick={handleDetectClaims}
            disabled={isDetectingClaims || !document?.text}
            style={{
              padding: "12px 20px",
              background: isDetectingClaims ? "rgba(139, 92, 246, 0.3)" : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              border: "none",
              borderRadius: "12px",
              color: "white",
              fontWeight: 600,
              fontSize: "14px",
              cursor: isDetectingClaims || !document?.text ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
              opacity: isDetectingClaims || !document?.text ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isDetectingClaims && document?.text) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(139, 92, 246, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.3)";
            }}
          >
            {isDetectingClaims ? (
              <>
                <svg className="animate-spin" fill="none" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }} />
                </svg>
                Analyzing... {claimDetectionProgress}%
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Detect Claims
              </>
            )}
          </button>

          {/* Version History */}
          <button
            onClick={() => setShowVersionPanel(true)}
            style={{
              padding: "12px 20px",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "12px",
              color: "#6ee7b7",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(16, 185, 129, 0.2)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Versions ({versions.length})
          </button>

          {/* Save Version */}
          <button
            onClick={handleCreateVersion}
            disabled={!document?.text || !user?.email}
            style={{
              padding: "12px 20px",
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "12px",
              color: "#60a5fa",
              fontWeight: 600,
              fontSize: "14px",
              cursor: !document?.text || !user?.email ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              opacity: !document?.text || !user?.email ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (document?.text && user?.email) {
                e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Version
          </button>
          </div>
        </div>
      </div>

      {/* Document Content - Full Width */}
      <div
        ref={tourRefs.content}
        style={{
          background: "linear-gradient(135deg, rgba(20, 20, 30, 0.95) 0%, rgba(15, 15, 25, 0.95) 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: readableWidth ? "20px" : "0",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
          margin: readableWidth ? "0 24px 24px 24px" : "0 -32px 24px -32px",
          width: readableWidth ? "auto" : "calc(100% + 64px)",
          ...(getTourHighlightStyle(tourRefs.content) || {}),
        }}
      >
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "linear-gradient(135deg, rgba(30, 30, 40, 0.5) 0%, rgba(20, 20, 30, 0.3) 100%)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#eaeaea", margin: 0 }}>Document Content</h2>
            
            {/* Search Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 300px", minWidth: "300px", maxWidth: "500px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Search in document..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    paddingRight: searchQuery ? "80px" : "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    background: "rgba(0, 0, 0, 0.3)",
                    color: "#eaeaea",
                    fontSize: "14px",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.shiftKey) {
                      handlePrevMatch();
                    } else if (e.key === 'Enter') {
                      handleNextMatch();
                    }
                  }}
                />
                {searchQuery && searchMatches.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      color: "rgba(255, 255, 255, 0.6)",
                    }}
                  >
                    <span>
                      {searchIndex + 1} / {searchMatches.length}
                    </span>
                    <button
                      onClick={handlePrevMatch}
                      style={{
                        padding: "4px 8px",
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "none",
                        borderRadius: "4px",
                        color: "#eaeaea",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                      title="Previous (Shift+Enter)"
                    >
                      ↑
                    </button>
                    <button
                      onClick={handleNextMatch}
                      style={{
                        padding: "4px 8px",
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "none",
                        borderRadius: "4px",
                        color: "#eaeaea",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                      title="Next (Enter)"
                    >
                      ↓
                    </button>
                  </div>
                )}
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    padding: "10px 12px",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#eaeaea",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
        <div style={{ padding: isMobile ? "16px" : "32px" }}>
          <div 
            style={{ 
              minHeight: "500px",
              maxHeight: readableWidth ? "70vh" : "calc(100vh - 200px)", 
              overflowY: "auto",
              maxWidth: readableWidth ? "900px" : "none",
              margin: readableWidth ? "0 auto" : "0",
            }} 
            ref={contentRef}
          >
            <div
              data-search-content
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: "1.9",
                fontSize: isMobile ? "14px" : "15px",
                fontFamily: "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "10px",
                padding: isMobile ? "16px" : "32px 40px",
                color: "hsl(var(--foreground))",
                boxShadow: "0 4px 16px hsl(var(--background) / 0.3) inset",
                letterSpacing: "0.01em",
              }}
            >
              {searchQuery.trim() ? (
                highlightSearch(document.text || "", searchQuery).map((part, idx) => (
                  <span
                    key={idx}
                    style={part.highlighted ? {
                      background: "rgba(99, 102, 241, 0.4)",
                      color: "#c7d2fe",
                      fontWeight: 600,
                      padding: "2px 4px",
                      borderRadius: 4,
                    } : {}}
                  >
                    {part.text}
                  </span>
                ))
              ) : (
                document.text || "No content available"
              )}
        </div>
          </div>
        </div>
      </div>
      </div>

      <TourPanel
        open={tourOpen}
        popoverPos={tourPopoverPos}
        stepIndex={tourStepIndex}
        steps={tourSteps}
        onClose={closeTour}
        onNext={nextTourStep}
        onPrev={prevTourStep}
      />

      {/* Screenshot Mode */}
      <ScreenshotMode
        isActive={screenshotModeActive}
        onToggle={() => setScreenshotModeActive(!screenshotModeActive)}
      />

      {/* Claims Panel */}
      {showClaimsPanel && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "hsl(var(--background) / 0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          backdropFilter: "blur(8px)",
        }}>
          <div style={{
            background: "hsl(var(--card))",
            borderRadius: "20px",
            width: isMobile ? "95vw" : "min(800px, 90vw)",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            boxShadow: "0 24px 80px hsl(var(--background) / 0.5)",
          }}>
            <div style={{
              padding: isMobile ? "16px" : "24px 28px",
              borderBottom: "1px solid hsl(var(--border))",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: isMobile ? "16px" : "20px", fontWeight: 700, color: "hsl(var(--foreground))" }}>
                  🔍 Detected Claims ({detectedClaims.length})
                </h2>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "hsl(var(--muted-foreground))" }}>
                  AI-identified claims from document analysis
                </p>
              </div>
              <button
                onClick={() => setShowClaimsPanel(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "hsl(var(--muted-foreground))",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "24px", overflow: "auto", flex: 1 }}>
              {detectedClaims.length === 0 ? (
                <p style={{ color: "rgba(255, 255, 255, 0.5)", textAlign: "center" }}>
                  No claims detected. Try with a different document.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {detectedClaims.map((claim) => (
                    <div
                      key={claim.id}
                      onClick={() => setSelectedClaimId(claim.id)}
                      style={{
                        padding: "16px",
                        background: selectedClaimId === claim.id 
                          ? "rgba(139, 92, 246, 0.15)" 
                          : "rgba(255, 255, 255, 0.03)",
                        border: `1px solid ${selectedClaimId === claim.id ? "rgba(139, 92, 246, 0.4)" : "rgba(255, 255, 255, 0.08)"}`,
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          background: claim.type === 'factual' ? "rgba(16, 185, 129, 0.2)" :
                                     claim.type === 'hypothesis' ? "rgba(245, 158, 11, 0.2)" :
                                     claim.type === 'methodological' ? "rgba(59, 130, 246, 0.2)" :
                                     "rgba(139, 92, 246, 0.2)",
                          color: claim.type === 'factual' ? "#6ee7b7" :
                                claim.type === 'hypothesis' ? "#fcd34d" :
                                claim.type === 'methodological' ? "#60a5fa" :
                                "#c4b5fd",
                        }}>
                          {claim.type}
                        </span>
                        <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)" }}>
                          {Math.round(claim.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "14px", color: "#eaeaea", lineHeight: 1.5 }}>
                        {claim.text}
                      </p>
                      {claim.suggestedLabel && (
                        <p style={{ margin: "8px 0 0", fontSize: "12px", color: "rgba(255, 255, 255, 0.4)" }}>
                          Suggested: {claim.suggestedLabel}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Version History Panel */}
      {showVersionPanel && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "hsl(var(--background) / 0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          backdropFilter: "blur(8px)",
        }}>
          <div style={{
            background: "hsl(var(--card))",
            borderRadius: "20px",
            width: isMobile ? "95vw" : "min(700px, 90vw)",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            boxShadow: "0 24px 80px hsl(var(--background) / 0.5)",
          }}>
            <div style={{
              padding: isMobile ? "16px" : "24px 28px",
              borderBottom: "1px solid hsl(var(--border))",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: isMobile ? "16px" : "20px", fontWeight: 700, color: "hsl(var(--foreground))" }}>
                  📚 Version History ({versions.length})
                </h2>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "hsl(var(--muted-foreground))" }}>
                  Manage document versions and restore previous states
                </p>
              </div>
              <button
                onClick={() => setShowVersionPanel(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "24px", overflow: "auto", flex: 1 }}>
              {isLoadingVersions ? (
                <p style={{ color: "rgba(255, 255, 255, 0.5)", textAlign: "center" }}>Loading versions...</p>
              ) : versions.length === 0 ? (
                <p style={{ color: "rgba(255, 255, 255, 0.5)", textAlign: "center" }}>
                  No versions saved yet. Click "Save Version" to create your first snapshot.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      style={{
                        padding: "16px",
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          background: version.changeType === 'auto-save' ? "rgba(251, 191, 36, 0.2)" :
                                     version.changeType === 'manual-snapshot' ? "rgba(59, 130, 246, 0.2)" :
                                     "rgba(16, 185, 129, 0.2)",
                          color: version.changeType === 'auto-save' ? "#fcd34d" :
                                version.changeType === 'manual-snapshot' ? "#60a5fa" :
                                "#6ee7b7",
                        }}>
                          {version.changeType.replace('-', ' ')}
                        </span>
                        <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)" }}>
                          {new Date(version.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ margin: "0 0 8px", fontSize: "14px", color: "#eaeaea" }}>
                        {version.message}
                      </p>
                      <p style={{ margin: 0, fontSize: "12px", color: "rgba(255, 255, 255, 0.4)" }}>
                        {version.wordCount.toLocaleString()} words • by {version.author}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Selector */}
      {showTemplateSelector && (
        <PaperTemplateSelector
          onSelectTemplate={(template) => {
            console.log('Selected template:', template.name);
            setShowTemplateSelector(false);
            alert(`Template "${template.name}" selected! Use it in the workspace.`);
          }}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
    </ErrorBoundary>
  );
}

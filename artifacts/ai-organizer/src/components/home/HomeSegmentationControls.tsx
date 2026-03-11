// src/components/home/HomeSegmentationControls.tsx
// Segmentation mode selector, keyword/concept inputs, and segment/list buttons
// All colors use semantic HSL tokens for full theme compatibility
import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { Search } from "lucide-react";

export interface HomeSegmentationControlsProps {
  mode: string;
  setMode: (m: any) => void;
  documentId: number | null;
  canSegment: boolean;
  isSegmenting: boolean;
  selectedUpload: { parseStatus?: string } | null;
  keywordInput: string;
  setKeywordInput: (v: string) => void;
  keywords: string[];
  setKeywords: (v: string[]) => void;
  conceptInput: string;
  setConceptInput: (v: string) => void;
  concepts: string[];
  setConcepts: (v: string[]) => void;
  onSegment: () => void;
  onListSegments: () => void;
  setStatus: (s: string) => void;
}

export const HomeSegmentationControls: React.FC<HomeSegmentationControlsProps> = ({
  mode,
  setMode,
  documentId,
  canSegment,
  isSegmenting,
  selectedUpload,
  keywordInput,
  setKeywordInput,
  keywords,
  setKeywords,
  conceptInput,
  setConceptInput,
  concepts,
  setConcepts,
  onSegment,
  onListSegments,
  setStatus,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const isSmallScreen = isMobile || isTablet;

  const primaryButtonCanClick = Boolean(documentId && canSegment && !isSegmenting);
  const listButtonCanClick = Boolean(documentId && canSegment);
  const panelPadding = isMobile ? "12px" : isTablet ? "16px" : "28px";
  const fieldMinWidth = isMobile ? "0" : "300px";

  return (
    <div
      style={{
        background: "hsl(var(--card))",
        backdropFilter: "blur(28px)",
        border: "1px solid hsl(var(--border))",
        borderRadius: "calc(var(--radius) + 10px)",
        padding: panelPadding,
        boxShadow: isDark
          ? "0 20px 60px hsl(var(--background) / 0.55)"
          : "0 12px 40px hsl(var(--foreground) / 0.06)",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          flexDirection: isMobile ? "column" : "row",
          marginBottom: isMobile ? "10px" : "18px",
        }}
      >
        <div>
          <div style={{ fontSize: isMobile ? "12px" : "15px", fontWeight: 600, color: "hsl(var(--foreground))", letterSpacing: "-0.01em" }}>
            {t("home.segmentation.panelTitle") || "Segmentation controls"}
          </div>
          <p style={{ fontSize: isMobile ? "10px" : "12.5px", color: "hsl(var(--muted-foreground))", margin: isMobile ? "2px 0 0" : "6px 0 0", lineHeight: 1.5 }}>
            {t("home.segmentation.panelSubtitle") || "Tune extraction keywords, AI concepts, and segmentation mode"}
          </p>
        </div>
        <span
          style={{
            alignSelf: "flex-start",
            padding: isMobile ? "3px 8px" : "6px 12px",
            borderRadius: "999px",
            background: "hsl(var(--primary) / 0.1)",
            border: "1px solid hsl(var(--primary) / 0.25)",
            fontSize: isMobile ? "9px" : "11px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "hsl(var(--primary))",
          }}
        >
          {t("home.segmentation.spotlight") || "Adaptive AI segmentation"}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: isSmallScreen ? "stretch" : "center",
          flexDirection: isSmallScreen ? "column" : "row",
        }}
      >
        <div style={{ display: "flex", alignItems: isSmallScreen ? "stretch" : "center", gap: "8px", flexDirection: isSmallScreen ? "column" : "row", width: isSmallScreen ? "100%" : "auto" }}>
          <label style={{ fontSize: isMobile ? "11px" : "15px", fontWeight: 600, color: "hsl(var(--foreground))" }}>
            {t("home.segmentation.modeLabel") || "Segmentation mode"}
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={{
              padding: isMobile ? "7px 10px" : "10px 16px",
              borderRadius: "var(--radius)",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
              fontSize: isMobile ? "11px" : "13px",
              lineHeight: 1.2,
              cursor: "pointer",
              transition: "all 0.2s ease",
              width: isSmallScreen ? "100%" : "auto",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)";
              e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "hsl(var(--border))";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <option value="qa">{t("segmentation.mode.qa") || "Q&A"}</option>
            <option value="paragraphs">{t("segmentation.mode.paragraphs") || "Paragraphs"}</option>
            <option value="keywords">{t("segmentation.mode.keywords") || "Keywords"}</option>
            <option value="sections">{t("segmentation.mode.sections") || "Sections"}</option>
            <option value="semantic">{t("segmentation.mode.semantic") || "Semantic"}</option>
            <option value="topics">{t("segmentation.mode.topics") || "Topics"}</option>
            <option value="questions">{t("segmentation.mode.questions") || "Questions"}</option>
            <option value="arguments">{t("segmentation.mode.arguments") || "Arguments"}</option>
            <option value="concepts">{t("segmentation.mode.concepts") || "Concepts"}</option>
            <option value="hybrid">{t("segmentation.mode.hybrid") || "Hybrid"}</option>
            <option value="temporal">{t("segmentation.mode.temporal") || "Temporal"}</option>
            <option value="sentiment">{t("segmentation.mode.sentiment") || "Sentiment"}</option>
            <option value="dialogue">{t("segmentation.mode.dialogue") || "Dialogue"}</option>
            <option value="texttiling">{t("segmentation.mode.texttiling") || "TextTiling"}</option>
            <option value="c99">{t("segmentation.mode.c99") || "C99"}</option>
            <option value="changepoint">{t("segmentation.mode.changepoint") || "Change-Point"}</option>
            <option value="graph">{t("segmentation.mode.graph") || "Graph"}</option>
            <option value="layout">{t("segmentation.mode.layout") || "Layout"}</option>
          </select>
        </div>

        {/* Keyword input for keywords mode */}
        {mode === "keywords" && (
          <div style={{ flex: "1 1 100%", minWidth: fieldMinWidth, width: "100%" }}>
            <label style={{ display: "block", fontSize: "15px", fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: "6px" }}>
              {t("home.segmentation.input.keywords") || t("segmentation.keywords") || "Keywords"}
              <span style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>
                {t("segmentation.commaSeparated") || "comma-separated or one per line"}
              </span>
            </label>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", flexDirection: isSmallScreen ? "column" : "row" }}>
              <textarea
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder={t("home.segmentation.keywords.placeholder") || "Enter keywords, e.g., machine learning, neural networks, AI"}
                style={{
                  flex: 1,
                  width: "100%",
                  minHeight: "60px",
                  padding: "10px 14px",
                  background: "hsl(var(--muted) / 0.3)",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--foreground))",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--border))";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <button
                onClick={() => {
                  const input = keywordInput.trim();
                  if (!input) return;
                  const newKeywords = input.split(/[,\n]/).map(k => k.trim()).filter(k => k.length > 0);
                  setKeywords([...keywords, ...newKeywords]);
                  setKeywordInput("");
                }}
                style={{
                  padding: "10px 16px",
                  background: "hsl(var(--primary) / 0.12)",
                  border: "1px solid hsl(var(--primary) / 0.25)",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--primary))",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  width: isSmallScreen ? "100%" : "auto",
                }}
              >
                {t("action.add") || "Add"}
              </button>
              <button
                onClick={async () => {
                  if (!documentId) { setStatus("Please select a document first"); return; }
                  try {
                    setStatus("Discovering keywords with AI...");
                    const { discoverKeywords } = await import("../../lib/api");
                    const result = await discoverKeywords(documentId, 10);
                    setKeywords([...keywords, ...result.keywords]);
                    setStatus(`Discovered ${result.keywords.length} keywords using ${result.provider}`);
                  } catch (e: any) {
                    setStatus(e?.message || "Keyword discovery failed");
                  }
                }}
                disabled={!documentId || isSegmenting}
                style={{
                  padding: "10px 16px",
                  background: "hsl(var(--info) / 0.12)",
                  border: "1px solid hsl(var(--info) / 0.25)",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--info))",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: (!documentId || isSegmenting) ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  width: isSmallScreen ? "100%" : "auto",
                  opacity: (!documentId || isSegmenting) ? 0.6 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                title={!documentId ? "Please select a document first" : "Use AI to discover keywords from the document"}
              >
                <Search style={{ width: 13, height: 13 }} /> Discover with AI
              </button>
            </div>
            {keywords.length > 0 && (
              <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: "4px 10px",
                      background: "hsl(var(--primary) / 0.12)",
                      border: "1px solid hsl(var(--primary) / 0.2)",
                      borderRadius: "16px",
                      color: "hsl(var(--primary))",
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {kw}
                    <button
                      onClick={() => setKeywords(keywords.filter((_, i) => i !== idx))}
                      style={{ background: "transparent", border: "none", color: "hsl(var(--primary))", cursor: "pointer", padding: 0, fontSize: "14px", lineHeight: 1 }}
                    >×</button>
                  </span>
                ))}
                <button
                  onClick={() => setKeywords([])}
                  style={{
                    padding: "4px 10px",
                    background: "hsl(var(--destructive) / 0.12)",
                    border: "1px solid hsl(var(--destructive) / 0.2)",
                    borderRadius: "16px",
                    color: "hsl(var(--destructive))",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t("action.clearAll") || "Clear all"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Concept input for concepts mode */}
        {mode === "concepts" && (
          <div style={{ flex: "1 1 100%", minWidth: fieldMinWidth, width: "100%" }}>
            <label style={{ display: "block", fontSize: "15px", fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: "6px" }}>
              {t("home.segmentation.input.concepts") || t("segmentation.concepts") || "Concepts"}
              <span style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>
                {t("segmentation.commaSeparated") || "comma-separated or one per line"}
              </span>
            </label>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", flexDirection: isSmallScreen ? "column" : "row" }}>
              <textarea
                value={conceptInput}
                onChange={(e) => setConceptInput(e.target.value)}
                placeholder={t("home.segmentation.concepts.placeholder") || "Enter concepts, e.g., cognitive bias, Bayesian inference, neural networks"}
                style={{
                  flex: 1,
                  width: "100%",
                  minHeight: "60px",
                  padding: "10px 14px",
                  background: "hsl(var(--muted) / 0.3)",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--foreground))",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--success) / 0.5)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--success) / 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--border))";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <button
                onClick={() => {
                  const input = conceptInput.trim();
                  if (!input) return;
                  const newConcepts = input.split(/[,\n]/).map(c => c.trim()).filter(c => c.length > 0);
                  setConcepts([...concepts, ...newConcepts]);
                  setConceptInput("");
                }}
                style={{
                  padding: "10px 16px",
                  background: "hsl(var(--success) / 0.12)",
                  border: "1px solid hsl(var(--success) / 0.25)",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--success))",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  width: isSmallScreen ? "100%" : "auto",
                }}
              >
                {t("action.add") || "Add"}
              </button>
              <button
                onClick={async () => {
                  if (!documentId) { setStatus("Please select a document first"); return; }
                  try {
                    setStatus("Discovering concepts with AI...");
                    const { discoverConcepts } = await import("../../lib/api");
                    const result = await discoverConcepts(documentId, 10);
                    setConcepts([...concepts, ...result.concepts]);
                    setStatus(`Discovered ${result.concepts.length} concepts using ${result.provider}`);
                  } catch (e: any) {
                    setStatus(e?.message || "Concept discovery failed");
                  }
                }}
                disabled={!documentId || isSegmenting}
                style={{
                  padding: "10px 16px",
                  background: "hsl(var(--info) / 0.12)",
                  border: "1px solid hsl(var(--info) / 0.25)",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--info))",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: (!documentId || isSegmenting) ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  width: isSmallScreen ? "100%" : "auto",
                  opacity: (!documentId || isSegmenting) ? 0.6 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                title={!documentId ? "Please select a document first" : "Use AI to discover concepts from the document"}
              >
                <Search style={{ width: 13, height: 13 }} /> Discover with AI
              </button>
            </div>
            {concepts.length > 0 && (
              <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {concepts.map((c, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: "4px 10px",
                      background: "hsl(var(--success) / 0.12)",
                      border: "1px solid hsl(var(--success) / 0.2)",
                      borderRadius: "16px",
                      color: "hsl(var(--success))",
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {c}
                    <button
                      onClick={() => setConcepts(concepts.filter((_, i) => i !== idx))}
                      style={{ background: "transparent", border: "none", color: "hsl(var(--success))", cursor: "pointer", padding: 0, fontSize: "14px", lineHeight: 1 }}
                    >×</button>
                  </span>
                ))}
                <button
                  onClick={() => setConcepts([])}
                  style={{
                    padding: "4px 10px",
                    background: "hsl(var(--destructive) / 0.12)",
                    border: "1px solid hsl(var(--destructive) / 0.2)",
                    borderRadius: "16px",
                    color: "hsl(var(--destructive))",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  {t("action.clearAll") || "Clear all"}
                </button>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onSegment}
          disabled={!documentId || !canSegment || isSegmenting}
          style={{
            padding: "14px 22px",
            background: primaryButtonCanClick ? "hsl(var(--primary))" : "hsl(var(--muted) / 0.5)",
            border: "none",
            borderRadius: "var(--radius)",
            color: primaryButtonCanClick ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
            fontWeight: 600,
            fontSize: "13px",
            lineHeight: 1.2,
            cursor: (!documentId || !canSegment || isSegmenting) ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: isSmallScreen ? "100%" : "auto",
            transition: "all 0.2s ease",
            boxShadow: primaryButtonCanClick
              ? (isDark ? "0 6px 20px hsl(var(--background) / 0.35)" : "0 4px 12px hsl(var(--primary) / 0.18)")
              : "none",
            opacity: (!documentId || !canSegment || isSegmenting) ? 0.6 : 1,
            position: "relative",
            overflow: "hidden",
          }}
          title={
            !documentId
              ? (t("home.segmentation.tooltip.selectDocumentFromDropdown") || "Please select a document from the dropdown first.")
              : !canSegment
                ? (t("home.segmentation.tooltip.cannotSegment", {
                    parseStatus: selectedUpload?.parseStatus || "unknown",
                    pendingHint: selectedUpload?.parseStatus === "pending" ? (t("home.segmentation.tooltip.waitParsing") || "Please wait for parsing to complete.") : ""
                  }) || "Document cannot be segmented yet")
                : (t("home.segmentation.tooltip.segmentDocument") || "Click to segment the document")
          }
          onMouseEnter={(e) => {
            if (primaryButtonCanClick) {
              e.currentTarget.style.transform = "translateY(-2px)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {isSegmenting ? (
            <>
              <div style={{ width: "16px", height: "16px", border: "2px solid hsl(var(--primary-foreground) / 0.3)", borderTopColor: "hsl(var(--primary-foreground))", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <span>Segmenting...</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t("home.segmentation.primary") || "Run segmentation"}
            </>
          )}
        </button>

        <button
          onClick={onListSegments}
          disabled={!documentId || !canSegment}
          style={{
            padding: "14px 22px",
            background: listButtonCanClick ? "hsl(var(--accent))" : "hsl(var(--muted) / 0.5)",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            color: listButtonCanClick ? "hsl(var(--accent-foreground))" : "hsl(var(--muted-foreground))",
            fontWeight: 600,
            fontSize: "13px",
            lineHeight: 1.2,
            cursor: !documentId || !canSegment ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: isSmallScreen ? "100%" : "auto",
            transition: "all 0.2s ease",
            opacity: !documentId || !canSegment ? 0.6 : 1,
          }}
          title={
            !documentId
              ? (t("home.segmentation.tooltip.selectDocumentFromDropdown") || "Please select a document from the dropdown first.")
              : !canSegment
                ? (t("home.segmentation.tooltip.cannotListSegments", {
                    parseStatus: selectedUpload?.parseStatus || "unknown",
                    pendingHint: selectedUpload?.parseStatus === "pending" ? (t("home.segmentation.tooltip.waitParsing") || "Please wait for parsing to complete.") : ""
                  }) || "Document cannot be listed yet")
                : (t("home.segmentation.tooltip.listSegments") || "Click to list segments")
          }
          onMouseEnter={(e) => {
            if (listButtonCanClick) e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          {t("home.segmentation.secondary") || "List existing segments"}
        </button>
      </div>
    </div>
  );
};

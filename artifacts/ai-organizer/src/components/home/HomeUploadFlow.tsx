// src/components/home/HomeUploadFlow.tsx
// Extracted upload flow section from Home.tsx — all colors use semantic HSL tokens
import React, { useMemo, useState } from "react";
import { formatBytes } from "../../lib/utils";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { SectionHeader } from "../ui/SectionHeader";
import { Upload, FolderOpen, AlertCircle, Info } from "lucide-react";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface HomeUploadFlowProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  file: File | null;
  setFile: (f: File | null) => void;
  fileError: string | null;
  setFileError: (e: string | null) => void;
  validateFile: (file: File, opts: { maxSizeMB: number; allowedTypes: string[] }) => string | null;
  uploading: boolean;
  progress: UploadProgress | null;
  uploadError: string | null;
  doUpload: () => void;
  localDuplicateHint: { documentId: number } | null;
}

const AUTO_DEDUPE_KEY = "home-auto-dedupe";

export const HomeUploadFlow: React.FC<HomeUploadFlowProps> = ({
  fileInputRef,
  file,
  setFile,
  fileError,
  setFileError,
  validateFile,
  uploading,
  progress,
  uploadError,
  doUpload,
  localDuplicateHint,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const isSmallScreen = isMobile || isTablet;
  const panelPadding = isMobile ? "16px" : isTablet ? "20px" : "28px";
  const [autoDedupeEnabled, setAutoDedupeEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = localStorage.getItem(AUTO_DEDUPE_KEY);
      if (stored === null) return true;
      return stored === "true";
    } catch {
      return true;
    }
  });

  const stepItems = useMemo(() => ([
    { key: "upload", label: t("upload.step.upload") || "Upload", status: "active" },
    { key: "segment", label: t("upload.step.segment") || "Segment", status: file ? "ready" : "upcoming" },
    { key: "share", label: t("upload.step.share") || "Share", status: canShowShareState() ? "ready" : "upcoming" },
  ]), [t, file]);

  function canShowShareState() {
    return !!file && !uploading && !fileError;
  }

  const toggleAutoDedupe = () => {
    setAutoDedupeEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(AUTO_DEDUPE_KEY, String(next));
      } catch {/* ignore */}
      return next;
    });
  };

  return (
    <>
      <div style={{ margin: "40px 0", height: "1px", background: `linear-gradient(90deg, transparent 0%, hsl(var(--border)) 50%, transparent 100%)` }}></div>

      <div
        data-testid="upload-flow"
        data-tour="upload-flow"
        style={{ marginBottom: "32px" }}
      >
        <SectionHeader
          icon={<Upload style={{ width: "20px", height: "20px", color: "hsl(var(--success))" }} />}
          iconGradient="linear-gradient(135deg, hsl(var(--success) / 0.2) 0%, hsl(var(--success) / 0.1) 100%)"
          title={t("upload.title")}
          subtitle={t("upload.description") || "Upload Word documents (.docx, .doc) to process and segment. Files are automatically parsed and can be segmented into chunks."}
          size="lg"
          style={{ marginBottom: "20px" }}
        />

        <div
          style={{
            background: "hsl(var(--card))",
            backdropFilter: "blur(24px)",
            border: "1px solid hsl(var(--border))",
            borderRadius: "calc(var(--radius) + 10px)",
            padding: panelPadding,
            boxShadow: isDark
              ? "0 25px 70px hsl(var(--background) / 0.55)"
              : "0 12px 40px hsl(var(--foreground) / 0.06)",
            marginBottom: "16px",
          }}
        >
          {/* Stepper — subtle inline breadcrumb indicators */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0",
            marginBottom: isMobile ? "12px" : "16px",
          }}>
            {stepItems.map((step, index) => {
              const isActive = step.status === "active";
              const isReady = step.status === "ready";
              const dotColor = isActive
                ? "hsl(var(--success))"
                : isReady ? "hsl(var(--primary))"
                : "hsl(var(--muted-foreground) / 0.4)";
              const textColor = isActive
                ? "hsl(var(--success))"
                : isReady ? "hsl(var(--primary))"
                : "hsl(var(--muted-foreground))";
              return (
                <React.Fragment key={step.key}>
                  {index > 0 && (
                    <span style={{
                      fontSize: "10px",
                      color: "hsl(var(--muted-foreground) / 0.35)",
                      margin: "0 6px",
                      userSelect: "none",
                    }}>›</span>
                  )}
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: isMobile ? "10px" : "11px",
                    fontWeight: isActive ? 600 : 500,
                    color: textColor,
                    whiteSpace: "nowrap",
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: dotColor,
                      flexShrink: 0,
                    }} />
                    {step.label}
                  </span>
                </React.Fragment>
              );
            })}
          </div>

          {!isMobile && (
            <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginBottom: "16px", lineHeight: 1.5 }}>
              {t("upload.step.caption") || "One streamlined flow to transform every document."}
            </p>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? "12px" : "20px", alignItems: "flex-start", flexDirection: isSmallScreen ? "column" : "row" }}>
            <div style={{ flex: "1 1 auto", minWidth: 0, width: "100%" }}>
              <label style={{ display: "block", fontSize: isMobile ? "11px" : "13px", fontWeight: 600, color: "hsl(var(--muted-foreground))", marginBottom: "6px" }}>
                {t("action.upload")}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.doc"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] ?? null;
                  setFile(selectedFile);
                  setFileError(null);
                  if (selectedFile) {
                    const error = validateFile(selectedFile, {
                      maxSizeMB: 50,
                      allowedTypes: ['.docx', '.doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
                    });
                    if (error) setFileError(error);
                  }
                }}
                style={{
                  width: "100%",
                  padding: isMobile ? "7px 10px" : "9px 12px",
                  borderRadius: "var(--radius)",
                  border: `1px solid ${fileError ? "hsl(var(--destructive) / 0.5)" : "hsl(var(--border))"}`,
                  background: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                  fontSize: isMobile ? "12px" : "0.90em",
                  lineHeight: 1.4,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = fileError ? "hsl(var(--destructive))" : "hsl(var(--primary) / 0.5)";
                  e.currentTarget.style.boxShadow = fileError ? "0 0 0 3px hsl(var(--destructive) / 0.1)" : "0 0 0 3px hsl(var(--primary) / 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = fileError ? "hsl(var(--destructive) / 0.5)" : "hsl(var(--border))";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {fileError && (
                <p style={{ fontSize: 12, color: "hsl(var(--destructive))", marginTop: 8, marginBottom: 0 }}>{fileError}</p>
              )}
              {file && !fileError && (
                <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 8, marginBottom: 0 }}>
                  {t("upload.fileSelected") || "Selected"}: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <div style={{ flex: "0 1 auto", minWidth: 0, width: "100%", display: "flex", flexDirection: "column", gap: isMobile ? "6px" : "7.6px", fontSize: "0.95em" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? "8px" : "12px", flexDirection: isMobile ? "column" : "row" }}>
                <button
                  onClick={doUpload}
                  disabled={!file || uploading}
                  style={{
                    flex: isMobile ? "1 1 auto" : "1 1 160px",
                    padding: isMobile ? "6px 14px" : "3.7px 22px",
                    borderRadius: "var(--radius)",
                    border: "none",
                    color: "hsl(var(--primary-foreground))",
                    fontSize: "13px",
                    fontWeight: 600,
                    lineHeight: 1.2,
                    cursor: !file || uploading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    background: "hsl(var(--primary))",
                    boxShadow: isDark ? "0 12px 30px hsl(var(--background) / 0.45)" : "0 8px 20px hsl(var(--primary) / 0.2)",
                    opacity: !file || uploading ? 0.6 : 1,
                    transition: "transform 0.2s ease",
                  }}
                  title={
                    !file
                      ? (t("home.uploadFlow.tooltip.selectFileFirst") || "Select a file first to upload")
                      : uploading
                      ? (t("home.uploadFlow.tooltip.uploading", { name: file.name }) || `Uploading ${file.name}...`)
                      : (t("home.uploadFlow.tooltip.uploadFile", { name: file.name }) || `Upload ${file.name} to the platform`)
                  }
                  onMouseEnter={(e) => { if (file && !uploading) e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <Upload style={{ width: 15, height: 15 }} />
                  {uploading ? (t("status.uploading") || "Uploading...") : (t("upload.primaryCta") || "Upload & analyze")}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    flex: isMobile ? "1 1 auto" : "0 1 140px",
                    padding: isMobile ? "6px 14px" : "3.7px 18px",
                    borderRadius: "var(--radius)",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    color: "hsl(var(--foreground))",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <FolderOpen style={{ width: 14, height: 14, display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                  {t("upload.secondaryCta") || "Browse files"}
                </button>
              </div>

              <button
                type="button"
                onClick={toggleAutoDedupe}
                aria-pressed={autoDedupeEnabled}
                title={autoDedupeEnabled
                  ? (t("upload.autoDedupeOn") || "Απομάκρυνση διπλοτύπων ενεργή")
                  : (t("upload.autoDedupeOff") || "Απομάκρυνση διπλοτύπων ανενεργή")}
                style={{
                  borderRadius: "var(--radius)",
                  border: `1px solid ${autoDedupeEnabled ? "hsl(var(--success) / 0.4)" : "hsl(var(--border))"}`,
                  background: autoDedupeEnabled ? "hsl(var(--success) / 0.08)" : "hsl(var(--muted) / 0.3)",
                  color: "hsl(var(--foreground))",
                  padding: isMobile ? "6px 10px" : "6px 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: isMobile ? "11px" : "12px",
                  fontWeight: 500,
                }}
              >
                <span style={{
                  width: 28, height: 14, borderRadius: 999,
                  background: autoDedupeEnabled ? "hsl(var(--success))" : "hsl(var(--muted))",
                  position: "relative", transition: "all 0.2s ease", flexShrink: 0,
                }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: "hsl(var(--card))",
                    position: "absolute", top: 2,
                    left: autoDedupeEnabled ? 16 : 2,
                    transition: "all 0.2s ease",
                    boxShadow: "0 1px 2px hsl(var(--foreground) / 0.15)",
                  }} />
                </span>
                {t("upload.autoDedupe") || "Διπλότυπα"}
              </button>
            </div>
          </div>
          
          {/* Upload Progress Bar */}
          {uploading && progress && (
            <div
              style={{
                marginTop: "16px",
                padding: "16px",
                background: "hsl(var(--muted) / 0.3)",
                backdropFilter: "blur(20px)",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            >
              {file?.name && (
                <div style={{ fontSize: "var(--font-size-sm)", color: "hsl(var(--muted-foreground))", marginBottom: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file.name}
                </div>
              )}
              <div style={{ width: "100%", height: "8px", background: "hsl(var(--muted))", borderRadius: "4px", overflow: "hidden", marginBottom: "8px" }}>
                <div style={{ width: `${progress.percentage}%`, height: "100%", background: "hsl(var(--primary))", transition: "width 0.3s ease", borderRadius: "4px" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-size-xs)", color: "hsl(var(--muted-foreground))" }}>
                <span>{formatBytes(progress.loaded)}</span>
                <span>{formatBytes(progress.total)}</span>
                <span>{progress.percentage}%</span>
              </div>
            </div>
          )}
          
          {/* Upload Error */}
          {uploadError && (
            <div
              role="alert"
              style={{
                marginTop: "12px",
                padding: "12px 16px",
                background: "hsl(var(--destructive) / 0.1)",
                border: "1px solid hsl(var(--destructive) / 0.25)",
                borderRadius: "var(--radius)",
                color: "hsl(var(--destructive))",
                fontSize: "var(--font-size-sm)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {localDuplicateHint && (
          <div
            role="alert"
            style={{
              marginTop: "16px",
              padding: "16px",
              background: "hsl(var(--warning) / 0.1)",
              border: "1px solid hsl(var(--warning) / 0.3)",
              borderRadius: "var(--radius)",
              color: "hsl(var(--warning))",
              fontSize: "13px",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <Info style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600 }}>{t("upload.duplicateTitle") || "Possible duplicate detected"}</div>
              <div>{(t("upload.duplicateDesc", { id: localDuplicateHint.documentId }) || "This file matches another document.")}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

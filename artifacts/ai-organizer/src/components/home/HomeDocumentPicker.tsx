// src/components/home/HomeDocumentPicker.tsx
// Document picker section — all colors use semantic HSL tokens
import React from "react";
import { useIsMobile } from "../../hooks/use-mobile";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { badge } from "../../lib/documentWorkspace/utils";
import { DocumentStatusBadge } from "../DocumentStatusBadge";
import { DocumentStatus } from "../../hooks/useDocumentStatus";
import { StarButton } from "../StarButton";
import SegmentationSummaryBar from "../SegmentationSummaryBar";
import { GradientActionButton } from "../ui/GradientActionButton";
import { SectionHeader } from "../ui/SectionHeader";
import { ClipboardList, Eye, FileEdit, RefreshCw, Trash2, CheckCircle } from "lucide-react";

export interface HomeDocumentPickerProps {
  uploads: any[];
  documentId: number | null;
  setDocumentId: (id: number | null) => void;
  setSegments: (s: any[]) => void;
  setOpenSeg: (s: any) => void;
  setQuery: (q: string) => void;
  setModeFilter: (m: any) => void;
  selectedUpload: any;
  uploadsLoading: boolean;
  deleteLoading: boolean;
  fetchUploads: () => void;
  deleteSelectedUpload: () => void;
  loadSegmentationSummary: (docId: number) => void;
  segSummaryByMode: Record<string, any>;
  canSegment: boolean;
  getDocStatus: (docId: number) => DocumentStatus;
  cycleDocStatus: (docId: number) => void;
  onImportChats: () => void;
  onBrowseConversations: () => void;
  onNavigate: (path: string) => void;
}

export const HomeDocumentPicker: React.FC<HomeDocumentPickerProps> = ({
  uploads,
  documentId,
  setDocumentId,
  setSegments,
  setOpenSeg,
  setQuery,
  setModeFilter,
  selectedUpload,
  uploadsLoading,
  deleteLoading,
  fetchUploads,
  deleteSelectedUpload,
  loadSegmentationSummary,
  segSummaryByMode,
  canSegment,
  getDocStatus,
  cycleDocStatus,
  onImportChats: _onImportChats,
  onBrowseConversations: _onBrowseConversations,
  onNavigate,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  return (
    <>
      {/* Enhanced Document Picker Section */}
      <div
        data-testid="document-picker"
        data-tour="document-picker"
        className="card-panel"
        style={{
          padding: isMobile ? "10px" : "16px",
          animation: "fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both",
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "calc(var(--radius) + 8px)",
          boxShadow: isDark ? undefined : "0 1px 3px hsl(var(--foreground) / 0.04), 0 4px 12px hsl(var(--primary) / 0.04)",
        }}
      >
        <SectionHeader
          icon={<ClipboardList style={{ width: "20px", height: "20px", color: "hsl(var(--primary))" }} />}
          title={t("doc.management")}
          subtitle={t("doc.managementDesc")}
          size="md"
          style={{ marginBottom: "16px" }}
        />

        <div
          style={{
            background: "hsl(var(--muted) / 0.2)",
            backdropFilter: "blur(8px)",
            border: "1px solid hsl(var(--border) / 0.7)",
            borderRadius: "var(--radius)",
            padding: isMobile ? "10px" : "14px",
            boxShadow: isDark ? undefined : "0 1px 3px hsl(var(--foreground) / 0.04)",
          }}
        >
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {uploads.length === 0 ? (
              <div style={{
                flex: "1 1 200px",
                padding: "10px 14px",
                borderRadius: "var(--radius)",
                border: "1px dashed hsl(var(--border))",
                background: "hsl(var(--muted) / 0.3)",
                color: "hsl(var(--muted-foreground))",
                fontSize: "13px",
                textAlign: "center",
              }}>
                {t("doc.noDocuments") || "Δεν υπάρχουν έγγραφα ακόμη. Ανεβάστε ένα αρχείο για να ξεκινήσετε."}
              </div>
            ) : (
              <select
                value={documentId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setDocumentId(v ? Number(v) : null);
                  setSegments([]);
                  setOpenSeg(null);
                  setQuery("");
                  setModeFilter("all");
                }}
                style={{
                  flex: "1 1 200px",
                  minWidth: 0,
                  padding: "14px 18px",
                  borderRadius: "var(--radius)",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                  fontSize: "var(--font-size-base)",
                  lineHeight: "var(--line-height-normal)",
                  fontWeight: 400,
                  boxShadow: isDark ? "0 1px 2px hsl(var(--background) / 0.3)" : "0 1px 3px hsl(var(--foreground) / 0.04)",
                  outline: "none",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  cursor: "pointer",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--border))";
                  e.currentTarget.style.boxShadow = isDark ? "0 1px 2px hsl(var(--background) / 0.3)" : "0 1px 3px hsl(var(--foreground) / 0.04)";
                }}
                aria-label={t("doc.selectDocument")}
              >
                <option value="">{uploads.length} {t('upload.documentsAvailable') || 'documents available — select one'}</option>
                {uploads.map((u) => (
                  <option key={u.documentId} value={u.documentId}>
                    {u.filename} • {badge(u.parseStatus)} (docId={u.documentId})
                  </option>
                ))}
              </select>
            )}

            <GradientActionButton
              onClick={fetchUploads}
              disabled={uploadsLoading}
              gradient="primary"
              size="sm"
              title={uploadsLoading ? t('home.refreshingDocs') : t('home.refreshDocsTitle')}
              icon={<RefreshCw style={{ width: 16, height: 16 }} />}
              iconOnly={isMobile}
            >
              {uploadsLoading ? t("btn.refreshing") : t("btn.refreshList")}
            </GradientActionButton>

            <GradientActionButton
              onClick={deleteSelectedUpload}
              disabled={!selectedUpload || deleteLoading}
              gradient="danger"
              size="sm"
              title={
                !selectedUpload
                  ? t('home.selectDocToDelete')
                  : deleteLoading
                  ? t('home.deletingDoc')
                  : `${t('home.deleteDocPermanently')} "${selectedUpload.filename}"`
              }
              icon={<Trash2 style={{ width: 16, height: 16 }} />}
              iconOnly={isMobile}
            >
              {deleteLoading ? t("btn.deleting") : t("btn.deleteSelected")}
            </GradientActionButton>
          </div>
        </div>
      </div>

      {/* Parse details */}
      {selectedUpload && (
        <div
          style={{
            marginTop: "16px",
            padding: "16px",
            borderRadius: "calc(var(--radius) + 6px)",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
            backdropFilter: "blur(20px)",
            boxShadow: isDark
              ? "0 4px 24px hsl(var(--background) / 0.3)"
              : "0 1px 3px hsl(var(--foreground) / 0.04), 0 4px 12px hsl(var(--primary) / 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                background: "hsl(var(--primary) / 0.12)",
                borderRadius: "var(--radius)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid hsl(var(--primary) / 0.2)",
              }}
            >
              <CheckCircle style={{ width: 16, height: 16, color: "hsl(var(--primary))" }} />
            </div>
            <h3 style={{ fontSize: "var(--font-size-lg)", lineHeight: "var(--line-height-snug)", letterSpacing: "var(--letter-spacing-tight)", fontWeight: 600, color: "hsl(var(--foreground))", margin: 0 }}>{t("doc.details")}</h3>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 300px" }}>
              <div style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <span>
                  <span style={{ fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>{t("doc.parseStatus")}:</span>{" "}
                  <span style={{ color: "hsl(var(--foreground))" }}>{badge(selectedUpload.parseStatus)}</span>
                </span>
                <StarButton
                  documentId={selectedUpload.documentId}
                  title={selectedUpload.filename || `Document ${selectedUpload.documentId}`}
                  size="md"
                />
                <DocumentStatusBadge
                  status={getDocStatus(selectedUpload.documentId)}
                  onCycle={() => cycleDocStatus(selectedUpload.documentId)}
                  size="md"
                />
              </div>
              {selectedUpload.parseStatus === "failed" && selectedUpload.parseError ? (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    background: "hsl(var(--destructive) / 0.1)",
                    border: "1px solid hsl(var(--destructive) / 0.2)",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--destructive))",
                    whiteSpace: "pre-wrap",
                    fontSize: "var(--font-size-sm)",
                    lineHeight: "var(--line-height-normal)",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{t('error.parseError')}:</span> {selectedUpload.parseError}
                </div>
              ) : null}
            </div>

            <div style={{ opacity: 0.8, fontSize: "var(--font-size-base)", lineHeight: "var(--line-height-normal)" }}>
              <div style={{ marginBottom: "6px" }}>
                <span style={{ fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>{t("doc.type")}:</span>{" "}
                <span style={{ color: "hsl(var(--foreground))" }}>{selectedUpload.contentType}</span>
              </div>
              <div>
                <span style={{ fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>{t("doc.size")}:</span>{" "}
                <span style={{ color: "hsl(var(--foreground))" }}>{selectedUpload.sizeBytes.toLocaleString()} bytes</span>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              background: "hsl(var(--muted) / 0.3)",
              borderRadius: "var(--radius)",
              fontSize: "var(--font-size-sm)",
              lineHeight: "var(--line-height-normal)",
              color: "hsl(var(--muted-foreground))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            {t("doc.supported")}: <span style={{ fontWeight: 600, color: "hsl(var(--foreground))" }}>.txt .md .json (ChatGPT export) .docx</span> • {t("doc.notSupported")}:{" "}
            <span style={{ fontWeight: 600, color: "hsl(var(--foreground))" }}>.doc</span> (upload .docx).
          </div>
        </div>
      )}

      {/* Segmentation summary */}
      {documentId && (
        <div style={{ marginTop: 14 }}>
          <SegmentationSummaryBar
            qa={{
              count: segSummaryByMode.qa?.count ?? 0,
              last: segSummaryByMode.qa?.lastSegmentedAt ?? null,
            }}
            paragraphs={{
              count: segSummaryByMode.paragraphs?.count ?? 0,
              last: segSummaryByMode.paragraphs?.lastSegmentedAt ?? null,
            }}
            onRefresh={() => {
              if (documentId) loadSegmentationSummary(documentId);
            }}
            drawerTitle={`Document #${documentId} • Segmentation`}
          />

          {/* Document Action Buttons */}
          <div style={{ marginTop: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <GradientActionButton
              onClick={() => onNavigate(`/documents/${documentId}/view`)}
              disabled={!documentId}
              gradient="info"
              icon={<Eye style={{ width: 16, height: 16 }} />}
              iconOnly={isMobile}
            >
              {t("btn.viewDocument")}
            </GradientActionButton>
            <GradientActionButton
              onClick={() => onNavigate(`/documents/${documentId}`)}
              disabled={!documentId}
              gradient="primary"
              icon={<FileEdit style={{ width: 16, height: 16 }} />}
              iconOnly={isMobile}
            >
              {t("btn.editDocument")}
            </GradientActionButton>
          </div>
        </div>
      )}
    </>
  );
};

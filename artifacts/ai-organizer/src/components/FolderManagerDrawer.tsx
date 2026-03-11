// src/components/FolderManagerDrawer.tsx
import { useEffect, useMemo, useState } from "react";
import Drawer from "./Drawer";
import ConfirmDialog from "./ConfirmDialog";
import { FolderDTO, createFolder, deleteFolder, loadFolders, renameFolder } from "../lib/segmentFolders";
import { useLanguage } from "../context/LanguageContext";

export interface Props {
  docId: number;
  open: boolean;
  onClose: () => void;
  folders?: FolderDTO[];
  onChanged?: (folders: FolderDTO[]) => Promise<void>;
  refreshKey?: number; // Force re-render
}

export default function FolderManagerDrawer({ docId, open, onClose, folders: foldersProp, onChanged }: Props) {
  const { t } = useLanguage();
  const [localFolders, setLocalFolders] = useState<FolderDTO[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);  // P3: Nested folders
  const [deletingFolder, setDeletingFolder] = useState<{ id: string; name: string } | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());  // P3: Track expanded folders (using string IDs for compatibility)

  // Use prop if provided, otherwise use local state
  const folders = foldersProp ?? localFolders;

  // Sync folders prop to local state when it changes (for controlled mode)
  useEffect(() => {
    if (foldersProp !== undefined) {
      // Always sync when prop changes - React will handle if it's the same reference
      const propIds = foldersProp.map(f => `${f.id}-${f.name}`).sort().join(',');
      const localIds = localFolders.map(f => `${f.id}-${f.name}`).sort().join(',');
      if (propIds !== localIds) {
        setLocalFolders(foldersProp);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foldersProp]); // Only depend on foldersProp, not localFolders to avoid loops

  useEffect(() => {
    if (!open) return;
    // Only load if folders prop is not provided (uncontrolled mode)
    if (foldersProp === undefined) {
      const load = async () => {
        const f = await loadFolders(docId);
        setLocalFolders(f);
        // Notify parent component when folders are loaded
        if (onChanged) {
          await onChanged(f);
        }
      };
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, docId]); // Removed refreshKey from dependencies - refresh() will handle updates directly

  const canAdd = useMemo(() => name.trim().length >= 1, [name]);

  async function refresh() {
    // Small delay to ensure backend has processed the operation
    await new Promise(resolve => setTimeout(resolve, 100));
    // Explicitly clear ALL folder-related cache before reloading to ensure fresh data
    // This includes: list folders, get folder (with items), folder map
    const { apiCache } = await import("../lib/cache");
    const API_BASE = import.meta.env.VITE_API_BASE_URL?.toString() || "http://127.0.0.1:8000";
    // Clear all folder-related caches
    apiCache.deleteByPrefix(`cache:${API_BASE}/api/workspace/documents/${docId}/folders`);
    apiCache.deleteByPrefix(`cache:${API_BASE}/api/workspace/folders`);
    // Load fresh folders (skip cache to ensure we get latest data)
    const f = await loadFolders(docId, true);
    // Update local state if not controlled
    if (foldersProp === undefined) {
      setLocalFolders(f);
    }
    // P1-1 FIX: Notify parent component ONLY if controlled (foldersProp is provided)
    // For controlled components, parent manages state, so we notify on actual changes
    // For uncontrolled components, we only update local state (above), no parent notification
    if (onChanged && foldersProp !== undefined) {
      // Controlled component - notify parent so it can update its state
      // NOTE: onChanged should NOT dispatch folder-chunk-updated to avoid loops
      await onChanged(f);
    }
    // Note: refreshKey is handled by parent component
    // NOTE: Do NOT dispatch folder-chunk-updated here - it causes infinite loops
  }

  // P1-1 FIX: Removed auto-refresh on folder-chunk-updated events to prevent infinite loops
  // The parent component (DocumentWorkspace) handles state updates directly after mutations
  // This component only needs to refresh when explicitly called (create/rename/delete folder)
  // NOTE: If we need to listen for external changes, we should use a debounced/throttled approach
  // For now, disabled to prevent loops - parent handles all state updates

  async function handleCreateFolder() {
    if (!canAdd) return;
    
    try {
      await createFolder(docId, name, parentId);
      setName("");
      setParentId(null);
      // Immediately refresh to show the new folder
      await refresh();
    } catch (error) {
      console.error("Failed to create folder:", error);
      // Still try to refresh in case of partial success
      await refresh();
    }
  }
  
  // P3: Flatten nested folder tree for display
  function flattenFolders(folders: FolderDTO[], level: number = 0): Array<FolderDTO & { level: number }> {
    const result: Array<FolderDTO & { level: number }> = [];
    for (const folder of folders) {
      result.push({ ...folder, level });
      // Convert folder.id to string for comparison (backward compatibility)
      const folderIdStr = String(folder.id);
      if (folder.children && folder.children.length > 0 && expandedFolders.has(folderIdStr)) {
        result.push(...flattenFolders(folder.children, level + 1));
      }
    }
    return result;
  }
  
  // P3: Get all folders as flat list for parent selection
  function getAllFoldersFlat(folders: FolderDTO[]): FolderDTO[] {
    const result: FolderDTO[] = [];
    for (const folder of folders) {
      result.push(folder);
      if (folder.children && folder.children.length > 0) {
        result.push(...getAllFoldersFlat(folder.children));
      }
    }
    return result;
  }

  async function handleRenameFolder(folderId: string, newName: string) {
    const v = newName.trim();
    if (!v || v === folders.find(f => String(f.id) === folderId)?.name) return;
    
    try {
      await renameFolder(docId, folderId, v);
      // Immediately refresh to show the updated name
      await refresh();
    } catch (error) {
      console.error("Failed to rename folder:", error);
      // Still try to refresh in case of partial success
      await refresh();
    }
  }

  async function handleDeleteFolder(folderId: string, folderName: string) {
    setDeletingFolder({ id: folderId, name: folderName });
  }

  async function confirmDeleteFolder() {
    if (!deletingFolder) return;
    
    const { id: folderId } = deletingFolder;
    setDeletingFolder(null);
    
    try {
      await deleteFolder(docId, folderId);
      // Immediately refresh to remove the folder from list
      await refresh();
    } catch (error) {
      console.error("Failed to delete folder:", error);
      // Still try to refresh in case of partial success
      await refresh();
    }
  }

  return (
    <>
      <ConfirmDialog
        open={deletingFolder !== null}
        title={t("folders.delete.title")}
        message={t("folders.delete.message", { name: deletingFolder?.name || "" })}
        type="delete"
        confirmText={t("action.delete")}
        cancelText={t("action.cancel")}
        onConfirm={confirmDeleteFolder}
        onCancel={() => setDeletingFolder(null)}
      />
      <Drawer open={open} onClose={onClose} title={t("folders.drawer.title", { docId })} width={560}>
        <div className="space-y-4">
        {/* Add New Folder */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.8) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <label style={{ 
              display: "block", 
              fontSize: "var(--font-size-sm)", 
              fontWeight: 600, 
              color: "rgba(255, 255, 255, 0.7)", 
              marginBottom: "8px" 
            }}>
              {t("folders.createNew")}
            </label>
            <p style={{ 
              fontSize: "var(--font-size-xs)", 
              color: "rgba(255, 255, 255, 0.5)", 
              margin: 0, 
              marginBottom: "12px",
              lineHeight: 1.5,
            }}>
              {t("folders.createDesc")}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("folders.newFolderNamePlaceholder")}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0, 0, 0, 0.3)",
                color: "#eaeaea",
                fontSize: "var(--font-size-base)",
                lineHeight: "var(--line-height-normal)",
                transition: "all 0.2s ease",
              }}
              title={t("folders.inputTitle")}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              disabled={!canAdd}
              onClick={handleCreateFolder}
              style={{
                padding: "12px 20px",
                background: canAdd ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" : "rgba(107, 114, 128, 0.3)",
                border: "none",
                borderRadius: "12px",
                color: "white",
                fontWeight: 600,
                fontSize: "var(--font-size-base)",
                lineHeight: "var(--line-height-normal)",
                cursor: canAdd ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                boxShadow: canAdd ? "0 4px 12px rgba(99, 102, 241, 0.3)" : "none",
                opacity: canAdd ? 1 : 0.6,
              }}
              title={
                canAdd 
                  ? t("folders.createButtonTitle", { name: name.trim() })
                  : t("folders.createButtonDisabledTitle")
              }
              onMouseEnter={(e) => {
                if (canAdd) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = canAdd ? "0 4px 12px rgba(99, 102, 241, 0.3)" : "none";
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t("action.add")}
            </button>
            </div>
            {/* P3: Parent Folder Selector */}
            {folders.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", whiteSpace: "nowrap" }}>
                  {t("folders.parentFolder")}
                </label>
                <select
                  value={parentId ?? ""}
                  onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0, 0, 0, 0.3)",
                    color: "#eaeaea",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <option value="">{t("folders.parentNone")}</option>
                  {getAllFoldersFlat(folders).map(f => (
                    <option key={f.id} value={f.id}>
                      {t("folders.parentOption", { name: f.name, count: f.itemCount })}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Folders List */}
        {!folders.length ? (
          <div className="text-center py-8 text-secondary bg-surface-elevated border border-border rounded-lg">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p>{t("folders.emptyTitle")}</p>
            <p className="text-sm mt-1">{t("folders.emptySubtitle")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* P3: Render nested folder tree */}
            {flattenFolders(folders).map((f) => (
              <div
                key={f.id}
                className="bg-surface-elevated border border-border rounded-lg p-4 hover:border-primary/50 transition-colors group"
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.03)",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  marginLeft: `${f.level * 24}px`, // Indent based on nesting level
                }}
              >
                <div className="flex items-center gap-2 flex-1">
                  {/* P3: Expand/Collapse button for folders with children */}
                  {f.children && f.children.length > 0 ? (
                    <button
                      onClick={() => {
                        const folderIdStr = String(f.id);
                        const newExpanded = new Set(expandedFolders);
                        if (newExpanded.has(folderIdStr)) {
                          newExpanded.delete(folderIdStr);
                        } else {
                          newExpanded.add(folderIdStr);
                        }
                        setExpandedFolders(newExpanded);
                      }}
                      style={{
                        padding: "4px",
                        background: "transparent",
                        border: "none",
                        color: "rgba(255, 255, 255, 0.6)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title={expandedFolders.has(String(f.id)) ? t("folders.collapse") : t("folders.expand")}
                    >
                      <svg 
                        className="w-4 h-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        style={{
                          transform: expandedFolders.has(String(f.id)) ? "rotate(90deg)" : "rotate(0deg)",
                          transition: "transform 0.2s ease",
                        }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <div style={{ width: "20px" }} /> // Spacer for alignment
                  )}
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <input
                    defaultValue={f.name}
                    onBlur={async (e) => {
                      const v = e.target.value.trim();
                      if (!v || v === f.name) return;
                      await handleRenameFolder(String(f.id), v);
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-primary font-medium"
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "#0f1420",
                      color: "#eaeaea",
                    }}
                    title={t("folders.renameTitle")}
                  />
                </div>
                <button
                  onClick={async () => {
                    await handleDeleteFolder(String(f.id), f.name);
                  }}
                  className="btn-danger p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
                  style={{ padding: "8px 10px" }}
                  title={t("folders.deleteButtonTitle", { name: f.name })}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
    </>
  );
}

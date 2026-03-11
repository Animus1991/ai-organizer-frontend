import React from "react";
import { ResearchCard } from "./ResearchCard";

type ZoteroCardProps = {
  authLoading: boolean;
  isAuthed: boolean;
  canUseResearchTools: boolean;
  onLogin: () => void;
  zoteroKey: string;
  onZoteroKeyChange: (value: string) => void;
  zoteroLibraryType: "user" | "group";
  onZoteroLibraryTypeChange: (value: "user" | "group") => void;
  zoteroLibraryId: string;
  onZoteroLibraryIdChange: (value: string) => void;
  zoteroCollectionsState: any[];
  zoteroItemsState: any[];
  zoteroSyncState: any | null;
  zoteroAuthEncrypted: boolean | null;
  zoteroAutoSyncEnabled: boolean | null;
  zoteroAutoSyncInterval: number | null;
  newCollectionName: string;
  onNewCollectionNameChange: (value: string) => void;
  newItemTitle: string;
  onNewItemTitleChange: (value: string) => void;
  newItemType: string;
  onNewItemTypeChange: (value: string) => void;
  newItemUrl: string;
  onNewItemUrlChange: (value: string) => void;
  newItemDate: string;
  onNewItemDateChange: (value: string) => void;
  onLoadZotero: () => void;
  onSyncZotero: () => void;
  onCreateCollection: () => void;
  onCreateItem: () => void;
  onImportToLibrary: (item: any) => void;
  canImportToLibrary: boolean;
  containerRef?: React.Ref<HTMLDivElement>;
  containerStyle?: React.CSSProperties;
};

export function ZoteroCard({
  authLoading,
  isAuthed,
  canUseResearchTools,
  onLogin,
  zoteroKey,
  onZoteroKeyChange,
  zoteroLibraryType,
  onZoteroLibraryTypeChange,
  zoteroLibraryId,
  onZoteroLibraryIdChange,
  zoteroCollectionsState,
  zoteroItemsState,
  zoteroSyncState,
  zoteroAuthEncrypted,
  zoteroAutoSyncEnabled,
  zoteroAutoSyncInterval,
  newCollectionName,
  onNewCollectionNameChange,
  newItemTitle,
  onNewItemTitleChange,
  newItemType,
  onNewItemTypeChange,
  newItemUrl,
  onNewItemUrlChange,
  newItemDate,
  onNewItemDateChange,
  onLoadZotero,
  onSyncZotero,
  onCreateCollection,
  onCreateItem,
  onImportToLibrary,
  canImportToLibrary,
  containerRef,
  containerStyle,
}: ZoteroCardProps) {
  return (
    <ResearchCard
      containerRef={containerRef}
      containerStyle={containerStyle}
      title="Zotero Integration"
      subtitle="Full sync with read + create collections/items."
    >
      {!authLoading && !isAuthed && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.7)",
            background: "rgba(20,184,166,0.12)",
            border: "1px solid rgba(20,184,166,0.25)",
            padding: "6px 10px",
            borderRadius: "8px",
            width: "fit-content",
            marginBottom: "8px",
          }}
        >
          Log in to load library/authenticated data.
          <button
            onClick={onLogin}
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid rgba(20,184,166,0.4)",
              background: "rgba(20,184,166,0.15)",
              color: "#5eead4",
              cursor: "pointer",
              fontSize: "11px",
            }}
          >
            Log in
          </button>
        </div>
      )}
      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "6px" }}>
        Your API key is stored encrypted on the server for auto‑sync. Use Sync once to enable background updates.
      </div>
      {isAuthed && !canUseResearchTools && (
        <div
          style={{
            fontSize: "12px",
            color: "#92400e",
            background: "rgba(251, 191, 36, 0.25)",
            border: "1px solid rgba(180, 83, 9, 0.4)",
            padding: "6px 10px",
            borderRadius: "8px",
            width: "fit-content",
            marginBottom: "8px",
            fontWeight: 500,
          }}
        >
          Role required: researcher or admin.
        </div>
      )}
      {zoteroAuthEncrypted !== null && (
        <div
          title="Encrypted means your Zotero API key is stored securely for auto‑sync."
          style={{
            fontSize: "11px",
            color: zoteroAuthEncrypted ? "#6ee7b7" : "#fde68a",
            background: zoteroAuthEncrypted ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
            border: `1px solid ${zoteroAuthEncrypted ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.4)"}`,
            padding: "4px 8px",
            borderRadius: "999px",
            width: "fit-content",
            marginBottom: "8px",
          }}
        >
          {zoteroAuthEncrypted ? "Encrypted key stored" : "Key not stored yet"}
        </div>
      )}
      {zoteroAutoSyncEnabled !== null && (
        <div
          style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.7)",
            marginBottom: "8px",
          }}
        >
          Auto‑sync: {zoteroAutoSyncEnabled ? "Enabled" : "Disabled"}
          {zoteroAutoSyncInterval ? ` • Every ${Math.round(zoteroAutoSyncInterval / 60)} min` : ""}
        </div>
      )}
      <div style={{ display: "grid", gap: "8px" }}>
        <input
          value={zoteroKey}
          onChange={(e) => onZoteroKeyChange(e.target.value)}
          placeholder="Zotero API key"
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.3)",
            color: "#eaeaea",
          }}
        />
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <select
            value={zoteroLibraryType}
            onChange={(e) => onZoteroLibraryTypeChange(e.target.value as "user" | "group")}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(0,0,0,0.3)",
              color: "#eaeaea",
            }}
          >
            <option value="user">User Library</option>
            <option value="group">Group Library</option>
          </select>
          <input
            value={zoteroLibraryId}
            onChange={(e) => onZoteroLibraryIdChange(e.target.value)}
            placeholder="Library ID"
            style={{
              flex: "1 1 140px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(0,0,0,0.3)",
              color: "#eaeaea",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={onLoadZotero}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(20,184,166,0.4)",
              background: "rgba(20,184,166,0.15)",
              color: "#5eead4",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Load Zotero
          </button>
          <button
            onClick={onSyncZotero}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(16,185,129,0.4)",
              background: "rgba(16,185,129,0.15)",
              color: "#6ee7b7",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Sync
          </button>
        </div>
      </div>
      <div style={{ marginTop: "10px", display: "grid", gap: "8px" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
          Create collection
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            value={newCollectionName}
            onChange={(e) => onNewCollectionNameChange(e.target.value)}
            placeholder="Collection name"
            style={{
              flex: "1 1 220px",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(0,0,0,0.3)",
              color: "#eaeaea",
            }}
          />
          <button
            onClick={onCreateCollection}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(14,165,233,0.4)",
              background: "rgba(14,165,233,0.15)",
              color: "#7dd3fc",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Create
          </button>
        </div>
      </div>
      <div style={{ marginTop: "10px", display: "grid", gap: "8px" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
          Create item
        </div>
        <input
          value={newItemTitle}
          onChange={(e) => onNewItemTitleChange(e.target.value)}
          placeholder="Item title"
          style={{
            padding: "8px 10px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.3)",
            color: "#eaeaea",
          }}
        />
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <select
            value={newItemType}
            onChange={(e) => onNewItemTypeChange(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(0,0,0,0.3)",
              color: "#eaeaea",
            }}
          >
            <option value="journalArticle">Journal Article</option>
            <option value="book">Book</option>
            <option value="conferencePaper">Conference Paper</option>
            <option value="thesis">Thesis</option>
            <option value="report">Report</option>
          </select>
          <input
            value={newItemUrl}
            onChange={(e) => onNewItemUrlChange(e.target.value)}
            placeholder="URL"
            style={{
              flex: "1 1 200px",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(0,0,0,0.3)",
              color: "#eaeaea",
            }}
          />
          <input
            value={newItemDate}
            onChange={(e) => onNewItemDateChange(e.target.value)}
            placeholder="Year"
            style={{
              width: "100px",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(0,0,0,0.3)",
              color: "#eaeaea",
            }}
          />
          <button
            onClick={onCreateItem}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(14,165,233,0.4)",
              background: "rgba(14,165,233,0.15)",
              color: "#7dd3fc",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Create
          </button>
        </div>
      </div>
      {zoteroCollectionsState.length > 0 && (
        <div style={{ marginTop: "6px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
          Collections: {zoteroCollectionsState.length}
        </div>
      )}
      {zoteroItemsState.length > 0 && (
        <div style={{ marginTop: "6px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
          Items: {zoteroItemsState.length}
        </div>
      )}
      {zoteroSyncState && (
        <div style={{ marginTop: "6px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
          Synced: {zoteroSyncState.collections?.length || 0} collections • {zoteroSyncState.items?.length || 0} items
        </div>
      )}
      {zoteroItemsState.length > 0 && (
        <div style={{ marginTop: "10px", display: "grid", gap: "6px" }}>
          {zoteroItemsState.slice(0, 6).map((item) => (
            <div
              key={item.key || item.id || item.title}
              style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "12px" }}
            >
              <span style={{ color: "rgba(255,255,255,0.75)" }}>{item.title || item.data?.title || "Untitled"}</span>
              <button
                onClick={() => onImportToLibrary(item)}
                disabled={!canImportToLibrary}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(16,185,129,0.4)",
                  background: "rgba(16,185,129,0.15)",
                  color: "#6ee7b7",
                  cursor: canImportToLibrary ? "pointer" : "not-allowed",
                  fontSize: "11px",
                  opacity: canImportToLibrary ? 1 : 0.5,
                }}
              >
                Import
              </button>
            </div>
          ))}
        </div>
      )}
    </ResearchCard>
  );
}

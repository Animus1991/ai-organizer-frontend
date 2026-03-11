/**
 * useLibraryManager — library CRUD, bulk edits, saved views, inline editing
 */
import { useEffect, useState } from "react";
import { listLibraryItems, updateLibraryItem } from "../../../lib/api";

interface Deps {
  setStatus: (s: string) => void;
  logApiFailure: (endpoint: string, error: unknown) => void;
  showInlineToast: (message: string) => void;
  normalizeTagsInput: (value: string) => string;
}

export function useLibraryManager({ setStatus, logApiFailure, showInlineToast, normalizeTagsInput }: Deps) {
  const [libraryFilters, setLibraryFilters] = useState({ search: "", category: "", tag: "", sort: "createdAt" });
  const [libraryItems, setLibraryItems] = useState<any[]>([]);
  const [savedViews, setSavedViews] = useState<any[]>([]);
  const [newViewName, setNewViewName] = useState("");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<any>({});
  const [viewMode, setViewMode] = useState<"list" | "table">("list");
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<number[]>([]);
  const [bulkTags, setBulkTags] = useState("");
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkNotes, setBulkNotes] = useState("");
  const [bulkTitle, setBulkTitle] = useState("");
  const [bulkNotesMode, setBulkNotesMode] = useState<"overwrite" | "prepend" | "append">("overwrite");
  const [bulkTagsMode, setBulkTagsMode] = useState<"overwrite" | "prepend" | "append">("overwrite");
  const [bulkTagsPreview, setBulkTagsPreview] = useState("");
  const [bulkTagsInvalid, setBulkTagsInvalid] = useState("");
  const [autoPreviewTags, setAutoPreviewTags] = useState(true);

  // Persistence
  useEffect(() => {
    const raw = localStorage.getItem("researchHubSavedViews");
    if (raw) { try { setSavedViews(JSON.parse(raw)); } catch { setSavedViews([]); } }
  }, []);
  useEffect(() => { localStorage.setItem("researchHubSavedViews", JSON.stringify(savedViews)); }, [savedViews]);

  // Auto preview tags
  useEffect(() => {
    if (!autoPreviewTags || !bulkTags.trim()) { setBulkTagsPreview(""); setBulkTagsInvalid(""); return; }
    const invalidChars = bulkTags.match(/[^a-zA-Z0-9,\s:\-]/g) || [];
    setBulkTagsPreview(normalizeTagsInput(bulkTags));
    setBulkTagsInvalid(Array.from(new Set(invalidChars)).join(" "));
  }, [bulkTags, autoPreviewTags]);

  const loadLibrary = async () => {
    try {
      const res = await listLibraryItems({
        search: libraryFilters.search || undefined,
        category: libraryFilters.category || undefined,
        tag: libraryFilters.tag || undefined,
      });
      const sorted = [...res].sort((a: any, b: any) => {
        if (libraryFilters.sort === "title") return (a.title || "").localeCompare(b.title || "");
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      });
      setLibraryItems(sorted);
    } catch (e: any) {
      logApiFailure("library load", e);
      setStatus(e?.message || "Library load failed");
    }
  };

  const toggleSelectLibrary = (itemId: number) => {
    setSelectedLibraryIds((prev) => prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]);
  };

  const applyBulkEdit = async () => {
    if (!selectedLibraryIds.length) return;
    const basePayload: any = {};
    if (bulkCategory.trim()) basePayload.category = bulkCategory.trim();
    if (bulkTitle.trim()) basePayload.title = bulkTitle.trim();
    const itemMap = new Map(libraryItems.map((item: any) => [item.id, item]));
    if (!Object.keys(basePayload).length && !bulkNotes.trim() && !bulkTags.trim()) return;
    try {
      await Promise.all(selectedLibraryIds.map((id) => {
        const item = itemMap.get(id);
        const payload: any = { ...basePayload };
        if (bulkTags.trim()) {
          const currentTags = (item?.tags || "").trim();
          if (bulkTagsMode === "append" && currentTags) payload.tags = `${currentTags},${bulkTags.trim()}`;
          else if (bulkTagsMode === "prepend" && currentTags) payload.tags = `${bulkTags.trim()},${currentTags}`;
          else payload.tags = bulkTags.trim();
        }
        if (bulkNotes.trim()) {
          const current = (item?.notes || "").trim();
          if (bulkNotesMode === "prepend") payload.notes = current ? `${bulkNotes.trim()}\n${current}` : bulkNotes.trim();
          else if (bulkNotesMode === "append") payload.notes = current ? `${current}\n${bulkNotes.trim()}` : bulkNotes.trim();
          else payload.notes = bulkNotes.trim();
        }
        return updateLibraryItem(id, payload);
      }));
      setSelectedLibraryIds([]); setBulkTags(""); setBulkCategory(""); setBulkNotes(""); setBulkTitle("");
      setBulkNotesMode("overwrite"); setBulkTagsMode("overwrite");
      await loadLibrary();
      setStatus("Bulk update applied");
    } catch (e: any) { setStatus(e?.message || "Bulk update failed"); }
  };

  const startInlineEdit = (item: any) => {
    if (viewMode === "table") setViewMode("list");
    setEditingItemId(item.id);
    setEditDraft({ title: item.title || "", notes: item.notes || "", tags: item.tags || "", category: item.category || "" });
  };

  const saveInlineEdit = async (itemId: number) => {
    try {
      await updateLibraryItem(itemId, editDraft);
      setEditingItemId(null); setEditDraft({});
      await loadLibrary();
      showInlineToast("Saved");
    } catch (e: any) {
      logApiFailure("library update", e);
      setStatus(e?.message || "Library update failed");
    }
  };

  const saveView = () => {
    if (!newViewName.trim()) return;
    const view = { name: newViewName.trim(), filters: { ...libraryFilters } };
    setSavedViews([...savedViews.filter((v: any) => v.name !== view.name), view]);
    setNewViewName("");
  };

  const applyView = (view: any) => { setLibraryFilters(view.filters); };

  return {
    libraryFilters, setLibraryFilters,
    libraryItems, setLibraryItems,
    savedViews, setSavedViews,
    newViewName, setNewViewName,
    editingItemId, setEditingItemId,
    editDraft, setEditDraft,
    viewMode, setViewMode,
    selectedLibraryIds, setSelectedLibraryIds,
    bulkTags, setBulkTags,
    bulkCategory, setBulkCategory,
    bulkNotes, setBulkNotes,
    bulkTitle, setBulkTitle,
    bulkNotesMode, setBulkNotesMode,
    bulkTagsMode, setBulkTagsMode,
    bulkTagsPreview, setBulkTagsPreview,
    bulkTagsInvalid, setBulkTagsInvalid,
    autoPreviewTags, setAutoPreviewTags,
    loadLibrary, toggleSelectLibrary,
    applyBulkEdit, startInlineEdit, saveInlineEdit,
    saveView, applyView,
  };
}

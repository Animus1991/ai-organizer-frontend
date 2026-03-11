/**
 * useTagPresets — tag preset management with drag-drop, autosave, merge, history, JSON I/O
 */
import { useEffect, useRef, useState } from "react";

interface Deps {
  showInlineToast: (message: string) => void;
  setStatus: (s: string) => void;
}

export function useTagPresets({ showInlineToast, setStatus }: Deps) {
  const [tagPresets, setTagPresets] = useState<{ name: string; value: string; category: string }[]>([
    { name: "Notes", value: "summary,insight,open-question", category: "Writing" },
    { name: "Research", value: "claim,evidence,method,limitation", category: "Research" },
    { name: "Writing", value: "outline,draft,revision,final", category: "Writing" },
  ]);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetValue, setNewPresetValue] = useState("");
  const [newPresetCategory, setNewPresetCategory] = useState("General");
  const [presetCategoryFilter, setPresetCategoryFilter] = useState("All");
  const [dragPresetName, setDragPresetName] = useState<string | null>(null);
  const [dragOverPresetName, setDragOverPresetName] = useState<string | null>(null);
  const [lastPresetOrder, setLastPresetOrder] = useState<string[] | null>(null);
  const [presetNameConflict, setPresetNameConflict] = useState<string | null>(null);
  const [presetNameSuggestion, setPresetNameSuggestion] = useState<{ original: string; suggested: string } | null>(null);
  const [presetNameDrafts, setPresetNameDrafts] = useState<Record<string, string>>({});
  const [presetCategoryDrafts, setPresetCategoryDrafts] = useState<Record<string, string>>({});
  const [pendingPresetAutosave, setPendingPresetAutosave] = useState<Record<string, "name" | "category">>({});
  const [hoverPresetName, setHoverPresetName] = useState<string | null>(null);
  const [presetJsonInput, setPresetJsonInput] = useState("");
  const [mergeFromCategory, setMergeFromCategory] = useState("");
  const [mergeToCategory, setMergeToCategory] = useState("");
  const [mergePreviewExpanded, setMergePreviewExpanded] = useState(false);
  const [presetHistory, setPresetHistory] = useState<
    { id: string; label: string; savedAt: string; presets: { name: string; value: string; category: string }[] }[]
  >([]);
  const presetNameAutosaveTimers = useRef<Record<string, number>>({});
  const presetCategoryAutosaveTimers = useRef<Record<string, number>>({});

  // Persistence
  useEffect(() => {
    const raw = localStorage.getItem("researchHubTagPresets");
    if (raw) { try { const p = JSON.parse(raw); if (Array.isArray(p) && p.length) setTagPresets(p); } catch {} }
  }, []);
  useEffect(() => {
    const raw = localStorage.getItem("researchHubPresetHistory");
    if (raw) { try { const p = JSON.parse(raw); if (Array.isArray(p)) setPresetHistory(p); } catch {} }
  }, []);
  useEffect(() => { localStorage.setItem("researchHubTagPresets", JSON.stringify(tagPresets)); }, [tagPresets]);
  useEffect(() => { localStorage.setItem("researchHubPresetHistory", JSON.stringify(presetHistory.slice(0, 8))); }, [presetHistory]);
  useEffect(() => { setMergePreviewExpanded(false); }, [mergeFromCategory]);

  // Derived
  const categoryCounts = tagPresets.reduce<Record<string, number>>((acc, p) => { acc[p.category] = (acc[p.category] || 0) + 1; return acc; }, {});
  const categoryChips = ["All", ...Object.entries(categoryCounts).sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0])).map(([name]) => name)];
  const mergePreviewCount = mergeFromCategory ? tagPresets.filter((p) => p.category === mergeFromCategory).length : 0;
  const mergePreviewItems = mergeFromCategory ? tagPresets.filter((p) => p.category === mergeFromCategory).map((p) => p.name) : [];

  const normalizeTagsInput = (value: string) => {
    const parts = value.split(",").map((t) => t.trim().toLowerCase()).map((t) => t.replace(/\s+/g, "-")).map((t) => t.replace(/[^a-z0-9:\-]/g, "")).filter(Boolean);
    return Array.from(new Set(parts)).join(",");
  };

  const applyTagPreset = (tags: string) => tags; // returns normalized — caller sets bulkTags

  const addTagPreset = () => {
    const name = newPresetName.trim();
    const value = normalizeTagsInput(newPresetValue.trim());
    const category = newPresetCategory.trim() || "General";
    if (!name || !value) return;
    setTagPresets((prev) => [...prev.filter((p) => p.name !== name), { name, value, category }]);
    setNewPresetName(""); setNewPresetValue(""); setNewPresetCategory("General");
  };

  const removeTagPreset = (name: string) => { setTagPresets((prev) => prev.filter((p) => p.name !== name)); };

  const reorderTagPresets = (sourceName: string, targetName: string) => {
    if (sourceName === targetName) return;
    setTagPresets((prev) => {
      setLastPresetOrder(prev.map((p) => p.name));
      const si = prev.findIndex((p) => p.name === sourceName);
      const ti = prev.findIndex((p) => p.name === targetName);
      if (si === -1 || ti === -1) return prev;
      const next = [...prev]; const [moved] = next.splice(si, 1); next.splice(ti, 0, moved);
      return next;
    });
  };

  const movePreset = (name: string, direction: -1 | 1) => {
    setTagPresets((prev) => {
      setLastPresetOrder(prev.map((p) => p.name));
      const idx = prev.findIndex((p) => p.name === name);
      if (idx === -1) return prev;
      const ni = idx + direction;
      if (ni < 0 || ni >= prev.length) return prev;
      const next = [...prev]; const [moved] = next.splice(idx, 1); next.splice(ni, 0, moved);
      return next;
    });
  };

  const updatePresetCategory = (name: string, category: string) => {
    setTagPresets((prev) => prev.map((p) => (p.name === name ? { ...p, category: category.trim() || "General" } : p)));
  };

  const updatePresetName = (name: string, nextName: string) => {
    const cleaned = nextName.trim();
    if (!cleaned) return;
    setTagPresets((prev) => {
      if (prev.some((p) => p.name === cleaned) && cleaned !== name) {
        let counter = 2; let suggestion = `${cleaned.replace(/\s+\d+$/, "")} ${counter}`;
        while (prev.some((p) => p.name === suggestion)) { counter++; suggestion = `${cleaned.replace(/\s+\d+$/, "")} ${counter}`; }
        setPresetNameConflict(`Preset name "${cleaned}" already exists.`);
        setPresetNameSuggestion({ original: name, suggested: suggestion });
        return prev;
      }
      setPresetNameConflict(null); setPresetNameSuggestion(null);
      const nextPresets = prev.map((p) => (p.name === name ? { ...p, name: cleaned } : p));
      setPresetHistory((h) => [{ id: `rename-${Date.now()}`, label: "Snapshot after rename", savedAt: new Date().toISOString(), presets: nextPresets }, ...h]);
      return nextPresets;
    });
  };

  const clearPresetNameAutosave = (name: string) => {
    const timer = presetNameAutosaveTimers.current[name];
    if (timer) { window.clearTimeout(timer); delete presetNameAutosaveTimers.current[name]; }
    setPendingPresetAutosave((prev) => { if (!prev[name]) return prev; const n = { ...prev }; delete n[name]; return n; });
  };

  const clearPresetCategoryAutosave = (name: string) => {
    const timer = presetCategoryAutosaveTimers.current[name];
    if (timer) { window.clearTimeout(timer); delete presetCategoryAutosaveTimers.current[name]; }
    setPendingPresetAutosave((prev) => { if (!prev[name]) return prev; const n = { ...prev }; delete n[name]; return n; });
  };

  const schedulePresetNameAutosave = (name: string, draft: string) => {
    clearPresetNameAutosave(name);
    const trimmed = draft.trim();
    if (!trimmed || trimmed === name) return;
    setPendingPresetAutosave((prev) => ({ ...prev, [name]: "name" }));
    presetNameAutosaveTimers.current[name] = window.setTimeout(() => {
      updatePresetName(name, trimmed);
      setPresetNameDrafts((prev) => { const n = { ...prev }; delete n[name]; return n; });
      showInlineToast("Saved"); clearPresetNameAutosave(name);
    }, 2000);
  };

  const schedulePresetCategoryAutosave = (name: string, draft: string, currentCategory: string) => {
    clearPresetCategoryAutosave(name);
    const trimmed = draft.trim();
    if (trimmed === currentCategory.trim()) return;
    setPendingPresetAutosave((prev) => ({ ...prev, [name]: "category" }));
    presetCategoryAutosaveTimers.current[name] = window.setTimeout(() => {
      updatePresetCategory(name, trimmed);
      setPresetCategoryDrafts((prev) => { const n = { ...prev }; delete n[name]; return n; });
      showInlineToast("Saved"); clearPresetCategoryAutosave(name);
    }, 2000);
  };

  const applySuggestedPresetName = () => {
    if (!presetNameSuggestion) return;
    updatePresetName(presetNameSuggestion.original, presetNameSuggestion.suggested);
    setPresetNameDrafts((prev) => { const n = { ...prev }; delete n[presetNameSuggestion.original]; return n; });
  };

  const undoPresetReorder = () => {
    if (!lastPresetOrder) return;
    setTagPresets((prev) => {
      const map = new Map(prev.map((p) => [p.name, p]));
      const reordered = lastPresetOrder.map((name) => map.get(name)).filter(Boolean) as typeof prev;
      const extras = prev.filter((p) => !lastPresetOrder.includes(p.name));
      return [...reordered, ...extras];
    });
    setLastPresetOrder(null);
  };

  const mergePresetCategories = () => {
    const from = mergeFromCategory.trim();
    const to = mergeToCategory.trim();
    if (!from || !to || from === to) return;
    setTagPresets((prev) => prev.map((p) => (p.category === from ? { ...p, category: to } : p)));
    setMergeFromCategory(""); setMergeToCategory("");
  };

  const exportPresetsJson = () => {
    const json = JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), presets: tagPresets }, null, 2);
    setPresetJsonInput(json);
    setStatus("Presets JSON ready");
  };

  const copyPresetsJson = async () => {
    const json = JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), presets: tagPresets }, null, 2);
    try { await navigator.clipboard.writeText(json); setStatus("Presets JSON copied"); }
    catch { setStatus("Failed to copy presets"); }
  };

  const importPresetsJson = () => {
    if (!presetJsonInput.trim()) return;
    try {
      const parsed = JSON.parse(presetJsonInput);
      const rawPresets = Array.isArray(parsed) ? parsed : parsed?.presets;
      if (!Array.isArray(rawPresets)) throw new Error("Preset JSON must be an array or { presets: [...] }");
      const normalized = rawPresets
        .map((p: any) => ({ name: String(p?.name || "").trim(), value: normalizeTagsInput(String(p?.value || "")), category: String(p?.category || "General").trim() || "General" }))
        .filter((p: any) => p.name && p.value);
      if (!normalized.length) throw new Error("No valid presets found");
      setTagPresets(normalized);
      setPresetHistory((prev) => [{ id: `import-${Date.now()}`, label: "Imported presets", savedAt: new Date().toISOString(), presets: normalized }, ...prev]);
      setStatus("Presets imported");
    } catch (e: any) { setStatus(e?.message || "Preset import failed"); }
  };

  const savePresetSnapshot = () => {
    setPresetHistory((prev) => [{ id: `snapshot-${Date.now()}`, label: `Snapshot (${tagPresets.length} presets)`, savedAt: new Date().toISOString(), presets: tagPresets }, ...prev].slice(0, 8));
    setStatus("Preset snapshot saved");
  };

  const restorePresetSnapshot = (snapshot: typeof presetHistory[number]) => {
    setTagPresets(snapshot.presets);
    setStatus(`Restored: ${snapshot.label}`);
  };

  return {
    tagPresets, setTagPresets,
    newPresetName, setNewPresetName,
    newPresetValue, setNewPresetValue,
    newPresetCategory, setNewPresetCategory,
    presetCategoryFilter, setPresetCategoryFilter,
    dragPresetName, setDragPresetName,
    dragOverPresetName, setDragOverPresetName,
    lastPresetOrder, setLastPresetOrder,
    presetNameConflict, setPresetNameConflict,
    presetNameSuggestion, setPresetNameSuggestion,
    presetNameDrafts, setPresetNameDrafts,
    presetCategoryDrafts, setPresetCategoryDrafts,
    pendingPresetAutosave, setPendingPresetAutosave,
    hoverPresetName, setHoverPresetName,
    presetJsonInput, setPresetJsonInput,
    mergeFromCategory, setMergeFromCategory,
    mergeToCategory, setMergeToCategory,
    mergePreviewExpanded, setMergePreviewExpanded,
    presetHistory, setPresetHistory,
    presetNameAutosaveTimers, presetCategoryAutosaveTimers,
    categoryCounts, categoryChips,
    mergePreviewCount, mergePreviewItems,
    normalizeTagsInput,
    applyTagPreset, addTagPreset, removeTagPreset,
    reorderTagPresets, movePreset,
    updatePresetCategory, updatePresetName,
    clearPresetNameAutosave, clearPresetCategoryAutosave,
    schedulePresetNameAutosave, schedulePresetCategoryAutosave,
    applySuggestedPresetName,
    undoPresetReorder, mergePresetCategories,
    exportPresetsJson, copyPresetsJson, importPresetsJson,
    savePresetSnapshot, restorePresetSnapshot,
  };
}

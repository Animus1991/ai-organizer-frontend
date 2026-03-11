import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import type { LibraryItemDTO } from "../../../lib/api";

interface LibraryEditModalProps {
  item: LibraryItemDTO;
  onSave: (updates: { title?: string; notes?: string; tags?: string; category?: string }) => void;
  onClose: () => void;
}

export function LibraryEditModal({ item, onSave, onClose }: LibraryEditModalProps) {
  const [title, setTitle] = useState(item.title || "");
  const [notes, setNotes] = useState(item.notes || "");
  const [category, setCategory] = useState(item.category || "");
  const [tags, setTags] = useState(item.tags || "");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Record<string, string | undefined> = {};
    if (title !== (item.title || "")) updates.title = title || undefined;
    if (notes !== (item.notes || "")) updates.notes = notes || undefined;
    if (category !== (item.category || "")) updates.category = category || undefined;
    if (tags !== (item.tags || "")) updates.tags = tags || undefined;
    if (Object.keys(updates).length > 0) onSave(updates);
    else onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-2xl p-8 max-w-lg w-[90%] max-h-[80vh] overflow-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Edit Library Item</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Research, Notes, Evidence"
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., important, hypothesis, evidence"
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary border border-primary rounded-lg text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
            >
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

import React from "react";
import { useNavigate } from "react-router-dom";
import { Star, Pencil, Trash2, FileText, ExternalLink } from "lucide-react";
import type { LibraryItemDTO } from "../../../lib/api";

interface LibraryItemCardProps {
  item: LibraryItemDTO;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/* ── Segment type configuration ── */
const SEGMENT_TYPE_CLASSES: Record<string, { text: string; bg: string; border: string }> = {
  definition:       { text: "text-indigo-500",  bg: "bg-indigo-500/10",  border: "border-indigo-500/30" },
  assumption:       { text: "text-violet-500",  bg: "bg-violet-500/10",  border: "border-violet-500/30" },
  claim:            { text: "text-pink-500",    bg: "bg-pink-500/10",    border: "border-pink-500/30" },
  mechanism:        { text: "text-amber-500",   bg: "bg-amber-500/10",   border: "border-amber-500/30" },
  prediction:       { text: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  counterargument:  { text: "text-red-500",     bg: "bg-red-500/10",     border: "border-red-500/30" },
  evidence:         { text: "text-cyan-500",    bg: "bg-cyan-500/10",    border: "border-cyan-500/30" },
  open_question:    { text: "text-lime-500",    bg: "bg-lime-500/10",    border: "border-lime-500/30" },
  experiment:       { text: "text-orange-500",  bg: "bg-orange-500/10",  border: "border-orange-500/30" },
  meta:             { text: "text-slate-400",   bg: "bg-slate-400/10",   border: "border-slate-400/30" },
};

const GRADE_CLASSES: Record<string, { text: string; bg: string; border: string }> = {
  E0: { text: "text-gray-400",    bg: "bg-gray-400/10",    border: "border-gray-400/30" },
  E1: { text: "text-red-500",     bg: "bg-red-500/10",     border: "border-red-500/30" },
  E2: { text: "text-amber-500",   bg: "bg-amber-500/10",   border: "border-amber-500/30" },
  E3: { text: "text-blue-500",    bg: "bg-blue-500/10",    border: "border-blue-500/30" },
  E4: { text: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
};

function formatSegmentType(type: string): string {
  return type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function getTypeBorderClass(type?: string | null): string {
  if (!type || type === "untyped") return "border-l-muted-foreground/30";
  const cfg = SEGMENT_TYPE_CLASSES[type];
  return cfg ? `border-l-${type === "definition" ? "indigo" : type === "assumption" ? "violet" : type === "claim" ? "pink" : type === "mechanism" ? "amber" : type === "prediction" ? "emerald" : type === "counterargument" ? "red" : type === "evidence" ? "cyan" : type === "open_question" ? "lime" : type === "experiment" ? "orange" : "slate"}-500` : "border-l-muted-foreground/30";
}

export function LibraryItemCard({ item, isFavorite: isFav, onToggleFavorite, onEdit, onDelete }: LibraryItemCardProps) {
  const nav = useNavigate();
  const typeCfg = SEGMENT_TYPE_CLASSES[item.segmentType || ""] || null;
  const gradeCfg = GRADE_CLASSES[item.evidenceGrade || ""] || null;

  return (
    <div
      className={`group relative bg-card border rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg border-l-[3px] ${
        isFav
          ? "border-amber-500/30 border-l-amber-500 bg-amber-500/[0.03]"
          : "border-border border-l-primary/40"
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2 mb-2">
            <span className="truncate">{item.title || item.segmentTitle || "Untitled Segment"}</span>
            {isFav && <Star size={14} className="fill-amber-500 text-amber-500 shrink-0" />}
          </h3>

          {/* Badges */}
          <div className="flex gap-1.5 flex-wrap mb-2.5">
            {item.segmentType && item.segmentType !== "untyped" && typeCfg && (
              <span className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${typeCfg.text} ${typeCfg.bg} ${typeCfg.border}`}>
                {formatSegmentType(item.segmentType)}
              </span>
            )}
            {item.evidenceGrade && gradeCfg && (
              <span className={`text-[11px] px-2 py-0.5 rounded-md border font-mono font-semibold ${gradeCfg.text} ${gradeCfg.bg} ${gradeCfg.border}`}>
                {item.evidenceGrade}
              </span>
            )}
            {item.category && (
              <span className="text-[11px] px-2 py-0.5 rounded-md border bg-primary/10 border-primary/30 text-primary font-medium">
                {item.category}
              </span>
            )}
          </div>

          {/* Content preview */}
          {item.content && (
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-2 line-clamp-2">
              {item.content.slice(0, 200)}
            </p>
          )}

          {/* Notes */}
          {item.notes && (
            <p className="text-[12.5px] text-muted-foreground/70 italic mb-2 line-clamp-1">
              {item.notes}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground/60">
            <span className="flex items-center gap-1">
              <FileText size={11} />
              Document {item.documentId}
            </span>
            {item.documentId && (
              <button
                onClick={() => nav(`/documents/${item.documentId}`)}
                className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 border border-primary/30 rounded text-primary text-[11px] font-medium hover:bg-primary/20 transition-colors"
              >
                <ExternalLink size={10} />
                View
              </button>
            )}
            {item.tags && (
              <div className="flex gap-1 flex-wrap">
                {item.tags.split(",").map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-500 text-[10px] font-medium"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onToggleFavorite}
            title={isFav ? "Remove from favorites" : "Add to favorites"}
            className={`p-2 rounded-lg border transition-colors ${
              isFav
                ? "bg-amber-500/15 border-amber-500/30 text-amber-500 hover:bg-amber-500/25"
                : "bg-muted/50 border-border text-muted-foreground hover:text-amber-500 hover:border-amber-500/30"
            }`}
          >
            <Star size={14} className={isFav ? "fill-current" : ""} />
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
            title="Edit item"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 transition-colors"
            title="Delete item"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

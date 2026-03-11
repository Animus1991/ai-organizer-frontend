import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Star, ArrowRight } from "lucide-react";

interface LibraryEmptyStateProps {
  isFavoritesView: boolean;
}

export function LibraryEmptyState({ isFavoritesView }: LibraryEmptyStateProps) {
  const nav = useNavigate();

  return (
    <div className="text-center py-16 px-6 bg-muted/30 rounded-2xl border border-dashed border-border mt-6">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
        {isFavoritesView ? <Star size={28} className="text-amber-500" /> : <BookOpen size={28} className="text-primary" />}
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">
        {isFavoritesView ? "No Favourite Items Yet" : "Library is Empty"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed mb-5">
        {isFavoritesView
          ? "Star items to add them to your favourites collection for quick access."
          : "Segment your uploaded documents to populate the library. Each parsed segment will appear here for cross-document analysis."}
      </p>
      {!isFavoritesView && (
        <button
          onClick={() => nav("/")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors"
        >
          Go to Dashboard
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

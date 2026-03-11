/**
 * DiffView - Side-by-side diff comparison
 */

interface Props {
  currentHtml: string;
  savedHtml: string;
}

export function DiffView({ currentHtml, savedHtml }: Props) {
  const stripHtml = (h: string) => h.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  const currentText = stripHtml(currentHtml);
  const savedText = stripHtml(savedHtml);
  const isDirty = currentText !== savedText;
  const currentLines = currentText.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const savedLines = savedText.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);

  return (
    <div className="lab-diff-panel">
      <div className="text-xs text-muted-foreground mb-2 flex justify-between">
        <span>Δ {isDirty ? "Changes since last save" : "No unsaved changes"}</span>
        <span>{currentLines.length} sentences current · {savedLines.length} saved</span>
      </div>
      {isDirty ? (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-[10px] text-destructive font-semibold mb-1">— Last Saved</div>
            {savedLines.length > 0 ? savedLines.map((line, i) => (
              <div key={i} className={!currentLines.includes(line) ? "lab-diff-removed" : "lab-diff-unchanged"}>
                {line}.
              </div>
            )) : <div className="text-muted-foreground italic">Empty</div>}
          </div>
          <div>
            <div className="text-[10px] text-primary font-semibold mb-1">+ Current</div>
            {currentLines.map((line, i) => (
              <div key={i} className={!savedLines.includes(line) ? "lab-diff-added" : "lab-diff-unchanged"}>
                {line}.
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-5 text-muted-foreground text-xs">
          ✓ Content matches last saved version
        </div>
      )}
    </div>
  );
}

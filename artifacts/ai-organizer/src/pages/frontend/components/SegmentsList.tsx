import type { SegmentRow } from "../../../hooks/home/useHomeState";
import { SegmentViewModes, type SegmentItem } from "../../../components/SegmentViewModes";

type SegmentsListProps = {
  segments: SegmentRow[];
  query: string;
  setQuery: (v: string) => void;
  onPick: (segment: SegmentRow) => void;
  onExport: (segment: SegmentRow) => void;
  onBatchOpen?: (segments: SegmentRow[]) => void;
  onPin?: (segment: SegmentRow) => void;
};

export function SegmentsList({ segments, query, setQuery, onPick, onExport, onBatchOpen, onPin }: SegmentsListProps) {
  const handlePick = (seg: SegmentItem) => {
    onPick(seg as SegmentRow);
  };

  const handleExport = (seg: SegmentItem) => {
    onExport(seg as SegmentRow);
  };

  const handleBatchOpen = (segs: SegmentItem[]) => {
    if (onBatchOpen) {
      onBatchOpen(segs as SegmentRow[]);
    }
  };

  const handlePin = (seg: SegmentItem) => {
    if (onPin) {
      onPin(seg as SegmentRow);
    }
  };

  return (
    <SegmentViewModes
      segments={segments}
      query={query}
      setQuery={setQuery}
      onPick={handlePick}
      onExport={handleExport}
      onBatchOpen={handleBatchOpen}
      onPin={onPin ? handlePin : undefined}
      title="Segments"
      showSearch={true}
      showBatchControls={true}
      defaultViewMode="list"
      storageKey="thinkingWorkspaceSegmentViewMode"
    />
  );
}

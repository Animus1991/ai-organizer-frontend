/**
 * DocumentsPanel - Documents & Sources panel content
 */

import { useState } from "react";
import type { SegmentRow } from "../../../../hooks/home/useHomeState";
import { DocumentPickerPanel } from "../../../../components/DocumentPickerPanel";
import { SearchPanel } from "../../../frontend/components/SearchPanel";
import { SegmentsList } from "../../../frontend/components/SegmentsList";
import { useLanguage } from "../../../../context/LanguageContext";

interface Props {
  segments: SegmentRow[];
  onSegmentsChange: (segs: SegmentRow[]) => void;
  segmentQuery: string;
  setSegmentQuery: (q: string) => void;
  searchK: number;
  setSearchK: (k: number) => void;
  onPick: (seg: SegmentRow) => void;
  onBatchOpen: (segs: SegmentRow[]) => void;
}

export function DocumentsPanel({ segments, onSegmentsChange, segmentQuery, setSegmentQuery, searchK, setSearchK, onPick, onBatchOpen }: Props) {
  const { t } = useLanguage();

  return (
    <div className="lab-panel-content">
      <DocumentPickerPanel onSegmentsChange={onSegmentsChange} />
      <div className="my-3">
        <SearchPanel query={segmentQuery} setQuery={setSegmentQuery} k={searchK} setK={setSearchK} onSearch={() => {}} />
      </div>
      {segments.length > 0 ? (
        <SegmentsList
          segments={segments}
          query={segmentQuery}
          setQuery={setSegmentQuery}
          onPick={onPick}
          onExport={() => {}}
          onBatchOpen={onBatchOpen}
        />
      ) : (
        <div className="lab-empty-state">
          <div className="text-3xl mb-2 opacity-50">📄</div>
          <div className="font-semibold mb-1">{t("researchLab.emptyDocuments") || "No segments loaded"}</div>
          <div className="opacity-70">{t("researchLab.emptyDocumentsHint") || "Select a document above to load its segments"}</div>
        </div>
      )}
    </div>
  );
}

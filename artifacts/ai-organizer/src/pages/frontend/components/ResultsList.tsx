import React, { useState } from "react";
import type { SearchHit } from "../types";
import { formatScore } from "../utils/text";
import { useLanguage } from "../../../context/LanguageContext";

type ResultsListProps = {
  hits: SearchHit[];
  activeId?: string | null;
  onPick: (h: SearchHit) => void;
  onExport: (h: SearchHit) => void;
};

export function ResultsList({ hits, activeId, onPick, onExport }: ResultsListProps) {
  const { t } = useLanguage();
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const handleCopy = async (hit: SearchHit) => {
    const payload = [
      `Title: ${hit.title}`,
      hit.createdAt ? `Created at (UTC): ${hit.createdAt}` : null,
      `ID: ${hit.id}`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(payload);
      setCopyHint(t("action.copied"));
    } catch {
      setCopyHint(t("status.error"));
    }
    window.setTimeout(() => setCopyHint(null), 1600);
  };

  return (
    <div className="panelBlock resultsList">
      {hits.map((hit) => (
        <button
          key={hit.id}
          className={`resultCard${activeId === hit.id ? " active" : ""}`}
          onClick={() => onPick(hit)}
          type="button"
        >
          <div className="resultTopRow">
            <div className="resultTitle">{hit.title}</div>
            <div className="resultRight">
              <span className="scorePill">{formatScore(hit.score)}</span>
              <button
                className="miniBtn"
                onClick={(event) => {
                  event.stopPropagation();
                  handleCopy(hit);
                }}
                type="button"
              >
                {t("action.copy")}
              </button>
              <button
                className="miniBtn"
                onClick={(event) => {
                  event.stopPropagation();
                  onExport(hit);
                }}
                type="button"
              >
                {t("action.export")}
              </button>
            </div>
          </div>
          <div className="resultSnippet">{hit.snippet}</div>
        </button>
      ))}
      {copyHint && <div className="hintText">{copyHint}</div>}
    </div>
  );
}

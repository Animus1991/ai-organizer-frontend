import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

type SearchPanelProps = {
  query: string;
  setQuery: (v: string) => void;
  k: number;
  setK: (n: number) => void;
  onSearch: () => void;
  loading?: boolean;
  error?: string;
  resultsCount?: number;
};

export function SearchPanel({
  query,
  setQuery,
  k,
  setK,
  onSearch,
  loading,
  error,
  resultsCount,
}: SearchPanelProps) {
  const { t } = useLanguage();
  return (
    <div className="panelBlock searchBox">
      <div className="searchTitle">{t("workspace.searchTitle")}</div>
      <input
        className="searchInput"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSearch();
        }}
        placeholder={t("workspace.typeQuery")}
        aria-label={t("workspace.searchQueryAria")}
      />
      <div className="searchControls">
        <div className="kBox">
          <input
            className="kInput"
            value={Number.isFinite(k) ? String(k) : ""}
            onChange={(e) => setK(Number(e.target.value || 0))}
            inputMode="numeric"
            aria-label={t("workspace.topKResultsAria")}
          />
        </div>
        <button className="goBtn" onClick={onSearch} disabled={!!loading}>
          {loading ? "…" : t("action.go")}
        </button>
      </div>
      {typeof resultsCount === "number" && (
        <div className="resultsCount">{t("workspace.resultsCount", { count: String(resultsCount) })}</div>
      )}
      {error && <div className="errorBanner">{error}</div>}
    </div>
  );
}

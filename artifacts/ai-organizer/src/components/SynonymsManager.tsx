// src/components/SynonymsManager.tsx
import { useState, useEffect } from "react";
import { addSynonym, removeSynonym, listSynonyms } from "../lib/api";
import { useLoading } from "../hooks/useLoading";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

interface SynonymsManagerProps {
  open: boolean;
  onClose: () => void;
}

export default function SynonymsManager({ open, onClose }: SynonymsManagerProps) {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [word, setWord] = useState("");
  const [synonym, setSynonym] = useState("");
  const [synonyms, setSynonyms] = useState<Record<string, string[]>>({});
  const [searchWord, setSearchWord] = useState("");
  const [filteredSynonyms, setFilteredSynonyms] = useState<Record<string, string[]>>({});
  const { loading, execute } = useLoading();

  useEffect(() => {
    if (open) {
      loadSynonyms();
    }
  }, [open]);

  useEffect(() => {
    if (searchWord.trim()) {
      const filtered: Record<string, string[]> = {};
      for (const [w, syns] of Object.entries(synonyms)) {
        if (w.toLowerCase().includes(searchWord.toLowerCase()) || 
            syns.some(s => s.toLowerCase().includes(searchWord.toLowerCase()))) {
          filtered[w] = syns;
        }
      }
      setFilteredSynonyms(filtered);
    } else {
      setFilteredSynonyms(synonyms);
    }
  }, [searchWord, synonyms]);

  const loadSynonyms = async () => {
    try {
      const response = await listSynonyms();
      setSynonyms(response.synonyms || {});
      setFilteredSynonyms(response.synonyms || {});
    } catch (error) {
      console.error("Failed to load synonyms:", error);
    }
  };

  const handleAdd = async () => {
    if (!word.trim() || !synonym.trim()) {
      alert(t("synonyms.alertEnterBoth"));
      return;
    }

    if (word.trim().toLowerCase() === synonym.trim().toLowerCase()) {
      alert(t("synonyms.alertSameWord"));
      return;
    }

    await execute(async () => {
      try {
        await addSynonym(word.trim(), synonym.trim());
        setWord("");
        setSynonym("");
        await loadSynonyms();
      } catch (error: any) {
        alert(error.message || t("synonyms.addFailed"));
      }
    });
  };

  const handleRemove = async (w: string, syn: string) => {
    if (!confirm(t("synonyms.confirmRemove", { word: w, synonym: syn }))) {
      return;
    }

    await execute(async () => {
      try {
        await removeSynonym(w, syn);
        await loadSynonyms();
      } catch (error: any) {
        alert(error.message || t("synonyms.removeFailed"));
      }
    });
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isDark ? "rgba(0, 0, 0, 0.7)" : colors.bgOverlay,
        backdropFilter: "blur(8px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: 800,
          maxHeight: "90vh",
          background: isDark
            ? "linear-gradient(135deg, rgba(20, 20, 30, 0.95) 0%, rgba(15, 15, 25, 0.95) 100%)"
            : "#ffffff",
          backdropFilter: "blur(20px)",
          border: `1px solid ${colors.borderPrimary}`,
          borderRadius: "20px",
          boxShadow: isDark ? "0 8px 32px rgba(0, 0, 0, 0.4)" : colors.shadowLg,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px",
            borderBottom: `1px solid ${colors.borderPrimary}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: isDark ? "#eaeaea" : colors.textPrimary, margin: 0 }}>
            📚 {t("synonyms.title")}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: "8px",
              background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(47, 41, 65, 0.06)",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : `1px solid ${colors.borderPrimary}`,
              borderRadius: "8px",
              color: isDark ? "#eaeaea" : colors.textSecondary,
              cursor: "pointer",
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Add Synonym Form */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${colors.borderPrimary}`,
            background: isDark ? "rgba(99, 102, 241, 0.05)" : "rgba(99, 102, 241, 0.06)",
          }}
        >
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: isDark ? "#eaeaea" : colors.textPrimary, marginBottom: "12px" }}>
            {t("synonyms.addPairTitle")}
          </h3>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder={t("synonyms.wordPlaceholder")}
              style={{
                flex: 1,
                minWidth: "150px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : colors.borderPrimary}`,
                background: isDark ? "rgba(0, 0, 0, 0.3)" : colors.bgInput,
                color: isDark ? "#eaeaea" : colors.textPrimary,
                fontSize: "14px",
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAdd();
                }
              }}
            />
            <span style={{ color: isDark ? "rgba(255, 255, 255, 0.5)" : colors.textSecondary, fontSize: "18px" }}>⇄</span>
            <input
              type="text"
              value={synonym}
              onChange={(e) => setSynonym(e.target.value)}
              placeholder={t("synonyms.synonymPlaceholder")}
              style={{
                flex: 1,
                minWidth: "150px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : colors.borderPrimary}`,
                background: isDark ? "rgba(0, 0, 0, 0.3)" : colors.bgInput,
                color: isDark ? "#eaeaea" : colors.textPrimary,
                fontSize: "14px",
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAdd();
                }
              }}
            />
            <button
              onClick={handleAdd}
              disabled={loading || !word.trim() || !synonym.trim()}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: loading || !word.trim() || !synonym.trim()
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(99, 102, 241, 0.8)",
                color: isDark ? "#eaeaea" : colors.textPrimary,
                fontSize: "14px",
                fontWeight: 600,
                cursor: loading || !word.trim() || !synonym.trim() ? "not-allowed" : "pointer",
                opacity: loading || !word.trim() || !synonym.trim() ? 0.5 : 1,
              }}
            >
              {loading ? t("synonyms.adding") : t("synonyms.add")}
            </button>
          </div>
        </div>

        {/* Search */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: `1px solid ${colors.borderPrimary}`,
          }}
        >
          <input
            type="text"
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            placeholder={t("synonyms.searchPlaceholder")}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "8px",
              border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : colors.borderPrimary}`,
              background: isDark ? "rgba(0, 0, 0, 0.3)" : colors.bgInput,
              color: isDark ? "#eaeaea" : colors.textPrimary,
              fontSize: "14px",
            }}
          />
        </div>

        {/* Synonyms List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
          }}
        >
          {Object.keys(filteredSynonyms).length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: isDark ? "rgba(255, 255, 255, 0.5)" : colors.textMuted }}>
              {searchWord.trim() ? (
                <p>{t("synonyms.noMatch", { query: searchWord })}</p>
              ) : (
                <>
                  <p>{t("synonyms.empty")}</p>
                  <p style={{ fontSize: "12px", marginTop: "8px", opacity: 0.7 }}>
                    {t("synonyms.emptyHint")}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {Object.entries(filteredSynonyms).map(([w, syns]) => (
                <div
                  key={w}
                  style={{
                    padding: "16px",
                    background: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(47, 41, 65, 0.04)",
                    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : colors.borderPrimary}`,
                    borderRadius: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: isDark ? "#eaeaea" : colors.textPrimary, marginBottom: "8px" }}>
                        {w}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {syns.map((syn) => (
                          <div
                            key={syn}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 12px",
                              background: "rgba(99, 102, 241, 0.1)",
                              border: "1px solid rgba(99, 102, 241, 0.3)",
                              borderRadius: "6px",
                              fontSize: "13px",
                              color: "#a5b4fc",
                            }}
                          >
                            <span>{syn}</span>
                            <button
                              onClick={() => handleRemove(w, syn)}
                              style={{
                                padding: "2px 4px",
                                background: isDark ? "rgba(255, 0, 0, 0.2)" : "rgba(220, 38, 38, 0.12)",
                                border: "none",
                                borderRadius: "4px",
                                color: isDark ? "#ff6b6b" : colors.accentError,
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 24px",
            borderTop: `1px solid ${colors.borderPrimary}`,
            fontSize: "12px",
            color: isDark ? "rgba(255, 255, 255, 0.5)" : colors.textSecondary,
            textAlign: "center",
          }}
        >
          {t("synonyms.pairCount", { count: Object.keys(synonyms).length })}
        </div>
      </div>
    </div>
  );
}

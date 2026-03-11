import React from "react";
import { useLanguage, SUPPORTED_LANGUAGES } from "../../../context/LanguageContext";

export default function LanguageSection() {
  const { language, setLanguage } = useLanguage();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "14px", marginBottom: "8px" }}>
        Select your preferred language for the interface
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            style={{
              padding: "16px",
              background: language === lang.code ? "hsl(var(--primary) / 0.2)" : "hsl(var(--muted) / 0.4)",
              border: language === lang.code ? "2px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
              borderRadius: "12px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "24px" }}>{lang.flag}</span>
              <div>
                <div style={{ color: "hsl(var(--foreground))", fontWeight: 600, fontSize: "14px" }}>{lang.name}</div>
                <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "12px" }}>{lang.nativeName}</div>
              </div>
              {language === lang.code && (
                <span style={{ marginLeft: "auto", color: "hsl(var(--primary))" }}>✓</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

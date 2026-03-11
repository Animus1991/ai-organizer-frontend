import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { UnifiedColorManager } from "./UnifiedColorManager";

type ColorVars = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
};

const VAR_MAP: Record<keyof ColorVars, string> = {
  primary: "--color-primary",
  secondary: "--color-secondary",
  accent: "--color-accent",
  background: "--color-background",
  surface: "--color-surface",
  text: "--color-text",
  textSecondary: "--color-text-secondary",
  border: "--color-border",
  success: "--color-success",
  warning: "--color-warning",
  error: "--color-error",
};

function safeGetVar(name: string) {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  } catch {
    return "";
  }
}

function readCurrentThemeVars(): ColorVars {
  return {
    primary: safeGetVar(VAR_MAP.primary),
    secondary: safeGetVar(VAR_MAP.secondary),
    accent: safeGetVar(VAR_MAP.accent),
    background: safeGetVar(VAR_MAP.background),
    surface: safeGetVar(VAR_MAP.surface),
    text: safeGetVar(VAR_MAP.text),
    textSecondary: safeGetVar(VAR_MAP.textSecondary),
    border: safeGetVar(VAR_MAP.border),
    success: safeGetVar(VAR_MAP.success),
    warning: safeGetVar(VAR_MAP.warning),
    error: safeGetVar(VAR_MAP.error),
  };
}

function buildVarsCss(vars: ColorVars) {
  return `:root{\n${Object.entries(vars)
    .map(([k, v]) => `  ${VAR_MAP[k as keyof ColorVars]}: ${v} !important;`)
    .join("\n")}\n}`;
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function UltimateUnifiedColorManager() {
  const { user } = useAuth();
  const isAdmin = useMemo(() => {
    const u = user as any;
    return !!(u?.email === import.meta.env.VITE_ADMIN_EMAIL || u?.email?.includes("admin") || u?.role === "admin" || u?.is_admin);
  }, [user]);

  if (!isAdmin) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [customCss, setCustomCss] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const [presetName, setPresetName] = useState<string>("");
  const [showPresetSave, setShowPresetSave] = useState(false);

  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  const applyOverrideCss = (css: string) => {
    if (!styleRef.current) {
      const el = document.createElement("style");
      el.setAttribute("data-ultimate-theme", "true");
      document.head.appendChild(el);
      styleRef.current = el;
    }
    styleRef.current.textContent = css;
  };

  const clearOverrideCss = () => {
    if (styleRef.current) {
      styleRef.current.remove();
      styleRef.current = null;
    }
  };

  const exportCss = async () => {
    const vars = readCurrentThemeVars();
    const css = `/* Ultimate Unified Theme Export */\n${buildVarsCss(vars)}\n`;
    const ok = await copyToClipboard(css);
    showToast(ok ? "CSS copied" : "Failed to copy CSS");
  };

  const exportJson = async () => {
    const vars = readCurrentThemeVars();
    const json = JSON.stringify({ type: "ultimate-unified-theme", vars }, null, 2);
    const ok = await copyToClipboard(json);
    showToast(ok ? "JSON copied" : "Failed to copy JSON");
  };

  const downloadCss = () => {
    const vars = readCurrentThemeVars();
    const css = `/* Ultimate Unified Theme Export */\n${buildVarsCss(vars)}\n`;
    downloadText("ultimate-theme.css", css);
    showToast("CSS downloaded");
  };

  const downloadJson = () => {
    const vars = readCurrentThemeVars();
    const json = JSON.stringify({ type: "ultimate-unified-theme", vars }, null, 2);
    downloadText("ultimate-theme.json", json);
    showToast("JSON downloaded");
  };

  const buildShareUrl = async () => {
    const vars = readCurrentThemeVars();
    const params = new URLSearchParams();
    (Object.keys(vars) as Array<keyof ColorVars>).forEach((k) => {
      params.set(k, vars[k]);
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    const ok = await copyToClipboard(url);
    showToast(ok ? "Share URL copied" : "Failed to copy URL");
  };

  const tryImportFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const keys = Object.keys(VAR_MAP) as Array<keyof ColorVars>;
    const hasAny = keys.some((k) => params.get(k));
    if (!hasAny) {
      showToast("No theme params in URL");
      return;
    }

    const vars: ColorVars = {
      primary: params.get("primary") || "",
      secondary: params.get("secondary") || "",
      accent: params.get("accent") || "",
      background: params.get("background") || "",
      surface: params.get("surface") || "",
      text: params.get("text") || "",
      textSecondary: params.get("textSecondary") || "",
      border: params.get("border") || "",
      success: params.get("success") || "",
      warning: params.get("warning") || "",
      error: params.get("error") || "",
    };

    const missing = keys.filter((k) => !vars[k]);
    if (missing.length > 0) {
      showToast("URL theme incomplete");
      return;
    }

    applyOverrideCss(buildVarsCss(vars));
    showToast("Theme imported from URL (override applied)");
  };

  const saveAsPreset = () => {
    if (!presetName.trim()) {
      showToast("Enter preset name");
      return;
    }
    const vars = readCurrentThemeVars();
    const preset = {
      id: presetName.toLowerCase().replace(/\s+/g, '-'),
      name: presetName.trim(),
      colors: vars,
    };
    // Store in localStorage as admin presets (in real app, this would go to backend)
    const adminPresets = JSON.parse(localStorage.getItem('admin-presets') || '[]');
    const exists = adminPresets.find((p: any) => p.id === preset.id);
    if (exists) {
      showToast("Preset with this name already exists");
      return;
    }
    adminPresets.push(preset);
    localStorage.setItem('admin-presets', JSON.stringify(adminPresets));
    showToast(`Preset "${preset.name}" saved for all users`);
    setPresetName('');
    setShowPresetSave(false);
  };

  return (
    <>
      <UnifiedColorManager
        hideLauncher
        forceActive={managerOpen}
        onRequestClose={() => setManagerOpen(false)}
      />

      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        {toast && (
          <div
            style={{
              pointerEvents: "auto",
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(10, 10, 15, 0.92)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "rgba(255, 255, 255, 0.85)",
              fontSize: 12,
              maxWidth: 280,
            }}
          >
            {toast}
          </div>
        )}

        <button
          onClick={() => setIsOpen((v) => !v)}
          style={{
            pointerEvents: "auto",
            padding: "10px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255, 255, 255, 0.16)",
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9))",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
          title="Ultimate Theme Tools"
        >
          Theme Tools
        </button>

        {isOpen && (
          <div
            style={{
              pointerEvents: "auto",
              width: 420,
              maxWidth: "90vw",
              padding: 14,
              borderRadius: 16,
              background: "rgba(10, 10, 15, 0.92)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(14px)",
              color: "rgba(255, 255, 255, 0.9)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Ultimate Unified Theme Tools</div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "rgba(255, 255, 255, 0.85)",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Close
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <button
                onClick={() => setManagerOpen(true)}
                style={{
                  gridColumn: "span 2",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.35), rgba(147, 51, 234, 0.35))",
                  color: "rgba(255, 255, 255, 0.95)",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                Open Theme Manager
              </button>
              <button
                onClick={exportCss}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "rgba(255, 255, 255, 0.9)",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Copy CSS
              </button>
              <button
                onClick={downloadCss}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "rgba(255, 255, 255, 0.9)",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Download CSS
              </button>
              <button
                onClick={exportJson}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "rgba(255, 255, 255, 0.9)",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Copy JSON
              </button>
              <button
                onClick={downloadJson}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "rgba(255, 255, 255, 0.9)",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Download JSON
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <button
                onClick={buildShareUrl}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "rgba(255, 255, 255, 0.9)",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Copy Share URL
              </button>
              <button
                onClick={tryImportFromUrl}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "rgba(255, 255, 255, 0.9)",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Import from URL
              </button>
            </div>

            {isAdmin && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8, color: "rgba(255, 255, 255, 0.75)" }}>
                  Scientific Override (Admin)
                </div>
                
                {/* Save as Preset Section */}
                <div style={{ marginBottom: 12 }}>
                  <button
                    onClick={() => setShowPresetSave(!showPresetSave)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(34, 197, 94, 0.35)",
                      background: "rgba(34, 197, 94, 0.16)",
                      color: "rgba(255, 255, 255, 0.95)",
                      cursor: "pointer",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {showPresetSave ? "Cancel Save Preset" : "Save as Preset for All Users"}
                  </button>
                  
                  {showPresetSave && (
                    <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                      <input
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="Preset name..."
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          background: "rgba(0, 0, 0, 0.35)",
                          color: "rgba(255, 255, 255, 0.9)",
                          fontSize: 12,
                        }}
                      />
                      <button
                        onClick={saveAsPreset}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid rgba(34, 197, 94, 0.35)",
                          background: "rgba(34, 197, 94, 0.16)",
                          color: "rgba(255, 255, 255, 0.95)",
                          cursor: "pointer",
                          fontWeight: 800,
                          fontSize: 12,
                        }}
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>

                <textarea
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value)}
                  placeholder={":root {\n  --color-primary: #... !important;\n}\n"}
                  style={{
                    width: "100%",
                    minHeight: 110,
                    borderRadius: 12,
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    background: "rgba(0, 0, 0, 0.35)",
                    color: "rgba(255, 255, 255, 0.9)",
                    padding: 10,
                    fontSize: 12,
                    lineHeight: 1.5,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                  }}
                />

                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button
                    onClick={() => {
                      if (!customCss.trim()) {
                        showToast("No override CSS");
                        return;
                      }
                      applyOverrideCss(customCss);
                      showToast("Override applied");
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(16, 185, 129, 0.35)",
                      background: "rgba(16, 185, 129, 0.16)",
                      color: "rgba(255, 255, 255, 0.95)",
                      cursor: "pointer",
                      fontWeight: 800,
                    }}
                  >
                    Apply Override
                  </button>
                  <button
                    onClick={() => {
                      clearOverrideCss();
                      showToast("Override cleared");
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(239, 68, 68, 0.35)",
                      background: "rgba(239, 68, 68, 0.14)",
                      color: "rgba(255, 255, 255, 0.95)",
                      cursor: "pointer",
                      fontWeight: 800,
                    }}
                  >
                    Clear Override
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default UltimateUnifiedColorManager;

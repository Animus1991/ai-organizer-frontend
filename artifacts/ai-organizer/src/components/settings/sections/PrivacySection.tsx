import React, { useState } from "react";
import { useNotifications } from "../../../context/NotificationContext";
import { DangerZone, ToggleSetting } from "../primitives";

const CONSENT_KEY = "thinkhub_consent_v1";
const COOKIE_KEY = "thinkhub_cookies_v1";

function loadJson<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function saveJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

export default function PrivacySection() {
  const { addNotification } = useNotifications();

  const [consent, setConsent] = useState(() => loadJson(CONSENT_KEY, {
    termsAccepted: true, privacyRead: true, researchDataUse: false, analyticsOpt: false, marketingOpt: false,
  }));
  const [cookies, setCookies] = useState(() => loadJson(COOKIE_KEY, {
    analytics: true, functional: true, marketing: false,
  }));

  const updateConsent = (key: string, val: boolean) => {
    const next = { ...consent, [key]: val };
    setConsent(next);
    saveJson(CONSENT_KEY, next);
    addNotification({ type: "success", title: "Consent updated", message: `${key} set to ${val ? "on" : "off"}` });
  };

  const updateCookie = (key: string, val: boolean) => {
    const next = { ...cookies, [key]: val };
    setCookies(next);
    saveJson(COOKIE_KEY, next);
    addNotification({ type: "success", title: "Cookie preference saved", message: `${key}: ${val ? "allowed" : "blocked"}` });
  };

  const handleExportPersonalData = () => {
    const keys = ["user-email", "academic-profile-avatar", "academic-profile-cover", "profile_skills_v1", "platform-stories-v1", "ai_organizer_preferences", CONSENT_KEY, COOKIE_KEY];
    const data: Record<string, unknown> = { _exportedAt: new Date().toISOString(), _type: "personal_data_portability" };
    keys.forEach(k => { try { const v = localStorage.getItem(k); if (v) data[k] = JSON.parse(v); } catch { data[k] = localStorage.getItem(k); } });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thinkhub-personal-data-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification({ type: "success", title: "Personal data exported", message: "Your data package has been downloaded" });
  };

  const handleDeleteAccount = () => {
    const PERSONAL_KEYS = ["user-email", "academic-profile-avatar", "academic-profile-cover", "academic-profile-cover-preset", "profile_skills_v1", "platform-stories-v1", "platform-stories-likes-v1", "platform-stories-seen-v1", "blocked_users_v1", "reports_v1", CONSENT_KEY, COOKIE_KEY, "user_status_v1", "user_trust_level_v1"];
    PERSONAL_KEYS.forEach(k => localStorage.removeItem(k));
    addNotification({ type: "info", title: "Account data erased", message: "Your personal data has been removed. App data retained." });
  };

  const handleClearAll = () => {
    localStorage.clear();
    addNotification({ type: "info", title: "Data Cleared", message: "All local data has been removed" });
  };

  const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border))", borderRadius: "12px", padding: "18px 20px", marginBottom: "16px" }}>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: "12px" }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "640px" }}>
      {/* Privacy notice */}
      <div style={{ padding: "12px 16px", borderRadius: "10px", background: "hsl(var(--primary) / 0.1)", border: "1px solid hsl(var(--primary) / 0.25)", marginBottom: "8px", fontSize: "12px", color: "hsl(var(--muted-foreground))", lineHeight: 1.6 }}>
        🔒 <strong>Privacy-first:</strong> All your data is stored locally on your device. Think!Hub does not send your personal data to any server.
      </div>

      {/* Consent management */}
      <Card title="📋 Consent & Legal">
        <ConsentRow label="Terms of Service accepted" desc="You agreed to our Terms of Service" checked={consent.termsAccepted} onChange={(v) => updateConsent("termsAccepted", v)} disabled />
        <ConsentRow label="Privacy Policy read" desc="You acknowledge reading our Privacy Policy" checked={consent.privacyRead} onChange={(v) => updateConsent("privacyRead", v)} disabled />
        <ConsentRow label="Research data improvement" desc="Allow anonymised usage data to improve AI research features" checked={consent.researchDataUse} onChange={(v) => updateConsent("researchDataUse", v)} />
        <ConsentRow label="Analytics opt-in" desc="Aggregate feature usage analytics (no personal data)" checked={consent.analyticsOpt} onChange={(v) => updateConsent("analyticsOpt", v)} />
        <ConsentRow label="Product updates & newsletters" desc="Receive emails about new features and research tools" checked={consent.marketingOpt} onChange={(v) => updateConsent("marketingOpt", v)} />
      </Card>

      {/* Cookie preferences */}
      <Card title="🍪 Cookie Preferences">
        <ConsentRow label="Functional cookies" desc="Required for core app functionality (cannot be disabled)" checked={cookies.functional} onChange={(v) => updateCookie("functional", v)} disabled />
        <ConsentRow label="Analytics cookies" desc="Help us understand how features are used" checked={cookies.analytics} onChange={(v) => updateCookie("analytics", v)} />
        <ConsentRow label="Marketing cookies" desc="Used for personalised content and research recommendations" checked={cookies.marketing} onChange={(v) => updateCookie("marketing", v)} />
      </Card>

      {/* Data portability */}
      <Card title="📦 Data Portability (GDPR Art. 20)">
        <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", lineHeight: 1.6, margin: "0 0 12px" }}>
          Download a machine-readable copy of all personal data associated with your account.
        </p>
        <button onClick={handleExportPersonalData} style={{ padding: "9px 18px", borderRadius: "8px", border: "none", background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          ⬇ Download Personal Data
        </button>
      </Card>

      {/* Right to erasure */}
      <DangerZone
        title="🗑 Right to Erasure (GDPR Art. 17)"
        description="Permanently delete your personal data (profile, avatar, stories, skills, consents). App documents and settings are retained."
        buttonLabel="Request Account Erasure"
        confirmText="DELETE"
        successMessage="Personal data erased successfully."
        onConfirm={handleDeleteAccount}
      />

      <div style={{ marginTop: "8px" }} />

      {/* Clear all */}
      <DangerZone
        title="⚠ Clear All Local Data"
        description="Removes all locally stored data including documents, settings, and research. This cannot be undone."
        buttonLabel="Clear All Local Data"
        onConfirm={handleClearAll}
      />
    </div>
  );
}

// Small inline toggle row for consent/cookie sections
function ConsentRow({ label, desc, checked, onChange, disabled }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid hsl(var(--border))" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "hsl(var(--foreground))" }}>{label}</div>
        <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", marginTop: "2px" }}>{desc}</div>
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: "40px", height: "22px", borderRadius: "11px", border: "none",
          cursor: disabled ? "default" : "pointer",
          background: checked ? "hsl(var(--primary))" : "hsl(var(--muted))",
          position: "relative", transition: "background 0.2s", flexShrink: 0,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <div style={{
          position: "absolute", top: "3px", left: checked ? "21px" : "3px",
          width: "16px", height: "16px", borderRadius: "50%",
          background: "hsl(var(--primary-foreground))",
          transition: "left 0.2s", boxShadow: "0 1px 3px hsl(var(--foreground) / 0.15)",
        }} />
      </button>
    </div>
  );
}

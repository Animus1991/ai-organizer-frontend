import React, { useState } from "react";
import { useNotifications } from "../../../context/NotificationContext";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { SettingGroup, SettingCard, StatusBadge } from "../primitives";
import type { SessionInfo } from "../../../types/settings";
import { DEFAULT_SESSIONS } from "../../../types/settings";

export default function SecuritySection() {
  const { addNotification } = useNotifications();
  const [twoFAEnabled, setTwoFAEnabled] = useState(() => localStorage.getItem('2fa_enabled') === 'true');
  const [sessions, setSessions] = useLocalStorage<SessionInfo[]>('active_sessions', DEFAULT_SESSIONS);

  const toggle2FA = () => {
    const next = !twoFAEnabled;
    setTwoFAEnabled(next);
    localStorage.setItem('2fa_enabled', String(next));
    addNotification({
      type: next ? 'success' : 'info',
      title: next ? '2FA Enabled' : '2FA Disabled',
      message: next ? 'Two-factor authentication is now active.' : '2FA has been turned off.',
      duration: 3000,
    });
  };

  const revokeSession = (index: number) => {
    const s = sessions[index];
    setSessions(prev => prev.filter((_, j) => j !== index));
    addNotification({ type: 'info', title: 'Session Revoked', message: `${s.device} has been signed out.`, duration: 2500 });
  };

  const loginActivity = [
    { action: "Successful login", time: "Today 10:32 AM", ip: "85.74.xx.xx" },
    { action: "Failed login attempt", time: "Yesterday 11:15 PM", ip: "Unknown" },
    { action: "Password changed", time: "30 days ago", ip: "85.74.xx.xx" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <SettingGroup title="Authentication">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <SettingCard>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "hsl(var(--foreground))", fontWeight: 600, fontSize: "14px" }}>Password</div>
                <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "12px", marginTop: "2px" }}>Last changed 30 days ago</div>
              </div>
              <button
                onClick={() => addNotification({ type: 'info', title: 'Password Change', message: 'A reset link would be sent to your email in production.', duration: 3500 })}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid hsl(var(--primary) / 0.4)", background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))", cursor: "pointer", fontSize: "13px" }}
              >
                Change Password
              </button>
            </div>
          </SettingCard>
          <SettingCard>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "hsl(var(--foreground))", fontWeight: 600, fontSize: "14px" }}>Two-Factor Authentication</div>
                <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "12px", marginTop: "2px" }}>Add an extra layer of security to your account</div>
              </div>
              <StatusBadge active={twoFAEnabled} />
            </div>
            <button
              onClick={toggle2FA}
              style={{
                marginTop: "12px", padding: "8px 16px", borderRadius: "8px",
                border: twoFAEnabled ? "1px solid hsl(var(--destructive) / 0.4)" : "none",
                background: twoFAEnabled ? "hsl(var(--destructive) / 0.1)" : "hsl(var(--primary))",
                color: twoFAEnabled ? "hsl(var(--destructive))" : "hsl(var(--primary-foreground))",
                cursor: "pointer", fontSize: "13px", fontWeight: 600,
              }}
            >
              {twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </button>
          </SettingCard>
        </div>
      </SettingGroup>

      <SettingGroup title="Sessions">
        <SettingCard>
          {sessions.map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < sessions.length - 1 ? "1px solid hsl(var(--border))" : "none" }}>
              <div>
                <div style={{ color: "hsl(var(--foreground))", fontSize: "13px", fontWeight: 500 }}>
                  {s.device} {s.current && <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "8px", background: "hsl(var(--success) / 0.15)", color: "hsl(var(--success))", marginLeft: "6px" }}>Current</span>}
                </div>
                <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "11px" }}>{s.loc} · {s.time}</div>
              </div>
              {!s.current && (
                <button
                  onClick={() => revokeSession(i)}
                  style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid hsl(var(--destructive) / 0.3)", background: "hsl(var(--destructive) / 0.07)", color: "hsl(var(--destructive))", cursor: "pointer", fontSize: "11px" }}
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Login Activity">
        <SettingCard>
          {loginActivity.map((l, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < loginActivity.length - 1 ? "1px solid hsl(var(--border) / 0.5)" : "none" }}>
              <div style={{ color: "hsl(var(--foreground) / 0.7)", fontSize: "12px" }}>{l.action}</div>
              <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "11px", textAlign: "right" }}>{l.time}<br />{l.ip}</div>
            </div>
          ))}
        </SettingCard>
      </SettingGroup>
    </div>
  );
}

/**
 * MobileGreetingBanner
 * Above-the-fold hero card shown only on mobile.
 * Shows time-of-day greeting, first-name from email, and 3 stat pills.
 */
import { useMemo } from "react";
import { FileText, Layers, Activity } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useUserData } from "../../context/UserDataContext";

interface MobileGreetingBannerProps {
  userEmail?: string | null;
  totalSegments?: number;
}

function getGreeting(): { label: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { label: "Good morning",  emoji: "☀️" };
  if (h < 17) return { label: "Good afternoon", emoji: "🌤" };
  if (h < 21) return { label: "Good evening",   emoji: "🌇" };
  return       { label: "Working late",          emoji: "🌙" };
}

export function MobileGreetingBanner({ userEmail, totalSegments = 0 }: MobileGreetingBannerProps) {
  const { isDark } = useTheme();
  const { stats, activity } = useUserData();

  const { label: greeting, emoji } = useMemo(() => getGreeting(), []);

  const firstName = useMemo(() => {
    if (!userEmail) return "Researcher";
    const local = userEmail.split("@")[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }, [userEmail]);

  const pills = [
    { icon: FileText,  value: stats.documentsUploaded, label: "Docs",       color: "--primary" },
    { icon: Layers,    value: totalSegments,            label: "Segments",   color: "--accent"  },
    { icon: Activity,  value: activity.length,          label: "Activities", color: "--warning" },
  ];

  return (
    <div style={{
      borderRadius: 14,
      padding: "16px 18px 14px",
      background: isDark
        ? "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--accent) / 0.07))"
        : "linear-gradient(135deg, hsl(var(--primary) / 0.07), hsl(var(--accent) / 0.04))",
      border: `1px solid hsl(var(--primary) / ${isDark ? 0.22 : 0.14})`,
      boxShadow: isDark
        ? "0 8px 24px hsl(var(--background) / 0.5)"
        : "0 4px 16px hsl(var(--foreground) / 0.06)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Shimmer accent strip */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))",
        opacity: 0.8,
      }} />

      {/* Greeting text */}
      <div style={{ marginBottom: 12 }}>
        <p style={{
          margin: 0, fontSize: 11, fontWeight: 600,
          color: "hsl(var(--muted-foreground))",
          letterSpacing: "0.04em", textTransform: "uppercase",
        }}>
          {emoji} {greeting}
        </p>
        <h2 style={{
          margin: "2px 0 0",
          fontSize: 22, fontWeight: 800,
          color: "hsl(var(--foreground))",
          letterSpacing: "-0.02em", lineHeight: 1.15,
        }}>
          {firstName}
        </h2>
        <p style={{
          margin: "4px 0 0", fontSize: 12,
          color: "hsl(var(--muted-foreground))",
        }}>
          Your research workspace is ready.
        </p>
      </div>

      {/* Live stat pills */}
      <div style={{ display: "flex", gap: 8 }}>
        {pills.map(({ icon: Icon, value, label, color }) => (
          <div key={label} style={{
            flex: 1,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            padding: "8px 4px",
            borderRadius: 10,
            background: `hsl(${color} / ${isDark ? 0.12 : 0.08})`,
            border: `1px solid hsl(${color} / ${isDark ? 0.22 : 0.14})`,
          }}>
            <Icon style={{ width: 14, height: 14, color: `hsl(${color})` }} />
            <span style={{
              fontSize: 16, fontWeight: 800,
              color: `hsl(${color})`,
              lineHeight: 1, fontVariantNumeric: "tabular-nums",
            }}>
              {value}
            </span>
            <span style={{ fontSize: 9, fontWeight: 600, color: "hsl(var(--muted-foreground))", textAlign: "center" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

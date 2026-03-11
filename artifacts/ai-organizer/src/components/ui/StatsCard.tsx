import { useTheme } from "../../context/ThemeContext";

interface StatsCardProps {
  icon: string;
  label: string;
  value: string | number;
  breakdown?: string;
  color?: string;
  onClick?: () => void;
}

export function StatsCard({
  icon,
  label,
  value,
  breakdown,
  color,
  onClick,
}: StatsCardProps) {
  const { colors, isDark } = useTheme();
  const accentColor = color || colors.accentPrimary;

  return (
    <div
      onClick={onClick}
      style={{
        padding: "20px",
        background: isDark ? "rgba(255, 255, 255, 0.03)" : colors.bgCard,
        border: `1px solid ${colors.borderPrimary}`,
        borderRadius: "12px",
        transition: "all 0.2s ease",
        cursor: onClick ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = isDark
          ? "0 8px 16px rgba(0, 0, 0, 0.3)"
          : "0 8px 16px rgba(0, 0, 0, 0.08)";
        e.currentTarget.style.borderColor = accentColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = colors.borderPrimary;
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", color: colors.textSecondary, marginBottom: "4px" }}>
            {label}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: accentColor }}>
            {value}
          </div>
        </div>
      </div>
      {breakdown && (
        <div
          style={{
            fontSize: "12px",
            color: colors.textMuted,
            paddingTop: "12px",
            borderTop: `1px solid ${colors.borderSecondary}`,
          }}
        >
          {breakdown}
        </div>
      )}
    </div>
  );
}

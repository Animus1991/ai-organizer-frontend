import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { Scissors, MessageSquare, FolderOpen } from "lucide-react";

interface HomeQuickActionsProps {
  canSegment: boolean;
  onSegment: () => void;
  onImportChats: () => void;
  onBrowseConversations: () => void;
  isCompact?: boolean;
}

export function HomeQuickActions({
  canSegment,
  onSegment,
  onImportChats,
  onBrowseConversations,
  isCompact = false,
}: HomeQuickActionsProps) {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const actions = [
    {
      id: "segment",
      Icon: Scissors,
      title: t("action.segment") || "Segment Document",
      description: canSegment
        ? t("action.segmentDesc") || "Create smart segments from the selected document"
        : t("action.segmentDisabled") || "Select a parsed document to enable segmentation",
      onClick: onSegment,
      disabled: !canSegment,
      tokenColor: "var(--primary)",
    },
    {
      id: "import",
      Icon: MessageSquare,
      title: t("menu.importChats") || "Import Chats",
      description: t("action.importChatsDesc") || "Bring in your ChatGPT, Claude, and other AI chat exports",
      onClick: onImportChats,
      disabled: false,
      tokenColor: "var(--success)",
    },
    {
      id: "browse",
      Icon: FolderOpen,
      title: t("menu.browseConversations") || "Browse Conversations",
      description: t("action.browseDesc") || "Review and manage every imported conversation",
      onClick: onBrowseConversations,
      disabled: false,
      tokenColor: "var(--warning)",
    },
  ];

  if (isCompact) {
    return (
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            style={{
              flex: "1 1 auto",
              minWidth: "150px",
              padding: "12px 16px",
              background: action.disabled
                ? "hsl(var(--muted))"
                : `hsl(${action.tokenColor} / ${isDark ? 0.15 : 0.08})`,
              border: `1px solid hsl(${action.tokenColor} / ${action.disabled ? 0.1 : 0.25})`,
              borderRadius: "var(--radius)",
              color: action.disabled ? "hsl(var(--muted-foreground))" : `hsl(${action.tokenColor})`,
              fontSize: "14px",
              fontWeight: 600,
              cursor: action.disabled ? "not-allowed" : "pointer",
              opacity: action.disabled ? 0.6 : 1,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "center",
            }}
          >
            <action.Icon style={{ width: 16, height: 16 }} />
            <span>{action.title}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={action.onClick}
          disabled={action.disabled}
          style={{
            padding: "12px 14px",
            background: "hsl(var(--card))",
            border: `1px solid hsl(var(--border))`,
            borderRadius: "calc(var(--radius) + 4px)",
            cursor: action.disabled ? "not-allowed" : "pointer",
            opacity: action.disabled ? 0.6 : 1,
            transition: "all 0.2s ease",
            textAlign: "left" as const,
            position: "relative" as const,
            overflow: "hidden",
            boxShadow: isDark ? "0 4px 16px hsl(var(--background) / 0.5)" : "0 4px 12px hsl(var(--foreground) / 0.06)",
          }}
          onMouseEnter={(e) => {
            if (!action.disabled) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.borderColor = `hsl(${action.tokenColor} / 0.4)`;
              e.currentTarget.style.boxShadow = `0 8px 24px hsl(${action.tokenColor} / 0.15)`;
            }
          }}
          onMouseLeave={(e) => {
            if (!action.disabled) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "hsl(var(--border))";
              e.currentTarget.style.boxShadow = isDark ? "0 4px 16px hsl(var(--background) / 0.5)" : "0 4px 12px hsl(var(--foreground) / 0.06)";
            }
          }}
        >
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "calc(var(--radius) - 2px)",
                background: action.disabled
                  ? "hsl(var(--muted))"
                  : `hsl(${action.tokenColor} / ${isDark ? 0.15 : 0.1})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: action.disabled ? "hsl(var(--muted-foreground))" : `hsl(${action.tokenColor})`,
              }}>
                <action.Icon style={{ width: 16, height: 16 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: "14px", fontWeight: 600,
                  color: action.disabled ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
                  marginBottom: "2px",
                }}>{action.title}</div>
              </div>
            </div>
            <div style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", lineHeight: "1.5" }}>
              {action.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

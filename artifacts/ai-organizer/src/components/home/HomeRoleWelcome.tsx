/**
 * HomeRoleWelcome — Personalized welcome card based on user role
 * Roles: Scientist, Professor, PhD, Master, Bachelor, Writer, Startup
 * Each role has: color theme, suggested actions, motivational quote, tool recommendations
 */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

type ThemeColors = ReturnType<typeof useTheme>["colors"];

export type UserRole =
  | "scientist"
  | "professor"
  | "phd"
  | "master"
  | "bachelor"
  | "writer"
  | "startup";

const ROLE_STORAGE_KEY = "thinkspace-user-role";

export function loadUserRole(): UserRole {
  try {
    const v = localStorage.getItem(ROLE_STORAGE_KEY);
    if (v) return v as UserRole;
  } catch {}
  return "scientist";
}

export function saveUserRole(role: UserRole) {
  try { localStorage.setItem(ROLE_STORAGE_KEY, role); } catch {}
}

export interface RoleConfig {
  icon: string;
  labelEn: string;
  labelGr: string;
  color: string;
  gradient: string;
  quoteEn: string;
  quoteGr: string;
  suggestedActionsEn: { icon: string; label: string; path: string }[];
  suggestedActionsGr: { icon: string; label: string; path: string }[];
  toolsEn: string[];
  toolsGr: string[];
}

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  scientist: {
    icon: "🔬",
    labelEn: "Scientist",
    labelGr: "Επιστήμονας",
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    quoteEn: "Science is the systematic way of knowing the world.",
    quoteGr: "Η επιστήμη είναι ο συστηματικός τρόπος κατανόησης του κόσμου.",
    suggestedActionsEn: [
      { icon: "📤", label: "Upload Research Paper", path: "/" },
      { icon: "🧠", label: "Theory Hub", path: "/theory" },
      { icon: "🔍", label: "Peer Review", path: "/reviews" },
      { icon: "📊", label: "Evidence Graph", path: "/evidence" },
    ],
    suggestedActionsGr: [
      { icon: "📤", label: "Ανέβασε Άρθρο", path: "/" },
      { icon: "🧠", label: "Κέντρο Θεωρίας", path: "/theory" },
      { icon: "🔍", label: "Αξιολόγηση", path: "/reviews" },
      { icon: "📊", label: "Γράφημα Τεκμηρίων", path: "/evidence" },
    ],
    toolsEn: ["Theory Hub", "Peer Review", "Evidence Graph", "Claim Verification"],
    toolsGr: ["Κέντρο Θεωρίας", "Αξιολόγηση", "Γράφημα Τεκμηρίων", "Επαλήθευση Ισχυρισμών"],
  },
  professor: {
    icon: "🎓",
    labelEn: "Professor",
    labelGr: "Καθηγητής",
    color: "#8b5cf6",
    gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
    quoteEn: "Teaching is the highest form of understanding.",
    quoteGr: "Η διδασκαλία είναι η υψηλότερη μορφή κατανόησης.",
    suggestedActionsEn: [
      { icon: "👥", label: "Manage Teams", path: "/teams" },
      { icon: "🔍", label: "Review Student Work", path: "/reviews" },
      { icon: "📂", label: "Course Collections", path: "/collections" },
      { icon: "📡", label: "Activity Feed", path: "/activity" },
    ],
    suggestedActionsGr: [
      { icon: "👥", label: "Διαχείριση Ομάδων", path: "/teams" },
      { icon: "🔍", label: "Αξιολόγηση Εργασιών", path: "/reviews" },
      { icon: "📂", label: "Συλλογές Μαθήματος", path: "/collections" },
      { icon: "📡", label: "Ροή Δραστηριότητας", path: "/activity" },
    ],
    toolsEn: ["Teams", "Peer Review", "Collections", "Project Board"],
    toolsGr: ["Ομάδες", "Αξιολόγηση", "Συλλογές", "Πίνακας Έργου"],
  },
  phd: {
    icon: "🧪",
    labelEn: "PhD Researcher",
    labelGr: "Υποψήφιος Διδάκτορας",
    color: "#ec4899",
    gradient: "linear-gradient(135deg, #ec4899, #f43f5e)",
    quoteEn: "A dissertation is a journey into the unknown.",
    quoteGr: "Η διδακτορική διατριβή είναι ένα ταξίδι στο άγνωστο.",
    suggestedActionsEn: [
      { icon: "🧠", label: "Theory Development", path: "/theory" },
      { icon: "📊", label: "Evidence Graph", path: "/evidence" },
      { icon: "🔀", label: "Theory Branching", path: "/branch" },
      { icon: "🔍", label: "Peer Review", path: "/reviews" },
    ],
    suggestedActionsGr: [
      { icon: "🧠", label: "Ανάπτυξη Θεωρίας", path: "/theory" },
      { icon: "📊", label: "Γράφημα Τεκμηρίων", path: "/evidence" },
      { icon: "🔀", label: "Διακλάδωση Θεωρίας", path: "/branch" },
      { icon: "🔍", label: "Αξιολόγηση", path: "/reviews" },
    ],
    toolsEn: ["Theory Hub", "Evidence Graph", "Theory Branching", "Falsification"],
    toolsGr: ["Κέντρο Θεωρίας", "Γράφημα Τεκμηρίων", "Διακλάδωση", "Αναίρεση"],
  },
  master: {
    icon: "📚",
    labelEn: "Master's Student",
    labelGr: "Μεταπτυχιακός Φοιτητής",
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    quoteEn: "Master the fundamentals before you innovate.",
    quoteGr: "Κατακτήστε τα θεμέλια πριν καινοτομήσετε.",
    suggestedActionsEn: [
      { icon: "📤", label: "Upload Thesis Draft", path: "/" },
      { icon: "📂", label: "Research Collections", path: "/collections" },
      { icon: "🔭", label: "Discover Researchers", path: "/discover" },
      { icon: "📋", label: "Project Board", path: "/board" },
    ],
    suggestedActionsGr: [
      { icon: "📤", label: "Ανέβασε Διατριβή", path: "/" },
      { icon: "📂", label: "Ερευνητικές Συλλογές", path: "/collections" },
      { icon: "🔭", label: "Ανακάλυψε Ερευνητές", path: "/discover" },
      { icon: "📋", label: "Πίνακας Έργου", path: "/board" },
    ],
    toolsEn: ["Collections", "Discover", "Project Board", "Research Lab"],
    toolsGr: ["Συλλογές", "Ανακάλυψη", "Πίνακας Έργου", "Εργαστήριο"],
  },
  bachelor: {
    icon: "🎒",
    labelEn: "Bachelor's Student",
    labelGr: "Προπτυχιακός Φοιτητής",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    quoteEn: "Every expert was once a beginner.",
    quoteGr: "Κάθε ειδικός ήταν κάποτε αρχάριος.",
    suggestedActionsEn: [
      { icon: "📤", label: "Upload Assignment", path: "/" },
      { icon: "🔭", label: "Discover Topics", path: "/discover" },
      { icon: "📂", label: "My Collections", path: "/collections" },
      { icon: "💬", label: "Join Community", path: "/community" },
    ],
    suggestedActionsGr: [
      { icon: "📤", label: "Ανέβασε Εργασία", path: "/" },
      { icon: "🔭", label: "Εξερεύνησε Θέματα", path: "/discover" },
      { icon: "📂", label: "Οι Συλλογές μου", path: "/collections" },
      { icon: "💬", label: "Κοινότητα", path: "/community" },
    ],
    toolsEn: ["Discover", "Collections", "Community", "Activity"],
    toolsGr: ["Ανακάλυψη", "Συλλογές", "Κοινότητα", "Δραστηριότητα"],
  },
  writer: {
    icon: "✍️",
    labelEn: "Writer / Author",
    labelGr: "Συγγραφέας",
    color: "#06b6d4",
    gradient: "linear-gradient(135deg, #06b6d4, #0891b2)",
    quoteEn: "Writing is thinking made visible.",
    quoteGr: "Η γραφή είναι η σκέψη που γίνεται ορατή.",
    suggestedActionsEn: [
      { icon: "📤", label: "Upload Manuscript", path: "/" },
      { icon: "✂️", label: "Segment & Analyze", path: "/" },
      { icon: "📂", label: "Chapter Collections", path: "/collections" },
      { icon: "🧠", label: "Idea Development", path: "/theory" },
    ],
    suggestedActionsGr: [
      { icon: "📤", label: "Ανέβασε Χειρόγραφο", path: "/" },
      { icon: "✂️", label: "Τμηματοποίηση", path: "/" },
      { icon: "📂", label: "Συλλογές Κεφαλαίων", path: "/collections" },
      { icon: "🧠", label: "Ανάπτυξη Ιδεών", path: "/theory" },
    ],
    toolsEn: ["Research Lab", "Collections", "Theory Hub", "Inline Comments"],
    toolsGr: ["Εργαστήριο", "Συλλογές", "Κέντρο Θεωρίας", "Σχόλια"],
  },
  startup: {
    icon: "🚀",
    labelEn: "Startup / Team",
    labelGr: "Startup / Ομάδα",
    color: "#f97316",
    gradient: "linear-gradient(135deg, #f97316, #ea580c)",
    quoteEn: "Move fast, think deep, build smart.",
    quoteGr: "Κινήσου γρήγορα, σκέψου βαθιά, χτίσε έξυπνα.",
    suggestedActionsEn: [
      { icon: "👥", label: "Create Team", path: "/teams" },
      { icon: "📋", label: "Project Board", path: "/board" },
      { icon: "🔍", label: "Peer Review", path: "/reviews" },
      { icon: "📊", label: "Analytics", path: "/research" },
    ],
    suggestedActionsGr: [
      { icon: "👥", label: "Δημιούργησε Ομάδα", path: "/teams" },
      { icon: "📋", label: "Πίνακας Έργου", path: "/board" },
      { icon: "🔍", label: "Αξιολόγηση", path: "/reviews" },
      { icon: "📊", label: "Αναλυτικά", path: "/research" },
    ],
    toolsEn: ["Teams", "Project Board", "Peer Review", "Collections"],
    toolsGr: ["Ομάδες", "Πίνακας Έργου", "Αξιολόγηση", "Συλλογές"],
  },
};

interface HomeRoleWelcomeProps {
  userEmail?: string | null;
  isCompact?: boolean;
}

export function HomeRoleWelcome({ userEmail, isCompact = false }: HomeRoleWelcomeProps) {
  const nav = useNavigate();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [role, setRole] = useState<UserRole>(loadUserRole);
  const [showPicker, setShowPicker] = useState(false);

  const handleRoleChange = useCallback((newRole: UserRole) => {
    setRole(newRole);
    saveUserRole(newRole);
    setShowPicker(false);
  }, []);

  const cfg = ROLE_CONFIG[role];
  const isGr = t("app.title") !== "Think!Hub";
  const label = isGr ? cfg.labelGr : cfg.labelEn;
  const quote = isGr ? cfg.quoteGr : cfg.quoteEn;
  const actions = isGr ? cfg.suggestedActionsGr : cfg.suggestedActionsEn;
  const displayName = userEmail?.split("@")[0] || (isGr ? "Ερευνητή" : "Researcher");

  if (isCompact) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "10px 14px", borderRadius: "12px",
        background: isDark ? `${cfg.color}12` : `${cfg.color}08`,
        border: `1px solid ${cfg.color}30`,
        position: "relative",
      }}>
        <span style={{ fontSize: "20px" }}>{cfg.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: cfg.color }}>
            {isGr ? "Καλώς ήρθες" : "Welcome back"}, {displayName}
          </div>
          <div style={{ fontSize: "11px", color: colors.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {label}
          </div>
        </div>
        <button
          onClick={() => setShowPicker(p => !p)}
          style={{ background: "none", border: `1px solid ${cfg.color}44`, borderRadius: "6px", padding: "3px 8px", fontSize: "11px", color: cfg.color, cursor: "pointer" }}
        >
          ✏️
        </button>
        {showPicker && (
          <RolePicker current={role} onChange={handleRoleChange} isDark={isDark} colors={colors} isGr={isGr} onClose={() => setShowPicker(false)} />
        )}
      </div>
    );
  }

  return (
    <div style={{
      padding: "16px 20px", borderRadius: "14px",
      background: isDark
        ? `linear-gradient(135deg, ${cfg.color}12 0%, ${cfg.color}06 100%)`
        : `linear-gradient(135deg, ${cfg.color}08 0%, ${cfg.color}04 100%)`,
      border: `1px solid ${cfg.color}28`,
      boxShadow: isDark ? "none" : `0 2px 16px ${cfg.color}10`,
      position: "relative",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>

        {/* Role icon */}
        <div style={{
          width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
          background: cfg.gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "20px", boxShadow: `0 4px 12px ${cfg.color}44`,
        }}>
          {cfg.icon}
        </div>

        {/* Welcome text */}
        <div style={{ flex: 1, minWidth: "200px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: colors.textPrimary }}>
              {isGr ? "Καλώς ήρθες" : "Welcome back"}, {displayName}
            </h2>
            <button
              onClick={() => setShowPicker(p => !p)}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`,
                color: cfg.color, cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${cfg.color}28`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${cfg.color}18`; }}
            >
              {cfg.icon} {label} ▾
            </button>
          </div>
          <p style={{ margin: "0 0 14px", fontSize: "13px", color: colors.textSecondary, fontStyle: "italic" }}>
            "{quote}"
          </p>

          {/* Suggested actions */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {actions.map(action => (
              <button
                key={action.path + action.label}
                onClick={() => nav(action.path)}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                  background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                  border: `1px solid ${colors.borderPrimary}`,
                  color: colors.textPrimary, cursor: "pointer", transition: "all 0.15s",
                  boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${cfg.color}15`;
                  e.currentTarget.style.borderColor = `${cfg.color}50`;
                  e.currentTarget.style.color = cfg.color;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#ffffff";
                  e.currentTarget.style.borderColor = colors.borderPrimary;
                  e.currentTarget.style.color = colors.textPrimary;
                }}
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Role picker dropdown */}
      {showPicker && (
        <RolePicker current={role} onChange={handleRoleChange} isDark={isDark} colors={colors} isGr={isGr} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}

// ─── Role Picker Dropdown ─────────────────────────────────────
interface RolePickerProps {
  current: UserRole;
  onChange: (role: UserRole) => void;
  isDark: boolean;
  colors: ThemeColors;
  isGr: boolean;
  onClose: () => void;
}

function RolePicker({ current, onChange, isDark, colors, isGr, onClose }: RolePickerProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 999 }}
      />
      <div style={{
        position: "absolute", top: "calc(100% + 8px)", left: "0", zIndex: 1000,
        background: isDark ? "#1a1a2e" : "#ffffff",
        border: `1px solid ${colors.borderPrimary}`,
        borderRadius: "14px", padding: "8px",
        boxShadow: isDark ? "0 16px 48px rgba(0,0,0,0.5)" : "0 16px 48px rgba(0,0,0,0.12)",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px",
        minWidth: "280px",
      }}>
        <div style={{ gridColumn: "1/-1", padding: "6px 8px 10px", fontSize: "11px", fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {isGr ? "Επιλέξτε Ρόλο" : "Select Your Role"}
        </div>
        {(Object.entries(ROLE_CONFIG) as [UserRole, RoleConfig][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 10px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
              background: current === key ? `${cfg.color}18` : "transparent",
              border: current === key ? `1px solid ${cfg.color}44` : "1px solid transparent",
              color: current === key ? cfg.color : colors.textSecondary,
              cursor: "pointer", transition: "all 0.15s", textAlign: "left",
            }}
            onMouseEnter={e => { if (current !== key) { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"; } }}
            onMouseLeave={e => { if (current !== key) { e.currentTarget.style.background = "transparent"; } }}
          >
            <span style={{ fontSize: "16px" }}>{cfg.icon}</span>
            <span>{isGr ? cfg.labelGr : cfg.labelEn}</span>
            {current === key && <span style={{ marginLeft: "auto", fontSize: "10px" }}>✓</span>}
          </button>
        ))}
      </div>
    </>
  );
}

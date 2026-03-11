// src/components/home/HomeHeroCard.tsx
// Unified hero + identity card.
// Merges: gradient hero design, progress rings, XP/streak status bar (from HomeHeroCard)
//   with: role icon, role picker dropdown, motivational quote, role-specific CTAs (from HomeRoleWelcome).
// The bottom HomeRoleWelcome in the community section only shows social nav, no duplicate identity.
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useUserData } from "../../context/UserDataContext";
import {
  type UserRole,
  type RoleConfig,
  loadUserRole,
  saveUserRole,
  ROLE_CONFIG,
} from "./HomeRoleWelcome";

type RoleAction = RoleConfig["suggestedActionsEn"][number];

export interface HomeHeroCardProps {
  userEmail: string | null;
  uploadsList: any[];
  parsedCount: number;
  totalSegments: number;
  onUploadClick: () => void;
  onSearchClick: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(isGr: boolean): string {
  const h = new Date().getHours();
  if (isGr) {
    if (h < 12) return "Καλημέρα";
    if (h < 17) return "Καλό απόγευμα";
    return "Καλησπέρα";
  }
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function readStreak(): number {
  try {
    const stored = localStorage.getItem("research-streak");
    if (!stored) return 0;
    const { count, lastDate } = JSON.parse(stored);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    return lastDate === today || lastDate === yesterday ? (count ?? 0) : 0;
  } catch { return 0; }
}

// ── Circular SVG progress ring ───────────────────────────────────────────────
function ProgressRing({ pct, size = 52, stroke = 4, color, label }: {
  pct: number; size?: number; stroke?: number; color: string; label: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontSize: "7.5px", color: "rgba(255,255,255,0.75)", marginTop: "1px", lineHeight: 1 }}>{label}</span>
      </div>
    </div>
  );
}

// ── Role picker dropdown (Portal, viewport-aware) ───────────────────────────
function RolePickerDropdown({ current, onSelect, onClose, isGr, isDark, anchorEl }: {
  current: UserRole; onSelect: (r: UserRole) => void; onClose: () => void;
  isGr: boolean; isDark: boolean; anchorEl: HTMLElement | null;
}) {
  const bg = isDark ? "rgba(15,15,30,0.97)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)";
  const headerColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.38)";
  const defaultBtnColor = isDark ? "rgba(255,255,255,0.72)" : "#374151";
  const hoverBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";

  const [pos, setPos] = useState({ top: 0, left: 0, openUp: false });
  useEffect(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const dropH = 320; // estimated dropdown height
    const dropW = 300;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < dropH + 16;
    const left = Math.min(rect.left, window.innerWidth - dropW - 12);
    const top = openUp ? rect.top - dropH - 8 : rect.bottom + 8;
    setPos({ top, left, openUp });
  }, [anchorEl]);

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9998 }} />
      <div style={{
        position: "fixed", top: pos.top, left: pos.left, zIndex: 9999,
        background: bg,
        backdropFilter: "blur(20px)",
        border: `1px solid ${border}`,
        borderRadius: "16px", padding: "10px",
        boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.6)" : "0 16px 48px rgba(0,0,0,0.18)",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px",
        minWidth: "296px",
        maxHeight: "80vh", overflowY: "auto",
      }}>
        <div style={{ gridColumn: "1/-1", padding: "4px 8px 10px", fontSize: "10.5px", fontWeight: 700, color: headerColor, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {isGr ? "Επιλογή Ρόλου" : "Select Role"}
        </div>
        {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([key, cfg]) => (
          <button key={key} onClick={() => onSelect(key)} style={{
            display: "flex", alignItems: "center", gap: "9px",
            padding: "10px 12px", borderRadius: "11px", fontSize: "12.5px", fontWeight: 600,
            background: current === key ? `${cfg.color}18` : "transparent",
            border: current === key ? `1.5px solid ${cfg.color}55` : "1.5px solid transparent",
            color: current === key ? cfg.color : defaultBtnColor,
            cursor: "pointer", transition: "all 0.12s", textAlign: "left",
          }}
            onMouseEnter={e => { if (current !== key) { e.currentTarget.style.background = hoverBg; e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"; } }}
            onMouseLeave={e => { if (current !== key) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; } }}
          >
            <span style={{ fontSize: "16px", lineHeight: 1 }}>{cfg.icon}</span>
            <span style={{ flex: 1 }}>{isGr ? cfg.labelGr : cfg.labelEn}</span>
            {current === key && <span style={{ fontSize: "12px", opacity: 0.7, color: cfg.color }}>✓</span>}
          </button>
        ))}
      </div>
    </>,
    document.body
  );
}

// ── Onboarding 3-step empty state ────────────────────────────────────────────
function OnboardingSteps({ onUploadClick, onExplore, isGr }: {
  onUploadClick: () => void;
  onExplore: () => void;
  isGr: boolean;
}) {
  const steps = [
    {
      num: 1, icon: "📤",
      title: isGr ? "Μεταφόρτωση" : "Upload",
      desc: isGr ? "Ανεβάστε το πρώτο σας έγγραφο (.docx, .pdf)" : "Upload your first document (.docx, .pdf)",
      cta: isGr ? "Μεταφόρτωση Εγγράφου" : "Upload Document",
      active: true, action: onUploadClick,
    },
    {
      num: 2, icon: "✂️",
      title: isGr ? "Κατάτμηση" : "Segment",
      desc: isGr ? "Το σύστημα αναλύει και κατατμεί αυτόματα" : "The system analyses and auto-segments it",
      cta: isGr ? "Διαθέσιμο μετά το βήμα 1" : "Available after step 1",
      active: false, action: undefined,
    },
    {
      num: 3, icon: "🔬",
      title: isGr ? "Εξερεύνηση" : "Explore",
      desc: isGr ? "Αξιοποιήστε στατιστικά, AI αναλύσεις, κοινότητα" : "Use stats, AI insights & community features",
      cta: isGr ? "Εξερεύνηση Χώρου" : "Explore Workspace",
      active: false, action: onExplore,
    },
  ];

  return (
    <div style={{ marginBottom: "10px" }}>
      {/* Prompt line */}
      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", fontStyle: "italic", margin: "0 0 10px", lineHeight: 1.5 }}>
        {isGr ? "✨ Ξεκινήστε σε 3 βήματα —" : "✨ Get started in 3 steps —"}
      </p>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {steps.map(s => (
          <div key={s.num} style={{
            flex: "1 1 140px", padding: "10px 12px", borderRadius: "12px",
            background: s.active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)",
            border: s.active ? "1px solid rgba(255,255,255,0.32)" : "1px solid rgba(255,255,255,0.10)",
            opacity: s.active ? 1 : 0.62,
            transition: "all 0.2s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
              <span style={{
                width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                background: s.active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)",
                color: s.active ? "#6366f1" : "rgba(255,255,255,0.6)",
                fontSize: "9px", fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{s.num}</span>
              <span style={{ fontSize: "13px" }}>{s.icon}</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff" }}>{s.title}</span>
            </div>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", margin: "0 0 8px", lineHeight: 1.4 }}>
              {s.desc}
            </p>
            <button
              onClick={s.action}
              disabled={!s.active && s.num === 2}
              style={{
                width: "100%", padding: "5px 8px", borderRadius: "8px",
                background: s.active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.10)",
                border: "none",
                color: s.active ? "#6366f1" : "rgba(255,255,255,0.45)",
                fontSize: "10.5px", fontWeight: 700, cursor: s.active || s.num === 3 ? "pointer" : "default",
                transition: "all 0.14s ease",
              }}
              onMouseEnter={e => { if (s.active || s.num === 3) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {s.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function HomeHeroCard({
  userEmail, uploadsList, parsedCount, totalSegments, onUploadClick, onSearchClick,
}: HomeHeroCardProps) {
  const nav = useNavigate();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { stats, activity } = useUserData();

  const [role, setRole] = useState<UserRole>(loadUserRole);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const rolePickerBtnRef = useRef<HTMLButtonElement>(null);

  const handleRoleSelect = useCallback((r: UserRole) => {
    setRole(r);
    saveUserRole(r);
    setShowRolePicker(false);
  }, []);

  const isGr = t("app.title") !== "Think!Hub";
  const cfg = ROLE_CONFIG[role];
  const roleLabel = isGr ? cfg.labelGr : cfg.labelEn;
  const quote = isGr ? cfg.quoteGr : cfg.quoteEn;
  const roleActions = isGr ? cfg.suggestedActionsGr : cfg.suggestedActionsEn;

  const displayName = useMemo(() => {
    if (!userEmail) return isGr ? "Ερευνητή" : "Researcher";
    const local = userEmail.split("@")[0];
    return local.split(/[._-]/)[0].charAt(0).toUpperCase() + local.split(/[._-]/)[0].slice(1);
  }, [userEmail, isGr]);

  const streakDays = readStreak();

  const parsedPct = uploadsList.length > 0
    ? Math.round((parsedCount / uploadsList.length) * 100) : 0;

  const totalXP = useMemo(() => (
    stats.documentsUploaded * 20 + stats.segmentsCreated * 5 +
    stats.commentsPosted * 8 + stats.reviewsCompleted * 25 +
    stats.collectionsCreated * 15 + stats.teamsJoined * 30 + activity.length * 2
  ), [stats, activity]);

  const LEVELS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000];
  let lvl = 1;
  for (let i = 0; i < LEVELS.length; i++) { if (totalXP >= LEVELS[i]) lvl = i + 1; }
  const nextLevelXP = LEVELS[lvl] ?? LEVELS[LEVELS.length - 1];
  const currLevelXP = LEVELS[lvl - 1] ?? 0;
  const xpPct = nextLevelXP > currLevelXP
    ? Math.min(100, Math.round(((totalXP - currLevelXP) / (nextLevelXP - currLevelXP)) * 100)) : 100;

  const hasWork = uploadsList.length > 0;

  return (
    <div className="home-hero-gradient-card" style={{
      padding: "20px 24px", borderRadius: "18px",
      background: isDark
        ? `linear-gradient(135deg, ${cfg.color}28 0%, rgba(139,92,246,0.14) 50%, rgba(14,14,26,0.97) 100%)`
        : cfg.gradient,
      border: isDark ? `1px solid ${cfg.color}40` : "none",
      boxShadow: isDark
        ? `0 8px 32px ${cfg.color}25, 0 0 0 1px ${cfg.color}18 inset`
        : `0 12px 40px ${cfg.color}45`,
      position: "relative", overflow: "visible",
    }}>
      {/* Scoped white-text override: beats ThemeContext html[data-theme=light] rules via higher specificity (0,3,0,1) */}
      <style>{`
        html[data-theme="light"] .home-hero-gradient-card *:not(.home-hero-cta-primary):not(.home-hero-cta-primary *) {
          color: #ffffff !important;
        }
        html[data-theme="light"] .home-hero-gradient-card button:not(.home-hero-cta-primary) {
          background: rgba(255,255,255,0.15) !important;
          border-color: rgba(255,255,255,0.30) !important;
        }
        html[data-theme="light"] .home-hero-gradient-card .home-hero-cta-primary {
          background: #ffffff !important;
          color: ${cfg.color} !important;
          border: none !important;
        }
        html[data-theme="light"] .home-hero-gradient-card .home-hero-cta-primary * {
          color: ${cfg.color} !important;
        }
      `}</style>
      {/* Orb decorations — own overflow:hidden layer so they stay clipped to the card */}
      <div style={{ position: "absolute", inset: 0, borderRadius: "18px", overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "160px", height: "160px", borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-30px", left: "32%", width: "120px", height: "120px", borderRadius: "50%", background: `radial-gradient(circle, ${cfg.color}22 0%, transparent 70%)` }} />
      </div>

      {/* ── TOP ROW: left identity | right rings ───────────────────── */}
      <div className="home-hero-inner-row" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>

        {/* LEFT: greeting + name + role badge + quote + CTAs */}
        <div style={{ flex: 1, minWidth: "220px" }}>

          {/* Greeting line */}
          <div style={{ fontSize: "12px", fontWeight: 500, color: "rgba(255,255,255,0.65)", marginBottom: "2px", letterSpacing: "0.02em" }}>
            {getGreeting(isGr)} 👋
          </div>

          {/* Name + role badge (clickable to open picker) */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px", flexWrap: "wrap", position: "relative" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", margin: 0, lineHeight: 1.15, letterSpacing: "-0.5px" }}>
              {displayName}
            </h2>
            <button
              ref={rolePickerBtnRef}
              onClick={() => setShowRolePicker(p => !p)}
              title={isGr ? "Αλλαγή ρόλου" : "Change role"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.04em",
                padding: "3px 10px", borderRadius: "20px",
                background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)",
                color: "#ffffff", cursor: "pointer", transition: "background 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.28)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
            >
              <span style={{ fontSize: "13px" }}>{cfg.icon}</span>
              {roleLabel} ▾
            </button>
            {showRolePicker && (
              <RolePickerDropdown
                current={role} onSelect={handleRoleSelect}
                onClose={() => setShowRolePicker(false)} isGr={isGr} isDark={isDark}
                anchorEl={rolePickerBtnRef.current}
              />
            )}
          </div>

          {/* Motivational quote — hidden in empty state */}
          {hasWork && (
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", fontStyle: "italic", margin: "0 0 8px", lineHeight: 1.5 }}>
              "{quote}"
            </p>
          )}

          {/* Context stats line — only when workspace has documents */}
          {hasWork && (
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", margin: "0 0 12px", lineHeight: 1.4 }}>
              {`${uploadsList.length} ${t("home.totalDocuments") || "docs"} · ${totalSegments} ${t("home.totalSegments") || "segs"} · ${streakDays > 0 ? `🔥 ${streakDays}d` : "0d"} streak`}
            </p>
          )}

          {/* Empty-state onboarding guide */}
          {!hasWork && (
            <OnboardingSteps
              onUploadClick={onUploadClick}
              onExplore={() => nav("/discover")}
              isGr={isGr}
            />
          )}

          {/* Role-specific CTA buttons — only shown when workspace is active */}
          {hasWork && <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
            {/* Search — primary CTA (Upload available via ActionBar/FAB) */}
            <button onClick={onSearchClick} style={{
              display: "flex", alignItems: "center", gap: "5px",
              padding: "7px 13px", borderRadius: "9px",
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#ffffff", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              transition: "all 0.16s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "12px", height: "12px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {t("action.search") || "Search"} <span style={{ opacity: 0.55, fontSize: "9.5px" }} title="Ctrl+S (Win) · ⌘S (Mac)">Ctrl+S</span>
            </button>

            {/* Role-specific actions 2..4 as ghost buttons */}
            {roleActions.slice(1, 4).map((action: RoleAction) => (
              <button
                key={action.label}
                onClick={() => action.path === "/" ? onUploadClick() : nav(action.path)}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "7px 12px", borderRadius: "9px",
                  background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.18)",
                  color: "rgba(255,255,255,0.82)", fontSize: "12px", fontWeight: 600,
                  cursor: "pointer", transition: "all 0.16s ease", whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>}
        </div>

        {/* RIGHT: Progress rings */}
        <div className="home-hero-rings" style={{
          display: "flex", gap: "14px", alignItems: "center", flexShrink: 0,
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: "14px", padding: "12px 16px",
        }}>
          <ProgressRing pct={parsedPct} color="#34d399" label={isGr ? "ανάλυση" : "parsed"} />
          <div style={{ width: "1px", height: "36px", background: "rgba(255,255,255,0.12)" }} />
          <ProgressRing pct={xpPct} color="#fbbf24" label="XP" />
          <div style={{ width: "1px", height: "36px", background: "rgba(255,255,255,0.12)" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            <span style={{ fontSize: "18px", lineHeight: 1 }}>{streakDays >= 7 ? "🔥" : streakDays > 0 ? "✨" : "💤"}</span>
            <span style={{ fontSize: "14px", fontWeight: 800, color: streakDays > 0 ? "#fb923c" : "rgba(255,255,255,0.35)", lineHeight: 1 }}>{streakDays}</span>
            <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)", lineHeight: 1 }}>{isGr ? "ημέρες" : "days"}</span>
          </div>
        </div>
      </div>

      {/* ── BOTTOM STATUS BAR ─────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "14px",
        marginTop: "14px", paddingTop: "11px",
        borderTop: "1px solid rgba(255,255,255,0.11)", flexWrap: "wrap",
      }}>
        {[
          { icon: "📄", label: `${uploadsList.length} ${isGr ? "έγγρ." : "docs"}`, color: "#a5f3fc" },
          { icon: "✂️", label: `${totalSegments} ${isGr ? "τμήμ." : "segs"}`, color: "#c4b5fd" },
          { icon: "🏆", label: `${stats.reviewsCompleted} ${isGr ? "αξιολ." : "reviews"}`, color: "#86efac" },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: item.color, fontWeight: 600 }}>
            <span style={{ fontSize: "12px" }}>{item.icon}</span>
            {item.label}
          </div>
        ))}

        <button
          onClick={() => nav("/discover")}
          style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px",
            fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.55)",
            background: "transparent", border: "none", cursor: "pointer", padding: "2px 4px",
            borderRadius: "5px", transition: "color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#ffffff"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
        >
          {t("home.exploreWorkspace") || "Explore workspace"}
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "11px", height: "11px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

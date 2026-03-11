import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Undo2 } from "lucide-react";
import { useIsMobile } from "../../hooks/use-mobile";
import GlobalBurgerMenu from "../GlobalBurgerMenu";

interface PageShellProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** @deprecated kept for backward compat — no longer used */
  variant?: string;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  headerRef?: React.RefObject<HTMLDivElement | null>;
  headerHighlightStyle?: React.CSSProperties;
  /** @deprecated use page-header CSS class instead */
  topOffset?: number;
  fullBleed?: boolean;
  /** Hide the Home button (e.g. on the Home page itself) */
  hideHomeButton?: boolean;
}

/**
 * PageShell — Unified page wrapper providing:
 * 1. Consistent background via HSL tokens
 * 2. GlobalBurgerMenu (fixed top-left)
 * 3. Back button (fixed far-left) & Home button (fixed far-right)
 * 4. page-header with built-in 72px top padding
 * 5. Responsive max-width container
 */
export const PageShell: React.FC<PageShellProps> = ({
  title,
  subtitle,
  icon,
  actions,
  children,
  containerRef,
  headerRef,
  headerHighlightStyle,
  fullBleed,
  hideHomeButton,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isHome = location.pathname === "/" || location.pathname === "/home" || location.pathname === "/home-compact";

  return (
    <div
      ref={containerRef}
      className="transition-colors duration-300"
      style={{
        minHeight: "100vh",
        background: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
      }}
    >
      <GlobalBurgerMenu />

      {/* Back button — far LEFT */}
      {!isHome && (
        <button
          onClick={() => navigate(-1)}
          title="Πίσω"
          className="animate-fade-in"
          style={{
            position: "fixed",
            top: "18px",
            left: isMobile ? "16px" : "72px",
            zIndex: 10001,
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--card) / 0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 8px hsl(var(--foreground) / 0.08)",
          }}
        >
          <Undo2 className="w-4 h-4" style={{ color: "hsl(var(--foreground))" }} />
        </button>
      )}

      {/* Home button — far RIGHT */}
      {!hideHomeButton && !isHome && (
        <button
          onClick={() => navigate("/")}
          title="Αρχική"
          className="animate-fade-in"
          style={{
            position: "fixed",
            top: "18px",
            right: isMobile ? "16px" : "24px",
            zIndex: 10001,
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--card) / 0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 8px hsl(var(--foreground) / 0.08)",
          }}
        >
          <Home className="w-4 h-4" style={{ color: "hsl(var(--foreground))" }} />
        </button>
      )}

      <div className={`page-shell${fullBleed ? " page-shell--full" : ""}`}>
        {title && (
          <div
            ref={headerRef}
            className="page-header"
            style={headerHighlightStyle}
          >
            <div>
              <h1 className="page-title" style={{ marginBottom: "6px" }}>
                {icon}
                {icon ? " " : null}
                {title}
              </h1>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="page-actions">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

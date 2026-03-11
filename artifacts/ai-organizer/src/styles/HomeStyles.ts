// src/styles/HomeStyles.ts
// Clean, minimal CSS-in-JS styles for the Home page
// All theming handled by CSS variables from index.css — NO !important overrides

export interface HomeStyleColors {
  textPrimary: string;
  textSecondary: string;
  borderPrimary: string;
  bgSecondary: string;
}

export function getHomeStyles(_colors: HomeStyleColors): string {
  return `
    /* ── Keyframe Animations ──────────────────────────────────────────── */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes dropdownFadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .homeShell {
      animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* ── Sidebar-aware smooth content transition ─────────────────────── */
    .home-shell-content {
      transition: padding-left 0.22s cubic-bezier(0.4,0,0.2,1);
    }

    /* ── Enhanced button ─────────────────────────────────────────────── */
    .enhanced-button {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: center;
      position: relative;
      overflow: hidden;
    }
    .enhanced-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: left 0.5s;
    }
    .enhanced-button:hover::before { left: 100%; }
    .enhanced-button:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 8px 24px hsl(var(--primary) / 0.2);
    }
    .enhanced-button:active {
      transform: translateY(0) scale(0.98);
    }

    /* ── Card panels ─────────────────────────────────────────────────── */
    .card-panel {
      background: hsl(var(--card));
      backdrop-filter: blur(12px);
      border: 1px solid hsl(var(--border));
      border-radius: 16px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .card-panel:hover {
      background: hsl(var(--accent) / 0.05);
      border-color: hsl(var(--primary) / 0.2);
      transform: translateY(-2px);
      box-shadow: 0 12px 32px hsl(var(--primary) / 0.08);
    }

    /* ── Stat grid ───────────────────────────────────────────────────── */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }
    .stat-card {
      padding: 14px 16px;
      border-radius: 12px;
      border: 1px solid hsl(var(--border));
      background: hsl(var(--card));
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: 0 1px 4px hsl(var(--foreground) / 0.04);
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      border-color: hsl(var(--primary) / 0.25);
      box-shadow: 0 6px 20px hsl(var(--primary) / 0.1);
    }
    .stat-value {
      font-size: 16px;
      font-weight: 600;
      color: hsl(var(--foreground));
      letter-spacing: -0.02em;
    }
    .stat-label {
      font-size: 11px;
      color: hsl(var(--muted-foreground));
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }

    /* ── Pill badges ─────────────────────────────────────────────────── */
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      border: 1px solid hsl(var(--border));
      background: hsl(var(--muted));
    }

    /* ── Quick action grid ───────────────────────────────────────────── */
    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
    }
    .action-tile {
      padding: 9px 14px;
      border-radius: 12px;
      border: 1px solid hsl(var(--border));
      background: hsl(var(--card));
      color: hsl(var(--foreground));
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      transition: all 0.2s ease;
    }
    .action-tile:hover {
      transform: translateY(-1px);
      border-color: hsl(var(--primary) / 0.35);
      box-shadow: 0 6px 18px hsl(var(--primary) / 0.12);
    }

    /* ── Suggestion item ─────────────────────────────────────────────── */
    .suggestion-item {
      padding: 12px 16px;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border-left: 3px solid transparent;
    }
    .suggestion-item:hover,
    .suggestion-item.highlighted {
      background-color: hsl(var(--primary) / 0.1);
      border-left-color: hsl(var(--primary));
      transform: translateX(4px);
    }

    /* ── Status indicators ───────────────────────────────────────────── */
    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      backdrop-filter: blur(8px);
    }
    .status-indicator.success {
      background: hsl(var(--success) / 0.12);
      color: hsl(var(--success));
      border: 1px solid hsl(var(--success) / 0.25);
    }
    .status-indicator.pending {
      background: hsl(var(--warning) / 0.12);
      color: hsl(var(--warning));
      border: 1px solid hsl(var(--warning) / 0.25);
    }
    .status-indicator.error {
      background: hsl(var(--destructive) / 0.12);
      color: hsl(var(--destructive));
      border: 1px solid hsl(var(--destructive) / 0.25);
    }

    /* ── Floating action ─────────────────────────────────────────────── */
    .floating-action {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 100;
      animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* ── Section headers ─────────────────────────────────────────────── */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid hsl(var(--border));
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: hsl(var(--foreground));
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .section-subtitle {
      font-size: 14px;
      color: hsl(var(--muted-foreground));
      margin-top: 4px;
    }

    /* ── Scrollbar theming ───────────────────────────────────────────── */
    .dark ::-webkit-scrollbar,
    [data-theme="dashboard"] ::-webkit-scrollbar {
      width: 6px; height: 6px;
    }
    .dark ::-webkit-scrollbar-track,
    [data-theme="dashboard"] ::-webkit-scrollbar-track {
      background: hsl(var(--muted) / 0.3);
    }
    .dark ::-webkit-scrollbar-thumb,
    [data-theme="dashboard"] ::-webkit-scrollbar-thumb {
      background: hsl(var(--muted-foreground) / 0.3);
      border-radius: 3px;
    }
    .dark ::-webkit-scrollbar-thumb:hover,
    [data-theme="dashboard"] ::-webkit-scrollbar-thumb:hover {
      background: hsl(var(--muted-foreground) / 0.5);
    }
    :root:not(.dark) ::-webkit-scrollbar {
      width: 6px; height: 6px;
    }
    :root:not(.dark) ::-webkit-scrollbar-track {
      background: hsl(var(--muted) / 0.5);
    }
    :root:not(.dark) ::-webkit-scrollbar-thumb {
      background: hsl(var(--muted-foreground) / 0.25);
      border-radius: 3px;
    }
    :root:not(.dark) ::-webkit-scrollbar-thumb:hover {
      background: hsl(var(--muted-foreground) / 0.4);
    }

    /* ── Responsive / Mobile ─────────────────────────────────────────── */
    @media (max-width: 900px) {
      .home-container {
        padding-left: 16px !important;
        padding-right: 16px !important;
        padding-top: 20px !important;
      }
      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }

    /* Hide HomeSideNav on mobile */
    @media (max-width: 768px) {
      .home-sidenav { display: none !important; }
      .home-section-nav { display: none !important; }
      .home-shell-content {
        padding-left: 16px !important;
        transition: none !important;
      }
      .home-hero-inner-row {
        flex-direction: column !important;
        gap: 16px !important;
      }
      .home-hero-rings { align-self: flex-start !important; }
      .fab-upload, .fab-command-palette { display: none !important; }
      .ai-chat-fab-wrapper { bottom: 16px !important; right: 16px !important; }
      .fab-screenshot { top: 60px !important; right: 12px !important; }
    }

    /* Tablet: compact section nav */
    @media (min-width: 769px) and (max-width: 1024px) {
      .home-section-nav { min-width: 140px !important; max-width: 160px !important; }
    }

    /* ── Focus management — accessible focus rings ───────────────────── */
    .home-container button:focus-visible {
      outline: 2px solid hsl(var(--ring));
      outline-offset: 2px;
    }
    .home-container button:focus:not(:focus-visible) {
      outline: none;
    }
  `;
}

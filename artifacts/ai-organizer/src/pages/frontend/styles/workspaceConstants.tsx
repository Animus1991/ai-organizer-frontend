// src/pages/frontend/styles/workspaceConstants.tsx
// Cleaned: removed flex utility constants, replaced custom SVGs with lucide-react
import { ChevronLeft, ChevronRight } from "lucide-react";

// ── Types ──
export type WorkspaceUIMode = "compact" | "expanded";
export type SidebarWidth = "narrow" | "wide";
export type LeftPanelId = "documents" | "search" | "segments";
export type HubSectionId =
  | "ai"
  | "engagement"
  | "research"
  | "performance"
  | "data"
  | "notifications"
  | "search"
  | "pinned";

export type StatsPayload = {
  docs?: number;
  segments?: number;
  vectors?: number;
};

export const UI_MODE_STORAGE_KEY = "thinkingWorkspaceUIMode";

// ── Icons (using lucide-react instead of custom SVGs) ──
export function ChevronLeftIcon() {
  return <ChevronLeft size={18} aria-hidden="true" />;
}

export function ChevronRightIcon() {
  return <ChevronRight size={18} aria-hidden="true" />;
}

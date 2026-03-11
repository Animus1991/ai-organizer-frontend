// Settings type definitions

export type SettingsSection =
  | "general"
  | "appearance"
  | "language"
  | "notifications"
  | "shortcuts"
  | "security"
  | "billing"
  | "integrations"
  | "developer"
  | "privacy"
  | "export"
  | "about";

export interface UserSettings {
  autoSave: boolean;
  autoSaveInterval: number;
  compactMode: boolean;
  animations: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
  emailNotifications: boolean;
  showPreviewInNotifications: boolean;
  defaultStartPage: string;
  fontSize: "small" | "medium" | "large";
}

export const defaultSettings: UserSettings = {
  autoSave: true,
  autoSaveInterval: 30,
  compactMode: false,
  animations: true,
  soundEnabled: true,
  desktopNotifications: true,
  emailNotifications: false,
  showPreviewInNotifications: true,
  defaultStartPage: "/",
  fontSize: "medium",
};

export interface SettingsNavItem {
  id: SettingsSection;
  icon: string;
  label: string;
  group: "Preferences" | "Account" | "Platform";
}

export interface SessionInfo {
  device: string;
  loc: string;
  time: string;
  current: boolean;
}

export const DEFAULT_SESSIONS: SessionInfo[] = [
  { device: "Chrome on macOS", loc: "Athens, GR", time: "Active now", current: true },
  { device: "Firefox on Windows", loc: "Berlin, DE", time: "2 hours ago", current: false },
  { device: "Safari on iPhone", loc: "Athens, GR", time: "Yesterday", current: false },
];

export const KEYBOARD_SHORTCUTS = [
  { keys: "Ctrl + K", description: "Open Command Palette" },
  { keys: "Ctrl + S", description: "Save Document" },
  { keys: "Ctrl + F", description: "Search" },
  { keys: "Ctrl + Z", description: "Undo" },
  { keys: "Ctrl + Shift + Z", description: "Redo" },
  { keys: "Ctrl + /", description: "Toggle Comments" },
  { keys: "Escape", description: "Close Modal/Cancel" },
] as const;

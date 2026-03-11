/**
 * CommandPalette - Global command palette accessible via Ctrl+K
 * Provides quick access to all app features, navigation, and actions
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// Command types
export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  category: CommandCategory;
  keywords?: string[];
  action: () => void | Promise<void>;
  shortcut?: string;
  disabled?: boolean;
}

export type CommandCategory = 
  | "navigation"
  | "document"
  | "research"
  | "library"
  | "settings"
  | "action"
  | "recent";

// Category labels and icons
const categoryMeta: Record<CommandCategory, { label: string; icon: string }> = {
  navigation: { label: "Navigation", icon: "🧭" },
  document: { label: "Documents", icon: "📄" },
  research: { label: "Research", icon: "🔬" },
  library: { label: "Library", icon: "📚" },
  settings: { label: "Settings", icon: "⚙️" },
  action: { label: "Actions", icon: "⚡" },
  recent: { label: "Recent", icon: "🕐" },
};

// Context for command registration
interface CommandPaletteContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  registerCommand: (command: Command) => void;
  unregisterCommand: (id: string) => void;
  commands: Command[];
}

const CommandPaletteContext = React.createContext<CommandPaletteContextType | null>(null);

// Provider props
interface CommandPaletteProviderProps {
  children: React.ReactNode;
}

export const CommandPaletteProvider: React.FC<CommandPaletteProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [commands, setCommands] = useState<Command[]>([]);
  const navigate = useNavigate();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const registerCommand = useCallback((command: Command) => {
    setCommands((prev) => {
      const filtered = prev.filter((c) => c.id !== command.id);
      return [...filtered, command];
    });
  }, []);

  const unregisterCommand = useCallback((id: string) => {
    setCommands((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Default navigation commands
  useEffect(() => {
    const defaultCommands: Command[] = [
      {
        id: "nav-home",
        label: "Go to Home",
        description: "Navigate to the home dashboard",
        icon: "🏠",
        category: "navigation",
        keywords: ["home", "dashboard", "main"],
        action: () => { navigate("/"); close(); },
        shortcut: "G H",
      },
      {
        id: "nav-research",
        label: "Go to Research Hub",
        description: "Open the research hub for literature search",
        icon: "🔬",
        category: "navigation",
        keywords: ["research", "hub", "literature", "search", "papers"],
        action: () => { navigate("/research"); close(); },
        shortcut: "G R",
      },
      {
        id: "nav-library",
        label: "Go to Library",
        description: "Browse your saved segments and notes",
        icon: "📚",
        category: "navigation",
        keywords: ["library", "segments", "notes", "saved"],
        action: () => { navigate("/library"); close(); },
        shortcut: "G L",
      },
      {
        id: "nav-recycle",
        label: "Go to Recycle Bin",
        description: "View deleted items",
        icon: "🗑️",
        category: "navigation",
        keywords: ["recycle", "bin", "deleted", "trash"],
        action: () => { navigate("/recycle-bin"); close(); },
      },
      {
        id: "nav-theory-hub",
        label: "Go to Theory Hub",
        description: "Scientific theory development workspace",
        icon: "🏗️",
        category: "navigation",
        keywords: ["theory", "hub", "science", "claims", "evidence"],
        action: () => { navigate("/theory-hub"); close(); },
        shortcut: "G T",
      },
      {
        id: "nav-research-lab",
        label: "Go to Research Lab",
        description: "4-panel scientific research workspace",
        icon: "🧪",
        category: "navigation",
        keywords: ["research", "lab", "workspace", "panels"],
        action: () => { navigate("/research-lab"); close(); },
      },
      {
        id: "nav-workspace",
        label: "Go to Thinking Workspace",
        description: "Document editing and analysis workspace",
        icon: "🧠",
        category: "navigation",
        keywords: ["workspace", "thinking", "editor", "frontend"],
        action: () => { navigate("/frontend"); close(); },
        shortcut: "G W",
      },
      {
        id: "nav-issues",
        label: "Go to Research Issues",
        description: "Track research tasks, questions, and hypotheses",
        icon: "📋",
        category: "navigation",
        keywords: ["issues", "tasks", "bugs", "questions", "hypotheses"],
        action: () => { navigate("/issues"); close(); },
        shortcut: "G I",
      },
      {
        id: "nav-projects",
        label: "Go to Project Board",
        description: "Kanban board for research tasks",
        icon: "📊",
        category: "navigation",
        keywords: ["projects", "board", "kanban", "tasks"],
        action: () => { navigate("/projects"); close(); },
        shortcut: "G P",
      },
      {
        id: "nav-reviews",
        label: "Go to Review Requests",
        description: "Propose, review, and merge document changes",
        icon: "🔀",
        category: "navigation",
        keywords: ["reviews", "pull", "requests", "merge", "changes"],
        action: () => { navigate("/reviews"); close(); },
      },
      {
        id: "nav-discussions",
        label: "Go to Discussions",
        description: "Academic discussion forums",
        icon: "💬",
        category: "navigation",
        keywords: ["discussions", "forums", "threads", "Q&A"],
        action: () => { navigate("/discussions"); close(); },
      },
      {
        id: "nav-explore",
        label: "Go to Explore",
        description: "Discover trending research and topics",
        icon: "🌍",
        category: "navigation",
        keywords: ["explore", "discover", "trending", "topics"],
        action: () => { navigate("/explore"); close(); },
      },
      {
        id: "nav-marketplace",
        label: "Go to Plugin Marketplace",
        description: "Browse and install research plugins",
        icon: "🛒",
        category: "navigation",
        keywords: ["marketplace", "plugins", "extensions", "install"],
        action: () => { navigate("/marketplace"); close(); },
      },
      {
        id: "nav-community",
        label: "Go to Community",
        description: "Discover researchers and collaborators",
        icon: "👥",
        category: "navigation",
        keywords: ["community", "people", "researchers", "follow"],
        action: () => { navigate("/community"); close(); },
      },
      {
        id: "nav-releases",
        label: "Go to Releases",
        description: "Publication and release management",
        icon: "🏷️",
        category: "navigation",
        keywords: ["releases", "publications", "versions", "tags"],
        action: () => { navigate("/releases"); close(); },
      },
      {
        id: "nav-evidence-graph",
        label: "Go to Evidence Graph",
        description: "Evidence dependency visualization",
        icon: "🕸️",
        category: "research",
        keywords: ["evidence", "graph", "dependencies", "visualization"],
        action: () => { navigate("/evidence-graph"); close(); },
      },
      {
        id: "nav-claim-checks",
        label: "Go to Claim Status Checks",
        description: "CI/CD-style validation for claims",
        icon: "✅",
        category: "research",
        keywords: ["claims", "checks", "validation", "status", "CI"],
        action: () => { navigate("/claim-checks"); close(); },
      },
      {
        id: "nav-profile",
        label: "Go to Profile",
        description: "Your profile, contributions, and starred items",
        icon: "👤",
        category: "navigation",
        keywords: ["profile", "account", "contributions", "stars"],
        action: () => { navigate("/profile"); close(); },
      },
      {
        id: "nav-settings",
        label: "Go to Settings",
        description: "App preferences and configuration",
        icon: "⚙️",
        category: "settings",
        keywords: ["settings", "preferences", "config", "options"],
        action: () => { navigate("/settings"); close(); },
        shortcut: "G S",
      },
      {
        id: "nav-search",
        label: "Go to Cross-Project Search",
        description: "Search across all projects and documents",
        icon: "🔎",
        category: "navigation",
        keywords: ["search", "cross", "project", "global", "find"],
        action: () => { navigate("/search"); close(); },
      },
      {
        id: "nav-theory-repo",
        label: "Go to Theory Repository",
        description: "Git-like repository view for theory branches, commits, and tags",
        icon: "📦",
        category: "research",
        keywords: ["theory", "repo", "repository", "branches", "commits", "git", "version"],
        action: () => { navigate("/theory-repo"); close(); },
      },
      {
        id: "action-upload",
        label: "Upload Document",
        description: "Upload a new document to analyze",
        icon: "📤",
        category: "action",
        keywords: ["upload", "add", "new", "document", "file"],
        action: () => { navigate("/"); close(); },
        shortcut: "U",
      },
      {
        id: "action-search",
        label: "Search Documents",
        description: "Search across all your documents",
        icon: "🔍",
        category: "action",
        keywords: ["search", "find", "query"],
        action: () => { navigate("/"); close(); },
        shortcut: "/",
      },
      {
        id: "settings-theme",
        label: "Toggle Theme",
        description: "Switch between dark and light mode",
        icon: "🌓",
        category: "settings",
        keywords: ["theme", "dark", "light", "mode", "appearance"],
        action: () => {
          document.documentElement.setAttribute(
            "data-theme",
            document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"
          );
          close();
        },
        shortcut: "T",
      },
      {
        id: "action-shortcuts",
        label: "Show Keyboard Shortcuts",
        description: "View all available keyboard shortcuts",
        icon: "⌨️",
        category: "action",
        keywords: ["keyboard", "shortcuts", "help", "keys"],
        action: () => {
          // Trigger the shortcuts help modal
          window.dispatchEvent(new KeyboardEvent("keydown", { key: "?", shiftKey: true }));
          close();
        },
        shortcut: "?",
      },
    ];

    defaultCommands.forEach(registerCommand);
    
    return () => {
      defaultCommands.forEach((cmd) => unregisterCommand(cmd.id));
    };
  }, [navigate, close, registerCommand, unregisterCommand]);

  // Dynamic document commands from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("uploads");
      if (!stored) return;
      const uploads = JSON.parse(stored);
      if (!Array.isArray(uploads)) return;
      const docCommands: Command[] = uploads.slice(0, 20).map((doc: { id?: string; documentId?: string; name?: string; filename?: string }, idx: number) => ({
        id: `doc-${doc.id || doc.documentId || idx}`,
        label: `Open: ${doc.name || doc.filename || `Document ${idx + 1}`}`,
        description: "Navigate to this document",
        icon: "📄",
        category: "document" as CommandCategory,
        keywords: ["document", "file", "open", ...(doc.name || doc.filename || "").toLowerCase().split(/\s+/)],
        action: () => {
          const docId = doc.documentId || doc.id;
          if (docId) navigate(`/documents/${docId}`);
          close();
        },
      }));
      docCommands.forEach(registerCommand);
      return () => { docCommands.forEach((cmd) => unregisterCommand(cmd.id)); };
    } catch { /* ignore parse errors */ }
  }, [navigate, close, registerCommand, unregisterCommand, isOpen]);

  // Global keyboard shortcut to open palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
      // Escape to close
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle, close, isOpen]);

  return (
    <CommandPaletteContext.Provider
      value={{
        isOpen,
        open,
        close,
        toggle,
        registerCommand,
        unregisterCommand,
        commands,
      }}
    >
      {children}
      {isOpen && <CommandPaletteModal />}
    </CommandPaletteContext.Provider>
  );
};

// Hook to use command palette
export const useCommandPalette = () => {
  const context = React.useContext(CommandPaletteContext);
  if (!context) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  }
  return context;
};

// Hook to register commands from components
export const useRegisterCommands = (commands: Command[], deps: React.DependencyList = []) => {
  const { registerCommand, unregisterCommand } = useCommandPalette();

  useEffect(() => {
    commands.forEach(registerCommand);
    return () => {
      commands.forEach((cmd) => unregisterCommand(cmd.id));
    };
  }, [registerCommand, unregisterCommand, ...deps]);
};

// Modal component
const CommandPaletteModal: React.FC = () => {
  const { close, commands } = useCommandPalette();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return commands;
    }

    const lowerQuery = query.toLowerCase();
    return commands.filter((cmd) => {
      const labelMatch = cmd.label.toLowerCase().includes(lowerQuery);
      const descMatch = cmd.description?.toLowerCase().includes(lowerQuery);
      const keywordMatch = cmd.keywords?.some((k) => k.toLowerCase().includes(lowerQuery));
      const categoryMatch = cmd.category.toLowerCase().includes(lowerQuery);
      return labelMatch || descMatch || keywordMatch || categoryMatch;
    });
  }, [commands, query]);

  // Group by category
  const groupedCommands = useMemo(() => {
    const groups: Record<CommandCategory, Command[]> = {
      recent: [],
      navigation: [],
      action: [],
      document: [],
      research: [],
      library: [],
      settings: [],
    };

    filteredCommands.forEach((cmd) => {
      groups[cmd.category].push(cmd);
    });

    return Object.entries(groups).filter(([, cmds]) => cmds.length > 0) as [CommandCategory, Command[]][];
  }, [filteredCommands]);

  // Flatten for keyboard navigation
  const flatCommands = useMemo(() => {
    return groupedCommands.flatMap(([, cmds]) => cmds);
  }, [groupedCommands]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatCommands.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          executeCommand(flatCommands[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedElement?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const executeCommand = async (command: Command) => {
    if (command.disabled) return;
    try {
      await command.action();
    } catch (error) {
      console.error("Command execution failed:", error);
    }
  };

  let globalIndex = 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "15vh",
        zIndex: 99999,
      }}
      onClick={close}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #1e1e2e 0%, #181825 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          width: "min(600px, 90vw)",
          maxHeight: "60vh",
          overflow: "hidden",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "18px", opacity: 0.6 }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: "16px",
                color: "#eaeaea",
              }}
            />
            <kbd
              style={{
                padding: "4px 8px",
                background: "rgba(255, 255, 255, 0.08)",
                borderRadius: "4px",
                fontSize: "11px",
                color: "#71717a",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              ESC
            </kbd>
          </div>
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          style={{
            maxHeight: "calc(60vh - 80px)",
            overflowY: "auto",
            padding: "8px",
          }}
        >
          {groupedCommands.length === 0 ? (
            <div
              style={{
                padding: "32px",
                textAlign: "center",
                color: "#71717a",
                fontSize: "14px",
              }}
            >
              No commands found for "{query}"
            </div>
          ) : (
            groupedCommands.map(([category, cmds]) => (
              <div key={category} style={{ marginBottom: "8px" }}>
                <div
                  style={{
                    padding: "8px 12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#71717a",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{categoryMeta[category].icon}</span>
                  {categoryMeta[category].label}
                </div>
                {cmds.map((cmd) => {
                  const currentIndex = globalIndex++;
                  const isSelected = currentIndex === selectedIndex;
                  return (
                    <div
                      key={cmd.id}
                      data-index={currentIndex}
                      onClick={() => executeCommand(cmd)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        cursor: cmd.disabled ? "not-allowed" : "pointer",
                        background: isSelected ? "rgba(99, 102, 241, 0.15)" : "transparent",
                        border: isSelected ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
                        opacity: cmd.disabled ? 0.5 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                    >
                      <span style={{ fontSize: "18px" }}>{cmd.icon || "▸"}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: 500, color: "#eaeaea" }}>
                          {cmd.label}
                        </div>
                        {cmd.description && (
                          <div style={{ fontSize: "12px", color: "#71717a", marginTop: "2px" }}>
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd
                          style={{
                            padding: "4px 8px",
                            background: "rgba(255, 255, 255, 0.06)",
                            borderRadius: "4px",
                            fontSize: "11px",
                            color: "#a1a1aa",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                          }}
                        >
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "10px 16px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            gap: "16px",
            fontSize: "11px",
            color: "#52525b",
          }}
        >
          <span>
            <kbd style={kbdStyle}>↑↓</kbd> Navigate
          </span>
          <span>
            <kbd style={kbdStyle}>Enter</kbd> Select
          </span>
          <span>
            <kbd style={kbdStyle}>Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
};

const kbdStyle: React.CSSProperties = {
  padding: "2px 5px",
  background: "rgba(255, 255, 255, 0.08)",
  borderRadius: "3px",
  fontSize: "10px",
  marginRight: "4px",
};

// Trigger button component
export const CommandPaletteTrigger: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const { open } = useCommandPalette();

  return (
    <button
      onClick={open}
      title="Command Palette (Ctrl+K)"
      style={{
        padding: "8px 14px",
        background: "rgba(255, 255, 255, 0.06)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
        color: "#a1a1aa",
        fontSize: "13px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "all 0.2s ease",
        ...style,
      }}
    >
      <span>🔍</span>
      <span>Search...</span>
      <kbd
        style={{
          padding: "2px 6px",
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: "4px",
          fontSize: "10px",
          marginLeft: "auto",
        }}
      >
        Ctrl+K
      </kbd>
    </button>
  );
};

export default CommandPaletteProvider;

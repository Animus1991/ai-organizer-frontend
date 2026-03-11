/**
 * PluginSystem - Extensible plugin architecture for the research platform
 * Allows third-party extensions and custom functionality
 */

import React, { useState, createContext, useContext, useEffect, useCallback, useMemo } from "react";

// Types
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  icon?: string;
  homepage?: string;
  permissions?: string[];
  category: "analysis" | "export" | "visualization" | "integration" | "utility";
}

export interface PluginHook {
  name: string;
  priority?: number;
  handler: (...args: unknown[]) => unknown;
}

export interface PluginComponentProps {
  context?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface PluginComponent {
  slot: "sidebar" | "toolbar" | "panel" | "modal" | "menu";
  component: React.ComponentType<PluginComponentProps>;
  props?: Record<string, unknown>;
}

export interface Plugin {
  metadata: PluginMetadata;
  enabled: boolean;
  hooks?: PluginHook[];
  components?: PluginComponent[];
  settings?: Record<string, unknown>;
  onActivate?: () => void | Promise<void>;
  onDeactivate?: () => void | Promise<void>;
}

export interface PluginSlotProps {
  slot: PluginComponent["slot"];
  context?: Record<string, unknown>;
}

// Context type
interface PluginContextType {
  plugins: Plugin[];
  enabledPlugins: Plugin[];
  registerPlugin: (plugin: Plugin) => void;
  unregisterPlugin: (pluginId: string) => void;
  enablePlugin: (pluginId: string) => Promise<void>;
  disablePlugin: (pluginId: string) => Promise<void>;
  getPluginSettings: (pluginId: string) => Record<string, unknown> | undefined;
  updatePluginSettings: (pluginId: string, settings: Record<string, unknown>) => void;
  executeHook: <T>(hookName: string, ...args: unknown[]) => T[];
  getSlotComponents: (slot: PluginComponent["slot"]) => PluginComponent[];
}

const PluginContext = createContext<PluginContextType | null>(null);

// Storage key
const STORAGE_KEY = "plugin_settings";

// Provider
interface PluginProviderProps {
  children: React.ReactNode;
}

export const PluginProvider: React.FC<PluginProviderProps> = ({ children }) => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [pluginSettings, setPluginSettings] = useState<Record<string, Record<string, unknown>>>({});

  // Load settings from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPluginSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load plugin settings:", error);
    }
  }, []);

  // Save settings to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pluginSettings));
    } catch (error) {
      console.error("Failed to save plugin settings:", error);
    }
  }, [pluginSettings]);

  // Register a plugin
  const registerPlugin = useCallback((plugin: Plugin) => {
    setPlugins((prev) => {
      const existing = prev.findIndex((p) => p.metadata.id === plugin.metadata.id);
      if (existing >= 0) {
        console.warn(`Plugin ${plugin.metadata.id} already registered, updating...`);
        const updated = [...prev];
        updated[existing] = plugin;
        return updated;
      }
      return [...prev, plugin];
    });
  }, []);

  // Unregister a plugin
  const unregisterPlugin = useCallback((pluginId: string) => {
    setPlugins((prev) => {
      const plugin = prev.find((p) => p.metadata.id === pluginId);
      if (plugin?.enabled && plugin.onDeactivate) {
        plugin.onDeactivate();
      }
      return prev.filter((p) => p.metadata.id !== pluginId);
    });
  }, []);

  // Enable a plugin
  const enablePlugin = useCallback(async (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((p) => {
        if (p.metadata.id === pluginId && !p.enabled) {
          if (p.onActivate) {
            p.onActivate();
          }
          return { ...p, enabled: true };
        }
        return p;
      })
    );
  }, []);

  // Disable a plugin
  const disablePlugin = useCallback(async (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((p) => {
        if (p.metadata.id === pluginId && p.enabled) {
          if (p.onDeactivate) {
            p.onDeactivate();
          }
          return { ...p, enabled: false };
        }
        return p;
      })
    );
  }, []);

  // Get plugin settings
  const getPluginSettings = useCallback(
    (pluginId: string) => pluginSettings[pluginId],
    [pluginSettings]
  );

  // Update plugin settings
  const updatePluginSettings = useCallback(
    (pluginId: string, settings: Record<string, unknown>) => {
      setPluginSettings((prev) => ({
        ...prev,
        [pluginId]: { ...prev[pluginId], ...settings },
      }));
    },
    []
  );

  // Execute a hook across all enabled plugins
  const executeHook = useCallback(
    <T,>(hookName: string, ...args: unknown[]): T[] => {
      const results: T[] = [];
      const enabledPluginsList = plugins.filter((p) => p.enabled);

      // Collect all hooks with this name
      const hooks: Array<{ plugin: Plugin; hook: PluginHook }> = [];
      enabledPluginsList.forEach((plugin) => {
        plugin.hooks?.forEach((hook) => {
          if (hook.name === hookName) {
            hooks.push({ plugin, hook });
          }
        });
      });

      // Sort by priority (higher first)
      hooks.sort((a, b) => (b.hook.priority || 0) - (a.hook.priority || 0));

      // Execute hooks
      hooks.forEach(({ hook }) => {
        try {
          const result = hook.handler(...args);
          if (result !== undefined) {
            results.push(result as T);
          }
        } catch (error) {
          console.error(`Hook ${hookName} failed:`, error);
        }
      });

      return results;
    },
    [plugins]
  );

  // Get components for a slot
  const getSlotComponents = useCallback(
    (slot: PluginComponent["slot"]): PluginComponent[] => {
      const components: PluginComponent[] = [];
      plugins
        .filter((p) => p.enabled)
        .forEach((plugin) => {
          plugin.components?.forEach((comp) => {
            if (comp.slot === slot) {
              components.push(comp);
            }
          });
        });
      return components;
    },
    [plugins]
  );

  const enabledPlugins = useMemo(() => plugins.filter((p) => p.enabled), [plugins]);

  return (
    <PluginContext.Provider
      value={{
        plugins,
        enabledPlugins,
        registerPlugin,
        unregisterPlugin,
        enablePlugin,
        disablePlugin,
        getPluginSettings,
        updatePluginSettings,
        executeHook,
        getSlotComponents,
      }}
    >
      {children}
    </PluginContext.Provider>
  );
};

// Hook
export const usePlugins = () => {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error("usePlugins must be used within PluginProvider");
  }
  return context;
};

// Plugin slot component - renders plugins for a specific slot
export const PluginSlot: React.FC<PluginSlotProps> = ({ slot, context }) => {
  const { getSlotComponents } = usePlugins();
  const components = getSlotComponents(slot);

  if (components.length === 0) return null;

  return (
    <>
      {components.map((comp, index) => {
        const Component = comp.component;
        return <Component key={index} {...comp.props} context={context} />;
      })}
    </>
  );
};

// Plugin manager UI
interface PluginManagerProps {
  style?: React.CSSProperties;
  onClose?: () => void;
}

export const PluginManager: React.FC<PluginManagerProps> = ({ style, onClose }) => {
  const {
    plugins,
    enablePlugin,
    disablePlugin,
    registerPlugin,
  } = usePlugins();

  const [filter, setFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredPlugins = plugins.filter((p) => {
    const matchesSearch =
      p.metadata.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.metadata.description.toLowerCase().includes(filter.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || p.metadata.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", "analysis", "export", "visualization", "integration", "utility"];

  // Demo plugins
  const demoPlugins: Plugin[] = [
    {
      metadata: {
        id: "citation-analyzer",
        name: "Citation Analyzer",
        version: "1.0.0",
        author: "Research Tools",
        description: "Analyze citation patterns and impact metrics for your research papers.",
        icon: "📊",
        category: "analysis",
      },
      enabled: false,
    },
    {
      metadata: {
        id: "word-export",
        name: "Word Export Pro",
        version: "1.2.0",
        author: "Export Suite",
        description: "Export documents to Microsoft Word format with advanced formatting options.",
        icon: "📄",
        category: "export",
      },
      enabled: false,
    },
    {
      metadata: {
        id: "network-graph",
        name: "Network Graph Viewer",
        version: "2.0.0",
        author: "Visualization Labs",
        description: "Interactive network visualization for citation relationships.",
        icon: "🕸️",
        category: "visualization",
      },
      enabled: false,
    },
    {
      metadata: {
        id: "zotero-sync",
        name: "Zotero Integration",
        version: "1.5.0",
        author: "Integration Tools",
        description: "Seamless synchronization with your Zotero library.",
        icon: "🔗",
        category: "integration",
      },
      enabled: false,
    },
    {
      metadata: {
        id: "quick-notes",
        name: "Quick Notes",
        version: "1.0.0",
        author: "Utility Kit",
        description: "Fast note-taking with keyboard shortcuts and templates.",
        icon: "📝",
        category: "utility",
      },
      enabled: false,
    },
  ];

  // Initialize demo plugins
  useEffect(() => {
    demoPlugins.forEach((plugin) => {
      if (!plugins.find((p) => p.metadata.id === plugin.metadata.id)) {
        registerPlugin(plugin);
      }
    });
  }, []);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1e1e2e 0%, #181825 100%)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "16px",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>🧩</span>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#eaeaea" }}>
              Plugin Manager
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "#71717a" }}>
              {plugins.filter((p) => p.enabled).length} of {plugins.length} active
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: "6px 10px",
              background: "transparent",
              border: "none",
              color: "#71717a",
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Filters */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search plugins..."
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "8px 12px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "6px",
            color: "#eaeaea",
            fontSize: "13px",
          }}
        />
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: "6px 12px",
                background:
                  categoryFilter === cat
                    ? "rgba(99, 102, 241, 0.15)"
                    : "rgba(255, 255, 255, 0.03)",
                border:
                  categoryFilter === cat
                    ? "1px solid rgba(99, 102, 241, 0.3)"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "6px",
                color: categoryFilter === cat ? "#a5b4fc" : "#71717a",
                fontSize: "12px",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Plugin list */}
      <div style={{ padding: "16px 24px", maxHeight: "400px", overflowY: "auto" }}>
        {filteredPlugins.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px",
              color: "#52525b",
              fontSize: "14px",
            }}
          >
            No plugins found
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredPlugins.map((plugin) => (
              <div
                key={plugin.metadata.id}
                style={{
                  padding: "16px",
                  background: plugin.enabled
                    ? "rgba(99, 102, 241, 0.05)"
                    : "rgba(255, 255, 255, 0.02)",
                  border: plugin.enabled
                    ? "1px solid rgba(99, 102, 241, 0.2)"
                    : "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "12px",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "32px" }}>
                      {plugin.metadata.icon || "🧩"}
                    </span>
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#eaeaea",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {plugin.metadata.name}
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            background: "rgba(255, 255, 255, 0.05)",
                            borderRadius: "4px",
                            color: "#71717a",
                          }}
                        >
                          v{plugin.metadata.version}
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#71717a" }}>
                        by {plugin.metadata.author}
                      </div>
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() =>
                      plugin.enabled
                        ? disablePlugin(plugin.metadata.id)
                        : enablePlugin(plugin.metadata.id)
                    }
                    style={{
                      width: "48px",
                      height: "24px",
                      borderRadius: "12px",
                      background: plugin.enabled
                        ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                        : "rgba(255, 255, 255, 0.1)",
                      border: "none",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "2px",
                        left: plugin.enabled ? "26px" : "2px",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left 0.2s ease",
                      }}
                    />
                  </button>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#a1a1aa",
                    lineHeight: 1.5,
                    marginBottom: "8px",
                  }}
                >
                  {plugin.metadata.description}
                </p>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "3px 8px",
                      background: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "4px",
                      color: "#71717a",
                      textTransform: "capitalize",
                    }}
                  >
                    {plugin.metadata.category}
                  </span>
                  {plugin.enabled && (
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "3px 8px",
                        background: "rgba(34, 197, 94, 0.15)",
                        borderRadius: "4px",
                        color: "#22c55e",
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "16px 24px",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "12px", color: "#52525b" }}>
          {plugins.filter((p) => p.enabled).length} plugins enabled
        </span>
        <button
          style={{
            padding: "8px 16px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "6px",
            color: "#a1a1aa",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          Browse More Plugins
        </button>
      </div>
    </div>
  );
};

// Plugin card for quick overview
export const PluginCard: React.FC<{
  plugin: Plugin;
  onToggle?: (enabled: boolean) => void;
  style?: React.CSSProperties;
}> = ({ plugin, onToggle, style }) => {
  const { enablePlugin, disablePlugin } = usePlugins();

  const handleToggle = () => {
    if (plugin.enabled) {
      disablePlugin(plugin.metadata.id);
    } else {
      enablePlugin(plugin.metadata.id);
    }
    onToggle?.(!plugin.enabled);
  };

  return (
    <div
      style={{
        padding: "12px",
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        ...style,
      }}
    >
      <span style={{ fontSize: "24px" }}>{plugin.metadata.icon || "🧩"}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "#eaeaea",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {plugin.metadata.name}
        </div>
        <div style={{ fontSize: "11px", color: "#71717a" }}>
          {plugin.metadata.category}
        </div>
      </div>
      <button
        onClick={handleToggle}
        style={{
          padding: "4px 10px",
          background: plugin.enabled
            ? "rgba(34, 197, 94, 0.15)"
            : "rgba(255, 255, 255, 0.05)",
          border: plugin.enabled
            ? "1px solid rgba(34, 197, 94, 0.3)"
            : "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "4px",
          color: plugin.enabled ? "#22c55e" : "#71717a",
          fontSize: "11px",
          cursor: "pointer",
        }}
      >
        {plugin.enabled ? "On" : "Off"}
      </button>
    </div>
  );
};

export default PluginProvider;

/**
 * NotificationContext - Global notification system for real-time alerts
 * Supports toast notifications, persistent notifications, and background task alerts
 */

import React, { useState, useCallback, useRef, useEffect, createContext, useContext } from "react";

// Notification types
export type NotificationType = "success" | "error" | "warning" | "info" | "loading";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // 0 = persistent
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  progress?: number; // 0-100 for loading/progress notifications
  timestamp: Date;
}

// Context type
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "timestamp">) => string;
  removeNotification: (id: string) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  clearAll: () => void;
  // Convenience methods
  success: (title: string, message?: string, options?: Partial<Notification>) => string;
  error: (title: string, message?: string, options?: Partial<Notification>) => string;
  warning: (title: string, message?: string, options?: Partial<Notification>) => string;
  info: (title: string, message?: string, options?: Partial<Notification>) => string;
  loading: (title: string, message?: string, options?: Partial<Notification>) => string;
  // Task management
  startTask: (title: string, message?: string) => string;
  completeTask: (id: string, title?: string, message?: string) => void;
  failTask: (id: string, title?: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// Provider props
interface NotificationProviderProps {
  children: React.ReactNode;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
  maxNotifications?: number;
}

// Generate unique ID
const generateId = () => `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  position = "top-right",
  maxNotifications = 5,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp">): string => {
      const id = generateId();
      const newNotification: Notification = {
        ...notification,
        id,
        timestamp: new Date(),
        duration: notification.duration ?? (notification.type === "loading" ? 0 : 5000),
        dismissible: notification.dismissible ?? true,
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev];
        // Limit max notifications
        if (updated.length > maxNotifications) {
          const removed = updated.pop();
          if (removed && timersRef.current.has(removed.id)) {
            clearTimeout(timersRef.current.get(removed.id));
            timersRef.current.delete(removed.id);
          }
        }
        return updated;
      });

      // Auto-dismiss after duration
      if (newNotification.duration && newNotification.duration > 0) {
        const timer = setTimeout(() => {
          removeNotification(id);
        }, newNotification.duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [maxNotifications]
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id));
      timersRef.current.delete(id);
    }
  }, []);

  const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );
  }, []);

  const clearAll = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setNotifications([]);
  }, []);

  // Convenience methods
  const success = useCallback(
    (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: "success", title, message, ...options }),
    [addNotification]
  );

  const error = useCallback(
    (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: "error", title, message, duration: 0, ...options }),
    [addNotification]
  );

  const warning = useCallback(
    (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: "warning", title, message, ...options }),
    [addNotification]
  );

  const info = useCallback(
    (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: "info", title, message, ...options }),
    [addNotification]
  );

  const loading = useCallback(
    (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: "loading", title, message, duration: 0, ...options }),
    [addNotification]
  );

  // Task management
  const startTask = useCallback(
    (title: string, message?: string) => {
      return loading(title, message, { progress: 0 });
    },
    [loading]
  );

  const completeTask = useCallback(
    (id: string, title?: string, message?: string) => {
      updateNotification(id, {
        type: "success",
        title: title || "Completed",
        message,
        progress: 100,
        duration: 3000,
      });
      // Auto-remove after duration
      setTimeout(() => removeNotification(id), 3000);
    },
    [updateNotification, removeNotification]
  );

  const failTask = useCallback(
    (id: string, title?: string, message?: string) => {
      updateNotification(id, {
        type: "error",
        title: title || "Failed",
        message,
        duration: 0,
      });
    },
    [updateNotification]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        updateNotification,
        clearAll,
        success,
        error,
        warning,
        info,
        loading,
        startTask,
        completeTask,
        failTask,
      }}
    >
      {children}
      <NotificationContainer position={position} />
    </NotificationContext.Provider>
  );
};

// Hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};

// Position styles
const positionStyles: Record<string, React.CSSProperties> = {
  "top-right": { top: "20px", right: "20px" },
  "top-left": { top: "20px", left: "20px" },
  "bottom-right": { bottom: "20px", right: "20px" },
  "bottom-left": { bottom: "20px", left: "20px" },
  "top-center": { top: "20px", left: "50%", transform: "translateX(-50%)" },
  "bottom-center": { bottom: "20px", left: "50%", transform: "translateX(-50%)" },
};

// Type icons and colors
const typeConfig: Record<NotificationType, { icon: string; color: string; bgColor: string }> = {
  success: { icon: "✓", color: "#22c55e", bgColor: "rgba(34, 197, 94, 0.12)" },
  error: { icon: "✕", color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.12)" },
  warning: { icon: "⚠", color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.12)" },
  info: { icon: "ℹ", color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.12)" },
  loading: { icon: "◌", color: "#8b5cf6", bgColor: "rgba(139, 92, 246, 0.12)" },
};

// Container component
interface NotificationContainerProps {
  position: string;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ position }) => {
  const { notifications } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 99998,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "400px",
        width: "100%",
        pointerEvents: "none",
        ...positionStyles[position],
      }}
    >
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

// Individual notification item
interface NotificationItemProps {
  notification: Notification;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { removeNotification } = useNotifications();
  const [isExiting, setIsExiting] = useState(false);
  const config = typeConfig[notification.type];

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => removeNotification(notification.id), 200);
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1e1e2e 0%, #181825 100%)",
        border: `1px solid ${config.color}30`,
        borderRadius: "12px",
        padding: "14px 16px",
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px ${config.color}20`,
        pointerEvents: "auto",
        animation: isExiting ? "slideOut 0.2s ease forwards" : "slideIn 0.3s ease",
        overflow: "hidden",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "8px",
          background: config.bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: config.color,
          fontSize: "14px",
          fontWeight: "bold",
          flexShrink: 0,
          animation: notification.type === "loading" ? "spin 1s linear infinite" : undefined,
        }}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#eaeaea",
            marginBottom: notification.message ? "4px" : 0,
          }}
        >
          {notification.title}
        </div>
        {notification.message && (
          <div style={{ fontSize: "13px", color: "#a1a1aa", lineHeight: 1.4 }}>
            {notification.message}
          </div>
        )}
        
        {/* Progress bar */}
        {notification.progress !== undefined && notification.type === "loading" && (
          <div
            style={{
              marginTop: "10px",
              height: "4px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${notification.progress}%`,
                height: "100%",
                background: config.color,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        )}

        {/* Action button */}
        {notification.action && (
          <button
            onClick={notification.action.onClick}
            style={{
              marginTop: "10px",
              padding: "6px 12px",
              background: config.bgColor,
              border: `1px solid ${config.color}40`,
              borderRadius: "6px",
              color: config.color,
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {notification.action.label}
          </button>
        )}
      </div>

      {/* Dismiss button */}
      {notification.dismissible && (
        <button
          onClick={handleDismiss}
          style={{
            background: "transparent",
            border: "none",
            color: "#71717a",
            fontSize: "16px",
            cursor: "pointer",
            padding: "0",
            lineHeight: 1,
            opacity: 0.6,
            transition: "opacity 0.2s ease",
          }}
          title="Dismiss"
        >
          ×
        </button>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Notification bell icon with badge
export const NotificationBell: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const { notifications, clearAll } = useNotifications();
  const [showPanel, setShowPanel] = useState(false);
  const unreadCount = notifications.length;

  return (
    <div style={{ position: "relative", ...style }}>
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transition: "background 0.2s ease",
        }}
        title="Notifications"
      >
        <span style={{ fontSize: "20px" }}>🔔</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              width: "18px",
              height: "18px",
              background: "#ef4444",
              borderRadius: "50%",
              fontSize: "10px",
              fontWeight: "bold",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {showPanel && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99996,
            }}
            onClick={() => setShowPanel(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: "340px",
              maxHeight: "400px",
              background: "linear-gradient(135deg, #1e1e2e 0%, #181825 100%)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              boxShadow: "0 15px 40px rgba(0, 0, 0, 0.4)",
              zIndex: 99997,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600, color: "#eaeaea" }}>Notifications</span>
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#71717a",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
            <div style={{ maxHeight: "340px", overflowY: "auto", padding: "8px" }}>
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: "32px",
                    textAlign: "center",
                    color: "#52525b",
                    fontSize: "14px",
                  }}
                >
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      marginBottom: "4px",
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                      background: "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    <span style={{ color: typeConfig[n.type].color }}>
                      {typeConfig[n.type].icon}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", color: "#eaeaea" }}>{n.title}</div>
                      {n.message && (
                        <div style={{ fontSize: "12px", color: "#71717a", marginTop: "2px" }}>
                          {n.message}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationProvider;

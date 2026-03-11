/**
 * AnalyticsDashboard - Research progress tracking and statistics
 * Provides insights into reading habits, research activity, and productivity
 */

import React, { useState, useMemo, createContext, useContext, useEffect, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

// Analytics types
export interface ReadingSession {
  id: string;
  documentId: string;
  documentTitle: string;
  startTime: Date;
  endTime?: Date;
  pagesRead?: number;
  segmentsCreated?: number;
}

export interface DailyStats {
  date: string;
  documentsOpened: number;
  segmentsCreated: number;
  papersSearched: number;
  timeSpentMinutes: number;
  exportsCount: number;
}

export interface ResearchMetrics {
  totalDocuments: number;
  totalSegments: number;
  totalPapersFound: number;
  totalTimeMinutes: number;
  averageSessionMinutes: number;
  weeklyActivity: DailyStats[];
  topDocuments: Array<{ id: string; title: string; accessCount: number }>;
  productivityScore: number;
}

// Context type
interface AnalyticsContextType {
  metrics: ResearchMetrics;
  sessions: ReadingSession[];
  startSession: (documentId: string, documentTitle: string) => string;
  endSession: (sessionId: string, stats?: { pagesRead?: number; segmentsCreated?: number }) => void;
  trackEvent: (event: string, data?: Record<string, unknown>) => void;
  getMetrics: () => ResearchMetrics;
  getDailyStats: (days?: number) => DailyStats[];
  resetAnalytics: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

// Storage key
const STORAGE_KEY = "research_analytics";

// Generate ID
const generateId = () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Provider props
interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [events, setEvents] = useState<Array<{ event: string; timestamp: Date; data?: Record<string, unknown> }>>([]);

  // Load from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSessions(
          (parsed.sessions || []).map((s: ReadingSession) => ({
            ...s,
            startTime: new Date(s.startTime),
            endTime: s.endTime ? new Date(s.endTime) : undefined,
          }))
        );
        setDailyStats(parsed.dailyStats || []);
        setEvents(
          (parsed.events || []).map((e: { event: string; timestamp: string }) => ({
            ...e,
            timestamp: new Date(e.timestamp),
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  }, []);

  // Save to storage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          sessions: sessions.slice(-100),
          dailyStats: dailyStats.slice(-30),
          events: events.slice(-500),
        })
      );
    } catch (error) {
      console.error("Failed to save analytics:", error);
    }
  }, [sessions, dailyStats, events]);

  // Get today's date string
  const getTodayString = () => new Date().toISOString().split("T")[0];

  // Update daily stats
  const updateDailyStats = useCallback((updates: Partial<DailyStats>) => {
    const today = getTodayString();
    setDailyStats((prev) => {
      const existing = prev.find((d) => d.date === today);
      if (existing) {
        return prev.map((d) =>
          d.date === today
            ? {
                ...d,
                documentsOpened: d.documentsOpened + (updates.documentsOpened || 0),
                segmentsCreated: d.segmentsCreated + (updates.segmentsCreated || 0),
                papersSearched: d.papersSearched + (updates.papersSearched || 0),
                timeSpentMinutes: d.timeSpentMinutes + (updates.timeSpentMinutes || 0),
                exportsCount: d.exportsCount + (updates.exportsCount || 0),
              }
            : d
        );
      } else {
        return [
          ...prev,
          {
            date: today,
            documentsOpened: updates.documentsOpened || 0,
            segmentsCreated: updates.segmentsCreated || 0,
            papersSearched: updates.papersSearched || 0,
            timeSpentMinutes: updates.timeSpentMinutes || 0,
            exportsCount: updates.exportsCount || 0,
          },
        ];
      }
    });
  }, []);

  // Start reading session
  const startSession = useCallback(
    (documentId: string, documentTitle: string): string => {
      const id = generateId();
      const session: ReadingSession = {
        id,
        documentId,
        documentTitle,
        startTime: new Date(),
      };
      setSessions((prev) => [...prev, session]);
      updateDailyStats({ documentsOpened: 1 });
      return id;
    },
    [updateDailyStats]
  );

  // End reading session
  const endSession = useCallback(
    (sessionId: string, stats?: { pagesRead?: number; segmentsCreated?: number }) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === sessionId && !s.endTime) {
            const endTime = new Date();
            const duration = Math.round((endTime.getTime() - s.startTime.getTime()) / 60000);
            updateDailyStats({
              timeSpentMinutes: duration,
              segmentsCreated: stats?.segmentsCreated || 0,
            });
            return {
              ...s,
              endTime,
              pagesRead: stats?.pagesRead,
              segmentsCreated: stats?.segmentsCreated,
            };
          }
          return s;
        })
      );
    },
    [updateDailyStats]
  );

  // Track generic events
  const trackEvent = useCallback(
    (event: string, data?: Record<string, unknown>) => {
      setEvents((prev) => [...prev, { event, timestamp: new Date(), data }]);

      // Update specific stats based on event
      if (event === "paper_search") {
        updateDailyStats({ papersSearched: 1 });
      } else if (event === "export") {
        updateDailyStats({ exportsCount: 1 });
      } else if (event === "segment_created") {
        updateDailyStats({ segmentsCreated: 1 });
      }
    },
    [updateDailyStats]
  );

  // Calculate metrics
  const getMetrics = useCallback((): ResearchMetrics => {
    const completedSessions = sessions.filter((s) => s.endTime);
    const totalTimeMinutes = completedSessions.reduce((sum, s) => {
      if (s.endTime) {
        return sum + Math.round((s.endTime.getTime() - s.startTime.getTime()) / 60000);
      }
      return sum;
    }, 0);

    const uniqueDocuments = new Set(sessions.map((s) => s.documentId)).size;
    const totalSegments = sessions.reduce((sum, s) => sum + (s.segmentsCreated || 0), 0);

    // Top documents
    const docCounts: Record<string, { title: string; count: number }> = {};
    sessions.forEach((s) => {
      if (!docCounts[s.documentId]) {
        docCounts[s.documentId] = { title: s.documentTitle, count: 0 };
      }
      docCounts[s.documentId].count++;
    });
    const topDocuments = Object.entries(docCounts)
      .map(([id, { title, count }]) => ({ id, title, accessCount: count }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 5);

    // Weekly activity
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });
    const weeklyActivity = last7Days.map((date) => {
      const stats = dailyStats.find((d) => d.date === date);
      return stats || {
        date,
        documentsOpened: 0,
        segmentsCreated: 0,
        papersSearched: 0,
        timeSpentMinutes: 0,
        exportsCount: 0,
      };
    });

    // Productivity score (0-100)
    const recentActivity = weeklyActivity.reduce((sum, d) => sum + d.timeSpentMinutes, 0);
    const productivityScore = Math.min(100, Math.round((recentActivity / (7 * 60)) * 100));

    return {
      totalDocuments: uniqueDocuments,
      totalSegments,
      totalPapersFound: events.filter((e) => e.event === "paper_search").length,
      totalTimeMinutes,
      averageSessionMinutes:
        completedSessions.length > 0 ? Math.round(totalTimeMinutes / completedSessions.length) : 0,
      weeklyActivity,
      topDocuments,
      productivityScore,
    };
  }, [sessions, dailyStats, events]);

  const getDailyStats = useCallback(
    (days = 7): DailyStats[] => {
      return dailyStats.slice(-days);
    },
    [dailyStats]
  );

  const resetAnalytics = useCallback(() => {
    setSessions([]);
    setDailyStats([]);
    setEvents([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const metrics = useMemo(() => getMetrics(), [getMetrics]);

  return (
    <AnalyticsContext.Provider
      value={{
        metrics,
        sessions,
        startSession,
        endSession,
        trackEvent,
        getMetrics,
        getDailyStats,
        resetAnalytics,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};

// Hook
export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }
  return context;
};

// Mini stat card
interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subtext, color = "#6366f1" }) => (
  <div
    style={{
      background: "rgba(255, 255, 255, 0.03)",
      borderRadius: "12px",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "16px" }}>{icon}</span>
      <span style={{ fontSize: "12px", color: "#71717a" }}>{label}</span>
    </div>
    <div style={{ fontSize: "16px", fontWeight: 600, color }}>{value}</div>
    {subtext && <div style={{ fontSize: "11px", color: "#52525b" }}>{subtext}</div>}
  </div>
);

// Activity chart (simple bar chart)
interface ActivityChartProps {
  data: DailyStats[];
  metric?: keyof Omit<DailyStats, "date">;
}

const ActivityChart: React.FC<ActivityChartProps> = ({ data, metric = "timeSpentMinutes" }) => {
  const maxValue = Math.max(...data.map((d) => d[metric]), 1);

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en", { weekday: "short" });
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", height: "100px" }}>
      {data.map((day, i) => {
        const height = (day[metric] / maxValue) * 80;
        return (
          <div
            key={day.date}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <div
              style={{
                width: "100%",
                height: `${Math.max(4, height)}px`,
                background:
                  i === data.length - 1
                    ? "linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)"
                    : "rgba(99, 102, 241, 0.3)",
                borderRadius: "4px 4px 0 0",
                transition: "height 0.3s ease",
              }}
              title={`${day[metric]} ${metric === "timeSpentMinutes" ? "min" : ""}`}
            />
            <span style={{ fontSize: "10px", color: "#71717a" }}>{getDayName(day.date)}</span>
          </div>
        );
      })}
    </div>
  );
};

// Productivity ring
interface ProductivityRingProps {
  score: number;
  size?: number;
}

const ProductivityRing: React.FC<ProductivityRingProps> = ({ score, size = 120 }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return "#22c55e";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: "16px", fontWeight: 600, color: getColor() }}>{score}</span>
        <span style={{ fontSize: "11px", color: "#71717a" }}>Productivity</span>
      </div>
    </div>
  );
};

// Main dashboard component
interface AnalyticsDashboardProps {
  compact?: boolean;
  style?: React.CSSProperties;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ compact = false, style }) => {
  const { metrics } = useAnalytics();
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "documents">("overview");

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (compact) {
    return (
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          ...style,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "8px",
          }}
        >
          <ProductivityRing score={metrics.productivityScore} size={40} />
          <div>
            <div style={{ fontSize: "11px", color: "#71717a" }}>This week</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#eaeaea" }}>
              {formatTime(metrics.weeklyActivity.reduce((sum, d) => sum + d.timeSpentMinutes, 0))}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "8px",
          }}
        >
          <span style={{ fontSize: "16px" }}>📄</span>
          <div>
            <div style={{ fontSize: "11px", color: "#71717a" }}>Documents</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#eaeaea" }}>
              {metrics.totalDocuments}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <span style={{ fontSize: "18px" }}>📊</span>
          <div>
            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#eaeaea" }}>
              Research Analytics
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "#71717a" }}>
              Track your research progress
            </p>
          </div>
        </div>
        <ProductivityRing score={metrics.productivityScore} size={60} />
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          padding: "12px 24px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        {(["overview", "activity", "documents"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 16px",
              background: activeTab === tab ? "rgba(99, 102, 241, 0.15)" : "transparent",
              border: activeTab === tab ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
              borderRadius: "6px",
              color: activeTab === tab ? "#a5b4fc" : "#71717a",
              fontSize: "13px",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "24px" }}>
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
              <StatCard
                icon="📄"
                label="Documents"
                value={metrics.totalDocuments}
                subtext="Total analyzed"
                color="#3b82f6"
              />
              <StatCard
                icon="📝"
                label="Segments"
                value={metrics.totalSegments}
                subtext="Notes created"
                color="#22c55e"
              />
              <StatCard
                icon="⏱️"
                label="Time Spent"
                value={formatTime(metrics.totalTimeMinutes)}
                subtext="Total research time"
                color="#f59e0b"
              />
              <StatCard
                icon="🔬"
                label="Papers"
                value={metrics.totalPapersFound}
                subtext="Literature searches"
                color="#8b5cf6"
              />
            </div>

            {/* Weekly chart */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#eaeaea", marginBottom: "16px" }}>
                Weekly Activity
              </h3>
              <ActivityChart data={metrics.weeklyActivity} metric="timeSpentMinutes" />
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#eaeaea", marginBottom: "12px" }}>
                Documents Opened
              </h3>
              <ActivityChart data={metrics.weeklyActivity} metric="documentsOpened" />
            </div>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#eaeaea", marginBottom: "12px" }}>
                Segments Created
              </h3>
              <ActivityChart data={metrics.weeklyActivity} metric="segmentsCreated" />
            </div>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#eaeaea", marginBottom: "12px" }}>
                Papers Searched
              </h3>
              <ActivityChart data={metrics.weeklyActivity} metric="papersSearched" />
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#eaeaea", marginBottom: "16px" }}>
              Most Accessed Documents
            </h3>
            {metrics.topDocuments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", color: "#52525b", fontSize: "14px" }}>
                No documents accessed yet
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {metrics.topDocuments.map((doc, i) => (
                  <div
                    key={doc.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      background: "rgba(255, 255, 255, 0.02)",
                      borderRadius: "8px",
                    }}
                  >
                    <span
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background:
                          i === 0
                            ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                            : i === 1
                            ? "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"
                            : i === 2
                            ? "linear-gradient(135deg, #cd7c32 0%, #b8860b 100%)"
                            : "rgba(255, 255, 255, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: i < 3 ? "#1e1e2e" : "#71717a",
                      }}
                    >
                      {i + 1}
                    </span>
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
                        {doc.title}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "4px 8px",
                        background: "rgba(99, 102, 241, 0.15)",
                        borderRadius: "4px",
                        fontSize: "11px",
                        color: "#a5b4fc",
                      }}
                    >
                      {doc.accessCount} opens
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Analytics widget for sidebar
export const AnalyticsWidget: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const { metrics } = useAnalytics();
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const surfaceBg = isDark ? "rgba(255, 255, 255, 0.02)" : "#ffffff";
  const surfaceBorder = isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.12)";
  const textPrimary = isDark ? "#eaeaea" : "#000000";
  const textMuted = isDark ? "#71717a" : "rgba(0, 0, 0, 0.62)";

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const todayStats = metrics.weeklyActivity[metrics.weeklyActivity.length - 1];

  return (
    <div
      style={{
        background: surfaceBg,
        border: surfaceBorder,
        borderRadius: "12px",
        padding: "16px",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <span style={{ fontSize: "16px" }}>📊</span>
        <span style={{ fontWeight: 600, color: textPrimary, fontSize: "13px" }}>{t("analytics.todaysProgress")}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div style={{ textAlign: "center", padding: "10px", background: surfaceBg, border: surfaceBorder, borderRadius: "8px" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#3b82f6" }}>
            {todayStats?.documentsOpened || 0}
          </div>
          <div style={{ fontSize: "10px", color: textMuted }}>{t("analytics.documents")}</div>
        </div>
        <div style={{ textAlign: "center", padding: "10px", background: surfaceBg, border: surfaceBorder, borderRadius: "8px" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#22c55e" }}>
            {todayStats?.segmentsCreated || 0}
          </div>
          <div style={{ fontSize: "10px", color: textMuted }}>{t("analytics.segments")}</div>
        </div>
        <div style={{ textAlign: "center", padding: "10px", background: surfaceBg, border: surfaceBorder, borderRadius: "8px" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#f59e0b" }}>
            {formatTime(todayStats?.timeSpentMinutes || 0)}
          </div>
          <div style={{ fontSize: "10px", color: textMuted }}>{t("analytics.time")}</div>
        </div>
        <div style={{ textAlign: "center", padding: "10px", background: surfaceBg, border: surfaceBorder, borderRadius: "8px" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#8b5cf6" }}>
            {todayStats?.papersSearched || 0}
          </div>
          <div style={{ fontSize: "10px", color: textMuted }}>{t("analytics.searches")}</div>
        </div>
      </div>
    </div>
  );
 };

export default AnalyticsProvider;

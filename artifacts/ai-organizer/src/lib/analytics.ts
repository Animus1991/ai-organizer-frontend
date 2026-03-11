/**
 * Analytics Tracking Utilities
 * Privacy-respecting usage analytics for improving UX
 */

export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
}

// In-memory event queue
let eventQueue: AnalyticsEvent[] = [];
const MAX_QUEUE_SIZE = 100;

// Analytics enabled flag (respect user privacy preferences)
let analyticsEnabled = true;

/**
 * Initialize analytics with user preferences
 */
export function initAnalytics(enabled: boolean = true): void {
  analyticsEnabled = enabled;
  
  // Load any persisted events
  try {
    const stored = localStorage.getItem('aiorg_analytics_queue');
    if (stored) {
      eventQueue = JSON.parse(stored);
    }
  } catch {
    eventQueue = [];
  }
}

/**
 * Track a custom event
 */
export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number
): void {
  if (!analyticsEnabled) return;

  const event: AnalyticsEvent = {
    category,
    action,
    label,
    value,
    timestamp: Date.now(),
  };

  eventQueue.push(event);

  // Keep queue bounded
  if (eventQueue.length > MAX_QUEUE_SIZE) {
    eventQueue = eventQueue.slice(-MAX_QUEUE_SIZE);
  }

  // Persist to localStorage
  try {
    localStorage.setItem('aiorg_analytics_queue', JSON.stringify(eventQueue));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Track page view
 */
export function trackPageView(pageName: string): void {
  trackEvent('navigation', 'page_view', pageName);
}

/**
 * Track feature usage
 */
export function trackFeature(featureName: string, action: string = 'used'): void {
  trackEvent('feature', action, featureName);
}

/**
 * Track search
 */
export function trackSearch(query: string, resultsCount: number): void {
  trackEvent('search', 'executed', query.substring(0, 50), resultsCount);
}

/**
 * Track document operations
 */
export function trackDocument(action: 'upload' | 'view' | 'delete' | 'segment', docId?: number): void {
  trackEvent('document', action, docId?.toString());
}

/**
 * Track errors for debugging
 */
export function trackError(errorType: string, message: string): void {
  trackEvent('error', errorType, message.substring(0, 100));
}

/**
 * Track performance metrics
 */
export function trackPerformance(metric: string, durationMs: number): void {
  trackEvent('performance', metric, undefined, Math.round(durationMs));
}

/**
 * Get analytics summary for dashboard
 */
export function getAnalyticsSummary(): {
  totalEvents: number;
  eventsByCategory: Record<string, number>;
  recentEvents: AnalyticsEvent[];
} {
  const eventsByCategory: Record<string, number> = {};
  
  eventQueue.forEach(event => {
    eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
  });

  return {
    totalEvents: eventQueue.length,
    eventsByCategory,
    recentEvents: eventQueue.slice(-10),
  };
}

/**
 * Clear analytics data
 */
export function clearAnalytics(): void {
  eventQueue = [];
  localStorage.removeItem('aiorg_analytics_queue');
}

/**
 * Disable analytics (privacy)
 */
export function disableAnalytics(): void {
  analyticsEnabled = false;
  clearAnalytics();
}

/**
 * Enable analytics
 */
export function enableAnalytics(): void {
  analyticsEnabled = true;
}

/**
 * Check if analytics is enabled
 */
export function isAnalyticsEnabled(): boolean {
  return analyticsEnabled;
}

export default {
  initAnalytics,
  trackEvent,
  trackPageView,
  trackFeature,
  trackSearch,
  trackDocument,
  trackError,
  trackPerformance,
  getAnalyticsSummary,
  clearAnalytics,
  disableAnalytics,
  enableAnalytics,
  isAnalyticsEnabled,
};

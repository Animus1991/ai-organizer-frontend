/**
 * Performance Monitoring Utilities
 * Measures and reports on app performance metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
}

// Performance metrics storage
const metrics: PerformanceMetric[] = [];
const MAX_METRICS = 200;

/**
 * Measure execution time of a function
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    recordMetric(name, duration, 'ms');
  }
}

/**
 * Measure execution time of a sync function
 */
export function measureSync<T>(name: string, fn: () => T): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    const duration = performance.now() - start;
    recordMetric(name, duration, 'ms');
  }
}

/**
 * Record a performance metric
 */
export function recordMetric(
  name: string,
  value: number,
  unit: 'ms' | 'bytes' | 'count' = 'ms'
): void {
  metrics.push({
    name,
    value,
    unit,
    timestamp: Date.now(),
  });

  // Keep bounded
  if (metrics.length > MAX_METRICS) {
    metrics.splice(0, metrics.length - MAX_METRICS);
  }
}

/**
 * Get Web Vitals metrics
 */
export function getWebVitals(): Record<string, number | null> {
  const vitals: Record<string, number | null> = {
    // First Contentful Paint
    fcp: null,
    // Largest Contentful Paint
    lcp: null,
    // First Input Delay (approximation)
    fid: null,
    // Cumulative Layout Shift
    cls: null,
    // Time to First Byte
    ttfb: null,
  };

  try {
    const entries = performance.getEntriesByType('paint');
    const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
    if (fcpEntry) {
      vitals.fcp = fcpEntry.startTime;
    }

    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      vitals.ttfb = navEntries[0].responseStart - navEntries[0].requestStart;
    }
  } catch {
    // Performance API not fully available
  }

  return vitals;
}

/**
 * Get memory usage (if available)
 */
export function getMemoryUsage(): { usedJSHeapSize?: number; totalJSHeapSize?: number } | null {
  const perf = performance as any;
  if (perf.memory) {
    return {
      usedJSHeapSize: perf.memory.usedJSHeapSize,
      totalJSHeapSize: perf.memory.totalJSHeapSize,
    };
  }
  return null;
}

/**
 * Get performance summary
 */
export function getPerformanceSummary(): {
  metrics: PerformanceMetric[];
  averages: Record<string, number>;
  webVitals: Record<string, number | null>;
  memory: ReturnType<typeof getMemoryUsage>;
} {
  // Calculate averages by metric name
  const groups: Record<string, number[]> = {};
  metrics.forEach(m => {
    if (!groups[m.name]) groups[m.name] = [];
    groups[m.name].push(m.value);
  });

  const averages: Record<string, number> = {};
  Object.entries(groups).forEach(([name, values]) => {
    averages[name] = values.reduce((a, b) => a + b, 0) / values.length;
  });

  return {
    metrics: metrics.slice(-50),
    averages,
    webVitals: getWebVitals(),
    memory: getMemoryUsage(),
  };
}

/**
 * Clear performance metrics
 */
export function clearMetrics(): void {
  metrics.length = 0;
}

/**
 * Performance observer for long tasks
 */
export function observeLongTasks(callback: (duration: number) => void): () => void {
  if (!('PerformanceObserver' in window)) {
    return () => {};
  }

  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) {
          callback(entry.duration);
        }
      });
    });

    observer.observe({ entryTypes: ['longtask'] });
    return () => observer.disconnect();
  } catch {
    return () => {};
  }
}

/**
 * usePerformance hook helper
 */
export function createPerformanceTimer(name: string): () => void {
  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    recordMetric(name, duration, 'ms');
  };
}

export default {
  measureAsync,
  measureSync,
  recordMetric,
  getWebVitals,
  getMemoryUsage,
  getPerformanceSummary,
  clearMetrics,
  observeLongTasks,
  createPerformanceTimer,
};

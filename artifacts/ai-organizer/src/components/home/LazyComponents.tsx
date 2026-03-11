import { lazy } from 'react';
import { Suspense } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorBoundary } from '../ui/ErrorBoundary';

// Lazy loaded components for better performance
const ResearchDashboard = lazy(() => import('../ResearchDashboard'));
const SmartDocumentSuggestions = lazy(() => import('../SmartDocumentSuggestions'));
const AdvancedSearch = lazy(() => import('../AdvancedSearchSimple'));
const DocumentEngagementMetrics = lazy(() => import('../DocumentEngagementMetrics'));
const ResearchProgressTracking = lazy(() => import('../ResearchProgressTracking'));
const AIInsightsAnalytics = lazy(() => import('../AIInsightsAnalytics'));
const CollaborationHub = lazy(() => import('../CollaborationHub'));
const KnowledgeBase = lazy(() => import('../KnowledgeBase'));
const NotificationCenter = lazy(() => import('../NotificationCenter'));
const WorkflowAutomation = lazy(() => import('../WorkflowAutomation'));
const PerformanceMonitoring = lazy(() => import('../PerformanceMonitoring'));
const DataAnalytics = lazy(() => import('../DataAnalytics'));
const SecurityCompliance = lazy(() => import('../SecurityCompliance'));
const BackupRecovery = lazy(() => import('../BackupRecovery'));
const UserManagement = lazy(() => import('../UserManagement'));
const SystemHealthMonitor = lazy(() => import('../SystemHealthMonitor'));
const APIMonitoring = lazy(() => import('../APIMonitoring'));
const LogManagement = lazy(() => import('../LogManagement'));
const AuditTrail = lazy(() => import('../AuditTrail'));
const ReportingDashboard = lazy(() => import('../ReportingDashboard'));
const IntegrationHub = lazy(() => import('../IntegrationHub'));

// Loading fallback component
const LoadingFallback = ({ name }: { name: string }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    minHeight: '200px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
  }}>
    <LoadingSpinner size="large" />
    <p style={{ 
      marginTop: '16px', 
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: '14px'
    }}>
      Loading {name}...
    </p>
  </div>
);

// Error fallback component
const ErrorFallback = ({ name }: { name: string }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    minHeight: '200px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
  }}>
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
    <h3 style={{ 
      margin: '0 0 8px 0', 
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '16px',
      fontWeight: '600'
    }}>
      {name} Failed to Load
    </h3>
    <p style={{ 
      margin: '0', 
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '14px',
      textAlign: 'center'
    }}>
      Please refresh the page or try again later.
    </p>
  </div>
);

// Wrapper component for lazy loading with error boundary
export const LazyWrapper: React.FC<{
  children: React.ReactNode;
  name: string;
  fallback?: React.ReactNode;
}> = ({ children, name, fallback }) => (
  <ErrorBoundary fallback={fallback || <ErrorFallback name={name} />}>
    <Suspense fallback={<LoadingFallback name={name} />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

// Export lazy loaded components
export {
  ResearchDashboard,
  SmartDocumentSuggestions,
  AdvancedSearch,
  DocumentEngagementMetrics,
  ResearchProgressTracking,
  AIInsightsAnalytics,
  CollaborationHub,
  KnowledgeBase,
  NotificationCenter,
  WorkflowAutomation,
  PerformanceMonitoring,
  DataAnalytics,
  SecurityCompliance,
  BackupRecovery,
  UserManagement,
  SystemHealthMonitor,
  APIMonitoring,
  LogManagement,
  AuditTrail,
  ReportingDashboard,
  IntegrationHub,
};

// Component groups for conditional rendering
export const coreComponents = {
  ResearchDashboard,
  SmartDocumentSuggestions,
  AdvancedSearch,
  DocumentEngagementMetrics,
};

export const analyticsComponents = {
  ResearchProgressTracking,
  AIInsightsAnalytics,
  DataAnalytics,
};

export const managementComponents = {
  CollaborationHub,
  KnowledgeBase,
  NotificationCenter,
  WorkflowAutomation,
};

export const adminComponents = {
  PerformanceMonitoring,
  SecurityCompliance,
  BackupRecovery,
  UserManagement,
  SystemHealthMonitor,
  APIMonitoring,
  LogManagement,
  AuditTrail,
  ReportingDashboard,
  IntegrationHub,
};

export default LazyWrapper;

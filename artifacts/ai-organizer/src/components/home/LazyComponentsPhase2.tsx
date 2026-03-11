// src/components/home/LazyComponentsPhase2.tsx - Phase 2: Core Components Only
import { lazy } from 'react';
import { Suspense } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorBoundary } from '../ui/ErrorBoundary';

// Phase 2: Lazy load only core components that we know work
const ResearchDashboard = lazy(() => import('../ResearchDashboard'));
const SmartDocumentSuggestions = lazy(() => import('../SmartDocumentSuggestions'));
const AdvancedSearch = lazy(() => import('../AdvancedSearchSimple'));
const DocumentEngagementMetrics = lazy(() => import('../DocumentEngagementMetrics'));

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
export const LazyWrapperPhase2: React.FC<{
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

// Export only core components for Phase 2
export const coreComponentsPhase2 = {
  ResearchDashboard,
  SmartDocumentSuggestions,
  AdvancedSearch,
  DocumentEngagementMetrics,
};

export default LazyWrapperPhase2;

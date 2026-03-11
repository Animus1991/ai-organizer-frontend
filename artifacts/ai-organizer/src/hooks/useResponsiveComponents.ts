import { useState, useEffect } from 'react';

export interface ResponsiveConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
}

export const useResponsiveComponents = (): ResponsiveConfig => {
  const [config, setConfig] = useState<ResponsiveConfig>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLargeDesktop: false,
    screenWidth: 1920,
    screenHeight: 1080,
  });

  useEffect(() => {
    const updateConfig = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setConfig({
        isMobile: width <= 640,
        isTablet: width > 640 && width <= 1024,
        isDesktop: width > 1024 && width <= 1440,
        isLargeDesktop: width > 1440,
        screenWidth: width,
        screenHeight: height,
      });
    };

    updateConfig();
    window.addEventListener('resize', updateConfig);
    return () => window.removeEventListener('resize', updateConfig);
  }, []);

  return config;
};

export const getComponentVisibility = (config: ResponsiveConfig) => {
  return {
    // Core workflow - always visible
    showDocumentUpload: true,
    showSegmentation: true,
    showSearch: true,
    
    // Analytics - tablet and up
    showAnalytics: !config.isMobile,
    showProgressTracking: !config.isMobile,
    showAIInsights: !config.isMobile,
    
    // Management - desktop and up
    showCollaboration: config.isDesktop || config.isLargeDesktop,
    showNotifications: config.isDesktop || config.isLargeDesktop,
    showKnowledgeBase: config.isDesktop || config.isLargeDesktop,
    
    // Admin features - large desktop only
    showWorkflowAutomation: config.isLargeDesktop,
    showPerformanceMonitoring: config.isLargeDesktop,
    showDataAnalytics: config.isLargeDesktop,
    showSecurityCompliance: config.isLargeDesktop,
    showBackupRecovery: config.isLargeDesktop,
    showUserManagement: config.isLargeDesktop,
    showSystemHealthMonitor: config.isLargeDesktop,
    showAPIMonitoring: config.isLargeDesktop,
    showLogManagement: config.isLargeDesktop,
    showAuditTrail: config.isLargeDesktop,
    showReportingDashboard: config.isLargeDesktop,
    showIntegrationHub: config.isLargeDesktop,
  };
};

export const getLayoutConfig = (config: ResponsiveConfig) => {
  if (config.isMobile) {
    return {
      gridColumns: '1fr',
      gap: '16px',
      padding: '16px',
      cardSize: 'small',
      sidebarWidth: '0px',
      showSidebar: false,
    };
  }

  if (config.isTablet) {
    return {
      gridColumns: '1fr',
      gap: '20px',
      padding: '20px',
      cardSize: 'medium',
      sidebarWidth: '0px',
      showSidebar: false,
    };
  }

  if (config.isDesktop) {
    return {
      gridColumns: 'repeat(2, 1fr)',
      gap: '24px',
      padding: '24px',
      cardSize: 'medium',
      sidebarWidth: '280px',
      showSidebar: true,
    };
  }

  // Large desktop
  return {
    gridColumns: 'repeat(3, 1fr)',
    gap: '32px',
    padding: '32px',
    cardSize: 'large',
    sidebarWidth: '320px',
    showSidebar: true,
  };
};

export default useResponsiveComponents;

// src/config/homeTourSteps.ts
// Tour step definitions for the Home page
// Desktop: detailed widget-by-widget tour with coordinates
// Mobile: simplified section-based tour with scrollIntoView targets
import { TourStep } from '../components/UniversalTourGuide';

export function getHomeTourSteps(t: (key: string) => string, isMobile = false): TourStep[] {
  if (isMobile) {
    return getMobileTourSteps(t);
  }
  return getDesktopTourSteps(t);
}

function getMobileTourSteps(t: (key: string) => string): TourStep[] {
  return [
    {
      id: "welcome-mobile",
      title: t("tour.welcome.title") || "Καλώς ήρθατε!",
      content: t("tour.welcome.mobileContent") || "Σύρετε αριστερά/δεξιά από τις άκρες για πλοήγηση. Ας εξερευνήσουμε τα βασικά τμήματα.",
      position: "center",
      highlight: false,
    },
    {
      id: "workflow-section",
      title: t("home.section.workflow") || "Ροή Εργασίας",
      content: t("tour.workflow.mobileContent") || "Εδώ ανεβάζετε, κατατμίζετε και διαχειρίζεστε τα έγγραφά σας. Πατήστε τα εικονίδια για γρήγορες ενέργειες.",
      target: "#workflow-orchestration",
      position: "bottom",
      highlight: true,
      autoScroll: true,
    },
    {
      id: "quick-actions",
      title: t("tour.quickActions.title") || "Γρήγορες Ενέργειες",
      content: t("tour.quickActions.mobileContent") || "Πατήστε οποιοδήποτε εικονίδιο για μεταφόρτωση, αναζήτηση, ανάλυση ΤΝ και πολλά ακόμα.",
      target: ".academic-quick-actions, [data-tour='quick-actions']",
      position: "bottom",
      highlight: true,
      autoScroll: true,
    },
    {
      id: "document-picker",
      title: t("tour.documentPicker.title") || "Διαχείριση Εγγράφων",
      content: t("tour.documentPicker.mobileContent") || "Επιλέξτε, ανανεώστε ή διαγράψτε τα ανεβασμένα έγγραφά σας.",
      target: "[data-tour='document-picker']",
      position: "bottom",
      highlight: true,
      autoScroll: true,
    },
    {
      id: "insights-section",
      title: t("home.section.insights") || "Πληροφορίες & Δραστηριότητα",
      content: t("tour.insights.mobileContent") || "Ειδοποιήσεις, χρονολόγιο δραστηριότητας και στιγμιότυπα προόδου.",
      target: "#insights-zone",
      position: "bottom",
      highlight: true,
      autoScroll: true,
    },
    {
      id: "identity-section",
      title: t("home.section.identityTitle") || "Ταυτότητα Έρευνας",
      content: t("tour.identity.mobileContent") || "Συνδέστε πηγές, δείτε τα carousel εργαλείων και εξερευνήστε αναλυτικά.",
      target: "#identity-community",
      position: "bottom",
      highlight: true,
      autoScroll: true,
    },
    {
      id: "navigation-mobile",
      title: t("tour.navigation.title") || "Πλοήγηση",
      content: t("tour.navigation.mobileContent") || "Χρησιμοποιήστε τη μπάρα στο κάτω μέρος για γρήγορη εναλλαγή μεταξύ τμημάτων. Σύρετε δεξιά από την αριστερή άκρη για το μενού.",
      position: "center",
      highlight: false,
    },
  ];
}

function getDesktopTourSteps(t: (key: string) => string): TourStep[] {
  return [
    {
      id: "welcome",
      title: t("tour.welcome.title"),
      content: t("tour.welcome.content"),
      position: "custom",
      customPosition: { x: 1261, y: 0 },
      highlight: false
    },
    {
      id: "header",
      title: t("tour.header.title"),
      content: t("tour.header.content"),
      target: "[data-tour='header']",
      position: "bottom",
      highlight: true
    },
    {
      id: "viewModeToggle",
      title: t("tour.viewModeToggle.title") || "View Mode Toggle",
      content: t("tour.viewModeToggle.content") || "Switch between Grid, 3D Carousel, and Carousel views for all dashboard widgets.",
      position: "custom",
      customPosition: { x: 1200, y: 120 },
      highlight: false
    },
    {
      id: "researchDashboard",
      title: t("tour.researchDashboard.title"),
      content: t("tour.researchDashboard.content"),
      target: "[data-tour='research-dashboard']",
      position: "right",
      highlight: true
    },
    {
      id: "smartSuggestions",
      title: t("tour.smartSuggestions.title"),
      content: t("tour.smartSuggestions.content"),
      target: "[data-tour='smart-suggestions']",
      position: "custom",
      customPosition: { x: 898, y: 238 },
      highlight: true
    },
    {
      id: "advancedSearch",
      title: t("tour.advancedSearch.title"),
      content: t("tour.advancedSearch.content"),
      target: "[data-tour='advanced-search']",
      position: "custom",
      customPosition: { x: 1112, y: 221 },
      highlight: true
    },
    {
      id: "quickActions",
      title: t("tour.quickActions.title"),
      content: t("tour.quickActions.content"),
      target: "[data-tour='quick-actions']",
      position: "custom",
      customPosition: { x: 710, y: 551 },
      highlight: true
    },
    {
      id: "engagementMetrics",
      title: t("tour.engagementMetrics.title"),
      content: t("tour.engagementMetrics.content"),
      target: "[data-tour='engagement-metrics']",
      position: "custom",
      customPosition: { x: 616, y: 195 },
      highlight: true
    },
    {
      id: "progressTracking",
      title: t("tour.progressTracking.title"),
      content: t("tour.progressTracking.content"),
      target: "[data-tour='progress-tracking']",
      position: "custom",
      customPosition: { x: 899, y: 415 },
      highlight: true
    },
    {
      id: "aiInsights",
      title: t("tour.aiInsights.title"),
      content: t("tour.aiInsights.content"),
      target: "[data-tour='ai-insights']",
      position: "custom",
      customPosition: { x: 754, y: 182 },
      highlight: true
    },
    {
      id: "collaborationHub",
      title: t("tour.collaborationHub.title"),
      content: t("tour.collaborationHub.content"),
      target: "[data-tour='collaboration-hub']",
      position: "custom",
      customPosition: { x: 873, y: 436 },
      highlight: true
    },
    {
      id: "knowledgeBase",
      title: t("tour.knowledgeBase.title"),
      content: t("tour.knowledgeBase.content"),
      target: "[data-tour='knowledge-base']",
      position: "custom",
      customPosition: { x: 961, y: 311 },
      highlight: true
    },
    {
      id: "notificationCenter",
      title: t("tour.notificationCenter.title"),
      content: t("tour.notificationCenter.content"),
      target: "[data-tour='notification-center']",
      position: "custom",
      customPosition: { x: 882, y: 394 },
      highlight: true
    },
    {
      id: "workflowAutomation",
      title: t("tour.workflowAutomation.title"),
      content: t("tour.workflowAutomation.content"),
      target: "[data-tour='workflow-automation']",
      position: "custom",
      customPosition: { x: 1201, y: 504 },
      highlight: true
    },
    {
      id: "performanceMonitoring",
      title: t("tour.performanceMonitoring.title"),
      content: t("tour.performanceMonitoring.content"),
      target: "[data-tour='performance-monitoring']",
      position: "custom",
      customPosition: { x: 683, y: 438 },
      highlight: true
    },
    {
      id: "dataAnalytics",
      title: t("tour.dataAnalytics.title"),
      content: t("tour.dataAnalytics.content"),
      target: "[data-tour='data-analytics']",
      position: "custom",
      customPosition: { x: 623, y: 321 },
      highlight: true
    },
    {
      id: "securityCompliance",
      title: t("tour.securityCompliance.title"),
      content: t("tour.securityCompliance.content"),
      target: "[data-tour='security-compliance']",
      position: "custom",
      customPosition: { x: 811, y: 190 },
      highlight: true
    },
    {
      id: "backupRecovery",
      title: t("tour.backupRecovery.title"),
      content: t("tour.backupRecovery.content"),
      target: "[data-tour='backup-recovery']",
      position: "custom",
      customPosition: { x: 688, y: 272 },
      highlight: true
    },
    {
      id: "userManagement",
      title: t("tour.userManagement.title"),
      content: t("tour.userManagement.content"),
      target: "[data-tour='user-management']",
      position: "custom",
      customPosition: { x: 708, y: 320 },
      highlight: true
    },
    {
      id: "systemHealthMonitor",
      title: t("tour.systemHealthMonitor.title"),
      content: t("tour.systemHealthMonitor.content"),
      target: "[data-tour='system-health-monitor']",
      position: "custom",
      customPosition: { x: 571, y: 257 },
      highlight: true
    },
    {
      id: "apiMonitoring",
      title: t("tour.apiMonitoring.title"),
      content: t("tour.apiMonitoring.content"),
      target: "[data-tour='api-monitoring']",
      position: "custom",
      customPosition: { x: 751, y: 414 },
      highlight: true
    },
    {
      id: "logManagement",
      title: t("tour.logManagement.title"),
      content: t("tour.logManagement.content"),
      target: "[data-tour='log-management']",
      position: "custom",
      customPosition: { x: 615, y: 206 },
      highlight: true
    },
    {
      id: "auditTrail",
      title: t("tour.auditTrail.title"),
      content: t("tour.auditTrail.content"),
      target: "[data-tour='audit-trail']",
      position: "custom",
      customPosition: { x: 539, y: 217 },
      highlight: true
    },
    {
      id: "reportingDashboard",
      title: t("tour.reportingDashboard.title"),
      content: t("tour.reportingDashboard.content"),
      target: "[data-tour='reporting-dashboard']",
      position: "custom",
      customPosition: { x: 640, y: 250 },
      highlight: true
    },
    {
      id: "integrationHub",
      title: t("tour.integrationHub.title"),
      content: t("tour.integrationHub.content"),
      target: "[data-tour='integration-hub']",
      position: "custom",
      customPosition: { x: 964, y: 431 },
      highlight: true
    },
    {
      id: "documentPicker",
      title: t("tour.documentPicker.title"),
      content: t("tour.documentPicker.content"),
      target: "[data-tour='document-picker']",
      position: "custom",
      customPosition: { x: 830, y: 77 },
      highlight: true
    },
    {
      id: "uploadFlow",
      title: t("tour.uploadFlow.title"),
      content: t("tour.uploadFlow.content"),
      target: "[data-tour='upload-flow']",
      position: "custom",
      customPosition: { x: 830, y: 77 },
      highlight: true
    },
    {
      id: "segments",
      title: t("tour.segments.title"),
      content: t("tour.segments.content"),
      target: "[data-tour='segments']",
      position: "custom",
      customPosition: { x: 1075, y: 551 },
      highlight: true
    },
    {
      id: "uploadArea",
      title: t("tour.uploadArea.title"),
      content: t("tour.uploadArea.content"),
      target: "[data-tour='upload-area']",
      position: "custom",
      customPosition: { x: 512, y: 311 },
      highlight: true
    }
  ];
}
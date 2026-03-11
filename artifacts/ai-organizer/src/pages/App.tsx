// src/pages/App.tsx
import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute";
import Login from "./Login";
import { AIChatManager } from "../components/ai-chat";
import { ModernColorManager } from "../components/ModernColorManager";
import { ThemeStyles, ThemeProvider } from "../context/ThemeContext";
import "../styles/academic-theme.css";
import { ShortcutsProvider } from "../hooks/useKeyboardShortcuts";
import { ResponsiveProvider, ResponsiveStyles } from "../hooks/useResponsive";
import { SkeletonStyles } from "../components/ui/SkeletonLoader";
import { KeyboardShortcutsHelp } from "../components/ui/KeyboardShortcutsHelp";
import { CommandPaletteProvider } from "../components/CommandPalette";
import { NotificationProvider } from "../context/NotificationContext";
import { DragDropProvider } from "../components/DragDropUpload";
import { FavoritesProvider } from "../context/FavoritesContext";
import { ExportProvider } from "../utils/ExportTemplates";
import { CollaborationProvider } from "../context/CollaborationContext";
import { TeamProvider } from "../context/TeamContext";
import { UserDataProvider } from "../context/UserDataContext";
import { UserSkillsProvider } from "../context/UserSkillsContext";
import { ResearchIssuesProvider } from "../context/ResearchIssuesContext";
import { TheoryBranchingProvider } from "../context/TheoryBranchingContext";
import { AutomatedChecksProvider } from "../context/AutomatedChecksContext";
import { DiscussionForumsProvider } from "../context/DiscussionForumsContext";
import { AnalyticsProvider } from "../components/AnalyticsDashboard";
import { AIWritingProvider } from "../components/AIWritingAssistant";
import { OfflineProvider, OfflineIndicator } from "../utils/OfflineMode";
import { PluginProvider } from "../utils/PluginSystem";
import { LanguageProvider } from "../context/LanguageContext";
import { AIContextProvider } from "../context/AIContext";
import { ToastProvider } from "../components/ui/Toast";
import { EnhancedErrorBoundary } from "../components/ui/EnhancedErrorBoundary";
import { LayoutThemeProvider } from "../context/LayoutThemeContext";
import MobileSwipeProvider from "../components/MobileSwipeProvider";

// Lazy load heavy components for better performance
const Home = lazy(() => import("./Home"));
const HomeTheoryHub = lazy(() => import("./HomeTheoryHub"));
const SegmentDetails = lazy(() => import("./SegmentDetails"));
const DocumentWorkspace = lazy(() => import("./DocumentWorkspace"));
const DocumentViewer = lazy(() => import("./DocumentViewer"));
const EvidenceDebtDashboard = lazy(() => import("../components/EvidenceDebtDashboard"));
const SegmentGraphVisualizationPage = lazy(() => import("./SegmentGraphVisualizationPage"));
const LibraryPage = lazy(() => import("./LibraryPage"));
const RecycleBinPage = lazy(() => import("./RecycleBinPage"));
const BenchmarkAudit = lazy(() => import("./BenchmarkAudit"));
const BenchmarkPage = lazy(() => import("./BenchmarkPage"));
const ResearchHub = lazy(() => import("./ResearchHub"));
const FrontendWorkspace = lazy(() => import("./frontend/FrontendWorkspace"));
const FrontendWorkspaceResearchLab = lazy(() => import("./research-lab/ResearchLabPage"));
const SettingsPage = lazy(() => import("./SettingsPage"));
const ProfilePage = lazy(() => import("./ProfilePage"));
const ResearchIssuesPage = lazy(() => import("./ResearchIssuesPage"));
const ProjectBoardPage = lazy(() => import("./ProjectBoardPage"));
const ReviewRequestsPage = lazy(() => import("./ReviewRequestsPage"));
const EvidenceDependencyGraphPage = lazy(() => import("./EvidenceDependencyGraphPage"));
const ClaimStatusChecksPage = lazy(() => import("./ClaimStatusChecksPage"));
const ReleasePublicationPage = lazy(() => import("./ReleasePublicationPage"));
const ExplorePage = lazy(() => import("./ExplorePage"));
const DiscussionForumsPage = lazy(() => import("./DiscussionForumsPage"));
const PluginMarketplacePage = lazy(() => import("./PluginMarketplacePage"));
const CrossProjectSearchPage = lazy(() => import("./CrossProjectSearchPage"));
const CommunityProfilesPage = lazy(() => import("./CommunityProfilesPage"));
const DocumentBlamePage = lazy(() => import("./DocumentBlamePage"));
const DocumentDiffPage = lazy(() => import("./DocumentDiffPage"));
const TheoryRepoPage = lazy(() => import("./TheoryRepoPage"));
const ResearchWikiPage = lazy(() => import("./ResearchWikiPage"));
const ResearchDiscussionsPage = lazy(() => import("./ResearchDiscussionsPage"));
const ResearchAutomationPage = lazy(() => import("./ResearchAutomationPage"));
const ResearchProjectsBoardPage = lazy(() => import("./ResearchProjectsBoardPage"));
const GlobalSearchPage = lazy(() => import("./GlobalSearchPage"));
const ResearchMilestonesPage = lazy(() => import("./ResearchMilestonesPage"));
const MergeConflictPage = lazy(() => import("./MergeConflictPage"));
const TeamsPage = lazy(() => import("./TeamsPage"));
const CollectionsPage = lazy(() => import("./CollectionsPage"));
const ActivityPage = lazy(() => import("./ActivityPage"));
const DiscoverPage = lazy(() => import("./DiscoverPage"));
const OpportunitiesPage = lazy(() => import("./OpportunitiesPage"));
const MentoringPage = lazy(() => import("./MentoringPage"));
const EventsPage = lazy(() => import("./EventsPage"));
const InvestorDashboardPage = lazy(() => import("./InvestorDashboardPage"));
const ReferencesPage = lazy(() => import("./ReferencesPage"));
const CoursesPage = lazy(() => import("./CoursesPage"));
const BlockchainContributionPage = lazy(() => import("./BlockchainContributionPage"));

// Loading fallback component
const LoadingFallback = () => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "hsl(var(--background))",
      color: "hsl(var(--foreground))",
    }}
  >
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: "48px",
          height: "48px",
          border: "4px solid hsl(var(--border))",
          borderTopColor: "hsl(var(--primary))",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 16px",
        }}
      />
      <p style={{ fontSize: "14px", color: "hsl(var(--muted-foreground))" }}>Loading...</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
      <LayoutThemeProvider>
      <ResponsiveProvider>
        <OfflineProvider>
          <NotificationProvider>
            <FavoritesProvider>
              <TeamProvider>
              <UserDataProvider>
              <UserSkillsProvider>
              <ResearchIssuesProvider>
              <TheoryBranchingProvider>
              <AutomatedChecksProvider>
              <DiscussionForumsProvider>
              <CollaborationProvider>
                <AnalyticsProvider>
                  <AIWritingProvider>
                    <ExportProvider>
                      <PluginProvider>
                        <DragDropProvider>
                          <ShortcutsProvider>
                            <CommandPaletteProvider>
                              <ToastProvider>
                                <EnhancedErrorBoundary>
                                  <MobileSwipeProvider>
                                  {/* Global styles */}
                                  <ThemeStyles />
                                  <ResponsiveStyles />
                                  <SkeletonStyles />
                                  
                                  <Suspense fallback={<LoadingFallback />}>
                                    <Routes>
                                      <Route path="/login" element={<Login />} />

                                      {/* Protected area */}
                                      <Route element={<ProtectedRoute />}>
                                        <Route path="/" element={<Home />} />
                                        <Route path="/home-compact" element={<Home />} />
                                        <Route path="/segments/:segmentId" element={<SegmentDetails />} />
                                        <Route path="/documents/:documentId/view" element={<DocumentViewer />} />
                                        <Route path="/documents/:documentId" element={<DocumentWorkspace />} />
                                        <Route path="/documents/:documentId/dashboard" element={<EvidenceDebtDashboard />} />
                                        <Route path="/documents/:documentId/graph" element={<SegmentGraphVisualizationPage />} />
                                        <Route path="/library" element={<LibraryPage />} />
                                        <Route path="/recycle-bin" element={<RecycleBinPage />} />
                                        <Route path="/admin/benchmark" element={<BenchmarkAudit />} />
                                        <Route path="/benchmark" element={<BenchmarkPage />} />
                                        <Route path="/research/:section?" element={<ResearchHub />} />
                                        <Route path="/theory-hub" element={<HomeTheoryHub />} />
                                        <Route path="/frontend" element={<FrontendWorkspace />} />
                                        <Route path="/research-lab" element={<FrontendWorkspaceResearchLab />} />
                                        <Route path="/settings/:section?" element={<SettingsPage />} />
                                        <Route path="/profile" element={<ProfilePage />} />
                                        <Route path="/issues" element={<ResearchIssuesPage />} />
                                        <Route path="/projects" element={<ProjectBoardPage />} />
                                        <Route path="/reviews" element={<ReviewRequestsPage />} />
                                        <Route path="/evidence-graph" element={<EvidenceDependencyGraphPage />} />
                                        <Route path="/claim-checks" element={<ClaimStatusChecksPage />} />
                                        <Route path="/releases" element={<ReleasePublicationPage />} />
                                        <Route path="/explore" element={<ExplorePage />} />
                                        <Route path="/discussions" element={<DiscussionForumsPage />} />
                                        <Route path="/marketplace" element={<PluginMarketplacePage />} />
                                        <Route path="/search" element={<CrossProjectSearchPage />} />
                                        <Route path="/community" element={<CommunityProfilesPage />} />
                                        <Route path="/documents/:documentId/blame" element={<DocumentBlamePage />} />
                                        <Route path="/documents/:documentId/diff" element={<DocumentDiffPage />} />
                                        <Route path="/theory-repo" element={<TheoryRepoPage />} />
                                        <Route path="/wiki" element={<ResearchWikiPage />} />
                                        <Route path="/research-discussions" element={<ResearchDiscussionsPage />} />
                                        <Route path="/automation" element={<ResearchAutomationPage />} />
                                        <Route path="/kanban" element={<ResearchProjectsBoardPage />} />
                                        <Route path="/global-search" element={<GlobalSearchPage />} />
                                        <Route path="/milestones" element={<ResearchMilestonesPage />} />
                                        <Route path="/merge-conflicts" element={<MergeConflictPage />} />
                                        <Route path="/teams" element={<TeamsPage />} />
                                        <Route path="/collections" element={<CollectionsPage />} />
                                        <Route path="/activity" element={<ActivityPage />} />
                                        <Route path="/discover" element={<DiscoverPage />} />
                                        <Route path="/opportunities" element={<OpportunitiesPage />} />
                                        <Route path="/mentoring" element={<MentoringPage />} />
                                        <Route path="/events" element={<EventsPage />} />
                                        <Route path="/investor" element={<InvestorDashboardPage />} />
                                        <Route path="/references" element={<ReferencesPage />} />
                                        <Route path="/courses" element={<CoursesPage />} />
                                        <Route path="/blockchain" element={<BlockchainContributionPage />} />
                                      </Route>

                                      {/* fallback */}
                                      <Route path="*" element={<Navigate to="/" replace />} />
                                    </Routes>
                                
                                {/* Global AI Chat Manager - Available on all pages except Login */}
                                <AIContextProvider>
                                  <AIChatManager />
                                </AIContextProvider>
                                
                                {/* Global Theme Manager - Available on all pages for admins */}
                                <ModernColorManager />
                              </Suspense>

                              {/* Global UI Components */}
                              <OfflineIndicator />
                              <KeyboardShortcutsHelp />
                              </MobileSwipeProvider>
                              </EnhancedErrorBoundary>
                            </ToastProvider>
                            </CommandPaletteProvider>
                          </ShortcutsProvider>
                        </DragDropProvider>
                      </PluginProvider>
                    </ExportProvider>
                  </AIWritingProvider>
                </AnalyticsProvider>
              </CollaborationProvider>
              </DiscussionForumsProvider>
              </AutomatedChecksProvider>
              </TheoryBranchingProvider>
              </ResearchIssuesProvider>
              </UserSkillsProvider>
              </UserDataProvider>
              </TeamProvider>
            </FavoritesProvider>
          </NotificationProvider>
        </OfflineProvider>
      </ResponsiveProvider>
      </LayoutThemeProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

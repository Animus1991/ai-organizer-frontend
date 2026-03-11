/**
 * Enhanced Research Hub - Material Design 3 Implementation
 * Industry Standards 2024-2025
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AspectRatio } from "../../components/ui/AspectRatio";
import { TourStep, useTour } from "../../components/UniversalTourGuide";
import { Card } from "./components/Card";
import { useResearchHubState } from "./hooks/useResearchHubState";
import { EnhancedButton, EnhancedCard, EnhancedInput, EnhancedBadge, EnhancedSkeleton } from "../../components/ui/enhanced";
import { CompactExpandedToggle } from "../../components/ui/CompactExpandedToggle";

export default function EnhancedResearchHubLayout() {
  const nav = useNavigate();
  const hub = useResearchHubState();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

  // Extract essential state
  const {
    query,
    setQuery,
    runSearch,
    runDoiLookup,
    runZoteroSync,
    loadLibrary,
    exportBibTex,
    status,
    zoteroAuthEncrypted,
    zoteroAutoSyncEnabled,
    denseMode,
    setDenseMode,
    openalexResults,
    semanticResults,
    arxivResults,
    selectedDocumentId,
  } = hub;

  const isLoading = isSearching || status.toLowerCase().includes("search");

  // Enhanced tour steps with Material Design 3
  const tourSteps: TourStep[] = [
    {
      id: "welcome",
      title: "Welcome to Enhanced Research Hub",
      content: "Experience the power of modern research tools with Material Design 3. Unified search, intelligent analytics, and seamless integrations.",
      position: "center",
      highlight: false
    },
    {
      id: "unifiedSearch",
      title: "Smart Unified Search",
      content: "Search across OpenAlex, Semantic Scholar, and arXiv with intelligent suggestions and real-time results.",
      target: "[data-tour='unified-search']",
      position: "bottom",
      highlight: true
    },
    {
      id: "enhancedAnalytics",
      title: "Advanced Analytics Dashboard",
      content: "Interactive visualizations, citation metrics, and research impact analysis with modern data visualization.",
      target: "[data-tour='analytics-dashboard']",
      position: "left",
      highlight: true
    },
    {
      id: "smartLibrary",
      title: "Intelligent Research Library",
      content: "AI-powered organization, smart tagging, and collaborative features for your research collection.",
      target: "[data-tour='smart-library']",
      position: "right",
      highlight: true
    }
  ];

  const { isOpen: isTourOpen, startTour, closeTour, TourComponent } = useTour(tourSteps, "enhancedResearchHubTourSeen");

  // Enhanced search with debouncing
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      if (query.trim()) {
        setIsSearching(true);
        runSearch();
        setTimeout(() => setIsSearching(false), 1000);
      }
    }, 300),
    [runSearch]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    setQuery(newQuery);
    debouncedSearch(newQuery);
  }, [setQuery, debouncedSearch]);

  // Enhanced action handlers
  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'run-search':
        runSearch();
        break;
      case 'doi-lookup':
        runDoiLookup();
        break;
      case 'zotero-sync':
        runZoteroSync();
        break;
      case 'load-library':
        loadLibrary();
        break;
      case 'export-citations':
        exportBibTex();
        break;
      default:
        console.log('Action:', action);
    }
  }, [runSearch, runDoiLookup, runZoteroSync, loadLibrary, exportBibTex]);

  // Enhanced tabs
  const tabs: Array<{
    id: string;
    label: string;
    icon: string;
    count: number;
  }> = [
    { id: 'search', label: 'Search', icon: '🔍', count: openalexResults?.length || 0 },
    { id: 'library', label: 'Library', icon: '📚', count: 0 },
    { id: 'analytics', label: 'Analytics', icon: '📊', count: 0 },
    { id: 'integrations', label: 'Integrations', icon: '🔗', count: 0 }
  ];

  return (
    <div className="min-h-screen bg-surface-1 text-neutral-100">
      {/* Compact/Expanded Toggle */}
      <CompactExpandedToggle
        mode={denseMode ? "compact" : "expanded"}
        onModeChange={(mode) => setDenseMode(mode === "compact")}
      />
      
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 bg-surface-2/80 backdrop-blur-lg border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-neutral-100">Research Hub</h1>
              <div className="flex items-center gap-2">
                {zoteroAuthEncrypted && (
                  <EnhancedBadge variant="success" size="sm">
                    Zotero Connected
                  </EnhancedBadge>
                )}
                {zoteroAutoSyncEnabled && (
                  <EnhancedBadge variant="secondary" size="sm">
                    Auto-Sync Active
                  </EnhancedBadge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4" style={{ marginTop: "-2px", marginLeft: "auto" }}>
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={startTour}
              >
                Start Tour
              </EnhancedButton>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Navigation Tabs */}
      <div className="border-b border-neutral-800 bg-surface-2/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-600'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  <span>{tab.icon}</span>
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="bg-neutral-700 text-neutral-200 px-2 py-0.5 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${denseMode ? "py-4" : "py-8"}`}>
        {/* Enhanced Search Section */}
        {activeTab === 'search' && (
          <div data-tour="unified-search" className={denseMode ? "space-y-4" : "space-y-6"}>
            <EnhancedCard className="p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-100 mb-2">
                    Unified Literature Search
                  </h2>
                  <p className="text-neutral-400">
                    Search OpenAlex, Semantic Scholar, and arXiv simultaneously
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <EnhancedInput
                      placeholder="Search papers, authors, institutions..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      leftIcon={<span className="text-neutral-400">🔍</span>}
                      rightIcon={isSearching && (
                    <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full" />
                      )}
                    />
                  </div>
                  
                  <EnhancedButton
                    onClick={runSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    loading={isSearching}
                  >
                    Search
                  </EnhancedButton>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-4">
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction('doi-lookup')}
                  >
                    🔗 DOI Lookup
                  </EnhancedButton>
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction('zotero-sync')}
                  >
                    📚 Sync Zotero
                  </EnhancedButton>
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction('load-library')}
                  >
                    📖 Load Library
                  </EnhancedButton>
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction('export-citations')}
                  >
                    📤 Export Citations
                  </EnhancedButton>
                </div>
              </div>
            </EnhancedCard>

            {/* Results Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* OpenAlex Results */}
              <EnhancedCard className="p-6">
                <h3 className="text-lg font-semibold text-neutral-100 mb-4">
                  OpenAlex Results
                </h3>
                {isLoading ? (
                  <div className="space-y-3">
                    <EnhancedSkeleton lines={3} />
                    <EnhancedSkeleton lines={2} />
                  </div>
                ) : openalexResults && openalexResults.length > 0 ? (
                  <div className="space-y-3">
                    {openalexResults.slice(0, 5).map((result, index) => (
                      <div key={index} className="p-3 bg-surface-3 rounded-lg">
                        <h4 className="font-medium text-neutral-100 text-sm">
                          {result.title || 'Untitled'}
                        </h4>
                        <p className="text-neutral-400 text-xs mt-1">
                          {result.authors?.[0] || 'Unknown Author'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-400">
                    No results found
                  </div>
                )}
              </EnhancedCard>

              {/* Semantic Scholar Results */}
              <EnhancedCard className="p-6">
                <h3 className="text-lg font-semibold text-neutral-100 mb-4">
                  Semantic Scholar Results
                </h3>
                {isLoading ? (
                  <div className="space-y-3">
                    <EnhancedSkeleton lines={3} />
                    <EnhancedSkeleton lines={2} />
                  </div>
                ) : semanticResults && semanticResults.length > 0 ? (
                  <div className="space-y-3">
                    {semanticResults.slice(0, 5).map((result, index) => (
                      <div key={index} className="p-3 bg-surface-3 rounded-lg">
                        <h4 className="font-medium text-neutral-100 text-sm">
                          {result.title || 'Untitled'}
                        </h4>
                        <p className="text-neutral-400 text-xs mt-1">
                          {result.authors?.slice(0, 2).join(', ') || 'Unknown Authors'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-400">
                    No results found
                  </div>
                )}
              </EnhancedCard>

              {/* arXiv Results */}
              <EnhancedCard className="p-6">
                <h3 className="text-lg font-semibold text-neutral-100 mb-4">
                  arXiv Results
                </h3>
                {isLoading ? (
                  <div className="space-y-3">
                    <EnhancedSkeleton lines={3} />
                    <EnhancedSkeleton lines={2} />
                  </div>
                ) : arxivResults && arxivResults.length > 0 ? (
                  <div className="space-y-3">
                    {arxivResults.slice(0, 5).map((result, index) => (
                      <div key={index} className="p-3 bg-surface-3 rounded-lg">
                        <h4 className="font-medium text-neutral-100 text-sm">
                          {result.title || 'Untitled'}
                        </h4>
                        <p className="text-neutral-400 text-xs mt-1">
                          {result.authors?.slice(0, 2).join(', ') || 'Unknown Authors'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-400">
                    No results found
                  </div>
                )}
              </EnhancedCard>
            </div>
          </div>
        )}

        {/* Enhanced Library Tab */}
        {activeTab === 'library' && (
          <div data-tour="smart-library" className="space-y-6">
            <EnhancedCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-100">
                    Research Library
                  </h2>
                  <p className="text-neutral-400">
                    Manage your research collection with smart organization
                  </p>
                </div>
                <EnhancedButton onClick={() => handleQuickAction('load-library')}>
                  Load Library
                </EnhancedButton>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-surface-3 rounded-lg text-center">
                  <div className="text-2xl mb-2">📚</div>
                  <div className="text-2xl font-bold text-primary-500">0</div>
                  <div className="text-sm text-neutral-400">Total Papers</div>
                </div>
                <div className="p-4 bg-surface-3 rounded-lg text-center">
                  <div className="text-2xl mb-2">🏷️</div>
                  <div className="text-2xl font-bold text-secondary-500">0</div>
                  <div className="text-sm text-neutral-400">Tags</div>
                </div>
                <div className="p-4 bg-surface-3 rounded-lg text-center">
                  <div className="text-2xl mb-2">📁</div>
                  <div className="text-2xl font-bold text-success-500">0</div>
                  <div className="text-sm text-neutral-400">Collections</div>
                </div>
                <div className="p-4 bg-surface-3 rounded-lg text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-2xl font-bold text-warning-500">0</div>
                  <div className="text-sm text-neutral-400">Citations</div>
                </div>
              </div>
            </EnhancedCard>
          </div>
        )}

        {/* Enhanced Analytics Tab */}
        {activeTab === 'analytics' && (
          <div data-tour="analytics-dashboard" className="space-y-6">
            <EnhancedCard className="p-6">
              <h2 className="text-xl font-semibold text-neutral-100 mb-6">
                Research Analytics Dashboard
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 bg-surface-3 rounded-lg">
                  <h3 className="text-sm font-medium text-neutral-400 mb-2">Total Searches</h3>
                  <div className="text-3xl font-bold text-primary-500">0</div>
                </div>
                <div className="p-4 bg-surface-3 rounded-lg">
                  <h3 className="text-sm font-medium text-neutral-400 mb-2">Papers Found</h3>
                  <div className="text-3xl font-bold text-success-500">0</div>
                </div>
                <div className="p-4 bg-surface-3 rounded-lg">
                  <h3 className="text-sm font-medium text-neutral-400 mb-2">Citations Exported</h3>
                  <div className="text-3xl font-bold text-secondary-500">0</div>
                </div>
              </div>
            </EnhancedCard>
          </div>
        )}

        {/* Enhanced Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <EnhancedCard className="p-6">
              <h2 className="text-xl font-semibold text-neutral-100 mb-6">
                Research Integrations
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-surface-3 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">📚</div>
                      <div>
                        <h3 className="font-medium text-neutral-100">Zotero</h3>
                        <p className="text-sm text-neutral-400">Reference Manager</p>
                      </div>
                    </div>
                    <EnhancedBadge variant={zoteroAuthEncrypted ? 'success' : 'secondary'}>
                      {zoteroAuthEncrypted ? 'Connected' : 'Not Connected'}
                    </EnhancedBadge>
                  </div>
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction('zotero-sync')}
                    disabled={!zoteroAuthEncrypted}
                  >
                    Sync Library
                  </EnhancedButton>
                </div>

                <div className="p-4 bg-surface-3 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🔗</div>
                      <div>
                        <h3 className="font-medium text-neutral-100">Crossref</h3>
                        <p className="text-sm text-neutral-400">DOI Resolver</p>
                      </div>
                    </div>
                    <EnhancedBadge variant="success">
                      Active
                    </EnhancedBadge>
                  </div>
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction('doi-lookup')}
                  >
                    Lookup DOI
                  </EnhancedButton>
                </div>
              </div>
            </EnhancedCard>
          </div>
        )}
      </main>

      {/* Tour Component */}
      <TourComponent />

    </div>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

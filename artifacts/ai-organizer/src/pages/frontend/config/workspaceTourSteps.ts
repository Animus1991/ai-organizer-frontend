import type { TourStep } from '../../../components/UniversalTourGuide';

export function createWorkspaceTourSteps(): TourStep[] {
  return [
    {
      id: 'welcome',
      title: '🧠 Welcome to Thinking Workspace',
      content: 'This is your intelligent thinking workspace with advanced document analysis, slot management, and AI-powered insights. Let me show you the key features.',
      coordinates: { x: 960, y: 100, scrollY: 0 },
      autoScroll: true,
      smartPositioning: true,
      delay: 500
    },
    {
      id: 'topbar',
      title: '🎛️ Workspace Control Center',
      content: 'Access workspace statistics, toggle select mode, manage pending items, and start guided tours from this central control panel.',
      coordinates: { x: 960, y: 100, scrollY: 0 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'document-picker',
      title: '📚 Document Management Hub',
      content: 'Select, upload, and manage your documents. View real-time statistics and access document collections with intelligent filtering.',
      coordinates: { x: 300, y: 200, scrollY: 200 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'search-panel',
      title: '🔍 Advanced Search Engine',
      content: 'Powerful semantic search with AI-powered results, advanced filtering, and intelligent document discovery algorithms.',
      coordinates: { x: 300, y: 400, scrollY: 400 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'results-list',
      title: '📋 Search Results Intelligence',
      content: 'AI-ranked search results with relevance scoring, preview capabilities, and smart export options for research workflows.',
      coordinates: { x: 300, y: 600, scrollY: 600 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'segments-list',
      title: '🧩 Smart Segmentation Panel',
      content: 'Intelligent document segments with AI-powered categorization, batch operations, and advanced filtering capabilities.',
      coordinates: { x: 300, y: 800, scrollY: 800 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'pinned-chunks',
      title: '📌 Quick Access Library',
      content: 'Your pinned content library with instant access, organization tools, and smart categorization for efficient research.',
      coordinates: { x: 300, y: 1000, scrollY: 1000 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'slots-grid',
      title: '🎯 Dynamic Slots System',
      content: '9-slot intelligent workspace with drag-and-drop, comparison mode, notepad integration, and AI-powered slot suggestions. Switch between Grid, 3D Carousel, and Carousel views using the view mode toggle.',
      coordinates: { x: 1200, y: 300, scrollY: 300 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'view-modes',
      title: '🎠 View Mode Toggle',
      content: 'Switch between Grid, 3D Carousel, and Carousel views for your slots. Each mode offers a different way to browse and interact with your content panels.',
      coordinates: { x: 1200, y: 250, scrollY: 250 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'compare-panel',
      title: '⚖️ Compare Mode',
      content: 'Click the Compare button to enter comparison mode, then select 2 slots to compare side-by-side. A hint banner will guide you through the process. Use Deep Compare for AI-powered analysis with difference highlighting.',
      coordinates: { x: 1200, y: 600, scrollY: 600 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'floating-notepads',
      title: '📝 Tabbed Notepads',
      content: 'Create multiple floating notepads with browser-like tabs. Use the + button inside the tab bar to add new tabs, rename them by double-clicking, and close tabs individually. Click "New Notepad" to create additional notepad windows.',
      coordinates: { x: 960, y: 400, scrollY: 1200 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'analytics-dashboard',
      title: '📊 Thinking Analytics & Intelligence',
      content: 'Intelligent analytics dashboard with document engagement metrics, research progress tracking, AI insights, performance monitoring, data analytics, notifications, and advanced search - all tailored for optimal thinking and research workflows.',
      coordinates: { x: 960, y: 200, scrollY: 1500 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'tour-complete',
      title: '🎉 Thinking Workspace Ready!',
      content: 'Your workspace is fully equipped with: dynamic slots (grid/carousel/3D views), intelligent comparison tools, tabbed notepads, analytics dashboards, and AI-powered insights. Use Ctrl+M for quick compare toggle. Happy researching!',
      coordinates: { x: 960, y: 100, scrollY: 1800 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    }
  ];
}

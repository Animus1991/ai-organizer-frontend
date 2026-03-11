/**
 * Conversation Browser Component
 * Browse and manage imported conversations with advanced filtering
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { HelpModal } from '../../../components/HelpAboutModals';
import { useTour, type TourStep } from '../../../components/tour/useTour';
import { TourPanel } from '../../../components/tour/TourPanel';
import { 
  ConversationStorageStats, 
  StoredConversation, 
  conversationStorage 
} from '../services/ConversationStorageService';

type SavedView = {
  id: string;
  name: string;
  searchQuery: string;
  selectedPlatform: string;
  sortBy: 'date' | 'title' | 'messages';
  viewMode: 'grid' | 'list';
  showFavoritesOnly: boolean;
  showArchived: boolean;
  dateFilter: 'all' | 'today' | 'week' | 'month' | 'custom';
  customDateRange: {start: Date|null, end: Date|null};
};

type ExportFormat = 'json' | 'csv' | 'md';
type ExportScope = 'selected' | 'filtered' | 'all';
type ExportGranularity = 'metadata' | 'messages' | 'segments' | 'full';

const SAVED_VIEWS_KEY = 'conversationBrowserSavedViews';

interface ConversationBrowserProps {
  onSelectConversation?: (conversation: StoredConversation) => void;
  onDeleteConversation?: (id: string) => void;
  onViewAnalytics?: () => void;
  onImportClick?: () => void;
  onClose?: () => void;
}

const platformIcons: Record<string, string> = {
  chatgpt: '🤖',
  claude: '🧠',
  gemini: '♊',
  copilot: '🪟',
  perplexity: '🔍',
  metaai: '👤',
  pi: 'π',
  characterai: '🎭',
  deepseek: '🐋',
  mistral: '🌪️',
  you: '❓',
  huggingface: '🤗'
};

const platformNames: Record<string, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  copilot: 'Copilot',
  perplexity: 'Perplexity',
  metaai: 'Meta AI',
  pi: 'Pi AI',
  characterai: 'Character.AI',
  deepseek: 'DeepSeek',
  mistral: 'Mistral',
  you: 'You.com',
  huggingface: 'HuggingChat'
};

export const ConversationBrowser: React.FC<ConversationBrowserProps> = ({
  onSelectConversation,
  onDeleteConversation,
  onViewAnalytics,
  onImportClick,
  onClose,
}) => {
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const tourContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchIconRef = useRef<HTMLSpanElement | null>(null);
  const resultsScrollRef = useRef<HTMLDivElement | null>(null);
  const tourRefs = {
    header: useRef<HTMLDivElement | null>(null),
    stats: useRef<HTMLDivElement | null>(null),
    search: useRef<HTMLDivElement | null>(null),
    grid: useRef<HTMLDivElement | null>(null),
    actions: useRef<HTMLDivElement | null>(null),
  };

  const [conversations, setConversations] = useState<StoredConversation[]>(
    conversationStorage.getAllConversations()
  );
  const [stats, setStats] = useState<ConversationStorageStats>(
    conversationStorage.getStats()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'messages'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('conversationArchived');
    return new Set(saved ? JSON.parse(saved) : []);
  });
  const [compareOpen, setCompareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [exportScope, setExportScope] = useState<ExportScope>('selected');
  const [exportGranularity, setExportGranularity] = useState<ExportGranularity>('full');
  const [savedViewsOpen, setSavedViewsOpen] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => {
    const raw = localStorage.getItem(SAVED_VIEWS_KEY);
    try {
      return raw ? (JSON.parse(raw) as SavedView[]) : [];
    } catch {
      return [];
    }
  });
  const [helpOpen, setHelpOpen] = useState(false);

  // Open Help with Ctrl+/
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setHelpOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const [renamingViewId, setRenamingViewId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [resultsScrollTop, setResultsScrollTop] = useState(0);
  const [resultsHeight, setResultsHeight] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('conversationFavorites');
    return new Set(saved ? JSON.parse(saved) : []);
  });
  const [previewConv, setPreviewConv] = useState<StoredConversation | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<{start: Date|null, end: Date|null}>({start: null, end: null});
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('conversationPinned');
    return new Set(saved ? JSON.parse(saved) : []);
  });
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('conversationRecentSearches');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [hoveredSuggestion, setHoveredSuggestion] = useState<number | null>(null);
  const [hoveredClearButton, setHoveredClearButton] = useState(false);
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);
  const activeSuggestionId = useMemo(() => (
    hoveredSuggestion !== null ? `search-suggestion-${hoveredSuggestion}` : undefined
  ), [hoveredSuggestion]);
  const [liveMessage, setLiveMessage] = useState('');
  const [animateExport, setAnimateExport] = useState(false);
  const [animateSavedViews, setAnimateSavedViews] = useState(false);
  const [animateCompare, setAnimateCompare] = useState(false);
  const [animatePreview, setAnimatePreview] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const savedViewsRef = useRef<HTMLDivElement | null>(null);
  const compareRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);


  const handleCloseExportOverlay = useCallback(() => {
    setAnimateExport(false);
    setTimeout(() => setExportOpen(false), 180);
  }, []);
  const handleCloseSavedViewsOverlay = useCallback(() => {
    setAnimateSavedViews(false);
    setTimeout(() => setSavedViewsOpen(false), 180);
  }, []);
  const handleClosePreviewOverlay = useCallback(() => {
    setAnimatePreview(false);
    setTimeout(() => setPreviewConv(null), 180);
  }, []);
  const handleCloseCompareOverlay = useCallback(() => {
    setAnimateCompare(false);
    setTimeout(() => setCompareOpen(false), 180);
  }, []);

  useEffect(() => {
    const unsubscribe = conversationStorage.subscribe(() => {
      setConversations(conversationStorage.getAllConversations());
      setStats(conversationStorage.getStats());
    });
    return unsubscribe;
  }, []);

  // Focus-trap and open animations for modals
  useEffect(() => {
    if (!exportOpen) return;
    setAnimateExport(true);
    const el = exportRef.current;
    if (!el) return;
    const selectors = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(el.querySelectorAll(selectors)) as HTMLElement[];
    focusables[0]?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseExportOverlay();
      }
      if (e.key === 'Tab' && focusables.length) {
        const i = focusables.indexOf(document.activeElement as HTMLElement);
        let next = i;
        if (e.shiftKey) next = i <= 0 ? focusables.length - 1 : i - 1; else next = i === focusables.length - 1 ? 0 : i + 1;
        e.preventDefault();
        (focusables[next] || focusables[0]).focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [exportOpen, handleCloseExportOverlay]);

  useEffect(() => {
    if (!savedViewsOpen) return;
    setAnimateSavedViews(true);
    const el = savedViewsRef.current;
    if (!el) return;
    const selectors = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(el.querySelectorAll(selectors)) as HTMLElement[];
    focusables[0]?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseSavedViewsOverlay();
      }
      if (e.key === 'Tab' && focusables.length) {
        const i = focusables.indexOf(document.activeElement as HTMLElement);
        let next = i;
        if (e.shiftKey) next = i <= 0 ? focusables.length - 1 : i - 1; else next = i === focusables.length - 1 ? 0 : i + 1;
        e.preventDefault();
        (focusables[next] || focusables[0]).focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [savedViewsOpen, handleCloseSavedViewsOverlay]);

  useEffect(() => {
    if (!compareOpen) return;
    setAnimateCompare(true);
    const el = compareRef.current;
    if (!el) return;
    const selectors = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(el.querySelectorAll(selectors)) as HTMLElement[];
    focusables[0]?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseCompareOverlay();
      }
      if (e.key === 'Tab' && focusables.length) {
        const i = focusables.indexOf(document.activeElement as HTMLElement);
        let next = i;
        if (e.shiftKey) next = i <= 0 ? focusables.length - 1 : i - 1; else next = i === focusables.length - 1 ? 0 : i + 1;
        e.preventDefault();
        (focusables[next] || focusables[0]).focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [compareOpen, handleCloseCompareOverlay]);

  useEffect(() => {
    if (!previewConv) return;
    setAnimatePreview(true);
    const el = previewRef.current;
    if (!el) return;
    const selectors = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(el.querySelectorAll(selectors)) as HTMLElement[];
    focusables[0]?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClosePreviewOverlay();
      }
      if (e.key === 'Tab' && focusables.length) {
        const i = focusables.indexOf(document.activeElement as HTMLElement);
        let next = i;
        if (e.shiftKey) next = i <= 0 ? focusables.length - 1 : i - 1; else next = i === focusables.length - 1 ? 0 : i + 1;
        e.preventDefault();
        (focusables[next] || focusables[0]).focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [previewConv, handleClosePreviewOverlay]);

  useEffect(() => {
    localStorage.setItem('conversationFavorites', JSON.stringify([...favorites]));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(savedViews));
  }, [savedViews]);

  useEffect(() => {
    localStorage.setItem('conversationArchived', JSON.stringify([...archivedIds]));
  }, [archivedIds]);

  useEffect(() => {
    localStorage.setItem('conversationPinned', JSON.stringify([...pinnedIds]));
  }, [pinnedIds]);

  useEffect(() => {
    const updateHeight = () => {
      if (!resultsScrollRef.current) return;
      setResultsHeight(resultsScrollRef.current.clientHeight);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const tourSteps: TourStep[] = useMemo(() => {
    return [
      {
        key: 'header',
        title: 'Browse Chats',
        body: 'Εδώ βλέπεις όλες τις εισαγμένες συνομιλίες σου. Χρησιμοποίησε Import/Analytics και το Help για το tour.',
        ref: tourRefs.header,
      },
      {
        key: 'stats',
        title: 'Quick Stats',
        body: 'Γρήγορη εικόνα για συνομιλίες, μηνύματα, platforms και favorites.',
        ref: tourRefs.stats,
      },
      {
        key: 'search',
        title: 'Search & Filters',
        body: 'Αναζήτηση, φίλτρα platform, ταξινόμηση, προβολή grid/list και favorites-only mode.',
        ref: tourRefs.search,
      },
      {
        key: 'grid',
        title: 'Conversation Cards',
        body: 'Κάνε click για να ανοίξεις τη συνομιλία. Hover για γρήγορα actions (favorite, select, delete).',
        ref: tourRefs.grid,
      },
      {
        key: 'actions',
        title: 'Bulk Actions',
        body: 'Επίλεξε conversations (☐) για να κάνεις export, delete, bulk favorite/unfavorite ή compare 2 chats.',
        ref: tourRefs.actions,
      },
    ];
  }, [tourRefs.actions, tourRefs.grid, tourRefs.header, tourRefs.search, tourRefs.stats]);

  const {
    tourOpen,
    tourStepIndex,
    tourPopoverPos,
    tourSteps: tourStepsList,
    startTour,
    closeTour,
    nextTourStep,
    prevTourStep,
    getTourHighlightStyle,
  } = useTour({
    storageKey: 'conversationBrowserTourSeen',
    steps: tourSteps,
    containerRef: tourContainerRef,
    autoStart: true,
    minGutterWidth: 420,
  });

  const toggleArchive = useCallback((id: string) => {
    const newArchived = new Set(archivedIds);
    if (newArchived.has(id)) {
      newArchived.delete(id);
    } else {
      newArchived.add(id);
    }
    setArchivedIds(newArchived);
    localStorage.setItem('conversationArchived', JSON.stringify([...newArchived]));
  }, [archivedIds]);

  const togglePin = useCallback((id: string) => {
    const newPinned = new Set(pinnedIds);
    if (newPinned.has(id)) {
      newPinned.delete(id);
    } else {
      newPinned.add(id);
    }
    setPinnedIds(newPinned);
    localStorage.setItem('conversationPinned', JSON.stringify([...newPinned]));
  }, [pinnedIds]);

  const filteredConversations = useMemo(() => {
    // Split into pinned and unpinned first
    const pinned = conversations.filter(c => pinnedIds.has(c.id));
    const unpinned = conversations.filter(c => !pinnedIds.has(c.id));

    // Apply search and other filters to both groups
    const filterFn = (conv: StoredConversation) => {
      if (searchQuery && !conv.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedPlatform !== 'all' && conv.platform !== selectedPlatform) return false;
      if (showFavoritesOnly && !favorites.has(conv.id)) return false;
      if (!showArchived && archivedIds.has(conv.id)) return false;
      
      // Date filters
      const convDate = new Date(conv.startTime);
      switch(dateFilter) {
        case 'today':
          return convDate.toDateString() === new Date().toDateString();
        case 'week':
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          return convDate >= weekStart;
        case 'month':
          return convDate.getMonth() === new Date().getMonth() && 
                 convDate.getFullYear() === new Date().getFullYear();
        case 'custom':
          return customDateRange.start && customDateRange.end ?
            convDate >= customDateRange.start && convDate <= customDateRange.end : true;
        default:
          return true;
      }
    };

    const filteredPinned = pinned.filter(filterFn);
    const filteredUnpinned = unpinned.filter(filterFn);

    // Sort each group
    const sortFn = (a: StoredConversation, b: StoredConversation) => {
      switch (sortBy) {
        case 'date': return new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime();
        case 'title': return a.title.localeCompare(b.title);
        case 'messages': return b.messages.length - a.messages.length;
        default: return 0;
      }
    };

    return [
      ...filteredPinned.sort(sortFn),
      ...filteredUnpinned.sort(sortFn)
    ];
  }, [conversations, pinnedIds, searchQuery, selectedPlatform, showFavoritesOnly, favorites, showArchived, archivedIds, sortBy, dateFilter, customDateRange]);

  const selectAllFiltered = useCallback(() => {
    setSelectedIds(new Set(filteredConversations.map((c: StoredConversation) => c.id)));
  }, [filteredConversations]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || '').toLowerCase();
      const isTypingContext =
        tag === 'input' || tag === 'textarea' || (target as any)?.isContentEditable;

      if (e.key === '/' && !isTypingContext) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if ((e.key === 'a' || e.key === 'A') && !isTypingContext) {
        e.preventDefault();
        selectAllFiltered();
        return;
      }

      if (e.key === 'Escape') {
        if (compareOpen) {
          setCompareOpen(false);
          return;
        }
        if (tourOpen) {
          closeTour();
          return;
        }
        if (exportOpen) {
          setExportOpen(false);
          return;
        }
        if (savedViewsOpen) {
          setSavedViewsOpen(false);
          return;
        }
        if (selectedIds.size > 0) {
          setSelectedIds(new Set());
          return;
        }
        if (searchQuery || selectedPlatform !== 'all' || showFavoritesOnly || !showArchived || dateFilter !== 'all') {
          setSearchQuery('');
          setSelectedPlatform('all');
          setShowFavoritesOnly(false);
          setShowArchived(true);
          setDateFilter('all');
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    closeTour,
    compareOpen,
    exportOpen,
    savedViewsOpen,
    searchQuery,
    selectAllFiltered,
    selectedIds.size,
    selectedPlatform,
    showArchived,
    showFavoritesOnly,
    tourOpen,
    dateFilter,
  ]);

  // Global press micro-animation for all buttons inside this component
  useEffect(() => {
    if (prefersReducedMotion) return;
    const root = tourContainerRef.current;
    if (!root) return;
    const down = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest('button') as HTMLButtonElement | null;
      if (!btn) return;
      if (btn.disabled) return;
      if (!btn.style.transition) btn.style.transition = 'transform 120ms ease';
      btn.style.transform = 'scale(0.96)';
    };
    const up = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest('button') as HTMLButtonElement | null;
      if (!btn) return;
      btn.style.transform = 'scale(1)';
    };
    const over = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest('button') as HTMLButtonElement | null;
      if (!btn) return;
      // Only apply to small action buttons (32px width defined in inline styles)
      if (btn.style.width === '32px') {
        btn.style.transition = prefersReducedMotion ? 'none' : 'background-color 120ms ease, opacity 120ms ease';
        btn.style.backgroundColor = 'var(--bg-hover)';
      }
    };
    const out = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest('button') as HTMLButtonElement | null;
      if (!btn) return;
      if (btn.style.width === '32px') {
        btn.style.backgroundColor = '';
      }
    };
    root.addEventListener('mousedown', down);
    root.addEventListener('mouseup', up);
    root.addEventListener('mouseout', up);
    root.addEventListener('mouseover', over);
    root.addEventListener('mouseout', out);
    root.addEventListener('touchstart', down as any, { passive: true } as any);
    root.addEventListener('touchend', up as any);
    root.addEventListener('touchcancel', up as any);
    return () => {
      root.removeEventListener('mousedown', down);
      root.removeEventListener('mouseup', up);
      root.removeEventListener('mouseout', up);
      root.removeEventListener('mouseover', over);
      root.removeEventListener('mouseout', out);
      root.removeEventListener('touchstart', down as any);
      root.removeEventListener('touchend', up as any);
      root.removeEventListener('touchcancel', up as any);
    };
  }, [prefersReducedMotion, tourContainerRef]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleFavorite = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelection = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const saveCurrentView = useCallback(() => {
    const name = window.prompt('Save view as:', `View ${savedViews.length + 1}`);
    if (!name) return;

    const view: SavedView = {
      id: `${Date.now()}`,
      name,
      searchQuery,
      selectedPlatform,
      sortBy,
      viewMode,
      showFavoritesOnly,
      showArchived,
      dateFilter,
      customDateRange,
    };

    setSavedViews((prev) => [view, ...prev]);
  }, [savedViews.length, searchQuery, selectedPlatform, showArchived, showFavoritesOnly, sortBy, viewMode, dateFilter, customDateRange]);

  const applyView = useCallback((view: SavedView) => {
    setSearchQuery(view.searchQuery);
    setSelectedPlatform(view.selectedPlatform);
    setSortBy(view.sortBy);
    setViewMode(view.viewMode);
    setShowFavoritesOnly(view.showFavoritesOnly);
    setShowArchived(view.showArchived);
    setDateFilter(view.dateFilter);
    setCustomDateRange(view.customDateRange);
  }, []);

  const deleteView = useCallback((id: string) => {
    setSavedViews((prev) => prev.filter(v => v.id !== id));
  }, []);

  const startRenameView = useCallback((id: string, currentName: string) => {
    setRenamingViewId(id);
    setRenameValue(currentName);
  }, []);

  const saveRenameView = useCallback(() => {
    if (!renamingViewId) return;
    setSavedViews((prev) => prev.map(v => v.id === renamingViewId ? { ...v, name: renameValue } : v));
    setRenamingViewId(null);
    setRenameValue('');
  }, [renamingViewId, renameValue]);

  const cancelRenameView = useCallback(() => {
    setRenamingViewId(null);
    setRenameValue('');
  }, []);

  const bulkFavorite = useCallback(() => {
    setFavorites(prev => {
      const next = new Set(prev);
      selectedIds.forEach(id => next.add(id));
      return next;
    });
  }, [selectedIds]);

  const bulkUnfavorite = useCallback(() => {
    setFavorites(prev => {
      const next = new Set(prev);
      selectedIds.forEach(id => next.delete(id));
      return next;
    });
  }, [selectedIds]);

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      conversationStorage.deleteConversation(id);
      onDeleteConversation?.(id);
    }
  }, [onDeleteConversation]);

  const handleBulkDelete = useCallback(() => {
    if (window.confirm(`Delete ${selectedIds.size} conversations?`)) {
      selectedIds.forEach(id => conversationStorage.deleteConversation(id));
      setSelectedIds(new Set());
    }
  }, [selectedIds]);

  const getExportBaseList = useCallback((): StoredConversation[] => {
    if (exportScope === 'all') return conversations;
    if (exportScope === 'filtered') return filteredConversations;
    return conversations.filter(c => selectedIds.has(c.id));
  }, [conversations, exportScope, filteredConversations, selectedIds]);

  const download = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toCsv = (rows: Record<string, any>[]) => {
    const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
    const escape = (v: any) => {
      const s = String(v ?? '');
      if (/[\n\r",]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = [headers.join(',')];
    rows.forEach(r => {
      lines.push(headers.map(h => escape((r as any)[h])).join(','));
    });
    return lines.join('\n');
  };

  const buildMetadata = (c: StoredConversation) => ({
    id: c.id,
    title: c.title,
    platform: c.platform,
    importedAt: c.importedAt,
    startTime: c.startTime instanceof Date ? c.startTime.toISOString() : String(c.startTime),
    endTime: c.endTime instanceof Date ? c.endTime.toISOString() : String(c.endTime),
    messageCount: c.messages.length,
    segmentCount: c.segments.length,
    favorite: favorites.has(c.id),
    folderId: c.folderId ?? '',
  });

  const handleExport = useCallback(() => {
    const base = getExportBaseList();
    const dateStamp = new Date().toISOString().split('T')[0];

    if (exportFormat === 'json') {
      const payload = base.map(c => {
        if (exportGranularity === 'metadata') return buildMetadata(c);
        if (exportGranularity === 'messages') return { ...buildMetadata(c), messages: c.messages };
        if (exportGranularity === 'segments') return { ...buildMetadata(c), segments: c.segments };
        return c;
      });
      download(JSON.stringify(payload, null, 2), `conversations_${exportScope}_${exportGranularity}_${dateStamp}.json`, 'application/json');
      return;
    }

    if (exportFormat === 'csv') {
      if (exportGranularity === 'messages') {
        const rows = base.flatMap(c => c.messages.map(m => ({
          conversationId: c.id,
          conversationTitle: c.title,
          platform: c.platform,
          role: m.role,
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp ?? ''),
          content: m.content,
        })));
        download(toCsv(rows), `conversations_${exportScope}_messages_${dateStamp}.csv`, 'text/csv');
        return;
      }
      if (exportGranularity === 'segments') {
        const rows = base.flatMap(c => c.segments.map(s => ({
          conversationId: c.id,
          conversationTitle: c.title,
          platform: c.platform,
          segmentId: s.id,
          segmentTitle: s.title,
          messageCount: s.messageCount,
          wordCount: s.wordCount,
          startTime: s.startTime instanceof Date ? s.startTime.toISOString() : String(s.startTime),
          endTime: s.endTime instanceof Date ? s.endTime.toISOString() : String(s.endTime),
        })));
        download(toCsv(rows), `conversations_${exportScope}_segments_${dateStamp}.csv`, 'text/csv');
        return;
      }
      const rows = base.map(c => buildMetadata(c));
      download(toCsv(rows), `conversations_${exportScope}_metadata_${dateStamp}.csv`, 'text/csv');
      return;
    }

    const md = base.map(c => {
      const meta = buildMetadata(c);
      let out = `## ${meta.title}\n\n`;
      out += `- **Platform:** ${meta.platform}\n`;
      out += `- **Imported:** ${meta.importedAt}\n`;
      out += `- **Messages:** ${meta.messageCount}\n`;
      out += `- **Segments:** ${meta.segmentCount}\n`;
      out += `- **Favorite:** ${meta.favorite ? 'Yes' : 'No'}\n`;
      if (exportGranularity === 'messages' || exportGranularity === 'full') {
        out += `\n### Messages\n\n`;
        c.messages.forEach(m => {
          out += `- **${m.role}**: ${String(m.content ?? '').replace(/\n/g, ' ')}\n`;
        });
      }
      if (exportGranularity === 'segments' || exportGranularity === 'full') {
        out += `\n### Segments\n\n`;
        c.segments.forEach(s => {
          out += `- **${s.title}** (${s.messageCount} msgs)\n`;
        });
      }
      return out;
    }).join('\n---\n\n');

    download(`# Conversations Export\n\n${md}\n`, `conversations_${exportScope}_${exportGranularity}_${dateStamp}.md`, 'text/markdown');
  }, [
    buildMetadata,
    exportFormat,
    exportGranularity,
    exportScope,
    favorites,
    getExportBaseList,
  ]);

  const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (date: Date) => new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const selectedConversations = useMemo(() => {
    if (selectedIds.size === 0) return [];
    return conversations.filter(c => selectedIds.has(c.id));
  }, [conversations, selectedIds]);

  // Virtualization constants (shared)
  const overscan = 6;

  // List virtualization
  const LIST_ROW_HEIGHT = 96;
  const LIST_ROW_GAP = 12;
  const LIST_STRIDE = LIST_ROW_HEIGHT + LIST_ROW_GAP;
  const totalListHeight = filteredConversations.length * LIST_STRIDE;
  const visibleRange = useMemo(() => {
    if (viewMode !== 'list') return { start: 0, end: filteredConversations.length };
    const start = Math.max(0, Math.floor(resultsScrollTop / LIST_STRIDE) - overscan);
    const visibleCount = Math.ceil(resultsHeight / LIST_STRIDE) + overscan * 2;
    const end = Math.min(filteredConversations.length, start + visibleCount);
    return { start, end };
  }, [LIST_STRIDE, resultsHeight, resultsScrollTop, viewMode, filteredConversations.length]);

  // Grid virtualization
  const GRID_CARD_HEIGHT = 280;
  const GRID_CARD_GAP = 16;
  const GRID_STRIDE = GRID_CARD_HEIGHT + GRID_CARD_GAP;
  const totalGridHeight = Math.ceil(filteredConversations.length / 3) * GRID_STRIDE;
  const gridVisibleRange = useMemo(() => {
    if (viewMode !== 'grid') return { start: 0, end: filteredConversations.length };
    const start = Math.max(0, Math.floor(resultsScrollTop / GRID_STRIDE) - overscan);
    const visibleCount = Math.ceil(resultsHeight / GRID_STRIDE) + overscan * 2;
    const end = Math.min(filteredConversations.length, start + visibleCount * 3);
    return { start, end };
  }, [GRID_STRIDE, resultsHeight, resultsScrollTop, viewMode, filteredConversations.length]);

  const canCompare = selectedConversations.length === 2;

  const handlePreview = useCallback((conv: StoredConversation) => {
    setPreviewConv(conv);
  }, []);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowSearchSuggestions(true);
      setHoveredSuggestion(prev => {
        const next = prev === null ? 0 : Math.min(prev + 1, recentSearches.length - 1);
        return next;
      });
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setShowSearchSuggestions(true);
      setHoveredSuggestion(prev => {
        if (prev === null) return recentSearches.length - 1;
        return Math.max(0, prev - 1);
      });
      return;
    }
    if (e.key === 'Enter') {
      if (hoveredSuggestion !== null && recentSearches[hoveredSuggestion]) {
        e.preventDefault();
        const q = recentSearches[hoveredSuggestion];
        if (q) {
          setSearchQuery(q);
          setShowSearchSuggestions(false);
        }
      }
      return;
    }
    if (e.key === 'Escape') {
      setShowSearchSuggestions(false);
      return;
    }
  }, [recentSearches, hoveredSuggestion]);

  const emptyState = {
    noArchived: {
      icon: '📦',
      title: 'No archived conversations',
      description: 'Archive conversations to see them here.',
      showCTA: false
    },
    noResults: {
      icon: '🔍',
      title: 'No conversations found',
      description: 'Try adjusting your search or filters.',
      showCTA: false
    },
    empty: {
      icon: '💬',
      title: 'No conversations yet',
      description: 'Import your first conversation to get started.',
      showCTA: true
    }
  };

  const currentEmptyState = showArchived 
    ? emptyState.noArchived 
    : searchQuery 
      ? emptyState.noResults 
      : emptyState.empty;

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    if (query && !recentSearches.includes(query)) {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('conversationRecentSearches', JSON.stringify(updated));
    }
  }, [recentSearches]);

  const applySearchSuggestion = useCallback((query: string) => {
    setSearchQuery(query);
    setShowSearchSuggestions(false);
  }, []);

  // aria-live announcements for filter/search changes
  const prevA11yRef = useRef({
    showFavoritesOnly,
    showArchived,
    selectedPlatform,
    sortBy,
    dateFilter,
    customDateRange,
    searchQuery,
  });
  useEffect(() => {
    let msg = '';
    const prev = prevA11yRef.current;
    if (prev.showFavoritesOnly !== showFavoritesOnly) {
      msg = `Favorites only ${showFavoritesOnly ? 'enabled' : 'disabled'}`;
    }
    if (prev.showArchived !== showArchived) {
      msg = `Show archived ${showArchived ? 'enabled' : 'disabled'}`;
    }
    if (prev.selectedPlatform !== selectedPlatform) {
      msg = `Platform ${selectedPlatform}`;
    }
    if (prev.sortBy !== sortBy) {
      msg = `Sort by ${sortBy}`;
    }
    if (prev.dateFilter !== dateFilter) {
      msg = `Date ${dateFilter}`;
    }
    const prevRange = `${prev.customDateRange.start?.toISOString() ?? ''}-${prev.customDateRange.end?.toISOString() ?? ''}`;
    const currRange = `${customDateRange.start?.toISOString() ?? ''}-${customDateRange.end?.toISOString() ?? ''}`;
    if (prevRange !== currRange) {
      msg = `Custom date ${customDateRange.start ? customDateRange.start.toDateString() : '—'} to ${customDateRange.end ? customDateRange.end.toDateString() : '—'}`;
    }
    if (prev.searchQuery !== searchQuery) {
      msg = searchQuery ? `Search ${searchQuery}` : 'Search cleared';
    }
    if (msg) setLiveMessage(msg);
    prevA11yRef.current = { showFavoritesOnly, showArchived, selectedPlatform, sortBy, dateFilter, customDateRange, searchQuery };
  }, [showFavoritesOnly, showArchived, selectedPlatform, sortBy, dateFilter, customDateRange, searchQuery]);



  return (
    <div ref={pageContainerRef} style={{ ...styles.layoutRoot, position: 'relative' }}>
      {onClose && (
        <button
          aria-label="Close conversation browser"
          onClick={onClose}
          style={{
            ...styles.actionBtn,
            position: 'absolute',
            top: 14,
            right: 14,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            borderRadius: '50%',
            fontSize: '18px',
            fontWeight: 700,
          }}
          onMouseDown={(e) => { if (!prefersReducedMotion) e.currentTarget.style.transform = 'scale(0.96)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          ✕
        </button>
      )}
      <div
        ref={tourContainerRef}
        style={{
          ...styles.container,
          paddingTop: tourPopoverPos?.pushDownPadding
            ? Math.round(tourPopoverPos.pushDownPadding)
            : undefined,
        }}
      >
      <div style={styles.srOnly} aria-live="polite" aria-atomic="true" role="status">{liveMessage}</div>
      {/* Header */}
      <div
        ref={tourRefs.header}
        style={{ ...styles.header, ...getTourHighlightStyle(tourRefs.header) }}
      >
        <h2 style={styles.title}>
          <span style={styles.icon}>💬</span>
          Imported Conversations
          <span style={styles.countBadge}>{conversations.length}</span>
        </h2>
        <div
          ref={tourRefs.actions}
          style={{ ...styles.actions, ...getTourHighlightStyle(tourRefs.actions) }}
        >
          <button 
            style={{...styles.button, ...styles.secondaryBtn}}
            onClick={() => setHelpOpen(true)}
          >
            ❓ Help
          </button>
          <button 
            style={{...styles.button, ...styles.secondaryBtn}}
            onClick={startTour}
          >
            ▶ Start tour
          </button>
          {selectedIds.size > 0 && (
            <>
              <span style={{fontSize: '14px', color: 'var(--text-muted, #6b7280)'}}>
                {selectedIds.size} selected
              </span>
              <button 
                style={{...styles.button, ...styles.secondaryBtn}}
                onClick={handleExport}
              >
                📥 Export
              </button>
              <button 
                style={{...styles.button, ...styles.dangerBtn}}
                onClick={handleBulkDelete}
              >
                🗑️ Delete
              </button>
            </>
          )}
          <button 
            style={{...styles.button, ...styles.analyticsButton}}
            onClick={onViewAnalytics}
          >
            📊 Analytics
          </button>
          <button 
            style={{...styles.button, ...styles.primaryBtn}}
            onClick={onImportClick}
          >
            ➕ Import
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div
        ref={tourRefs.stats}
        style={{ ...styles.statsGrid, ...getTourHighlightStyle(tourRefs.stats) }}
      >
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.totalConversations}</div>
          <div style={styles.statLabel}>Conversations</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.totalMessages.toLocaleString()}</div>
          <div style={styles.statLabel}>Total Messages</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{Object.keys(stats.platforms).length}</div>
          <div style={styles.statLabel}>Platforms</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{favorites.size}</div>
          <div style={styles.statLabel}>⭐ Favorites</div>
        </div>
      </div>

      {/* Filters */}
      <div
        ref={tourRefs.search}
        style={{ ...styles.filtersContainer, ...getTourHighlightStyle(tourRefs.search) }}
      >
        <div style={styles.searchBox}>
          <span ref={searchIconRef} style={styles.searchIcon}>🔍</span>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => setShowSearchSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
            id="conversation-search-input"
            role="combobox"
            aria-autocomplete="list"
            aria-label="Search conversations"
            aria-expanded={showSearchSuggestions}
            aria-controls="search-suggestions-list"
            aria-activedescendant={activeSuggestionId}
            style={{
              ...styles.searchInput,
              paddingLeft: '48px',
            }}
          />
          <div style={styles.srOnly} aria-live="polite" aria-atomic="true">
            {showSearchSuggestions && recentSearches.length > 0 ? `${recentSearches.length} recent searches available` : ''}
          </div>
          {showSearchSuggestions && recentSearches.length > 0 && (
            <div
              style={{
                ...styles.suggestionsDropdown,
                transition: prefersReducedMotion ? 'none' : 'opacity 140ms ease, transform 140ms ease'
              }}
              role="listbox"
              id="search-suggestions-list"
              aria-label="Search suggestions"
            >
              <div style={styles.suggestionsHeader}>
                <span>Recent searches</span>
                <button 
                  style={{
                    ...styles.clearButton,
                    ...(hoveredClearButton ? styles.clearButtonHover : {})
                  }}
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('conversationRecentSearches');
                  }}
                  onMouseEnter={() => setHoveredClearButton(true)}
                  onMouseLeave={() => setHoveredClearButton(false)}
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((query, i) => (
                <div 
                  key={i}
                  id={`search-suggestion-${i}`}
                  role="option"
                  aria-selected={hoveredSuggestion === i}
                  style={{
                    ...styles.suggestionItem,
                    ...(hoveredSuggestion === i ? styles.suggestionItemHover : {}),
                    opacity: 1,
                    transition: prefersReducedMotion ? 'none' : 'opacity 150ms ease'
                  }}
                  onClick={() => applySearchSuggestion(query)}
                  onMouseEnter={() => setHoveredSuggestion(i)}
                  onMouseLeave={() => setHoveredSuggestion(null)}
                >
                  {query}
                </div>
              ))}
            </div>
          )}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={showArchived}
            onChange={() => setShowArchived(!showArchived)}
          />
          Show Archived
        </label>

        <button
          style={{...styles.button, ...(showFavoritesOnly ? styles.primaryBtn : styles.secondaryBtn), padding: '10px 14px'}}
          onClick={() => setShowFavoritesOnly((p) => !p)}
          title="Toggle favorites only"
        >
          ⭐
        </button>

        <button
          style={{...styles.button, ...(showArchived ? styles.primaryBtn : styles.secondaryBtn), padding: '10px 14px'}}
          onClick={() => setShowArchived((p) => !p)}
          title="Toggle archived"
        >
          🗂️
        </button>

        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          style={styles.select}
        >
          <option value="all">All Platforms</option>
          {Object.keys(stats.platforms).map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'messages')}
          style={styles.select}
        >
          <option value="date">Sort by Date</option>
          <option value="title">Sort by Title</option>
          <option value="messages">Sort by Messages</option>
        </select>

        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
          <select 
            style={styles.select}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month' | 'custom')}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateFilter === 'custom' && (
            <div style={{display: 'flex', gap: '8px'}}>
              <input 
                type="date" 
                value={customDateRange.start?.toISOString().split('T')[0] || ''}
                onChange={(e) => setCustomDateRange({
                  ...customDateRange, 
                  start: e.target.value ? new Date(e.target.value) : null
                })}
                style={styles.select}
              />
              <span>to</span>
              <input 
                type="date" 
                value={customDateRange.end?.toISOString().split('T')[0] || ''}
                onChange={(e) => setCustomDateRange({
                  ...customDateRange, 
                  end: e.target.value ? new Date(e.target.value) : null
                })}
                style={styles.select}
              />
            </div>
          )}
        </div>

        <div style={styles.viewToggle}>
          <button
            style={{...styles.viewButton, ...(viewMode === 'grid' ? styles.viewButtonActive : {})}}
            onClick={() => setViewMode('grid')}
          >
            ⊞
          </button>
          <button
            style={{...styles.viewButton, ...(viewMode === 'list' ? styles.viewButtonActive : {})}}
            onClick={() => setViewMode('list')}
          >
            ☰
          </button>
        </div>

        {savedViews.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              const v = savedViews.find(x => x.id === e.target.value);
              if (v) applyView(v);
            }}
            style={styles.select}
          >
            <option value="">Views…</option>
            {savedViews.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        )}

        <button
          style={{...styles.button, ...styles.secondaryBtn, padding: '10px 14px'}}
          onClick={saveCurrentView}
          title="Save current view"
        >
          💾
        </button>

        <button
          style={{...styles.button, ...styles.secondaryBtn, padding: '10px 14px'}}
          onClick={() => setSavedViewsOpen(true)}
          title="Manage saved views"
        >
          🗂️
        </button>
      </div>

      <div
        ref={tourRefs.grid}
        style={{ ...styles.resultsContainer, ...getTourHighlightStyle(tourRefs.grid) }}
        onScroll={(e) => setResultsScrollTop((e.currentTarget as HTMLDivElement).scrollTop)}
      >
        {filteredConversations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted, #9ca3af)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{currentEmptyState.icon}</div>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary, #1f2937)' }}>
              {currentEmptyState.title}
            </div>
            <div style={{ fontSize: '14px' }}>
              {currentEmptyState.description}
            </div>
            {currentEmptyState.showCTA && (
              <button
                style={{ ...styles.button, ...styles.primaryBtn, marginTop: '20px' }}
                onClick={onImportClick}
              >
                ➕ Import Conversations
              </button>
            )}
          </div>
        )}
        {filteredConversations.length > 0 && viewMode === 'list' ? (
          <div style={{ position: 'relative', height: totalListHeight }}>
            {filteredConversations.slice(visibleRange.start, visibleRange.end).map((conv, idx) => {
              const realIndex = visibleRange.start + idx;
              return (
                <div
                  key={conv.id}
                  style={{ position: 'absolute', top: realIndex * LIST_STRIDE, left: 0, right: 0 }}
                >
                  <div
                    style={{
                      ...styles.card,
                      ...(selectedIds.has(conv.id) ? styles.cardSelected : {}),
                      ...(favorites.has(conv.id) ? styles.cardFavorite : {}),
                      ...(hoveredId === conv.id ? { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(0,0,0,0.12)' } : {}),
                      ...styles.cardList,
                      height: LIST_ROW_HEIGHT,
                    }}
                    onClick={() => onSelectConversation?.(conv)}
                    onMouseEnter={() => setHoveredId(conv.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div style={styles.cardHeader}>
                      <div style={styles.platformBadge}>
                        <span style={styles.platformIcon}>{platformIcons[conv.platform] || '🤖'}</span>
                        <span>{platformNames[conv.platform] || conv.platform}</span>
                      </div>
                      <div style={{display: 'flex', gap: '6px'}}>
                        <button
                          style={{...styles.actionBtn, opacity: hoveredId === conv.id || favorites.has(conv.id) ? 1 : 0, color: '#f59e0b'}}
                          onClick={(e) => toggleFavorite(conv.id, e)}
                          title={favorites.has(conv.id) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {favorites.has(conv.id) ? '⭐' : '☆'}
                        </button>
                        <button
                          style={{...styles.actionBtn, opacity: hoveredId === conv.id || selectedIds.has(conv.id) ? 1 : 0}}
                          onClick={(e) => toggleSelection(conv.id, e)}
                          title={selectedIds.has(conv.id) ? 'Deselect' : 'Select'}
                        >
                          {selectedIds.has(conv.id) ? '☑️' : '☐'}
                        </button>
                        <button
                          style={{...styles.actionBtn, ...styles.deleteButton, opacity: hoveredId === conv.id ? 1 : 0}}
                          onClick={(e) => handleDelete(conv.id, e)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                        <button
                          style={{...styles.actionBtn, opacity: hoveredId === conv.id ? 1 : 0}}
                          onClick={(e) => { e.stopPropagation(); handlePreview(conv); }}
                          title="Quick Preview"
                        >
                          👁️
                        </button>
                        <button
                          style={{...styles.actionBtn, opacity: hoveredId === conv.id ? 1 : 0, color: archivedIds.has(conv.id) ? '#ef4444' : '#6b7280'}}
                          onClick={(e) => { e.stopPropagation(); toggleArchive(conv.id); }}
                          title={archivedIds.has(conv.id) ? 'Unarchive' : 'Archive'}
                        >
                          {archivedIds.has(conv.id) ? '📦' : '�'}
                        </button>
                        <button
                          style={{...styles.actionBtn, opacity: hoveredId === conv.id || pinnedIds.has(conv.id) ? 1 : 0, color: pinnedIds.has(conv.id) ? '#34c759' : '#4f46e5'}}
                          onClick={(e) => { e.stopPropagation(); togglePin(conv.id); }}
                          title={pinnedIds.has(conv.id) ? 'Unpin' : 'Pin to top'}
                        >
                          {pinnedIds.has(conv.id) ? '📌' : '📍'}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ ...styles.cardTitle, margin: 0 }}>{conv.title}</div>
                        <div style={{ ...styles.cardMeta, marginBottom: 0 }}>
                          <span style={styles.metaItem}>💬 {conv.messages.length}</span>
                          <span style={styles.metaItem}>📄 {conv.segments.length}</span>
                          <span style={styles.metaItem}>🕐 {formatDate(conv.startTime)}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted, #9ca3af)', whiteSpace: 'nowrap' }}>
                        Imported: {formatDate(new Date(conv.importedAt))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ position: 'relative', height: totalGridHeight }}>
            {filteredConversations.slice(gridVisibleRange.start, gridVisibleRange.end).map((conv, idx) => {
              const realIndex = gridVisibleRange.start + idx;
              const row = Math.floor(realIndex / 3);
              const col = realIndex % 3;
              const top = row * GRID_STRIDE;
              const left = col * (320 + GRID_CARD_GAP);
              return (
                <div
                  key={conv.id}
                  style={{ position: 'absolute', top, left, width: '320px' }}
                >
                  <div
                    style={{
                      ...styles.card,
                      ...(selectedIds.has(conv.id) ? styles.cardSelected : {}),
                      ...(favorites.has(conv.id) ? styles.cardFavorite : {}),
                      ...(hoveredId === conv.id ? { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(0,0,0,0.12)' } : {}),
                    }}
                    onClick={() => onSelectConversation?.(conv)}
                    onMouseEnter={() => setHoveredId(conv.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div style={styles.cardHeader}>
                      <div style={styles.platformBadge}>
                        <span style={styles.platformIcon}>{platformIcons[conv.platform] || '🤖'}</span>
                        <span>{platformNames[conv.platform] || conv.platform}</span>
                      </div>
                      <div style={{display: 'flex', gap: '6px'}}>
                        <button
                          style={{...styles.actionBtn, opacity: hoveredId === conv.id || favorites.has(conv.id) ? 1 : 0, color: '#f59e0b'}}
                          onClick={(e) => toggleFavorite(conv.id, e)}
                          title={favorites.has(conv.id) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {favorites.has(conv.id) ? '⭐' : '☆'}
                        </button>
                        <button
                          style={{...styles.actionBtn, opacity: hoveredId === conv.id || selectedIds.has(conv.id) ? 1 : 0}}
                          onClick={(e) => toggleSelection(conv.id, e)}
                          title={selectedIds.has(conv.id) ? 'Deselect' : 'Select'}
                        >
                          {selectedIds.has(conv.id) ? '☑️' : '☐'}
                        </button>
                        <button
                          style={{...styles.actionBtn, ...styles.deleteButton, opacity: hoveredId === conv.id ? 1 : 0}}
                          onClick={(e) => handleDelete(conv.id, e)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                        <button
                          style={{...styles.actionBtn, opacity: hoveredId === conv.id ? 1 : 0}}
                          onClick={(e) => { e.stopPropagation(); handlePreview(conv); }}
                          title="Quick Preview"
                        >
                          👁️
                        </button>
                        <button
                          style={{...styles.actionBtn, opacity: hoveredId === conv.id ? 1 : 0, color: archivedIds.has(conv.id) ? '#ef4444' : '#6b7280'}}
                          onClick={(e) => { e.stopPropagation(); toggleArchive(conv.id); }}
                          title={archivedIds.has(conv.id) ? 'Unarchive' : 'Archive'}
                        >
                          {archivedIds.has(conv.id) ? '📦' : '�'}
                        </button>
                        <button
                          style={{...styles.actionBtn, opacity: hoveredId === conv.id || pinnedIds.has(conv.id) ? 1 : 0, color: pinnedIds.has(conv.id) ? '#34c759' : '#4f46e5'}}
                          onClick={(e) => { e.stopPropagation(); togglePin(conv.id); }}
                          title={pinnedIds.has(conv.id) ? 'Unpin' : 'Pin to top'}
                        >
                          {pinnedIds.has(conv.id) ? '📌' : '📍'}
                        </button>
                      </div>
                    </div>

                    <h3 style={styles.cardTitle} title={conv.title}>
                      {conv.title}
                    </h3>

                    <div style={styles.cardMeta}>
                      <span style={styles.metaItem}>
                        💬 {conv.messages.length} messages
                      </span>
                      <span style={styles.metaItem}>
                        📄 {conv.segments.length} segments
                      </span>
                    </div>

                    <div style={styles.cardDates}>
                      <div>🕐 {formatDate(conv.startTime)} {formatTime(conv.startTime)}</div>
                      <div style={styles.importedDate}>
                        Imported: {formatDate(new Date(conv.importedAt))}
                      </div>
                    </div>

                    {conv.metadata?.topics && conv.metadata.topics.length > 0 && (
                      <div style={styles.topics}>
                        {conv.metadata.topics.slice(0, 3).map((topic: string, i: number) => (
                          <span key={i} style={styles.topicTag}>{topic}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedIds.size > 0 && (
          <div style={styles.bulkBar}>
            <span>{selectedIds.size} conversations selected</span>
            <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
              <button style={{...styles.button, ...styles.secondaryBtn}} onClick={selectAllFiltered}>
                Select all
              </button>
              <button style={{...styles.button, ...styles.secondaryBtn}} onClick={bulkFavorite}>
                ⭐ Favorite
              </button>
              <button style={{...styles.button, ...styles.secondaryBtn}} onClick={bulkUnfavorite}>
                ☆ Unfavorite
              </button>
              <button
                style={{...styles.button, ...styles.secondaryBtn, opacity: canCompare ? 1 : 0.5}}
                onClick={() => setCompareOpen(true)}
                disabled={!canCompare}
                title={canCompare ? 'Compare selected conversations' : 'Select exactly 2 to compare'}
              >
                ⇄ Compare
              </button>
              <button style={{...styles.button, ...styles.secondaryBtn}} onClick={() => setExportOpen(true)}>
                📥 Export
              </button>
              <button style={{...styles.button, ...styles.dangerBtn}} onClick={handleBulkDelete}>
                🗑️ Delete
              </button>
              <button style={{...styles.button, ...styles.secondaryBtn}} onClick={clearSelection}>
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {exportOpen && (
        <div style={styles.exportOverlay} onClick={handleCloseExportOverlay}>
          <div
            ref={exportRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exportTitle"
            style={{
              ...styles.exportCard,
              transform: animateExport ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.98)',
              opacity: animateExport ? 1 : 0,
              transition: prefersReducedMotion ? 'none' : 'transform 180ms ease, opacity 180ms ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close dialog"
              onClick={handleCloseExportOverlay}
              style={{ ...styles.actionBtn, position: 'absolute', top: 12, right: 12, ...(prefersReducedMotion ? { transition: 'none' } : {}) }}
              onMouseDown={(e) => { if (!prefersReducedMotion) e.currentTarget.style.transform = 'scale(0.96)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              ✕
            </button>
            <div style={styles.exportHeader}>
              <div id="exportTitle" style={{ fontWeight: 700 }}>Export</div>
              <button style={{...styles.button, ...styles.secondaryBtn}} onClick={() => setExportOpen(false)}>
                Close
              </button>
            </div>
            <div style={styles.exportBody}>
              <div style={styles.exportRow}>
                <div style={styles.exportLabel}>Scope</div>
                <select value={exportScope} onChange={(e) => setExportScope(e.target.value as ExportScope)} style={styles.select}>
                  <option value="selected">Selected</option>
                  <option value="filtered">Filtered</option>
                  <option value="all">All</option>
                </select>
              </div>
              <div style={styles.exportRow}>
                <div style={styles.exportLabel}>Format</div>
                <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as ExportFormat)} style={styles.select}>
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="md">Markdown</option>
                </select>
              </div>
              <div style={styles.exportRow}>
                <div style={styles.exportLabel}>Include</div>
                <select value={exportGranularity} onChange={(e) => setExportGranularity(e.target.value as ExportGranularity)} style={styles.select}>
                  <option value="metadata">Metadata only</option>
                  <option value="messages">Metadata + messages</option>
                  <option value="segments">Metadata + segments</option>
                  <option value="full">Full</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button style={{...styles.button, ...styles.secondaryBtn}} onClick={() => setExportOpen(false)}>
                  Cancel
                </button>
                <button
                  style={{...styles.button, ...styles.primaryBtn}}
                  onClick={() => {
                    handleExport();
                    setExportOpen(false);
                  }}
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {savedViewsOpen && (
        <div style={styles.exportOverlay} onClick={handleCloseSavedViewsOverlay}>
          <div
            ref={savedViewsRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="savedViewsTitle"
            style={{
              ...styles.exportCard,
              transform: animateSavedViews ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.98)',
              opacity: animateSavedViews ? 1 : 0,
              transition: prefersReducedMotion ? 'none' : 'transform 180ms ease, opacity 180ms ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close dialog"
              onClick={handleCloseSavedViewsOverlay}
              style={{ ...styles.actionBtn, position: 'absolute', top: 12, right: 12, ...(prefersReducedMotion ? { transition: 'none' } : {}) }}
              onMouseDown={(e) => { if (!prefersReducedMotion) e.currentTarget.style.transform = 'scale(0.96)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              ✕
            </button>
            <div style={styles.exportHeader}>
              <div id="savedViewsTitle" style={{ fontWeight: 700 }}>Saved Views</div>
              <button style={{...styles.button, ...styles.secondaryBtn}} onClick={() => setSavedViewsOpen(false)}>
                Close
              </button>
            </div>
            <div style={styles.exportBody}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <button style={{...styles.button, ...styles.secondaryBtn}} onClick={saveCurrentView}>
                  💾 Save current
                </button>
              </div>
              {savedViews.length === 0 ? (
                <div style={{ color: 'var(--text-muted, #9ca3af)' }}>No saved views yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {savedViews.map(v => (
                    <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                      <div style={{ minWidth: 0 }}>
                        {renamingViewId === v.id ? (
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveRenameView();
                              if (e.key === 'Escape') cancelRenameView();
                            }}
                            onBlur={saveRenameView}
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              padding: '4px 8px',
                              border: '1px solid var(--border-color, #e5e7eb)',
                              borderRadius: '4px',
                              background: 'var(--bg-input, #ffffff)',
                              color: 'var(--text-primary, #1f2937)',
                              width: '100%',
                              boxSizing: 'border-box',
                            }}
                            autoFocus
                          />
                        ) : (
                          <div style={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => startRenameView(v.id, v.name)}>
                            {v.name}
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: 'var(--text-muted, #9ca3af)' }}>
                          {v.viewMode} • {v.sortBy} • {v.selectedPlatform} {v.showFavoritesOnly ? '• ⭐' : ''} {v.showArchived ? '• 🗂️' : ''} {v.searchQuery ? `• "${v.searchQuery}"` : ''} {v.dateFilter !== 'all' ? `• ${v.dateFilter}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button style={{...styles.button, ...styles.secondaryBtn, padding: '8px 12px'}} onClick={() => applyView(v)}>
                          Apply
                        </button>
                        {renamingViewId !== v.id && (
                          <button style={{...styles.button, ...styles.secondaryBtn, padding: '8px 12px'}} onClick={() => startRenameView(v.id, v.name)}>
                            Rename
                          </button>
                        )}
                        <button style={{...styles.button, ...styles.dangerBtn, padding: '8px 12px'}} onClick={() => deleteView(v.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {previewConv && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={handleClosePreviewOverlay}>
          <div
            ref={previewRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="previewTitle"
            style={{
              background: 'var(--bg-surface)',
              borderRadius: '12px',
              width: '60vw',
              maxHeight: '70vh',
              padding: '24px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              position: 'relative',
              transform: animatePreview ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.98)',
              opacity: animatePreview ? 1 : 0,
              transition: prefersReducedMotion ? 'none' : 'transform 180ms ease, opacity 180ms ease'
            }} onClick={e => e.stopPropagation()}>
            <button
              aria-label="Close dialog"
              onClick={handleClosePreviewOverlay}
              style={{ ...styles.actionBtn, position: 'absolute', top: 12, right: 12, ...(prefersReducedMotion ? { transition: 'none' } : {}) }}
              onMouseDown={(e) => { if (!prefersReducedMotion) e.currentTarget.style.transform = 'scale(0.96)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              ✕
            </button>
            <h3 id="previewTitle" style={{ marginTop: 0 }}>{previewConv.title}</h3>
            <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
              {previewConv.messages.slice(0, 20).map((msg, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <strong>{msg.role}:</strong> {msg.content.substring(0, 200)}
                  {msg.content.length > 200 && '...'}
                </div>
              ))}
            </div>
            <button 
              style={styles.primaryBtn}
              onClick={() => onSelectConversation?.(previewConv)}
            >
              Open Full View
            </button>
          </div>
        </div>
      )}

      <TourPanel
        open={tourOpen}
        popoverPos={tourPopoverPos}
        stepIndex={tourStepIndex}
        steps={tourStepsList}
        onClose={closeTour}
        onNext={nextTourStep}
        onPrev={prevTourStep}
      />

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

      {compareOpen && selectedConversations.length === 2 && (
        <div style={styles.compareOverlay} onClick={handleCloseCompareOverlay}>
          <div
            ref={compareRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="compareTitle"
            style={{
              ...styles.compareCard,
              transform: animateCompare ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.98)',
              opacity: animateCompare ? 1 : 0,
              transition: prefersReducedMotion ? 'none' : 'transform 180ms ease, opacity 180ms ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close dialog"
              onClick={handleCloseCompareOverlay}
              style={{ ...styles.actionBtn, position: 'absolute', top: 12, right: 12, ...(prefersReducedMotion ? { transition: 'none' } : {}) }}
              onMouseDown={(e) => { if (!prefersReducedMotion) e.currentTarget.style.transform = 'scale(0.96)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              ✕
            </button>
            <div style={styles.compareHeader}>
              <div id="compareTitle" style={{ fontWeight: 700 }}>Compare Conversations</div>
              <button style={{...styles.button, ...styles.secondaryBtn}} onClick={() => setCompareOpen(false)}>
                Close
              </button>
            </div>
            <div style={styles.compareGrid}>
              {selectedConversations.map((c) => (
                <div key={c.id} style={styles.compareColumn}>
                  <div style={{ fontWeight: 700, marginBottom: '8px' }}>
                    {platformIcons[c.platform] || '🤖'} {c.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted, #9ca3af)', marginBottom: '8px' }}>
                    💬 {c.messages.length} messages • 📄 {c.segments.length} segments
                  </div>
                  <div style={styles.compareMessages}>
                    {c.messages.slice(0, 10).map((m, idx) => (
                      <div key={idx} style={styles.compareMsgRow}>
                        <div style={styles.compareMsgRole}>{m.role}</div>
                        <div style={styles.compareMsgContent}>{String(m.content || '').slice(0, 240)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  layoutRoot: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))'
  },
  container: {
    padding: '16px',
    width: '100%',
    maxWidth: 'none',
    margin: '0',
    height: '100%',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    position: 'relative',
    paddingRight: '48px',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '18px',
    fontWeight: 700,
    color: 'hsl(var(--foreground))',
    margin: 0
  },
  icon: {
    fontSize: '22px'
  },
  countBadge: {
    background: 'hsl(var(--primary) / 0.12)',
    color: 'hsl(var(--primary))',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600
  },
  actions: {
    display: 'flex',
    gap: '8px'
  },
  button: {
    padding: '8px 14px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'all 0.2s'
  },
  analyticsButton: {
    background: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '10px',
    marginBottom: '16px'
  },
  statCard: {
    background: 'hsl(var(--card))',
    borderRadius: '10px',
    padding: '14px',
    textAlign: 'center',
    border: '1px solid hsl(var(--border))',
    boxShadow: '0 1px 3px hsl(var(--foreground) / 0.05)'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'hsl(var(--primary))'
  },
  statLabel: {
    fontSize: '12px',
    color: 'hsl(var(--muted-foreground))',
    marginTop: '4px'
  },
  filtersContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  resultsContainer: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    paddingRight: '4px',
  },
  searchBox: {
    position: 'relative',
    flex: 1,
    minWidth: '200px'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'hsl(var(--muted-foreground))'
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px 10px 36px',
    borderRadius: '10px',
    border: '1px solid hsl(var(--border))',
    fontSize: '13px',
    background: 'hsl(var(--muted) / 0.3)',
    color: 'hsl(var(--foreground))'
  },
  select: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid hsl(var(--border))',
    fontSize: '13px',
    background: 'hsl(var(--muted) / 0.3)',
    color: 'hsl(var(--foreground))',
    cursor: 'pointer'
  },
  viewToggle: {
    display: 'flex',
    gap: '4px',
    background: 'hsl(var(--muted))',
    padding: '3px',
    borderRadius: '10px'
  },
  viewButton: {
    padding: '6px 10px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    background: 'transparent',
    color: 'hsl(var(--muted-foreground))'
  },
  viewButtonActive: {
    background: 'hsl(var(--card))',
    boxShadow: '0 1px 3px hsl(var(--foreground) / 0.08)',
    color: 'hsl(var(--foreground))'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  card: {
    background: 'hsl(var(--card))',
    borderRadius: '10px',
    padding: '14px',
    border: '1px solid hsl(var(--border))',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px hsl(var(--foreground) / 0.05)'
  },
  cardSelected: {
    borderColor: 'hsl(var(--primary))',
    boxShadow: '0 0 0 2px hsl(var(--primary) / 0.2)'
  },
  cardList: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  platformBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    color: 'hsl(var(--muted-foreground))',
    background: 'hsl(var(--muted))',
    padding: '3px 8px',
    borderRadius: '20px'
  },
  platformIcon: {
    fontSize: '14px'
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px',
    borderRadius: '6px',
    opacity: 0.6,
    transition: 'opacity 0.2s',
    color: 'hsl(var(--destructive))'
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'hsl(var(--foreground))',
    margin: '0 0 8px 0',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  cardMeta: {
    display: 'flex',
    gap: '12px',
    marginBottom: '8px',
    fontSize: '12px',
    color: 'hsl(var(--muted-foreground))'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  cardDates: {
    fontSize: '11px',
    color: 'hsl(var(--muted-foreground))',
    marginBottom: '8px'
  },
  importedDate: {
    marginTop: '4px',
    fontStyle: 'italic'
  },
  topics: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px'
  },
  topicTag: {
    fontSize: '10px',
    padding: '2px 6px',
    background: 'hsl(var(--primary) / 0.1)',
    color: 'hsl(var(--primary))',
    borderRadius: '4px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 16px'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
    opacity: 0.5
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'hsl(var(--foreground))',
    margin: '0 0 6px 0'
  },
  emptyText: {
    fontSize: '13px',
    color: 'hsl(var(--muted-foreground))'
  },
  primaryBtn: {
    background: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    boxShadow: '0 4px 12px hsl(var(--primary) / 0.3)'
  },
  secondaryBtn: {
    background: 'hsl(var(--muted))',
    color: 'hsl(var(--muted-foreground))',
    border: '1px solid hsl(var(--border))'
  },
  dangerBtn: {
    background: 'hsl(var(--destructive))',
    color: 'hsl(var(--destructive-foreground))'
  },
  actionBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    transition: 'all 0.2s',
    background: 'hsl(var(--muted))',
    color: 'hsl(var(--foreground))'
  },
  cardFavorite: {
    borderColor: 'hsl(var(--warning))',
    boxShadow: '0 0 0 2px hsl(var(--warning) / 0.2)'
  },
  bulkBar: {
    position: 'sticky' as const,
    bottom: '12px',
    background: 'hsl(var(--card))',
    padding: '12px 16px',
    borderRadius: '10px',
    boxShadow: '0 8px 24px hsl(var(--foreground) / 0.12)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid hsl(var(--border))',
    marginTop: '16px',
    zIndex: 10
  },
  exportOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'hsl(var(--foreground) / 0.5)',
    backdropFilter: 'blur(8px)',
    zIndex: 3000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
  },
  exportCard: {
    position: 'relative' as const,
    width: 'min(640px, 95vw)',
    borderRadius: '16px',
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--card))',
    boxShadow: '0 16px 48px hsl(var(--foreground) / 0.15)',
    overflow: 'hidden',
  },
  exportHeader: {
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid hsl(var(--border))',
  },
  exportBody: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  exportRow: {
    display: 'grid',
    gridTemplateColumns: '100px 1fr',
    gap: '10px',
    alignItems: 'center',
  },
  exportLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'hsl(var(--muted-foreground))',
    textTransform: 'uppercase',
  },
  compareOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'hsl(var(--foreground) / 0.5)',
    backdropFilter: 'blur(8px)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
  },
  compareCard: {
    position: 'relative' as const,
    width: 'min(1000px, 95vw)',
    height: 'min(640px, 90vh)',
    borderRadius: '16px',
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--card))',
    boxShadow: '0 16px 48px hsl(var(--foreground) / 0.15)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  compareHeader: {
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid hsl(var(--border))',
  },
  compareGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    padding: '12px',
    minHeight: 0,
    flex: 1,
  },
  compareColumn: {
    border: '1px solid hsl(var(--border))',
    borderRadius: '10px',
    padding: '10px',
    background: 'hsl(var(--muted) / 0.3)',
    minHeight: 0,
    overflow: 'hidden',
  },
  compareMessages: {
    overflow: 'auto',
    height: '100%',
    paddingRight: '4px',
  },
  compareMsgRow: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr',
    gap: '8px',
    padding: '6px 0',
    borderBottom: '1px solid hsl(var(--border) / 0.5)',
  },
  compareMsgRole: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'hsl(var(--muted-foreground))',
    textTransform: 'uppercase',
  },
  compareMsgContent: {
    fontSize: '12px',
    color: 'hsl(var(--foreground))',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  previewOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'hsl(var(--foreground) / 0.4)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewModal: {
    background: 'hsl(var(--card))',
    borderRadius: '16px',
    width: 'min(60vw, 800px)',
    maxHeight: '70vh',
    padding: '20px',
    boxShadow: '0 16px 48px hsl(var(--foreground) / 0.15)',
    border: '1px solid hsl(var(--border))'
  },
  previewContent: {
    maxHeight: '50vh',
    overflowY: 'auto',
    margin: '12px 0'
  },
  previewMessage: {
    marginBottom: '8px',
    padding: '8px',
    background: 'hsl(var(--muted) / 0.3)',
    borderRadius: '8px'
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'hsl(var(--card))',
    borderRadius: '10px',
    border: '1px solid hsl(var(--border))',
    boxShadow: '0 8px 24px hsl(var(--foreground) / 0.12)',
    zIndex: 100,
    marginTop: '4px',
    overflow: 'hidden'
  },
  suggestionsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderBottom: '1px solid hsl(var(--border))',
    fontSize: '11px',
    color: 'hsl(var(--muted-foreground))'
  },
  suggestionItem: {
    padding: '8px 12px',
    cursor: 'pointer',
    backgroundColor: 'hsl(var(--card))',
    transition: 'background-color 0.15s'
  },
  suggestionItemHover: {
    backgroundColor: 'hsl(var(--muted) / 0.5)'
  },
  clearButton: {
    background: 'none',
    border: 'none',
    color: 'hsl(var(--muted-foreground))',
    cursor: 'pointer',
    fontSize: '11px',
    transition: 'color 0.2s'
  },
  clearButtonHover: {
    color: 'hsl(var(--foreground))'
  },
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0
  },
};

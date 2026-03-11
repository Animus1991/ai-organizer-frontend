import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, FileText, Users, BookOpen, Building2, Puzzle, Upload, FilePlus, MessageSquare, Clock, ArrowUp, ArrowDown, CornerDownLeft, LayoutGrid } from "lucide-react";
import { useIsMobile } from "../../hooks/useMediaQuery";

// Mock data - replace with actual API calls
const mockDocuments = [
  { id: "1", title: "Quantum Computing Research Paper", type: "document", path: "/document/1" },
  { id: "2", title: "Machine Learning Thesis", type: "document", path: "/document/2" },
  { id: "3", title: "Neural Networks Analysis", type: "document", path: "/document/3" },
];

const mockResearchers = [
  { id: "1", name: "Dr. Sarah Chen", role: "AI Researcher", avatar: "👩‍🔬", path: "/profile/1" },
  { id: "2", name: "Prof. Michael Ross", role: "Data Scientist", avatar: "👨‍💼", path: "/profile/2" },
];

const mockCollections = [
  { id: "1", name: "AI Research Papers", count: 42, path: "/collection/1" },
  { id: "2", name: "ML Thesis Collection", count: 18, path: "/collection/2" },
];

const mockTeams = [
  { id: "1", name: "Quantum Computing Lab", members: 12, path: "/team/1" },
  { id: "2", name: "Machine Learning Group", members: 8, path: "/team/2" },
];

const mockSegments = [
  { id: "1", title: "Introduction to Quantum Computing", document: "Quantum Computing Research Paper", path: "/segment/1" },
  { id: "2", title: "Neural Network Architecture", document: "Machine Learning Thesis", path: "/segment/2" },
];

// Platform pages for search
const platformPages = [
  { id: "p-home", title: "Αρχική", path: "/", type: "page" as const },
  { id: "p-library", title: "Βιβλιοθήκη", path: "/library", type: "page" as const },
  { id: "p-research", title: "Εργαστήριο Έρευνας", path: "/research", type: "page" as const },
  { id: "p-workspace", title: "Χώρος Σκέψης", path: "/frontend", type: "page" as const },
  { id: "p-discover", title: "Ανακάλυψε", path: "/discover", type: "page" as const },
  { id: "p-explore", title: "Εξερεύνηση", path: "/explore", type: "page" as const },
  { id: "p-community", title: "Κοινότητα", path: "/community", type: "page" as const },
  { id: "p-collections", title: "Συλλογές", path: "/collections", type: "page" as const },
  { id: "p-teams", title: "Ομάδες", path: "/teams", type: "page" as const },
  { id: "p-discussions", title: "Φόρουμ Συζητήσεων", path: "/discussions", type: "page" as const },
  { id: "p-benchmark", title: "Benchmark", path: "/benchmark", type: "page" as const },
  { id: "p-issues", title: "Ζητήματα", path: "/issues", type: "page" as const },
  { id: "p-kanban", title: "Πίνακας Έργων", path: "/kanban", type: "page" as const },
  { id: "p-reviews", title: "Αξιολογήσεις", path: "/reviews", type: "page" as const },
  { id: "p-wiki", title: "Wiki", path: "/wiki", type: "page" as const },
  { id: "p-automation", title: "Αυτοματισμοί", path: "/automation", type: "page" as const },
  { id: "p-theory", title: "Αρχείο Θεωριών", path: "/theory-repo", type: "page" as const },
  { id: "p-references", title: "Βιβλιογραφία & Αναφορές", path: "/references", type: "page" as const },
  { id: "p-releases", title: "Εκδόσεις & Δημοσιεύσεις", path: "/releases", type: "page" as const },
  { id: "p-claim-checks", title: "Έλεγχοι Κατάστασης", path: "/claim-checks", type: "page" as const },
  { id: "p-evidence", title: "Γράφημα Τεκμηρίωσης", path: "/evidence-graph", type: "page" as const },
  { id: "p-blockchain", title: "Blockchain", path: "/blockchain", type: "page" as const },
  { id: "p-investor", title: "Ταμπλό Επενδυτή", path: "/investor", type: "page" as const },
  { id: "p-settings", title: "Ρυθμίσεις", path: "/settings", type: "page" as const },
  { id: "p-recycle", title: "Κάδος Ανακύκλωσης", path: "/recycle-bin", type: "page" as const },
  { id: "p-courses", title: "Μαθήματα", path: "/courses", type: "page" as const },
  { id: "p-events", title: "Εκδηλώσεις", path: "/events", type: "page" as const },
  { id: "p-mentoring", title: "Mentoring", path: "/mentoring", type: "page" as const },
  { id: "p-search", title: "Αναζήτηση Έργων", path: "/search", type: "page" as const },
  { id: "p-activity", title: "Ροή Εργασιών", path: "/activity", type: "page" as const },
  { id: "p-merge", title: "Merge Conflicts", path: "/merge-conflicts", type: "page" as const },
  { id: "p-research-discussions", title: "Ερευνητικές Συζητήσεις", path: "/research-discussions", type: "page" as const },
];

interface SearchResult {
  id: string;
  title: string;
  type: "document" | "researcher" | "collection" | "team" | "segment" | "page";
  subtitle?: string;
  path: string;
  icon?: React.ReactNode;
  metadata?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  researcher: <Users className="w-4 h-4" />,
  collection: <BookOpen className="w-4 h-4" />,
  team: <Building2 className="w-4 h-4" />,
  segment: <Puzzle className="w-4 h-4" />,
  page: <LayoutGrid className="w-4 h-4" />,
};

const GlobalSearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem("globalSearchRecent");
    return saved ? JSON.parse(saved) : [];
  });

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const allResults: SearchResult[] = [
      ...mockDocuments
        .filter(doc => doc.title.toLowerCase().includes(q))
        .map(doc => ({ ...doc, icon: typeIcons.document, type: "document" as const })),
      ...mockResearchers
        .filter(res => res.name.toLowerCase().includes(q) || res.role.toLowerCase().includes(q))
        .map(res => ({ ...res, title: res.name, subtitle: res.role, icon: typeIcons.researcher, type: "researcher" as const })),
      ...mockCollections
        .filter(col => col.name.toLowerCase().includes(q))
        .map(col => ({ ...col, title: col.name, subtitle: `${col.count} items`, icon: typeIcons.collection, type: "collection" as const })),
      ...mockTeams
        .filter(team => team.name.toLowerCase().includes(q))
        .map(team => ({ ...team, title: team.name, subtitle: `${team.members} members`, icon: typeIcons.team, type: "team" as const })),
      ...mockSegments
        .filter(seg => seg.title.toLowerCase().includes(q) || seg.document.toLowerCase().includes(q))
        .map(seg => ({ ...seg, icon: typeIcons.segment, subtitle: seg.document, type: "segment" as const })),
      ...platformPages
        .filter(page => page.title.toLowerCase().includes(q))
        .map(page => ({ ...page, icon: typeIcons.page, subtitle: page.path, type: "page" as const })),
    ];
    if (activeFilter !== "all") {
      return allResults.filter(result => result.type === activeFilter);
    }
    return allResults;
  }, [query, activeFilter]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setActiveFilter("all");
    }
  }, [isOpen]);

  useEffect(() => {
    if (query && query.trim()) {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("globalSearchRecent", JSON.stringify(updated));
    }
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => prev === 0 ? Math.max(results.length - 1, 0) : prev - 1);
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) handleResultClick(results[selectedIndex]);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, results]);

  const handleResultClick = useCallback((result: SearchResult) => {
    navigate(result.path);
    onClose();
  }, [navigate, onClose]);

  const filters = [
    { id: "all", label: "Όλα", icon: <Search className="w-3.5 h-3.5" /> },
    { id: "page", label: "Σελίδες", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: "document", label: isMobile ? "Έγγρ." : "Έγγραφα", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "researcher", label: isMobile ? "Άτομα" : "Ερευνητές", icon: <Users className="w-3.5 h-3.5" /> },
    { id: "collection", label: isMobile ? "Συλλ." : "Συλλογές", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: "team", label: "Ομάδες", icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: "segment", label: isMobile ? "Τμήμ." : "Τμήματα", icon: <Puzzle className="w-3.5 h-3.5" /> },
  ];

  const quickActions = [
    { id: "upload", label: "Μεταφόρτωση Εγγράφου", icon: <Upload className="w-4 h-4" />, action: () => { window.dispatchEvent(new CustomEvent("triggerUpload")); onClose(); } },
    { id: "create", label: "Νέο Έγγραφο", icon: <FilePlus className="w-4 h-4" />, action: () => { navigate("/document/new"); onClose(); } },
    { id: "chat", label: "Βοηθός ΤΝ", icon: <MessageSquare className="w-4 h-4" />, action: () => { window.dispatchEvent(new CustomEvent('toggleAIChat')); onClose(); } },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200 pt-[10vh] sm:pt-[15vh] px-3 sm:px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] max-h-[75vh] sm:max-h-[70vh] bg-card border border-border/50 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 slide-in-from-top-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-3 sm:p-4 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-muted/50 rounded-xl border border-border/50 focus-within:border-primary/30 focus-within:bg-muted/80 transition-all duration-200">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent border-none outline-none text-foreground text-sm placeholder:text-muted-foreground min-w-0"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-background border border-border rounded text-muted-foreground">
              ESC
            </kbd>
          </div>
        </div>

        {/* Filters - scrollable on mobile */}
        <div className="flex-shrink-0 border-b border-border/30">
          <div className="flex items-center gap-1 px-3 sm:px-4 py-2 overflow-x-auto scrollbar-none">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                  whitespace-nowrap flex-shrink-0 transition-all duration-150
                  ${activeFilter === filter.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                  }
                `}
              >
                {filter.icon}
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="px-3 sm:px-4 pt-3 pb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Πρόσφατες Αναζητήσεις
              </p>
              <div className="flex flex-col gap-0.5">
                {recentSearches.map((search, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(search)}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                    <span className="truncate">{search}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {!query && (
            <div className="px-3 sm:px-4 pt-3 pb-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Γρήγορες Ενέργειες
              </p>
              <div className="flex flex-col gap-0.5">
                {quickActions.map(action => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex-shrink-0 opacity-60">{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {query && results.length > 0 && (
            <div className="py-1">
              {results.map((result, index) => (
                <button
                  key={`${result.id}-${result.type}`}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`
                    flex items-center gap-3 w-full px-3 sm:px-4 py-2.5
                    text-left transition-colors duration-100
                    ${selectedIndex === index
                      ? "bg-primary/8 text-foreground"
                      : "text-foreground hover:bg-muted/40"
                    }
                  `}
                >
                  <span className={`flex-shrink-0 p-1.5 rounded-lg ${selectedIndex === index ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground"}`}>
                    {result.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Search className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                No results for "<span className="text-foreground font-medium">{query}</span>"
              </p>
            </div>
          )}
        </div>

        {/* Footer - hidden on mobile for more space */}
        <div className="hidden sm:flex items-center justify-between px-4 py-2.5 border-t border-border/30 flex-shrink-0">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <kbd className="inline-flex items-center justify-center w-5 h-5 rounded border border-border bg-background text-[10px]"><ArrowUp className="w-2.5 h-2.5" /></kbd>
              <kbd className="inline-flex items-center justify-center w-5 h-5 rounded border border-border bg-background text-[10px]"><ArrowDown className="w-2.5 h-2.5" /></kbd>
              navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="inline-flex items-center justify-center h-5 px-1 rounded border border-border bg-background text-[10px]"><CornerDownLeft className="w-2.5 h-2.5" /></kbd>
              select
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="inline-flex items-center justify-center h-5 px-1.5 rounded border border-border bg-background text-[9px] font-mono">esc</kbd>
              close
            </span>
          </div>
          {query && (
            <span className="text-[10px] text-muted-foreground">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;

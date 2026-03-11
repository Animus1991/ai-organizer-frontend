import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useResearchIssues } from '../context/ResearchIssuesContext';
import { useTheoryBranching } from '../context/TheoryBranchingContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

// Types for Global Search
export type SearchCategory = 'all' | 'documents' | 'theories' | 'issues' | 'wiki' | 'discussions' | 'users' | 'projects';
export type SearchFilter = {
  category: SearchCategory;
  dateRange?: 'any' | 'today' | 'week' | 'month' | 'year';
  author?: string;
  tags?: string[];
  status?: string;
  sortBy?: 'relevance' | 'date' | 'popularity';
};

export interface SearchResult {
  id: string;
  type: SearchCategory;
  title: string;
  description: string;
  highlight?: string;
  path: string;
  icon: string;
  metadata: {
    author?: string;
    date?: string;
    tags?: string[];
    status?: string;
    score?: number;
  };
}

export interface RecentSearch {
  query: string;
  timestamp: Date;
  category: SearchCategory;
}

const CATEGORY_CONFIG = {
  all: { icon: '🔍', label: 'All', color: '#8b949e' },
  documents: { icon: '📄', label: 'Documents', color: '#58a6ff' },
  theories: { icon: '🧪', label: 'Theories', color: '#a371f7' },
  issues: { icon: '🔴', label: 'Issues', color: '#f85149' },
  wiki: { icon: '📚', label: 'Wiki', color: '#3fb950' },
  discussions: { icon: '💬', label: 'Discussions', color: '#d29922' },
  users: { icon: '👤', label: 'Users', color: '#8b949e' },
  projects: { icon: '📋', label: 'Projects', color: '#58a6ff' },
};

const STORAGE_KEY = 'global-search-history';

interface GlobalSearchProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialQuery?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen = true, onClose, initialQuery = '' }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { issues, milestones, labels } = useResearchIssues();
  const { branches, commits, mergeRequests } = useTheoryBranching();
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilter>({ category: 'all', sortBy: 'relevance' });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setRecentSearches(parsed.map((s: any) => ({ ...s, timestamp: new Date(s.timestamp) })));
    }
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const performSearch = useCallback((searchQuery: string, searchFilters: SearchFilter) => {
    if (!searchQuery.trim()) { setResults([]); return; }
    setIsLoading(true);
    const q = searchQuery.toLowerCase();

    setTimeout(() => {
      const searchResults: SearchResult[] = [];

      if (searchFilters.category === 'all' || searchFilters.category === 'issues') {
        issues.filter(issue => issue.title.toLowerCase().includes(q) || issue.description.toLowerCase().includes(q))
          .forEach(issue => {
            const issueLabels = labels.filter(l => issue.labels.includes(l.id)).map(l => l.name);
            searchResults.push({
              id: issue.id, type: 'issues',
              title: `Issue #${issue.number}: ${issue.title}`,
              description: issue.description.slice(0, 150) + (issue.description.length > 150 ? '...' : ''),
              highlight: issue.description.toLowerCase().includes(q) ? `...${issue.description.slice(0, 100)}...` : undefined,
              path: `/issues?id=${issue.id}`, icon: issue.state === 'closed' ? '✅' : '🔴',
              metadata: { author: issue.createdBy, date: issue.createdAt.toISOString().split('T')[0], tags: issueLabels, status: issue.state, score: issue.title.toLowerCase().includes(q) ? 90 : 70 },
            });
          });
      }

      if (searchFilters.category === 'all' || searchFilters.category === 'theories') {
        branches.filter(b => b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q))
          .forEach(branch => {
            searchResults.push({
              id: branch.id, type: 'theories', title: `Branch: ${branch.name}`,
              description: branch.description || 'Theory branch', path: `/theory-repo?branch=${branch.id}`, icon: '🧪',
              metadata: { author: branch.createdBy, date: new Date(branch.createdAt).toISOString().split('T')[0], status: branch.status, score: branch.name.toLowerCase().includes(q) ? 85 : 65 },
            });
          });
        commits.filter(c => c.message.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
          .slice(0, 5).forEach(commit => {
            searchResults.push({
              id: commit.id, type: 'theories', title: `Commit: ${commit.message}`,
              description: commit.description || 'Theory commit', path: `/theory-repo?commit=${commit.id}`, icon: '📝',
              metadata: { author: commit.author, date: new Date(commit.timestamp).toISOString().split('T')[0], score: commit.message.toLowerCase().includes(q) ? 80 : 60 },
            });
          });
      }

      if (searchFilters.category === 'all' || searchFilters.category === 'projects') {
        milestones.filter(ms => ms.title.toLowerCase().includes(q) || ms.description.toLowerCase().includes(q))
          .forEach(ms => {
            searchResults.push({
              id: ms.id, type: 'projects', title: `Milestone: ${ms.title}`,
              description: ms.description, path: `/milestones?id=${ms.id}`, icon: '🎯',
              metadata: { date: ms.dueDate?.toISOString().split('T')[0], status: ms.state, score: ms.title.toLowerCase().includes(q) ? 85 : 65 },
            });
          });
      }

      if (searchFilters.category === 'all' || searchFilters.category === 'discussions') {
        mergeRequests.filter(mr => mr.title.toLowerCase().includes(q) || mr.description.toLowerCase().includes(q))
          .forEach(mr => {
            searchResults.push({
              id: mr.id, type: 'discussions', title: `Merge Request: ${mr.title}`,
              description: mr.description, path: `/merge-conflicts?mr=${mr.id}`, icon: '🔀',
              metadata: { author: mr.author, date: new Date(mr.createdAt).toISOString().split('T')[0], status: mr.status, score: mr.title.toLowerCase().includes(q) ? 80 : 60 },
            });
          });
      }

      if (searchFilters.sortBy === 'relevance') searchResults.sort((a, b) => (b.metadata.score || 0) - (a.metadata.score || 0));
      else if (searchFilters.sortBy === 'date') searchResults.sort((a, b) => new Date(b.metadata.date || 0).getTime() - new Date(a.metadata.date || 0).getTime());

      setResults(searchResults);
      setIsLoading(false);
      setSelectedIndex(0);
    }, 150);
  }, [issues, labels, branches, commits, milestones, mergeRequests]);

  useEffect(() => {
    const timer = setTimeout(() => performSearch(query, filters), 200);
    return () => clearTimeout(timer);
  }, [query, filters, performSearch]);

  const saveSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const newSearch: RecentSearch = { query: searchQuery, timestamp: new Date(), category: filters.category };
    const updated = [newSearch, ...recentSearches.filter(s => s.query !== searchQuery)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [filters.category, recentSearches]);

  const navigateToResult = useCallback((result: SearchResult) => {
    saveSearch(query); onClose?.(); navigate(result.path);
  }, [query, saveSearch, onClose, navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => Math.min(prev + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter' && results[selectedIndex]) { e.preventDefault(); navigateToResult(results[selectedIndex]); }
    else if (e.key === 'Escape') { onClose?.(); }
  }, [results, selectedIndex, navigateToResult, onClose]);

  const clearHistory = useCallback(() => {
    setRecentSearches([]); localStorage.removeItem(STORAGE_KEY);
  }, []);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: isMobile ? '5vh' : '10vh', zIndex: 99999, padding: isMobile ? '16px' : undefined,
      paddingBottom: isMobile ? '16px' : undefined,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: isMobile ? '100%' : '680px', maxHeight: isMobile ? '85vh' : '70vh',
        background: 'hsl(var(--card))', borderRadius: '16px',
        border: '1px solid hsl(var(--border))',
        boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        marginTop: isMobile ? '5vh' : '10vh',
      }}>
        {/* Search Input */}
        <div style={{
          padding: isMobile ? '12px 14px' : '16px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '20px', color: 'hsl(var(--muted-foreground))' }}>🔍</span>
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={t('search.placeholder') || 'Search documents, theories, issues, wiki...'}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              color: 'hsl(var(--foreground))', fontSize: isMobile ? '15px' : '16px', outline: 'none',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              padding: '4px 8px', background: 'transparent', border: 'none',
              color: 'hsl(var(--muted-foreground))', cursor: 'pointer',
            }}>✕</button>
          )}
          {!isMobile && (
            <button onClick={() => setShowFilters(!showFilters)} style={{
              padding: '6px 12px', background: showFilters ? 'hsl(var(--primary) / 0.12)' : 'transparent',
              border: '1px solid hsl(var(--border))', borderRadius: '10px',
              color: 'hsl(var(--muted-foreground))', cursor: 'pointer', fontSize: '12px',
            }}>⚙️ Filters</button>
          )}
          {!isMobile && (
            <div style={{
              padding: '4px 8px', background: 'hsl(var(--muted) / 0.3)',
              borderRadius: '6px', fontSize: '11px', color: 'hsl(var(--muted-foreground))',
            }}>ESC</div>
          )}
        </div>

        {/* Category Tabs */}
        <div style={{
          display: 'flex', gap: '4px', padding: isMobile ? '6px 12px' : '8px 16px',
          borderBottom: '1px solid hsl(var(--border))', overflowX: 'auto',
        }}>
          {(Object.entries(CATEGORY_CONFIG) as [SearchCategory, typeof CATEGORY_CONFIG[SearchCategory]][]).map(([key, config]) => (
            <button key={key} onClick={() => setFilters(f => ({ ...f, category: key }))}
              style={{
                padding: isMobile ? '5px 10px' : '6px 12px',
                background: filters.category === key ? 'hsl(var(--primary) / 0.12)' : 'transparent',
                border: filters.category === key ? `1px solid ${config.color}40` : '1px solid transparent',
                borderRadius: '10px',
                color: filters.category === key ? config.color : 'hsl(var(--muted-foreground))',
                fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: '6px', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >{config.icon} {config.label}</button>
          ))}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid hsl(var(--border))',
            display: 'flex', gap: '12px', flexWrap: 'wrap',
            background: 'hsl(var(--muted) / 0.15)',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}>Date Range</label>
              <select value={filters.dateRange || 'any'} onChange={(e) => setFilters(f => ({ ...f, dateRange: e.target.value as any }))}
                style={{
                  padding: '6px 10px', background: 'hsl(var(--muted) / 0.3)',
                  border: '1px solid hsl(var(--border))', borderRadius: '10px',
                  color: 'hsl(var(--foreground))', fontSize: '12px',
                }}>
                <option value="any">Any time</option>
                <option value="today">Today</option>
                <option value="week">Past week</option>
                <option value="month">Past month</option>
                <option value="year">Past year</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}>Sort By</label>
              <select value={filters.sortBy || 'relevance'} onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value as any }))}
                style={{
                  padding: '6px 10px', background: 'hsl(var(--muted) / 0.3)',
                  border: '1px solid hsl(var(--border))', borderRadius: '10px',
                  color: 'hsl(var(--foreground))', fontSize: '12px',
                }}>
                <option value="relevance">Relevance</option>
                <option value="date">Date</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
          </div>
        )}

        {/* Results */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
              Searching...
            </div>
          ) : query ? (
            results.length > 0 ? (
              <div>
                <div style={{
                  padding: '8px 16px', fontSize: '11px', color: 'hsl(var(--muted-foreground))',
                  borderBottom: '1px solid hsl(var(--border))',
                }}>
                  {results.length} results for "{query}"
                </div>
                {results.map((result, index) => {
                  const config = CATEGORY_CONFIG[result.type];
                  return (
                    <button key={result.id} onClick={() => navigateToResult(result)}
                      style={{
                        width: '100%', padding: isMobile ? '10px 14px' : '12px 16px',
                        background: index === selectedIndex ? 'hsl(var(--primary) / 0.08)' : 'transparent',
                        border: 'none', borderBottom: '1px solid hsl(var(--border))',
                        textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '12px',
                      }}
                    >
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: `${config.color}20`, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0,
                      }}>{result.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '14px', fontWeight: 500, color: 'hsl(var(--foreground))',
                          marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.title}</span>
                          <span style={{
                            padding: '2px 6px', background: `${config.color}20`,
                            borderRadius: '10px', fontSize: '10px', color: config.color, flexShrink: 0,
                          }}>{config.label}</span>
                        </div>
                        <div style={{
                          fontSize: '12px', color: 'hsl(var(--muted-foreground))',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{result.description}</div>
                        {!isMobile && result.highlight && (
                          <div style={{
                            marginTop: '6px', padding: '6px 10px',
                            background: 'hsl(var(--muted) / 0.2)', borderRadius: '6px',
                            fontSize: '12px', color: 'hsl(var(--muted-foreground))',
                          }} dangerouslySetInnerHTML={{ __html: result.highlight }} />
                        )}
                        <div style={{
                          marginTop: '6px', display: 'flex', alignItems: 'center', gap: '12px',
                          fontSize: '11px', color: 'hsl(var(--muted-foreground))',
                        }}>
                          {result.metadata.author && <span>👤 {result.metadata.author}</span>}
                          {result.metadata.date && <span>📅 {new Date(result.metadata.date).toLocaleDateString()}</span>}
                          {result.metadata.status && (
                            <span style={{
                              padding: '2px 6px', background: 'hsl(var(--muted) / 0.3)', borderRadius: '6px',
                            }}>{result.metadata.status}</span>
                          )}
                          {!isMobile && result.metadata.score && (
                            <span style={{ marginLeft: 'auto', color: 'hsl(var(--primary))' }}>
                              {result.metadata.score}% match
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '48px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', color: 'hsl(var(--foreground))' }}>No results found</div>
                <div style={{ fontSize: '14px' }}>Try different keywords or filters</div>
              </div>
            )
          ) : (
            <div>
              {recentSearches.length > 0 && (
                <div>
                  <div style={{
                    padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid hsl(var(--border))',
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>Recent Searches</span>
                    <button onClick={clearHistory} style={{
                      padding: '2px 8px', background: 'transparent', border: 'none',
                      color: 'hsl(var(--primary))', cursor: 'pointer', fontSize: '11px',
                    }}>Clear</button>
                  </div>
                  {recentSearches.slice(0, 5).map((search, i) => (
                    <button key={i} onClick={() => setQuery(search.query)}
                      style={{
                        width: '100%', padding: '10px 16px', background: 'transparent',
                        border: 'none', borderBottom: '1px solid hsl(var(--border))',
                        textAlign: 'left', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', gap: '12px', color: 'hsl(var(--foreground))',
                      }}>
                      <span style={{ color: 'hsl(var(--muted-foreground))' }}>🕐</span>
                      <span style={{ flex: 1 }}>{search.query}</span>
                      <span style={{
                        padding: '2px 6px', background: 'hsl(var(--muted) / 0.3)',
                        borderRadius: '6px', fontSize: '10px', color: 'hsl(var(--muted-foreground))',
                      }}>{CATEGORY_CONFIG[search.category].label}</span>
                    </button>
                  ))}
                </div>
              )}

              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: '12px' }}>Quick Actions</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { query: 'type:document', label: '📄 Documents' },
                    { query: 'type:theory status:active', label: '🧪 Active Theories' },
                    { query: 'type:issue is:open', label: '🔴 Open Issues' },
                    { query: 'updated:today', label: '📅 Updated Today' },
                  ].map((suggestion, i) => (
                    <button key={i} onClick={() => setQuery(suggestion.query)}
                      style={{
                        padding: '8px 12px', background: 'hsl(var(--muted) / 0.2)',
                        border: '1px solid hsl(var(--border))', borderRadius: '10px',
                        color: 'hsl(var(--foreground))', fontSize: '12px', cursor: 'pointer',
                      }}>{suggestion.label}</button>
                  ))}
                </div>
              </div>

              {!isMobile && (
                <div style={{ padding: '16px', borderTop: '1px solid hsl(var(--border))' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: '12px' }}>Keyboard Shortcuts</div>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                    <span><kbd style={{ padding: '2px 6px', background: 'hsl(var(--muted) / 0.3)', borderRadius: '4px' }}>↑↓</kbd> Navigate</span>
                    <span><kbd style={{ padding: '2px 6px', background: 'hsl(var(--muted) / 0.3)', borderRadius: '4px' }}>Enter</kbd> Select</span>
                    <span><kbd style={{ padding: '2px 6px', background: 'hsl(var(--muted) / 0.3)', borderRadius: '4px' }}>ESC</kbd> Close</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook to control global search
export const useGlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');

  const openSearch = useCallback((query?: string) => {
    setInitialQuery(query || ''); setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false); setInitialQuery('');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsOpen(true); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, openSearch, closeSearch, initialQuery };
};

export default GlobalSearch;

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { search } from '../lib/api';
import type { SearchResultItem } from '../lib/api';
import { useLoading } from '../hooks/useLoading';
import { useLanguage } from '../context/LanguageContext';

interface AdvancedSearchProps {
  onSearch?: (query: string, filters: SearchFilters) => void;
  placeholder?: string;
  showAdvanced?: boolean;
}

interface SearchFilters {
  type: 'all' | 'document' | 'segment' | 'smart_note';
  mode: 'all' | 'semantic' | 'exact' | 'fuzzy' | 'qa';
  language: 'auto' | 'el' | 'en';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  sortBy: 'relevance' | 'date' | 'title' | 'type';
  expandVariations: boolean;
  minScore: number;
  categories: string[];
  tags: string[];
}

interface SearchSuggestion {
  text: string;
  type: 'recent' | 'popular' | 'trending' | 'ai_suggested';
  score?: number;
}

function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength) + '...';
}

export default function AdvancedSearch({ 
  onSearch, 
  placeholder = "Search documents, segments, and notes...",
  showAdvanced = true 
}: AdvancedSearchProps) {
  const { t } = useLanguage();
  const nav = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchResponse, setSearchResponse] = useState<{ semantic?: boolean; variations?: string[] } | null>(null);
  
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    mode: 'semantic',
    language: 'auto',
    dateRange: 'all',
    sortBy: 'relevance',
    expandVariations: true,
    minScore: 0.5,
    categories: [],
    tags: []
  });

  const { loading, execute } = useLoading();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const history = localStorage.getItem('advancedSearchHistory');
    if (history) {
      try { setSearchHistory(JSON.parse(history)); } catch { /* */ }
    }
  }, []);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const result: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    searchHistory
      .filter(h => h.toLowerCase().includes(queryLower))
      .slice(0, 3)
      .forEach(h => result.push({ text: h, type: 'recent' }));

    const popularSearches = ['machine learning algorithms', 'data analysis methods', 'research methodology', 'statistical analysis', 'literature review'];
    popularSearches
      .filter(s => s.toLowerCase().includes(queryLower))
      .slice(0, 2)
      .forEach(s => result.push({ text: s, type: 'popular', score: 0.8 }));

    [`${query} methodology`, `${query} analysis techniques`]
      .forEach(s => result.push({ text: s, type: 'ai_suggested', score: 0.9 }));

    return result.slice(0, 6);
  }, [query, searchHistory]);

  const handleSearch = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    const newHistory = [finalQuery, ...searchHistory.filter(h => h !== finalQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('advancedSearchHistory', JSON.stringify(newHistory));

    await execute(async () => {
      try {
        const searchResults = await search(finalQuery, {
          type: filters.type === 'all' ? undefined : filters.type as 'document' | 'segment',
          mode: filters.mode === 'qa' ? 'qa' : filters.mode === 'all' ? undefined : 'paragraphs',
          lang: filters.language,
          expand_variations: filters.expandVariations,
          semantic: filters.mode === 'semantic',
        });
        const items = Array.isArray(searchResults) ? searchResults : (searchResults as any).items || (searchResults as any).results || [];
        setResults(items);
        setSearchResponse({
          semantic: filters.mode === 'semantic',
          variations: filters.expandVariations ? ['analysis', 'methodology', 'research'] : []
        });
        onSearch?.(finalQuery, filters);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      }
    });

    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowSuggestions(false); return; }
      if (!showSuggestions) return;
      if (e.key === 'Enter' && suggestions.length > 0) { e.preventDefault(); handleSearch(suggestions[0].text); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, suggestions, query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    const icons: Record<string, string> = { recent: '🕐', popular: '🔥', trending: '📈', ai_suggested: '🤖' };
    return icons[type];
  };

  const getSuggestionColor = (type: SearchSuggestion['type']) => {
    const colors: Record<string, string> = { recent: '#6b7280', popular: '#f59e0b', trending: '#10b981', ai_suggested: '#6366f1' };
    return colors[type];
  };

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.05)', color: 'white', fontSize: '13px',
  };

  return (
    <div className="advanced-search" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '20px', backdropFilter: 'blur(10px)' }}>
      {/* Search Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔍 {t("advSearch.title")}
          </h3>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>{t("advSearch.subtitle")}</p>
        </div>
        {showAdvanced && (
          <button onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} style={{
            padding: '8px 16px', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px',
            background: isAdvancedOpen ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            color: isAdvancedOpen ? '#a5b4fc' : 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
          }}>
            {isAdvancedOpen ? `▼ ${t("advSearch.simple")}` : `▲ ${t("advSearch.advanced")}`}
          </button>
        )}
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input ref={inputRef} type="text" value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(e.target.value.length > 0); }}
              onFocus={() => setShowSuggestions(query.length > 0)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
              placeholder={placeholder}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', color: 'white', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <button onClick={() => handleSearch()} disabled={loading || !query.trim()} style={{
            padding: '12px 24px', border: 'none', borderRadius: '12px',
            background: loading || !query.trim() ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: loading || !query.trim() ? 'rgba(255, 255, 255, 0.4)' : 'white',
            cursor: loading || !query.trim() ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600',
          }}>
            {loading ? t("advSearch.searching") : t("advSearch.search")}
          </button>
        </div>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div ref={suggestionsRef} style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px', marginTop: '8px', backdropFilter: 'blur(10px)', zIndex: 1000, maxHeight: '300px', overflowY: 'auto',
          }}>
            {suggestions.map((suggestion, index) => (
              <div key={index} onClick={() => handleSearch(suggestion.text)} style={{
                padding: '12px 16px', cursor: 'pointer', borderBottom: index < suggestions.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <span style={{ fontSize: '16px' }}>{getSuggestionIcon(suggestion.type)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>{suggestion.text}</div>
                  <div style={{ color: getSuggestionColor(suggestion.type), fontSize: '12px', marginTop: '2px' }}>
                    {suggestion.type.replace(/_/g, ' ')}
                    {suggestion.score && ` • ${Math.round(suggestion.score * 100)}% match`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && isAdvancedOpen && (
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>{t("advSearch.searchType")}</label>
              <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value as SearchFilters['type']})} style={selectStyle}>
                <option value="all">{t("advSearch.allContent")}</option>
                <option value="document">{t("advSearch.documents")}</option>
                <option value="segment">{t("advSearch.segments")}</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>{t("advSearch.searchMode")}</label>
              <select value={filters.mode} onChange={(e) => setFilters({...filters, mode: e.target.value as SearchFilters['mode']})} style={selectStyle}>
                <option value="semantic">🧠 Semantic</option>
                <option value="exact">🎯 Exact Match</option>
                <option value="fuzzy">🌫️ Fuzzy</option>
                <option value="qa">❓ Q&A</option>
                <option value="all">🔍 All</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>{t("advSearch.language")}</label>
              <select value={filters.language} onChange={(e) => setFilters({...filters, language: e.target.value as SearchFilters['language']})} style={selectStyle}>
                <option value="auto">🌍 Auto-detect</option>
                <option value="en">🇺🇸 English</option>
                <option value="el">🇬🇷 Greek</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>{t("advSearch.sortBy")}</label>
              <select value={filters.sortBy} onChange={(e) => setFilters({...filters, sortBy: e.target.value as SearchFilters['sortBy']})} style={selectStyle}>
                <option value="relevance">🎯 Relevance</option>
                <option value="date">📅 Date</option>
                <option value="title">📝 Title</option>
                <option value="type">📄 Type</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer' }}>
              <input type="checkbox" checked={filters.expandVariations} onChange={(e) => setFilters({...filters, expandVariations: e.target.checked})} style={{ width: '16px', height: '16px' }} />
              {t("advSearch.expandVariations")}
            </label>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'white', margin: 0 }}>
              {t("advSearch.searchResults")} ({results.length})
            </h4>
            {searchResponse?.semantic && <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>🧠 Semantic search enabled</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {results.slice(0, 5).map((result, index) => (
              <div key={index}
                onClick={() => {
                  if (result.type === 'document') nav(`/documents/${result.documentId}/view`);
                  else if (result.type === 'segment') nav(`/documents/${result.documentId}`);
                }}
                style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'white', flex: 1 }}>{result.title}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', background: 'rgba(99, 102, 241, 0.2)', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>{result.type}</div>
                </div>
                {result.content && (
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', lineHeight: '1.4' }}>
                    {truncateText(result.content, 150)}
                  </div>
                )}
                {result.score != null && (
                  <div style={{ fontSize: '11px', color: '#a5b4fc', marginTop: '4px' }}>
                    {t("advSearch.relevance")}: {Math.round(result.score * 100)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#a5b4fc', fontWeight: '500', marginBottom: '6px' }}>🔍 {t("advSearch.recentSearches")}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {searchHistory.slice(0, 5).map((term, index) => (
              <button key={index} onClick={() => handleSearch(term)} style={{
                padding: '4px 8px', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', fontSize: '11px',
              }}>
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

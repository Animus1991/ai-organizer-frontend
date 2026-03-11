import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { search, SearchResponse, SearchResultItem } from '../lib/api';
import { useLoading } from '../hooks/useLoading';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface AdvancedSearchProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  showAdvanced?: boolean;
}

interface SearchFilters {
  type: 'document' | 'segment' | 'all';
  mode: 'semantic' | 'exact' | 'fuzzy' | 'qa';
  language: 'auto' | 'el' | 'en';
  expandVariations: boolean;
}

export default function AdvancedSearch({ 
  onSearch, 
  placeholder,
  showAdvanced = true 
}: AdvancedSearchProps) {
  const nav = useNavigate();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    mode: 'semantic',
    language: 'auto',
    expandVariations: true
  });

  const { loading, execute } = useLoading();
  const inputRef = useRef<HTMLInputElement>(null);

  const surfaceBg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
  const surfaceBorder = isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.12)';
  const controlBg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
  const controlBorder = isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.2)';
  const textPrimary = isDark ? 'white' : '#000000';
  const textSecondary = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.62)';
  const textMuted = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('advancedSearchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Handle search execution
  const handleSearch = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    // Add to search history
    const newHistory = [finalQuery, ...searchHistory.filter(h => h !== finalQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('advancedSearchHistory', JSON.stringify(newHistory));

    // Execute search with current filters
    await execute(async () => {
      try {
        const mode: 'qa' | 'paragraphs' | undefined = filters.mode === 'qa' ? 'qa' : filters.mode === 'semantic' ? undefined : 'paragraphs';
        const searchOptions = {
          type: filters.type === 'all' ? undefined : filters.type,
          mode,
          semantic: filters.mode === 'semantic',
          lang: filters.language === 'auto' ? undefined : filters.language,
          expand_variations: filters.expandVariations,
          limit: 20
        };

        const searchResults: SearchResponse = await search(finalQuery, searchOptions);
        setResults(searchResults.results);

        // Call external search handler if provided
        if (onSearch) {
          onSearch(finalQuery);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      }
    });
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAdvancedOpen(false);
        return;
      }

      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault();
        handleSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [query]);

  return (
    <div className="advanced-search" style={{
      background: surfaceBg,
      borderRadius: '16px',
      border: surfaceBorder,
      padding: '20px',
      backdropFilter: 'blur(10px)',
    }}>
      {/* Search Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: textPrimary,
            margin: '0 0 6px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            🔍 {t("advancedSearch.title")}
          </h3>
          <p style={{
            fontSize: '13px',
            color: textSecondary,
            margin: 0,
          }}>
            {t("advancedSearch.subtitle")}
          </p>
        </div>
        
        {showAdvanced && (
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            style={{
              padding: '8px 16px',
              border: controlBorder,
              borderRadius: '8px',
              background: isAdvancedOpen ? 'rgba(99, 102, 241, 0.2)' : controlBg,
              color: isAdvancedOpen ? (isDark ? '#a5b4fc' : '#000000') : (isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.82)'),
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
          >
            {isAdvancedOpen ? '▼ Simple' : '▲ Advanced'}
          </button>
        )}
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          gap: '8px',
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder={placeholder || t("advancedSearch.placeholder")}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: controlBorder,
                borderRadius: '12px',
                background: controlBg,
                color: textPrimary,
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
                e.target.style.boxShadow = 'none';
              }}
            />
            
            {/* Search Icon */}
            <div style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
              fontSize: '16px',
            }}>
              🔍
            </div>
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '12px',
              background: loading || !query.trim() 
                ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: loading || !query.trim() 
                ? (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.45)')
                : 'white',
              cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}></div>
                Searching...
              </>
            ) : (
              t("action.search")
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && isAdvancedOpen && (
        <div style={{
          background: surfaceBg,
          border: surfaceBorder,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}>
            {/* Search Type */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.82)',
                marginBottom: '6px',
              }}>
                Search Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value as any})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: controlBorder,
                  borderRadius: '8px',
                  background: controlBg,
                  color: textPrimary,
                  fontSize: '13px',
                }}
              >
                <option value="all">All Content</option>
                <option value="document">Documents</option>
                <option value="segment">Segments</option>
              </select>
            </div>

            {/* Search Mode */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.82)',
                marginBottom: '6px',
              }}>
                Search Mode
              </label>
              <select
                value={filters.mode}
                onChange={(e) => setFilters({...filters, mode: e.target.value as any})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: controlBorder,
                  borderRadius: '8px',
                  background: controlBg,
                  color: textPrimary,
                  fontSize: '13px',
                }}
              >
                <option value="semantic">🧠 Semantic</option>
                <option value="exact">🎯 Exact Match</option>
                <option value="fuzzy">🌫️ Fuzzy</option>
                <option value="qa">❓ Q&A</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.82)',
                marginBottom: '6px',
              }}>
                Language
              </label>
              <select
                value={filters.language}
                onChange={(e) => setFilters({...filters, language: e.target.value as any})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: controlBorder,
                  borderRadius: '8px',
                  background: controlBg,
                  color: textPrimary,
                  fontSize: '13px',
                }}
              >
                <option value="auto">🌍 Auto-detect</option>
                <option value="en">🇺🇸 English</option>
                <option value="el">🇬🇷 Greek</option>
              </select>
            </div>
          </div>

          {/* Additional Options */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.12)',
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.82)',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={filters.expandVariations}
                onChange={(e) => setFilters({...filters, expandVariations: e.target.checked})}
                style={{
                  width: '16px',
                  height: '16px',
                }}
              />
              Expand variations (synonyms, related terms)
            </label>
          </div>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div style={{
          background: surfaceBg,
          border: surfaceBorder,
          borderRadius: '12px',
          padding: '16px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: textPrimary,
              margin: 0,
            }}>
              Search Results ({results.length})
            </h4>
            <div style={{
              fontSize: '12px',
              color: textSecondary,
            }}>
              {filters.mode === 'semantic' && '🧠 Semantic search enabled'}
              {filters.expandVariations && ' • Query variations expanded'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {results.slice(0, 5).map((result, index) => (
              <div
                key={index}
                onClick={() => {
                  if (result.type === 'document') {
                    nav(`/documents/${result.documentId}/view`);
                  } else if (result.type === 'segment') {
                    nav(`/documents/${result.documentId}`);
                  }
                }}
                style={{
                  padding: '12px',
                  background: surfaceBg,
                  border: surfaceBorder,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = surfaceBg;
                  e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.12)';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '4px',
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: textPrimary,
                    flex: 1,
                  }}>
                    {result.title}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: textMuted,
                    background: 'rgba(99, 102, 241, 0.2)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    marginLeft: '8px',
                  }}>
                    {result.type}
                  </div>
                </div>
                {result.mode && (
                  <div style={{
                    fontSize: '11px',
                    color: '#a5b4fc',
                    marginTop: '4px',
                  }}>
                    Mode: {result.mode}
                  </div>
                )}
              </div>
            ))}
          </div>

          {results.length > 5 && (
            <div style={{
              textAlign: 'center',
              marginTop: '12px',
            }}>
              <button
                onClick={() => {/* Show all results */}}
                style={{
                  padding: '8px 16px',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#a5b4fc',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                Show all {results.length} results
              </button>
            </div>
          )}
        </div>
      )}

      {/* Search Stats */}
      {searchHistory.length > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '8px',
        }}>
          <div style={{
            fontSize: '12px',
            color: isDark ? '#a5b4fc' : '#000000',
            fontWeight: '500',
            marginBottom: '6px',
          }}>
            🔍 Recent Searches
          </div>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            {searchHistory.slice(0, 5).map((term, index) => (
              <button
                key={index}
                onClick={() => handleSearch(term)}
                style={{
                  padding: '4px 8px',
                  border: controlBorder,
                  borderRadius: '6px',
                  background: controlBg,
                  color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.82)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                  e.currentTarget.style.color = '#a5b4fc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = controlBg;
                  e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.82)';
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

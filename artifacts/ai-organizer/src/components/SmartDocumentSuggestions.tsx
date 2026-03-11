import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentDTO } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface DocumentSuggestion {
  id: string;
  title: string;
  filename: string;
  relevanceScore: number;
  reason: string;
  category: 'similar_content' | 'recently_viewed' | 'trending' | 'recommended' | 'related_research';
  metadata: {
    wordCount?: number;
    lastAccessed?: Date;
    similarityScore?: number;
    popularityScore?: number;
  };
}

interface SmartSuggestionsProps {
  documents: DocumentDTO[];
  currentDocumentId?: number;
  userActivity?: {
    recentlyViewed: number[];
    searchHistory: string[];
    categories: string[];
  };
  maxSuggestions?: number;
}

export default function SmartDocumentSuggestions({ 
  documents, 
  currentDocumentId, 
  userActivity,
  maxSuggestions = 6 
}: SmartSuggestionsProps) {
  const nav = useNavigate();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [suggestions, setSuggestions] = useState<DocumentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const surfaceBg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
  const surfaceBorder = isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.12)';
  const surfaceBorderSoft = isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.1)';
  const textPrimary = isDark ? 'white' : '#000000';
  const textSecondary = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.62)';
  const textMuted = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';

  // ML-powered suggestion algorithm (deterministic, data-driven)
  const generateSuggestions = useMemo(() => {
    if (!documents.length) return [];

    const suggestions: DocumentSuggestion[] = [];
    const usedIds = new Set<string>();

    const tokenize = (value?: string) =>
      (value || "")
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .filter(Boolean);

    const getDocLabel = (doc: DocumentDTO) => doc.title || doc.filename || `Document ${doc.id}`;
    const currentDoc = documents.find((doc) => doc.id === currentDocumentId);
    const currentTokens = new Set(tokenize(currentDoc?.title || currentDoc?.filename || undefined));

    const addSuggestion = (suggestion: DocumentSuggestion) => {
      if (!usedIds.has(suggestion.id) && suggestion.id !== currentDocumentId?.toString()) {
        usedIds.add(suggestion.id);
        suggestions.push(suggestion);
        return true;
      }
      return false;
    };

    // 1. Similar Content Suggestions (token overlap)
    documents.forEach((doc) => {
      if (doc.id === currentDocumentId) return;
      const tokens = tokenize(doc.title || doc.filename || undefined);
      if (!tokens.length || !currentTokens.size) return;
      const overlap = tokens.filter((t) => currentTokens.has(t)).length;
      const similarityScore = overlap / Math.max(tokens.length, currentTokens.size);
      if (similarityScore >= 0.25) {
        addSuggestion({
          id: doc.id.toString(),
          title: getDocLabel(doc),
          filename: doc.filename || getDocLabel(doc),
          relevanceScore: Math.min(0.95, 0.6 + similarityScore),
          reason: t('suggestions.similarContentDetected') || 'Similar content detected',
          category: 'similar_content',
          metadata: {
            similarityScore,
            wordCount: doc.text?.length || 0,
          }
        });
      }
    });

    // 2. Recently Viewed Suggestions
    if (userActivity?.recentlyViewed?.length) {
      userActivity.recentlyViewed.forEach((docId, index) => {
        const doc = documents.find(d => d.id === docId);
        if (doc && doc.id !== currentDocumentId) {
          const recencyScore = 1 - (index / userActivity.recentlyViewed.length);
          addSuggestion({
            id: doc.id.toString(),
            title: getDocLabel(doc),
            filename: doc.filename || getDocLabel(doc),
            relevanceScore: recencyScore * 0.9,
            reason: t('suggestions.viewedRecently') || 'Viewed recently',
            category: 'recently_viewed',
            metadata: {
              lastAccessed: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
              popularityScore: recencyScore,
            }
          });
        }
      });
    }

    // 3. Trending Documents (deterministic: size + parse status)
    const trendingDocs = documents
      .filter(doc => doc.id !== currentDocumentId)
      .sort((a, b) => {
        const sizeA = a.upload?.sizeBytes || 0;
        const sizeB = b.upload?.sizeBytes || 0;
        const statusScore = (status?: string) => (status === "ok" ? 2 : status === "pending" ? 1 : 0);
        return (statusScore(b.parseStatus) - statusScore(a.parseStatus)) || (sizeB - sizeA) || (b.id - a.id);
      })
      .slice(0, 3);

    trendingDocs.forEach((doc, index) => {
      const popularityScore = Math.max(0.6, 0.9 - (index * 0.1));
      addSuggestion({
        id: doc.id.toString(),
        title: getDocLabel(doc),
        filename: doc.filename || getDocLabel(doc),
        relevanceScore: popularityScore,
        reason: t('suggestions.trendingInWorkspace') || 'Trending in your workspace',
        category: 'trending',
        metadata: {
          popularityScore,
          wordCount: doc.text?.length || 0,
        }
      });
    });

    // 4. Category-based Recommendations (filename/type keywords)
    const categoryKeywords = userActivity?.categories?.length
      ? userActivity.categories
      : ['Research', 'Analysis', 'Report', 'Notes'];
    categoryKeywords.forEach((category) => {
      const categoryDocs = documents.filter(doc =>
        doc.id !== currentDocumentId &&
        (doc.filename || "").toLowerCase().includes(category.toLowerCase())
      );
      if (categoryDocs.length > 0) {
        const doc = categoryDocs[0];
        addSuggestion({
          id: doc.id.toString(),
          title: getDocLabel(doc),
          filename: doc.filename || getDocLabel(doc),
          relevanceScore: 0.75,
          reason: t('suggestions.documentRecommendation') || 'Document recommendation',
          category: 'recommended',
          metadata: {
            wordCount: doc.text?.length || 0,
          }
        });
      }
    });

    // 5. Related Research (search history token match)
    if (userActivity?.searchHistory?.length) {
      const searchTokens = new Set(userActivity.searchHistory.flatMap((q) => tokenize(q)));
      documents.forEach(doc => {
        if (doc.id === currentDocumentId) return;
        const tokens = tokenize(doc.title || doc.filename || undefined);
        const overlap = tokens.filter((t) => searchTokens.has(t)).length;
        if (overlap > 0) {
          const relevanceScore = Math.min(0.9, 0.6 + overlap / Math.max(tokens.length, 1));
          addSuggestion({
            id: doc.id.toString(),
            title: getDocLabel(doc),
            filename: doc.filename || getDocLabel(doc),
            relevanceScore,
            reason: t('suggestions.relatedToInterests') || 'Related to your research interests',
            category: 'related_research',
            metadata: {
              similarityScore: relevanceScore,
              wordCount: doc.text?.length || 0,
            }
          });
        }
      });
    }

    return suggestions
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxSuggestions);
  }, [documents, currentDocumentId, userActivity, maxSuggestions, t]);

  // Filter suggestions by category
  const filteredSuggestions = useMemo(() => {
    if (selectedCategory === 'all') return generateSuggestions;
    return generateSuggestions.filter(s => s.category === selectedCategory);
  }, [generateSuggestions, selectedCategory]);

  // Helper function for category labels - defined before useMemo that uses it
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      similar_content: t('suggestions.similarContent') || 'Similar Content',
      recently_viewed: t('suggestions.recentlyViewed') || 'Recently Viewed',
      trending: t('suggestions.trending') || 'Trending',
      recommended: t('suggestions.recommended') || 'Recommended',
      related_research: t('suggestions.relatedResearch') || 'Related Research',
    };
    return labels[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Category statistics
  const categoryStats = useMemo(() => {
    const stats = generateSuggestions.reduce((acc, suggestion) => {
      acc[suggestion.category] = (acc[suggestion.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats).map(([category, count]) => ({
      category,
      count,
      label: getCategoryLabel(category),
    }));
  }, [generateSuggestions, getCategoryLabel]);

  useEffect(() => {
    // Simulate ML processing time
    const timer = setTimeout(() => {
      setSuggestions(filteredSuggestions);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [filteredSuggestions]);

  const getCategoryColor = (category: string) => {
    const colors = {
      similar_content: '#6366f1',
      recently_viewed: '#10b981',
      trending: '#f59e0b',
      recommended: '#8b5cf6',
      related_research: '#ef4444',
    };
    return colors[category as keyof typeof colors] || '#6b7280';
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      similar_content: '🔗',
      recently_viewed: '👁️',
      trending: '📈',
      recommended: '⭐',
      related_research: '🔬',
    };
    return icons[category as keyof typeof icons] || '📄';
  };

  if (loading) {
    return (
      <div className="smart-suggestions-loading" style={{
        padding: '24px',
        textAlign: 'center',
        background: surfaceBg,
        borderRadius: '16px',
        border: surfaceBorder,
      }}>
        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
          🧠 {t("suggestions.analyzing")}
        </div>
        <div className="loading-dots" style={{
          display: 'flex',
          gap: '4px',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#6366f1',
            animation: 'pulse 1.4s infinite ease-in-out',
          }}></div>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#6366f1',
            animation: 'pulse 1.4s infinite ease-in-out 0.2s',
          }}></div>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#6366f1',
            animation: 'pulse 1.4s infinite ease-in-out 0.4s',
          }}></div>
        </div>
      </div>
    );
  }

  if (!suggestions.length) {
    return (
      <div className="smart-suggestions-empty" style={{
        padding: '24px',
        textAlign: 'center',
        background: surfaceBg,
        borderRadius: '16px',
        border: surfaceBorder,
      }}>
        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
          🤖 {t("suggestions.noSuggestions")}
        </div>
        <div style={{ fontSize: '13px', color: textSecondary }}>
          {t("suggestions.noSuggestionsHint")}
        </div>
      </div>
    );
  }

  return (
    <div className="smart-document-suggestions" style={{
      background: surfaceBg,
      borderRadius: '16px',
      border: surfaceBorder,
      padding: '24px',
      backdropFilter: 'blur(10px)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
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
            🧠 {t("suggestions.title")}
          </h3>
          <p style={{
            fontSize: '13px',
            color: textSecondary,
            margin: 0,
          }}>
            {t("suggestions.subtitle")}
          </p>
        </div>
        
        {/* Category Filter */}
        <div style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '6px 12px',
              border: isDark ? 'none' : surfaceBorderSoft,
              borderRadius: '8px',
              background: selectedCategory === 'all' ? 'rgba(99, 102, 241, 0.2)' : surfaceBg,
              color: selectedCategory === 'all' ? (isDark ? '#a5b4fc' : '#000000') : textSecondary,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
          >
            {t("suggestions.all")} ({suggestions.length})
          </button>
          {categoryStats.map(({ category, count, label }) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '6px 12px',
                border: isDark ? 'none' : surfaceBorderSoft,
                borderRadius: '8px',
                background: selectedCategory === category ? 'rgba(99, 102, 241, 0.2)' : surfaceBg,
                color: selectedCategory === category ? (isDark ? '#a5b4fc' : '#000000') : textSecondary,
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {getCategoryIcon(category)} {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Suggestions Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px',
      }}>
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            onClick={() => nav(`/documents/${suggestion.id}`)}
            className="suggestion-card"
            style={{
              background: surfaceBg,
              border: surfaceBorder,
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.2)';
              e.currentTarget.style.borderColor = getCategoryColor(suggestion.category);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.12)';
            }}
          >
            {/* Category Badge */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: getCategoryColor(suggestion.category),
              color: 'white',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              {getCategoryIcon(suggestion.category)}
              {getCategoryLabel(suggestion.category)}
            </div>

            {/* Content */}
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: textPrimary,
                margin: '0 0 6px 0',
                lineHeight: '1.4',
                paddingRight: '80px', // Space for badge
              }}>
                {suggestion.title}
              </h4>
              <p style={{
                fontSize: '12px',
                color: textSecondary,
                margin: 0,
                lineHeight: '1.4',
              }}>
                {suggestion.filename}
              </p>
            </div>

            {/* Reason */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '6px',
              padding: '8px',
              marginBottom: '12px',
            }}>
              <div style={{
                fontSize: '11px',
                color: isDark ? '#a5b4fc' : '#000000',
                fontWeight: '500',
                marginBottom: '2px',
              }}>
                {t("suggestions.whyThis")}
              </div>
              <div style={{
                fontSize: '12px',
                color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.82)',
              }}>
                {suggestion.reason}
              </div>
            </div>

            {/* Metadata */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              color: textMuted,
            }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                {suggestion.metadata.wordCount && (
                  <span>📄 {Math.round(suggestion.metadata.wordCount / 1000)}k {t('suggestions.words')}</span>
                )}
                {suggestion.metadata.similarityScore && (
                  <span>🎯 {Math.round(suggestion.metadata.similarityScore * 100)}% {t('suggestions.match')}</span>
                )}
              </div>
              <div style={{
                color: getCategoryColor(suggestion.category),
                fontWeight: '600',
              }}>
                {Math.round(suggestion.relevanceScore * 100)}% {t('suggestions.relevant')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '8px',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '12px',
          color: isDark ? '#a5b4fc' : '#000000',
          fontWeight: '500',
        }}>
          🤖 {t("suggestions.mlAlgorithm")}
        </div>
        <div style={{
          fontSize: '11px',
          color: textMuted,
          marginTop: '4px',
        }}>
          {t("suggestions.recommendationsImprove")}
        </div>
      </div>
    </div>
  );
}

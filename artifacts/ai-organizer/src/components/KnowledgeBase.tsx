import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: 'getting-started' | 'features' | 'troubleshooting' | 'advanced' | 'api' | 'integration';
  tags: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  helpful: number;
  notHelpful: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
}

interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  articleCount: number;
}

interface KnowledgeBaseProps {
  compact?: boolean;
  showSearch?: boolean;
  showCategories?: boolean;
  showPopular?: boolean;
  maxArticles?: number;
}

export default function KnowledgeBase({ 
  compact = false,
  showSearch = true,
  showCategories = true,
  showPopular = true,
  maxArticles = 10
}: KnowledgeBaseProps) {
  const nav = useNavigate();
  const { t } = useLanguage();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Load knowledge base data
  useEffect(() => {
    const loadKnowledgeData = () => {
      setLoading(true);
      
      // Generate sample data for demonstration
      const { articles: sampleArticles, categories: sampleCategories } = generateSampleData();
      setArticles(sampleArticles);
      setCategories(sampleCategories);
      
      setLoading(false);
    };
    
    loadKnowledgeData();
  }, []);

  // Generate sample knowledge base data
  const generateSampleData = (): { 
    articles: KnowledgeArticle[], 
    categories: KnowledgeCategory[]
  } => {
    const sampleCategories: KnowledgeCategory[] = [
      {
        id: 'getting-started',
        name: 'Getting Started',
        description: 'Learn the basics and get up and running quickly',
        icon: '🚀',
        color: '#10b981',
        articleCount: 4
      },
      {
        id: 'features',
        name: 'Features',
        description: 'Explore all the powerful features available',
        icon: '⚡',
        color: '#3b82f6',
        articleCount: 6
      },
      {
        id: 'troubleshooting',
        name: 'Troubleshooting',
        description: 'Solve common issues and problems',
        icon: '🔧',
        color: '#f59e0b',
        articleCount: 3
      },
      {
        id: 'advanced',
        name: 'Advanced',
        description: 'Advanced techniques and power user features',
        icon: '🎯',
        color: '#8b5cf6',
        articleCount: 4
      }
    ];

    const sampleArticles: KnowledgeArticle[] = [
      {
        id: 'article-1',
        title: 'Getting Started with AI Research Platform',
        content: 'Welcome to the AI Research Platform! This comprehensive guide will help you get up and running quickly with our powerful AI-powered research tools.',
        category: 'getting-started',
        tags: ['beginner', 'tutorial', 'overview'],
        author: 'AI Research Team',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        views: 1250,
        helpful: 89,
        notHelpful: 3,
        difficulty: 'beginner',
        estimatedReadTime: 5
      },
      {
        id: 'article-2',
        title: 'Understanding Smart Document Suggestions',
        content: 'Smart Document Suggestions is one of our most powerful AI features that helps you discover relevant documents based on your research patterns and usage history.',
        category: 'features',
        tags: ['ai', 'suggestions', 'machine-learning'],
        author: 'AI Research Team',
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-18'),
        views: 890,
        helpful: 76,
        notHelpful: 5,
        difficulty: 'intermediate',
        estimatedReadTime: 4
      },
      {
        id: 'article-3',
        title: 'Advanced Search Techniques',
        content: 'Master the power of our advanced search capabilities to find exactly what you need using semantic search, filters, and search operators.',
        category: 'features',
        tags: ['search', 'semantic', 'filters'],
        author: 'Search Team',
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-19'),
        views: 1100,
        helpful: 92,
        notHelpful: 2,
        difficulty: 'intermediate',
        estimatedReadTime: 6
      },
      {
        id: 'article-4',
        title: 'Team Collaboration Guide',
        content: 'Learn how to effectively collaborate with your research team using our platform with role-based permissions and real-time activity tracking.',
        category: 'features',
        tags: ['collaboration', 'team', 'permissions'],
        author: 'Collaboration Team',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-20'),
        views: 750,
        helpful: 84,
        notHelpful: 4,
        difficulty: 'beginner',
        estimatedReadTime: 7
      },
      {
        id: 'article-5',
        title: 'Analytics and Insights Dashboard',
        content: 'Understand your research patterns and optimize your workflow with comprehensive analytics and AI-powered insights.',
        category: 'features',
        tags: ['analytics', 'insights', 'metrics'],
        author: 'Analytics Team',
        createdAt: new Date('2024-01-19'),
        updatedAt: new Date('2024-01-21'),
        views: 920,
        helpful: 88,
        notHelpful: 3,
        difficulty: 'intermediate',
        estimatedReadTime: 8
      },
      {
        id: 'article-6',
        title: 'Common Issues and Solutions',
        content: 'Find solutions to the most frequently encountered issues including upload problems, search issues, and collaboration problems.',
        category: 'troubleshooting',
        tags: ['troubleshooting', 'issues', 'solutions'],
        author: 'Support Team',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-22'),
        views: 1450,
        helpful: 95,
        notHelpful: 8,
        difficulty: 'beginner',
        estimatedReadTime: 6
      }
    ];

    return { articles: sampleArticles, categories: sampleCategories };
  };

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results = articles.filter(article => {
      return article.title.toLowerCase().includes(query) ||
             article.content.toLowerCase().includes(query) ||
             article.tags.some(tag => tag.toLowerCase().includes(query));
    });

    return results;
  }, [articles, searchQuery]);

  // Filter articles by category
  const filteredArticles = useMemo(() => {
    let filtered = articles;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    return filtered
      .sort((a, b) => b.views - a.views)
      .slice(0, maxArticles);
  }, [articles, selectedCategory, maxArticles]);

  // Get popular articles
  const popularArticles = useMemo(() => {
    return articles
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [articles]);

  function getCategoryColor(category: string): string {
    const cat = categories.find(c => c.id === category);
    return cat?.color || '#6b7280';
  }

  function getDifficultyColor(difficulty: string): string {
    const colors = {
      beginner: '#10b981',
      intermediate: '#f59e0b',
      advanced: '#ef4444'
    };
    return colors[difficulty as keyof typeof colors] || '#6b7280';
  }

  function formatReadTime(minutes: number): string {
    if (minutes < 1) return '< 1 min read';
    return `${minutes} min read`;
  }

  if (loading) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '40px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(99, 102, 241, 0.3)',
          borderTop: '3px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        <div style={{ color: 'white', fontSize: '16px' }}>{t("knowledge.loading")}</div>
      </div>
    );
  }

  return (
    <div className="knowledge-base" style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: compact ? '16px' : '20px',
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
            color: 'white',
            margin: '0 0 6px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            📚 {t("knowledge.title")}
          </h3>
          <p style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.6)',
            margin: 0,
          }}>
            {t("knowledge.subtitle")}
          </p>
        </div>
        
        <div style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px 8px',
          borderRadius: '6px',
        }}>
          {articles.length} {t("knowledge.articles")}
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder={t("knowledge.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* Search Results */}
      {searchQuery && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'white',
            margin: '0 0 12px 0',
          }}>
            {t("knowledge.searchResults")} ({searchResults.length})
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {searchResults.map(article => (
              <div
                key={article.id}
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '4px',
                }}>
                  {article.title}
                </div>
                
                <div style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '4px',
                }}>
                  {article.content.substring(0, 100)}...
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}>
                  <span>👁️ {article.views} {t("knowledge.views")}</span>
                  <span>⏱️ {formatReadTime(article.estimatedReadTime)}</span>
                  <span style={{ color: getDifficultyColor(article.difficulty) }}>
                    {article.difficulty}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {searchResults.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: 'rgba(255, 255, 255, 0.5)',
            }}>
              {t("knowledge.noResults")} "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Categories */}
      {showCategories && !searchQuery && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'white',
            margin: '0 0 12px 0',
          }}>
            {t("knowledge.categories")}
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '8px',
          }}>
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '8px 12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                background: selectedCategory === 'all' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {t("knowledge.allCategories")}
            </button>
            
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  background: selectedCategory === category.id 
                    ? `${category.color}33` 
                    : 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
                <span style={{
                  fontSize: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                }}>
                  {category.articleCount}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Articles */}
      {showPopular && !searchQuery && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'white',
            margin: '0 0 12px 0',
          }}>
            {t("knowledge.popularArticles")}
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {popularArticles.map(article => (
              <div
                key={article.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <div style={{ fontSize: '16px' }}>
                  📄
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'white',
                    marginBottom: '2px',
                  }}>
                    {article.title}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    fontSize: '10px',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}>
                    <span>👁️ {article.views}</span>
                    <span>⏱️ {formatReadTime(article.estimatedReadTime)}</span>
                    <span style={{ color: getDifficultyColor(article.difficulty) }}>
                      {article.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '8px',
        fontSize: '11px',
        color: '#a5b4fc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          📚 {articles.length} {t("knowledge.articlesLabel")} • {categories.length} {t("knowledge.categoriesLabel")}
        </div>
        <div>
          🔍 {searchQuery ? `${searchResults.length} ${t("knowledge.results")}` : t("knowledge.readyToSearch")}
        </div>
      </div>
    </div>
  );
}

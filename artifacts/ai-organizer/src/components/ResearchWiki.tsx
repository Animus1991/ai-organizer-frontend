import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

// Types for Research Wiki
export interface WikiPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  parentId?: string;
  order: number;
  lastEditedBy: string;
  lastEditedAt: string;
  createdBy: string;
  createdAt: string;
  views: number;
  contributors: string[];
}

export interface WikiCategory {
  id: string;
  name: string;
  icon: string;
  pages: WikiPage[];
}

const STORAGE_KEY = 'research-wiki';

interface ResearchWikiProps {
  onClose?: () => void;
}

export const ResearchWiki: React.FC<ResearchWikiProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const loadedPages = JSON.parse(stored);
      setPages(loadedPages);
      if (loadedPages.length > 0) {
        setSelectedPage(loadedPages.find((p: WikiPage) => p.slug === 'home') || loadedPages[0]);
      }
    } else {
      const defaultPages: WikiPage[] = [
        {
          id: 'page-1', title: 'Home', slug: 'home',
          content: `# Welcome to the Research Wiki\n\nThis wiki serves as the central documentation hub for your research project.\n\n## Quick Links\n- [Getting Started](#getting-started)\n- [Methodology](#methodology)\n- [Data Collection](#data-collection)\n- [Analysis Guidelines](#analysis-guidelines)\n\n## Getting Started\n\nUse the sidebar to navigate between pages.\n\n### Features\n- **Markdown Support**: Full markdown formatting\n- **Version History**: Track changes over time\n- **Search**: Quickly find information\n- **Collaboration**: Multiple contributors\n\n---\n*Last updated: ${new Date().toLocaleDateString()}*`,
          order: 0, lastEditedBy: 'User', lastEditedAt: new Date().toISOString(),
          createdBy: 'User', createdAt: new Date().toISOString(), views: 42, contributors: ['User'],
        },
        {
          id: 'page-2', title: 'Methodology', slug: 'methodology',
          content: `# Research Methodology\n\n## Overview\nThis document outlines the methodological approach.\n\n## Research Design\n- **Type**: Mixed methods\n- **Duration**: 12 months\n- **Sample Size**: 200 participants\n\n## Data Collection Methods\n1. Surveys\n2. Interviews\n3. Document Analysis\n\n## Ethical Considerations\nAll research activities comply with IRB guidelines.`,
          order: 1, lastEditedBy: 'User', lastEditedAt: new Date().toISOString(),
          createdBy: 'User', createdAt: new Date().toISOString(), views: 28, contributors: ['User'],
        },
        {
          id: 'page-3', title: 'Data Collection', slug: 'data-collection',
          content: `# Data Collection Procedures\n\n## Survey Distribution\n- Online survey platform\n- Email invitations\n- 2-week response window\n\n## Interview Protocol\n- Semi-structured format\n- 45-60 minutes\n- Audio recorded with consent\n\n## Data Storage\nAll data stored securely with encryption.`,
          parentId: 'page-2', order: 0, lastEditedBy: 'User', lastEditedAt: new Date().toISOString(),
          createdBy: 'User', createdAt: new Date().toISOString(), views: 15, contributors: ['User'],
        },
        {
          id: 'page-4', title: 'Analysis Guidelines', slug: 'analysis-guidelines',
          content: `# Analysis Guidelines\n\n## Quantitative Analysis\n- SPSS for statistical analysis\n- Significance level: p < 0.05\n- Effect sizes reported\n\n## Qualitative Analysis\n- Thematic analysis approach\n- NVivo for coding\n- Inter-rater reliability checks\n\n## Reporting Standards\nFollow APA 7th edition formatting.`,
          order: 2, lastEditedBy: 'User', lastEditedAt: new Date().toISOString(),
          createdBy: 'User', createdAt: new Date().toISOString(), views: 19, contributors: ['User'],
        },
      ];
      setPages(defaultPages);
      setSelectedPage(defaultPages[0]);
    }
  }, []);

  useEffect(() => {
    if (pages.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  }, [pages]);

  const pageTree = useMemo(() => {
    const rootPages = pages.filter(p => !p.parentId).sort((a, b) => a.order - b.order);
    const getChildren = (parentId: string): WikiPage[] => pages.filter(p => p.parentId === parentId).sort((a, b) => a.order - b.order);
    return { rootPages, getChildren };
  }, [pages]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return pages.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
  }, [pages, searchQuery]);

  const createPage = useCallback((title: string, parentId?: string) => {
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const newPage: WikiPage = {
      id: `page-${Date.now()}`, title, slug,
      content: `# ${title}\n\nStart writing your content here...`,
      parentId, order: pages.filter(p => p.parentId === parentId).length,
      lastEditedBy: 'User', lastEditedAt: new Date().toISOString(),
      createdBy: 'User', createdAt: new Date().toISOString(), views: 0, contributors: ['User'],
    };
    setPages(prev => [...prev, newPage]);
    setSelectedPage(newPage); setIsEditing(true);
    setEditTitle(newPage.title); setEditContent(newPage.content);
    setShowCreateModal(false);
    if (isMobile) setSidebarCollapsed(true);
  }, [pages, isMobile]);

  const savePage = useCallback(() => {
    if (!selectedPage) return;
    setPages(prev => prev.map(p =>
      p.id === selectedPage.id ? {
        ...p, title: editTitle, content: editContent,
        slug: editTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        lastEditedBy: 'User', lastEditedAt: new Date().toISOString(),
        contributors: p.contributors.includes('User') ? p.contributors : [...p.contributors, 'User'],
      } : p
    ));
    setSelectedPage(prev => prev ? { ...prev, title: editTitle, content: editContent } : null);
    setIsEditing(false);
  }, [selectedPage, editTitle, editContent]);

  const deletePage = useCallback((id: string) => {
    const toDelete = new Set([id]);
    const findChildren = (parentId: string) => {
      pages.filter(p => p.parentId === parentId).forEach(child => {
        toDelete.add(child.id); findChildren(child.id);
      });
    };
    findChildren(id);
    setPages(prev => prev.filter(p => !toDelete.has(p.id)));
    if (selectedPage && toDelete.has(selectedPage.id)) {
      setSelectedPage(pages.find(p => p.slug === 'home' && !toDelete.has(p.id)) || null);
    }
  }, [pages, selectedPage]);

  const viewPage = useCallback((page: WikiPage) => {
    setPages(prev => prev.map(p => p.id === page.id ? { ...p, views: p.views + 1 } : p));
    setSelectedPage(page); setIsEditing(false);
    if (isMobile) setSidebarCollapsed(true);
  }, [isMobile]);

  const startEditing = useCallback(() => {
    if (!selectedPage) return;
    setEditTitle(selectedPage.title); setEditContent(selectedPage.content); setIsEditing(true);
  }, [selectedPage]);

  const renderMarkdown = (content: string) => {
    return content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/\n/gim, '<br>')
      .replace(/---/gim, '<hr>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
  };

  const renderPageItem = (page: WikiPage, depth: number = 0) => {
    const children = pageTree.getChildren(page.id);
    const isSelected = selectedPage?.id === page.id;
    
    return (
      <div key={page.id}>
        <button onClick={() => viewPage(page)} style={{
          width: '100%', padding: '8px 12px', paddingLeft: `${12 + depth * 16}px`,
          background: isSelected ? 'hsl(var(--muted) / 0.4)' : 'transparent',
          border: 'none', borderLeft: isSelected ? '2px solid hsl(var(--primary))' : '2px solid transparent',
          textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          color: isSelected ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', fontSize: '13px',
        }}>
          <span>{page.slug === 'home' ? '🏠' : children.length > 0 ? '📁' : '📄'}</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.title}</span>
        </button>
        {children.map(child => renderPageItem(child, depth + 1))}
      </div>
    );
  };

  return (
    <div style={{
      background: 'hsl(var(--card))', borderRadius: '10px',
      border: '1px solid hsl(var(--border))', overflow: 'hidden',
      height: '100%', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '10px 14px' : '12px 16px',
        background: 'hsl(var(--muted) / 0.15)',
        borderBottom: '1px solid hsl(var(--border))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{
            padding: '6px', background: 'transparent', border: 'none',
            color: 'hsl(var(--muted-foreground))', cursor: 'pointer',
          }}>{sidebarCollapsed ? '☰' : '◀'}</button>
          <span style={{ fontSize: '20px' }}>📚</span>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            {t('wiki.title') || 'Research Wiki'}
          </h2>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isMobile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', background: 'hsl(var(--muted) / 0.3)',
              border: '1px solid hsl(var(--border))', borderRadius: '10px',
            }}>
              <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '12px' }}>🔍</span>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wiki..." style={{
                  background: 'transparent', border: 'none', color: 'hsl(var(--foreground))',
                  fontSize: '13px', width: '150px', outline: 'none',
                }}
              />
            </div>
          )}
          <button onClick={() => setShowCreateModal(true)} style={{
            padding: '6px 12px', background: 'hsl(var(--success))',
            border: 'none', borderRadius: '10px', color: 'hsl(var(--success-foreground))',
            fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
          }}>➕ New Page</button>
          {onClose && (
            <button onClick={onClose} style={{
              padding: '6px 10px', background: 'transparent',
              border: '1px solid hsl(var(--border))', borderRadius: '10px',
              color: 'hsl(var(--muted-foreground))', cursor: 'pointer',
            }}>✕</button>
          )}
        </div>
      </div>

      {/* Mobile search */}
      {isMobile && (
        <div style={{ padding: '8px 14px', borderBottom: '1px solid hsl(var(--border))' }}>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search wiki..." style={{
              width: '100%', padding: '8px 12px', background: 'hsl(var(--muted) / 0.2)',
              border: '1px solid hsl(var(--border))', borderRadius: '10px',
              color: 'hsl(var(--foreground))', fontSize: '13px', outline: 'none',
            }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: isMobile && !sidebarCollapsed ? 'column' : 'row' }}>
        {/* Sidebar */}
        {!sidebarCollapsed && (
          <div style={{
            width: isMobile ? '100%' : '250px',
            maxHeight: isMobile ? '200px' : 'none',
            borderRight: isMobile ? 'none' : '1px solid hsl(var(--border))',
            borderBottom: isMobile ? '1px solid hsl(var(--border))' : 'none',
            overflow: 'auto', background: 'hsl(var(--muted) / 0.1)',
          }}>
            {searchQuery && (
              <div style={{ padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}>
                  SEARCH RESULTS ({searchResults.length})
                </div>
                {searchResults.map(page => (
                  <button key={page.id} onClick={() => { viewPage(page); setSearchQuery(''); }}
                    style={{
                      width: '100%', padding: '8px 12px', background: 'transparent',
                      border: 'none', textAlign: 'left', cursor: 'pointer',
                      borderRadius: '10px', marginBottom: '4px',
                    }}>
                    <div style={{ fontSize: '13px', color: 'hsl(var(--foreground))', fontWeight: 500 }}>{page.title}</div>
                    <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>{page.content.substring(0, 50)}...</div>
                  </button>
                ))}
                {searchResults.length === 0 && (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '12px' }}>No results found</div>
                )}
              </div>
            )}
            {!searchQuery && (
              <div style={{ padding: '8px 0' }}>
                <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>PAGES</div>
                {pageTree.rootPages.map(page => renderPageItem(page))}
              </div>
            )}
          </div>
        )}

        {/* Page Content */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {selectedPage ? (
            <>
              <div style={{
                padding: isMobile ? '12px 14px' : '16px 24px',
                borderBottom: '1px solid hsl(var(--border))',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '8px',
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  {isEditing ? (
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                      style={{
                        fontSize: isMobile ? '16px' : '20px', fontWeight: 600,
                        background: 'transparent', border: '1px solid hsl(var(--border))',
                        borderRadius: '10px', padding: '6px 12px',
                        color: 'hsl(var(--foreground))', width: '100%', maxWidth: '400px',
                      }}
                    />
                  ) : (
                    <h1 style={{ margin: 0, fontSize: isMobile ? '16px' : '20px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                      {selectedPage.title}
                    </h1>
                  )}
                  <div style={{
                    marginTop: '6px', fontSize: '12px', color: 'hsl(var(--muted-foreground))',
                    display: 'flex', gap: isMobile ? '8px' : '16px', flexWrap: 'wrap',
                  }}>
                    <span>Last edited by {selectedPage.lastEditedBy}</span>
                    {!isMobile && <span>•</span>}
                    <span>{new Date(selectedPage.lastEditedAt).toLocaleDateString()}</span>
                    {!isMobile && <><span>•</span><span>{selectedPage.views} views</span></>}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {isEditing ? (
                    <>
                      <button onClick={() => setIsEditing(false)} style={{
                        padding: '8px 14px', background: 'hsl(var(--muted) / 0.3)',
                        border: '1px solid hsl(var(--border))', borderRadius: '10px',
                        color: 'hsl(var(--muted-foreground))', cursor: 'pointer', fontSize: '13px',
                      }}>Cancel</button>
                      <button onClick={savePage} style={{
                        padding: '8px 14px', background: 'hsl(var(--success))',
                        border: 'none', borderRadius: '10px',
                        color: 'hsl(var(--success-foreground))', cursor: 'pointer',
                        fontSize: '13px', fontWeight: 500,
                      }}>💾 Save</button>
                    </>
                  ) : (
                    <>
                      <button onClick={startEditing} style={{
                        padding: '8px 14px', background: 'hsl(var(--primary))',
                        border: 'none', borderRadius: '10px',
                        color: 'hsl(var(--primary-foreground))', cursor: 'pointer', fontSize: '13px',
                      }}>✏️ Edit</button>
                      {selectedPage.slug !== 'home' && (
                        <button onClick={() => deletePage(selectedPage.id)} style={{
                          padding: '8px 12px', background: 'transparent',
                          border: '1px solid hsl(var(--destructive) / 0.4)', borderRadius: '10px',
                          color: 'hsl(var(--destructive))', cursor: 'pointer', fontSize: '13px',
                        }}>🗑️</button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, padding: isMobile ? '16px' : '24px', overflow: 'auto' }}>
                {isEditing ? (
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                    style={{
                      width: '100%', height: '100%', minHeight: '400px',
                      padding: '16px', background: 'hsl(var(--muted) / 0.15)',
                      border: '1px solid hsl(var(--border))', borderRadius: '10px',
                      color: 'hsl(var(--foreground))', fontSize: '14px',
                      fontFamily: 'monospace', lineHeight: 1.6, resize: 'none',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                    placeholder="Write your content in Markdown..."
                  />
                ) : (
                  <div style={{ maxWidth: '800px', fontSize: '15px', lineHeight: 1.7, color: 'hsl(var(--foreground))' }}
                    className="wiki-content"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedPage.content) }}
                  />
                )}
              </div>

              {!isEditing && selectedPage.contributors.length > 0 && (
                <div style={{
                  padding: '12px 24px', borderTop: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--muted) / 0.1)', display: 'flex',
                  alignItems: 'center', gap: '12px',
                }}>
                  <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>Contributors:</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {selectedPage.contributors.map(contributor => (
                      <span key={contributor} style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: `hsl(${contributor.charCodeAt(0) * 50 % 360}, 60%, 50%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', color: '#fff', fontWeight: 600,
                      }} title={contributor}>{contributor.charAt(0).toUpperCase()}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}>
              Select a page to view
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreatePageModal pages={pages} isMobile={isMobile} onClose={() => setShowCreateModal(false)} onCreate={createPage} />
      )}

      <style>{`
        .wiki-content h1 { font-size: 24px; font-weight: 700; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 1px solid hsl(var(--border)); }
        .wiki-content h2 { font-size: 20px; font-weight: 600; margin: 24px 0 12px; }
        .wiki-content h3 { font-size: 16px; font-weight: 600; margin: 20px 0 10px; }
        .wiki-content li { margin: 4px 0; }
        .wiki-content code { padding: 2px 6px; background: hsl(var(--muted) / 0.3); border-radius: 6px; font-size: 13px; }
        .wiki-content hr { margin: 24px 0; border: none; border-top: 1px solid hsl(var(--border)); }
        .wiki-content a { color: hsl(var(--primary)); text-decoration: none; }
        .wiki-content strong { font-weight: 600; }
      `}</style>
    </div>
  );
};

// Create Page Modal
interface CreatePageModalProps {
  pages: WikiPage[];
  isMobile: boolean;
  onClose: () => void;
  onCreate: (title: string, parentId?: string) => void;
}

const CreatePageModal: React.FC<CreatePageModalProps> = ({ pages, isMobile, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [parentId, setParentId] = useState<string>('');

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: 'hsl(var(--muted) / 0.3)', border: '1px solid hsl(var(--border))',
    borderRadius: '10px', color: 'hsl(var(--foreground))', fontSize: '14px', outline: 'none',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 99999, padding: isMobile ? '16px' : '24px',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 'min(420px, 100%)', background: 'hsl(var(--card))',
        borderRadius: '16px', border: '1px solid hsl(var(--border))', overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>New Wiki Page</h3>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none',
            color: 'hsl(var(--muted-foreground))', cursor: 'pointer', fontSize: '18px',
          }}>✕</button>
        </div>

        <div style={{ padding: isMobile ? '16px' : '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '6px' }}>Page Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Research Protocol" autoFocus style={inputStyle} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '6px' }}>Parent Page (optional)</label>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">No parent (root level)</option>
              {pages.map(page => (<option key={page.id} value={page.id}>{page.title}</option>))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{
              padding: '10px 16px', background: 'hsl(var(--muted) / 0.3)',
              border: '1px solid hsl(var(--border))', borderRadius: '10px',
              color: 'hsl(var(--muted-foreground))', cursor: 'pointer', fontSize: '13px',
            }}>Cancel</button>
            <button onClick={() => title.trim() && onCreate(title.trim(), parentId || undefined)}
              disabled={!title.trim()} style={{
                padding: '10px 20px',
                background: title.trim() ? 'hsl(var(--success))' : 'hsl(var(--muted) / 0.3)',
                border: 'none', borderRadius: '10px',
                color: title.trim() ? 'hsl(var(--success-foreground))' : 'hsl(var(--muted-foreground))',
                fontWeight: 600, fontSize: '13px',
                cursor: title.trim() ? 'pointer' : 'not-allowed',
              }}>Create Page</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchWiki;

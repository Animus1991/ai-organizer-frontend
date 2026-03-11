/**
 * DocumentProjectList - GitHub-style repository/document list for the Home page
 * Fully themed with HSL tokens from index.css
 */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useDocumentStatus } from '../../hooks/useDocumentStatus';
import { UploadItemDTO } from '../../lib/api';
import { FileText, FileType, BookOpen, Code, Settings, Search, Star } from 'lucide-react';

type SortKey = 'name' | 'updated' | 'stars' | 'size' | 'status';
type FilterType = 'all' | 'research' | 'theory' | 'review' | 'draft';
type VisibilityType = 'public' | 'private' | 'team';

interface DocumentProjectListProps {
  uploads: UploadItemDTO[] | null | undefined;
  maxItems?: number;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; tokenColor: string; label: string }> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: <FileText size={14} />, tokenColor: 'var(--info)', label: 'DOCX' },
  'application/msword': { icon: <FileText size={14} />, tokenColor: 'var(--info)', label: 'DOC' },
  'application/pdf': { icon: <BookOpen size={14} />, tokenColor: 'var(--destructive)', label: 'PDF' },
  'text/plain': { icon: <FileType size={14} />, tokenColor: 'var(--success)', label: 'TXT' },
  'text/markdown': { icon: <Code size={14} />, tokenColor: 'var(--primary)', label: 'MD' },
  'application/json': { icon: <Settings size={14} />, tokenColor: 'var(--warning)', label: 'JSON' },
};

function getTypeInfo(contentType: string) {
  return TYPE_CONFIG[contentType] || { icon: <FileText size={14} />, tokenColor: 'var(--muted-foreground)', label: contentType?.split('/').pop()?.toUpperCase() || 'FILE' };
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function DocumentProjectList({ uploads, maxItems = 20 }: DocumentProjectListProps) {
  const nav = useNavigate();
  const { t } = useLanguage();
  const { favorites } = useFavorites();
  const { getStatus } = useDocumentStatus();

  const [sortBy, setSortBy] = useState<SortKey>('updated');
  const [sortAsc, setSortAsc] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const uploadsList = useMemo(() => Array.isArray(uploads) ? uploads : [], [uploads]);

  const enrichedDocs = useMemo(() => {
    const starredSet = new Set(favorites.filter(f => f.type === 'document').map(f => String(f.id)));
    const now = new Date();
    return uploadsList.map((u, idx) => {
      const docStatus = getStatus(u.documentId);
      const isFav = starredSet.has(String(u.documentId));
      const visibility: VisibilityType = docStatus === 'published' ? 'public' : docStatus === 'in-review' ? 'team' : 'private';
      const projectType: FilterType = docStatus === 'draft' ? 'draft' : docStatus === 'in-review' ? 'review' : docStatus === 'published' ? 'research' : 'theory';
      const updatedDate = (u as any).updatedAt || new Date(now.getTime() - idx * 3600000 * (idx + 1)).toISOString();
      const createdDate = (u as any).createdAt || new Date(now.getTime() - idx * 86400000 * 3).toISOString();
      return { ...u, starred: isFav, starCount: isFav ? Math.floor(Math.random() * 15) + 1 : 0, visibility, projectType, docStatus, updatedAt: updatedDate, createdAt: createdDate, language: detectLanguage(u.filename) };
    });
  }, [uploadsList, favorites, getStatus]);

  const filtered = useMemo(() => {
    let result = enrichedDocs;
    if (filterType !== 'all') result = result.filter(d => d.projectType === filterType);
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); result = result.filter(d => d.filename.toLowerCase().includes(q)); }
    return result;
  }, [enrichedDocs, filterType, searchQuery]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name': cmp = a.filename.localeCompare(b.filename); break;
        case 'updated': cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break;
        case 'stars': cmp = a.starCount - b.starCount; break;
        case 'size': cmp = a.sizeBytes - b.sizeBytes; break;
        case 'status': cmp = a.parseStatus.localeCompare(b.parseStatus); break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return arr.slice(0, maxItems);
  }, [filtered, sortBy, sortAsc, maxItems]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  }, [sortBy, sortAsc]);

  const visibilityConfig: Record<VisibilityType, { label: string; tokenColor: string }> = {
    public: { label: t('docList.public') || 'Public', tokenColor: 'var(--success)' },
    private: { label: t('docList.private') || 'Private', tokenColor: 'var(--warning)' },
    team: { label: t('docList.team') || 'Team', tokenColor: 'var(--primary)' },
  };

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: enrichedDocs.length };
    enrichedDocs.forEach(d => { counts[d.projectType] = (counts[d.projectType] || 0) + 1; });
    return counts;
  }, [enrichedDocs]);

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid hsl(var(--border))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
            📚 {t('docList.title') || 'Documents & Projects'}
          </span>
          <span style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '10px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', fontWeight: 600 }}>
            {enrichedDocs.length}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setShowFilters(!showFilters)} style={{
            padding: '6px 12px', fontSize: '12px', fontWeight: 500, borderRadius: 'var(--radius)',
            border: `1px solid ${showFilters ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))'}`,
            background: showFilters ? 'hsl(var(--primary) / 0.08)' : 'transparent',
            color: showFilters ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <Search size={12} /> {t('docList.filter') || 'Filter'}
          </button>
          <button onClick={() => nav('/library')} style={{
            padding: '6px 12px', fontSize: '12px', fontWeight: 500, borderRadius: 'var(--radius)',
            border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--primary))', cursor: 'pointer',
          }}>
            {t('docList.viewAll') || 'View all'} →
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '12px 16px', background: 'hsl(var(--card))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))', flexWrap: 'wrap' }}>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('docList.searchPlaceholder') || 'Find a document...'}
            style={{ flex: 1, minWidth: '200px', padding: '8px 12px', fontSize: '13px', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))', background: 'hsl(var(--input))', color: 'hsl(var(--foreground))', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all','research','theory','review','draft'] as FilterType[]).map(type => (
              <button key={type} onClick={() => setFilterType(type)} style={{
                padding: '4px 10px', fontSize: '11px', fontWeight: 500, borderRadius: '16px', cursor: 'pointer',
                border: `1px solid ${filterType === type ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))'}`,
                background: filterType === type ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                color: filterType === type ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              }}>
                {t(`docList.type.${type}`) || type.charAt(0).toUpperCase() + type.slice(1)}
                {filterCounts[type] !== undefined ? ` (${filterCounts[type]})` : ''}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
            <span>{t('docList.sortBy') || 'Sort:'}</span>
            {(['updated','name','stars','size','status'] as SortKey[]).map(key => (
              <button key={key} onClick={() => handleSort(key)} style={{
                padding: '3px 8px', fontSize: '11px', fontWeight: 500, borderRadius: '6px', cursor: 'pointer',
                border: `1px solid ${sortBy === key ? 'hsl(var(--primary) / 0.3)' : 'transparent'}`,
                background: sortBy === key ? 'hsl(var(--primary) / 0.08)' : 'transparent',
                color: sortBy === key ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              }}>
                {t(`docList.sort.${key}`) || key.charAt(0).toUpperCase() + key.slice(1)}
                {sortBy === key && (sortAsc ? ' ↑' : ' ↓')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Document List */}
      {sorted.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'hsl(var(--card))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
          <div style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>
            {searchQuery ? (t('docList.noResults') || 'No documents match your search') : (t('docList.empty') || 'No documents yet. Upload your first document to get started.')}
          </div>
        </div>
      ) : (
        <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {sorted.map((doc, idx) => {
            const typeInfo = getTypeInfo(doc.contentType);
            const vis = visibilityConfig[doc.visibility];
            const stsToken = doc.parseStatus === 'ok' ? 'var(--success)' : doc.parseStatus === 'pending' ? 'var(--warning)' : 'var(--destructive)';
            const docStsToken = doc.docStatus === 'published' ? 'var(--success)' : doc.docStatus === 'in-review' ? 'var(--warning)' : doc.docStatus === 'archived' ? 'var(--primary)' : 'var(--muted-foreground)';

            return (
              <div key={doc.uploadId} onClick={() => nav(`/documents/${doc.documentId}`)}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(var(--muted) / 0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 20px', cursor: 'pointer', borderBottom: idx < sorted.length - 1 ? '1px solid hsl(var(--border))' : 'none', transition: 'background 0.15s ease' }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius)', background: `hsl(${typeInfo.tokenColor} / 0.1)`, border: `1px solid hsl(${typeInfo.tokenColor} / 0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `hsl(${typeInfo.tokenColor})`, flexShrink: 0 }}>
                  {typeInfo.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.filename || `Document ${doc.documentId}`}
                    </span>
                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: `hsl(${vis.tokenColor} / 0.1)`, color: `hsl(${vis.tokenColor})`, border: `1px solid hsl(${vis.tokenColor} / 0.2)`, fontWeight: 500 }}>
                      {vis.label}
                    </span>
                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: `hsl(${typeInfo.tokenColor} / 0.1)`, color: `hsl(${typeInfo.tokenColor})`, border: `1px solid hsl(${typeInfo.tokenColor} / 0.2)`, fontWeight: 600 }}>
                      {typeInfo.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                    {doc.language && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: doc.language.color, display: 'inline-block' }} />
                        {doc.language.name}
                      </span>
                    )}
                    {doc.starCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Star size={11} /> {doc.starCount}</span>}
                    <span>{formatSize(doc.sizeBytes || 0)}</span>
                    <span>{t('docList.updated') || 'Updated'} {timeAgo(doc.updatedAt)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: `hsl(${docStsToken} / 0.1)`, color: `hsl(${docStsToken})`, fontWeight: 500, textTransform: 'capitalize' }}>
                    {doc.docStatus}
                  </span>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: `hsl(${stsToken} / 0.1)`, color: `hsl(${stsToken})`, fontWeight: 500 }}>
                    {doc.parseStatus === 'ok' ? (t('docList.ready') || 'Ready') : doc.parseStatus === 'pending' ? (t('docList.processing') || 'Processing') : (t('docList.error') || 'Error')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sorted.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: 'hsl(var(--muted-foreground))', padding: '0 4px' }}>
          <span>{t('docList.showing') || 'Showing'} {sorted.length} {t('docList.of') || 'of'} {enrichedDocs.length} {t('docList.documents') || 'documents'}</span>
          <span>{enrichedDocs.filter(d => d.starred).length} {t('docList.starredCount') || 'starred'} · {enrichedDocs.filter(d => d.parseStatus === 'ok').length} {t('docList.readyCount') || 'ready'}</span>
        </div>
      )}
    </div>
  );
}

function detectLanguage(filename: string): { name: string; color: string } | null {
  const ext = filename?.split('.').pop()?.toLowerCase();
  const langMap: Record<string, { name: string; color: string }> = {
    docx: { name: 'Word', color: '#2b579a' }, doc: { name: 'Word', color: '#2b579a' },
    pdf: { name: 'PDF', color: '#e34f26' }, txt: { name: 'Text', color: '#10b981' },
    md: { name: 'Markdown', color: '#8b5cf6' }, json: { name: 'JSON', color: '#f59e0b' },
    csv: { name: 'CSV', color: '#22d3ee' }, xlsx: { name: 'Excel', color: '#217346' },
    pptx: { name: 'PowerPoint', color: '#d24726' }, tex: { name: 'LaTeX', color: '#008080' },
  };
  return ext ? langMap[ext] || null : null;
}

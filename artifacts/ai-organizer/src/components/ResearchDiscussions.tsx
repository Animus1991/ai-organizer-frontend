import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

// Types for Research Discussions
export type DiscussionCategory = 'general' | 'methodology' | 'results' | 'feedback' | 'announcements' | 'q&a';

export interface DiscussionReply {
  id: string;
  content: string;
  author: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  likedBy: string[];
  isAnswer?: boolean;
}

export interface Discussion {
  id: string;
  title: string;
  content: string;
  category: DiscussionCategory;
  author: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt: string;
  replies: DiscussionReply[];
  views: number;
  likes: number;
  likedBy: string[];
  isPinned: boolean;
  isLocked: boolean;
  isAnswered?: boolean;
  tags: string[];
}

const CATEGORY_CONFIG = {
  'general': { icon: '💬', label: 'General', color: 'hsl(var(--muted-foreground))' },
  'methodology': { icon: '🔬', label: 'Methodology', color: 'hsl(var(--accent-foreground))' },
  'results': { icon: '📊', label: 'Results', color: 'hsl(142 71% 45%)' },
  'feedback': { icon: '💡', label: 'Feedback', color: 'hsl(43 96% 56%)' },
  'announcements': { icon: '📢', label: 'Announcements', color: 'hsl(var(--destructive))' },
  'q&a': { icon: '❓', label: 'Q&A', color: 'hsl(var(--primary))' },
};

const STORAGE_KEY = 'research-discussions';

interface ResearchDiscussionsProps {
  onClose?: () => void;
}

export const ResearchDiscussions: React.FC<ResearchDiscussionsProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [activeCategory, setActiveCategory] = useState<DiscussionCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'unanswered'>('latest');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setDiscussions(JSON.parse(stored));
    } else {
      const now = new Date();
      setDiscussions([
        {
          id: 'disc-1',
          title: 'Welcome to Research Discussions!',
          content: `Welcome to the Research Discussions forum! This is a space for collaborative discussion about your research project.\n\n## How to use\n- **General**: Open-ended discussions about any topic\n- **Methodology**: Discuss research methods and approaches\n- **Results**: Share and discuss findings\n- **Feedback**: Request feedback on your work\n- **Announcements**: Important updates and news\n- **Q&A**: Ask questions and get answers\n\nFeel free to start a new discussion or reply to existing ones!`,
          category: 'announcements',
          author: 'System',
          createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          replies: [{ id: 'reply-1', content: 'Great to be here! Looking forward to productive discussions.', author: 'User', createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(), likes: 2, likedBy: ['Researcher'] }],
          views: 156, likes: 12, likedBy: [], isPinned: true, isLocked: false, tags: ['welcome', 'guidelines'],
        },
        {
          id: 'disc-2',
          title: 'Best practices for survey design?',
          content: `I'm designing a survey for my research project and would like some input on best practices.\n\n**Current considerations:**\n- Survey length: ~15 minutes\n- Mix of Likert scales and open-ended questions\n- Online distribution\n\nAny recommendations or resources would be appreciated!`,
          category: 'methodology',
          author: 'User',
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          replies: [{ id: 'reply-2', content: `Here are some recommendations:\n\n1. **Keep it concise** - 15 minutes is good, but aim for 10 if possible\n2. **Pilot test** - Always run a pilot with 5-10 people\n3. **Randomize question order** - Reduces order effects\n4. **Use attention checks** - Include 1-2 attention check questions\n\nFor resources, check out Dillman's "Internet, Phone, Mail, and Mixed-Mode Surveys" book.`, author: 'Researcher', createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), likes: 5, likedBy: ['User'], isAnswer: true }],
          views: 89, likes: 4, likedBy: [], isPinned: false, isLocked: false, isAnswered: true, tags: ['survey', 'methodology', 'best-practices'],
        },
        {
          id: 'disc-3',
          title: 'Preliminary findings - initial observations',
          content: `Just completed the first round of data analysis. Here are some initial observations:\n\n- Response rate: 68%\n- Strong correlation between variables A and B (r=0.72)\n- Unexpected pattern in demographic subgroup C\n\nWould love to hear thoughts on these findings and suggestions for deeper analysis.`,
          category: 'results',
          author: 'User',
          createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          replies: [], views: 34, likes: 6, likedBy: [], isPinned: false, isLocked: false, tags: ['results', 'analysis', 'correlation'],
        },
      ]);
    }
  }, []);

  useEffect(() => {
    if (discussions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(discussions));
    }
  }, [discussions]);

  const filteredDiscussions = useMemo(() => {
    let filtered = discussions;
    if (activeCategory !== 'all') filtered = filtered.filter(d => d.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(d => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q) || d.tags.some(tag => tag.toLowerCase().includes(q)));
    }
    const sorted = [...filtered].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (sortBy === 'latest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === 'popular') return (b.likes + b.replies.length) - (a.likes + a.replies.length);
      if (sortBy === 'unanswered') {
        if (!a.isAnswered && b.isAnswered) return -1;
        if (a.isAnswered && !b.isAnswered) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
    return sorted;
  }, [discussions, activeCategory, searchQuery, sortBy]);

  const stats = useMemo(() => ({
    total: discussions.length,
    unanswered: discussions.filter(d => d.category === 'q&a' && !d.isAnswered).length,
    thisWeek: discussions.filter(d => { const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); return new Date(d.createdAt) > weekAgo; }).length,
  }), [discussions]);

  const createDiscussion = useCallback((data: { title: string; content: string; category: DiscussionCategory; tags: string[] }) => {
    const newDiscussion: Discussion = { id: `disc-${Date.now()}`, ...data, author: 'User', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), replies: [], views: 0, likes: 0, likedBy: [], isPinned: false, isLocked: false, isAnswered: false };
    setDiscussions(prev => [newDiscussion, ...prev]);
    setSelectedDiscussion(newDiscussion);
    setShowCreateModal(false);
  }, []);

  const addReply = useCallback((discussionId: string, content: string) => {
    if (!content.trim()) return;
    const newReply: DiscussionReply = { id: `reply-${Date.now()}`, content, author: 'User', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), likes: 0, likedBy: [] };
    setDiscussions(prev => prev.map(d => d.id === discussionId ? { ...d, replies: [...d.replies, newReply], updatedAt: new Date().toISOString() } : d));
    setReplyContent('');
  }, []);

  const likeDiscussion = useCallback((id: string) => {
    setDiscussions(prev => prev.map(d => {
      if (d.id !== id) return d;
      const liked = d.likedBy.includes('User');
      return { ...d, likes: liked ? d.likes - 1 : d.likes + 1, likedBy: liked ? d.likedBy.filter(u => u !== 'User') : [...d.likedBy, 'User'] };
    }));
  }, []);

  const likeReply = useCallback((discussionId: string, replyId: string) => {
    setDiscussions(prev => prev.map(d => {
      if (d.id !== discussionId) return d;
      return { ...d, replies: d.replies.map(r => {
        if (r.id !== replyId) return r;
        const liked = r.likedBy.includes('User');
        return { ...r, likes: liked ? r.likes - 1 : r.likes + 1, likedBy: liked ? r.likedBy.filter(u => u !== 'User') : [...r.likedBy, 'User'] };
      }) };
    }));
  }, []);

  const markAsAnswer = useCallback((discussionId: string, replyId: string) => {
    setDiscussions(prev => prev.map(d => {
      if (d.id !== discussionId) return d;
      return { ...d, isAnswered: true, replies: d.replies.map(r => ({ ...r, isAnswer: r.id === replyId })) };
    }));
  }, []);

  const viewDiscussion = useCallback((discussion: Discussion) => {
    setDiscussions(prev => prev.map(d => d.id === discussion.id ? { ...d, views: d.views + 1 } : d));
    setSelectedDiscussion(discussion);
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div style={{
      background: 'hsl(var(--background))',
      borderRadius: '10px',
      border: '1px solid hsl(var(--border))',
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '12px 14px' : '16px 20px',
        background: 'hsl(var(--muted) / 0.5)',
        borderBottom: '1px solid hsl(var(--border))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>💬</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
              {t('discussions.title') || 'Research Discussions'}
            </h2>
            <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
              {stats.total} discussions • {stats.thisWeek} this week
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '7px 14px',
            background: 'hsl(var(--primary))',
            border: 'none',
            borderRadius: '10px',
            color: 'hsl(var(--primary-foreground))',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          ➕ New Discussion
        </button>
      </div>

      {/* Toolbar */}
      <div style={{
        padding: isMobile ? '10px 14px' : '12px 20px',
        background: 'hsl(var(--muted) / 0.3)',
        borderBottom: '1px solid hsl(var(--border))',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '10px',
          flex: '1 1 180px',
          maxWidth: isMobile ? '100%' : '280px',
        }}>
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussions..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'hsl(var(--foreground))',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveCategory('all')}
              style={{
                padding: '5px 10px',
                background: activeCategory === 'all' ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                border: activeCategory === 'all' ? '1px solid hsl(var(--primary) / 0.3)' : '1px solid transparent',
                borderRadius: '10px',
                color: activeCategory === 'all' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              All
            </button>
            {(Object.entries(CATEGORY_CONFIG) as [DiscussionCategory, typeof CATEGORY_CONFIG[DiscussionCategory]][]).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                style={{
                  padding: '5px 10px',
                  background: activeCategory === key ? 'hsl(var(--accent))' : 'transparent',
                  border: activeCategory === key ? '1px solid hsl(var(--border))' : '1px solid transparent',
                  borderRadius: '10px',
                  color: activeCategory === key ? 'hsl(var(--accent-foreground))' : 'hsl(var(--muted-foreground))',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {config.icon} {config.label}
              </button>
            ))}
          </div>
        )}

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{
            padding: '6px 10px',
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '10px',
            color: 'hsl(var(--foreground))',
            fontSize: '12px',
            cursor: 'pointer',
            marginLeft: isMobile ? '0' : 'auto',
          }}
        >
          <option value="latest">Latest</option>
          <option value="popular">Most Popular</option>
          <option value="unanswered">Unanswered</option>
        </select>
      </div>

      {/* Mobile Category Tabs */}
      {isMobile && (
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '8px 14px',
          overflowX: 'auto',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--muted) / 0.2)',
        }}>
          <button onClick={() => setActiveCategory('all')} style={{ padding: '4px 10px', background: activeCategory === 'all' ? 'hsl(var(--primary) / 0.15)' : 'transparent', border: '1px solid transparent', borderRadius: '10px', color: activeCategory === 'all' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>All</button>
          {(Object.entries(CATEGORY_CONFIG) as [DiscussionCategory, typeof CATEGORY_CONFIG[DiscussionCategory]][]).map(([key, config]) => (
            <button key={key} onClick={() => setActiveCategory(key)} style={{ padding: '4px 10px', background: activeCategory === key ? 'hsl(var(--accent))' : 'transparent', border: '1px solid transparent', borderRadius: '10px', color: activeCategory === key ? 'hsl(var(--accent-foreground))' : 'hsl(var(--muted-foreground))', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '3px' }}>{config.icon} {config.label}</button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: isMobile && selectedDiscussion ? 'column' : 'row' }}>
        {/* Discussion List */}
        {(!isMobile || !selectedDiscussion) && (
          <div style={{
            width: !isMobile && selectedDiscussion ? '360px' : '100%',
            borderRight: !isMobile && selectedDiscussion ? '1px solid hsl(var(--border))' : 'none',
            overflow: 'auto',
          }}>
            {filteredDiscussions.map(discussion => {
              const categoryConfig = CATEGORY_CONFIG[discussion.category];
              const isSelected = selectedDiscussion?.id === discussion.id;
              return (
                <button
                  key={discussion.id}
                  onClick={() => viewDiscussion(discussion)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '12px 14px' : '14px 20px',
                    background: isSelected ? 'hsl(var(--accent))' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid hsl(var(--border))',
                    borderLeft: isSelected ? '3px solid hsl(var(--primary))' : '3px solid transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      background: `hsl(${discussion.author.charCodeAt(0) * 50 % 360}, 60%, 50%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '13px', fontWeight: 600, flexShrink: 0,
                    }}>
                      {discussion.author.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                        {discussion.isPinned && <span title="Pinned">📌</span>}
                        {discussion.isLocked && <span title="Locked">🔒</span>}
                        {discussion.isAnswered && <span title="Answered">✅</span>}
                        <span style={{ padding: '2px 8px', background: 'hsl(var(--accent))', borderRadius: '10px', fontSize: '10px', color: 'hsl(var(--accent-foreground))' }}>
                          {categoryConfig.icon} {categoryConfig.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {discussion.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {discussion.content.substring(0, 80)}...
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: 'hsl(var(--muted-foreground))', flexWrap: 'wrap' }}>
                        <span>{discussion.author}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(discussion.updatedAt)}</span>
                        <span>•</span>
                        <span>💬 {discussion.replies.length}</span>
                        <span>👁️ {discussion.views}</span>
                        <span>❤️ {discussion.likes}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredDiscussions.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
                <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px', color: 'hsl(var(--foreground))' }}>No discussions found</div>
                <div style={{ fontSize: '13px' }}>Start a new discussion to get the conversation going!</div>
              </div>
            )}
          </div>
        )}

        {/* Discussion Detail */}
        {selectedDiscussion && (
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* Back button on mobile */}
            {isMobile && (
              <button onClick={() => setSelectedDiscussion(null)} style={{ padding: '10px 14px', background: 'hsl(var(--muted) / 0.3)', border: 'none', borderBottom: '1px solid hsl(var(--border))', color: 'hsl(var(--primary))', fontSize: '13px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ← Back to list
              </button>
            )}
            <div style={{ padding: isMobile ? '14px' : '20px', borderBottom: '1px solid hsl(var(--border))' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 10px', background: 'hsl(var(--accent))', borderRadius: '10px', fontSize: '11px', color: 'hsl(var(--accent-foreground))' }}>
                      {CATEGORY_CONFIG[selectedDiscussion.category].icon} {CATEGORY_CONFIG[selectedDiscussion.category].label}
                    </span>
                    {selectedDiscussion.isAnswered && <span style={{ color: 'hsl(142 71% 45%)', fontSize: '12px' }}>✅ Answered</span>}
                  </div>
                  <h2 style={{ margin: 0, fontSize: isMobile ? '17px' : '19px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                    {selectedDiscussion.title}
                  </h2>
                </div>
                {!isMobile && (
                  <button onClick={() => setSelectedDiscussion(null)} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid hsl(var(--border))', borderRadius: '10px', color: 'hsl(var(--muted-foreground))', cursor: 'pointer' }}>✕</button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `hsl(${selectedDiscussion.author.charCodeAt(0) * 50 % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                  {selectedDiscussion.author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{selectedDiscussion.author}</div>
                  <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>Posted {formatTimeAgo(selectedDiscussion.createdAt)}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: isMobile ? '14px' : '20px', borderBottom: '1px solid hsl(var(--border))' }}>
              <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'hsl(var(--foreground))', whiteSpace: 'pre-wrap' }}>
                {selectedDiscussion.content}
              </div>
              {selectedDiscussion.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '14px', flexWrap: 'wrap' }}>
                  {selectedDiscussion.tags.map(tag => (
                    <span key={tag} style={{ padding: '3px 10px', background: 'hsl(var(--muted))', borderRadius: '10px', fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>#{tag}</span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
                <button onClick={() => likeDiscussion(selectedDiscussion.id)} style={{ padding: '5px 10px', background: selectedDiscussion.likedBy.includes('User') ? 'hsl(var(--primary) / 0.15)' : 'transparent', border: '1px solid hsl(var(--border))', borderRadius: '10px', color: selectedDiscussion.likedBy.includes('User') ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ❤️ {selectedDiscussion.likes}
                </button>
                <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>👁️ {selectedDiscussion.views} views</span>
              </div>
            </div>

            {/* Replies */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                  Replies ({selectedDiscussion.replies.length})
                </h3>
              </div>
              {selectedDiscussion.replies.map(reply => (
                <div key={reply.id} style={{ padding: isMobile ? '12px 14px' : '14px 20px', borderBottom: '1px solid hsl(var(--border))', background: reply.isAnswer ? 'hsl(142 71% 45% / 0.08)' : 'transparent', borderLeft: reply.isAnswer ? '3px solid hsl(142 71% 45%)' : '3px solid transparent' }}>
                  {reply.isAnswer && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', background: 'hsl(142 71% 45% / 0.15)', borderRadius: '10px', fontSize: '11px', color: 'hsl(142 71% 45%)', fontWeight: 600, marginBottom: '10px' }}>✅ Accepted Answer</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: `hsl(${reply.author.charCodeAt(0) * 50 % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>
                      {reply.author.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{reply.author}</span>
                        <span style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))' }}>{formatTimeAgo(reply.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'hsl(var(--foreground))', whiteSpace: 'pre-wrap' }}>{reply.content}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                        <button onClick={() => likeReply(selectedDiscussion.id, reply.id)} style={{ padding: '3px 8px', background: reply.likedBy.includes('User') ? 'hsl(var(--primary) / 0.15)' : 'transparent', border: '1px solid hsl(var(--border))', borderRadius: '10px', color: reply.likedBy.includes('User') ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', cursor: 'pointer', fontSize: '11px' }}>❤️ {reply.likes}</button>
                        {selectedDiscussion.category === 'q&a' && !selectedDiscussion.isAnswered && selectedDiscussion.author === 'User' && (
                          <button onClick={() => markAsAnswer(selectedDiscussion.id, reply.id)} style={{ padding: '3px 8px', background: 'transparent', border: '1px solid hsl(142 71% 45% / 0.4)', borderRadius: '10px', color: 'hsl(142 71% 45%)', cursor: 'pointer', fontSize: '11px' }}>✅ Mark as Answer</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {selectedDiscussion.replies.length === 0 && (
                <div style={{ padding: '28px', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '13px' }}>No replies yet. Be the first to respond!</div>
              )}
            </div>

            {/* Reply Input */}
            {!selectedDiscussion.isLocked && (
              <div style={{ padding: isMobile ? '12px 14px' : '14px 20px', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--muted) / 0.3)' }}>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '10px', color: 'hsl(var(--foreground))', fontSize: '13px', resize: 'none', marginBottom: '10px', outline: 'none' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => addReply(selectedDiscussion.id, replyContent)}
                    disabled={!replyContent.trim()}
                    style={{ padding: '8px 18px', background: replyContent.trim() ? 'hsl(var(--primary))' : 'hsl(var(--muted))', border: 'none', borderRadius: '10px', color: replyContent.trim() ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))', fontSize: '12px', fontWeight: 500, cursor: replyContent.trim() ? 'pointer' : 'not-allowed' }}
                  >
                    Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateDiscussionModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createDiscussion}
          isMobile={isMobile}
        />
      )}
    </div>
  );
};

// Create Discussion Modal
interface CreateDiscussionModalProps {
  onClose: () => void;
  onCreate: (data: { title: string; content: string; category: DiscussionCategory; tags: string[] }) => void;
  isMobile: boolean;
}

const CreateDiscussionModal: React.FC<CreateDiscussionModalProps> = ({ onClose, onCreate, isMobile }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<DiscussionCategory>('general');
  const [tagsInput, setTagsInput] = useState('');

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return;
    const tags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
    onCreate({ title: title.trim(), content: content.trim(), category, tags });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? '12px' : '20px' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: isMobile ? '100%' : '520px', maxHeight: '80vh', background: 'hsl(var(--background))', borderRadius: '10px', border: '1px solid hsl(var(--border))', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>New Discussion</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--muted-foreground))', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '14px' : '18px' }}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '5px' }}>Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's your discussion about?" style={{ width: '100%', padding: '9px 12px', background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border))', borderRadius: '10px', color: 'hsl(var(--foreground))', fontSize: '13px', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '5px' }}>Category</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(Object.entries(CATEGORY_CONFIG) as [DiscussionCategory, typeof CATEGORY_CONFIG[DiscussionCategory]][]).map(([key, config]) => (
                <button key={key} onClick={() => setCategory(key)} style={{ padding: '6px 12px', background: category === key ? 'hsl(var(--accent))' : 'transparent', border: category === key ? '1px solid hsl(var(--border))' : '1px solid hsl(var(--border))', borderRadius: '10px', color: category === key ? 'hsl(var(--accent-foreground))' : 'hsl(var(--muted-foreground))', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {config.icon} {config.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '5px' }}>Content *</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share your thoughts, questions, or ideas..." rows={5} style={{ width: '100%', padding: '9px 12px', background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border))', borderRadius: '10px', color: 'hsl(var(--foreground))', fontSize: '13px', resize: 'vertical', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '5px' }}>Tags (comma-separated)</label>
            <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g., methodology, survey, data" style={{ width: '100%', padding: '9px 12px', background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border))', borderRadius: '10px', color: 'hsl(var(--foreground))', fontSize: '13px', outline: 'none' }} />
          </div>
        </div>

        <div style={{ padding: '14px 18px', borderTop: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid hsl(var(--border))', borderRadius: '10px', color: 'hsl(var(--muted-foreground))', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
          <button onClick={handleCreate} disabled={!title.trim() || !content.trim()} style={{ padding: '8px 18px', background: title.trim() && content.trim() ? 'hsl(var(--primary))' : 'hsl(var(--muted))', border: 'none', borderRadius: '10px', color: title.trim() && content.trim() ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))', fontWeight: 500, cursor: title.trim() && content.trim() ? 'pointer' : 'not-allowed', fontSize: '12px' }}>Post Discussion</button>
        </div>
      </div>
    </div>
  );
};

export default ResearchDiscussions;

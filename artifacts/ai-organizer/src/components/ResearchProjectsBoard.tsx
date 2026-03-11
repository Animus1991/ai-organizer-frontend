import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

// Types for Kanban Projects Board
export type CardPriority = 'low' | 'medium' | 'high' | 'critical';
export type CardType = 'task' | 'bug' | 'feature' | 'research' | 'review' | 'documentation';

export interface ProjectCard {
  id: string;
  title: string;
  description: string;
  type: CardType;
  priority: CardPriority;
  assignees: string[];
  labels: string[];
  dueDate?: string;
  estimatedHours?: number;
  linkedDocuments?: string[];
  comments: number;
  attachments: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectColumn {
  id: string;
  title: string;
  cards: ProjectCard[];
  limit?: number;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  columns: ProjectColumn[];
  members: string[];
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_COLUMNS: ProjectColumn[] = [
  { id: 'backlog', title: 'Backlog', cards: [], color: '#8b949e' },
  { id: 'todo', title: 'To Do', cards: [], limit: 10, color: '#58a6ff' },
  { id: 'in-progress', title: 'In Progress', cards: [], limit: 5, color: '#d29922' },
  { id: 'review', title: 'In Review', cards: [], limit: 3, color: '#a371f7' },
  { id: 'done', title: 'Done', cards: [], color: '#3fb950' },
];

const CARD_TYPE_CONFIG = {
  task: { icon: '✅', color: '#58a6ff', label: 'Task' },
  bug: { icon: '🐛', color: '#f85149', label: 'Bug' },
  feature: { icon: '✨', color: '#a371f7', label: 'Feature' },
  research: { icon: '🔬', color: '#3fb950', label: 'Research' },
  review: { icon: '👁️', color: '#d29922', label: 'Review' },
  documentation: { icon: '📝', color: '#8b949e', label: 'Documentation' },
};

const PRIORITY_CONFIG = {
  low: { color: '#8b949e', label: 'Low' },
  medium: { color: '#d29922', label: 'Medium' },
  high: { color: '#f85149', label: 'High' },
  critical: { color: '#ff7b72', label: 'Critical' },
};

const STORAGE_KEY = 'research-projects-board';

interface ResearchProjectsBoardProps {
  onClose?: () => void;
}

export const ResearchProjectsBoard: React.FC<ResearchProjectsBoardProps> = ({ onClose }) => {
  const { t: _t } = useLanguage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [draggedCard, setDraggedCard] = useState<{ card: ProjectCard; columnId: string } | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<ProjectCard | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<CardType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<CardPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const loadedProjects = JSON.parse(stored);
      setProjects(loadedProjects);
      if (loadedProjects.length > 0) {
        setActiveProject(loadedProjects[0]);
      }
    } else {
      const defaultProject: Project = {
        id: 'proj-1',
        name: 'Research Project',
        description: 'Main research project board',
        columns: DEFAULT_COLUMNS.map(col => ({
          ...col,
          cards: col.id === 'todo' ? [
            { id: 'card-1', title: 'Literature Review', description: 'Review existing literature on the topic', type: 'research' as CardType, priority: 'high' as CardPriority, assignees: ['User'], labels: ['literature', 'phase-1'], dueDate: new Date(Date.now() + 7 * 86400000).toISOString(), estimatedHours: 20, comments: 2, attachments: 5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: 'card-2', title: 'Data Collection Setup', description: 'Set up data collection infrastructure', type: 'task' as CardType, priority: 'medium' as CardPriority, assignees: ['User'], labels: ['infrastructure'], estimatedHours: 8, comments: 0, attachments: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ] : col.id === 'in-progress' ? [
            { id: 'card-3', title: 'Methodology Documentation', description: 'Document the research methodology', type: 'documentation' as CardType, priority: 'medium' as CardPriority, assignees: ['User'], labels: ['documentation', 'methodology'], estimatedHours: 12, comments: 4, attachments: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ] : [],
        })),
        members: ['User'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProjects([defaultProject]);
      setActiveProject(defaultProject);
    }
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects]);

  const getFilteredCards = useCallback((cards: ProjectCard[]) => {
    return cards.filter(card => {
      if (filterType !== 'all' && card.type !== filterType) return false;
      if (filterPriority !== 'all' && card.priority !== filterPriority) return false;
      if (searchQuery && !card.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !card.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [filterType, filterPriority, searchQuery]);

  const handleDragStart = (card: ProjectCard, columnId: string) => {
    setDraggedCard({ card, columnId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetColumnId: string) => {
    if (!draggedCard || !activeProject) return;
    if (draggedCard.columnId === targetColumnId) { setDraggedCard(null); return; }

    const updatedProject = { ...activeProject };
    const sourceColumn = updatedProject.columns.find(c => c.id === draggedCard.columnId);
    const targetColumn = updatedProject.columns.find(c => c.id === targetColumnId);
    if (!sourceColumn || !targetColumn) return;
    if (targetColumn.limit && targetColumn.cards.length >= targetColumn.limit) { setDraggedCard(null); return; }

    sourceColumn.cards = sourceColumn.cards.filter(c => c.id !== draggedCard.card.id);
    targetColumn.cards.push({ ...draggedCard.card, updatedAt: new Date().toISOString() });
    updatedProject.updatedAt = new Date().toISOString();
    setActiveProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setDraggedCard(null);
  };

  const addCard = useCallback((columnId: string, card: Omit<ProjectCard, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'attachments'>) => {
    if (!activeProject) return;
    const newCard: ProjectCard = { ...card, id: `card-${Date.now()}`, comments: 0, attachments: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const updatedProject = { ...activeProject };
    const column = updatedProject.columns.find(c => c.id === columnId);
    if (column) {
      column.cards.push(newCard);
      updatedProject.updatedAt = new Date().toISOString();
      setActiveProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    }
  }, [activeProject]);

  const updateCard = useCallback((columnId: string, cardId: string, updates: Partial<ProjectCard>) => {
    if (!activeProject) return;
    const updatedProject = { ...activeProject };
    const column = updatedProject.columns.find(c => c.id === columnId);
    if (column) {
      column.cards = column.cards.map(c => c.id === cardId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c);
      updatedProject.updatedAt = new Date().toISOString();
      setActiveProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    }
  }, [activeProject]);

  const deleteCard = useCallback((columnId: string, cardId: string) => {
    if (!activeProject) return;
    const updatedProject = { ...activeProject };
    const column = updatedProject.columns.find(c => c.id === columnId);
    if (column) {
      column.cards = column.cards.filter(c => c.id !== cardId);
      updatedProject.updatedAt = new Date().toISOString();
      setActiveProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    }
  }, [activeProject]);

  const stats = useMemo(() => {
    if (!activeProject) return { total: 0, byType: {}, byPriority: {}, byColumn: {} };
    const allCards = activeProject.columns.flatMap(c => c.cards);
    return {
      total: allCards.length,
      byType: allCards.reduce((acc, c) => ({ ...acc, [c.type]: (acc[c.type] || 0) + 1 }), {} as Record<string, number>),
      byPriority: allCards.reduce((acc, c) => ({ ...acc, [c.priority]: (acc[c.priority] || 0) + 1 }), {} as Record<string, number>),
      byColumn: activeProject.columns.reduce((acc, c) => ({ ...acc, [c.id]: c.cards.length }), {} as Record<string, number>),
    };
  }, [activeProject]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / 86400000);
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    if (days <= 7) return `Due in ${days}d`;
    return date.toLocaleDateString();
  };

  if (!activeProject) {
    return <div style={{ padding: '48px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>Loading...</div>;
  }

  return (
    <div style={{
      background: 'hsl(var(--card))',
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
        background: 'hsl(var(--muted) / 0.2)',
        borderBottom: '1px solid hsl(var(--border))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>📋</span>
          <div>
            <h2 style={{ margin: 0, fontSize: isMobile ? '14px' : '16px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
              {activeProject.name}
            </h2>
            <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
              {stats.total} cards • {activeProject.members.length} members
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {!isMobile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px', background: 'hsl(var(--muted) / 0.3)',
              border: '1px solid hsl(var(--border))', borderRadius: '10px',
            }}>
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>🔍</span>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards..." style={{
                  background: 'transparent', border: 'none', color: 'hsl(var(--foreground))',
                  fontSize: '13px', width: '150px', outline: 'none',
                }}
              />
            </div>
          )}

          <select value={filterType} onChange={(e) => setFilterType(e.target.value as CardType | 'all')}
            style={{
              padding: '6px 12px', background: 'hsl(var(--muted) / 0.3)',
              border: '1px solid hsl(var(--border))', borderRadius: '10px',
              color: 'hsl(var(--foreground))', fontSize: '12px', cursor: 'pointer',
            }}>
            <option value="all">All Types</option>
            {Object.entries(CARD_TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.icon} {config.label}</option>
            ))}
          </select>

          {!isMobile && (
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as CardPriority | 'all')}
              style={{
                padding: '6px 12px', background: 'hsl(var(--muted) / 0.3)',
                border: '1px solid hsl(var(--border))', borderRadius: '10px',
                color: 'hsl(var(--foreground))', fontSize: '12px', cursor: 'pointer',
              }}>
              <option value="all">All Priorities</option>
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          )}

          {onClose && (
            <button onClick={onClose} style={{
              padding: '6px 12px', background: 'transparent',
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
            placeholder="Search cards..." style={{
              width: '100%', padding: '8px 12px', background: 'hsl(var(--muted) / 0.2)',
              border: '1px solid hsl(var(--border))', borderRadius: '10px',
              color: 'hsl(var(--foreground))', fontSize: '13px', outline: 'none',
            }}
          />
        </div>
      )}

      {/* Board */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '12px' : '16px',
        padding: isMobile ? '12px' : '16px',
        overflowX: isMobile ? 'visible' : 'auto',
        overflowY: isMobile ? 'auto' : 'hidden',
      }}>
        {activeProject.columns.map(column => {
          const filteredCards = getFilteredCards(column.cards);
          const isOverLimit = column.limit && column.cards.length >= column.limit;
          
          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
              style={{
                minWidth: isMobile ? 'auto' : '280px',
                width: isMobile ? '100%' : '280px',
                background: 'hsl(var(--muted) / 0.15)',
                borderRadius: '10px',
                border: '1px solid hsl(var(--border))',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: isMobile ? 'none' : '100%',
              }}
            >
              {/* Column Header */}
              <div style={{
                padding: '12px 14px',
                borderBottom: '1px solid hsl(var(--border))',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: column.color }} />
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'hsl(var(--foreground))' }}>{column.title}</span>
                  <span style={{
                    padding: '2px 8px', background: 'hsl(var(--muted) / 0.4)',
                    borderRadius: '10px', fontSize: '12px', color: 'hsl(var(--muted-foreground))',
                  }}>
                    {filteredCards.length}{column.limit && `/${column.limit}`}
                  </span>
                </div>
                <button
                  onClick={() => { setEditingCard(null); setEditingColumnId(column.id); setShowCardModal(true); }}
                  style={{
                    width: '24px', height: '24px', background: 'transparent', border: 'none',
                    color: 'hsl(var(--muted-foreground))', cursor: 'pointer', borderRadius: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >+</button>
              </div>

              {isOverLimit && (
                <div style={{
                  padding: '8px 14px', background: `${PRIORITY_CONFIG.high.color}20`,
                  borderBottom: '1px solid hsl(var(--border))', fontSize: '11px',
                  color: PRIORITY_CONFIG.high.color, textAlign: 'center',
                }}>⚠️ WIP limit reached</div>
              )}

              {/* Cards */}
              <div style={{
                flex: 1, overflow: 'auto', padding: '10px',
                display: 'flex', flexDirection: 'column', gap: '8px',
              }}>
                {filteredCards.map(card => {
                  const typeConfig = CARD_TYPE_CONFIG[card.type];
                  const priorityConfig = PRIORITY_CONFIG[card.priority];
                  
                  return (
                    <div
                      key={card.id} draggable
                      onDragStart={() => handleDragStart(card, column.id)}
                      onClick={() => { setEditingCard(card); setEditingColumnId(column.id); setShowCardModal(true); }}
                      style={{
                        padding: '12px', background: 'hsl(var(--card))',
                        borderRadius: '10px', border: '1px solid hsl(var(--border))',
                        cursor: 'grab', transition: 'all 0.15s ease',
                      }}
                    >
                      {card.labels.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          {card.labels.slice(0, 3).map(label => (
                            <span key={label} style={{
                              padding: '2px 8px', background: 'hsl(var(--primary) / 0.12)',
                              borderRadius: '10px', fontSize: '10px', color: 'hsl(var(--primary))',
                            }}>{label}</span>
                          ))}
                        </div>
                      )}

                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: '8px', lineHeight: 1.4 }}>
                        {card.title}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '2px 6px', background: `${typeConfig.color}20`,
                          borderRadius: '10px', fontSize: '10px', color: typeConfig.color,
                        }}>{typeConfig.icon} {typeConfig.label}</span>
                        <span style={{
                          padding: '2px 6px', background: `${priorityConfig.color}20`,
                          borderRadius: '10px', fontSize: '10px', color: priorityConfig.color,
                        }}>{priorityConfig.label}</span>
                        {card.dueDate && (
                          <span style={{
                            fontSize: '10px',
                            color: new Date(card.dueDate) < new Date() ? PRIORITY_CONFIG.high.color : 'hsl(var(--muted-foreground))',
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}>📅 {formatDate(card.dueDate)}</span>
                        )}
                      </div>

                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginTop: '10px', paddingTop: '10px', borderTop: '1px solid hsl(var(--border))',
                      }}>
                        <div style={{ display: 'flex', gap: '-4px' }}>
                          {card.assignees.slice(0, 3).map((assignee, i) => (
                            <div key={assignee} style={{
                              width: '24px', height: '24px', borderRadius: '50%',
                              background: `hsl(${(assignee.charCodeAt(0) * 50) % 360}, 60%, 50%)`,
                              border: '2px solid hsl(var(--card))', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              fontSize: '10px', color: '#fff', fontWeight: 600,
                              marginLeft: i > 0 ? '-6px' : 0,
                            }} title={assignee}>{assignee.charAt(0).toUpperCase()}</div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
                          {card.comments > 0 && <span>💬 {card.comments}</span>}
                          {card.attachments > 0 && <span>📎 {card.attachments}</span>}
                          {card.estimatedHours && <span>⏱️ {card.estimatedHours}h</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredCards.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '12px' }}>
                    No cards
                  </div>
                )}
              </div>

              <div style={{ padding: '10px' }}>
                <button
                  onClick={() => { setEditingCard(null); setEditingColumnId(column.id); setShowCardModal(true); }}
                  style={{
                    width: '100%', padding: '10px', background: 'transparent',
                    border: '1px dashed hsl(var(--border))', borderRadius: '10px',
                    color: 'hsl(var(--muted-foreground))', fontSize: '12px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '6px',
                  }}
                >+ Add card</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Card Modal */}
      {showCardModal && editingColumnId && (
        <CardModal
          card={editingCard}
          isMobile={isMobile}
          onClose={() => { setShowCardModal(false); setEditingCard(null); setEditingColumnId(null); }}
          onSave={(cardData) => {
            if (editingCard) { updateCard(editingColumnId, editingCard.id, cardData); }
            else { addCard(editingColumnId, cardData as any); }
            setShowCardModal(false); setEditingCard(null); setEditingColumnId(null);
          }}
          onDelete={editingCard ? () => {
            deleteCard(editingColumnId, editingCard.id);
            setShowCardModal(false); setEditingCard(null); setEditingColumnId(null);
          } : undefined}
        />
      )}
    </div>
  );
};

// Card Modal Component
interface CardModalProps {
  card: ProjectCard | null;
  isMobile: boolean;
  onClose: () => void;
  onSave: (card: Partial<ProjectCard>) => void;
  onDelete?: () => void;
}

const CardModal: React.FC<CardModalProps> = ({ card, isMobile, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState(card?.title || '');
  const [description, setDescription] = useState(card?.description || '');
  const [type, setType] = useState<CardType>(card?.type || 'task');
  const [priority, setPriority] = useState<CardPriority>(card?.priority || 'medium');
  const [labels, setLabels] = useState<string[]>(card?.labels || []);
  const [dueDate, setDueDate] = useState(card?.dueDate ? card.dueDate.split('T')[0] : '');
  const [estimatedHours, setEstimatedHours] = useState(card?.estimatedHours?.toString() || '');
  const [newLabel, setNewLabel] = useState('');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(), description: description.trim(), type, priority, labels,
      assignees: card?.assignees || ['User'],
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      estimatedHours: estimatedHours ? parseInt(estimatedHours) : undefined,
    });
  };

  const addLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels([...labels, newLabel.trim()]); setNewLabel('');
    }
  };

  const removeLabel = (label: string) => { setLabels(labels.filter(l => l !== label)); };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
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
        width: 'min(520px, 100%)', maxHeight: '85vh',
        background: 'hsl(var(--card))', borderRadius: '16px',
        border: '1px solid hsl(var(--border))', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            {card ? 'Edit Card' : 'New Card'}
          </h3>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none',
            color: 'hsl(var(--muted-foreground))', cursor: 'pointer', fontSize: '18px',
          }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '16px' : '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '6px' }}>Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter card title..." style={inputStyle} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '6px' }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a description..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '6px' }}>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as CardType)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {Object.entries(CARD_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.icon} {config.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '6px' }}>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as CardPriority)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '6px' }}>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '6px' }}>Estimated Hours</label>
              <input type="number" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} placeholder="e.g., 8" min="0" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '6px' }}>Labels</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {labels.map(label => (
                <span key={label} style={{
                  padding: '4px 10px', background: 'hsl(var(--primary) / 0.12)',
                  borderRadius: '10px', fontSize: '12px', color: 'hsl(var(--primary))',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  {label}
                  <button onClick={() => removeLabel(label)} style={{
                    background: 'transparent', border: 'none',
                    color: 'hsl(var(--primary))', cursor: 'pointer', padding: 0, fontSize: '14px',
                  }}>×</button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addLabel()}
                placeholder="Add label..." style={{ ...inputStyle, flex: 1 }} />
              <button onClick={addLabel} style={{
                padding: '8px 16px', background: 'hsl(var(--primary))',
                border: 'none', borderRadius: '10px', color: 'hsl(var(--primary-foreground))',
                fontSize: '12px', cursor: 'pointer',
              }}>Add</button>
            </div>
          </div>
        </div>

        <div style={{
          padding: '16px 20px', borderTop: '1px solid hsl(var(--border))',
          display: 'flex', justifyContent: 'space-between',
        }}>
          {onDelete && (
            <button onClick={onDelete} style={{
              padding: '10px 16px', background: 'transparent',
              border: '1px solid hsl(var(--destructive))', borderRadius: '10px',
              color: 'hsl(var(--destructive))', fontSize: '13px', cursor: 'pointer',
            }}>🗑️ Delete</button>
          )}
          <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
            <button onClick={onClose} style={{
              padding: '10px 16px', background: 'hsl(var(--muted) / 0.3)',
              border: '1px solid hsl(var(--border))', borderRadius: '10px',
              color: 'hsl(var(--muted-foreground))', fontSize: '13px', cursor: 'pointer',
            }}>Cancel</button>
            <button onClick={handleSave} disabled={!title.trim()} style={{
              padding: '10px 20px',
              background: title.trim() ? 'hsl(var(--success))' : 'hsl(var(--muted) / 0.3)',
              border: 'none', borderRadius: '10px',
              color: title.trim() ? 'hsl(var(--success-foreground))' : 'hsl(var(--muted-foreground))',
              fontSize: '13px', fontWeight: 600,
              cursor: title.trim() ? 'pointer' : 'not-allowed',
            }}>{card ? 'Save Changes' : 'Create Card'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchProjectsBoard;

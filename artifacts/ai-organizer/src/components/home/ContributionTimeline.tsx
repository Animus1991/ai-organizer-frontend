/**
 * ContributionTimeline - GitHub-style contribution activity timeline
 * Fully themed with HSL tokens from index.css
 */
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Upload, Pencil, Eye, MessageSquare, Brain, Pin, FlaskConical, Handshake, Trophy, ChevronDown } from 'lucide-react';

type ActivityType = 'upload' | 'edit' | 'review' | 'comment' | 'theory' | 'claim' | 'evidence' | 'collaboration' | 'milestone';

interface TimelineEntry {
  id: string; type: ActivityType; title: string; description: string;
  timestamp: string; project?: string; hash?: string;
  additions?: number; deletions?: number;
}

interface MonthGroup {
  key: string; label: string; year: number; month: number;
  entries: TimelineEntry[]; totalContributions: number;
}

const TYPE_CONFIG: Record<ActivityType, { icon: React.ReactNode; tokenColor: string; verb: string }> = {
  upload:        { icon: <Upload size={11} />,        tokenColor: 'var(--info)',        verb: 'uploaded' },
  edit:          { icon: <Pencil size={11} />,        tokenColor: 'var(--warning)',      verb: 'edited' },
  review:        { icon: <Eye size={11} />,           tokenColor: 'var(--primary)',      verb: 'reviewed' },
  comment:       { icon: <MessageSquare size={11} />, tokenColor: 'var(--success)',      verb: 'commented on' },
  theory:        { icon: <Brain size={11} />,         tokenColor: 'var(--destructive)',  verb: 'created theory' },
  claim:         { icon: <Pin size={11} />,           tokenColor: 'var(--primary)',      verb: 'added claim to' },
  evidence:      { icon: <FlaskConical size={11} />,  tokenColor: 'var(--success)',      verb: 'added evidence to' },
  collaboration: { icon: <Handshake size={11} />,     tokenColor: 'var(--warning)',      verb: 'collaborated on' },
  milestone:     { icon: <Trophy size={11} />,        tokenColor: 'var(--warning)',      verb: 'reached milestone in' },
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function generateSampleTimeline(): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const now = new Date();
  const types: ActivityType[] = ['upload','edit','review','comment','theory','claim','evidence','collaboration','milestone'];
  const projects = ['Quantum Coherence Study','Neural Network Interpretability','Climate Model Validation','Protein Folding Dynamics','Epistemological Foundations','Social Network Analysis'];
  const titles = ['Updated methodology section','Added new experimental data','Revised literature review','Created falsification criteria','Linked supporting evidence','Peer review feedback','Theory validation complete','New claim added','Evidence chain updated','Collaboration request accepted','Milestone: 100 citations','Draft submitted for review','Added statistical analysis','Updated abstract','New figure added','Cross-reference validated','Hypothesis refined','Data visualization updated'];
  let seed = 42;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let d = 0; d < 120; d++) {
    const count = Math.floor(rand() * 3);
    for (let c = 0; c < count; c++) {
      const date = new Date(now.getTime() - d * 86400000 - Math.floor(rand() * 43200000));
      const type = types[Math.floor(rand() * types.length)];
      const project = projects[Math.floor(rand() * projects.length)];
      const title = titles[Math.floor(rand() * titles.length)];
      const hash = Math.floor(rand() * 0xffffff).toString(16).padStart(7, '0');
      entries.push({ id: `entry-${d}-${c}`, type, title, description: `${TYPE_CONFIG[type].verb} ${project}`, timestamp: date.toISOString(), project, hash, additions: type === 'edit' || type === 'upload' ? Math.floor(rand() * 50) + 1 : undefined, deletions: type === 'edit' ? Math.floor(rand() * 20) : undefined });
    }
  }
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function ContributionTimeline() {
  const nav = useNavigate();
  const { t } = useLanguage();
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
  const [initialCollapseDone, setInitialCollapseDone] = useState(false);

  const allEntries = useMemo(() => {
    try {
      const stored = localStorage.getItem('thinkspace-timeline');
      if (stored) { const parsed = JSON.parse(stored); if (Array.isArray(parsed) && parsed.length > 0) return parsed as TimelineEntry[]; }
    } catch {}
    const sample = generateSampleTimeline();
    localStorage.setItem('thinkspace-timeline', JSON.stringify(sample));
    return sample;
  }, []);

  const filtered = useMemo(() => filterType === 'all' ? allEntries : allEntries.filter(e => e.type === filterType), [allEntries, filterType]);

  const monthGroups = useMemo((): MonthGroup[] => {
    const groups = new Map<string, MonthGroup>();
    filtered.forEach(entry => {
      const d = new Date(entry.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!groups.has(key)) groups.set(key, { key, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, year: d.getFullYear(), month: d.getMonth(), entries: [], totalContributions: 0 });
      const g = groups.get(key)!;
      g.entries.push(entry);
      g.totalContributions++;
    });
    return Array.from(groups.values()).sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month);
  }, [filtered]);

  useEffect(() => {
    if (!initialCollapseDone && monthGroups.length > 0) {
      setCollapsedMonths(new Set(monthGroups.map(g => g.key)));
      setInitialCollapseDone(true);
    }
  }, [monthGroups, initialCollapseDone]);

  const displayGroups = showAll ? monthGroups : monthGroups.slice(0, 3);
  const toggleMonth = (key: string) => setCollapsedMonths(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  const totalContributions = allEntries.length;
  const typeCounts = useMemo(() => { const c: Record<string, number> = {}; allEntries.forEach(e => { c[e.type] = (c[e.type] || 0) + 1; }); return c; }, [allEntries]);

  const formatTime = (ts: string) => { const d = new Date(ts); return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`; };
  const formatDay = (ts: string) => { const d = new Date(ts); return `${MONTH_NAMES[d.getMonth()].slice(0,3)} ${d.getDate()}`; };

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid hsl(var(--border))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
            📅 {t('timeline.title') || 'Contribution Activity'}
          </span>
          <span style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '10px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', fontWeight: 600 }}>
            {totalContributions} {t('timeline.contributions') || 'contributions'}
          </span>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => setFilterType('all')} style={{
          padding: '4px 10px', fontSize: '11px', fontWeight: 500, borderRadius: '16px', cursor: 'pointer',
          border: `1px solid ${filterType === 'all' ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))'}`,
          background: filterType === 'all' ? 'hsl(var(--primary) / 0.1)' : 'transparent',
          color: filterType === 'all' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
        }}>
          {t('timeline.all') || 'All'} ({totalContributions})
        </button>
        {(Object.keys(TYPE_CONFIG) as ActivityType[]).map(type => {
          const tc = TYPE_CONFIG[type].tokenColor;
          return (
            <button key={type} onClick={() => setFilterType(type)} style={{
              padding: '4px 10px', fontSize: '11px', fontWeight: 500, borderRadius: '16px', cursor: 'pointer',
              border: `1px solid ${filterType === type ? `hsl(${tc} / 0.4)` : 'hsl(var(--border))'}`,
              background: filterType === type ? `hsl(${tc} / 0.1)` : 'transparent',
              color: filterType === type ? `hsl(${tc})` : 'hsl(var(--muted-foreground))',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              {TYPE_CONFIG[type].icon} {type.charAt(0).toUpperCase() + type.slice(1)}
              {typeCounts[type] ? ` (${typeCounts[type]})` : ''}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        {displayGroups.map((group) => {
          const isCollapsed = collapsedMonths.has(group.key);
          return (
            <div key={group.key} style={{ marginBottom: '8px' }}>
              <button onClick={() => toggleMonth(group.key)} style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 16px', marginBottom: '4px',
                background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}
              >
                <ChevronDown size={14} style={{ color: 'hsl(var(--primary))', transition: 'transform 0.2s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{group.label}</span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: 'hsl(var(--primary) / 0.08)', color: 'hsl(var(--primary))', fontWeight: 500 }}>
                  {group.totalContributions} {t('timeline.entries') || 'entries'}
                </span>
              </button>

              {!isCollapsed && (
                <div style={{ paddingLeft: '8px' }}>
                  {group.entries.map((entry) => {
                    const cfg = TYPE_CONFIG[entry.type];
                    const tc = cfg.tokenColor;
                    return (
                      <div key={entry.id} style={{ display: 'flex', gap: '16px', padding: '8px 0 8px 4px', position: 'relative' }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: `hsl(${tc} / 0.12)`, border: `2px solid hsl(${tc} / 0.35)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: `hsl(${tc})`, flexShrink: 0,
                        }}>
                          {cfg.icon}
                        </div>
                        <div style={{
                          flex: 1, padding: '8px 14px',
                          background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)', transition: 'border-color 0.15s ease',
                        }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = `hsl(${tc} / 0.3)`; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px', display: 'inline-block' }}>
                                {entry.title}
                              </span>
                              {entry.hash && (
                                <span style={{ fontSize: '11px', fontFamily: 'monospace', padding: '1px 6px', borderRadius: '4px', background: 'hsl(var(--muted))', color: 'hsl(var(--primary))' }}>
                                  {entry.hash}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
                              {formatDay(entry.timestamp)} · {formatTime(entry.timestamp)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                            <span style={{ color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px', display: 'inline-block' }}>{entry.description}</span>
                            {entry.project && (
                              <span onClick={(e) => { e.stopPropagation(); nav('/projects'); }} style={{
                                padding: '1px 6px', borderRadius: '4px', background: `hsl(${tc} / 0.08)`, color: `hsl(${tc})`,
                                fontSize: '11px', cursor: 'pointer', fontWeight: 500,
                              }}>
                                {entry.project}
                              </span>
                            )}
                            {entry.additions !== undefined && <span style={{ color: 'hsl(var(--success))', fontSize: '11px', fontFamily: 'monospace' }}>+{entry.additions}</span>}
                            {entry.deletions !== undefined && entry.deletions > 0 && <span style={{ color: 'hsl(var(--destructive))', fontSize: '11px', fontFamily: 'monospace' }}>-{entry.deletions}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {monthGroups.length > 3 && (
        <button onClick={() => setShowAll(!showAll)} style={{
          marginTop: '12px', width: '100%', padding: '10px', fontSize: '13px', fontWeight: 500,
          color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.05)',
          border: '1px solid hsl(var(--primary) / 0.15)', borderRadius: 'var(--radius)', cursor: 'pointer',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(var(--primary) / 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'hsl(var(--primary) / 0.05)'; }}
        >
          {showAll ? (t('timeline.showLess') || 'Show recent months only') : t('timeline.showAll', { count: monthGroups.length })}
        </button>
      )}
    </div>
  );
}

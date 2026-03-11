/**
 * ContributionTrackingDashboard — Phase 1: Mock Data
 * Tracks multi-type academic contributions with attribution chains,
 * timeline, hash verification badges, and summary metrics.
 */
import React, { useState, useMemo } from 'react';
import {
  Lightbulb, Eye, Database, Users, FlaskConical, MessageSquare, BookOpen,
  Shield, CheckCircle2, Clock, Hash, Link2, TrendingUp, Award, ChevronDown,
  ChevronUp, ExternalLink, Copy, Filter
} from 'lucide-react';

// ── Types ──
export type ContributionType =
  | 'ideation' | 'review' | 'data' | 'mentorship'
  | 'replication' | 'feedback' | 'curation';

export interface Contribution {
  id: string;
  type: ContributionType;
  title: string;
  description: string;
  author: string;
  authorOrcid?: string;
  timestamp: string; // ISO
  hash: string; // SHA-256 mock
  verified: boolean;
  anchoredOn?: 'bitcoin' | 'ethereum' | 'polygon';
  parentId?: string; // attribution chain
  tags: string[];
  impactScore: number; // 0-100
}

// ── Mock Data ──
const MOCK_CONTRIBUTIONS: Contribution[] = [
  {
    id: 'c1', type: 'ideation', title: 'Novel CRISPR delivery mechanism hypothesis',
    description: 'Proposed lipid nanoparticle-based delivery for brain tissue targeting',
    author: 'Dr. Elena Papadimitriou', authorOrcid: '0000-0002-1234-5678',
    timestamp: '2026-01-15T09:30:00Z', hash: 'a7f3c2e8d4b1...9f0e6a', verified: true,
    anchoredOn: 'ethereum', tags: ['CRISPR', 'neuroscience', 'drug-delivery'], impactScore: 92,
  },
  {
    id: 'c2', type: 'review', title: 'Peer review of CRISPR delivery paper',
    description: 'Comprehensive methodology critique with statistical recommendations',
    author: 'Prof. Nikolaos Georgiou', authorOrcid: '0000-0003-5678-9012',
    timestamp: '2026-01-20T14:15:00Z', hash: 'b8e4d3f9c5a2...0g1f7b', verified: true,
    anchoredOn: 'polygon', parentId: 'c1', tags: ['peer-review', 'methodology'], impactScore: 78,
  },
  {
    id: 'c3', type: 'data', title: 'Mouse brain tissue penetration dataset',
    description: 'Raw experimental data: LNP penetration rates across 142 tissue samples',
    author: 'Dr. Maria Konstantinou', authorOrcid: '0000-0001-9876-5432',
    timestamp: '2026-02-03T11:00:00Z', hash: 'c9f5e4g0d6b3...1h2g8c', verified: true,
    anchoredOn: 'bitcoin', parentId: 'c1', tags: ['dataset', 'neuroscience', 'experimental'], impactScore: 85,
  },
  {
    id: 'c4', type: 'mentorship', title: 'PhD student guidance on statistical analysis',
    description: 'Supervised 3-month training on Bayesian methods for biological data',
    author: 'Prof. Nikolaos Georgiou', timestamp: '2026-02-10T08:45:00Z',
    hash: 'd0g6f5h1e7c4...2i3h9d', verified: true, tags: ['mentorship', 'statistics'], impactScore: 70,
  },
  {
    id: 'c5', type: 'replication', title: 'Independent replication of LNP experiment',
    description: 'Successfully replicated penetration results with 94% concordance',
    author: 'Dr. Alexandros Dimitriou', timestamp: '2026-02-28T16:30:00Z',
    hash: 'e1h7g6i2f8d5...3j4i0e', verified: true, anchoredOn: 'polygon',
    parentId: 'c3', tags: ['replication', 'validation'], impactScore: 88,
  },
  {
    id: 'c6', type: 'feedback', title: 'Statistical methodology suggestion',
    description: 'Recommended mixed-effects model instead of ANOVA for nested data',
    author: 'Dr. Sofia Alexiou', timestamp: '2026-03-01T10:20:00Z',
    hash: 'f2i8h7j3g9e6...4k5j1f', verified: false, parentId: 'c2',
    tags: ['statistics', 'methodology'], impactScore: 55,
  },
  {
    id: 'c7', type: 'curation', title: 'Systematic review: LNP brain delivery 2020-2026',
    description: 'Curated 87 papers with structured metadata and comparison tables',
    author: 'Dr. Elena Papadimitriou', timestamp: '2026-03-05T13:00:00Z',
    hash: 'g3j9i8k4h0f7...5l6k2g', verified: true, anchoredOn: 'ethereum',
    tags: ['literature-review', 'curation', 'systematic-review'], impactScore: 80,
  },
];

const TYPE_CONFIG: Record<ContributionType, { icon: React.ElementType; label: string; color: string }> = {
  ideation:    { icon: Lightbulb,     label: 'Ideation',    color: '38 92% 50%' },
  review:      { icon: Eye,           label: 'Peer Review', color: '262 83% 58%' },
  data:        { icon: Database,      label: 'Data',        color: '217 91% 60%' },
  mentorship:  { icon: Users,         label: 'Mentorship',  color: '142 76% 36%' },
  replication: { icon: FlaskConical,  label: 'Replication', color: '0 84% 60%' },
  feedback:    { icon: MessageSquare, label: 'Feedback',    color: '199 89% 48%' },
  curation:    { icon: BookOpen,      label: 'Curation',    color: '25 95% 53%' },
};

const CHAIN_COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))'];

// ── Sub-components ──
const HashBadge: React.FC<{ hash: string; verified: boolean; anchor?: string }> = ({ hash, verified, anchor }) => (
  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border text-xs font-mono">
    <Hash className="w-3 h-3 text-muted-foreground" />
    <span className="text-muted-foreground">{hash}</span>
    {verified && (
      <span className="flex items-center gap-0.5 text-[hsl(var(--success))]">
        <Shield className="w-3 h-3" />
        {anchor && <span className="text-[10px] uppercase opacity-70">{anchor}</span>}
      </span>
    )}
    <button
      onClick={() => navigator.clipboard.writeText(hash)}
      className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
    >
      <Copy className="w-3 h-3" />
    </button>
  </div>
);

const ImpactBar: React.FC<{ score: number }> = ({ score }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${score}%`,
          background: score >= 80 ? 'hsl(var(--success))' : score >= 60 ? 'hsl(var(--warning))' : 'hsl(var(--info))',
        }}
      />
    </div>
    <span className="text-xs font-medium text-muted-foreground">{score}</span>
  </div>
);

const ContributionCard: React.FC<{
  contribution: Contribution;
  expanded: boolean;
  onToggle: () => void;
  chainColor?: string;
  hasParent: boolean;
}> = ({ contribution, expanded, onToggle, chainColor, hasParent }) => {
  const config = TYPE_CONFIG[contribution.type];
  const Icon = config.icon;
  const date = new Date(contribution.timestamp);

  return (
    <div className="relative">
      {/* Attribution chain connector */}
      {hasParent && (
        <div className="absolute left-6 -top-4 w-0.5 h-4" style={{ background: chainColor || 'hsl(var(--border))' }} />
      )}
      <div
        className="border border-border rounded-xl bg-card hover:bg-accent/30 transition-all duration-200 cursor-pointer overflow-hidden"
        onClick={onToggle}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `hsl(${config.color} / 0.15)` }}
              >
                <Icon className="w-5 h-5" style={{ color: `hsl(${config.color})` }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: `hsl(${config.color} / 0.12)`, color: `hsl(${config.color})` }}
                  >
                    {config.label}
                  </span>
                  {contribution.verified && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--success))]" />
                  )}
                  {contribution.parentId && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Link2 className="w-3 h-3" /> linked
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-foreground mt-1 truncate">{contribution.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{contribution.author}</span>
                  {contribution.authorOrcid && (
                    <a href={`https://orcid.org/${contribution.authorOrcid}`} target="_blank" rel="noopener"
                      className="text-[hsl(var(--info))] hover:underline flex items-center gap-0.5"
                      onClick={e => e.stopPropagation()}>
                      ORCID <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {date.toLocaleDateString('el-GR')} {date.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 hidden sm:block"><ImpactBar score={contribution.impactScore} /></div>
              {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>
        </div>
        {expanded && (
          <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
            <p className="text-sm text-muted-foreground">{contribution.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {contribution.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 text-[11px] rounded-full bg-muted text-muted-foreground">#{tag}</span>
              ))}
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <HashBadge hash={contribution.hash} verified={contribution.verified} anchor={contribution.anchoredOn} />
              <div className="w-32 sm:hidden"><ImpactBar score={contribution.impactScore} /></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Dashboard ──
export const ContributionTrackingDashboard: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ContributionType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'impact'>('date');

  const filtered = useMemo(() => {
    let items = filterType === 'all' ? MOCK_CONTRIBUTIONS : MOCK_CONTRIBUTIONS.filter(c => c.type === filterType);
    return items.sort((a, b) =>
      sortBy === 'impact' ? b.impactScore - a.impactScore : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [filterType, sortBy]);

  // Summary stats
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    let totalImpact = 0;
    let verified = 0;
    MOCK_CONTRIBUTIONS.forEach(c => {
      byType[c.type] = (byType[c.type] || 0) + 1;
      totalImpact += c.impactScore;
      if (c.verified) verified++;
    });
    return {
      total: MOCK_CONTRIBUTIONS.length,
      byType,
      avgImpact: Math.round(totalImpact / MOCK_CONTRIBUTIONS.length),
      verified,
      authors: new Set(MOCK_CONTRIBUTIONS.map(c => c.author)).size,
    };
  }, []);

  // Chain color mapping
  const chainColorMap = useMemo(() => {
    const roots = MOCK_CONTRIBUTIONS.filter(c => !c.parentId);
    const map = new Map<string, string>();
    roots.forEach((r, i) => map.set(r.id, CHAIN_COLORS[i % CHAIN_COLORS.length]));
    // Propagate to children
    MOCK_CONTRIBUTIONS.forEach(c => {
      if (c.parentId) {
        let rootId = c.parentId;
        let parent = MOCK_CONTRIBUTIONS.find(p => p.id === rootId);
        while (parent?.parentId) {
          rootId = parent.parentId;
          parent = MOCK_CONTRIBUTIONS.find(p => p.id === rootId);
        }
        map.set(c.id, map.get(rootId) || 'hsl(var(--border))');
      }
    });
    return map;
  }, []);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Contributions', value: stats.total, icon: TrendingUp, color: 'var(--primary)' },
          { label: 'Verified On-Chain', value: stats.verified, icon: Shield, color: 'var(--success)' },
          { label: 'Avg Impact Score', value: stats.avgImpact, icon: Award, color: 'var(--warning)' },
          { label: 'Contributors', value: stats.authors, icon: Users, color: 'var(--info)' },
          { label: 'Contribution Types', value: Object.keys(stats.byType).length, icon: Filter, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} className="border border-border rounded-xl bg-card p-4 text-center">
            <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: `hsl(${s.color})` }} />
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Type Distribution Bar */}
      <div className="border border-border rounded-xl bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Contribution Distribution</h3>
        <div className="flex h-3 rounded-full overflow-hidden">
          {(Object.entries(TYPE_CONFIG) as [ContributionType, typeof TYPE_CONFIG[ContributionType]][]).map(([type, cfg]) => {
            const count = stats.byType[type] || 0;
            const pct = (count / stats.total) * 100;
            return pct > 0 ? (
              <div
                key={type}
                className="transition-all duration-300"
                style={{ width: `${pct}%`, background: `hsl(${cfg.color})` }}
                title={`${cfg.label}: ${count}`}
              />
            ) : null;
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {(Object.entries(TYPE_CONFIG) as [ContributionType, typeof TYPE_CONFIG[ContributionType]][]).map(([type, cfg]) => {
            const count = stats.byType[type] || 0;
            return count > 0 ? (
              <span key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: `hsl(${cfg.color})` }} />
                {cfg.label} ({count})
              </span>
            ) : null;
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground">Filter:</span>
        {(['all', ...Object.keys(TYPE_CONFIG)] as (ContributionType | 'all')[]).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              filterType === type
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            {type === 'all' ? 'All' : TYPE_CONFIG[type].label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'date' | 'impact')}
            className="text-xs border border-border rounded-lg px-2 py-1 bg-card text-foreground"
          >
            <option value="date">Date</option>
            <option value="impact">Impact</option>
          </select>
        </div>
      </div>

      {/* Contribution Timeline */}
      <div className="space-y-3">
        {filtered.map(c => (
          <ContributionCard
            key={c.id}
            contribution={c}
            expanded={expandedId === c.id}
            onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
            chainColor={chainColorMap.get(c.id)}
            hasParent={!!c.parentId}
          />
        ))}
      </div>
    </div>
  );
};

export default ContributionTrackingDashboard;

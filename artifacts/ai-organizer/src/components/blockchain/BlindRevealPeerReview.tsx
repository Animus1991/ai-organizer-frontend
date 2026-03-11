/**
 * BlindRevealPeerReview — Blind-then-Reveal Peer Review UI
 * Anonymous review submission, sealed identity, reveal toggle,
 * reviewer credit tracking, review quality metrics, reproducibility bounties.
 * 
 * Integration: Hedera Timestamp Service for cryptographic proof-of-submission.
 */
import React, { useState, useMemo } from 'react';
import {
  EyeOff, Eye, Shield, Star, Award, Lock, Unlock, Clock,
  CheckCircle2, XCircle, MessageSquare, FlaskConical, Coins,
  TrendingUp, Users, FileText, ChevronRight, AlertTriangle, Anchor
} from 'lucide-react';
import { anchorPeerReview } from '../../services/blockchain/HederaTimestampService';
import { toast } from 'sonner';

// ── Types ──
type ReviewPhase = 'blind' | 'revealed';
type ReviewStatus = 'pending' | 'submitted' | 'accepted' | 'revision-needed';
type BountyStatus = 'open' | 'claimed' | 'verified' | 'disputed';

interface Review {
  id: string;
  paperId: string;
  paperTitle: string;
  reviewerAlias: string; // anonymous alias
  reviewerReal?: string; // revealed name
  phase: ReviewPhase;
  status: ReviewStatus;
  submittedAt: string;
  revealedAt?: string;
  sealedHash: string;
  qualityScore: number; // 0-100
  rigorScore: number;
  constructivenessScore: number;
  timelinessScore: number;
  overallRating: number; // 1-5 stars
  recommendation: 'accept' | 'minor-revision' | 'major-revision' | 'reject';
  summary: string;
  creditEarned: number; // reputation points
}

interface Bounty {
  id: string;
  paperTitle: string;
  description: string;
  rewardTokens: number;
  status: BountyStatus;
  postedBy: string;
  postedAt: string;
  claimedBy?: string;
  deadline: string;
  replicationRate?: number;
}

// ── Mock Data ──
const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1', paperId: 'p1', paperTitle: 'Novel CRISPR Delivery via Lipid Nanoparticles',
    reviewerAlias: 'Reviewer-Ψ7', reviewerReal: 'Prof. N. Georgiou',
    phase: 'revealed', status: 'accepted', submittedAt: '2026-01-18T10:00:00Z',
    revealedAt: '2026-02-15T09:00:00Z', sealedHash: 'seal:0xab3f...e7d2',
    qualityScore: 91, rigorScore: 88, constructivenessScore: 95, timelinessScore: 85,
    overallRating: 4, recommendation: 'minor-revision',
    summary: 'Thorough methodology with minor statistical concerns. Recommend additional controls for tissue heterogeneity.',
    creditEarned: 45,
  },
  {
    id: 'r2', paperId: 'p1', paperTitle: 'Novel CRISPR Delivery via Lipid Nanoparticles',
    reviewerAlias: 'Reviewer-Ω3', phase: 'blind', status: 'submitted',
    submittedAt: '2026-01-22T14:30:00Z', sealedHash: 'seal:0xcd5a...f8b1',
    qualityScore: 76, rigorScore: 82, constructivenessScore: 70, timelinessScore: 90,
    overallRating: 3, recommendation: 'major-revision',
    summary: 'Interesting hypothesis but experimental design lacks proper blinding. Sample size inadequate for claims made.',
    creditEarned: 35,
  },
  {
    id: 'r3', paperId: 'p2', paperTitle: 'Bayesian Framework for Genomic Variant Classification',
    reviewerAlias: 'Reviewer-Δ9', reviewerReal: 'Dr. S. Alexiou',
    phase: 'revealed', status: 'accepted', submittedAt: '2026-02-05T09:15:00Z',
    revealedAt: '2026-03-01T11:00:00Z', sealedHash: 'seal:0xef7c...a3d4',
    qualityScore: 88, rigorScore: 92, constructivenessScore: 85, timelinessScore: 78,
    overallRating: 5, recommendation: 'accept',
    summary: 'Excellent statistical rigor. Novel application of hierarchical Bayesian models to variant classification problem.',
    creditEarned: 55,
  },
  {
    id: 'r4', paperId: 'p3', paperTitle: 'Meta-Analysis of mRNA Vaccine Efficacy',
    reviewerAlias: 'Reviewer-Σ1', phase: 'blind', status: 'pending',
    submittedAt: '2026-03-07T16:00:00Z', sealedHash: 'seal:0x1b2c...d4e5',
    qualityScore: 0, rigorScore: 0, constructivenessScore: 0, timelinessScore: 0,
    overallRating: 0, recommendation: 'major-revision',
    summary: '', creditEarned: 0,
  },
];

const MOCK_BOUNTIES: Bounty[] = [
  {
    id: 'b1', paperTitle: 'CRISPR LNP Brain Delivery Protocol',
    description: 'Replicate Table 3 penetration experiments using provided protocol and dataset',
    rewardTokens: 150, status: 'open', postedBy: 'Dr. Papadimitriou',
    postedAt: '2026-02-20T08:00:00Z', deadline: '2026-04-20T23:59:59Z',
  },
  {
    id: 'b2', paperTitle: 'Bayesian Variant Classification',
    description: 'Validate classification accuracy on independent ClinVar dataset (n≥1000)',
    rewardTokens: 200, status: 'claimed', postedBy: 'Prof. Georgiou',
    postedAt: '2026-02-25T10:00:00Z', claimedBy: 'Dr. Dimitriou',
    deadline: '2026-05-01T23:59:59Z', replicationRate: 35,
  },
  {
    id: 'b3', paperTitle: 'mRNA Stability in Tropical Conditions',
    description: 'Replicate thermal stability experiments at 37°C and 45°C storage conditions',
    rewardTokens: 100, status: 'verified', postedBy: 'Dr. Konstantinou',
    postedAt: '2026-01-10T12:00:00Z', claimedBy: 'Dr. Tsiakkas',
    deadline: '2026-03-10T23:59:59Z', replicationRate: 94,
  },
];

const REC_COLORS: Record<string, string> = {
  'accept': 'var(--success)',
  'minor-revision': 'var(--warning)',
  'major-revision': 'var(--info)',
  'reject': 'var(--destructive)',
};

const BOUNTY_STATUS_CONFIG: Record<BountyStatus, { color: string; label: string }> = {
  open: { color: 'var(--info)', label: 'Open' },
  claimed: { color: 'var(--warning)', label: 'In Progress' },
  verified: { color: 'var(--success)', label: 'Verified' },
  disputed: { color: 'var(--destructive)', label: 'Disputed' },
};

// ── Sub-components ──
const QualityMeter: React.FC<{ label: string; score: number }> = ({ label, score }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-[11px] font-medium text-foreground">{score}%</span>
    </div>
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${score}%`,
          background: score >= 85 ? 'hsl(var(--success))' : score >= 65 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))',
        }}
      />
    </div>
  </div>
);

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'fill-[hsl(var(--warning))] text-[hsl(var(--warning))]' : 'text-muted-foreground/30'}`} />
    ))}
  </div>
);

// ── Main Component ──
export const BlindRevealPeerReview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reviews' | 'bounties' | 'metrics'>('reviews');
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Handler for revealing identity & claiming credit with Hedera timestamp
  const handleRevealIdentity = async (review: Review) => {
    setSubmitting(true);
    try {
      const actor = localStorage.getItem('aiorg_username') || review.reviewerAlias;
      const reviewContent = JSON.stringify({
        reviewId: review.id,
        paperId: review.paperId,
        summary: review.summary,
        recommendation: review.recommendation,
        qualityScore: review.qualityScore,
        submittedAt: review.submittedAt,
      });

      // Anchor to Hedera with proof-of-review
      const anchor = await anchorPeerReview(
        review.id,
        reviewContent,
        actor,
        review.paperId
      );

      toast.success(
        `Identity revealed & anchored to Hedera!\nTimestamp: ${anchor.id}`,
        { duration: 5000 }
      );
      
      console.log('[Blockchain] Peer review anchored:', anchor);
      
      // In production: update review status to 'revealed' via API
      // For now, show success message
    } catch (error) {
      console.error('[Blockchain] Failed to anchor peer review:', error);
      toast.error('Failed to anchor review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Aggregate metrics
  const metrics = useMemo(() => {
    const completed = MOCK_REVIEWS.filter(r => r.status !== 'pending');
    const avgQuality = completed.length > 0
      ? Math.round(completed.reduce((s, r) => s + r.qualityScore, 0) / completed.length)
      : 0;
    const totalCredit = MOCK_REVIEWS.reduce((s, r) => s + r.creditEarned, 0);
    const revealed = MOCK_REVIEWS.filter(r => r.phase === 'revealed').length;
    return { avgQuality, totalCredit, revealed, total: MOCK_REVIEWS.length, completed: completed.length };
  }, []);

  const tabs = [
    { id: 'reviews' as const, label: 'Reviews', icon: MessageSquare, count: MOCK_REVIEWS.length },
    { id: 'bounties' as const, label: 'Reproducibility Bounties', icon: Coins, count: MOCK_BOUNTIES.length },
    { id: 'metrics' as const, label: 'Quality Metrics', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Reviews', value: metrics.total, icon: FileText, color: 'var(--primary)' },
          { label: 'Avg Quality', value: `${metrics.avgQuality}%`, icon: Award, color: 'var(--success)' },
          { label: 'Identity Revealed', value: metrics.revealed, icon: Eye, color: 'var(--info)' },
          { label: 'Credits Earned', value: metrics.totalCredit, icon: Coins, color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="border border-border rounded-xl bg-card p-4 text-center">
            <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: `hsl(${s.color})` }} />
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {MOCK_REVIEWS.map(review => {
            const isExpanded = expandedReview === review.id;
            return (
              <div key={review.id} className="border border-border rounded-xl bg-card overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-accent/20 transition-colors"
                  onClick={() => setExpandedReview(isExpanded ? null : review.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        review.phase === 'blind' ? 'bg-muted' : 'bg-[hsl(var(--success))]/10'
                      }`}>
                        {review.phase === 'blind' ? (
                          <EyeOff className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <Eye className="w-5 h-5 text-[hsl(var(--success))]" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            review.phase === 'blind'
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]'
                          }`}>
                            {review.phase === 'blind' ? '🔒 Sealed' : '🔓 Revealed'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full`} style={{
                            background: `hsl(${REC_COLORS[review.recommendation]} / 0.12)`,
                            color: `hsl(${REC_COLORS[review.recommendation]})`,
                          }}>
                            {review.recommendation.replace('-', ' ')}
                          </span>
                          {review.status === 'pending' && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-foreground mt-1">{review.paperTitle}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {review.phase === 'blind' ? (
                              <><Lock className="w-3 h-3" /> {review.reviewerAlias}</>
                            ) : (
                              <><Unlock className="w-3 h-3" /> {review.reviewerReal} <span className="opacity-50">({review.reviewerAlias})</span></>
                            )}
                          </span>
                          <span>·</span>
                          <span>{new Date(review.submittedAt).toLocaleDateString('el-GR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {review.overallRating > 0 && <StarRating rating={review.overallRating} />}
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-4">
                    {review.summary && (
                      <p className="text-sm text-muted-foreground italic">"{review.summary}"</p>
                    )}
                    {review.qualityScore > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <QualityMeter label="Quality" score={review.qualityScore} />
                        <QualityMeter label="Rigor" score={review.rigorScore} />
                        <QualityMeter label="Constructiveness" score={review.constructivenessScore} />
                        <QualityMeter label="Timeliness" score={review.timelinessScore} />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 font-mono text-muted-foreground">
                        <Shield className="w-3 h-3" /> {review.sealedHash}
                      </div>
                      {review.creditEarned > 0 && (
                        <span className="flex items-center gap-1 text-[hsl(var(--warning))]">
                          <Coins className="w-3 h-3" /> +{review.creditEarned} credits
                        </span>
                      )}
                    </div>
                    {review.phase === 'blind' && review.status !== 'pending' && (
                      <button 
                        onClick={() => handleRevealIdentity(review)}
                        disabled={submitting}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <>
                            <Anchor className="w-4 h-4 animate-pulse" /> Anchoring to Hedera...
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" /> Reveal Identity & Claim Credit
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bounties Tab */}
      {activeTab === 'bounties' && (
        <div className="space-y-3">
          {MOCK_BOUNTIES.map(bounty => {
            const statusCfg = BOUNTY_STATUS_CONFIG[bounty.status];
            return (
              <div key={bounty.id} className="border border-border rounded-xl bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--warning))]/10 flex items-center justify-center shrink-0">
                      <FlaskConical className="w-5 h-5 text-[hsl(var(--warning))]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ background: `hsl(${statusCfg.color} / 0.12)`, color: `hsl(${statusCfg.color})` }}>
                          {statusCfg.label}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-semibold text-[hsl(var(--warning))]">
                          <Coins className="w-3 h-3" /> {bounty.rewardTokens} tokens
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-foreground mt-1">{bounty.paperTitle}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{bounty.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>Posted by {bounty.postedBy}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due {new Date(bounty.deadline).toLocaleDateString('el-GR')}
                        </span>
                        {bounty.claimedBy && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> {bounty.claimedBy}
                            </span>
                          </>
                        )}
                      </div>
                      {bounty.replicationRate !== undefined && (
                        <div className="mt-2 w-48">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                            <span>Replication progress</span>
                            <span>{bounty.replicationRate}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-[hsl(var(--success))]" style={{ width: `${bounty.replicationRate}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {bounty.status === 'open' && (
                    <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity shrink-0">
                      Claim Bounty
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-border rounded-xl bg-card p-5 space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Review Quality Overview</h4>
            {MOCK_REVIEWS.filter(r => r.qualityScore > 0).map(r => (
              <div key={r.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {r.phase === 'revealed' ? r.reviewerReal : r.reviewerAlias}
                  </span>
                  <StarRating rating={r.overallRating} />
                </div>
                <QualityMeter label="" score={r.qualityScore} />
              </div>
            ))}
          </div>
          <div className="border border-border rounded-xl bg-card p-5 space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Credit Leaderboard</h4>
            {[...MOCK_REVIEWS]
              .filter(r => r.creditEarned > 0)
              .sort((a, b) => b.creditEarned - a.creditEarned)
              .map((r, i) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground/50 w-6">#{i + 1}</span>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {r.phase === 'revealed' ? r.reviewerReal : r.reviewerAlias}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{r.paperTitle.slice(0, 40)}…</div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-[hsl(var(--warning))]">
                    <Coins className="w-4 h-4" /> {r.creditEarned}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlindRevealPeerReview;

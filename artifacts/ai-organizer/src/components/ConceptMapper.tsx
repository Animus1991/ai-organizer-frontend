// src/components/ConceptMapper.tsx
// Near-Duplicate / Concept Mapper — identifies segments expressing the same concept
import { useState, useMemo, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";

// ─── Types ───────────────────────────────────────────────────────────
interface Segment {
  id: number;
  title?: string;
  content?: string;
  mode?: string;
}

interface SimilarityPair {
  segA: Segment;
  segB: Segment;
  score: number;
  sharedTerms: string[];
}

interface ConceptCluster {
  id: number;
  label: string;
  segments: Segment[];
  keyTerms: string[];
  avgSimilarity: number;
}

interface ConceptMapperProps {
  segments: Segment[];
  open: boolean;
  onClose: () => void;
  onLinkSegments?: (segAId: number, segBId: number) => void;
  onMergeSegments?: (segmentIds: number[]) => void;
}

// ─── Constants ───────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','must','shall',
  'can','need','to','of','in','for','on','with','at','by','from','as','into',
  'through','during','before','after','above','below','between','under','again',
  'further','then','once','here','there','when','where','why','how','all','each',
  'few','more','most','other','some','such','no','nor','not','only','own','same',
  'so','than','too','very','just','and','but','if','or','because','until','while',
  'about','against','both','doing','down','its','out','over','up','what','which',
  'who','whom','this','that','these','those','am','any','her','him','his','its',
  'itself','me','my','myself','our','ours','ourselves','she','they','their','them',
  'we','you','your','yours','also','been','being','get','got','gets','much',
  'many','make','made','like','still','since','even','back','new','now','one',
  'two','three','first','last','way','may','come','take','said','part','every',
]);

const SIMILARITY_THRESHOLDS = {
  high: 0.7,
  medium: 0.45,
  low: 0.25,
};

function getScoreColor(score: number): string {
  if (score >= SIMILARITY_THRESHOLDS.high) return '#10b981';
  if (score >= SIMILARITY_THRESHOLDS.medium) return '#f59e0b';
  return '#ef4444';
}

function getScoreLabel(score: number): string {
  if (score >= SIMILARITY_THRESHOLDS.high) return 'High';
  if (score >= SIMILARITY_THRESHOLDS.medium) return 'Medium';
  return 'Low';
}

// ─── NLP Helpers ─────────────────────────────────────────────────────
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function getTermFrequency(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const t of tokens) {
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  return freq;
}

function cosineSimilarity(
  tfA: Map<string, number>,
  tfB: Map<string, number>,
  idf: Map<string, number>
): { score: number; sharedTerms: string[] } {
  const shared: string[] = [];
  let dot = 0, normA = 0, normB = 0;

  const allTerms = new Set([...tfA.keys(), ...tfB.keys()]);
  for (const term of allTerms) {
    const a = (tfA.get(term) || 0) * (idf.get(term) || 1);
    const b = (tfB.get(term) || 0) * (idf.get(term) || 1);
    dot += a * b;
    normA += a * a;
    normB += b * b;
    if (tfA.has(term) && tfB.has(term)) {
      shared.push(term);
    }
  }

  if (normA === 0 || normB === 0) return { score: 0, sharedTerms: [] };
  return {
    score: dot / (Math.sqrt(normA) * Math.sqrt(normB)),
    sharedTerms: shared.sort((a, b) => (idf.get(b) || 0) - (idf.get(a) || 0)).slice(0, 8),
  };
}

function buildIDF(documents: Map<string, number>[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const doc of documents) {
    for (const term of doc.keys()) {
      df.set(term, (df.get(term) || 0) + 1);
    }
  }
  const N = documents.length;
  const idf = new Map<string, number>();
  for (const [term, count] of df) {
    idf.set(term, Math.log((N + 1) / (count + 1)) + 1);
  }
  return idf;
}

function clusterSegments(pairs: SimilarityPair[], segments: Segment[], threshold: number): ConceptCluster[] {
  const clusters: ConceptCluster[] = [];
  const assigned = new Set<number>();

  // Greedy agglomerative clustering
  const adjacency = new Map<number, { seg: Segment; neighbors: { seg: Segment; score: number; terms: string[] }[] }>();

  for (const seg of segments) {
    adjacency.set(seg.id, { seg, neighbors: [] });
  }

  for (const pair of pairs) {
    if (pair.score < threshold) continue;
    adjacency.get(pair.segA.id)?.neighbors.push({ seg: pair.segB, score: pair.score, terms: pair.sharedTerms });
    adjacency.get(pair.segB.id)?.neighbors.push({ seg: pair.segA, score: pair.score, terms: pair.sharedTerms });
  }

  // Sort by most connections
  const sorted = [...adjacency.entries()].sort((a, b) => b[1].neighbors.length - a[1].neighbors.length);

  let clusterId = 0;
  for (const [segId, data] of sorted) {
    if (assigned.has(segId)) continue;
    if (data.neighbors.length === 0) continue;

    const clusterSegs: Segment[] = [data.seg];
    assigned.add(segId);

    const allTerms: string[] = [];
    let totalScore = 0;
    let scoreCount = 0;

    for (const neighbor of data.neighbors) {
      if (assigned.has(neighbor.seg.id)) continue;
      clusterSegs.push(neighbor.seg);
      assigned.add(neighbor.seg.id);
      allTerms.push(...neighbor.terms);
      totalScore += neighbor.score;
      scoreCount++;
    }

    // Deduplicate and rank key terms
    const termFreq = new Map<string, number>();
    for (const t of allTerms) {
      termFreq.set(t, (termFreq.get(t) || 0) + 1);
    }
    const keyTerms = [...termFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([t]) => t);

    clusters.push({
      id: clusterId++,
      label: keyTerms.slice(0, 3).join(', ') || `Cluster ${clusterId}`,
      segments: clusterSegs,
      keyTerms,
      avgSimilarity: scoreCount > 0 ? totalScore / scoreCount : 0,
    });
  }

  return clusters.sort((a, b) => b.segments.length - a.segments.length);
}

// ─── Component ───────────────────────────────────────────────────────
export default function ConceptMapper({ segments, open, onClose, onLinkSegments, onMergeSegments }: ConceptMapperProps) {
  const [threshold, setThreshold] = useState<number>(SIMILARITY_THRESHOLDS.medium);
  const [viewMode, setViewMode] = useState<'clusters' | 'pairs'>('clusters');
  const [expandedCluster, setExpandedCluster] = useState<number | null>(null);
  const [selectedPairs, setSelectedPairs] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Compute TF-IDF vectors for all segments
  const { pairs, clusters, stats } = useMemo(() => {
    if (!analysisComplete || segments.length < 2) {
      return { pairs: [] as SimilarityPair[], clusters: [] as ConceptCluster[], stats: { totalPairs: 0, highSim: 0, medSim: 0, lowSim: 0 } };
    }

    const tokenized = segments.map(s => tokenize((s.title || '') + ' ' + (s.content || '')));
    const tfs = tokenized.map(t => getTermFrequency(t));
    const idf = buildIDF(tfs);

    const allPairs: SimilarityPair[] = [];
    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const { score, sharedTerms } = cosineSimilarity(tfs[i], tfs[j], idf);
        if (score >= SIMILARITY_THRESHOLDS.low) {
          allPairs.push({ segA: segments[i], segB: segments[j], score, sharedTerms });
        }
      }
    }
    allPairs.sort((a, b) => b.score - a.score);

    const conceptClusters = clusterSegments(allPairs, segments, threshold);

    return {
      pairs: allPairs,
      clusters: conceptClusters,
      stats: {
        totalPairs: allPairs.length,
        highSim: allPairs.filter(p => p.score >= SIMILARITY_THRESHOLDS.high).length,
        medSim: allPairs.filter(p => p.score >= SIMILARITY_THRESHOLDS.medium && p.score < SIMILARITY_THRESHOLDS.high).length,
        lowSim: allPairs.filter(p => p.score < SIMILARITY_THRESHOLDS.medium).length,
      },
    };
  }, [segments, threshold, analysisComplete]);

  const filteredPairs = useMemo(() => pairs.filter(p => p.score >= threshold), [pairs, threshold]);

  const runAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    // Simulate async processing for UX
    setTimeout(() => {
      setAnalysisComplete(true);
      setIsAnalyzing(false);
    }, 600);
  }, []);

  const togglePairSelection = useCallback((pairKey: string) => {
    setSelectedPairs(prev => {
      const next = new Set(prev);
      if (next.has(pairKey)) next.delete(pairKey);
      else next.add(pairKey);
      return next;
    });
  }, []);

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + '…' : text;

  const { isDark, colors } = useTheme();

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '90vw', maxWidth: 1100, maxHeight: '90vh',
          background: isDark ? 'linear-gradient(165deg, rgba(16,18,30,0.98), rgba(8,10,18,1))' : '#ffffff',
          border: isDark ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(0,0,0,0.1)',
          borderRadius: 20, display: 'flex', flexDirection: 'column',
          boxShadow: isDark ? '0 32px 80px rgba(0,0,0,0.6)' : '0 32px 80px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: isDark ? 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))' : 'rgba(99,102,241,0.04)',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: 10 }}>
              🔗 Near-Duplicate & Concept Mapper
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.textMuted }}>
              Identifies segments expressing the same concept in different words
            </p>
          </div>
          <button onClick={onClose} style={{
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            borderRadius: 10, padding: '8px 12px', color: colors.textMuted,
            cursor: 'pointer', fontSize: 18,
          }}>✕</button>
        </div>

        {/* Toolbar */}
        <div style={{
          padding: '12px 24px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          background: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)',
        }}>
          {/* Threshold slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
            <span style={{ fontSize: 12, color: colors.textMuted, whiteSpace: 'nowrap' }}>Similarity ≥</span>
            <input
              type="range" min={10} max={90} step={5}
              value={Math.round(threshold * 100)}
              onChange={e => setThreshold(parseInt(e.target.value) / 100)}
              style={{ width: 120, accentColor: '#6366f1' }}
            />
            <span style={{
              fontSize: 12, fontWeight: 700, color: getScoreColor(threshold),
              background: `${getScoreColor(threshold)}15`, padding: '2px 8px',
              borderRadius: 6, border: `1px solid ${getScoreColor(threshold)}30`,
            }}>
              {Math.round(threshold * 100)}% ({getScoreLabel(threshold)})
            </span>
          </div>

          {/* View mode toggle */}
          <div style={{ display: 'flex', gap: 4 }}>
            {(['clusters', 'pairs'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: viewMode === mode ? '1px solid rgba(99,102,241,0.4)' : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'),
                background: viewMode === mode ? 'rgba(99,102,241,0.15)' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                color: viewMode === mode ? '#a5b4fc' : colors.textMuted,
                cursor: 'pointer',
              }}>
                {mode === 'clusters' ? '🗂 Clusters' : '🔗 Pairs'}
              </button>
            ))}
          </div>

          {/* Analyze button */}
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing || segments.length < 2}
            style={{
              padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              border: '1px solid rgba(99,102,241,0.3)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
              color: '#a5b4fc', cursor: segments.length < 2 ? 'not-allowed' : 'pointer',
              opacity: isAnalyzing ? 0.6 : 1, marginLeft: 'auto',
            }}
          >
            {isAnalyzing ? '⏳ Analyzing…' : analysisComplete ? '🔄 Re-analyze' : '▶ Analyze Segments'}
          </button>
        </div>

        {/* Stats bar */}
        {analysisComplete && (
          <div style={{
            padding: '10px 24px', display: 'flex', gap: 20,
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
            background: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)',
          }}>
            <StatBadge label="Segments" value={segments.length} color="#6366f1" />
            <StatBadge label="Similar pairs" value={stats.totalPairs} color="#8b5cf6" />
            <StatBadge label="High similarity" value={stats.highSim} color="#10b981" />
            <StatBadge label="Medium" value={stats.medSim} color="#f59e0b" />
            <StatBadge label="Low" value={stats.lowSim} color="#ef4444" />
            <StatBadge label="Concept clusters" value={clusters.length} color="#06b6d4" />
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
          {!analysisComplete ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '80px 20px', gap: 16,
            }}>
              <div style={{ fontSize: 48 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary }}>
                {segments.length < 2
                  ? 'Need at least 2 segments to analyze'
                  : `Ready to analyze ${segments.length} segments`}
              </div>
              <div style={{ fontSize: 13, color: colors.textMuted, maxWidth: 400, textAlign: 'center' }}>
                The concept mapper uses TF-IDF cosine similarity to detect segments that express
                the same idea in different words. It groups them into concept clusters.
              </div>
            </div>
          ) : viewMode === 'clusters' ? (
            /* Clusters view */
            clusters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textMuted }}>
                No concept clusters found at {Math.round(threshold * 100)}% threshold.
                Try lowering the similarity threshold.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {clusters.map(cluster => (
                  <div key={cluster.id} style={{
                    border: '1px solid rgba(99,102,241,0.15)',
                    borderRadius: 14, overflow: 'hidden',
                    background: expandedCluster === cluster.id
                      ? 'rgba(99,102,241,0.06)' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'),
                  }}>
                    {/* Cluster header */}
                    <button
                      onClick={() => setExpandedCluster(expandedCluster === cluster.id ? null : cluster.id)}
                      style={{
                        width: '100%', padding: '14px 18px', border: 'none',
                        background: 'transparent', cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 12,
                        color: colors.textPrimary,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{expandedCluster === cluster.id ? '▾' : '▸'}</span>
                      <span style={{
                        background: 'rgba(99,102,241,0.2)', color: '#a5b4fc',
                        padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                      }}>
                        {cluster.segments.length} segments
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>
                        {cluster.label}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {cluster.keyTerms.map(t => (
                          <span key={t} style={{
                            padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                            background: 'rgba(139,92,246,0.15)', color: '#c4b5fd',
                            border: '1px solid rgba(139,92,246,0.2)',
                          }}>{t}</span>
                        ))}
                      </div>
                      <span style={{
                        fontSize: 11, color: getScoreColor(cluster.avgSimilarity), fontWeight: 700,
                      }}>
                        avg {Math.round(cluster.avgSimilarity * 100)}%
                      </span>
                    </button>

                    {/* Expanded content */}
                    {expandedCluster === cluster.id && (
                      <div style={{
                        padding: '0 18px 14px',
                        borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
                      }}>
                        {cluster.segments.map((seg, idx) => (
                          <div key={seg.id} style={{
                            padding: '10px 14px', margin: '8px 0',
                            borderRadius: 10,
                            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{
                                fontSize: 10, fontWeight: 700, color: colors.textMuted,
                                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', padding: '2px 6px',
                                borderRadius: 4,
                              }}>#{idx + 1}</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>
                                {seg.title || `Segment ${seg.id}`}
                              </span>
                              {seg.mode && (
                                <span style={{
                                  fontSize: 10, color: colors.textMuted,
                                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', padding: '1px 6px',
                                  borderRadius: 4,
                                }}>{seg.mode}</span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.6 }}>
                              {truncate(seg.content || '', 200)}
                            </div>
                          </div>
                        ))}

                        {/* Cluster actions */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          {onMergeSegments && cluster.segments.length >= 2 && (
                            <button
                              onClick={() => onMergeSegments(cluster.segments.map(s => s.id))}
                              style={{
                                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                border: '1px solid rgba(245,158,11,0.3)',
                                background: 'rgba(245,158,11,0.1)', color: '#fcd34d',
                                cursor: 'pointer',
                              }}
                            >⚡ Suggest Merge</button>
                          )}
                          {onLinkSegments && cluster.segments.length >= 2 && (
                            <button
                              onClick={() => {
                                for (let i = 0; i < cluster.segments.length - 1; i++) {
                                  onLinkSegments(cluster.segments[i].id, cluster.segments[i + 1].id);
                                }
                              }}
                              style={{
                                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                border: '1px solid rgba(99,102,241,0.3)',
                                background: 'rgba(99,102,241,0.1)', color: '#a5b4fc',
                                cursor: 'pointer',
                              }}
                            >🔗 Link All</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Pairs view */
            filteredPairs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textMuted }}>
                No similar pairs found at {Math.round(threshold * 100)}% threshold.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredPairs.slice(0, 50).map((pair, idx) => {
                  const pairKey = `${pair.segA.id}-${pair.segB.id}`;
                  const isSelected = selectedPairs.has(pairKey);
                  return (
                    <div key={idx} style={{
                      padding: '12px 16px', borderRadius: 12,
                      background: isSelected ? 'rgba(99,102,241,0.08)' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'),
                      border: isSelected ? '1px solid rgba(99,102,241,0.3)' : (isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)'),
                      cursor: 'pointer',
                    }} onClick={() => togglePairSelection(pairKey)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        {/* Score badge */}
                        <span style={{
                          fontSize: 13, fontWeight: 700, color: getScoreColor(pair.score),
                          background: `${getScoreColor(pair.score)}15`,
                          padding: '3px 10px', borderRadius: 8,
                          border: `1px solid ${getScoreColor(pair.score)}30`,
                          minWidth: 48, textAlign: 'center',
                        }}>
                          {Math.round(pair.score * 100)}%
                        </span>
                        {/* Shared terms */}
                        <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
                          {pair.sharedTerms.map(t => (
                            <span key={t} style={{
                              padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                              background: 'rgba(139,92,246,0.12)', color: '#c4b5fd',
                            }}>{t}</span>
                          ))}
                        </div>
                        {/* Actions */}
                        {onLinkSegments && (
                          <button
                            onClick={e => { e.stopPropagation(); onLinkSegments(pair.segA.id, pair.segB.id); }}
                            style={{
                              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                              border: '1px solid rgba(99,102,241,0.2)',
                              background: 'rgba(99,102,241,0.1)', color: '#a5b4fc',
                              cursor: 'pointer',
                            }}
                          >🔗 Link</button>
                        )}
                      </div>
                      {/* Segment previews */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'start' }}>
                        <div style={{
                          padding: '8px 10px', borderRadius: 8,
                          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: colors.textPrimary, marginBottom: 2 }}>
                            {pair.segA.title || `Segment ${pair.segA.id}`}
                          </div>
                          <div style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.5 }}>
                            {truncate(pair.segA.content || '', 120)}
                          </div>
                        </div>
                        <div style={{
                          alignSelf: 'center', fontSize: 16, color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                          padding: '0 4px',
                        }}>↔</div>
                        <div style={{
                          padding: '8px 10px', borderRadius: 8,
                          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: colors.textPrimary, marginBottom: 2 }}>
                            {pair.segB.title || `Segment ${pair.segB.id}`}
                          </div>
                          <div style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.5 }}>
                            {truncate(pair.segB.content || '', 120)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredPairs.length > 50 && (
                  <div style={{ textAlign: 'center', padding: '12px', color: colors.textMuted, fontSize: 12 }}>
                    Showing top 50 of {filteredPairs.length} pairs. Increase threshold to narrow results.
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────
function StatBadge({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, color: 'inherit', opacity: 0.5 }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 700, color,
        background: `${color}15`, padding: '2px 8px',
        borderRadius: 6, border: `1px solid ${color}25`,
      }}>{value}</span>
    </div>
  );
}

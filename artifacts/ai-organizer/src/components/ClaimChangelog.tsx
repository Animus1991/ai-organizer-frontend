// src/components/ClaimChangelog.tsx
// Claim Changelog & Traceability — tracks how claims evolve over time
import { useState, useMemo, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────
type ChangeType = 'created' | 'modified' | 'merged' | 'split' | 'status_changed' | 'evidence_added' | 'evidence_removed' | 'reclassified' | 'deleted' | 'restored';

interface ClaimChange {
  id: string;
  claimId: string;
  claimText: string;
  changeType: ChangeType;
  timestamp: number;
  previousValue?: string;
  newValue?: string;
  sourceDocument?: string;
  sourceSegment?: string;
  notes?: string;
  author?: string;
}

interface TrackedClaim {
  id: string;
  currentText: string;
  originalText: string;
  status: 'draft' | 'validated' | 'disputed' | 'needs-source' | 'archived';
  claimType?: string;
  createdAt: number;
  history: ClaimChange[];
}

interface ClaimChangelogProps {
  open: boolean;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────
const STORAGE_KEY = 'thinkspace-claim-changelog';

const CHANGE_TYPE_INFO: Record<ChangeType, { icon: string; label: string; color: string }> = {
  created:          { icon: '🆕', label: 'Created',          color: '#10b981' },
  modified:         { icon: '✏️', label: 'Modified',         color: '#6366f1' },
  merged:           { icon: '🔗', label: 'Merged',           color: '#8b5cf6' },
  split:            { icon: '✂️', label: 'Split',            color: '#f59e0b' },
  status_changed:   { icon: '🔄', label: 'Status Changed',   color: '#06b6d4' },
  evidence_added:   { icon: '📎', label: 'Evidence Added',   color: '#22d3ee' },
  evidence_removed: { icon: '📤', label: 'Evidence Removed', color: '#ef4444' },
  reclassified:     { icon: '🏷️', label: 'Reclassified',     color: '#a78bfa' },
  deleted:          { icon: '🗑️', label: 'Deleted',          color: '#ef4444' },
  restored:         { icon: '♻️', label: 'Restored',         color: '#10b981' },
};

const STATUS_COLORS: Record<string, string> = {
  draft: '#6366f1',
  validated: '#10b981',
  disputed: '#ef4444',
  'needs-source': '#f59e0b',
  archived: '#6b7280',
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Data helpers ────────────────────────────────────────────────────
function loadClaims(): TrackedClaim[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveClaims(claims: TrackedClaim[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
}

// ─── Component ───────────────────────────────────────────────────────
export function ClaimChangelog({ open, onClose }: ClaimChangelogProps) {
  const [claims, setClaims] = useState<TrackedClaim[]>(() => loadClaims());
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ChangeType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'claims'>('claims');
  const [newClaimText, setNewClaimText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const persist = useCallback((updated: TrackedClaim[]) => {
    setClaims(updated);
    saveClaims(updated);
  }, []);

  // Add a new tracked claim
  const addClaim = useCallback(() => {
    if (!newClaimText.trim()) return;
    const now = Date.now();
    const id = generateId();
    const change: ClaimChange = {
      id: generateId(), claimId: id, claimText: newClaimText.trim(),
      changeType: 'created', timestamp: now,
      newValue: newClaimText.trim(),
    };
    const claim: TrackedClaim = {
      id, currentText: newClaimText.trim(), originalText: newClaimText.trim(),
      status: 'draft', createdAt: now, history: [change],
    };
    persist([claim, ...claims]);
    setNewClaimText('');
    setShowAddForm(false);
  }, [newClaimText, claims, persist]);

  // Record a change to a claim
  const recordChange = useCallback((claimId: string, changeType: ChangeType, newValue: string, notes?: string) => {
    const updated = claims.map(c => {
      if (c.id !== claimId) return c;
      const change: ClaimChange = {
        id: generateId(), claimId, claimText: c.currentText,
        changeType, timestamp: Date.now(),
        previousValue: changeType === 'modified' ? c.currentText : changeType === 'status_changed' ? c.status : undefined,
        newValue, notes,
      };
      return {
        ...c,
        currentText: changeType === 'modified' ? newValue : c.currentText,
        status: changeType === 'status_changed' ? newValue as TrackedClaim['status'] : c.status,
        claimType: changeType === 'reclassified' ? newValue : c.claimType,
        history: [...c.history, change],
      };
    });
    persist(updated);
  }, [claims, persist]);

  // Delete claim
  const deleteClaim = useCallback((claimId: string) => {
    persist(claims.filter(c => c.id !== claimId));
    if (selectedClaimId === claimId) setSelectedClaimId(null);
  }, [claims, persist, selectedClaimId]);

  // Global timeline (all changes across all claims)
  const globalTimeline = useMemo(() => {
    const all: ClaimChange[] = [];
    for (const c of claims) {
      for (const h of c.history) {
        all.push(h);
      }
    }
    return all
      .filter(h => filterType === 'all' || h.changeType === filterType)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [claims, filterType]);

  const filteredClaims = useMemo(() =>
    claims.filter(c => filterStatus === 'all' || c.status === filterStatus),
    [claims, filterStatus]
  );

  const selectedClaim = useMemo(() =>
    claims.find(c => c.id === selectedClaimId) || null,
    [claims, selectedClaimId]
  );

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '92vw', maxWidth: 1200, maxHeight: '90vh',
          background: 'linear-gradient(165deg, rgba(16,18,30,0.98), rgba(8,10,18,1))',
          border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
              📜 Claim Changelog & Traceability
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              Track how claims evolve: creation → modification → validation
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowAddForm(!showAddForm)} style={{
              padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              border: '1px solid rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', cursor: 'pointer',
            }}>+ Track Claim</button>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '8px 12px', color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer', fontSize: 18,
            }}>✕</button>
          </div>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div style={{
            padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', gap: 10, background: 'rgba(16,185,129,0.04)',
          }}>
            <input
              value={newClaimText}
              onChange={e => setNewClaimText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addClaim()}
              placeholder="Enter claim text to track..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13,
                outline: 'none',
              }}
            />
            <button onClick={addClaim} style={{
              padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              border: '1px solid rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', cursor: 'pointer',
            }}>Add</button>
          </div>
        )}

        {/* Toolbar */}
        <div style={{
          padding: '10px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          background: 'rgba(0,0,0,0.1)',
        }}>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: 4 }}>
            {(['claims', 'timeline'] as const).map(mode => (
              <button key={mode} onClick={() => { setViewMode(mode); setSelectedClaimId(null); }} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: viewMode === mode ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                background: viewMode === mode ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                color: viewMode === mode ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}>
                {mode === 'claims' ? '📋 Claims' : '⏱ Timeline'}
              </button>
            ))}
          </div>

          {/* Status filter (claims view) */}
          {viewMode === 'claims' && (
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{
                padding: '6px 10px', borderRadius: 8, fontSize: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)', color: '#eaeaea',
                cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="validated">Validated</option>
              <option value="disputed">Disputed</option>
              <option value="needs-source">Needs Source</option>
              <option value="archived">Archived</option>
            </select>
          )}

          {/* Change type filter (timeline view) */}
          {viewMode === 'timeline' && (
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as ChangeType | 'all')}
              style={{
                padding: '6px 10px', borderRadius: 8, fontSize: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)', color: '#eaeaea',
                cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="all">All changes</option>
              {Object.entries(CHANGE_TYPE_INFO).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          )}

          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            {claims.length} tracked claims · {globalTimeline.length} changes
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {viewMode === 'claims' ? (
            /* Claims list + detail */
            <>
              {/* Claims list */}
              <div style={{
                width: selectedClaim ? '40%' : '100%',
                borderRight: selectedClaim ? '1px solid rgba(255,255,255,0.06)' : 'none',
                overflow: 'auto', padding: '12px',
                transition: 'width 0.3s ease',
              }}>
                {filteredClaims.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.4)' }}>
                    {claims.length === 0 ? 'No claims tracked yet. Click "+ Track Claim" to start.' : 'No claims match this filter.'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {filteredClaims.map(claim => (
                      <button key={claim.id}
                        onClick={() => setSelectedClaimId(selectedClaimId === claim.id ? null : claim.id)}
                        style={{
                          padding: '12px 14px', borderRadius: 12, textAlign: 'left',
                          border: selectedClaimId === claim.id
                            ? '1px solid rgba(99,102,241,0.4)'
                            : '1px solid rgba(255,255,255,0.06)',
                          background: selectedClaimId === claim.id
                            ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                          color: '#fff', cursor: 'pointer', width: '100%',
                          display: 'flex', flexDirection: 'column', gap: 6,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                            color: STATUS_COLORS[claim.status] || '#fff',
                            background: `${STATUS_COLORS[claim.status] || '#fff'}15`,
                            border: `1px solid ${STATUS_COLORS[claim.status] || '#fff'}30`,
                            textTransform: 'uppercase',
                          }}>{claim.status}</span>
                          {claim.claimType && (
                            <span style={{
                              fontSize: 10, color: 'rgba(255,255,255,0.4)',
                              background: 'rgba(255,255,255,0.05)', padding: '1px 6px',
                              borderRadius: 4,
                            }}>{claim.claimType}</span>
                          )}
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
                            {claim.history.length} changes
                          </span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                          {claim.currentText.length > 150 ? claim.currentText.slice(0, 150) + '…' : claim.currentText}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                          Created {formatTimestamp(claim.createdAt)} · Last change {formatTimestamp(claim.history[claim.history.length - 1].timestamp)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Claim detail */}
              {selectedClaim && (
                <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                      Claim History
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 12 }}>
                      {selectedClaim.currentText}
                    </div>
                    {/* Quick actions */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                      {(['draft', 'validated', 'disputed', 'needs-source', 'archived'] as const).map(s => (
                        <button key={s} onClick={() => recordChange(selectedClaim.id, 'status_changed', s)}
                          style={{
                            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            border: selectedClaim.status === s
                              ? `1px solid ${STATUS_COLORS[s]}60`
                              : '1px solid rgba(255,255,255,0.08)',
                            background: selectedClaim.status === s
                              ? `${STATUS_COLORS[s]}20` : 'rgba(255,255,255,0.03)',
                            color: selectedClaim.status === s
                              ? STATUS_COLORS[s] : 'rgba(255,255,255,0.4)',
                            cursor: 'pointer', textTransform: 'capitalize',
                          }}
                        >{s.replace('-', ' ')}</button>
                      ))}
                      <button onClick={() => deleteClaim(selectedClaim.id)} style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        border: '1px solid rgba(239,68,68,0.2)',
                        background: 'rgba(239,68,68,0.08)', color: '#fca5a5',
                        cursor: 'pointer', marginLeft: 'auto',
                      }}>🗑 Delete</button>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div style={{ position: 'relative', paddingLeft: 28 }}>
                    {/* Vertical line */}
                    <div style={{
                      position: 'absolute', left: 10, top: 0, bottom: 0, width: 2,
                      background: 'linear-gradient(180deg, rgba(99,102,241,0.3), rgba(99,102,241,0.05))',
                    }} />

                    {[...selectedClaim.history].reverse().map((change, idx) => {
                      const info = CHANGE_TYPE_INFO[change.changeType];
                      return (
                        <div key={change.id} style={{ position: 'relative', marginBottom: 16 }}>
                          {/* Dot */}
                          <div style={{
                            position: 'absolute', left: -22, top: 4, width: 12, height: 12,
                            borderRadius: '50%', background: info.color,
                            border: '2px solid rgba(16,18,30,1)',
                            boxShadow: `0 0 8px ${info.color}40`,
                          }} />
                          <div style={{
                            padding: '10px 14px', borderRadius: 10,
                            background: idx === 0 ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
                            border: idx === 0 ? '1px solid rgba(99,102,241,0.15)' : '1px solid rgba(255,255,255,0.04)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 14 }}>{info.icon}</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: info.color }}>{info.label}</span>
                              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
                                {formatTimestamp(change.timestamp)}
                              </span>
                            </div>
                            {change.previousValue && change.newValue && (
                              <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                                <div style={{ color: 'rgba(239,68,68,0.7)', textDecoration: 'line-through', marginBottom: 2 }}>
                                  {change.previousValue.length > 100 ? change.previousValue.slice(0, 100) + '…' : change.previousValue}
                                </div>
                                <div style={{ color: 'rgba(16,185,129,0.8)' }}>
                                  {change.newValue.length > 100 ? change.newValue.slice(0, 100) + '…' : change.newValue}
                                </div>
                              </div>
                            )}
                            {!change.previousValue && change.newValue && (
                              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                                {change.newValue.length > 150 ? change.newValue.slice(0, 150) + '…' : change.newValue}
                              </div>
                            )}
                            {change.notes && (
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, fontStyle: 'italic' }}>
                                {change.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Global timeline view */
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
              {globalTimeline.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.4)' }}>
                  No changes recorded yet.
                </div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: 28 }}>
                  <div style={{
                    position: 'absolute', left: 10, top: 0, bottom: 0, width: 2,
                    background: 'linear-gradient(180deg, rgba(99,102,241,0.3), rgba(99,102,241,0.05))',
                  }} />
                  {globalTimeline.slice(0, 100).map(change => {
                    const info = CHANGE_TYPE_INFO[change.changeType];
                    return (
                      <div key={change.id} style={{ position: 'relative', marginBottom: 12 }}>
                        <div style={{
                          position: 'absolute', left: -22, top: 4, width: 12, height: 12,
                          borderRadius: '50%', background: info.color,
                          border: '2px solid rgba(16,18,30,1)',
                        }} />
                        <div style={{
                          padding: '10px 14px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.04)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span>{info.icon}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: info.color }}>{info.label}</span>
                            <span style={{
                              fontSize: 11, color: 'rgba(255,255,255,0.5)',
                              background: 'rgba(255,255,255,0.05)', padding: '1px 6px',
                              borderRadius: 4, cursor: 'pointer',
                            }} onClick={() => { setViewMode('claims'); setSelectedClaimId(change.claimId); }}>
                              claim →
                            </span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
                              {formatTimestamp(change.timestamp)}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                            {change.claimText.length > 120 ? change.claimText.slice(0, 120) + '…' : change.claimText}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClaimChangelog;

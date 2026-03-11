/**
 * ClaimVerification Component
 * Allows users to extract and verify claims from text segments
 * Industry standard for research and fact-checking applications
 */

import React, { useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';

interface Claim {
  id: string;
  text: string;
  status: 'unverified' | 'verified' | 'disputed' | 'needs-source';
  confidence: number;
  sources: string[];
  notes: string;
  extractedFrom?: string;
}

interface ClaimVerificationProps {
  segmentText?: string;
  segmentId?: number;
  onClaimsUpdate?: (claims: Claim[]) => void;
}

export const ClaimVerification: React.FC<ClaimVerificationProps> = ({
  segmentText = '',
  segmentId,
  onClaimsUpdate,
}) => {
  const { isDark, colors } = useTheme();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [newClaimText, setNewClaimText] = useState('');
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);

  const generateId = () => `claim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const extractClaims = useCallback(async () => {
    if (!segmentText.trim()) return;
    
    setIsExtracting(true);
    
    // Simulate AI extraction - in production, this would call an AI API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple sentence-based extraction for demo
    const sentences = segmentText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 300);
    
    const extractedClaims: Claim[] = sentences.slice(0, 5).map(sentence => ({
      id: generateId(),
      text: sentence,
      status: 'unverified',
      confidence: Math.floor(Math.random() * 40) + 60,
      sources: [],
      notes: '',
      extractedFrom: segmentId?.toString(),
    }));
    
    setClaims(prev => [...prev, ...extractedClaims]);
    onClaimsUpdate?.([...claims, ...extractedClaims]);
    setIsExtracting(false);
  }, [segmentText, segmentId, claims, onClaimsUpdate]);

  const addManualClaim = useCallback(() => {
    if (!newClaimText.trim()) return;
    
    const newClaim: Claim = {
      id: generateId(),
      text: newClaimText.trim(),
      status: 'unverified',
      confidence: 0,
      sources: [],
      notes: '',
    };
    
    setClaims(prev => [...prev, newClaim]);
    onClaimsUpdate?.([...claims, newClaim]);
    setNewClaimText('');
  }, [newClaimText, claims, onClaimsUpdate]);

  const updateClaimStatus = useCallback((claimId: string, status: Claim['status']) => {
    setClaims(prev => prev.map(c => 
      c.id === claimId ? { ...c, status } : c
    ));
  }, []);

  const updateClaimNotes = useCallback((claimId: string, notes: string) => {
    setClaims(prev => prev.map(c => 
      c.id === claimId ? { ...c, notes } : c
    ));
  }, []);

  const addSource = useCallback((claimId: string, source: string) => {
    if (!source.trim()) return;
    setClaims(prev => prev.map(c => 
      c.id === claimId ? { ...c, sources: [...c.sources, source.trim()] } : c
    ));
  }, []);

  const removeClaim = useCallback((claimId: string) => {
    setClaims(prev => prev.filter(c => c.id !== claimId));
  }, []);

  const getStatusColor = (status: Claim['status']) => {
    switch (status) {
      case 'verified': return '#22c55e';
      case 'disputed': return '#ef4444';
      case 'needs-source': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: Claim['status']) => {
    switch (status) {
      case 'verified': return '✓';
      case 'disputed': return '✗';
      case 'needs-source': return '?';
      default: return '○';
    }
  };

  return (
    <div style={{
      background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.02)',
      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0,0,0,0.08)',
      borderRadius: '12px',
      padding: '20px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 600,
          color: colors.textPrimary,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          🔍 Claim Verification
          <span style={{
            fontSize: '12px',
            background: 'rgba(99, 102, 241, 0.2)',
            color: '#a5b4fc',
            padding: '2px 8px',
            borderRadius: '9999px',
          }}>
            {claims.length} claims
          </span>
        </h3>
        
        {segmentText && (
          <button
            onClick={extractClaims}
            disabled={isExtracting}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isExtracting ? 'wait' : 'pointer',
              opacity: isExtracting ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isExtracting ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
                Extracting...
              </>
            ) : (
              <>✨ Extract Claims</>
            )}
          </button>
        )}
      </div>

      {/* Add Manual Claim */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
      }}>
        <input
          type="text"
          value={newClaimText}
          onChange={(e) => setNewClaimText(e.target.value)}
          placeholder="Add a claim manually..."
          onKeyDown={(e) => e.key === 'Enter' && addManualClaim()}
          style={{
            flex: 1,
            padding: '10px 12px',
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.03)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0,0,0,0.1)',
            borderRadius: '8px',
            color: colors.textPrimary,
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <button
          onClick={addManualClaim}
          disabled={!newClaimText.trim()}
          style={{
            padding: '10px 16px',
            background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.06)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0,0,0,0.12)',
            borderRadius: '8px',
            color: colors.textPrimary,
            fontSize: '14px',
            cursor: newClaimText.trim() ? 'pointer' : 'not-allowed',
            opacity: newClaimText.trim() ? 1 : 0.5,
          }}
        >
          + Add
        </button>
      </div>

      {/* Claims List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {claims.length === 0 ? (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: colors.textMuted,
            fontSize: '14px',
          }}>
            No claims yet. Extract from text or add manually.
          </div>
        ) : (
          claims.map((claim) => (
            <div
              key={claim.id}
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0,0,0,0.01)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0,0,0,0.06)',
                borderRadius: '10px',
                padding: '14px',
                borderLeft: `3px solid ${getStatusColor(claim.status)}`,
              }}
            >
              {/* Claim Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    color: colors.textPrimary,
                    lineHeight: 1.5,
                  }}>
                    "{claim.text}"
                  </p>
                  
                  {/* Status Selector */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(['unverified', 'verified', 'disputed', 'needs-source'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateClaimStatus(claim.id, status)}
                        style={{
                          padding: '4px 10px',
                          background: claim.status === status 
                            ? `${getStatusColor(status)}20` 
                            : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.04)'),
                          border: `1px solid ${claim.status === status 
                            ? getStatusColor(status) 
                            : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.1)')}`,
                          borderRadius: '6px',
                          color: claim.status === status 
                            ? getStatusColor(status) 
                            : colors.textSecondary,
                          fontSize: '11px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        {getStatusIcon(status)} {status.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => setExpandedClaim(expandedClaim === claim.id ? null : claim.id)}
                    style={{
                      padding: '6px 10px',
                      background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.04)',
                      border: 'none',
                      borderRadius: '6px',
                      color: colors.textSecondary,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {expandedClaim === claim.id ? '▼' : '▶'}
                  </button>
                  <button
                    onClick={() => removeClaim(claim.id)}
                    style={{
                      padding: '6px 10px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fca5a5',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedClaim === claim.id && (
                <div style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0,0,0,0.06)',
                }}>
                  {/* Confidence */}
                  {claim.confidence > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '12px', color: colors.textMuted }}>
                        Extraction Confidence
                      </label>
                      <div style={{
                        marginTop: '4px',
                        height: '6px',
                        background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.08)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${claim.confidence}%`,
                          height: '100%',
                          background: claim.confidence > 80 ? '#22c55e' : claim.confidence > 60 ? '#f59e0b' : '#ef4444',
                          borderRadius: '3px',
                        }} />
                      </div>
                      <span style={{ fontSize: '11px', color: colors.textMuted }}>
                        {claim.confidence}%
                      </span>
                    </div>
                  )}

                  {/* Sources */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', color: colors.textMuted, display: 'block', marginBottom: '6px' }}>
                      Sources ({claim.sources.length})
                    </label>
                    {claim.sources.map((source, idx) => (
                      <div key={idx} style={{
                        padding: '6px 10px',
                        background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.02)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: colors.textSecondary,
                        marginBottom: '4px',
                      }}>
                        📎 {source}
                      </div>
                    ))}
                    <input
                      type="text"
                      placeholder="Add source URL or reference..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addSource(claim.id, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.02)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0,0,0,0.08)',
                        borderRadius: '6px',
                        color: colors.textPrimary,
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label style={{ fontSize: '12px', color: colors.textMuted, display: 'block', marginBottom: '6px' }}>
                      Notes
                    </label>
                    <textarea
                      value={claim.notes}
                      onChange={(e) => updateClaimNotes(claim.id, e.target.value)}
                      placeholder="Add verification notes..."
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.02)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0,0,0,0.08)',
                        borderRadius: '6px',
                        color: colors.textPrimary,
                        fontSize: '12px',
                        resize: 'vertical',
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {claims.length > 0 && (
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
        }}>
          {(['verified', 'disputed', 'needs-source', 'unverified'] as const).map((status) => {
            const count = claims.filter(c => c.status === status).length;
            return (
              <div key={status} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: getStatusColor(status),
                }}>
                  {count}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: colors.textMuted,
                  textTransform: 'capitalize',
                }}>
                  {status.replace('-', ' ')}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ClaimVerification;

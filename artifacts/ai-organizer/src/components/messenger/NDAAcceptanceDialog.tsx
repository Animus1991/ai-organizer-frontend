/**
 * NDAAcceptanceDialog - Terms acceptance before NDA-protected conversation
 */
import React, { useState } from 'react';
import { Shield, Lock, FileText, CheckCircle } from 'lucide-react';

interface NDAAcceptanceDialogProps {
  terms: string;
  proposedBy: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function NDAAcceptanceDialog({ terms, proposedBy, onAccept, onDecline }: NDAAcceptanceDialogProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'hsl(var(--background) / 0.95)',
      backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '340px', width: '100%',
        background: 'hsl(var(--card))', borderRadius: '16px',
        border: '1px solid hsl(var(--border))',
        boxShadow: '0 8px 32px hsl(var(--foreground) / 0.15)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', textAlign: 'center',
          background: 'linear-gradient(135deg, hsl(var(--destructive) / 0.08), hsl(38 92% 50% / 0.08))',
          borderBottom: '1px solid hsl(var(--border))',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'hsl(var(--destructive) / 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px',
          }}>
            <Shield size={24} style={{ color: 'hsl(var(--destructive))' }} />
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
            🔒 NDA Mode
          </div>
          <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
            Ο/Η <strong>{proposedBy}</strong> ζητά εμπιστευτική συνομιλία
          </div>
        </div>

        {/* Terms */}
        <div style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <FileText size={13} style={{ color: 'hsl(var(--primary))' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase' }}>
              Όροι Εμπιστευτικότητας
            </span>
          </div>
          <div style={{
            fontSize: '12px', lineHeight: '1.6', color: 'hsl(var(--muted-foreground))',
            background: 'hsl(var(--muted) / 0.3)', borderRadius: '8px',
            padding: '10px 12px', maxHeight: '120px', overflowY: 'auto',
            border: '1px solid hsl(var(--border))',
          }}>
            {terms}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            marginTop: '10px', padding: '6px 8px',
            background: 'hsl(38 92% 50% / 0.06)', borderRadius: '6px',
            fontSize: '10.5px', color: 'hsl(38 92% 50%)',
          }}>
            <Lock size={11} />
            Τα μηνύματα θα φέρουν watermark και κρυπτογράφηση
          </div>
        </div>

        {/* Checkbox + Actions */}
        <div style={{ padding: '0 20px 16px' }}>
          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px',
            cursor: 'pointer', marginBottom: '12px',
          }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ marginTop: '2px', accentColor: 'hsl(var(--primary))' }}
            />
            <span style={{ fontSize: '11px', color: 'hsl(var(--foreground))', lineHeight: '1.5' }}>
              Αποδέχομαι τους όρους εμπιστευτικότητας και κατανοώ ότι τα μηνύματα καταγράφονται με audit trail.
            </span>
          </label>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onDecline}
              style={{
                flex: 1, padding: '8px', borderRadius: '8px',
                border: '1px solid hsl(var(--border))', background: 'transparent',
                color: 'hsl(var(--muted-foreground))', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Απόρριψη
            </button>
            <button
              onClick={onAccept}
              disabled={!agreed}
              style={{
                flex: 1, padding: '8px', borderRadius: '8px',
                border: 'none',
                background: agreed ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                color: agreed ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                fontSize: '12px', fontWeight: 600,
                cursor: agreed ? 'pointer' : 'not-allowed',
                opacity: agreed ? 1 : 0.6,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <CheckCircle size={13} /> Αποδοχή
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

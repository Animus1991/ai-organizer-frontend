/**
 * NDAIndicator - Encrypted channel bar + watermark overlay for NDA messages
 */
import React from 'react';
import { Lock, Shield } from 'lucide-react';
import type { NDASettings } from './types';

interface NDAIndicatorProps {
  settings: NDASettings;
  participantCount: number;
}

export function NDABanner({ settings, participantCount }: NDAIndicatorProps) {
  const allAccepted = settings.acceptedBy.length >= participantCount;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      padding: '4px 10px',
      background: 'linear-gradient(90deg, hsl(var(--destructive) / 0.06), hsl(38 92% 50% / 0.06))',
      borderBottom: '1px solid hsl(var(--destructive) / 0.15)',
    }}>
      <Lock size={11} style={{ color: 'hsl(var(--destructive))' }} />
      <span style={{
        fontSize: '10px', fontWeight: 600,
        color: 'hsl(var(--destructive))',
        letterSpacing: '0.5px', textTransform: 'uppercase',
      }}>
        NDA Protected Channel
      </span>
      <span style={{
        fontSize: '9px',
        color: allAccepted ? 'hsl(142 71% 45%)' : 'hsl(38 92% 50%)',
        fontWeight: 500,
      }}>
        • {allAccepted ? 'Όλοι αποδέχτηκαν' : `${settings.acceptedBy.length}/${participantCount} αποδοχές`}
      </span>
      <div style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: 'hsl(var(--destructive))',
        animation: 'ndaPulse 2s infinite',
      }} />
      <style>{`
        @keyframes ndaPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 hsl(var(--destructive) / 0.4); }
          50% { opacity: 0.7; box-shadow: 0 0 0 4px hsl(var(--destructive) / 0); }
        }
      `}</style>
    </div>
  );
}

interface NDAWatermarkProps {
  userName: string;
}

export function NDAWatermark({ userName }: NDAWatermarkProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 1,
    }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: `${15 + i * 18}%`,
          left: '-10%',
          width: '120%',
          fontSize: '11px',
          fontWeight: 600,
          color: 'hsl(var(--foreground) / 0.03)',
          transform: 'rotate(-25deg)',
          whiteSpace: 'nowrap',
          letterSpacing: '2px',
          userSelect: 'none',
        }}>
          {Array.from({ length: 5 }).map((_, j) => (
            <span key={j} style={{ marginRight: '40px' }}>
              CONFIDENTIAL • {userName} • NDA
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

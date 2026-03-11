/**
 * BlockchainToggle - UI for enabling/managing blockchain verification in chat
 */
import React, { useState } from 'react';
import { Shield, ShieldCheck, ShieldAlert, Lock, Unlock, Info } from 'lucide-react';
import type { BlockchainSettings } from './types';

interface BlockchainToggleProps {
  settings: BlockchainSettings;
  currentUserId: string;
  otherParticipantName: string;
  isGroup: boolean;
  onToggle: (enabled: boolean) => void;
  onClose: () => void;
}

export function BlockchainToggle({ settings, currentUserId, otherParticipantName, isGroup, onToggle, onClose }: BlockchainToggleProps) {
  const [showInfo, setShowInfo] = useState(false);

  const isMeEnabled = settings.enabledBy.includes(currentUserId);
  const isMutual = settings.acceptedByAll;

  return (
    <div style={{
      position: 'absolute', top: '50px', right: '8px',
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '12px', padding: '14px',
      boxShadow: '0 8px 32px hsl(var(--foreground) / 0.15)',
      zIndex: 50, width: '280px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        {settings.enabled ? (
          <ShieldCheck size={20} style={{ color: 'hsl(142 71% 45%)' }} />
        ) : (
          <Shield size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
        )}
        <span style={{ fontWeight: 700, fontSize: '13px', color: 'hsl(var(--foreground))' }}>
          Blockchain Verification
        </span>
        <button onClick={() => setShowInfo(!showInfo)} style={infoBtn}>
          <Info size={14} />
        </button>
        <button onClick={onClose} style={{ ...infoBtn, marginLeft: 'auto' }}>✕</button>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div style={{
          background: 'hsl(var(--muted) / 0.4)', borderRadius: '8px',
          padding: '10px', marginBottom: '10px', fontSize: '11.5px',
          color: 'hsl(var(--muted-foreground))', lineHeight: '1.5',
        }}>
          <strong style={{ color: 'hsl(var(--foreground))' }}>Τι κάνει:</strong> Κάθε μήνυμα λαμβάνει κρυπτογραφικό hash (SHA-256) με timestamp, 
          δημιουργώντας αμετάβλητη απόδειξη πνευματικής ιδιοκτησίας.
          <br /><br />
          <strong style={{ color: 'hsl(var(--foreground))' }}>Λειτουργίες:</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
            <li><strong>Αμοιβαία:</strong> Και οι δύο συμφωνούν — όλα τα μηνύματα καταγράφονται</li>
            <li><strong>Μονομερής:</strong> Μόνο τα δικά σας μηνύματα αποθηκεύονται on-chain</li>
          </ul>
        </div>
      )}

      {/* Toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 0', borderBottom: '1px solid hsl(var(--border) / 0.5)',
      }}>
        <span style={{ fontSize: '12.5px', color: 'hsl(var(--foreground))' }}>
          Ενεργοποίηση
        </span>
        <button
          onClick={() => onToggle(!isMeEnabled)}
          style={{
            width: '40px', height: '22px', borderRadius: '11px',
            background: isMeEnabled ? 'hsl(142 71% 45%)' : 'hsl(var(--muted))',
            border: 'none', cursor: 'pointer', position: 'relative',
            transition: 'background 0.2s',
          }}
        >
          <div style={{
            width: '18px', height: '18px', borderRadius: '50%',
            background: 'white',
            position: 'absolute', top: '2px',
            left: isMeEnabled ? '20px' : '2px',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px hsl(var(--foreground) / 0.2)',
          }} />
        </button>
      </div>

      {/* Status */}
      <div style={{ marginTop: '10px' }}>
        {isMeEnabled && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 8px', borderRadius: '6px',
            background: isMutual ? 'hsl(142 71% 45% / 0.1)' : 'hsl(38 92% 50% / 0.1)',
            fontSize: '11.5px',
          }}>
            {isMutual ? (
              <>
                <Lock size={13} style={{ color: 'hsl(142 71% 45%)' }} />
                <span style={{ color: 'hsl(142 71% 45%)' }}>
                  Αμοιβαία επαλήθευση ενεργή
                </span>
              </>
            ) : (
              <>
                <Unlock size={13} style={{ color: 'hsl(38 92% 50%)' }} />
                <span style={{ color: 'hsl(38 92% 50%)' }}>
                  Μονομερής — αναμονή αποδοχής από {isGroup ? 'μέλη' : otherParticipantName}
                </span>
              </>
            )}
          </div>
        )}

        {!isMeEnabled && !settings.enabled && (
          <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', textAlign: 'center', padding: '4px' }}>
            Ανενεργό — ενεργοποιήστε για proof-of-contribution
          </div>
        )}
      </div>

      {/* Audit trail indicator */}
      {settings.enabled && (
        <div style={{
          marginTop: '10px', padding: '8px',
          background: 'hsl(var(--muted) / 0.3)', borderRadius: '8px',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'hsl(142 71% 45%)',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
            Audit trail: καταγραφή ενεργή
          </span>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

const infoBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: 'hsl(var(--muted-foreground))', display: 'flex',
  alignItems: 'center', padding: '2px',
};

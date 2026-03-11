import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export type ReportTarget = { type: 'user' | 'post' | 'comment'; id: string; name: string; };

const REPORT_REASONS = [
  'Spam or misleading content',
  'Harassment or hate speech',
  'Plagiarism or academic misconduct',
  'Inappropriate or offensive content',
  'Impersonation',
  'Misinformation',
  'Other',
];

const SK_BLOCKED = 'blocked_users_v1';
const SK_REPORTS = 'reports_v1';

function loadBlocked(): string[] {
  try { const r = localStorage.getItem(SK_BLOCKED); if (r) return JSON.parse(r); } catch {} return [];
}
function saveBlocked(ids: string[]) { try { localStorage.setItem(SK_BLOCKED, JSON.stringify(ids)); } catch {} }
function addReport(target: ReportTarget, reason: string, detail: string) {
  try {
    const existing = JSON.parse(localStorage.getItem(SK_REPORTS) || '[]');
    existing.push({ ...target, reason, detail, ts: Date.now() });
    localStorage.setItem(SK_REPORTS, JSON.stringify(existing));
  } catch {}
}

export function useBlockList() {
  const [blocked, setBlocked] = useState<string[]>(loadBlocked);
  const isBlocked = (id: string) => blocked.includes(id);
  const block = (id: string) => {
    const next = blocked.includes(id) ? blocked : [...blocked, id];
    setBlocked(next); saveBlocked(next);
  };
  const unblock = (id: string) => {
    const next = blocked.filter(x => x !== id);
    setBlocked(next); saveBlocked(next);
  };
  return { blocked, isBlocked, block, unblock };
}

interface ReportBlockModalProps {
  target: ReportTarget;
  onClose: () => void;
  onBlock?: (id: string) => void;
}

export function ReportBlockModal({ target, onClose, onBlock }: ReportBlockModalProps) {
  const { isDark, colors } = useTheme();
  const [view, setView] = useState<'menu' | 'report' | 'done'>('menu');
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [blocked, setBlocked] = useState(() => loadBlocked().includes(target.id));

  const bdr = colors.borderPrimary;
  const txt = colors.textPrimary;
  const mut = colors.textSecondary;
  const cbg = isDark ? '#1a1a2e' : '#fff';

  const handleBlock = () => {
    const current = loadBlocked();
    const next = current.includes(target.id) ? current.filter(x => x !== target.id) : [...current, target.id];
    saveBlocked(next);
    setBlocked(!blocked);
    onBlock?.(target.id);
  };

  const handleReport = () => {
    if (!reason) return;
    addReport(target, reason, detail);
    setView('done');
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', background: cbg, borderRadius: '16px', border: `1px solid ${bdr}`, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: txt }}>
            {view === 'done' ? '✅ Report Submitted' : view === 'report' ? '🚩 Report Content' : `⋯ Actions for ${target.name}`}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: mut, fontSize: '18px', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {view === 'done' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🛡️</div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: txt, marginBottom: '6px' }}>Thank you for your report</div>
              <div style={{ fontSize: '13px', color: mut, lineHeight: 1.6 }}>Our team will review this and take appropriate action. Reports are confidential.</div>
              <button onClick={onClose} style={{ marginTop: '16px', padding: '9px 24px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Done</button>
            </div>
          )}

          {view === 'menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={{ margin: '0 0 10px', fontSize: '12px', color: mut }}>
                {target.type === 'user' ? `Actions for @${target.name}` : `Actions for this ${target.type}`}
              </p>
              <button onClick={() => setView('report')}
                style={{ padding: '12px 14px', borderRadius: '10px', border: `1px solid ${bdr}`, background: 'transparent', color: '#f97316', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🚩 Report {target.type === 'user' ? 'User' : 'Content'}
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: mut, fontWeight: 400 }}>Flag for review</span>
              </button>
              {target.type === 'user' && (
                <button onClick={handleBlock}
                  style={{ padding: '12px 14px', borderRadius: '10px', border: `1px solid ${bdr}`, background: blocked ? 'rgba(239,68,68,0.06)' : 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  🚫 {blocked ? 'Unblock User' : 'Block User'}
                  <span style={{ marginLeft: 'auto', fontSize: '11px', color: mut, fontWeight: 400 }}>{blocked ? 'Currently blocked' : "They won't see your content"}</span>
                </button>
              )}
              <button onClick={onClose}
                style={{ padding: '10px 14px', borderRadius: '10px', border: `1px solid ${bdr}`, background: 'transparent', color: mut, cursor: 'pointer', fontSize: '13px', textAlign: 'left' }}>
                Cancel
              </button>
            </div>
          )}

          {view === 'report' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: mut }}>Select a reason for your report. Your report is anonymous.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {REPORT_REASONS.map(r => (
                  <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '9px', border: `1px solid ${reason === r ? 'rgba(239,68,68,0.4)' : bdr}`, background: reason === r ? 'rgba(239,68,68,0.06)' : 'transparent', cursor: 'pointer' }}>
                    <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} style={{ accentColor: '#ef4444' }}/>
                    <span style={{ fontSize: '13px', color: txt }}>{r}</span>
                  </label>
                ))}
              </div>
              <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={3}
                placeholder="Additional details (optional)…"
                style={{ padding: '9px 12px', borderRadius: '9px', border: `1px solid ${bdr}`, background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', color: txt, fontSize: '12px', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}/>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setView('menu')} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${bdr}`, background: 'transparent', color: mut, cursor: 'pointer', fontSize: '12px' }}>Back</button>
                <button onClick={handleReport} disabled={!reason}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: reason ? '#ef4444' : 'rgba(239,68,68,0.3)', color: '#fff', cursor: reason ? 'pointer' : 'default', fontWeight: 600, fontSize: '12px' }}>
                  Submit Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Compact trigger button to embed in cards/posts ────────────────────────────
interface ReportBlockButtonProps {
  target: ReportTarget;
  style?: React.CSSProperties;
}
export function ReportBlockButton({ target, style }: ReportBlockButtonProps) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  const isBlocked = loadBlocked().includes(target.id);
  return (
    <>
      <button onClick={e => { e.stopPropagation(); setOpen(true); }}
        title="More actions"
        style={{ padding: '4px 8px', borderRadius: '7px', border: `1px solid ${colors.borderPrimary}`, background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: '14px', lineHeight: 1, ...style }}>
        {isBlocked ? '🚫' : '⋯'}
      </button>
      {open && <ReportBlockModal target={target} onClose={() => setOpen(false)} />}
    </>
  );
}
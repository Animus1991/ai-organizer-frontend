/**
 * NDAExportAuditTrail - Generates and exports NDA audit trail as downloadable HTML/PDF
 */
import React from 'react';
import type { Message, Conversation } from './types';
import { MESSAGE_TAG_CONFIG } from './types';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

interface ExportData {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
}

function generateAuditHTML(data: ExportData): string {
  const { conversation, messages, currentUserId } = data;
  const participants = conversation.participants.map(p => p.name).join(', ');
  const now = new Date();
  const isNDA = conversation.nda.enabled;
  const isBlockchain = conversation.blockchain.enabled;

  const messageRows = messages
    .filter(m => !m.deleted)
    .map(m => {
      const sender = conversation.participants.find(p => p.id === m.senderId);
      const tagCfg = m.tag ? MESSAGE_TAG_CONFIG[m.tag] : null;
      return `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;font-variant-numeric:tabular-nums;font-size:12px;color:#666;white-space:nowrap;">
            ${format(m.timestamp, 'dd/MM/yyyy HH:mm:ss')}
          </td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;font-weight:600;">
            ${sender?.name || 'Unknown'}
          </td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;">
            ${tagCfg ? `<span style="background:hsl(${tagCfg.color}/0.15);color:hsl(${tagCfg.color});padding:1px 5px;border-radius:3px;font-size:10px;font-weight:600;margin-right:6px;">${tagCfg.icon} ${tagCfg.label}</span>` : ''}
            ${m.content}
          </td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:10px;color:#999;font-family:monospace;">
            ${m.blockchainProof ? `✅ ${m.blockchainProof.hash.substring(0, 16)}...` : '—'}
          </td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:10px;color:#999;">
            ${m.pinned ? '📌' : ''} ${m.reactions.length > 0 ? m.reactions.map(r => r.emoji).join('') : ''}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
  <title>Audit Trail — ${conversation.name || participants}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 30px; color: #1a1a1a; }
    .watermark { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1; }
    .watermark span { position: absolute; font-size: 48px; font-weight: 800; color: rgba(0,0,0,0.02); transform: rotate(-30deg); white-space: nowrap; }
    .header { border-bottom: 3px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 20px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 6px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px 10px; background: #f5f5f5; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; border-bottom: 2px solid #ddd; }
    .footer { margin-top: 30px; padding-top: 16px; border-top: 2px solid #1a1a1a; font-size: 11px; color: #666; }
    @media print { .watermark span { color: rgba(0,0,0,0.03); } body { padding: 15px; } }
  </style>
</head>
<body>
  ${isNDA ? `
  <div class="watermark">
    ${Array.from({ length: 8 }).map((_, i) => `<span style="top:${10 + i * 13}%;left:-5%;">CONFIDENTIAL • NDA PROTECTED • AUDIT TRAIL</span>`).join('')}
  </div>
  ` : ''}

  <div class="header">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <h1 style="margin:0 0 4px;font-size:20px;">📋 Audit Trail Report</h1>
        <div style="font-size:13px;color:#666;">Εμπιστευτική Αναφορά Συνομιλίας</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;color:#999;">Ημ/νία Εξαγωγής</div>
        <div style="font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;">${format(now, 'dd/MM/yyyy HH:mm:ss')}</div>
      </div>
    </div>

    <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
      ${isNDA ? '<span class="badge" style="background:#fee;color:#c00;">🔒 NDA PROTECTED</span>' : ''}
      ${isBlockchain ? '<span class="badge" style="background:#e8f5e9;color:#2e7d32;">🔗 BLOCKCHAIN VERIFIED</span>' : ''}
      <span class="badge" style="background:#f5f5f5;color:#666;">💬 ${messages.filter(m => !m.deleted).length} μηνύματα</span>
      ${messages.filter(m => m.blockchainProof).length > 0 ? `<span class="badge" style="background:#e8f5e9;color:#2e7d32;">✅ ${messages.filter(m => m.blockchainProof).length} verified</span>` : ''}
    </div>

    <div style="margin-top:12px;">
      <div style="font-size:11px;color:#999;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Συμμετέχοντες</div>
      <div style="font-size:13px;">${participants}</div>
    </div>

    ${isNDA && conversation.nda.activatedAt ? `
    <div style="margin-top:8px;">
      <div style="font-size:11px;color:#999;text-transform:uppercase;font-weight:700;margin-bottom:4px;">NDA Ενεργοποίηση</div>
      <div style="font-size:12px;">${format(conversation.nda.activatedAt, 'dd/MM/yyyy HH:mm:ss')} — Αποδοχές: ${conversation.nda.acceptedBy.length}/${conversation.participants.length}</div>
    </div>
    ` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Αποστολέας</th>
        <th>Μήνυμα</th>
        <th>Blockchain Hash</th>
        <th>Meta</th>
      </tr>
    </thead>
    <tbody>
      ${messageRows}
    </tbody>
  </table>

  <div class="footer">
    <div style="display:flex;justify-content:space-between;">
      <div>
        <strong>Research Chat — Audit Trail</strong><br>
        Αυτό το έγγραφο δημιουργήθηκε αυτόματα και περιέχει ${isNDA ? 'εμπιστευτικές' : ''} πληροφορίες.
        ${isNDA ? '<br><strong style="color:#c00;">⚠️ Απαγορεύεται η κοινοποίηση χωρίς γραπτή συγκατάθεση.</strong>' : ''}
      </div>
      <div style="text-align:right;font-variant-numeric:tabular-nums;">
        Report ID: ${crypto.randomUUID?.() || Math.random().toString(36).substring(2, 10)}<br>
        Generated: ${format(now, 'yyyy-MM-dd\'T\'HH:mm:ssXXX')}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export function exportAuditTrail(data: ExportData) {
  const html = generateAuditHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-trail-${data.conversation.id}-${format(new Date(), 'yyyyMMdd-HHmmss')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

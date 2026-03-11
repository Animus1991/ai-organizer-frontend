/**
 * ChatExport - Export AI chat conversations in multiple formats
 * Supports Markdown, plain text, and HTML/PDF-ready formats
 */
import type { ChatMessage } from './types';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

interface ExportOptions {
  providerType: string;
  messages: ChatMessage[];
  format: 'markdown' | 'text' | 'html' | 'bibtex';
  title?: string;
  includeTimestamps?: boolean;
  includeMetadata?: boolean;
}

function formatTimestamp(date: Date): string {
  return format(date, 'dd MMM yyyy, HH:mm:ss', { locale: el });
}

export function exportAsMarkdown(options: ExportOptions): string {
  const { providerType, messages, title, includeTimestamps = true, includeMetadata = true } = options;
  const lines: string[] = [];
  
  lines.push(`# ${title || `AI Chat — ${providerType}`}`);
  lines.push('');
  
  if (includeMetadata) {
    lines.push(`**Provider:** ${providerType}`);
    lines.push(`**Messages:** ${messages.length}`);
    lines.push(`**Exported:** ${formatTimestamp(new Date())}`);
    if (messages.length > 0) {
      lines.push(`**Period:** ${formatTimestamp(messages[0].timestamp)} — ${formatTimestamp(messages[messages.length - 1].timestamp)}`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }
  
  messages.forEach(msg => {
    const role = msg.role === 'user' ? '🧑 **User**' : msg.role === 'assistant' ? '🤖 **Assistant**' : '⚙️ **System**';
    const time = includeTimestamps ? ` _(${formatTimestamp(msg.timestamp)})_` : '';
    
    lines.push(`### ${role}${time}`);
    lines.push('');
    lines.push(msg.content);
    lines.push('');
  });
  
  return lines.join('\n');
}

export function exportAsText(options: ExportOptions): string {
  const { providerType, messages, title, includeTimestamps = true } = options;
  const lines: string[] = [];
  
  lines.push(`=== ${title || `AI Chat — ${providerType}`} ===`);
  lines.push(`Exported: ${formatTimestamp(new Date())}`);
  lines.push(`Messages: ${messages.length}`);
  lines.push('');
  lines.push('═'.repeat(50));
  lines.push('');
  
  messages.forEach(msg => {
    const role = msg.role.toUpperCase();
    const time = includeTimestamps ? ` [${formatTimestamp(msg.timestamp)}]` : '';
    lines.push(`[${role}]${time}`);
    lines.push(msg.content);
    lines.push('');
    lines.push('-'.repeat(40));
    lines.push('');
  });
  
  return lines.join('\n');
}

export function exportAsHTML(options: ExportOptions): string {
  const { providerType, messages, title, includeTimestamps = true } = options;
  
  const msgHtml = messages.map(msg => {
    const isUser = msg.role === 'user';
    const time = includeTimestamps ? `<span style="font-size:10px;color:#888;margin-top:4px;display:block">${formatTimestamp(msg.timestamp)}</span>` : '';
    return `
      <div style="display:flex;justify-content:${isUser ? 'flex-end' : 'flex-start'};margin:8px 0">
        <div style="max-width:80%;padding:12px 16px;border-radius:12px;background:${isUser ? '#e3f2fd' : '#f5f5f5'};font-size:14px;line-height:1.6">
          <div style="font-size:10px;font-weight:700;color:${isUser ? '#1565c0' : '#4caf50'};margin-bottom:4px">
            ${isUser ? '🧑 User' : '🤖 Assistant'}
          </div>
          <div style="white-space:pre-wrap">${msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          ${time}
        </div>
      </div>`;
  }).join('\n');
  
  return `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
  <title>${title || `AI Chat — ${providerType}`}</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #fff; }
    h1 { font-size: 24px; border-bottom: 2px solid #1565c0; padding-bottom: 8px; }
    .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${title || `AI Chat — ${providerType}`}</h1>
  <div class="meta">
    Provider: ${providerType} | Messages: ${messages.length} | Exported: ${formatTimestamp(new Date())}
  </div>
  ${msgHtml}
  <div style="margin-top:20px;padding-top:10px;border-top:1px solid #ddd;font-size:10px;color:#999;text-align:center">
    Exported from Research Platform — ${formatTimestamp(new Date())}
  </div>
</body>
</html>`;
}

export function exportAsBibTeX(options: ExportOptions): string {
  const { providerType, messages, title } = options;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.toLocaleString('en', { month: 'long' }).toLowerCase();
  
  return `@misc{ai_chat_${providerType}_${Date.now()},
  title = {${title || `AI Chat Conversation — ${providerType}`}},
  author = {AI Assistant (${providerType})},
  year = {${year}},
  month = {${month}},
  note = {AI-assisted conversation with ${messages.length} messages. Exported on ${formatTimestamp(now)}.},
  howpublished = {AI Chat Platform},
}`;
}

export function downloadExport(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportConversation(options: ExportOptions): void {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
  const baseName = `chat_${options.providerType}_${timestamp}`;
  
  switch (options.format) {
    case 'markdown':
      downloadExport(exportAsMarkdown(options), `${baseName}.md`, 'text/markdown');
      break;
    case 'text':
      downloadExport(exportAsText(options), `${baseName}.txt`, 'text/plain');
      break;
    case 'html':
      downloadExport(exportAsHTML(options), `${baseName}.html`, 'text/html');
      break;
    case 'bibtex':
      downloadExport(exportAsBibTeX(options), `${baseName}.bib`, 'application/x-bibtex');
      break;
  }
}

/**
 * AISummaryPanel - AI-powered conversation summary
 * Generates bullet-point summaries with key decisions, action items, and research insights
 * Uses local NLP heuristics (no external API required)
 */
import React, { useState, useCallback, useMemo } from 'react';
import { Sparkles, Copy, Download, X, RefreshCw, CheckCircle2, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import type { Message, Conversation, MessageTag, MESSAGE_TAG_CONFIG } from './types';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

interface AISummaryPanelProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  onClose: () => void;
}

interface SummarySection {
  icon: React.ReactNode;
  title: string;
  items: string[];
  color: string;
}

// Keywords that indicate decisions
const DECISION_KEYWORDS = [
  'αποφασίσαμε', 'αποφάσισα', 'decided', 'decision', 'agreed', 'συμφωνήσαμε',
  'θα κάνουμε', 'θα χρησιμοποιήσουμε', 'we will', 'let\'s go with', 'final',
  'οριστικό', 'τελικά', 'confirmed', 'approved', 'εγκρίθηκε',
];

// Keywords that indicate action items
const ACTION_KEYWORDS = [
  'πρέπει να', 'θα στείλω', 'θα φέρω', 'θα κάνω', 'θα δοκιμάσω',
  'need to', 'should', 'must', 'will send', 'todo', 'action',
  'ανάθεση', 'deadline', 'μέχρι', 'αύριο', 'tomorrow', 'next week',
  'στείλε μου', 'send me', 'prepare', 'ετοίμασε',
];

// Keywords that indicate hypotheses/ideas
const IDEA_KEYWORDS = [
  'ιδέα', 'πρόταση', 'υπόθεση', 'hypothesis', 'idea', 'proposal',
  'maybe', 'ίσως', 'what if', 'τι αν', 'could we', 'θα μπορούσαμε',
  'suggest', 'προτείνω', 'imagine', 'concept',
];

// Keywords that indicate results
const RESULT_KEYWORDS = [
  'αποτέλεσμα', 'result', 'finding', 'εύρημα', 'accuracy', 'performance',
  'benchmark', 'score', 'metric', 'δεδομένα', 'data shows', 'achieved',
  'F1', 'precision', 'recall', 'loss', 'epoch',
];

function classifyMessage(msg: Message, participantNames: Record<string, string>): {
  isDecision: boolean;
  isAction: boolean;
  isIdea: boolean;
  isResult: boolean;
} {
  const content = msg.content.toLowerCase();
  return {
    isDecision: DECISION_KEYWORDS.some(k => content.includes(k)) || msg.tag === 'action-item',
    isAction: ACTION_KEYWORDS.some(k => content.includes(k)) || msg.tag === 'action-item',
    isIdea: IDEA_KEYWORDS.some(k => content.includes(k)) || msg.tag === 'hypothesis' || msg.tag === 'idea',
    isResult: RESULT_KEYWORDS.some(k => content.includes(k)) || msg.tag === 'result',
  };
}

function truncate(text: string, maxLen: number = 120): string {
  // Remove code blocks and tables for summary
  const cleaned = text
    .replace(/```[\s\S]*?```/g, '[code]')
    .replace(/\$\$[\s\S]*?\$\$/g, '[formula]')
    .replace(/\|[^\n]+\|/g, '[table]')
    .replace(/\n+/g, ' ')
    .trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.substring(0, maxLen) + '...';
}

export function AISummaryPanel({ conversation, messages, currentUserId, onClose }: AISummaryPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const participantNames: Record<string, string> = useMemo(() => {
    const names: Record<string, string> = {};
    conversation.participants.forEach(p => { names[p.id] = p.name; });
    return names;
  }, [conversation.participants]);

  const summary = useMemo(() => {
    if (messages.length === 0) return null;

    const decisions: string[] = [];
    const actions: string[] = [];
    const ideas: string[] = [];
    const results: string[] = [];
    const topics: Set<string> = new Set();

    messages.forEach(msg => {
      if (msg.deleted) return;
      const sender = participantNames[msg.senderId] || 'Unknown';
      const cls = classifyMessage(msg, participantNames);

      if (cls.isDecision) {
        decisions.push(`${sender}: ${truncate(msg.content, 100)}`);
      }
      if (cls.isAction) {
        actions.push(`${sender}: ${truncate(msg.content, 100)}`);
      }
      if (cls.isIdea) {
        ideas.push(`${sender}: ${truncate(msg.content, 100)}`);
      }
      if (cls.isResult) {
        results.push(`${sender}: ${truncate(msg.content, 100)}`);
      }

      // Extract topic keywords from tagged messages
      if (msg.tag) {
        const words = msg.content.split(/\s+/).filter(w => w.length > 5);
        words.slice(0, 3).forEach(w => topics.add(w.replace(/[^a-zA-Zα-ωΑ-Ω]/g, '')));
      }
    });

    // Overview stats
    const timeRange = messages.length > 1
      ? `${format(messages[0].timestamp, 'dd MMM HH:mm', { locale: el })} — ${format(messages[messages.length - 1].timestamp, 'dd MMM HH:mm', { locale: el })}`
      : format(messages[0].timestamp, 'dd MMM HH:mm', { locale: el });

    const uniqueSenders = new Set(messages.map(m => m.senderId)).size;
    const taggedCount = messages.filter(m => m.tag).length;
    const pinnedCount = messages.filter(m => m.pinned).length;
    const blockchainCount = messages.filter(m => m.blockchainProof).length;

    return {
      timeRange,
      totalMessages: messages.length,
      uniqueSenders,
      taggedCount,
      pinnedCount,
      blockchainCount,
      decisions: decisions.slice(0, 5),
      actions: actions.slice(0, 5),
      ideas: ideas.slice(0, 5),
      results: results.slice(0, 5),
      topics: Array.from(topics).slice(0, 8),
    };
  }, [messages, participantNames]);

  const handleRegenerate = useCallback(() => {
    setIsGenerating(true);
    // Simulate regeneration with slight delay
    setTimeout(() => setIsGenerating(false), 800);
  }, []);

  const getSummaryText = useCallback(() => {
    if (!summary) return '';
    const lines: string[] = [];
    lines.push(`📊 Σύνοψη Συνομιλίας — ${conversation.name || participantNames[conversation.participants.find(p => p.id !== currentUserId)?.id || ''] || 'Chat'}`);
    lines.push(`Περίοδος: ${summary.timeRange}`);
    lines.push(`Μηνύματα: ${summary.totalMessages} | Συμμετέχοντες: ${summary.uniqueSenders}`);
    lines.push('');
    if (summary.decisions.length > 0) {
      lines.push('🎯 Αποφάσεις:');
      summary.decisions.forEach(d => lines.push(`  • ${d}`));
      lines.push('');
    }
    if (summary.actions.length > 0) {
      lines.push('✅ Action Items:');
      summary.actions.forEach(a => lines.push(`  • ${a}`));
      lines.push('');
    }
    if (summary.ideas.length > 0) {
      lines.push('💡 Ιδέες & Υποθέσεις:');
      summary.ideas.forEach(i => lines.push(`  • ${i}`));
      lines.push('');
    }
    if (summary.results.length > 0) {
      lines.push('📊 Αποτελέσματα:');
      summary.results.forEach(r => lines.push(`  • ${r}`));
    }
    return lines.join('\n');
  }, [summary, conversation, participantNames, currentUserId]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(getSummaryText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [getSummaryText]);

  const handleDownload = useCallback(() => {
    const text = getSummaryText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-${conversation.id}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getSummaryText, conversation.id]);

  if (!summary) return null;

  const sections: SummarySection[] = [
    { icon: <Target size={13} />, title: 'Αποφάσεις', items: summary.decisions, color: 'var(--primary)' },
    { icon: <CheckCircle2 size={13} />, title: 'Action Items', items: summary.actions, color: '142 71% 45%' },
    { icon: <Lightbulb size={13} />, title: 'Ιδέες & Υποθέσεις', items: summary.ideas, color: '262 83% 58%' },
    { icon: <AlertTriangle size={13} />, title: 'Αποτελέσματα', items: summary.results, color: '38 92% 50%' },
  ].filter(s => s.items.length > 0);

  return (
    <div style={{
      width: 280, borderLeft: '1px solid hsl(var(--border))',
      background: 'hsl(var(--card))', display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px', borderBottom: '1px solid hsl(var(--border))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} style={{ color: 'hsl(var(--primary))' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
            AI Σύνοψη
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={handleRegenerate} style={iconBtnStyle} title="Ανανέωση">
            <RefreshCw size={13} style={{ animation: isGenerating ? 'spin 1s linear infinite' : undefined }} />
          </button>
          <button onClick={handleCopy} style={iconBtnStyle} title="Αντιγραφή">
            {copied ? <CheckCircle2 size={13} style={{ color: 'hsl(142 71% 45%)' }} /> : <Copy size={13} />}
          </button>
          <button onClick={handleDownload} style={iconBtnStyle} title="Λήψη">
            <Download size={13} />
          </button>
          <button onClick={onClose} style={iconBtnStyle}>
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {/* Stats */}
        <div style={{
          padding: '8px 10px', borderRadius: '8px',
          background: 'hsl(var(--muted) / 0.3)', marginBottom: '10px',
        }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
            Επισκόπηση
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px', color: 'hsl(var(--foreground))' }}>
            <span>📨 {summary.totalMessages} μηνύματα</span>
            <span>👥 {summary.uniqueSenders} άτομα</span>
            <span>🏷️ {summary.taggedCount} tagged</span>
            <span>📌 {summary.pinnedCount} pinned</span>
            {summary.blockchainCount > 0 && <span>🔗 {summary.blockchainCount} verified</span>}
          </div>
          <div style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
            {summary.timeRange}
          </div>
        </div>

        {/* Topics */}
        {summary.topics.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Θέματα
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {summary.topics.map((topic, i) => (
                <span key={i} style={{
                  fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                  background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))',
                  fontWeight: 500,
                }}>
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sections */}
        {sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: '10px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.5px', marginBottom: '4px',
              color: section.color.startsWith('var') ? `hsl(${section.color})` : `hsl(${section.color})`,
            }}>
              {section.icon}
              {section.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {section.items.map((item, i) => (
                <div key={i} style={{
                  fontSize: '11px', color: 'hsl(var(--foreground) / 0.85)',
                  padding: '4px 6px', borderRadius: '4px',
                  background: 'hsl(var(--muted) / 0.2)',
                  borderLeft: `2px solid hsl(${section.color.startsWith('var') ? section.color : section.color})`,
                  lineHeight: '1.4',
                }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}

        {sections.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '20px 10px',
            color: 'hsl(var(--muted-foreground))', fontSize: '12px',
          }}>
            <Sparkles size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
            <div>Δεν βρέθηκαν σημαντικά σημεία.</div>
            <div style={{ fontSize: '10px', marginTop: '4px' }}>
              Χρησιμοποίησε tags (💡 Idea, 📊 Result) για καλύτερη σύνοψη.
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: 'hsl(var(--foreground))', padding: '4px', borderRadius: '4px',
  display: 'flex', alignItems: 'center',
};

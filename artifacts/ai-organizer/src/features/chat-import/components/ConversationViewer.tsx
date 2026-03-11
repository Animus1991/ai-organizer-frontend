/**
 * Conversation Viewer Component
 * Displays chat messages in a clean, readable format
 */

import React, { useState, useMemo } from 'react';
import { StoredConversation } from '../services/ConversationStorageService';
import { Segment } from '../segmentation/TimeBasedSegmentation';

interface ConversationViewerProps {
  conversation: StoredConversation;
  onClose?: () => void;
  onExport?: () => void;
}

const platformColors: Record<string, { user: string; assistant: string }> = {
  chatgpt: { user: '#10a37f', assistant: '#19c59f' },
  claude: { user: '#cc785c', assistant: '#d4a574' },
  gemini: { user: '#4285f4', assistant: '#8ab4f8' },
  copilot: { user: '#0078d4', assistant: '#40e0d0' },
  perplexity: { user: '#20b2aa', assistant: '#48d1cc' },
  metaai: { user: '#0081fb', assistant: '#00d4ff' },
  pi: { user: '#6b5ce7', assistant: '#a29bfe' },
  characterai: { user: '#ff6b6b', assistant: '#ff9f43' },
  deepseek: { user: '#4f46e5', assistant: '#6366f1' },
  mistral: { user: '#ff6b35', assistant: '#f7b731' },
  you: { user: '#8b5cf6', assistant: '#a78bfa' },
  huggingface: { user: '#ffbd4a', assistant: '#ffd93d' }
};

const platformNames: Record<string, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  copilot: 'Copilot',
  perplexity: 'Perplexity',
  metaai: 'Meta AI',
  pi: 'Pi AI',
  characterai: 'Character.AI',
  deepseek: 'DeepSeek',
  mistral: 'Mistral',
  you: 'You.com',
  huggingface: 'HuggingChat'
};

export const ConversationViewer: React.FC<ConversationViewerProps> = ({
  conversation,
  onClose,
  onExport
}) => {
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [showSegments, setShowSegments] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const colors = platformColors[conversation.platform] || { user: '#6b7280', assistant: '#4b5563' };

  const filteredMessages = useMemo(() => {
    if (!searchQuery) return conversation.messages;
    const query = searchQuery.toLowerCase();
    return conversation.messages.filter(m => 
      m.content.toLowerCase().includes(query)
    );
  }, [conversation.messages, searchQuery]);

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (start: Date, end: Date) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getSegmentForMessage = (messageIndex: number): Segment | undefined => {
    if (!showSegments) return undefined;
    return conversation.segments.find(seg => {
      const startIdx = conversation.messages.indexOf(seg.messages[0]);
      const endIdx = startIdx + seg.messages.length - 1;
      return messageIndex >= startIdx && messageIndex <= endIdx;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backButton} onClick={onClose}>
            ← Back
          </button>
          <div style={styles.titleSection}>
            <h2 style={styles.title}>{conversation.title}</h2>
            <div style={styles.subtitle}>
              <span style={styles.platformBadge}>
                {platformNames[conversation.platform] || conversation.platform}
              </span>
              <span style={styles.meta}>
                {conversation.messages.length} messages • 
                {formatDuration(conversation.startTime, conversation.endTime)}
              </span>
            </div>
          </div>
        </div>
        <div style={styles.headerActions}>
          <div style={styles.searchBox}>
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <button 
            style={{...styles.toggleButton, ...(showSegments ? styles.toggleActive : {})}}
            onClick={() => setShowSegments(!showSegments)}
          >
            {showSegments ? 'Hide' : 'Show'} Segments ({conversation.segments.length})
          </button>
          <button style={styles.exportButton} onClick={onExport}>
            📥 Export
          </button>
        </div>
      </div>

      {/* Segments Sidebar */}
      {showSegments && (
        <div style={styles.segmentsSidebar}>
          <h3 style={styles.segmentsTitle}>📑 Segments ({conversation.segments.length})</h3>
          {conversation.segments.map((segment, idx) => (
            <div
              key={segment.id}
              style={{
                ...styles.segmentItem,
                ...(activeSegment === idx ? styles.segmentActive : {})
              }}
              onClick={() => setActiveSegment(activeSegment === idx ? null : idx)}
            >
              <div style={styles.segmentHeader}>
                <span style={styles.segmentNumber}>#{idx + 1}</span>
                <span style={styles.segmentMessageCount}>
                  {segment.messages.length} msgs
                </span>
              </div>
              <div style={styles.segmentTitle}>{segment.title}</div>
              {segment.topics.length > 0 && (
                <div style={styles.segmentTopics}>
                  {segment.topics.slice(0, 2).map((topic: string, i: number) => (
                    <span key={i} style={styles.topicTag}>{topic}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {filteredMessages.map((message, idx) => {
          const segment = getSegmentForMessage(idx);
          const isUser = message.role === 'user';
          
          return (
            <div key={idx} style={styles.messageWrapper}>
              {segment && idx > 0 && getSegmentForMessage(idx - 1)?.id !== segment.id && (
                <div style={styles.segmentDivider}>
                  <span style={styles.segmentDividerText}>
                    📑 {segment.title}
                  </span>
                </div>
              )}
              <div
                style={{
                  ...styles.message,
                  ...(isUser ? styles.messageUser : styles.messageAssistant),
                  borderLeftColor: isUser ? colors.user : colors.assistant
                }}
              >
                <div style={styles.messageHeader}>
                  <span style={styles.messageRole}>
                    {isUser ? '👤 You' : `🤖 ${platformNames[conversation.platform] || 'AI'}`}
                  </span>
                  <span style={styles.messageTime}>
                    {message.timestamp ? formatTimestamp(message.timestamp) : 'Unknown time'}
                  </span>
                </div>
                <div style={styles.messageContent}>
                  {message.content.split('\n').map((line: string, i: number) => (
                    <p key={i} style={styles.messageLine}>{line || ' '}</p>
                  ))}
                </div>
                <div style={styles.messageActions}>
                  <button 
                    style={styles.actionButton}
                    onClick={() => copyToClipboard(message.content)}
                    title="Copy"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredMessages.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔍</div>
            <p>No messages found matching "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div style={styles.footer}>
        <div style={styles.footerStats}>
          <span>💬 {conversation.messages.length} messages</span>
          <span>📄 {conversation.segments.length} segments</span>
          <span>🕐 {formatDuration(conversation.startTime, conversation.endTime)}</span>
          {conversation.metadata?.totalWords && (
            <span>📝 ~{conversation.metadata.totalWords} words</span>
          )}
        </div>
        <div style={styles.footerDates}>
          Started: {formatTimestamp(conversation.startTime)} • 
          Ended: {formatTimestamp(conversation.endTime)}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'var(--bg-primary, #f9fafb)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: 'white',
    borderBottom: '1px solid var(--border-color, #e5e7eb)',
    gap: '16px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1
  },
  backButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border-color, #e5e7eb)',
    background: 'white',
    cursor: 'pointer',
    fontSize: '14px'
  },
  titleSection: {
    flex: 1
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--text-primary, #1f2937)'
  },
  subtitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '4px'
  },
  platformBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    background: 'var(--primary-100, #e0e7ff)',
    color: 'var(--primary-700, #4338ca)',
    fontSize: '12px',
    fontWeight: 500
  },
  meta: {
    fontSize: '13px',
    color: 'var(--text-secondary, #6b7280)'
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  searchBox: {
    position: 'relative'
  },
  searchInput: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-color, #e5e7eb)',
    fontSize: '14px',
    width: '200px'
  },
  toggleButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border-color, #e5e7eb)',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px'
  },
  toggleActive: {
    background: 'var(--primary-50, #eef2ff)',
    borderColor: 'var(--primary-500, #6366f1)',
    color: 'var(--primary-700, #4338ca)'
  },
  exportButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--primary-600, #4f46e5)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px'
  },
  segmentsSidebar: {
    position: 'absolute',
    left: 0,
    top: '73px',
    bottom: '60px',
    width: '280px',
    background: 'white',
    borderRight: '1px solid var(--border-color, #e5e7eb)',
    padding: '16px',
    overflowY: 'auto',
    zIndex: 10
  },
  segmentsTitle: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary, #1f2937)'
  },
  segmentItem: {
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
    border: '1px solid var(--border-color, #e5e7eb)',
    transition: 'all 0.2s'
  },
  segmentActive: {
    background: 'var(--primary-50, #eef2ff)',
    borderColor: 'var(--primary-500, #6366f1)'
  },
  segmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px'
  },
  segmentNumber: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--primary-600, #4f46e5)'
  },
  segmentMessageCount: {
    fontSize: '11px',
    color: 'var(--text-muted, #9ca3af)'
  },
  segmentTitle: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-primary, #1f2937)',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  segmentTopics: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap'
  },
  topicTag: {
    fontSize: '10px',
    padding: '2px 6px',
    background: 'var(--bg-muted, #f3f4f6)',
    color: 'var(--text-secondary, #6b7280)',
    borderRadius: '4px'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    paddingLeft: '24px'
  },
  messageWrapper: {
    marginBottom: '16px'
  },
  segmentDivider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
    color: 'var(--primary-600, #4f46e5)',
    fontSize: '13px',
    fontWeight: 500
  },
  segmentDividerText: {
    background: 'var(--primary-50, #eef2ff)',
    padding: '4px 12px',
    borderRadius: '16px'
  },
  message: {
    padding: '16px',
    borderRadius: '12px',
    background: 'white',
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  messageUser: {
    background: 'var(--bg-user, #f0fdf4)'
  },
  messageAssistant: {
    background: 'var(--bg-assistant, #fafafa)'
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '13px'
  },
  messageRole: {
    fontWeight: 600,
    color: 'var(--text-primary, #1f2937)'
  },
  messageTime: {
    color: 'var(--text-muted, #9ca3af)'
  },
  messageContent: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: 'var(--text-primary, #1f2937)'
  },
  messageLine: {
    margin: '0 0 8px 0',
    padding: 0
  },
  messageActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
    opacity: 0,
    transition: 'opacity 0.2s'
  },
  actionButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px',
    borderRadius: '4px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: 'var(--text-secondary, #6b7280)'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  footer: {
    padding: '12px 24px',
    background: 'white',
    borderTop: '1px solid var(--border-color, #e5e7eb)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    color: 'var(--text-secondary, #6b7280)'
  },
  footerStats: {
    display: 'flex',
    gap: '16px'
  },
  footerDates: {
    color: 'var(--text-muted, #9ca3af)'
  }
};

// Add hover effect for message actions
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  [data-message]:hover [data-message-actions] {
    opacity: 1 !important;
  }
`;
document.head.appendChild(styleSheet);

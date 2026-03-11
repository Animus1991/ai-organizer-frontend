/**
 * ContextWindowManager - Intelligent context window management
 * Handles token counting, message truncation, and context visualization
 */
import React, { useMemo } from 'react';
import type { ChatMessage } from './types';

// Approximate token counting (1 token ≈ 4 chars for English, 2-3 for code)
function estimateTokens(text: string): number {
  // Simple heuristic: count words and adjust
  const words = text.split(/\s+/).length;
  const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).join('').length;
  const regularText = text.length - codeBlocks;
  
  // Code is denser (~3 chars/token), regular text (~4 chars/token)
  return Math.ceil(regularText / 4 + codeBlocks / 3);
}

// Context window sizes per provider
export const CONTEXT_WINDOWS: Record<string, { maxTokens: number; label: string }> = {
  'openai': { maxTokens: 128000, label: 'GPT-4 (128K)' },
  'openai-mini': { maxTokens: 16384, label: 'GPT-3.5 (16K)' },
  'anthropic': { maxTokens: 200000, label: 'Claude 3 (200K)' },
  'gemini': { maxTokens: 1000000, label: 'Gemini Pro (1M)' },
  'default': { maxTokens: 8192, label: 'Default (8K)' },
};

export interface ContextWindowState {
  totalTokens: number;
  maxTokens: number;
  usagePercent: number;
  messagesIncluded: number;
  messagesTruncated: number;
  isOverLimit: boolean;
  optimizedMessages: Array<{ role: string; content: string }>;
}

/**
 * Manage context window: count tokens, truncate old messages, optimize
 */
export function manageContextWindow(
  messages: ChatMessage[],
  providerType: string,
  reserveTokens: number = 2048 // Reserve for response
): ContextWindowState {
  const windowConfig = CONTEXT_WINDOWS[providerType] || CONTEXT_WINDOWS['default'];
  const availableTokens = windowConfig.maxTokens - reserveTokens;
  
  // Count tokens per message (newest first for priority)
  const messageTokens = messages.map(msg => ({
    message: msg,
    tokens: estimateTokens(msg.content) + 4, // +4 for role/formatting overhead
  }));
  
  // Include messages from newest to oldest until we hit the limit
  let totalTokens = 0;
  const includedMessages: typeof messageTokens = [];
  
  // Always include the latest message (user's current question)
  for (let i = messageTokens.length - 1; i >= 0; i--) {
    const mt = messageTokens[i];
    if (totalTokens + mt.tokens <= availableTokens) {
      includedMessages.unshift(mt);
      totalTokens += mt.tokens;
    } else {
      break; // Stop including older messages
    }
  }
  
  // If we have space, try to add a system summary of truncated messages
  const truncatedCount = messages.length - includedMessages.length;
  if (truncatedCount > 0 && totalTokens + 100 < availableTokens) {
    const truncatedMessages = messageTokens.slice(0, truncatedCount);
    const summaryContent = generateTruncationSummary(truncatedMessages.map(m => m.message));
    includedMessages.unshift({
      message: {
        id: 'context-summary',
        role: 'system',
        content: summaryContent,
        timestamp: new Date(),
      },
      tokens: estimateTokens(summaryContent),
    });
    totalTokens += estimateTokens(summaryContent);
  }
  
  return {
    totalTokens,
    maxTokens: windowConfig.maxTokens,
    usagePercent: Math.round((totalTokens / windowConfig.maxTokens) * 100),
    messagesIncluded: includedMessages.length,
    messagesTruncated: truncatedCount,
    isOverLimit: totalTokens > availableTokens,
    optimizedMessages: includedMessages.map(m => ({
      role: m.message.role,
      content: m.message.content,
    })),
  };
}

/**
 * Generate a brief summary of truncated messages for context preservation
 */
function generateTruncationSummary(messages: ChatMessage[]): string {
  if (messages.length === 0) return '';
  
  const topics: Set<string> = new Set();
  const keyPhrases: string[] = [];
  
  messages.forEach(msg => {
    // Extract key phrases (first sentence of each message)
    const firstSentence = msg.content.split(/[.!?]/)[0]?.trim();
    if (firstSentence && firstSentence.length > 10 && firstSentence.length < 100) {
      keyPhrases.push(`${msg.role === 'user' ? 'User' : 'AI'}: ${firstSentence}`);
    }
  });
  
  return `[Context from ${messages.length} earlier messages]\n${keyPhrases.slice(0, 5).join('\n')}`;
}

/**
 * Context window usage visualization
 */
export function ContextWindowIndicator({ state, providerType }: {
  state: ContextWindowState;
  providerType: string;
}) {
  const windowConfig = CONTEXT_WINDOWS[providerType] || CONTEXT_WINDOWS['default'];
  const barColor = state.usagePercent > 90
    ? 'var(--destructive)'
    : state.usagePercent > 70
    ? '38 92% 50%'
    : 'var(--primary)';
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '3px 8px',
      fontSize: '10px',
      color: 'hsl(var(--muted-foreground))',
    }}>
      {/* Mini progress bar */}
      <div style={{
        width: '40px',
        height: '4px',
        borderRadius: '2px',
        background: 'hsl(var(--muted) / 0.3)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(state.usagePercent, 100)}%`,
          borderRadius: '2px',
          background: `hsl(${barColor})`,
          transition: 'width 0.3s ease',
        }} />
      </div>
      
      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
        {state.usagePercent}%
      </span>
      
      {state.messagesTruncated > 0 && (
        <span style={{
          padding: '1px 4px',
          borderRadius: '3px',
          background: 'hsl(38 92% 50% / 0.1)',
          color: 'hsl(38 92% 50%)',
          fontWeight: 600,
        }}>
          -{state.messagesTruncated} msgs
        </span>
      )}
      
      <span style={{ opacity: 0.6 }}>
        {(state.totalTokens / 1000).toFixed(1)}K/{(state.maxTokens / 1000).toFixed(0)}K
      </span>
    </div>
  );
}

/**
 * Detailed context window panel
 */
export function ContextWindowPanel({ state, providerType, onClose }: {
  state: ContextWindowState;
  providerType: string;
  onClose: () => void;
}) {
  const windowConfig = CONTEXT_WINDOWS[providerType] || CONTEXT_WINDOWS['default'];
  
  return (
    <div style={{
      padding: '10px 12px',
      background: 'hsl(var(--muted) / 0.2)',
      borderBottom: '1px solid hsl(var(--border))',
      fontSize: '11px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
      }}>
        <span style={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
          Context Window — {windowConfig.label}
        </span>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'hsl(var(--muted-foreground))', fontSize: '12px',
        }}>✕</button>
      </div>
      
      {/* Full progress bar */}
      <div style={{
        width: '100%',
        height: '8px',
        borderRadius: '4px',
        background: 'hsl(var(--muted) / 0.3)',
        overflow: 'hidden',
        marginBottom: '6px',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(state.usagePercent, 100)}%`,
          borderRadius: '4px',
          background: state.usagePercent > 90
            ? 'hsl(var(--destructive))'
            : state.usagePercent > 70
            ? 'hsl(38 92% 50%)'
            : 'hsl(var(--primary))',
          transition: 'width 0.3s ease',
        }} />
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4px',
        color: 'hsl(var(--muted-foreground))',
      }}>
        <span>Tokens: {state.totalTokens.toLocaleString()}/{state.maxTokens.toLocaleString()}</span>
        <span>Messages: {state.messagesIncluded} included</span>
        {state.messagesTruncated > 0 && (
          <span style={{ color: 'hsl(38 92% 50%)' }}>
            ⚠ {state.messagesTruncated} messages truncated
          </span>
        )}
      </div>
    </div>
  );
}

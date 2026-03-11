/**
 * AIChatMessages - Message Display Component with Markdown rendering
 * 
 * Displays chat messages with full markdown support, code highlighting, and LaTeX.
 */

import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from './types';
import { AIChatMarkdown } from './AIChatMarkdown';

interface AIChatMessagesProps {
  providerType: string;
  conversationId?: string;
  messages?: ChatMessage[];
  onNewMessage?: (message: ChatMessage) => void;
}

export function AIChatMessages({ providerType, conversationId, messages: externalMessages, onNewMessage }: AIChatMessagesProps) {
  const messages = externalMessages || [];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: 'hsl(var(--background) / 0.5)',
      }}
    >
      {messages.length === 0 ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'hsl(var(--muted-foreground))',
          fontSize: '14px',
          textAlign: 'center',
          gap: '8px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '32px', opacity: 0.4 }}>💬</div>
          <div>Start a conversation</div>
          <div style={{ fontSize: '11px', opacity: 0.6 }}>
            Tip: Use 📋 for research prompt templates
          </div>
        </div>
      ) : (
        messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              width: '100%',
            }}
          >
            {/* Role label */}
            <div style={{
              fontSize: '10px',
              fontWeight: 700,
              color: msg.role === 'user' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              padding: '0 4px',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
            }}>
              {msg.role === 'user' ? '🧑 You' : '🤖 AI'}
            </div>
            
            {/* Message bubble */}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                background: msg.role === 'user' 
                  ? 'hsl(var(--primary) / 0.1)' 
                  : 'hsl(var(--muted) / 0.4)',
                border: msg.role === 'user' 
                  ? '1px solid hsl(var(--primary) / 0.15)' 
                  : '1px solid hsl(var(--border) / 0.5)',
                maxWidth: '90%',
                wordWrap: 'break-word',
              }}
            >
              <AIChatMarkdown content={msg.content} isUser={msg.role === 'user'} />
            </div>
            
            {/* Timestamp */}
            <div style={{ 
              color: 'hsl(var(--muted-foreground) / 0.5)', 
              fontSize: '10px', 
              padding: '0 4px',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
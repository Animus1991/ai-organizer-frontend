/**
 * StreamingChat - SSE streaming infrastructure for real-time token-by-token AI responses
 * Works with the existing backend API and provides a React hook for streaming.
 */
import { useState, useCallback, useRef } from 'react';
import { getAccessToken } from '../../lib/api';
import type { ChatMessage } from './types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() || "http://127.0.0.1:8000";

export interface StreamingState {
  isStreaming: boolean;
  currentContent: string;
  error: string | null;
  tokensReceived: number;
  startTime: number | null;
}

interface StreamingOptions {
  providerType: string;
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  onToken?: (token: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Parse SSE stream line-by-line, handling partial JSON chunks
 */
async function* parseSSEStream(reader: ReadableStreamDefaultReader<Uint8Array>): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') return;

      try {
        const parsed = JSON.parse(jsonStr);
        // OpenAI-compatible format
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // Incomplete JSON — put back and wait for more data
        buffer = line + '\n' + buffer;
        break;
      }
    }
  }

  // Final flush
  if (buffer.trim()) {
    for (let raw of buffer.split('\n')) {
      if (!raw) continue;
      if (raw.endsWith('\r')) raw = raw.slice(0, -1);
      if (raw.startsWith(':') || raw.trim() === '') continue;
      if (!raw.startsWith('data: ')) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch { /* ignore partial leftovers */ }
    }
  }
}

/**
 * Stream chat completion from backend using SSE
 */
export async function streamChatCompletion(
  options: StreamingOptions,
  abortSignal?: AbortSignal
): Promise<string> {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const url = `${API_BASE_URL}/api/ai-chat/chat/completion`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      provider_type: options.providerType,
      messages: options.messages,
      model: options.model,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: true,
    }),
    signal: abortSignal,
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 429) throw new Error('⏱️ Rate limit exceeded');
    if (response.status === 402) throw new Error('💳 Credits exhausted');
    throw new Error(`Stream error: ${text || response.statusText}`);
  }

  // Check if response is actually a stream
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    // Non-streaming fallback
    const data = await response.json();
    const content = data.content || data.choices?.[0]?.message?.content || '';
    options.onToken?.(content);
    options.onComplete?.(content);
    return content;
  }

  if (!response.body) throw new Error('No response body for streaming');

  const reader = response.body.getReader();
  let fullContent = '';

  try {
    for await (const token of parseSSEStream(reader)) {
      fullContent += token;
      options.onToken?.(token);
    }
  } catch (error) {
    if (abortSignal?.aborted) {
      options.onComplete?.(fullContent);
      return fullContent;
    }
    throw error;
  }

  options.onComplete?.(fullContent);
  return fullContent;
}

/**
 * React hook for streaming AI chat
 */
export function useStreamingChat() {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    currentContent: '',
    error: null,
    tokensReceived: 0,
    startTime: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (
    options: Omit<StreamingOptions, 'onToken' | 'onComplete' | 'onError'>
  ): Promise<string> => {
    // Cancel any existing stream
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState({
      isStreaming: true,
      currentContent: '',
      error: null,
      tokensReceived: 0,
      startTime: Date.now(),
    });

    try {
      const result = await streamChatCompletion(
        {
          ...options,
          onToken: (token) => {
            setState(prev => ({
              ...prev,
              currentContent: prev.currentContent + token,
              tokensReceived: prev.tokensReceived + 1,
            }));
          },
          onComplete: (fullContent) => {
            setState(prev => ({
              ...prev,
              isStreaming: false,
              currentContent: fullContent,
            }));
          },
        },
        controller.signal
      );
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Streaming failed';
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: msg,
      }));
      throw error;
    }
  }, []);

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setState(prev => ({ ...prev, isStreaming: false }));
  }, []);

  const getTokensPerSecond = useCallback((): number => {
    if (!state.startTime || state.tokensReceived === 0) return 0;
    const elapsed = (Date.now() - state.startTime) / 1000;
    return elapsed > 0 ? Math.round(state.tokensReceived / elapsed) : 0;
  }, [state.startTime, state.tokensReceived]);

  return {
    ...state,
    startStream,
    stopStream,
    getTokensPerSecond,
  };
}

/**
 * Streaming indicator component
 */
export function StreamingIndicator({ tokensPerSecond, tokensReceived }: {
  tokensPerSecond: number;
  tokensReceived: number;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '2px 8px',
      borderRadius: '8px',
      background: 'hsl(var(--primary) / 0.08)',
      fontSize: '10px',
      color: 'hsl(var(--primary))',
      fontWeight: 600,
      fontVariantNumeric: 'tabular-nums',
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'hsl(var(--primary))',
        animation: 'pulse 1s infinite',
      }} />
      <span>{tokensReceived} tokens</span>
      <span style={{ color: 'hsl(var(--muted-foreground))' }}>•</span>
      <span>{tokensPerSecond} tok/s</span>
    </div>
  );
}

/**
 * AIChatInput - Rich Input Component
 * 
 * Mobile-responsive input with:
 * - Microphone (voice input)
 * - Gallery/Image (image upload)
 * - Sticker/Emoji picker
 * - GIF search
 * - Text input
 * - Emoji quick access
 * - Thumbs-up quick reaction
 */

import React, { useState, useRef } from 'react';
import { chatCompletion, type ChatMessage } from '../../lib/api/aiChat';

// Speech Recognition types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

interface SegmentContext {
  documentId?: number;
  documentTitle?: string;
  segmentId?: number;
  segmentText?: string;
  segmentType?: string;
}

interface AIChatInputProps {
  providerType: string;
  conversationHistory?: ChatMessage[]; // Full conversation for context
  onSend?: (message: string) => void;
  onMessageSent?: (message: ChatMessage) => void;
  onResponseReceived?: (response: string) => void;
  onError?: (error: Error) => void;
  segmentContext?: SegmentContext;
}

// Common emojis for quick access
const COMMON_EMOJIS = ['😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '👍', '❤️', '🔥', '🎉', '✨', '💯', '👏', '🙌'];

// ── Slash Commands ──
interface SlashCommand {
  command: string;
  label: string;
  icon: string;
  description: string;
  systemPrompt: string;
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: '/summarize',
    label: 'Summarize',
    icon: '📝',
    description: 'Summarize the following text concisely',
    systemPrompt: 'You are a summarization expert. Provide a clear, concise summary of the following content. Use bullet points for key takeaways.',
  },
  {
    command: '/translate',
    label: 'Translate',
    icon: '🌐',
    description: 'Translate text to another language',
    systemPrompt: 'You are a professional translator. Translate the following text accurately, preserving meaning and tone. If no target language is specified, translate to English.',
  },
  {
    command: '/review',
    label: 'Review',
    icon: '🔍',
    description: 'Critical review with feedback',
    systemPrompt: 'You are a critical reviewer. Analyze the following for accuracy, completeness, logical consistency, and clarity. Provide specific, actionable feedback.',
  },
  {
    command: '/explain',
    label: 'Explain',
    icon: '💡',
    description: 'Explain a concept simply',
    systemPrompt: 'You are an expert educator. Explain the following concept clearly and simply, using examples and analogies where helpful.',
  },
  {
    command: '/code',
    label: 'Code',
    icon: '💻',
    description: 'Generate or fix code',
    systemPrompt: 'You are an expert programmer. Provide clean, well-documented code with explanations. Follow best practices.',
  },
  {
    command: '/brainstorm',
    label: 'Brainstorm',
    icon: '🧠',
    description: 'Generate creative ideas',
    systemPrompt: 'You are a creative thinking partner. Generate diverse, innovative ideas about the following topic. Think outside the box.',
  },
  {
    command: '/cite',
    label: 'Cite',
    icon: '📚',
    description: 'Find references and citations',
    systemPrompt: 'You are an academic research assistant. Provide relevant academic references, citations, and key papers related to the following topic. Include DOIs or arXiv IDs where possible.',
  },
  {
    command: '/latex',
    label: 'LaTeX',
    icon: '📐',
    description: 'Convert to LaTeX format',
    systemPrompt: 'You are a LaTeX expert. Convert the following content into properly formatted LaTeX, including equations, tables, and structured sections as needed.',
  },
];

function matchSlashCommands(input: string): SlashCommand[] {
  if (!input.startsWith('/')) return [];
  const query = input.toLowerCase().split(' ')[0];
  if (query === '/') return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter(c => c.command.startsWith(query));
}

function parseSlashCommand(input: string): { command: SlashCommand | null; text: string } {
  const trimmed = input.trim();
  for (const cmd of SLASH_COMMANDS) {
    if (trimmed.toLowerCase().startsWith(cmd.command)) {
      const text = trimmed.slice(cmd.command.length).trim();
      return { command: cmd, text };
    }
  }
  return { command: null, text: trimmed };
}

export function AIChatInput({ providerType, conversationHistory, onSend, onMessageSent, onResponseReceived, onError }: AIChatInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifResults, setGifResults] = useState<string[]>([]);
  const [slashMatches, setSlashMatches] = useState<SlashCommand[]>([]);
  const [slashIndex, setSlashIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Update slash command matches when message changes
  const handleMessageChange = (val: string) => {
    setMessage(val);
    const matches = matchSlashCommands(val);
    setSlashMatches(matches);
    setSlashIndex(0);
  };

  const handleSelectSlashCommand = (cmd: SlashCommand) => {
    setMessage(cmd.command + ' ');
    setSlashMatches([]);
    inputRef.current?.focus();
  };
  
  const handleSend = async () => {
    if (!message.trim() || sending) return;
    
    const messageText = message.trim();
    setMessage('');
    setSlashMatches([]);
    setSending(true);
    
    // Parse slash command
    const { command: slashCmd, text: cmdText } = parseSlashCommand(messageText);
    const displayText = slashCmd ? `${slashCmd.icon} ${slashCmd.label}: ${cmdText || '(no input)'}` : messageText;
    const actualContent = cmdText || messageText;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: displayText,
    };
    onMessageSent?.(userMessage);
    onSend?.(displayText);
    
    // Build full conversation context, inject system prompt if slash command
    const fullHistory: ChatMessage[] = [
      ...(slashCmd ? [{ role: 'system' as const, content: slashCmd.systemPrompt }] : []),
      ...(conversationHistory || []).map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: actualContent },
    ];
    
    // Retry logic with exponential backoff
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        }
        
        const response = await chatCompletion({
          providerType,
          messages: fullHistory,
        });
        
        onResponseReceived?.(response.content);
        lastError = null;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on auth errors or rate limits
        const msg = lastError.message.toLowerCase();
        if (msg.includes('not authenticated') || msg.includes('401') || msg.includes('403')) {
          break;
        }
        // Rate limit — notify but don't retry immediately
        if (msg.includes('429') || msg.includes('rate limit')) {
          onError?.(new Error('⏱️ Rate limit exceeded. Παρακαλώ περιμένετε λίγο.'));
          break;
        }
        // Payment required
        if (msg.includes('402') || msg.includes('payment')) {
          onError?.(new Error('💳 Credits exhausted. Please add funds.'));
          break;
        }
        
        console.warn(`Chat attempt ${attempt + 1}/${maxRetries} failed:`, lastError.message);
      }
    }
    
    if (lastError) {
      const errorMsg = lastError.message.includes('Cannot connect')
        ? '🔌 Offline — δεν είναι δυνατή η σύνδεση. Δοκιμάστε ξανά.'
        : `❌ ${lastError.message}`;
      onResponseReceived?.(errorMsg);
      onError?.(lastError);
    }
    
    setSending(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Slash command navigation
    if (slashMatches.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashIndex(i => (i + 1) % slashMatches.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashIndex(i => (i - 1 + slashMatches.length) % slashMatches.length);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && message.split(' ').length === 1 && message.startsWith('/'))) {
        e.preventDefault();
        handleSelectSlashCommand(slashMatches[slashIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setSlashMatches([]);
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice Input Handler
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Voice input is not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(prev => prev + (prev ? ' ' : '') + transcript);
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      if (event.error === 'not-allowed') {
        console.warn('Microphone permission denied');
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Image Upload Handler
  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      console.warn('Please select an image file.');
      return;
    }

    // Convert image to base64 and add to message
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const imageMessage = `[Image: ${file.name}]\n${base64}`;
      setMessage(prev => prev + (prev ? '\n' : '') + imageMessage);
    };
    reader.readAsDataURL(file);

    // Reset file input
    e.target.value = '';
  };

  // Emoji Handler
  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // GIF Search Handler (using Giphy API - free tier)
  const handleGifSearch = async () => {
    if (!gifSearch.trim()) {
      // Show trending GIFs
      try {
        const response = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=dc6zaTOxFJmzC&limit=12`);
        const data = await response.json();
        setGifResults(data.data.map((gif: any) => gif.images.fixed_height.url));
      } catch (error) {
        console.error('GIF search failed:', error);
        // Silently fail instead of alerting
      }
      return;
    }

    try {
      const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(gifSearch)}&limit=12`);
      const data = await response.json();
      setGifResults(data.data.map((gif: any) => gif.images.fixed_height.url));
    } catch (error) {
      console.error('GIF search failed:', error);
      // Silently fail instead of alerting
    }
  };

  const handleGifSelect = (gifUrl: string) => {
    const gifMessage = `[GIF]\n${gifUrl}`;
    setMessage(prev => prev + (prev ? '\n' : '') + gifMessage);
    setShowGifPicker(false);
    setGifSearch('');
    setGifResults([]);
  };
  
  return (
    <div
      style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(32, 33, 35, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        position: 'relative',
      }}
    >
      {/* Slash Command Autocomplete */}
      {slashMatches.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '12px', right: '12px',
          background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
          borderRadius: '10px', boxShadow: '0 -4px 20px hsl(var(--foreground) / 0.15)',
          padding: '4px', maxHeight: '240px', overflowY: 'auto', zIndex: 50,
        }}>
          <div style={{ padding: '4px 8px 6px', fontSize: '10px', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Commands
          </div>
          {slashMatches.map((cmd, i) => (
            <button
              key={cmd.command}
              onClick={() => handleSelectSlashCommand(cmd)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '7px 10px',
                background: i === slashIndex ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                border: 'none', borderRadius: '6px',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '16px', width: '24px', textAlign: 'center' }}>{cmd.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                  {cmd.command}
                </div>
                <div style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))' }}>
                  {cmd.description}
                </div>
              </div>
              {i === slashIndex && (
                <span style={{ fontSize: '9px', color: 'hsl(var(--muted-foreground))', opacity: 0.6 }}>
                  Tab ↵
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {/* Main Input Container - Full Width */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        width: '100%', 
        alignItems: 'flex-end',
        background: 'rgba(64, 65, 79, 0.8)',
        borderRadius: '24px',
        padding: '4px 4px 4px 12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        {/* Text Input - Takes full width */}
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => handleMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={sending ? "Sending..." : "Type / for commands..."}
          disabled={sending}
          style={{
            flex: 1,
            padding: '12px 8px',
            background: 'transparent',
            border: 'none',
            borderRadius: '0',
            color: 'rgba(255, 255, 255, 0.95)',
            fontSize: '15px',
            outline: 'none',
            minWidth: 0,
            lineHeight: '1.5',
          }}
        />
        
        {/* Action Buttons Row */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!message.trim() || sending}
            style={{
              padding: '8px',
              background: message.trim() && !sending 
                ? 'rgba(25, 195, 125, 1)'
                : 'transparent',
              border: 'none',
              borderRadius: '50%',
              color: 'white',
              cursor: message.trim() && !sending ? 'pointer' : 'not-allowed',
              opacity: message.trim() && !sending ? 1 : 0.4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              width: '32px',
              height: '32px',
            }}
            title="Send message"
          >
            {sending ? (
              <svg width="16" height="16" className="animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Secondary Actions Row - Optional, less prominent */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        width: '100%', 
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 0',
      }}>
        {/* Microphone */}
        <button
          type="button"
          onClick={handleVoiceInput}
          disabled={isRecording || sending}
          style={{
            padding: '6px',
            background: isRecording ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
            border: 'none',
            color: isRecording ? 'rgba(239, 68, 68, 1)' : 'rgba(255, 255, 255, 0.6)',
            cursor: isRecording || sending ? 'not-allowed' : 'pointer',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          title={isRecording ? "Recording..." : "Voice input"}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
        
        {/* Gallery/Image */}
        <button
          type="button"
          onClick={handleImageUpload}
          disabled={sending}
          style={{
            padding: '6px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: sending ? 'not-allowed' : 'pointer',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Attach image"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        {/* Emoji */}
        <button
          type="button"
          onClick={() => {
            setShowEmojiPicker(!showEmojiPicker);
            setShowGifPicker(false);
          }}
          disabled={sending}
          style={{
            padding: '6px',
            background: showEmojiPicker ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: sending ? 'not-allowed' : 'pointer',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Emoji"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        
        {/* GIF */}
        <button
          type="button"
          onClick={() => {
            setShowGifPicker(!showGifPicker);
            setShowEmojiPicker(false);
            if (!showGifPicker) {
              handleGifSearch(); // Load trending GIFs
            }
          }}
          disabled={sending}
          style={{
            padding: '6px 10px',
            background: showGifPicker ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: sending ? 'not-allowed' : 'pointer',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 600,
          }}
          title="GIF"
        >
          GIF
        </button>
      </div>
      
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div style={{
          width: '100%',
          padding: '12px',
          background: 'rgba(64, 65, 79, 0.95)',
          borderRadius: '12px',
          marginTop: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          maxHeight: '200px',
          overflowY: 'auto',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '8px',
          }}>
            {COMMON_EMOJIS.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* GIF Picker */}
      {showGifPicker && (
        <div style={{
          width: '100%',
          padding: '12px',
          background: 'rgba(64, 65, 79, 0.95)',
          borderRadius: '12px',
          marginTop: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          maxHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* GIF Search */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={gifSearch}
              onChange={(e) => setGifSearch(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleGifSearch();
                }
              }}
              placeholder="Search GIFs..."
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={handleGifSearch}
              style={{
                padding: '8px 16px',
                background: 'rgba(99, 102, 241, 0.8)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Search
            </button>
          </div>
          
          {/* GIF Results */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}>
            {gifResults.map((gifUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleGifSelect(gifUrl)}
                style={{
                  padding: 0,
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <img
                  src={gifUrl}
                  alt={`GIF ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

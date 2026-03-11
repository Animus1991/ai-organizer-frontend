/**
 * Claude Archive Parser
 * Handles Anthropic's Claude export format
 */

import { ChatArchiveParser, ParseResult, ParsedConversation, ChatMessage, ParserRegistry } from './ChatArchiveParser';

interface ClaudeMessage {
  uuid: string;
  text: string;
  sender: 'human' | 'assistant' | 'system';
  index: number;
  created_at: string;
  updated_at: string;
  content?: {
    type: string;
    text?: string;
  }[];
}

interface ClaudeConversation {
  uuid: string;
  name: string;
  summary?: string;
  created_at: string;
  updated_at: string;
  messages: ClaudeMessage[];
  settings?: {
    model?: string;
  };
}

export class ClaudeParser extends ChatArchiveParser {
  getPlatform(): string {
    return 'claude';
  }

  canParse(file: File): boolean {
    return file.name.toLowerCase().endsWith('.json');
  }

  async parse(content: string, _fileName: string): Promise<ParseResult> {
    const result: ParseResult = {
      conversations: [],
      errors: [],
      warnings: [],
      platform: this.getPlatform()
    };

    try {
      const data = JSON.parse(content);
      
      // Claude exports can be single conversation or array
      const conversations: ClaudeConversation[] = Array.isArray(data) ? data : [data];

      for (const conv of conversations) {
        try {
          const parsed = this.parseConversation(conv);
          if (parsed.messages.length > 0) {
            result.conversations.push(parsed);
          }
        } catch (e) {
          result.errors.push(`Failed to parse conversation: ${e instanceof Error ? e.message : 'Unknown'}`);
        }
      }
    } catch (e) {
      result.errors.push(`Invalid JSON: ${e instanceof Error ? e.message : 'Unknown'}`);
    }

    return result;
  }

  private parseConversation(conv: ClaudeConversation): ParsedConversation {
    const messages: ChatMessage[] = conv.messages.map(msg => ({
      role: this.normalizeRole(msg.sender),
      content: this.extractContent(msg),
      timestamp: new Date(msg.created_at),
      metadata: { uuid: msg.uuid }
    }));

    return {
      id: conv.uuid,
      title: conv.name || 'Untitled',
      messages,
      startTime: new Date(conv.created_at),
      endTime: new Date(conv.updated_at),
      platform: this.getPlatform(),
      metadata: {
        messageCount: messages.length,
        model: conv.settings?.model,
        summary: conv.summary
      }
    };
  }

  private normalizeRole(sender: string): 'user' | 'assistant' | 'system' {
    switch (sender) {
      case 'human': return 'user';
      case 'assistant': return 'assistant';
      case 'system': return 'system';
      default: return 'assistant';
    }
  }

  private extractContent(msg: ClaudeMessage): string {
    if (msg.content && Array.isArray(msg.content)) {
      return msg.content
        .map(c => c.text || '')
        .filter(Boolean)
        .join('\n');
    }
    return msg.text || '';
  }
}

ParserRegistry.register(new ClaudeParser());

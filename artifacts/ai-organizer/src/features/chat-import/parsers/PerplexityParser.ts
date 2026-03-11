/**
 * Perplexity Parser
 * Handles Perplexity AI export format
 */

import { ChatArchiveParser, ParsedConversation, ChatMessage, ParseResult } from './ChatArchiveParser';

interface PerplexityMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  citations?: Array<{
    title: string;
    url: string;
    snippet?: string;
  }>;
}

interface PerplexityConversation {
  id?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  messages: PerplexityMessage[];
  search_mode?: 'copilot' | 'concise' | 'fast';
  focus_mode?: string;
  model?: string;
}

interface PerplexityExportFormat {
  conversations?: PerplexityConversation[];
  threads?: PerplexityConversation[];
  messages?: PerplexityMessage[];
  title?: string;
  id?: string;
}

export class PerplexityParser extends ChatArchiveParser {
  getPlatform(): string {
    return 'perplexity';
  }

  getPlatformName(): string {
    return 'Perplexity AI';
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot === -1 ? '' : fileName.slice(lastDot).toLowerCase();
  }

  canParse(file: File): boolean {
    const ext = this.getFileExtension(file.name);
    if (ext !== '.json') return false;

    const name = file.name.toLowerCase();
    if (name.includes('perplexity')) return true;
    if (name.includes('pplx')) return true;

    return true;
  }

  async parse(content: string, fileName: string): Promise<ParseResult> {
    try {
      const data: PerplexityExportFormat = JSON.parse(content);
      const conversations: ParsedConversation[] = [];
      const warnings: string[] = [];

      if (Array.isArray(data.conversations)) {
        for (const conv of data.conversations) {
          if (this.isValidConversation(conv)) {
            conversations.push(this.parseConversation(conv));
          } else {
            warnings.push(`Invalid conversation structure in ${fileName}`);
          }
        }
      } else if (Array.isArray(data.threads)) {
        for (const conv of data.threads) {
          if (this.isValidConversation(conv)) {
            conversations.push(this.parseConversation(conv));
          } else {
            warnings.push(`Invalid conversation structure in ${fileName}`);
          }
        }
      } else if (Array.isArray(data.messages) && data.messages.length > 0) {
        const conv: PerplexityConversation = {
          id: data.id || `conv_${Date.now()}`,
          title: data.title || 'Untitled Conversation',
          messages: data.messages,
          created_at: new Date().toISOString()
        };
        conversations.push(this.parseConversation(conv));
      } else if (Array.isArray(data)) {
        const conv: PerplexityConversation = {
          id: `conv_${Date.now()}`,
          title: 'Imported Perplexity Conversation',
          messages: data as PerplexityMessage[],
          created_at: new Date().toISOString()
        };
        conversations.push(this.parseConversation(conv));
      }

      if (conversations.length === 0) {
        return {
          conversations: [],
          warnings: ['No valid Perplexity conversations found'],
          errors: [],
          platform: 'perplexity'
        };
      }

      return { conversations, warnings, errors: [], platform: 'perplexity' };
    } catch (error) {
      return {
        conversations: [],
        warnings: [],
        errors: [`Failed to parse Perplexity export: ${error instanceof Error ? error.message : 'Unknown error'}`],
        platform: 'perplexity'
      };
    }
  }

  private isValidConversation(conv: unknown): conv is PerplexityConversation {
    if (!conv || typeof conv !== 'object') return false;
    const c = conv as PerplexityConversation;
    return Array.isArray(c.messages) && c.messages.length > 0;
  }

  private cleanContent(content: string): string {
    return content.trim();
  }

  private cleanTitle(title: string): string {
    return title.trim() || 'Untitled';
  }

  private parseConversation(conv: PerplexityConversation): ParsedConversation {
    const messages: ChatMessage[] = [];

    for (const msg of conv.messages) {
      if (msg && typeof msg === 'object') {
        const role = this.mapRole(msg.role);
        const content = this.cleanContent(msg.content || '');

        if (content) {
          const timestamp = msg.timestamp ? new Date(msg.timestamp) : new Date();
          messages.push({
            role,
            content,
            timestamp,
            metadata: msg.citations ? { citations: msg.citations } : undefined
          });
        }
      }
    }

    const now = new Date();
    const startTime = messages.length > 0 && messages[0].timestamp
      ? messages[0].timestamp
      : conv.created_at
        ? new Date(conv.created_at)
        : now;

    const endTime = messages.length > 0 && messages[messages.length - 1].timestamp
      ? messages[messages.length - 1].timestamp
      : conv.updated_at
        ? new Date(conv.updated_at)
        : now;

    const title = this.cleanTitle(conv.title || 'Untitled Perplexity Conversation');

    return {
      id: this.generateId(title, startTime instanceof Date ? startTime : now),
      title,
      platform: 'perplexity',
      messages,
      startTime: startTime instanceof Date ? startTime : now,
      endTime: endTime instanceof Date ? endTime : now,
      metadata: {
        messageCount: messages.length,
        searchMode: conv.search_mode,
        focusMode: conv.focus_mode,
        model: conv.model
      }
    };
  }

  private mapRole(role?: string): 'user' | 'assistant' | 'system' {
    if (!role) return 'assistant';
    const normalized = role.toLowerCase().trim();

    switch (normalized) {
      case 'user':
      case 'human':
        return 'user';
      case 'assistant':
      case 'perplexity':
      case 'ai':
        return 'assistant';
      case 'system':
        return 'system';
      default:
        return 'assistant';
    }
  }
}

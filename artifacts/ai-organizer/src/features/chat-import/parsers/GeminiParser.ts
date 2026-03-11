/**
 * Gemini Parser
 * Handles Google Gemini/AI Studio export format
 */

import { ChatArchiveParser, ParsedConversation, ChatMessage, ParseResult } from './ChatArchiveParser';

interface GeminiMessage {
  role: 'user' | 'model';
  content: string;
  timestamp?: string;
}

interface GeminiConversation {
  id?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  messages: GeminiMessage[];
  export_metadata?: {
    export_date: string;
    version: string;
    platform: string;
  };
}

interface GeminiExportFormat {
  conversations?: GeminiConversation[];
  chat_history?: GeminiConversation[];
  messages?: GeminiMessage[];
  title?: string;
}

export class GeminiParser extends ChatArchiveParser {
  getPlatform(): string {
    return 'gemini';
  }

  getPlatformName(): string {
    return 'Google Gemini';
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot === -1 ? '' : fileName.slice(lastDot).toLowerCase();
  }

  canParse(file: File): boolean {
    const ext = this.getFileExtension(file.name);
    if (ext !== '.json') return false;

    const name = file.name.toLowerCase();
    if (name.includes('gemini') || name.includes('bard')) return true;
    if (name.includes('google_ai') || name.includes('ai_studio')) return true;

    return true;
  }

  async parse(content: string, fileName: string): Promise<ParseResult> {
    try {
      const data: GeminiExportFormat = JSON.parse(content);
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
      } else if (Array.isArray(data.chat_history)) {
        for (const conv of data.chat_history) {
          if (this.isValidConversation(conv)) {
            conversations.push(this.parseConversation(conv));
          } else {
            warnings.push(`Invalid conversation structure in ${fileName}`);
          }
        }
      } else if (Array.isArray(data.messages) && data.messages.length > 0) {
        const conv: GeminiConversation = {
          id: `conv_${Date.now()}`,
          title: data.title || 'Untitled Conversation',
          messages: data.messages,
          created_at: new Date().toISOString()
        };
        conversations.push(this.parseConversation(conv));
      } else if (Array.isArray(data)) {
        const conv: GeminiConversation = {
          id: `conv_${Date.now()}`,
          title: 'Imported Conversation',
          messages: data as GeminiMessage[],
          created_at: new Date().toISOString()
        };
        conversations.push(this.parseConversation(conv));
      }

      if (conversations.length === 0) {
        return {
          conversations: [],
          warnings: ['No valid Gemini conversations found'],
          errors: [],
          platform: 'gemini'
        };
      }

      return { conversations, warnings, errors: [], platform: 'gemini' };
    } catch (error) {
      return {
        conversations: [],
        warnings: [],
        errors: [`Failed to parse Gemini export: ${error instanceof Error ? error.message : 'Unknown error'}`],
        platform: 'gemini'
      };
    }
  }

  private isValidConversation(conv: unknown): conv is GeminiConversation {
    if (!conv || typeof conv !== 'object') return false;
    const c = conv as GeminiConversation;
    return Array.isArray(c.messages) && c.messages.length > 0;
  }

  private cleanContent(content: string): string {
    return content.trim();
  }

  private cleanTitle(title: string): string {
    return title.trim() || 'Untitled';
  }

  private parseConversation(conv: GeminiConversation): ParsedConversation {
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
            timestamp
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

    const title = this.cleanTitle(conv.title || 'Untitled Gemini Conversation');

    return {
      id: this.generateId(title, startTime),
      title,
      platform: 'gemini',
      messages,
      startTime: startTime instanceof Date ? startTime : now,
      endTime: endTime instanceof Date ? endTime : now,
      metadata: {
        messageCount: messages.length,
        exportDate: conv.export_metadata?.export_date,
        exportVersion: conv.export_metadata?.version
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
      case 'model':
      case 'assistant':
      case 'gemini':
      case 'bard':
        return 'assistant';
      case 'system':
        return 'system';
      default:
        return 'assistant';
    }
  }
}

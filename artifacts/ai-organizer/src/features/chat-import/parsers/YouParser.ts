/**
 * You.com Parser
 * Handles You.com / YouChat export format
 */

import { ChatArchiveParser, ParsedConversation, ChatMessage, ParseResult } from './ChatArchiveParser';

interface YouMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  search_results?: Array<{
    title: string;
    url: string;
    snippet?: string;
  }>;
  sources?: Array<{
    name: string;
    url: string;
  }>;
}

interface YouConversation {
  id?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  mode?: 'smart' | 'genius' | 'create';
  messages: YouMessage[];
}

interface YouExportFormat {
  conversations?: YouConversation[];
  chats?: YouConversation[];
  history?: YouConversation[];
  threads?: YouConversation[];
  messages?: YouMessage[];
  title?: string;
  id?: string;
}

export class YouParser extends ChatArchiveParser {
  getPlatform(): string {
    return 'you';
  }

  getPlatformName(): string {
    return 'You.com';
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot === -1 ? '' : fileName.slice(lastDot).toLowerCase();
  }

  canParse(file: File): boolean {
    const ext = this.getFileExtension(file.name);
    if (ext !== '.json') return false;

    const name = file.name.toLowerCase();
    if (name.includes('you') || name.includes('youchat')) return true;
    if (name.includes('you_com')) return true;

    return true;
  }

  async parse(content: string, fileName: string): Promise<ParseResult> {
    try {
      const data: YouExportFormat = JSON.parse(content);
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
      } else if (Array.isArray(data.chats)) {
        for (const conv of data.chats) {
          if (this.isValidConversation(conv)) {
            conversations.push(this.parseConversation(conv));
          } else {
            warnings.push(`Invalid conversation structure in ${fileName}`);
          }
        }
      } else if (Array.isArray(data.history)) {
        for (const conv of data.history) {
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
        const conv: YouConversation = {
          id: data.id || `conv_${Date.now()}`,
          title: data.title || 'Untitled Conversation',
          messages: data.messages,
          created_at: new Date().toISOString()
        };
        conversations.push(this.parseConversation(conv));
      } else if (Array.isArray(data)) {
        const conv: YouConversation = {
          id: `conv_${Date.now()}`,
          title: 'Imported You.com Conversation',
          messages: data as YouMessage[],
          created_at: new Date().toISOString()
        };
        conversations.push(this.parseConversation(conv));
      }

      if (conversations.length === 0) {
        return {
          conversations: [],
          warnings: ['No valid You.com conversations found'],
          errors: [],
          platform: 'you'
        };
      }

      return { conversations, warnings, errors: [], platform: 'you' };
    } catch (error) {
      return {
        conversations: [],
        warnings: [],
        errors: [`Failed to parse You.com export: ${error instanceof Error ? error.message : 'Unknown error'}`],
        platform: 'you'
      };
    }
  }

  private isValidConversation(conv: unknown): conv is YouConversation {
    if (!conv || typeof conv !== 'object') return false;
    const c = conv as YouConversation;
    return Array.isArray(c.messages) && c.messages.length > 0;
  }

  private cleanContent(content: string): string {
    return content.trim();
  }

  private cleanTitle(title: string): string {
    return title.trim() || 'Untitled';
  }

  private parseConversation(conv: YouConversation): ParsedConversation {
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
            metadata: {
              searchResults: msg.search_results,
              sources: msg.sources
            }
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

    const title = this.cleanTitle(conv.title || 'Untitled You.com Conversation');

    return {
      id: this.generateId(title, startTime instanceof Date ? startTime : now),
      title,
      platform: 'you',
      messages,
      startTime: startTime instanceof Date ? startTime : now,
      endTime: endTime instanceof Date ? endTime : now,
      metadata: {
        messageCount: messages.length,
        mode: conv.mode
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
      case 'you':
      case 'youchat':
      case 'ai':
        return 'assistant';
      case 'system':
        return 'system';
      default:
        return 'assistant';
    }
  }
}

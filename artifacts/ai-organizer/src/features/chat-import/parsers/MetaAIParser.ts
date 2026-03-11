/**
 * Meta AI Parser
 * Handles Meta AI (Facebook/Instagram AI) export format
 */

import { ChatArchiveParser, ParsedConversation, ChatMessage, ParseResult } from './ChatArchiveParser';

interface MetaMessage {
  sender: 'user' | 'meta_ai' | string;
  text: string;
  timestamp?: string;
  attachments?: Array<{
    type: string;
    url?: string;
    name?: string;
  }>;
}

interface MetaConversation {
  thread_id?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  messages: MetaMessage[];
  participants?: string[];
}

interface MetaExportFormat {
  conversations?: MetaConversation[];
  threads?: MetaConversation[];
  chats?: MetaConversation[];
  messages?: MetaMessage[];
  title?: string;
  thread_id?: string;
}

export class MetaAIParser extends ChatArchiveParser {
  getPlatform(): string {
    return 'meta';
  }

  getPlatformName(): string {
    return 'Meta AI';
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot === -1 ? '' : fileName.slice(lastDot).toLowerCase();
  }

  canParse(file: File): boolean {
    const ext = this.getFileExtension(file.name);
    if (ext !== '.json') return false;

    const name = file.name.toLowerCase();
    if (name.includes('meta') || name.includes('meta_ai')) return true;
    if (name.includes('facebook') || name.includes('instagram')) return true;

    return true;
  }

  async parse(content: string, fileName: string): Promise<ParseResult> {
    try {
      const data: MetaExportFormat = JSON.parse(content);
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
      } else if (Array.isArray(data.chats)) {
        for (const conv of data.chats) {
          if (this.isValidConversation(conv)) {
            conversations.push(this.parseConversation(conv));
          } else {
            warnings.push(`Invalid conversation structure in ${fileName}`);
          }
        }
      } else if (Array.isArray(data.messages) && data.messages.length > 0) {
        const conv: MetaConversation = {
          thread_id: data.thread_id || `conv_${Date.now()}`,
          title: data.title || 'Untitled Conversation',
          messages: data.messages,
          created_at: new Date().toISOString()
        };
        conversations.push(this.parseConversation(conv));
      } else if (Array.isArray(data)) {
        const conv: MetaConversation = {
          thread_id: `conv_${Date.now()}`,
          title: 'Imported Meta AI Conversation',
          messages: data as MetaMessage[],
          created_at: new Date().toISOString()
        };
        conversations.push(this.parseConversation(conv));
      }

      if (conversations.length === 0) {
        return {
          conversations: [],
          warnings: ['No valid Meta AI conversations found'],
          errors: [],
          platform: 'meta'
        };
      }

      return { conversations, warnings, errors: [], platform: 'meta' };
    } catch (error) {
      return {
        conversations: [],
        warnings: [],
        errors: [`Failed to parse Meta AI export: ${error instanceof Error ? error.message : 'Unknown error'}`],
        platform: 'meta'
      };
    }
  }

  private isValidConversation(conv: unknown): conv is MetaConversation {
    if (!conv || typeof conv !== 'object') return false;
    const c = conv as MetaConversation;
    return Array.isArray(c.messages) && c.messages.length > 0;
  }

  private cleanContent(content: string): string {
    return content.trim();
  }

  private cleanTitle(title: string): string {
    return title.trim() || 'Untitled';
  }

  private parseConversation(conv: MetaConversation): ParsedConversation {
    const messages: ChatMessage[] = [];

    for (const msg of conv.messages) {
      if (msg && typeof msg === 'object') {
        const role = this.mapRole(msg.sender);
        const content = this.cleanContent(msg.text || '');

        if (content) {
          const timestamp = msg.timestamp ? new Date(msg.timestamp) : new Date();
          messages.push({
            role,
            content,
            timestamp,
            metadata: msg.attachments ? { attachments: msg.attachments } : undefined
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

    const title = this.cleanTitle(conv.title || 'Untitled Meta AI Conversation');

    return {
      id: this.generateId(title, startTime instanceof Date ? startTime : now),
      title,
      platform: 'meta',
      messages,
      startTime: startTime instanceof Date ? startTime : now,
      endTime: endTime instanceof Date ? endTime : now,
      metadata: {
        messageCount: messages.length,
        threadId: conv.thread_id,
        participants: conv.participants
      }
    };
  }

  private mapRole(sender?: string): 'user' | 'assistant' | 'system' {
    if (!sender) return 'assistant';
    const normalized = sender.toLowerCase().trim();

    switch (normalized) {
      case 'user':
      case 'human':
      case 'you':
        return 'user';
      case 'meta_ai':
      case 'metaai':
      case 'assistant':
      case 'ai':
      case 'meta':
        return 'assistant';
      case 'system':
        return 'system';
      default:
        return 'assistant';
    }
  }
}

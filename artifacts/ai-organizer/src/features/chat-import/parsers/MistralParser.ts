/**
 * Mistral AI Parser
 * Handles Mistral AI / Le Chat export format
 */

import { ChatArchiveParser, ParsedConversation, ChatMessage, ParseResult } from './ChatArchiveParser';

interface MistralMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  model?: string;
  attachments?: Array<{
    type: string;
    name: string;
    url?: string;
  }>;
}

interface MistralConversation {
  id?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  model?: string;
  messages: MistralMessage[];
}

interface MistralExportFormat {
  conversations?: MistralConversation[];
  chats?: MistralConversation[];
  history?: MistralConversation[];
  messages?: MistralMessage[];
  title?: string;
  id?: string;
}

export class MistralParser extends ChatArchiveParser {
  getPlatform(): string {
    return 'mistral';
  }

  getPlatformName(): string {
    return 'Mistral AI';
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot === -1 ? '' : fileName.slice(lastDot).toLowerCase();
  }

  canParse(file: File): boolean {
    const ext = this.getFileExtension(file.name);
    if (ext !== '.json') return false;

    const name = file.name.toLowerCase();
    if (name.includes('mistral')) return true;
    if (name.includes('lechat') || name.includes('le_chat')) return true;

    return true;
  }

  async parse(content: string, fileName: string): Promise<ParseResult> {
    try {
      const data: MistralExportFormat = JSON.parse(content);
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
      } else if (Array.isArray(data.messages) && data.messages.length > 0) {
        const conv: MistralConversation = {
          id: data.id || `conv_${Date.now()}`,
          title: data.title || 'Untitled Conversation',
          messages: data.messages,
          created_at: new Date().toISOString()
        };
        conversations.push(this.parseConversation(conv));
      } else if (Array.isArray(data)) {
        const conv: MistralConversation = {
          id: `conv_${Date.now()}`,
          title: 'Imported Mistral Conversation',
          messages: data as MistralMessage[],
          created_at: new Date().toISOString()
        };
        conversations.push(this.parseConversation(conv));
      }

      if (conversations.length === 0) {
        return {
          conversations: [],
          warnings: ['No valid Mistral conversations found'],
          errors: [],
          platform: 'mistral'
        };
      }

      return { conversations, warnings, errors: [], platform: 'mistral' };
    } catch (error) {
      return {
        conversations: [],
        warnings: [],
        errors: [`Failed to parse Mistral export: ${error instanceof Error ? error.message : 'Unknown error'}`],
        platform: 'mistral'
      };
    }
  }

  private isValidConversation(conv: unknown): conv is MistralConversation {
    if (!conv || typeof conv !== 'object') return false;
    const c = conv as MistralConversation;
    return Array.isArray(c.messages) && c.messages.length > 0;
  }

  private cleanContent(content: string): string {
    return content.trim();
  }

  private cleanTitle(title: string): string {
    return title.trim() || 'Untitled';
  }

  private parseConversation(conv: MistralConversation): ParsedConversation {
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

    const title = this.cleanTitle(conv.title || 'Untitled Mistral Conversation');

    return {
      id: this.generateId(title, startTime instanceof Date ? startTime : now),
      title,
      platform: 'mistral',
      messages,
      startTime: startTime instanceof Date ? startTime : now,
      endTime: endTime instanceof Date ? endTime : now,
      metadata: {
        messageCount: messages.length,
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
      case 'mistral':
      case 'ai':
        return 'assistant';
      case 'system':
        return 'system';
      default:
        return 'assistant';
    }
  }
}

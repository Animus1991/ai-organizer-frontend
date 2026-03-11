/**
 * DeepSeek Parser
 * Handles DeepSeek AI chat export format
 */

import { ChatArchiveParser, ParsedConversation, ChatMessage, ParseResult } from './ChatArchiveParser';

interface DeepSeekMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  model?: string;
  finish_reason?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

interface DeepSeekConversation {
  id?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  model?: string;
  messages: DeepSeekMessage[];
  metadata?: {
    total_tokens?: number;
    total_messages?: number;
  };
}

interface DeepSeekExportFormat {
  conversations?: DeepSeekConversation[];
  chats?: DeepSeekConversation[];
  history?: DeepSeekConversation[];
  messages?: DeepSeekMessage[];
  title?: string;
  id?: string;
}

export class DeepSeekParser extends ChatArchiveParser {
  getPlatform(): string {
    return 'deepseek';
  }

  getPlatformName(): string {
    return 'DeepSeek AI';
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot === -1 ? '' : fileName.slice(lastDot).toLowerCase();
  }

  canParse(file: File): boolean {
    const ext = this.getFileExtension(file.name);
    if (ext !== '.json') return false;

    const name = file.name.toLowerCase();
    if (name.includes('deepseek')) return true;
    if (name.includes('deep_seek')) return true;

    return true;
  }

  async parse(content: string, fileName: string): Promise<ParseResult> {
    try {
      const data: DeepSeekExportFormat = JSON.parse(content);
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
        const conv: DeepSeekConversation = {
          id: data.id || `conv_${Date.now()}`,
          title: data.title || 'Untitled Conversation',
          messages: data.messages,
          created_at: new Date().toISOString()
        };
        conversations.push(this.parseConversation(conv));
      } else if (Array.isArray(data)) {
        const conv: DeepSeekConversation = {
          id: `conv_${Date.now()}`,
          title: 'Imported DeepSeek Conversation',
          messages: data as DeepSeekMessage[],
          created_at: new Date().toISOString()
        };
        conversations.push(this.parseConversation(conv));
      }

      if (conversations.length === 0) {
        return {
          conversations: [],
          warnings: ['No valid DeepSeek conversations found'],
          errors: [],
          platform: 'deepseek'
        };
      }

      return { conversations, warnings, errors: [], platform: 'deepseek' };
    } catch (error) {
      return {
        conversations: [],
        warnings: [],
        errors: [`Failed to parse DeepSeek export: ${error instanceof Error ? error.message : 'Unknown error'}`],
        platform: 'deepseek'
      };
    }
  }

  private isValidConversation(conv: unknown): conv is DeepSeekConversation {
    if (!conv || typeof conv !== 'object') return false;
    const c = conv as DeepSeekConversation;
    return Array.isArray(c.messages) && c.messages.length > 0;
  }

  private cleanContent(content: string): string {
    return content.trim();
  }

  private cleanTitle(title: string): string {
    return title.trim() || 'Untitled';
  }

  private parseConversation(conv: DeepSeekConversation): ParsedConversation {
    const messages: ChatMessage[] = [];
    let totalTokens = 0;

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
            metadata: msg.usage ? { tokens: msg.usage } : undefined
          });
          totalTokens += msg.usage?.total_tokens || 0;
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

    const title = this.cleanTitle(conv.title || 'Untitled DeepSeek Conversation');

    return {
      id: this.generateId(title, startTime instanceof Date ? startTime : now),
      title,
      platform: 'deepseek',
      messages,
      startTime: startTime instanceof Date ? startTime : now,
      endTime: endTime instanceof Date ? endTime : now,
      metadata: {
        messageCount: messages.length,
        model: conv.model || messages.find(m => m.metadata?.model)?.metadata?.model,
        totalTokens: totalTokens
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
      case 'deepseek':
      case 'ai':
        return 'assistant';
      case 'system':
        return 'system';
      default:
        return 'assistant';
    }
  }
}

/**
 * HuggingChat Parser
 * Handles Hugging Face HuggingChat export format
 */

import { ChatArchiveParser, ParsedConversation, ChatMessage, ParseResult } from './ChatArchiveParser';

interface HuggingMessage {
  from: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
  updated_at?: string;
  id?: string;
  web_search?: Array<{
    title: string;
    link: string;
    snippet?: string;
  }>;
}

interface HuggingConversation {
  id?: string;
  title?: string;
  model?: string;
  system_prompt?: string;
  created_at?: string;
  updated_at?: string;
  messages: HuggingMessage[];
}

interface HuggingExportFormat {
  conversations?: HuggingConversation[];
  history?: HuggingConversation[];
  threads?: HuggingConversation[];
  title?: string;
  id?: string;
  model?: string;
  messages?: HuggingMessage[];
}

export class HuggingChatParser extends ChatArchiveParser {
  getPlatform(): string {
    return 'huggingface';
  }

  getPlatformName(): string {
    return 'HuggingChat';
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot === -1 ? '' : fileName.slice(lastDot).toLowerCase();
  }

  canParse(file: File): boolean {
    const ext = this.getFileExtension(file.name);
    if (ext !== '.json') return false;

    const name = file.name.toLowerCase();
    if (name.includes('huggingface') || name.includes('hugging_face')) return true;
    if (name.includes('huggingchat') || name.includes('hf_chat')) return true;

    return true;
  }

  async parse(content: string, fileName: string): Promise<ParseResult> {
    try {
      const data: HuggingExportFormat = JSON.parse(content);
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
        const conv: HuggingConversation = {
          id: data.id || `conv_${Date.now()}`,
          title: data.title || 'Untitled Conversation',
          model: data.model,
          messages: data.messages,
          created_at: new Date().toISOString()
        };
        conversations.push(this.parseConversation(conv));
      } else if (Array.isArray(data)) {
        const conv: HuggingConversation = {
          id: `conv_${Date.now()}`,
          title: 'Imported HuggingChat Conversation',
          messages: data as HuggingMessage[],
          created_at: new Date().toISOString()
        };
        conversations.push(this.parseConversation(conv));
      }

      if (conversations.length === 0) {
        return {
          conversations: [],
          warnings: ['No valid HuggingChat conversations found'],
          errors: [],
          platform: 'huggingface'
        };
      }

      return { conversations, warnings, errors: [], platform: 'huggingface' };
    } catch (error) {
      return {
        conversations: [],
        warnings: [],
        errors: [`Failed to parse HuggingChat export: ${error instanceof Error ? error.message : 'Unknown error'}`],
        platform: 'huggingface'
      };
    }
  }

  private isValidConversation(conv: unknown): conv is HuggingConversation {
    if (!conv || typeof conv !== 'object') return false;
    const c = conv as HuggingConversation;
    return Array.isArray(c.messages) && c.messages.length > 0;
  }

  private cleanContent(content: string): string {
    return content.trim();
  }

  private cleanTitle(title: string): string {
    return title.trim() || 'Untitled';
  }

  private parseConversation(conv: HuggingConversation): ParsedConversation {
    const messages: ChatMessage[] = [];

    for (const msg of conv.messages) {
      if (msg && typeof msg === 'object') {
        const role = this.mapRole(msg.from);
        const content = this.cleanContent(msg.content || '');

        if (content) {
          const timestamp = msg.created_at ? new Date(msg.created_at) : new Date();
          messages.push({
            role,
            content,
            timestamp,
            metadata: msg.web_search ? { webSearch: msg.web_search } : undefined
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

    const title = this.cleanTitle(conv.title || 'Untitled HuggingChat Conversation');

    return {
      id: this.generateId(title, startTime instanceof Date ? startTime : now),
      title,
      platform: 'huggingface',
      messages,
      startTime: startTime instanceof Date ? startTime : now,
      endTime: endTime instanceof Date ? endTime : now,
      metadata: {
        messageCount: messages.length,
        model: conv.model,
        systemPrompt: conv.system_prompt
      }
    };
  }

  private mapRole(from?: string): 'user' | 'assistant' | 'system' {
    if (!from) return 'assistant';
    const normalized = from.toLowerCase().trim();

    switch (normalized) {
      case 'user':
      case 'human':
        return 'user';
      case 'assistant':
      case 'huggingface':
      case 'hf':
      case 'ai':
        return 'assistant';
      case 'system':
        return 'system';
      default:
        return 'assistant';
    }
  }
}

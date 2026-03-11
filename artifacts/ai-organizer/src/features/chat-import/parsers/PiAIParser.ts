/**
 * Pi AI Parser
 * Handles Inflection AI Pi chat export format
 */

import { ChatArchiveParser, ParsedConversation, ChatMessage, ParseResult } from './ChatArchiveParser';

interface PiMessage {
  sender: 'user' | 'pi' | string;
  text: string;
  timestamp?: string;
  type?: 'message' | 'suggestion' | 'image';
  metadata?: {
    voice?: boolean;
    suggested_replies?: string[];
  };
}

interface PiConversation {
  thread_id?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  messages: PiMessage[];
  topic?: string;
  mode?: 'chat' | 'voice' | 'discover';
}

interface PiExportFormat {
  conversations?: PiConversation[];
  threads?: PiConversation[];
  history?: PiConversation[];
  messages?: PiMessage[];
  title?: string;
}

export class PiAIParser extends ChatArchiveParser {
  getPlatform(): string {
    return 'pi';
  }

  getPlatformName(): string {
    return 'Pi AI';
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot === -1 ? '' : fileName.slice(lastDot).toLowerCase();
  }

  canParse(file: File): boolean {
    const ext = this.getFileExtension(file.name);
    if (ext !== '.json') return false;

    const name = file.name.toLowerCase();
    if (name.includes('pi') || name.includes('inflection')) return true;
    if (name.includes('pi_ai') || name.includes('hey_pi')) return true;

    return true;
  }

  async parse(content: string, fileName: string): Promise<ParseResult> {
    try {
      const data: PiExportFormat = JSON.parse(content);
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
      } else if (Array.isArray(data.history)) {
        for (const conv of data.history) {
          if (this.isValidConversation(conv)) {
            conversations.push(this.parseConversation(conv));
          } else {
            warnings.push(`Invalid conversation structure in ${fileName}`);
          }
        }
      } else if (Array.isArray(data.messages) && data.messages.length > 0) {
        const conv: PiConversation = {
          thread_id: `conv_${Date.now()}`,
          title: data.title || 'Untitled Pi Conversation',
          messages: data.messages,
          created_at: new Date().toISOString()
        };
        conversations.push(this.parseConversation(conv));
      } else if (Array.isArray(data)) {
        const conv: PiConversation = {
          thread_id: `conv_${Date.now()}`,
          title: 'Imported Pi Conversation',
          messages: data as PiMessage[],
          created_at: new Date().toISOString()
        };
        conversations.push(this.parseConversation(conv));
      }

      if (conversations.length === 0) {
        return {
          conversations: [],
          warnings: ['No valid Pi AI conversations found'],
          errors: [],
          platform: 'pi'
        };
      }

      return { conversations, warnings, errors: [], platform: 'pi' };
    } catch (error) {
      return {
        conversations: [],
        warnings: [],
        errors: [`Failed to parse Pi AI export: ${error instanceof Error ? error.message : 'Unknown error'}`],
        platform: 'pi'
      };
    }
  }

  private isValidConversation(conv: unknown): conv is PiConversation {
    if (!conv || typeof conv !== 'object') return false;
    const c = conv as PiConversation;
    return Array.isArray(c.messages) && c.messages.length > 0;
  }

  private parseConversation(conv: PiConversation): ParsedConversation {
    const messages: ChatMessage[] = [];

    for (const msg of conv.messages) {
      if (msg && typeof msg === 'object' && msg.text) {
        // Skip suggestions and non-message types
        if (msg.type && msg.type !== 'message') continue;

        const role = this.mapRole(msg.sender);
        const content = this.cleanContent(msg.text);

        if (content) {
          const timestamp = msg.timestamp ? new Date(msg.timestamp) : new Date();
          messages.push({
            role,
            content,
            timestamp,
            metadata: msg.metadata ? { 
              voice: msg.metadata.voice,
              suggestedReplies: msg.metadata.suggested_replies 
            } : undefined
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

    const title = this.cleanTitle(conv.title || conv.topic || 'Untitled Pi Conversation');

    return {
      id: this.generateId(title, startTime instanceof Date ? startTime : now),
      title,
      platform: 'pi',
      messages,
      startTime: startTime instanceof Date ? startTime : now,
      endTime: endTime instanceof Date ? endTime : now,
      metadata: {
        messageCount: messages.length,
        threadId: conv.thread_id,
        mode: conv.mode,
        topic: conv.topic
      }
    };
  }

  private cleanContent(content: string): string {
    return content.trim();
  }

  private cleanTitle(title: string): string {
    return title.trim() || 'Untitled';
  }

  private mapRole(sender?: string): 'user' | 'assistant' | 'system' {
    if (!sender) return 'assistant';
    const normalized = sender.toLowerCase().trim();

    switch (normalized) {
      case 'user':
      case 'human':
      case 'you':
        return 'user';
      case 'pi':
      case 'inflection':
      case 'assistant':
      case 'ai':
        return 'assistant';
      case 'system':
        return 'system';
      default:
        return 'assistant';
    }
  }
}

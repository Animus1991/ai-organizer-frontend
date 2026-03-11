/**
 * Copilot Parser
 * Handles Microsoft Copilot/Bing Chat export format
 */

import { ChatArchiveParser, ParsedConversation, ChatMessage, ParseResult } from './ChatArchiveParser';

interface CopilotMessage {
  author: 'user' | 'bot' | string;
  text: string;
  timestamp?: string;
  messageType?: 'chat' | 'internalSearchQuery' | 'internalSearchResult' | string;
  hiddenText?: string;
}

interface CopilotConversation {
  conversationId?: string;
  conversationSignature?: string;
  clientId?: string;
  title?: string;
  messages: CopilotMessage[];
  creationDate?: string;
  updateDate?: string;
}

interface CopilotExportFormat {
  conversations?: CopilotConversation[];
  chatHistory?: CopilotConversation[];
  // Alternative: single conversation at root
  messages?: CopilotMessage[];
  title?: string;
  conversationId?: string;
}

export class CopilotParser extends ChatArchiveParser {
  getPlatform(): string {
    return 'copilot';
  }

  getPlatformName(): string {
    return 'Microsoft Copilot';
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot === -1 ? '' : fileName.slice(lastDot).toLowerCase();
  }

  canParse(file: File): boolean {
    const ext = this.getFileExtension(file.name);
    if (ext !== '.json') return false;

    const name = file.name.toLowerCase();
    if (name.includes('copilot') || name.includes('bing')) return true;
    if (name.includes('microsoft') || name.includes('ms-chat')) return true;

    return true;
  }

  async parse(content: string, fileName: string): Promise<ParseResult> {
    try {
      const data: CopilotExportFormat = JSON.parse(content);
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
      } else if (Array.isArray(data.chatHistory)) {
        for (const conv of data.chatHistory) {
          if (this.isValidConversation(conv)) {
            conversations.push(this.parseConversation(conv));
          } else {
            warnings.push(`Invalid conversation structure in ${fileName}`);
          }
        }
      } else if (Array.isArray(data.messages) && data.messages.length > 0) {
        const conv: CopilotConversation = {
          conversationId: data.conversationId || `conv_${Date.now()}`,
          title: data.title || 'Untitled Conversation',
          messages: data.messages,
          creationDate: new Date().toISOString()
        };
        conversations.push(this.parseConversation(conv));
      } else if (Array.isArray(data)) {
        const conv: CopilotConversation = {
          conversationId: `conv_${Date.now()}`,
          title: 'Imported Copilot Conversation',
          messages: data as CopilotMessage[],
          creationDate: new Date().toISOString()
        };
        conversations.push(this.parseConversation(conv));
      }

      if (conversations.length === 0) {
        return {
          conversations: [],
          warnings: ['No valid Copilot conversations found'],
          errors: [],
          platform: 'copilot'
        };
      }

      return { conversations, warnings, errors: [], platform: 'copilot' };
    } catch (error) {
      return {
        conversations: [],
        warnings: [],
        errors: [`Failed to parse Copilot export: ${error instanceof Error ? error.message : 'Unknown error'}`],
        platform: 'copilot'
      };
    }
  }

  private isValidConversation(conv: unknown): conv is CopilotConversation {
    if (!conv || typeof conv !== 'object') return false;
    const c = conv as CopilotConversation;
    return Array.isArray(c.messages) && c.messages.length > 0;
  }

  private cleanContent(content: string): string {
    return content.trim();
  }

  private cleanTitle(title: string): string {
    return title.trim() || 'Untitled';
  }

  private parseConversation(conv: CopilotConversation): ParsedConversation {
    const messages: ChatMessage[] = [];

    for (const msg of conv.messages) {
      if (msg && typeof msg === 'object' && msg.text) {
        const role = this.mapRole(msg.author);
        const content = this.cleanContent(msg.text);

        if (content && msg.messageType !== 'internalSearchQuery' && msg.messageType !== 'internalSearchResult') {
          const timestamp = msg.timestamp ? new Date(msg.timestamp) : new Date();
          messages.push({
            role,
            content,
            timestamp,
            metadata: msg.hiddenText ? { hiddenText: msg.hiddenText } : undefined
          });
        }
      }
    }

    const now = new Date();
    const startTime = messages.length > 0 && messages[0].timestamp
      ? messages[0].timestamp
      : conv.creationDate
        ? new Date(conv.creationDate)
        : now;

    const endTime = messages.length > 0 && messages[messages.length - 1].timestamp
      ? messages[messages.length - 1].timestamp
      : conv.updateDate
        ? new Date(conv.updateDate)
        : now;

    const title = this.cleanTitle(conv.title || 'Untitled Copilot Conversation');

    return {
      id: this.generateId(title, startTime instanceof Date ? startTime : now),
      title,
      platform: 'copilot',
      messages,
      startTime: startTime instanceof Date ? startTime : now,
      endTime: endTime instanceof Date ? endTime : now,
      metadata: {
        messageCount: messages.length,
        conversationId: conv.conversationId,
        clientId: conv.clientId
      }
    };
  }

  private mapRole(author?: string): 'user' | 'assistant' | 'system' {
    if (!author) return 'assistant';
    const normalized = author.toLowerCase().trim();

    switch (normalized) {
      case 'user':
      case 'human':
        return 'user';
      case 'bot':
      case 'assistant':
      case 'copilot':
      case 'bing':
        return 'assistant';
      case 'system':
        return 'system';
      default:
        return 'assistant';
    }
  }
}

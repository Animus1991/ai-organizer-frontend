/**
 * Character.AI Parser
 * Handles Character.AI chat export format
 */

import { ChatArchiveParser, ParsedConversation, ChatMessage, ParseResult } from './ChatArchiveParser';

interface CharacterAIMessage {
  participant__name?: string;
  participant__user__username?: string;
  text: string;
  created: string;
  image_rel_path?: string;
  image_prompt?: string;
  src__character__participant__name?: string;
  src__user__participant__name?: string;
  is_user: boolean;
}

interface CharacterAIConversation {
  external_id?: string;
  created: string;
  last_interaction: string;
  chat__character__name?: string;
  chat__character__title?: string;
  chat__character__description?: string;
  msgs: CharacterAIMessage[];
}

interface CharacterAIExport {
  user_username?: string;
  conversations?: CharacterAIConversation[];
  hist_retriever?: CharacterAIConversation[];
  history?: CharacterAIConversation[];
}

export class CharacterAIParser extends ChatArchiveParser {
  getPlatform(): string {
    return 'characterai';
  }

  getPlatformName(): string {
    return 'Character.AI';
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot === -1 ? '' : fileName.slice(lastDot).toLowerCase();
  }

  canParse(file: File): boolean {
    const ext = this.getFileExtension(file.name);
    if (ext !== '.json') return false;

    const name = file.name.toLowerCase();
    if (name.includes('character') || name.includes('cai')) return true;
    if (name.includes('characterai') || name.includes('char_ai')) return true;

    return true;
  }

  async parse(content: string, fileName: string): Promise<ParseResult> {
    try {
      const data: CharacterAIExport = JSON.parse(content);
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
      } else if (Array.isArray(data.hist_retriever)) {
        for (const conv of data.hist_retriever) {
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
      } else if (this.isValidConversation(data)) {
        conversations.push(this.parseConversation(data as CharacterAIConversation));
      }

      if (conversations.length === 0) {
        return {
          conversations: [],
          warnings: ['No valid Character.AI conversations found'],
          errors: [],
          platform: 'characterai'
        };
      }

      return { conversations, warnings, errors: [], platform: 'characterai' };
    } catch (error) {
      return {
        conversations: [],
        warnings: [],
        errors: [`Failed to parse Character.AI export: ${error instanceof Error ? error.message : 'Unknown error'}`],
        platform: 'characterai'
      };
    }
  }

  private isValidConversation(conv: unknown): conv is CharacterAIConversation {
    if (!conv || typeof conv !== 'object') return false;
    const c = conv as CharacterAIConversation;
    return Array.isArray(c.msgs) && c.msgs.length > 0;
  }

  private parseConversation(conv: CharacterAIConversation): ParsedConversation {
    const messages: ChatMessage[] = [];
    const characterName = conv.chat__character__name || 'Character';

    for (const msg of conv.msgs) {
      if (msg && typeof msg === 'object' && msg.text) {
        const role = msg.is_user ? 'user' : 'assistant';
        const content = this.cleanContent(msg.text);

        if (content) {
          const timestamp = new Date(msg.created);
          messages.push({
            role,
            content,
            timestamp,
            metadata: {
              imagePath: msg.image_rel_path,
              imagePrompt: msg.image_prompt,
              senderName: msg.participant__name || (msg.is_user ? 'You' : characterName)
            }
          });
        }
      }
    }

    const now = new Date();
    const startTime = messages.length > 0 && messages[0].timestamp
      ? messages[0].timestamp
      : conv.created
        ? new Date(conv.created)
        : now;

    const endTime = messages.length > 0 && messages[messages.length - 1].timestamp
      ? messages[messages.length - 1].timestamp
      : conv.last_interaction
        ? new Date(conv.last_interaction)
        : now;

    const title = this.cleanTitle(
      conv.chat__character__title || 
      conv.chat__character__name || 
      `Chat with ${characterName}`
    );

    return {
      id: this.generateId(title, startTime instanceof Date ? startTime : now),
      title,
      platform: 'characterai',
      messages,
      startTime: startTime instanceof Date ? startTime : now,
      endTime: endTime instanceof Date ? endTime : now,
      metadata: {
        messageCount: messages.length,
        externalId: conv.external_id,
        characterName: characterName,
        characterDescription: conv.chat__character__description
      }
    };
  }

  private cleanContent(content: string): string {
    return content.trim();
  }

  private cleanTitle(title: string): string {
    return title.trim() || 'Untitled';
  }
}

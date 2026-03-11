/**
 * ChatGPT Archive Parser
 * Handles OpenAI's ChatGPT export format (conversations.json)
 * Supports both single JSON and ZIP archives
 */

import { ChatArchiveParser, ParseResult, ParsedConversation, ChatMessage, ParserRegistry } from './ChatArchiveParser';

interface ChatGPTNode {
  id?: string;
  message?: {
    author?: {
      role?: string;
      name?: string;
    };
    content?: {
      content_type?: string;
      parts?: string[];
      text?: string;
    };
    create_time?: number;
    metadata?: any;
  };
  children?: string[];
}

interface ChatGPTConversation {
  title: string;
  create_time: number;
  update_time: number;
  mapping: Record<string, ChatGPTNode>;
  moderation_results?: any[];
  current_node?: string;
  plugin_ids?: string[] | null;
  conversation_id?: string;
  conversation_template_id?: string | null;
  gizmo_id?: string | null;
  is_archived?: boolean;
  default_model_slug?: string;
}

export class ChatGPTParser extends ChatArchiveParser {
  getPlatform(): string {
    return 'chatgpt';
  }

  canParse(file: File): boolean {
    const name = file.name.toLowerCase();
    return name.endsWith('.json') || name.endsWith('.zip');
  }

  async parse(content: string | ArrayBuffer, fileName: string): Promise<ParseResult> {
    const result: ParseResult = {
      conversations: [],
      errors: [],
      warnings: [],
      platform: this.getPlatform()
    };

    try {
      let jsonContent: string;

      // Handle ZIP files
      if (fileName.toLowerCase().endsWith('.zip')) {
        jsonContent = await this.extractFromZip(content as ArrayBuffer);
      } else {
        jsonContent = content as string;
      }

      // Parse JSON
      let data: any;
      try {
        data = JSON.parse(jsonContent);
      } catch (e) {
        result.errors.push(`Invalid JSON format: ${e instanceof Error ? e.message : 'Unknown error'}`);
        return result;
      }

      // Handle both array and object formats
      const conversations: ChatGPTConversation[] = Array.isArray(data) ? data : [data];

      for (const conv of conversations) {
        try {
          const parsed = this.parseConversation(conv);
          if (parsed.messages.length > 0) {
            result.conversations.push(parsed);
          } else {
            result.warnings.push(`Conversation "${conv.title}" has no messages, skipping`);
          }
        } catch (e) {
          result.errors.push(`Failed to parse conversation "${conv.title}": ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

    } catch (e) {
      result.errors.push(`Failed to process file: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    return result;
  }

  private async extractFromZip(_arrayBuffer: ArrayBuffer): Promise<string> {
    throw new Error('ZIP extraction should be handled before calling parse()');
  }

  private parseConversation(conv: ChatGPTConversation): ParsedConversation {
    const messages: ChatMessage[] = [];
    const mapping = conv.mapping || {};
    const rootNodeId = this.findRootNode(mapping);
    
    if (rootNodeId) {
      this.traverseConversation(mapping, rootNodeId, messages);
    }

    messages.sort((a, b) => {
      const timeA = a.timestamp?.getTime() || 0;
      const timeB = b.timestamp?.getTime() || 0;
      return timeA - timeB;
    });

    return {
      id: this.generateId(conv.title || 'Untitled', new Date(conv.create_time * 1000)),
      title: conv.title || 'Untitled Conversation',
      messages,
      startTime: new Date(conv.create_time * 1000),
      endTime: new Date(conv.update_time * 1000),
      platform: this.getPlatform(),
      metadata: {
        messageCount: messages.length,
        model: conv.default_model_slug,
        conversationId: conv.conversation_id,
        isArchived: conv.is_archived
      }
    };
  }

  private findRootNode(mapping: Record<string, ChatGPTNode>): string | null {
    const nodeIds = Object.keys(mapping);
    for (const id of nodeIds) {
      const node = mapping[id];
      if (node && (!node.message || node.message.author?.role === 'system')) {
        let isChild = false;
        for (const otherId of nodeIds) {
          const otherNode = mapping[otherId];
          if (otherNode.children?.includes(id)) {
            isChild = true;
            break;
          }
        }
        if (!isChild) return id;
      }
    }
    return nodeIds[0] || null;
  }

  private traverseConversation(
    mapping: Record<string, ChatGPTNode>,
    nodeId: string,
    messages: ChatMessage[],
    visited: Set<string> = new Set()
  ): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = mapping[nodeId];
    if (!node) return;

    if (node.message) {
      const message = this.extractMessage(node);
      if (message) messages.push(message);
    }

    if (node.children) {
      for (const childId of node.children) {
        this.traverseConversation(mapping, childId, messages, visited);
      }
    }
  }

  private extractMessage(node: ChatGPTNode): ChatMessage | null {
    const msg = node.message;
    if (!msg) return null;

    const role = this.normalizeRole(msg.author?.role);
    const content = this.extractContent(msg.content);
    if (!content) return null;

    return {
      role,
      content,
      timestamp: msg.create_time ? new Date(msg.create_time * 1000) : undefined,
      metadata: msg.metadata
    };
  }

  private normalizeRole(role?: string): 'user' | 'assistant' | 'system' | 'tool' {
    if (!role) return 'assistant';
    const normalized = role.toLowerCase();
    if (normalized === 'user') return 'user';
    if (normalized === 'assistant' || normalized === 'model') return 'assistant';
    if (normalized === 'system') return 'system';
    if (normalized === 'tool') return 'tool';
    return 'assistant';
  }

  private extractContent(content?: any): string {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (content.parts && Array.isArray(content.parts)) {
      return content.parts.map((part: any) => {
        if (typeof part === 'string') return part;
        if (part.type === 'image') return '[Image]';
        if (part.text) return part.text;
        return JSON.stringify(part);
      }).join(' ');
    }
    if (content.text) return content.text;
    return JSON.stringify(content);
  }
}

ParserRegistry.register(new ChatGPTParser());

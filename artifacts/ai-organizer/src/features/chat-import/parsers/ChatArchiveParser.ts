/**
 * Chat Archive Parser - Base class for all AI platform parsers
 * Handles common functionality and defines interface for platform-specific implementations
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface ParsedConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  startTime: Date;
  endTime: Date;
  platform: string;
  metadata: {
    messageCount: number;
    model?: string;
    [key: string]: any;
  };
}

export interface ParseResult {
  conversations: ParsedConversation[];
  errors: string[];
  warnings: string[];
  platform: string;
}

export interface ParserOptions {
  detectBoundaries?: boolean;
  timeGapThreshold?: number; // minutes
  mergeConsecutive?: boolean;
  extractMetadata?: boolean;
}

export abstract class ChatArchiveParser {
  protected options: ParserOptions;

  constructor(options: ParserOptions = {}) {
    this.options = {
      detectBoundaries: true,
      timeGapThreshold: 30, // 30 minutes default
      mergeConsecutive: false,
      extractMetadata: true,
      ...options
    };
  }

  /**
   * Check if this parser can handle the given file
   */
  abstract canParse(file: File): boolean;

  /**
   * Parse the file content and return conversations
   */
  abstract parse(content: string | ArrayBuffer, fileName: string): Promise<ParseResult>;

  /**
   * Get the platform name this parser handles
   */
  abstract getPlatform(): string;

  /**
   * Extract text content from file
   */
  protected async extractText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Generate a unique ID for a conversation
   */
  protected generateId(title: string, timestamp: Date): string {
    const sanitized = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `${sanitized}_${timestamp.getTime()}`;
  }

  /**
   * Truncate content for preview
   */
  protected truncateContent(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }
}

/**
 * Registry of all available parsers
 */
export class ParserRegistry {
  private static parsers: ChatArchiveParser[] = [];

  static register(parser: ChatArchiveParser): void {
    this.parsers.push(parser);
  }

  static findParser(file: File): ChatArchiveParser | null {
    return this.parsers.find(parser => parser.canParse(file)) || null;
  }

  static getAllParsers(): ChatArchiveParser[] {
    return [...this.parsers];
  }

  static getSupportedPlatforms(): string[] {
    return this.parsers.map(p => p.getPlatform());
  }
}

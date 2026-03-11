/**
 * Conversation Folder Manager
 * Manages folder creation and organization for imported conversations
 */

import { Segment } from '../segmentation/TimeBasedSegmentation';
import { ParsedConversation } from '../parsers/ChatArchiveParser';

export interface ConversationFolder {
  id: string;
  name: string;
  description?: string;
  platform: string;
  conversationId: string;
  segments: Segment[];
  createdAt: Date;
  metadata: {
    totalMessages: number;
    totalWords: number;
    topics: string[];
    keywords: string[];
  };
}

export interface FolderOrganizationOptions {
  groupBy: 'platform' | 'topic' | 'date' | 'sentiment' | 'custom';
  createSubfolders: boolean;
  customTags?: string[];
}

export class ConversationFolderManager {
  private folders: Map<string, ConversationFolder> = new Map();

  createFolder(
    conversation: ParsedConversation,
    segments: Segment[],
    options: FolderOrganizationOptions
  ): ConversationFolder {
    const folderName = this.generateFolderName(conversation, options);
    const folderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const allTopics = new Set<string>();
    const allKeywords = new Set<string>();
    let totalMessages = 0;
    let totalWords = 0;

    segments.forEach(segment => {
      segment.topics.forEach(t => allTopics.add(t));
      segment.keywords.forEach(k => allKeywords.add(k));
      totalMessages += segment.messageCount;
      totalWords += segment.wordCount;
    });

    const folder: ConversationFolder = {
      id: folderId,
      name: folderName,
      description: this.generateDescription(conversation, segments),
      platform: conversation.platform,
      conversationId: conversation.id,
      segments,
      createdAt: new Date(),
      metadata: {
        totalMessages,
        totalWords,
        topics: Array.from(allTopics),
        keywords: Array.from(allKeywords).slice(0, 20)
      }
    };

    this.folders.set(folderId, folder);
    return folder;
  }

  private generateFolderName(conversation: ParsedConversation, options: FolderOrganizationOptions): string {
    switch (options.groupBy) {
      case 'platform':
        return `${this.capitalize(conversation.platform)} - ${conversation.title}`;
      case 'topic':
        const mainTopic = this.extractMainTopic(conversation);
        return `${mainTopic} - ${conversation.title}`;
      case 'date':
        const date = conversation.startTime.toISOString().split('T')[0];
        return `${date} - ${conversation.title}`;
      case 'sentiment':
        const sentiment = this.analyzeOverallSentiment(conversation);
        return `[${sentiment}] ${conversation.title}`;
      case 'custom':
        const tags = options.customTags?.join(', ') || 'Imported';
        return `[${tags}] ${conversation.title}`;
      default:
        return conversation.title;
    }
  }

  private generateDescription(conversation: ParsedConversation, segments: Segment[]): string {
    const lines = [
      `Platform: ${this.capitalize(conversation.platform)}`,
      `Messages: ${conversation.messages.length}`,
      `Segments: ${segments.length}`,
      `Date Range: ${conversation.startTime.toLocaleDateString()} - ${conversation.endTime.toLocaleDateString()}`,
      `Topics: ${segments.flatMap(s => s.topics).slice(0, 5).join(', ')}`
    ];
    return lines.join('\n');
  }

  private extractMainTopic(conversation: ParsedConversation): string {
    const wordFreq = new Map<string, number>();
    const text = conversation.messages.map(m => m.content.toLowerCase()).join(' ');
    const words = text.match(/\b[a-z]{5,}\b/g) || [];
    
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    const sorted = Array.from(wordFreq.entries()).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'General';
  }

  private analyzeOverallSentiment(conversation: ParsedConversation): string {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'happy', 'thanks'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'sorry', 'error'];

    let positive = 0;
    let negative = 0;

    conversation.messages.forEach(msg => {
      const text = msg.content.toLowerCase();
      positiveWords.forEach(w => { if (text.includes(w)) positive++; });
      negativeWords.forEach(w => { if (text.includes(w)) negative++; });
    });

    if (positive > negative * 1.5) return 'Positive';
    if (negative > positive * 1.5) return 'Negative';
    return 'Neutral';
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  getFolder(id: string): ConversationFolder | undefined {
    return this.folders.get(id);
  }

  getAllFolders(): ConversationFolder[] {
    return Array.from(this.folders.values());
  }

  getFoldersByPlatform(platform: string): ConversationFolder[] {
    return this.getAllFolders().filter(f => f.platform === platform);
  }

  searchFolders(query: string): ConversationFolder[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllFolders().filter(f =>
      f.name.toLowerCase().includes(lowerQuery) ||
      f.metadata.topics.some(t => t.toLowerCase().includes(lowerQuery)) ||
      f.metadata.keywords.some(k => k.toLowerCase().includes(lowerQuery))
    );
  }

  deleteFolder(id: string): boolean {
    return this.folders.delete(id);
  }
}

export const folderManager = new ConversationFolderManager();

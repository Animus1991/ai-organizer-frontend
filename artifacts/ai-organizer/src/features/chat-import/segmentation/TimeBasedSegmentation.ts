/**
 * Conversation Segmentation Engine
 * Scientific methods for splitting conversations into meaningful segments
 */

import { ChatMessage, ParsedConversation } from '../parsers/ChatArchiveParser';

export interface Segment {
  id: string;
  title: string;
  messages: ChatMessage[];
  startTime: Date;
  endTime: Date;
  topics: string[];
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  messageCount: number;
  wordCount: number;
  parentConversationId: string;
}

export interface SegmentationStrategy {
  name: string;
  description: string;
  segment(conversation: ParsedConversation): Segment[];
}

export class TimeBasedSegmentation implements SegmentationStrategy {
  name = 'Time-Based';
  description = 'Segments by temporal gaps between messages';
  private thresholdMinutes: number;

  constructor(thresholdMinutes: number = 30) {
    this.thresholdMinutes = thresholdMinutes;
  }

  segment(conversation: ParsedConversation): Segment[] {
    const segments: Segment[] = [];
    let currentSegment: ChatMessage[] = [];
    let segmentStartTime: Date | null = null;

    for (let i = 0; i < conversation.messages.length; i++) {
      const msg = conversation.messages[i];
      const msgTime = msg.timestamp || new Date();

      if (currentSegment.length === 0) {
        currentSegment.push(msg);
        segmentStartTime = msgTime;
        continue;
      }

      const lastMsg = currentSegment[currentSegment.length - 1];
      const lastTime = lastMsg.timestamp || new Date();
      const diffMinutes = (msgTime.getTime() - lastTime.getTime()) / (1000 * 60);

      if (diffMinutes > this.thresholdMinutes) {
        segments.push(this.createSegment(currentSegment, conversation, segments.length, segmentStartTime!));
        currentSegment = [msg];
        segmentStartTime = msgTime;
      } else {
        currentSegment.push(msg);
      }
    }

    if (currentSegment.length > 0) {
      segments.push(this.createSegment(currentSegment, conversation, segments.length, segmentStartTime!));
    }

    return segments;
  }

  private createSegment(messages: ChatMessage[], conversation: ParsedConversation, index: number, startTime: Date): Segment {
    const endTime = messages[messages.length - 1].timestamp || new Date();
    const content = messages.map(m => m.content).join(' ');
    const words = content.split(/\s+/);

    return {
      id: `${conversation.id}_segment_${index}`,
      title: this.generateTitle(messages, index),
      messages: [...messages],
      startTime,
      endTime,
      topics: this.extractTopics(messages),
      keywords: this.extractKeywords(messages),
      sentiment: this.analyzeSentiment(messages),
      messageCount: messages.length,
      wordCount: words.length,
      parentConversationId: conversation.id
    };
  }

  private generateTitle(messages: ChatMessage[], index: number): string {
    const firstUserMsg = messages.find(m => m.role === 'user');
    if (firstUserMsg) {
      const text = firstUserMsg.content.slice(0, 50);
      return text.length < firstUserMsg.content.length ? `${text}...` : text;
    }
    return `Segment ${index + 1}`;
  }

  private extractTopics(messages: ChatMessage[]): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while']);

    const wordFreq = new Map<string, number>();
    const allText = messages.map(m => m.content.toLowerCase()).join(' ');
    const words = allText.match(/\b[a-z]{4,}\b/g) || [];

    for (const word of words) {
      if (!stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private extractKeywords(messages: ChatMessage[]): string[] {
    const content = messages.map(m => m.content).join(' ');
    const patterns = [
      /\b(?:https?:\/\/[^\s]+|www\.[^\s]+)\b/gi,
      /\b[A-Z][a-z]+(?:[A-Z][a-z]+)*\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g,
      /\b\w+@\w+\.\w+\b/g,
      /#[\w]+/g,
    ];

    const keywords = new Set<string>();
    patterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(m => keywords.add(m));
    });

    return Array.from(keywords).slice(0, 10);
  }

  private analyzeSentiment(messages: ChatMessage[]): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'happy', 'thanks', 'thank', 'awesome', 'perfect', 'best', 'nice', 'well', 'yes', 'sure', 'absolutely', 'definitely', 'glad', 'appreciate', 'helpful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'sorry', 'error', 'wrong', 'issue', 'problem', 'fail', 'broken', 'doesn\'t work', 'not working', 'confused', 'difficult', 'hard', 'no', 'never', 'cannot', 'can\'t'];

    let positive = 0;
    let negative = 0;

    messages.forEach(msg => {
      const text = msg.content.toLowerCase();
      positiveWords.forEach(word => { if (text.includes(word)) positive++; });
      negativeWords.forEach(word => { if (text.includes(word)) negative++; });
    });

    if (positive > negative * 1.2) return 'positive';
    if (negative > positive * 1.2) return 'negative';
    return 'neutral';
  }
}

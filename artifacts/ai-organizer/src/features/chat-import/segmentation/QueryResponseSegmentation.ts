/**
 * Query-Response Pair Segmentation
 * Groups messages into question-answer pairs for better organization
 */

import { ChatMessage, ParsedConversation } from '../parsers/ChatArchiveParser';
import { Segment, SegmentationStrategy } from './TimeBasedSegmentation';

export class QueryResponseSegmentation implements SegmentationStrategy {
  name = 'Query-Response Pairs';
  description = 'Segments into question-answer pairs for clear organization';

  segment(conversation: ParsedConversation): Segment[] {
    const segments: Segment[] = [];
    let currentPair: ChatMessage[] = [];
    let segmentStartTime: Date | null = null;

    for (let i = 0; i < conversation.messages.length; i++) {
      const msg = conversation.messages[i];
      const msgTime = msg.timestamp || new Date();

      if (currentPair.length === 0) {
        currentPair.push(msg);
        segmentStartTime = msgTime;
        continue;
      }

      const lastMsg = currentPair[currentPair.length - 1];
      
      // Start new pair when we see a user message after assistant response
      if (msg.role === 'user' && lastMsg.role === 'assistant') {
        segments.push(this.createSegment(currentPair, conversation, segments.length, segmentStartTime!));
        currentPair = [msg];
        segmentStartTime = msgTime;
      } else {
        currentPair.push(msg);
      }
    }

    if (currentPair.length > 0) {
      segments.push(this.createSegment(currentPair, conversation, segments.length, segmentStartTime!));
    }

    return segments;
  }

  private createSegment(messages: ChatMessage[], conversation: ParsedConversation, index: number, startTime: Date): Segment {
    const endTime = messages[messages.length - 1].timestamp || new Date();
    const userMsg = messages.find(m => m.role === 'user');
    
    const content = messages.map(m => m.content).join(' ');
    const words = content.split(/\s+/);

    return {
      id: `${conversation.id}_pair_${index}`,
      title: this.generateTitle(userMsg?.content || `Pair ${index + 1}`, index),
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

  private generateTitle(userContent: string, _index: number): string {
    const cleaned = userContent.slice(0, 60).replace(/\n/g, ' ');
    return cleaned.length < userContent.length ? `${cleaned}...` : cleaned;
  }

  private extractTopics(messages: ChatMessage[]): string[] {
    const wordFreq = new Map<string, number>();
    const allText = messages.map(m => m.content.toLowerCase()).join(' ');
    const words = allText.match(/\b[a-z]{4,}\b/g) || [];
    const stopWords = new Set(['about', 'would', 'there', 'their', 'what', 'said', 'each', 'which', 'this', 'have', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were']);

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
    ];

    const keywords = new Set<string>();
    patterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(m => keywords.add(m));
    });

    return Array.from(keywords).slice(0, 10);
  }

  private analyzeSentiment(messages: ChatMessage[]): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'happy', 'thanks', 'thank', 'awesome', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'sorry', 'error', 'wrong', 'issue', 'problem'];

    let positive = 0;
    let negative = 0;

    messages.forEach(msg => {
      const text = msg.content.toLowerCase();
      positiveWords.forEach(word => { if (text.includes(word)) positive++; });
      negativeWords.forEach(word => { if (text.includes(word)) negative++; });
    });

    if (positive > negative) return 'positive';
    if (negative > positive) return 'negative';
    return 'neutral';
  }
}

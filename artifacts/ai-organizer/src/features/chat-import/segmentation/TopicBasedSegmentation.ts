/**
 * Topic-Based Segmentation
 * Segments conversations based on topic shifts using TF-IDF and cosine similarity
 */

import { ChatMessage, ParsedConversation } from '../parsers/ChatArchiveParser';
import { Segment, SegmentationStrategy } from './TimeBasedSegmentation';

export class TopicBasedSegmentation implements SegmentationStrategy {
  name = 'Topic-Based';
  description = 'Segments by detecting topic shifts using semantic similarity';
  private similarityThreshold: number;
  private windowSize: number;

  constructor(similarityThreshold: number = 0.6, windowSize: number = 3) {
    this.similarityThreshold = similarityThreshold;
    this.windowSize = windowSize;
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

      // Check for topic shift
      if (this.isTopicShift(msg, currentSegment)) {
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

  private isTopicShift(message: ChatMessage, currentSegment: ChatMessage[]): boolean {
    const windowStart = Math.max(0, currentSegment.length - this.windowSize);
    const contextMessages = currentSegment.slice(windowStart);
    
    const contextText = contextMessages.map(m => this.normalizeText(m.content)).join(' ');
    const newText = this.normalizeText(message.content);
    
    const similarity = this.calculateSimilarity(contextText, newText);
    return similarity < this.similarityThreshold;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = this.getWordFrequency(text1);
    const words2 = this.getWordFrequency(text2);
    
    const allWords = new Set([...Object.keys(words1), ...Object.keys(words2)]);
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    allWords.forEach(word => {
      const v1 = words1[word] || 0;
      const v2 = words2[word] || 0;
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    });
    
    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private getWordFrequency(text: string): Record<string, number> {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while']);
    
    const words = text.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
    const freq: Record<string, number> = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    return freq;
  }

  private createSegment(messages: ChatMessage[], conversation: ParsedConversation, index: number, startTime: Date): Segment {
    const endTime = messages[messages.length - 1].timestamp || new Date();
    const content = messages.map(m => m.content).join(' ');
    const words = content.split(/\s+/);

    return {
      id: `${conversation.id}_topic_${index}`,
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
    return `Topic ${index + 1}`;
  }

  private extractTopics(messages: ChatMessage[]): string[] {
    const wordFreq = new Map<string, number>();
    const allText = messages.map(m => m.content.toLowerCase()).join(' ');
    const words = allText.match(/\b[a-z]{4,}\b/g) || [];
    const stopWords = new Set(['about', 'would', 'there', 'their', 'what', 'said', 'each', 'which', 'she', 'been', 'this', 'have', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were']);

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

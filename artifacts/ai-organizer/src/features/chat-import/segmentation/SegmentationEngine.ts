/**
 * Segmentation Engine
 * Central engine for applying various segmentation strategies
 */

import { ParsedConversation } from '../parsers/ChatArchiveParser';
import { Segment, SegmentationStrategy } from './TimeBasedSegmentation';
import { TimeBasedSegmentation } from './TimeBasedSegmentation';
import { TopicBasedSegmentation } from './TopicBasedSegmentation';
import { QueryResponseSegmentation } from './QueryResponseSegmentation';

export type SegmentationMethod = 'time' | 'topic' | 'query-response' | 'auto';

export interface SegmentationOptions {
  method: SegmentationMethod;
  timeThreshold?: number; // minutes
  similarityThreshold?: number;
}

export class SegmentationEngine {
  private strategies: Map<string, SegmentationStrategy> = new Map();

  constructor() {
    this.registerDefaultStrategies();
  }

  private registerDefaultStrategies(): void {
    this.strategies.set('time', new TimeBasedSegmentation());
    this.strategies.set('topic', new TopicBasedSegmentation());
    this.strategies.set('query-response', new QueryResponseSegmentation());
  }

  registerStrategy(name: string, strategy: SegmentationStrategy): void {
    this.strategies.set(name, strategy);
  }

  segment(conversation: ParsedConversation, options: SegmentationOptions): Segment[] {
    if (options.method === 'auto') {
      return this.autoSegment(conversation);
    }

    const strategy = this.strategies.get(options.method);
    if (!strategy) {
      throw new Error(`Unknown segmentation method: ${options.method}`);
    }

    // Create configured strategy if needed
    if (options.method === 'time' && options.timeThreshold) {
      return new TimeBasedSegmentation(options.timeThreshold).segment(conversation);
    }
    if (options.method === 'topic' && options.similarityThreshold) {
      return new TopicBasedSegmentation(options.similarityThreshold).segment(conversation);
    }

    return strategy.segment(conversation);
  }

  selectBestMethod(conversation: ParsedConversation): SegmentationMethod {
    const msgCount = conversation.messages.length;
    const timeSpan = this.getTimeSpan(conversation);

    if (msgCount <= 10) return 'query-response';
    if (timeSpan > 24 * 60 * 60 * 1000) return 'time';
    return 'topic';
  }

  private autoSegment(conversation: ParsedConversation): Segment[] {
    const method = this.selectBestMethod(conversation);
    return this.segment(conversation, { method });
  }

  private getTimeSpan(conversation: ParsedConversation): number {
    if (conversation.messages.length < 2) return 0;
    const first = conversation.messages[0].timestamp?.getTime() || 0;
    const last = conversation.messages[conversation.messages.length - 1].timestamp?.getTime() || 0;
    return last - first;
  }

  getAvailableStrategies(): { name: string; description: string }[] {
    return Array.from(this.strategies.entries()).map(([name, strategy]) => ({
      name,
      description: strategy.description
    }));
  }
}

// Singleton instance
export const segmentationEngine = new SegmentationEngine();

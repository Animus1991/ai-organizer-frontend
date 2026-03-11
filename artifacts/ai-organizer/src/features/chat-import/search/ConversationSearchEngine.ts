/**
 * Conversation Search Engine
 * Advanced search with keyword, semantic, and conceptual similarity
 */

import { ConversationFolder } from '../folder/ConversationFolderManager';
import { Segment } from '../segmentation/TimeBasedSegmentation';

export interface SearchResult {
  type: 'folder' | 'segment' | 'message';
  item: ConversationFolder | Segment | { content: string; role: string; timestamp?: Date };
  score: number;
  matchedTerms: string[];
  context?: string;
}

export interface SearchOptions {
  query: string;
  searchIn: ('folders' | 'segments' | 'messages')[];
  matchType: 'exact' | 'fuzzy' | 'semantic';
  caseSensitive: boolean;
  dateRange?: { start: Date; end: Date };
  platforms?: string[];
}

export class ConversationSearchEngine {
  search(folders: ConversationFolder[], options: SearchOptions): SearchResult[] {
    const results: SearchResult[] = [];

    for (const folder of folders) {
      // Search in folder metadata
      if (options.searchIn.includes('folders')) {
        const folderScore = this.scoreFolder(folder, options);
        if (folderScore > 0) {
          results.push({
            type: 'folder',
            item: folder,
            score: folderScore,
            matchedTerms: this.extractMatchedTerms(folder.name + ' ' + folder.metadata.topics.join(' '), options.query)
          });
        }
      }

      // Search in segments
      if (options.searchIn.includes('segments')) {
        for (const segment of folder.segments) {
          const segmentScore = this.scoreSegment(segment, options);
          if (segmentScore > 0) {
            results.push({
              type: 'segment',
              item: segment,
              score: segmentScore,
              matchedTerms: this.extractMatchedTerms(segment.title + ' ' + segment.topics.join(' '), options.query),
              context: this.getContext(segment, options.query)
            });
          }
        }
      }

      // Search in individual messages
      if (options.searchIn.includes('messages')) {
        for (const segment of folder.segments) {
          for (const message of segment.messages) {
            const messageScore = this.scoreMessage(message, options);
            if (messageScore > 0) {
              results.push({
                type: 'message',
                item: { content: message.content, role: message.role, timestamp: message.timestamp },
                score: messageScore,
                matchedTerms: this.extractMatchedTerms(message.content, options.query),
                context: message.content.slice(0, 200)
              });
            }
          }
        }
      }
    }

    // Sort by score descending
    return results.sort((a, b) => b.score - a.score);
  }

  private scoreFolder(folder: ConversationFolder, options: SearchOptions): number {
    const query = options.caseSensitive ? options.query : options.query.toLowerCase();
    const text = options.caseSensitive 
      ? folder.name + ' ' + folder.metadata.topics.join(' ') + ' ' + folder.metadata.keywords.join(' ')
      : (folder.name + ' ' + folder.metadata.topics.join(' ') + ' ' + folder.metadata.keywords.join(' ')).toLowerCase();

    if (options.matchType === 'exact') {
      return text.includes(query) ? 1 : 0;
    }

    if (options.matchType === 'fuzzy') {
      return this.calculateFuzzyScore(text, query);
    }

    // Semantic - use word overlap as proxy
    return this.calculateSemanticScore(text, query);
  }

  private scoreSegment(segment: Segment, options: SearchOptions): number {
    const query = options.caseSensitive ? options.query : options.query.toLowerCase();
    const text = options.caseSensitive
      ? segment.title + ' ' + segment.topics.join(' ') + ' ' + segment.keywords.join(' ')
      : (segment.title + ' ' + segment.topics.join(' ') + ' ' + segment.keywords.join(' ')).toLowerCase();

    if (options.dateRange) {
      const segTime = segment.startTime.getTime();
      if (segTime < options.dateRange.start.getTime() || segTime > options.dateRange.end.getTime()) {
        return 0;
      }
    }

    if (options.matchType === 'exact') {
      return text.includes(query) ? 1 : 0;
    }

    return this.calculateFuzzyScore(text, query);
  }

  private scoreMessage(message: { content: string; role: string }, options: SearchOptions): number {
    const query = options.caseSensitive ? options.query : options.query.toLowerCase();
    const text = options.caseSensitive ? message.content : message.content.toLowerCase();

    if (options.matchType === 'exact') {
      return text.includes(query) ? 1 : 0;
    }

    return this.calculateFuzzyScore(text, query);
  }

  private calculateFuzzyScore(text: string, query: string): number {
    const queryWords = query.split(/\s+/);
    let matches = 0;
    
    queryWords.forEach(word => {
      if (text.includes(word)) matches++;
    });

    return matches / queryWords.length;
  }

  private calculateSemanticScore(text: string, query: string): number {
    // Simple semantic similarity using word overlap
    const textWords = new Set(text.split(/\s+/));
    const queryWords = query.split(/\s+/);
    
    let overlap = 0;
    queryWords.forEach(word => {
      if (textWords.has(word)) overlap++;
    });

    return overlap / queryWords.length;
  }

  private extractMatchedTerms(text: string, query: string): string[] {
    const terms: string[] = [];
    const queryWords = query.toLowerCase().split(/\s+/);
    const textLower = text.toLowerCase();

    queryWords.forEach(word => {
      if (textLower.includes(word)) {
        terms.push(word);
      }
    });

    return terms;
  }

  private getContext(segment: Segment, query: string): string {
    // Find the message containing the query and return surrounding context
    const queryLower = query.toLowerCase();
    for (const msg of segment.messages) {
      if (msg.content.toLowerCase().includes(queryLower)) {
        return msg.content.slice(0, 300);
      }
    }
    return segment.messages[0]?.content.slice(0, 300) || '';
  }

  // Advanced semantic search using TF-IDF
  semanticSearch(folders: ConversationFolder[], conceptQuery: string): SearchResult[] {
    const conceptWords = conceptQuery.toLowerCase().split(/\s+/);
    const results: SearchResult[] = [];

    // Build corpus
    const documents: { type: string; item: unknown; text: string }[] = [];
    
    folders.forEach(folder => {
      documents.push({
        type: 'folder',
        item: folder,
        text: folder.name + ' ' + folder.metadata.topics.join(' ')
      });

      folder.segments.forEach(segment => {
        documents.push({
          type: 'segment',
          item: segment,
          text: segment.title + ' ' + segment.messages.map(m => m.content).join(' ')
        });
      });
    });

    // Calculate TF-IDF scores
    const idf = this.calculateIDF(documents, conceptWords);

    documents.forEach(doc => {
      const tf = this.calculateTF(doc.text, conceptWords);
      let score = 0;

      conceptWords.forEach(word => {
        score += (tf[word] || 0) * (idf[word] || 0);
      });

      if (score > 0) {
        results.push({
          type: doc.type as 'folder' | 'segment' | 'message',
          item: doc.item as ConversationFolder | Segment,
          score,
          matchedTerms: conceptWords
        });
      }
    });

    return results.sort((a, b) => b.score - a.score);
  }

  private calculateTF(text: string, words: string[]): Record<string, number> {
    const tf: Record<string, number> = {};
    const textWords = text.toLowerCase().split(/\s+/);
    const totalWords = textWords.length;

    words.forEach(word => {
      const count = textWords.filter(w => w.includes(word)).length;
      tf[word] = count / totalWords;
    });

    return tf;
  }

  private calculateIDF(documents: { text: string }[], words: string[]): Record<string, number> {
    const idf: Record<string, number> = {};
    const docCount = documents.length;

    words.forEach(word => {
      const docsWithWord = documents.filter(doc => 
        doc.text.toLowerCase().includes(word)
      ).length;
      idf[word] = Math.log(docCount / (docsWithWord || 1));
    });

    return idf;
  }
}

export const searchEngine = new ConversationSearchEngine();

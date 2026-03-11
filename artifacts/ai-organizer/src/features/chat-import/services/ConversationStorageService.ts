/**
 * Conversation Storage Service
 * Manages persistence of imported conversations with database integration
 */

import { ParsedConversation } from '../parsers/ChatArchiveParser';
import { Segment } from '../segmentation/TimeBasedSegmentation';
import { ConversationFolder } from '../folder/ConversationFolderManager';

const STORAGE_KEY = 'aiorg_imported_conversations';
const FOLDERS_KEY = 'aiorg_conversation_folders';

export interface StoredConversation extends ParsedConversation {
  importedAt: string;
  segments: Segment[];
  folderId?: string;
}

export interface ConversationStorageStats {
  totalConversations: number;
  totalMessages: number;
  platforms: Record<string, number>;
  dateRange: { start: Date; end: Date };
}

class ConversationStorageService {
  private conversations: Map<string, StoredConversation> = new Map();
  private folders: Map<string, ConversationFolder> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const convData = localStorage.getItem(STORAGE_KEY);
      const folderData = localStorage.getItem(FOLDERS_KEY);

      if (convData) {
        const conversations = JSON.parse(convData) as StoredConversation[];
        conversations.forEach(conv => {
          // Restore Date objects
          conv.startTime = new Date(conv.startTime);
          conv.endTime = new Date(conv.endTime);
          conv.messages.forEach(m => {
            if (m.timestamp) m.timestamp = new Date(m.timestamp);
          });
          conv.segments.forEach(s => {
            s.startTime = new Date(s.startTime);
            s.endTime = new Date(s.endTime);
          });
          this.conversations.set(conv.id, conv);
        });
      }

      if (folderData) {
        const folders = JSON.parse(folderData) as ConversationFolder[];
        folders.forEach(folder => {
          folder.createdAt = new Date(folder.createdAt);
          this.folders.set(folder.id, folder);
        });
      }
    } catch (error) {
      console.error('Failed to load conversations from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const convArray = Array.from(this.conversations.values());
      const folderArray = Array.from(this.folders.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(convArray));
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(folderArray));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save conversations to storage:', error);
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  saveConversation(
    conversation: ParsedConversation,
    segments: Segment[],
    folderId?: string
  ): StoredConversation {
    const stored: StoredConversation = {
      ...conversation,
      importedAt: new Date().toISOString(),
      segments,
      folderId
    };
    this.conversations.set(conversation.id, stored);
    this.saveToStorage();
    return stored;
  }

  saveConversations(
    conversations: ParsedConversation[],
    segmentsMap: Map<string, Segment[]>,
    folderIds?: Map<string, string>
  ): StoredConversation[] {
    const stored: StoredConversation[] = [];
    conversations.forEach(conv => {
      const segments = segmentsMap.get(conv.id) || [];
      const folderId = folderIds?.get(conv.id);
      stored.push(this.saveConversation(conv, segments, folderId));
    });
    return stored;
  }

  getConversation(id: string): StoredConversation | undefined {
    return this.conversations.get(id);
  }

  getAllConversations(): StoredConversation[] {
    return Array.from(this.conversations.values()).sort(
      (a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
    );
  }

  getConversationsByPlatform(platform: string): StoredConversation[] {
    return this.getAllConversations().filter(c => c.platform === platform);
  }

  getConversationsByFolder(folderId: string): StoredConversation[] {
    return this.getAllConversations().filter(c => c.folderId === folderId);
  }

  deleteConversation(id: string): boolean {
    const deleted = this.conversations.delete(id);
    if (deleted) this.saveToStorage();
    return deleted;
  }

  updateConversation(id: string, updates: Partial<StoredConversation>): StoredConversation | undefined {
    const conv = this.conversations.get(id);
    if (!conv) return undefined;
    const updated = { ...conv, ...updates };
    this.conversations.set(id, updated);
    this.saveToStorage();
    return updated;
  }

  // Folder operations
  saveFolder(folder: ConversationFolder): void {
    this.folders.set(folder.id, folder);
    this.saveToStorage();
  }

  getFolder(id: string): ConversationFolder | undefined {
    return this.folders.get(id);
  }

  getAllFolders(): ConversationFolder[] {
    return Array.from(this.folders.values());
  }

  deleteFolder(id: string): boolean {
    const deleted = this.folders.delete(id);
    if (deleted) {
      // Remove folder reference from conversations
      this.conversations.forEach((conv, convId) => {
        if (conv.folderId === id) {
          conv.folderId = undefined;
          this.conversations.set(convId, conv);
        }
      });
      this.saveToStorage();
    }
    return deleted;
  }

  // Search
  searchConversations(query: string): StoredConversation[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllConversations().filter(conv =>
      conv.title.toLowerCase().includes(lowerQuery) ||
      conv.messages.some(m => m.content.toLowerCase().includes(lowerQuery))
    );
  }

  // Statistics
  getStats(): ConversationStorageStats {
    const conversations = this.getAllConversations();
    const platforms: Record<string, number> = {};
    let totalMessages = 0;
    let earliestDate = new Date();
    let latestDate = new Date(0);

    conversations.forEach(conv => {
      platforms[conv.platform] = (platforms[conv.platform] || 0) + 1;
      totalMessages += conv.messages.length;
      if (conv.startTime < earliestDate) earliestDate = conv.startTime;
      if (conv.endTime > latestDate) latestDate = conv.endTime;
    });

    return {
      totalConversations: conversations.length,
      totalMessages,
      platforms,
      dateRange: {
        start: earliestDate.getTime() === new Date().getTime() ? new Date(0) : earliestDate,
        end: latestDate.getTime() === 0 ? new Date() : latestDate
      }
    };
  }

  // Export
  exportToJSON(): string {
    return JSON.stringify({
      conversations: this.getAllConversations(),
      folders: this.getAllFolders(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // Clear all
  clearAll(): void {
    this.conversations.clear();
    this.folders.clear();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(FOLDERS_KEY);
    this.notifyListeners();
  }
}

export const conversationStorage = new ConversationStorageService();

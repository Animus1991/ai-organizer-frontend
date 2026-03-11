/**
 * ChatPersistence - localStorage-based message persistence
 * Caches conversations for offline access and session recovery
 */
import type { ChatMessage } from './types';

const STORAGE_KEY_PREFIX = 'ai_chat_history_';
const MAX_MESSAGES_PER_CONVERSATION = 100;
const MAX_CONVERSATIONS = 20;

export interface StoredConversation {
  providerType: string;
  messages: ChatMessage[];
  lastUpdated: string;
  conversationId?: string;
}

function getKey(providerType: string): string {
  return `${STORAGE_KEY_PREFIX}${providerType}`;
}

export function saveConversation(providerType: string, messages: ChatMessage[]): void {
  try {
    const stored: StoredConversation = {
      providerType,
      messages: messages.slice(-MAX_MESSAGES_PER_CONVERSATION),
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(getKey(providerType), JSON.stringify(stored));
    cleanupOldConversations();
  } catch (e) {
    console.warn('Failed to save conversation:', e);
  }
}

export function loadConversation(providerType: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(getKey(providerType));
    if (!raw) return [];
    const stored: StoredConversation = JSON.parse(raw);
    // Restore Date objects
    return stored.messages.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  } catch (e) {
    console.warn('Failed to load conversation:', e);
    return [];
  }
}

export function clearConversation(providerType: string): void {
  localStorage.removeItem(getKey(providerType));
}

export function listStoredConversations(): StoredConversation[] {
  const conversations: StoredConversation[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          conversations.push(JSON.parse(raw));
        }
      }
    }
  } catch (e) {
    console.warn('Failed to list conversations:', e);
  }
  return conversations.sort((a, b) => 
    new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );
}

function cleanupOldConversations(): void {
  const conversations = listStoredConversations();
  if (conversations.length > MAX_CONVERSATIONS) {
    // Remove oldest conversations
    const toRemove = conversations.slice(MAX_CONVERSATIONS);
    toRemove.forEach(c => {
      localStorage.removeItem(getKey(c.providerType));
    });
  }
}

export function getConversationStats(): {
  totalConversations: number;
  totalMessages: number;
  storageUsedKB: number;
} {
  const conversations = listStoredConversations();
  let totalSize = 0;
  conversations.forEach(c => {
    totalSize += JSON.stringify(c).length;
  });
  return {
    totalConversations: conversations.length,
    totalMessages: conversations.reduce((sum, c) => sum + c.messages.length, 0),
    storageUsedKB: Math.round(totalSize / 1024),
  };
}

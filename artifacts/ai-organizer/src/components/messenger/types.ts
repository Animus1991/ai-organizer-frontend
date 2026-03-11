/**
 * Types for Research-Grade Messenger
 * Domain-specific messaging for academic/research collaboration
 */

export interface MessengerUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: Date;
  bio?: string;
  institution?: string;
}

export type MessageTag = 'hypothesis' | 'result' | 'action-item' | 'question' | 'reference' | 'idea';

export const MESSAGE_TAG_CONFIG: Record<MessageTag, { label: string; color: string; icon: string }> = {
  hypothesis: { label: 'Υπόθεση', color: '262 83% 58%', icon: '💡' },
  result: { label: 'Αποτέλεσμα', color: '142 71% 45%', icon: '📊' },
  'action-item': { label: 'Ενέργεια', color: '38 92% 50%', icon: '✅' },
  question: { label: 'Ερώτηση', color: '200 80% 50%', icon: '❓' },
  reference: { label: 'Αναφορά', color: '0 84% 60%', icon: '📎' },
  idea: { label: 'Ιδέα', color: '280 70% 55%', icon: '🧠' },
};

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'audio' | 'video' | 'paper' | 'dataset';
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
  thumbnailUrl?: string;
}

export interface BlockchainProof {
  hash: string;
  timestamp: Date;
  verified: boolean;
  blockNumber?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string;
  reactions: MessageReaction[];
  attachments: MessageAttachment[];
  edited?: boolean;
  deleted?: boolean;
  tag?: MessageTag;
  pinned?: boolean;
  blockchainProof?: BlockchainProof;
}

export interface BlockchainSettings {
  enabled: boolean;
  mode: 'mutual' | 'self-only';
  acceptedByAll: boolean;
  enabledBy: string[];
}

export interface NDASettings {
  enabled: boolean;
  acceptedBy: string[]; // user IDs who accepted
  pendingFor: string[]; // user IDs who haven't accepted yet
  terms: string;
  activatedAt?: Date;
  activatedBy?: string; // user ID who proposed NDA
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  avatar?: string;
  participants: MessengerUser[];
  lastMessage?: Message;
  unreadCount: number;
  pinned: boolean;
  muted: boolean;
  typing: string[];
  blockchain: BlockchainSettings;
  pinnedMessages: string[];
  nda: NDASettings;
}

export type MessengerView = 'contacts' | 'chat' | 'new-chat' | 'new-group' | 'profile' | 'online' | 'pinned';

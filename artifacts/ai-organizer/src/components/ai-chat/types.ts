/**
 * Types for AI Chat components
 */

export interface ChatWindow {
  id: string;
  providerType: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  minimized: boolean;
  zIndex: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: SegmentContext; // Optional segment context for the message
}

export interface SegmentContext {
  documentId?: number;
  documentTitle?: string;
  segmentId?: number;
  segmentText?: string;
  segmentType?: string;
}

export interface ProviderInfo {
  providerType: string;
  name: string;
  description: string;
  supportedModels: string[];
  authMethods: string[];
  supportsConversationHistory: boolean;
}

export interface ProviderStatus {
  providerType: string;
  connected: boolean;
  authMethod?: string;
  autoConnect: boolean;
  lastUsedAt?: Date;
}

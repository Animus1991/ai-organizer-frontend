/**
 * Chat Import Feature - Main Export File
 */

// Parsers
export { ChatArchiveParser, ParserRegistry } from './parsers/ChatArchiveParser';
export { ChatGPTParser } from './parsers/ChatGPTParser';
export { ClaudeParser } from './parsers/ClaudeParser';
export { GeminiParser } from './parsers/GeminiParser';
export { CopilotParser } from './parsers/CopilotParser';
export { PerplexityParser } from './parsers/PerplexityParser';
export { MetaAIParser } from './parsers/MetaAIParser';
export { PiAIParser } from './parsers/PiAIParser';
export { CharacterAIParser } from './parsers/CharacterAIParser';
export { DeepSeekParser } from './parsers/DeepSeekParser';
export { MistralParser } from './parsers/MistralParser';
export { YouParser } from './parsers/YouParser';
export { HuggingChatParser } from './parsers/HuggingChatParser';

// Hooks
export { useChatImport } from './hooks/useChatImport';

// Components
export { ChatImportModal } from './components/ChatImportModal';
export { ConversationBrowser } from './components/ConversationBrowser';
export { ConversationViewer } from './components/ConversationViewer';
export { ConversationAnalytics } from './components/ConversationAnalytics';

// Services
export { conversationStorage } from './services/ConversationStorageService';
export type { StoredConversation, ConversationStorageStats } from './services/ConversationStorageService';

// Utils
export { extractZipFile, findConversationFile, isZipFile } from './utils/zipExtractor';

// Segmentation
export {
  TimeBasedSegmentation,
  TopicBasedSegmentation,
  QueryResponseSegmentation,
  SegmentationEngine,
  segmentationEngine
} from './segmentation';
export type { Segment, SegmentationMethod, SegmentationOptions } from './segmentation';

// Folder Management
export { ConversationFolderManager, folderManager } from './folder';
export type { ConversationFolder, FolderOrganizationOptions } from './folder';

// Search
export { ConversationSearchEngine, searchEngine } from './search';
export type { SearchResult, SearchOptions } from './search';

// Types
export type {
  ChatMessage,
  ParsedConversation,
  ParseResult,
  ParserOptions
} from './parsers/ChatArchiveParser';

export type {
  ImportState,
  ImportResult
} from './hooks/useChatImport';

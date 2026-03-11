/**
 * Types and constants for ConversationBrowser component
 * Extracted to keep the main component under 1500 lines.
 */

export type SavedView = {
  id: string;
  name: string;
  searchQuery: string;
  selectedPlatform: string;
  sortBy: 'date' | 'title' | 'messages';
  viewMode: 'grid' | 'list';
  showFavoritesOnly: boolean;
  showArchived: boolean;
  dateFilter: 'all' | 'today' | 'week' | 'month' | 'custom';
  customDateRange: { start: Date | null; end: Date | null };
};

export type ExportFormat = 'json' | 'csv' | 'md';
export type ExportScope = 'selected' | 'filtered' | 'all';
export type ExportGranularity = 'metadata' | 'messages' | 'segments' | 'full';

export const SAVED_VIEWS_KEY = 'conversationBrowserSavedViews';

export const platformIcons: Record<string, string> = {
  chatgpt: '🤖',
  claude: '🧠',
  gemini: '♊',
  copilot: '🪟',
  perplexity: '🔍',
  metaai: '👤',
  pi: 'π',
  characterai: '🎭',
  deepseek: '🐋',
  mistral: '🌪️',
  you: '❓',
  huggingface: '🤗',
};

export const platformNames: Record<string, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  copilot: 'Copilot',
  perplexity: 'Perplexity',
  metaai: 'Meta AI',
  pi: 'Pi AI',
  characterai: 'Character.AI',
  deepseek: 'DeepSeek',
  mistral: 'Mistral',
  you: 'You.com',
  huggingface: 'HuggingChat',
};

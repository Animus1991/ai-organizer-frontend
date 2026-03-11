// src/hooks/home/useHomeModals.ts
// Extracted modal state management from Home.tsx
import { useState, useCallback, useEffect } from "react";
import {
  ParsedConversation,
  StoredConversation,
  conversationStorage,
  segmentationEngine,
  folderManager,
} from "../../features/chat-import";

export function useHomeModals(setStatus: (s: string) => void) {
  // Widget popup (carousel click)
  const [widgetPopup, setWidgetPopup] = useState<{ id: string; title: string; icon: string } | null>(null);

  // Chat Import Modal — check URL params
  const [chatImportModalOpen, setChatImportModalOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("import") === "chats";
  });
  const [conversationBrowserOpen, setConversationBrowserOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("view") === "conversations";
  });
  const [conversationAnalyticsOpen, setConversationAnalyticsOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null);

  // Global search
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  // Clean up URL params after reading
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("import") || params.has("view")) {
      params.delete("import");
      params.delete("view");
      const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  const handleCarouselWidgetClick = useCallback((item: { id: string | number; title?: string; icon?: string }) => {
    setWidgetPopup({ id: String(item.id), title: item.title || '', icon: item.icon || '' });
  }, []);

  const handleChatImportComplete = useCallback((conversations: ParsedConversation[]) => {
    const storedConversations: StoredConversation[] = [];
    conversations.forEach((conv) => {
      const method = segmentationEngine.selectBestMethod(conv);
      const segments = segmentationEngine.segment(conv, { method });
      const folder = folderManager.createFolder(conv, segments, {
        groupBy: 'platform',
        createSubfolders: segments.length > 5
      });
      const stored = conversationStorage.saveConversation(conv, segments, folder.id);
      storedConversations.push(stored);
    });
    setStatus(`Imported ${conversations.length} conversations with ${storedConversations.reduce((sum, c) => sum + c.segments.length, 0)} segments`);
  }, [setStatus]);

  return {
    widgetPopup, setWidgetPopup,
    chatImportModalOpen, setChatImportModalOpen,
    conversationBrowserOpen, setConversationBrowserOpen,
    conversationAnalyticsOpen, setConversationAnalyticsOpen,
    selectedConversation, setSelectedConversation,
    globalSearchOpen, setGlobalSearchOpen,
    handleCarouselWidgetClick,
    handleChatImportComplete,
  };
}

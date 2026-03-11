/**
 * AIContextProvider - Provides context awareness for AI chat
 * 
 * This provider tracks the current application state (current document, segment, page)
 * and makes it available to the AI chat for context-aware responses.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getDocument, getSegment, DocumentDTO, SegmentDTO } from '../lib/api';

interface AIContextState {
  currentPage: string;
  currentDocumentId: number | null;
  currentDocument: DocumentDTO | null;
  currentSegmentId: number | null;
  currentSegment: SegmentDTO | null;
  selectedText: string | null;
  recentActions: string[];
  userIntent: string | null;
}

interface AIContextValue extends AIContextState {
  setCurrentDocument: (docId: number | null) => void;
  setCurrentSegment: (segmentId: number | null) => void;
  setSelectedText: (text: string | null) => void;
  addRecentAction: (action: string) => void;
  setUserIntent: (intent: string | null) => void;
  getContextSummary: () => string;
  clearContext: () => void;
}

const AIContext = createContext<AIContextValue | null>(null);

export function useAIContext() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAIContext must be used within AIContextProvider');
  }
  return context;
}

interface AIContextProviderProps {
  children: React.ReactNode;
}

export function AIContextProvider({ children }: AIContextProviderProps) {
  const location = useLocation();
  
  const [currentPage, setCurrentPage] = useState('');
  const [currentDocumentId, setCurrentDocumentId] = useState<number | null>(null);
  const [currentDocument, setCurrentDocument] = useState<DocumentDTO | null>(null);
  const [currentSegmentId, setCurrentSegmentId] = useState<number | null>(null);
  const [currentSegment, setCurrentSegment] = useState<SegmentDTO | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const [userIntent, setUserIntent] = useState<string | null>(null);

  // Track current page from URL
  useEffect(() => {
    const path = location.pathname;
    setCurrentPage(path);
    
    // Extract document ID from URL
    const docMatch = path.match(/\/documents\/(\d+)/);
    if (docMatch) {
      setCurrentDocumentId(parseInt(docMatch[1], 10));
    } else {
      setCurrentDocumentId(null);
      setCurrentDocument(null);
    }
    
    // Extract segment ID from URL
    const segMatch = path.match(/\/segments\/(\d+)/);
    if (segMatch) {
      setCurrentSegmentId(parseInt(segMatch[1], 10));
    } else {
      setCurrentSegmentId(null);
      setCurrentSegment(null);
    }
  }, [location]);

  // Fetch document when ID changes
  useEffect(() => {
    if (currentDocumentId) {
      getDocument(currentDocumentId)
        .then(doc => setCurrentDocument(doc))
        .catch(() => setCurrentDocument(null));
    } else {
      setCurrentDocument(null);
    }
  }, [currentDocumentId]);

  // Fetch segment when ID changes
  useEffect(() => {
    if (currentSegmentId) {
      getSegment(currentSegmentId)
        .then(seg => setCurrentSegment(seg))
        .catch(() => setCurrentSegment(null));
    } else {
      setCurrentSegment(null);
    }
  }, [currentSegmentId]);

  const setCurrentDocumentIdCallback = useCallback((docId: number | null) => {
    setCurrentDocumentId(docId);
  }, []);

  const setCurrentSegmentIdCallback = useCallback((segmentId: number | null) => {
    setCurrentSegmentId(segmentId);
  }, []);

  const setSelectedTextCallback = useCallback((text: string | null) => {
    setSelectedText(text);
    
    // Auto-detect intent from selected text
    if (text) {
      const lowerText = text.toLowerCase();
      if (lowerText.includes('?')) {
        setUserIntent('question');
      } else if (lowerText.length > 100) {
        setUserIntent('summarize');
      } else if (lowerText.includes('fix') || lowerText.includes('error') || lowerText.includes('bug')) {
        setUserIntent('troubleshoot');
      } else {
        setUserIntent('explain');
      }
    } else {
      setUserIntent(null);
    }
  }, []);

  const addRecentActionCallback = useCallback((action: string) => {
    setRecentActions(prev => {
      const newActions = [action, ...prev].slice(0, 10); // Keep last 10 actions
      return newActions;
    });
  }, []);

  const getContextSummary = useCallback(() => {
    const parts: string[] = [];
    
    if (currentPage) {
      parts.push(`Current page: ${currentPage}`);
    }
    
    if (currentDocument) {
      parts.push(`Document: "${currentDocument.title || 'Untitled'}" (ID: ${currentDocument.id})`);
    }
    
    if (currentSegment) {
      parts.push(`Segment: "${currentSegment.title || 'Untitled'}" (ID: ${currentSegment.id})`);
    }
    
    if (selectedText) {
      const preview = selectedText.length > 100 
        ? selectedText.substring(0, 100) + '...' 
        : selectedText;
      parts.push(`Selected text: "${preview}"`);
    }
    
    if (userIntent) {
      parts.push(`Detected intent: ${userIntent}`);
    }
    
    if (recentActions.length > 0) {
      parts.push(`Recent actions: ${recentActions.slice(0, 3).join(', ')}`);
    }
    
    return parts.join('\n');
  }, [currentPage, currentDocument, currentSegment, selectedText, userIntent, recentActions]);

  const clearContext = useCallback(() => {
    setCurrentDocumentId(null);
    setCurrentDocument(null);
    setCurrentSegmentId(null);
    setCurrentSegment(null);
    setSelectedText(null);
    setUserIntent(null);
    setRecentActions([]);
  }, []);

  const value: AIContextValue = {
    currentPage,
    currentDocumentId,
    currentDocument,
    currentSegmentId,
    currentSegment,
    selectedText,
    recentActions,
    userIntent,
    setCurrentDocument: setCurrentDocumentIdCallback,
    setCurrentSegment: setCurrentSegmentIdCallback,
    setSelectedText: setSelectedTextCallback,
    addRecentAction: addRecentActionCallback,
    setUserIntent,
    getContextSummary,
    clearContext,
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}

export default AIContextProvider;

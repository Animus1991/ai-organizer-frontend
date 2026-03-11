/**
 * useDocumentVersionControl - Version control system for documents
 * 
 * Provides git-like version control for document editing with:
 * - Automatic versioning on save
 * - Manual snapshots
 * - Diff viewing
 * - Restore capabilities
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface DocumentVersion {
  id: string;
  documentId: number;
  timestamp: number;
  author: string;
  message: string;
  content: string;
  wordCount: number;
  changeType: 'auto-save' | 'manual-snapshot' | 'major-revision';
  parentVersionId?: string;
}

export interface VersionDiff {
  additions: number;
  deletions: number;
  modifiedSections: string[];
  summary: string;
}

const STORAGE_KEY = 'document_versions';
const MAX_VERSIONS_PER_DOC = 50;

export function useDocumentVersionControl(documentId: number) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastAutoSaveRef = useRef<number>(0);
  const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

  // Load versions on mount
  useEffect(() => {
    loadVersions();
  }, [documentId]);

  const loadVersions = useCallback(() => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allVersions: DocumentVersion[] = JSON.parse(stored);
        const docVersions = allVersions
          .filter(v => v.documentId === documentId)
          .sort((a, b) => b.timestamp - a.timestamp);
        setVersions(docVersions);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  const saveVersion = useCallback((version: DocumentVersion) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allVersions: DocumentVersion[] = stored ? JSON.parse(stored) : [];
      
      // Add new version
      allVersions.push(version);
      
      // Limit versions per document
      const docVersions = allVersions.filter(v => v.documentId === documentId);
      if (docVersions.length > MAX_VERSIONS_PER_DOC) {
        const toRemove = docVersions
          .slice(MAX_VERSIONS_PER_DOC)
          .map(v => v.id);
        const filtered = allVersions.filter(v => !toRemove.includes(v.id));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allVersions));
      }
      
      setVersions(prev => [version, ...prev].slice(0, MAX_VERSIONS_PER_DOC));
    } catch (error) {
      console.error('Failed to save version:', error);
    }
  }, [documentId]);

  const createSnapshot = useCallback((
    content: string,
    message: string,
    author: string,
    changeType: DocumentVersion['changeType'] = 'manual-snapshot'
  ): DocumentVersion => {
    const version: DocumentVersion = {
      id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      timestamp: Date.now(),
      author,
      message,
      content,
      wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
      changeType,
      parentVersionId: versions[0]?.id,
    };
    
    saveVersion(version);
    return version;
  }, [documentId, versions, saveVersion]);

  const autoSave = useCallback((content: string, author: string): boolean => {
    const now = Date.now();
    
    // Throttle auto-saves
    if (now - lastAutoSaveRef.current < AUTO_SAVE_INTERVAL) {
      return false;
    }
    
    // Skip if content hasn't changed significantly
    if (versions.length > 0) {
      const lastVersion = versions[0];
      const contentSimilarity = calculateSimilarity(lastVersion.content, content);
      if (contentSimilarity > 0.95) {
        return false;
      }
    }
    
    createSnapshot(content, 'Auto-saved', author, 'auto-save');
    lastAutoSaveRef.current = now;
    return true;
  }, [versions, createSnapshot]);

  const restoreVersion = useCallback((versionId: string): string | null => {
    const version = versions.find(v => v.id === versionId);
    return version?.content ?? null;
  }, [versions]);

  const compareVersions = useCallback((
    versionId1: string,
    versionId2: string
  ): VersionDiff | null => {
    const v1 = versions.find(v => v.id === versionId1);
    const v2 = versions.find(v => v.id === versionId2);
    
    if (!v1 || !v2) return null;
    
    const diff = computeDiff(v1.content, v2.content);
    return diff;
  }, [versions]);

  const getVersionHistory = useCallback((): DocumentVersion[] => {
    return versions;
  }, [versions]);

  const deleteVersion = useCallback((versionId: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      
      const allVersions: DocumentVersion[] = JSON.parse(stored);
      const filtered = allVersions.filter(v => v.id !== versionId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      
      setVersions(prev => prev.filter(v => v.id !== versionId));
    } catch (error) {
      console.error('Failed to delete version:', error);
    }
  }, []);

  const clearAllVersions = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      
      const allVersions: DocumentVersion[] = JSON.parse(stored);
      const filtered = allVersions.filter(v => v.documentId !== documentId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      
      setVersions([]);
    } catch (error) {
      console.error('Failed to clear versions:', error);
    }
  }, [documentId]);

  return {
    versions,
    isLoading,
    createSnapshot,
    autoSave,
    restoreVersion,
    compareVersions,
    getVersionHistory,
    deleteVersion,
    clearAllVersions,
    lastAutoSaveTime: lastAutoSaveRef.current,
  };
}

// Helper: Calculate text similarity (0-1)
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  
  const aWords = new Set(a.toLowerCase().split(/\s+/));
  const bWords = new Set(b.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...aWords].filter(x => bWords.has(x)));
  const union = new Set([...aWords, ...bWords]);
  
  return intersection.size / union.size;
}

// Helper: Compute diff between two texts
function computeDiff(oldText: string, newText: string): VersionDiff {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  let additions = 0;
  let deletions = 0;
  const modifiedSections: string[] = [];
  
  // Simple line-based diff
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);
  
  for (const line of newLines) {
    if (!oldSet.has(line) && line.trim()) {
      additions++;
    }
  }
  
  for (const line of oldLines) {
    if (!newSet.has(line) && line.trim()) {
      deletions++;
    }
  }
  
  // Detect modified sections (headings)
  const headingRegex = /^(#{1,6}\s|.{0,50}\n={3,}|.{0,50}\n-{3,})/m;
  if (headingRegex.test(oldText) || headingRegex.test(newText)) {
    const oldHeadings = extractHeadings(oldText);
    const newHeadings = extractHeadings(newText);
    
    for (const h of newHeadings) {
      if (!oldHeadings.includes(h)) {
        modifiedSections.push(h);
      }
    }
  }
  
  // Generate summary
  let summary = '';
  if (additions > 0 && deletions > 0) {
    summary = `Modified content (+${additions} -${deletions} lines)`;
  } else if (additions > 0) {
    summary = `Added ${additions} lines`;
  } else if (deletions > 0) {
    summary = `Removed ${deletions} lines`;
  } else {
    summary = 'Minor formatting changes';
  }
  
  return {
    additions,
    deletions,
    modifiedSections: modifiedSections.slice(0, 5),
    summary,
  };
}

function extractHeadings(text: string): string[] {
  const headings: string[] = [];
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Markdown headings
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push(match[2].trim());
      continue;
    }
    
    // Underline headings
    if (i < lines.length - 1) {
      const nextLine = lines[i + 1];
      if (/^={3,}$/.test(nextLine) && line.trim()) {
        headings.push(line.trim());
      } else if (/^-{3,}$/.test(nextLine) && line.trim()) {
        headings.push(line.trim());
      }
    }
  }
  
  return headings;
}

export default useDocumentVersionControl;

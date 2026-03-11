/**
 * useDocumentStatus - Manages document workflow status (Draft/In Review/Published/Archived)
 * Persists to localStorage per document ID.
 */
import { useState, useCallback } from 'react';

export type DocumentStatus = 'draft' | 'in-review' | 'published' | 'archived';

const STORAGE_KEY = 'document-statuses';

function loadStatuses(): Record<number, DocumentStatus> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStatuses(statuses: Record<number, DocumentStatus>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
}

export function getDocumentStatus(documentId: number): DocumentStatus {
  const statuses = loadStatuses();
  return statuses[documentId] || 'draft';
}

export function useDocumentStatus() {
  const [statuses, setStatuses] = useState<Record<number, DocumentStatus>>(loadStatuses);

  const getStatus = useCallback((documentId: number): DocumentStatus => {
    return statuses[documentId] || 'draft';
  }, [statuses]);

  const setStatus = useCallback((documentId: number, status: DocumentStatus) => {
    setStatuses(prev => {
      const next = { ...prev, [documentId]: status };
      saveStatuses(next);
      return next;
    });
  }, []);

  const cycleStatus = useCallback((documentId: number) => {
    const order: DocumentStatus[] = ['draft', 'in-review', 'published', 'archived'];
    const current = statuses[documentId] || 'draft';
    const idx = order.indexOf(current);
    const next = order[(idx + 1) % order.length];
    setStatus(documentId, next);
    return next;
  }, [statuses, setStatus]);

  return { getStatus, setStatus, cycleStatus, statuses };
}

export const STATUS_CONFIG: Record<DocumentStatus, { label: string; labelKey: string; color: string; bg: string; icon: string }> = {
  'draft': {
    label: 'Draft',
    labelKey: 'docStatus.draft',
    color: '#8b8b8b',
    bg: 'rgba(139, 139, 139, 0.15)',
    icon: '📝',
  },
  'in-review': {
    label: 'In Review',
    labelKey: 'docStatus.inReview',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    icon: '👁️',
  },
  'published': {
    label: 'Published',
    labelKey: 'docStatus.published',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    icon: '✅',
  },
  'archived': {
    label: 'Archived',
    labelKey: 'docStatus.archived',
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.15)',
    icon: '📦',
  },
};

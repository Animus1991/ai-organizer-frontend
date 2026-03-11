// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHomeOperations } from '../../hooks/home/useHomeOperations';
import * as api from '../../lib/api';

// Mock API functions
vi.mock('../../lib/api', () => ({
  listUploads: vi.fn(),
  listSegments: vi.fn(),
  segmentDocument: vi.fn(),
  listSegmentations: vi.fn(),
  deleteUpload: vi.fn(),
}));

describe('useHomeOperations', () => {
  const mockState = {
    searchOpen: false,
    setSearchOpen: vi.fn(),
    hasFetchedRef: { current: false },
    segSummary: [],
    setSegSummary: vi.fn(),
    file: null,
    setFile: vi.fn(),
    fileError: null,
    setFileError: vi.fn(),
    documentId: null,
    setDocumentId: vi.fn(),
    mode: 'qa' as const,
    setMode: vi.fn(),
    segments: [],
    setSegments: vi.fn(),
    status: '',
    setStatus: vi.fn(),
    isSegmenting: false,
    setIsSegmenting: vi.fn(),
    uploads: [],
    setUploads: vi.fn(),
    openSeg: null,
    setOpenSeg: vi.fn(),
    copied: false,
    setCopied: vi.fn(),
    query: '',
    setQuery: vi.fn(),
    modeFilter: 'all' as const,
    setModeFilter: vi.fn(),
    selectedUpload: null,
    localDuplicateHint: null,
    canSegment: false,
    filteredSegments: [],
    segSummaryByMode: {},
  };

  const mockSetLoading = vi.fn();
  const mockUploadWithProgress = vi.fn();
  const mockResetUpload = vi.fn();
  const mockUploadError = null;
  const mockExecuteFetch = vi.fn(async <T,>(fn: () => Promise<T>) => {
    return await fn();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchUploads', () => {
    it('should fetch uploads and update state', async () => {
      const mockUploads = {
        items: [
          { documentId: 1, filename: 'test.pdf', parseStatus: 'ok' },
          { documentId: 2, filename: 'test2.pdf', parseStatus: 'ok' },
        ],
        pagination: { total: 2, page: 1, pageSize: 100 },
      };
      vi.mocked(api.listUploads).mockResolvedValue(mockUploads as any);

      const { result } = renderHook(() =>
        useHomeOperations(
          mockState,
          mockSetLoading,
          mockUploadWithProgress,
          mockResetUpload,
          mockUploadError,
          mockExecuteFetch
        )
      );

      await result.current.fetchUploads();

      await waitFor(() => {
        expect(mockState.setUploads).toHaveBeenCalledWith(mockUploads.items);
      });
    });

    it('should handle array format (backward compatibility)', async () => {
      const mockUploads = [
        { documentId: 1, filename: 'test.pdf' },
        { documentId: 2, filename: 'test2.pdf' },
      ];
      vi.mocked(api.listUploads).mockResolvedValue(mockUploads as any);

      const { result } = renderHook(() =>
        useHomeOperations(
          mockState,
          mockSetLoading,
          mockUploadWithProgress,
          mockResetUpload,
          mockUploadError,
          mockExecuteFetch
        )
      );

      await result.current.fetchUploads();

      await waitFor(() => {
        expect(mockState.setUploads).toHaveBeenCalledWith(mockUploads);
      });
    });

    it('should handle errors gracefully', async () => {
      const mockExecuteFetchWithError = vi.fn(async <T,>(fn: () => Promise<T>) => {
        try {
          return await fn();
        } catch {
          return null;
        }
      });
      vi.mocked(api.listUploads).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useHomeOperations(
          mockState,
          mockSetLoading,
          mockUploadWithProgress,
          mockResetUpload,
          mockUploadError,
          mockExecuteFetchWithError
        )
      );

      await result.current.fetchUploads();

      await waitFor(() => {
        expect(mockState.setStatus).toHaveBeenCalledWith('Failed to load uploads');
      });
    });
  });

  describe('loadSegmentationSummary', () => {
    it('should load segmentation summary and update state', async () => {
      const mockSummary = [
        { mode: 'qa', count: 10, lastSegmentedAt: '2024-01-01T00:00:00Z' },
        { mode: 'paragraphs', count: 5, lastSegmentedAt: '2024-01-01T00:00:00Z' },
      ];
      vi.mocked(api.listSegmentations).mockResolvedValue(mockSummary as any);

      const { result } = renderHook(() =>
        useHomeOperations(
          mockState,
          mockSetLoading,
          mockUploadWithProgress,
          mockResetUpload,
          mockUploadError,
          mockExecuteFetch
        )
      );

      await result.current.loadSegmentationSummary(1);

      await waitFor(() => {
        expect(mockState.setSegSummary).toHaveBeenCalled();
      });
    });

    it('should handle errors when loading summary', async () => {
      vi.mocked(api.listSegmentations).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useHomeOperations(
          mockState,
          mockSetLoading,
          mockUploadWithProgress,
          mockResetUpload,
          mockUploadError,
          mockExecuteFetch
        )
      );

      await result.current.loadSegmentationSummary(1);

      await waitFor(() => {
        expect(mockState.setSegSummary).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('segmentDoc', () => {
    it('should segment document and update state', async () => {
      const mockResponse = { documentId: 1, mode: 'qa', segments_created: 10 };
      const mockUpload = { documentId: 1, filename: 'test.pdf', parseStatus: 'ok' };
      vi.mocked(api.segmentDocument).mockResolvedValue(mockResponse as any);
      vi.mocked(api.listSegments).mockResolvedValue({ items: [], meta: { count: 0, mode: 'qa' } } as any);
      vi.mocked(api.listSegmentations).mockResolvedValue([] as any);
      vi.mocked(api.listUploads).mockResolvedValue({ items: [mockUpload], pagination: { total: 1, page: 1, pageSize: 100 } } as any);

      const { result } = renderHook(() =>
        useHomeOperations(
          { ...mockState, documentId: 1, selectedUpload: mockUpload },
          mockSetLoading,
          mockUploadWithProgress,
          mockResetUpload,
          mockUploadError,
          mockExecuteFetch
        )
      );

      await result.current.segmentDoc();

      await waitFor(() => {
        expect(mockState.setIsSegmenting).toHaveBeenCalledWith(true);
        expect(mockState.setIsSegmenting).toHaveBeenCalledWith(false);
        expect(mockState.setStatus).toHaveBeenCalled();
      });
    });

    it('should handle segmentation errors', async () => {
      const mockUpload = { documentId: 1, filename: 'test.pdf', parseStatus: 'ok' };
      vi.mocked(api.listUploads).mockResolvedValue({ items: [mockUpload], pagination: { total: 1, page: 1, pageSize: 100 } } as any);
      vi.mocked(api.segmentDocument).mockRejectedValue(new Error('Segmentation failed'));

      const { result } = renderHook(() =>
        useHomeOperations(
          { ...mockState, documentId: 1, selectedUpload: mockUpload },
          mockSetLoading,
          mockUploadWithProgress,
          mockResetUpload,
          mockUploadError,
          mockExecuteFetch
        )
      );

      await result.current.segmentDoc();

      await waitFor(() => {
        expect(mockState.setIsSegmenting).toHaveBeenCalledWith(false);
        expect(mockState.setStatus).toHaveBeenCalled();
      });
    });

    it('should not segment if documentId is missing', async () => {
      const { result } = renderHook(() =>
        useHomeOperations(
          { ...mockState, documentId: null },
          mockSetLoading,
          mockUploadWithProgress,
          mockResetUpload,
          mockUploadError,
          mockExecuteFetch
        )
      );

      await result.current.segmentDoc();

      expect(api.segmentDocument).not.toHaveBeenCalled();
    });
  });

  describe('loadSegments', () => {
    it('should load segments and update state', async () => {
      const mockSegments = {
        items: [
          { id: 1, title: 'Segment 1', mode: 'qa' },
          { id: 2, title: 'Segment 2', mode: 'qa' },
        ],
        meta: { count: 2, mode: 'qa' },
      };
      vi.mocked(api.listSegments).mockResolvedValue(mockSegments as any);

      const { result } = renderHook(() =>
        useHomeOperations(
          { ...mockState, documentId: 1 },
          mockSetLoading,
          mockUploadWithProgress,
          mockResetUpload,
          mockUploadError,
          mockExecuteFetch
        )
      );

      await result.current.loadSegments();

      await waitFor(() => {
        expect(mockState.setSegments).toHaveBeenCalledWith(mockSegments.items);
      });
    });

    it('should not load if documentId is missing', async () => {
      const { result } = renderHook(() =>
        useHomeOperations(
          { ...mockState, documentId: null },
          mockSetLoading,
          mockUploadWithProgress,
          mockResetUpload,
          mockUploadError,
          mockExecuteFetch
        )
      );

      await result.current.loadSegments();

      expect(api.listSegments).not.toHaveBeenCalled();
    });
  });

  describe('deleteSelectedUpload', () => {
    it('should delete selected upload and refresh list', async () => {
      // Mock window.confirm to return true
      const originalConfirm = window.confirm;
      window.confirm = vi.fn(() => true);

      const mockUpload = { documentId: 1, uploadId: 1, filename: 'test.pdf', parseStatus: 'ok' };
      vi.mocked(api.deleteUpload).mockResolvedValue(undefined);
      vi.mocked(api.listUploads).mockResolvedValue({ items: [], pagination: { total: 0, page: 1, pageSize: 100 } } as any);

      const stateWithUpload = { ...mockState, selectedUpload: mockUpload, documentId: 1 };

      const { result } = renderHook(() =>
        useHomeOperations(
          stateWithUpload,
          mockSetLoading,
          mockUploadWithProgress,
          mockResetUpload,
          mockUploadError,
          mockExecuteFetch
        )
      );

      await result.current.deleteSelectedUpload();

      await waitFor(() => {
        expect(api.deleteUpload).toHaveBeenCalledWith(1);
        expect(api.listUploads).toHaveBeenCalled();
      });

      // Restore original confirm
      window.confirm = originalConfirm;
    });

    it('should not delete if no upload is selected', async () => {
      const { result } = renderHook(() =>
        useHomeOperations(
          { ...mockState, selectedUpload: null },
          mockSetLoading,
          mockUploadWithProgress,
          mockResetUpload,
          mockUploadError,
          mockExecuteFetch
        )
      );

      await result.current.deleteSelectedUpload();

      expect(api.deleteUpload).not.toHaveBeenCalled();
    });
  });

  describe('extractCount', () => {
    it('should extract count from payload', () => {
      const { result } = renderHook(() =>
        useHomeOperations(
          mockState,
          mockSetLoading,
          mockUploadWithProgress,
          mockResetUpload,
          mockUploadError,
          mockExecuteFetch
        )
      );

      expect(result.current.extractCount({ segments_created: 10 })).toBe(10);
      expect(result.current.extractCount({ count: 5 })).toBe(5);
      expect(result.current.extractCount({ created: 3 })).toBe(3);
      expect(result.current.extractCount({ inserted: 2 })).toBe(2);
      expect(result.current.extractCount({ total: 1 })).toBe(1);
      expect(result.current.extractCount({ items: [1, 2, 3] })).toBe(3);
      expect(result.current.extractCount([1, 2])).toBe(2);
      expect(result.current.extractCount({})).toBeNull();
    });
  });
});

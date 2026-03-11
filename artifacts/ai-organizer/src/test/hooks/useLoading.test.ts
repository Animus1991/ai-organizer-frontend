// src/test/hooks/useLoading.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useLoading, useMultiLoading } from '../../hooks/useLoading';

describe('useLoading', () => {
  it('should initialize with loading false and no error', () => {
    const { result } = renderHook(() => useLoading());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should set loading state', () => {
    const { result } = renderHook(() => useLoading());
    
    act(() => {
      result.current.setLoading(true);
    });
    
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should set error state', () => {
    const { result } = renderHook(() => useLoading());
    
    act(() => {
      result.current.setError('Something went wrong');
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Something went wrong');
  });

  it('should reset state', () => {
    const { result } = renderHook(() => useLoading());
    
    act(() => {
      result.current.setLoading(true);
      result.current.setError('Error');
    });
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should execute async function successfully', async () => {
    const { result } = renderHook(() => useLoading());
    const asyncFn = vi.fn().mockResolvedValue('success');
    
    let executeResult: string | null = null;
    
    await act(async () => {
      executeResult = await result.current.execute(asyncFn);
    });
    
    expect(executeResult).toBe('success');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(asyncFn).toHaveBeenCalledTimes(1);
  });

  it('should handle async function error', async () => {
    const { result } = renderHook(() => useLoading());
    const error = new Error('Test error');
    const asyncFn = vi.fn().mockRejectedValue(error);
    
    let executeResult: string | null = null;
    
    await act(async () => {
      executeResult = await result.current.execute(asyncFn);
    });
    
    // The execute function sets error in catch and loading in finally
    // Both state updates should be complete after act
    expect(executeResult).toBe(null);
    expect(result.current.loading).toBe(false);
    // Note: The error state might be set by setError, but finally block also sets loading
    // This is a known limitation - the error should be set, but React may batch updates
    // In practice, this works correctly because setError is called before finally
    expect(result.current.error).toBe('Test error');
  });

  it('should handle non-Error exceptions', async () => {
    const { result } = renderHook(() => useLoading());
    const asyncFn = vi.fn().mockRejectedValue('String error');
    
    await act(async () => {
      await result.current.execute(asyncFn);
    });
    
    // The execute function sets error in catch and loading in finally
    // Both state updates should be complete after act
    expect(result.current.loading).toBe(false);
    // Note: The error state might be set by setError, but finally block also sets loading
    // This is a known limitation - the error should be set, but React may batch updates
    // In practice, this works correctly because setError is called before finally
    expect(result.current.error).toBe('An error occurred');
  });
});

describe('useMultiLoading', () => {
  it('should initialize with empty states', () => {
    const { result } = renderHook(() => useMultiLoading());
    
    expect(result.current.isLoading()).toBe(false);
    expect(result.current.states).toEqual({});
  });

  it('should set loading for specific key', () => {
    const { result } = renderHook(() => useMultiLoading());
    
    act(() => {
      result.current.setLoading('upload', true);
    });
    
    expect(result.current.isLoading('upload')).toBe(true);
    expect(result.current.isLoading('delete')).toBe(false);
    expect(result.current.getError('upload')).toBe(null);
  });

  it('should set error for specific key', () => {
    const { result } = renderHook(() => useMultiLoading());
    
    act(() => {
      result.current.setError('upload', 'Upload failed');
    });
    
    expect(result.current.getError('upload')).toBe('Upload failed');
    expect(result.current.isLoading('upload')).toBe(false);
  });

  it('should reset specific key', () => {
    const { result } = renderHook(() => useMultiLoading());
    
    act(() => {
      result.current.setLoading('upload', true);
      result.current.setError('upload', 'Error');
    });
    
    act(() => {
      result.current.reset('upload');
    });
    
    expect(result.current.isLoading('upload')).toBe(false);
    expect(result.current.getError('upload')).toBe(null);
  });

  it('should reset all keys', () => {
    const { result } = renderHook(() => useMultiLoading());
    
    act(() => {
      result.current.setLoading('upload', true);
      result.current.setLoading('delete', true);
    });
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.isLoading()).toBe(false);
    expect(result.current.states).toEqual({});
  });

  it('should return true if any key is loading', () => {
    const { result } = renderHook(() => useMultiLoading());
    
    act(() => {
      result.current.setLoading('upload', true);
      result.current.setLoading('delete', false);
    });
    
    expect(result.current.isLoading()).toBe(true);
  });

  it('should return false if no keys are loading', () => {
    const { result } = renderHook(() => useMultiLoading());
    
    act(() => {
      result.current.setLoading('upload', false);
      result.current.setLoading('delete', false);
    });
    
    expect(result.current.isLoading()).toBe(false);
  });

  it('should handle multiple keys independently', () => {
    const { result } = renderHook(() => useMultiLoading());
    
    act(() => {
      result.current.setLoading('upload', true);
      result.current.setError('delete', 'Delete failed');
    });
    
    expect(result.current.isLoading('upload')).toBe(true);
    expect(result.current.getError('upload')).toBe(null);
    expect(result.current.isLoading('delete')).toBe(false);
    expect(result.current.getError('delete')).toBe('Delete failed');
  });

  it('should clear error when setting loading', () => {
    const { result } = renderHook(() => useMultiLoading());
    
    act(() => {
      result.current.setError('upload', 'Previous error');
      result.current.setLoading('upload', true);
    });
    
    expect(result.current.getError('upload')).toBe(null);
    expect(result.current.isLoading('upload')).toBe(true);
  });

  it('should set loading to false when setting error', () => {
    const { result } = renderHook(() => useMultiLoading());
    
    act(() => {
      result.current.setLoading('upload', true);
      result.current.setError('upload', 'Error occurred');
    });
    
    expect(result.current.isLoading('upload')).toBe(false);
    expect(result.current.getError('upload')).toBe('Error occurred');
  });
});

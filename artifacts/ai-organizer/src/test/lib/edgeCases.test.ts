// src/test/lib/edgeCases.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateFile,
  formatFileSize,
  retryWithBackoff,
  withTimeout,
  debounce,
  throttle,
  sleep,
  FILE_SIZE_LIMITS,
  ALLOWED_FILE_TYPES
} from '../../lib/edgeCases';

describe('edgeCases', () => {
  describe('validateFile', () => {
    it('should validate allowed PDF file', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate allowed DOCX file', () => {
      const file = new File(['content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); // 5MB
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject unsupported file type', () => {
      const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not supported');
    });

    it('should reject file exceeding size limit for PDF', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 60 * 1024 * 1024 }); // 60MB > 50MB limit
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds limit');
      expect(result.error).toContain('50.0MB');
    });

    it('should reject file exceeding size limit for DOCX', () => {
      const file = new File(['content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      Object.defineProperty(file, 'size', { value: 30 * 1024 * 1024 }); // 30MB > 25MB limit
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds limit');
      expect(result.error).toContain('25.0MB');
    });

    it('should reject file with name too long', () => {
      const longName = 'a'.repeat(256);
      const file = new File(['content'], longName, { type: 'text/plain' });
      Object.defineProperty(file, 'size', { value: 1024 });
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
      expect(result.error).toContain('255 characters');
    });

    it('should use default size limit for allowed but unknown type', () => {
      // Use an allowed type that doesn't have a specific limit (text/markdown)
      const file = new File(['content'], 'test.md', { type: 'text/markdown' });
      Object.defineProperty(file, 'size', { value: 25 * 1024 * 1024 }); // 25MB > 20MB default
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('20.0MB');
    });
  });

  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatFileSize(512)).toBe('512 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
    });
  });

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      const result = await retryWithBackoff(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const promise = retryWithBackoff(fn, 3, 100, 2);
      
      // Fast-forward through retry delay
      await vi.advanceTimersByTimeAsync(100);
      
      const result = await promise;
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const error = { message: 'Network error' }; // Network error (no response)
      const fn = vi.fn().mockRejectedValue(error);
      
      const promise = retryWithBackoff(fn, 2, 100, 2);
      
      // Fast-forward through all retry delays
      await vi.advanceTimersByTimeAsync(100 + 200);
      
      // Catch the rejection to prevent unhandled rejection warning
      try {
        await promise;
        // Should not reach here
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toEqual(error);
      }
      
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use exponential backoff', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue('success');
      
      const promise = retryWithBackoff(fn, 3, 100, 2);
      
      // First retry after 100ms
      await vi.advanceTimersByTimeAsync(100);
      // Second retry after 200ms (100 * 2^1)
      await vi.advanceTimersByTimeAsync(200);
      
      const result = await promise;
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('withTimeout', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return result if promise resolves before timeout', async () => {
      const promise = Promise.resolve('success');
      
      const result = await withTimeout(promise, 1000);
      
      expect(result).toBe('success');
    });

    it('should throw timeout error if promise takes too long', async () => {
      let timeoutId: NodeJS.Timeout;
      let resolveOriginal: (value: string) => void;
      const promise = new Promise<string>(resolve => {
        resolveOriginal = resolve;
        timeoutId = setTimeout(() => resolve('success'), 2000);
      });
      
      // Add catch handler to original promise to prevent unhandled rejection
      promise.catch(() => {
        // Original promise might reject if timeout already happened, that's okay
      });
      
      const timeoutPromise = withTimeout(promise, 1000);
      
      // Fast-forward to trigger timeout
      await vi.advanceTimersByTimeAsync(1000);
      
      // Catch the rejection to prevent unhandled rejection warning
      let timeoutError: Error | undefined;
      try {
        await timeoutPromise;
        // Should not reach here
        expect(true).toBe(false);
      } catch (e: any) {
        timeoutError = e;
        expect(e.message).toBe('Request timeout');
      }
      
      // Ensure timeout error was caught
      expect(timeoutError).toBeDefined();
      
      // Clean up: clear the timeout and resolve the original promise
      clearTimeout(timeoutId!);
      resolveOriginal!('success');
      
      // Fast-forward to ensure all timers are processed
      await vi.advanceTimersByTimeAsync(1000);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should delay function execution', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      
      debounced('arg1', 'arg2');
      
      expect(fn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(100);
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should cancel previous call if called again', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      
      debounced('call1');
      debounced('call2');
      debounced('call3');
      
      vi.advanceTimersByTime(100);
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('call3');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should execute function immediately', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);
      
      throttled('arg1');
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('arg1');
    });

    it('should ignore subsequent calls within throttle period', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);
      
      throttled('call1');
      throttled('call2');
      throttled('call3');
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('call1');
    });

    it('should allow call after throttle period', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);
      
      throttled('call1');
      
      vi.advanceTimersByTime(100);
      
      throttled('call2');
      
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenNthCalledWith(1, 'call1');
      expect(fn).toHaveBeenNthCalledWith(2, 'call2');
    });
  });

  describe('sleep', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should resolve after specified time', async () => {
      const promise = sleep(100);
      
      vi.advanceTimersByTime(100);
      
      await expect(promise).resolves.toBeUndefined();
    });
  });
});

/**
 * useFetch Hook - Data fetching with caching and refetch
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseFetchOptions {
  immediate?: boolean;
  cache?: boolean;
  cacheTime?: number;
}

interface UseFetchReturn<T> extends FetchState<T> {
  refetch: () => Promise<void>;
  mutate: (data: T) => void;
}

const cache = new Map<string, { data: unknown; timestamp: number }>();

export function useFetch<T>(
  url: string,
  options: UseFetchOptions = {}
): UseFetchReturn<T> {
  const { immediate = true, cache: useCache = false, cacheTime = 5 * 60 * 1000 } = options;
  
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Check cache
    if (useCache) {
      const cached = cache.get(url);
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        setState({ data: cached.data as T, loading: false, error: null });
        return;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Update cache
      if (useCache) {
        cache.set(url, { data, timestamp: Date.now() });
      }

      setState({ data, loading: false, error: null });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setState({ data: null, loading: false, error: error as Error });
      }
    }
  }, [url, useCache, cacheTime]);

  const refetch = useCallback(async () => {
    // Clear cache for this URL
    cache.delete(url);
    await fetchData();
  }, [url, fetchData]);

  const mutate = useCallback((newData: T) => {
    setState((prev) => ({ ...prev, data: newData }));
    if (useCache) {
      cache.set(url, { data: newData, timestamp: Date.now() });
    }
  }, [url, useCache]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate, fetchData]);

  return { ...state, refetch, mutate };
}

export default useFetch;

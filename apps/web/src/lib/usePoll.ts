import { useCallback, useEffect, useRef, useState } from 'react';

export interface PollState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refetch: () => void;
}

/**
 * Polls `fetcher` every `intervalMs`. Cancels in-flight responses on unmount.
 * Pass a stable fetcher (memoize with useCallback) to avoid extra polls.
 */
export function usePoll<T>(fetcher: () => Promise<T>, intervalMs: number): PollState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const run = useCallback(async () => {
    try {
      const next = await fetcher();
      if (mounted.current) {
        setData(next);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    mounted.current = true;
    void run();
    const id = setInterval(() => {
      void run();
    }, intervalMs);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [run, intervalMs]);

  const refetch = useCallback(() => {
    setLoading(true);
    void run();
  }, [run]);

  return { data, error, loading, refetch };
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { isDemoMode, getDemoData } from '@/lib/demo';

export function usePolling<T>(path: string, intervalMs: number = 30000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    if (!path) { setLoading(false); return; }

    if (isDemoMode()) {
      const demo = getDemoData(path);
      if (demo !== null) setData(demo as T);
      setLoading(false);
      return;
    }

    try {
      const result = await api.get<T>(path);
      setData(result);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    fetchData();

    const poll = () => {
      timerRef.current = setTimeout(async () => {
        if (document.visibilityState === 'visible') {
          await fetchData();
        }
        poll();
      }, intervalMs);
    };

    poll();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchData, intervalMs]);

  return { data, loading, error, refetch: fetchData };
}

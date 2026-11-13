import { useCallback, useEffect, useState } from 'react';
import { api, type ApiError } from '@/lib/api';

// Loads `path` from the API, again whenever the path changes, and again on reload(). `data` keeps the last
// answer while a new path loads (`loading` says so), and is null before the first; `error` is the API's
// message when loading failed. setData replaces it, for an answer the page got another way (after a save).
export function useApiData<T>(path: string) {
  const [loaded, setLoaded] = useState<{ path: string; data: T } | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setError('');
    api<T>(path)
      .then((data: T) => {
        if (current) setLoaded({ path, data });
      })
      .catch((failed: ApiError) => {
        if (current) setError(failed.message);
      });
    return () => {
      current = false;
    };
  }, [path, attempt]);

  const reload = useCallback((): void => setAttempt((count: number) => count + 1), []);
  const setData = useCallback((data: T): void => setLoaded({ path, data }), [path]);
  return { data: loaded?.data ?? null, loading: loaded?.path !== path, error, reload, setData };
}

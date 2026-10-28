import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

// useState that survives page reloads by mirroring the value into localStorage.
export function usePersistentState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? initialValue : (JSON.parse(stored) as T);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be full or blocked (private mode); the in-memory state keeps working.
    }
  }, [key, value]);

  return [value, setValue];
}

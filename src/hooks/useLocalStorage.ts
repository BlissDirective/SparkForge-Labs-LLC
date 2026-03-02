import { useState, useEffect, useCallback } from 'react';

/**
 * SSR-safe localStorage hook with JSON serialization.
 * Falls back to initialValue during SSR and when localStorage
 * is unavailable (e.g. private browsing in some browsers).
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Read from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(`sparkforge-${key}`);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "sparkforge-${key}":`, error);
    }
  }, [key]);

  // Write to localStorage whenever value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const newValue = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(`sparkforge-${key}`, JSON.stringify(newValue));
        } catch (error) {
          console.warn(`Error writing localStorage key "sparkforge-${key}":`, error);
        }
        return newValue;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}

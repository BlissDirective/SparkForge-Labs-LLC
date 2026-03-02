import { useState, useEffect } from 'react';

/**
 * Debounce a value by the specified delay (ms).
 * Returns the debounced value which only updates after
 * the input stops changing for [delay] milliseconds.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

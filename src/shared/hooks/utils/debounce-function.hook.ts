import { useEffect, useRef } from 'react';

/**
 * Utility function to debounce a function. It delays the execution of a function
 * until after a specified delay has elapsed since the last time it was invoked.
 *
 * @param func The function to be debounced.
 * @param delay The delay in milliseconds.
 * @returns The debounced function.
 *
 * Usage Example:
 * ```
 * const Component: React.FC = () => {
 *   const debouncedLog = useDebouncedFunction((message: string) => console.log(message), 500);
 *
 *   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 *     debouncedLog(e.target.value);
 *   };
 *
 *   return <input type="text" onChange={handleChange} />;
 * };
 * ```
 */
export function useDebouncedFunction<T extends (...args: any[]) => void>(func: T, delay: number): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  function debouncedFunction(...args: any[]) {
    clearTimeout(timeoutRef.current || 0);

    timeoutRef.current = setTimeout(() => {
      func(...args);
    }, delay);
  }

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current || 0);
    };
  }, []);

  return debouncedFunction as T;
}

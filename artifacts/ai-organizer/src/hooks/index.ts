/**
 * Hooks Index - Central export for all custom hooks
 */

// Storage
export { useLocalStorage } from './useLocalStorage';

// Debounce
export { useDebounce, useDebouncedCallback } from './useDebounce';

// Click Outside
export { useClickOutside } from './useClickOutside';

// Clipboard
export { useCopyToClipboard } from './useCopyToClipboard';

// Media Query
export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsLargeDesktop,
  usePrefersDarkMode,
  usePrefersReducedMotion,
} from './useMediaQuery';

// Scroll Lock
export { useScrollLock, useScrollLockControl } from './useScrollLock';

// Intersection Observer
export { useOnScreen } from './useOnScreen';

// Previous Value
export { usePrevious } from './usePrevious';

// Toggle
export { useToggle } from './useToggle';

// Interval
export { useInterval } from './useInterval';

// Key Press
export { useKeyPress, useKeyCombo } from './useKeyPress';

// Async State
export { useAsync, useAsyncCallback } from './useAsync';

// Data Fetching
export { useFetch } from './useFetch';

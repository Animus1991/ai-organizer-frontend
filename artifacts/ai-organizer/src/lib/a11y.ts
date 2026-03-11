/**
 * Accessibility utilities for the application
 * Provides ARIA helpers, focus management, and screen reader announcements
 */

// Screen reader announcements
let announcer: HTMLDivElement | null = null;

export function initAnnouncer(): void {
  if (announcer) return;
  
  announcer = document.createElement('div');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.setAttribute('role', 'status');
  announcer.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  document.body.appendChild(announcer);
}

export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (!announcer) initAnnouncer();
  if (!announcer) return;
  
  announcer.setAttribute('aria-live', priority);
  announcer.textContent = '';
  
  // Use setTimeout to ensure screen readers pick up the change
  setTimeout(() => {
    if (announcer) announcer.textContent = message;
  }, 100);
}

// Focus management
export function focusFirst(container: HTMLElement): void {
  const focusable = getFocusableElements(container);
  if (focusable.length > 0) {
    focusable[0].focus();
  }
}

export function focusLast(container: HTMLElement): void {
  const focusable = getFocusableElements(container);
  if (focusable.length > 0) {
    focusable[focusable.length - 1].focus();
  }
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

// Focus trap for modals
export function trapFocus(container: HTMLElement): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    const focusable = getFocusableElements(container);
    if (focusable.length === 0) return;
    
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  
  container.addEventListener('keydown', handleKeyDown);
  focusFirst(container);
  
  return () => container.removeEventListener('keydown', handleKeyDown);
}

// ARIA helpers
export const ariaLabel = (label: string) => ({ 'aria-label': label });
export const ariaDescribedBy = (id: string) => ({ 'aria-describedby': id });
export const ariaLabelledBy = (id: string) => ({ 'aria-labelledby': id });
export const ariaHidden = (hidden: boolean) => ({ 'aria-hidden': hidden });
export const ariaExpanded = (expanded: boolean) => ({ 'aria-expanded': expanded });
export const ariaSelected = (selected: boolean) => ({ 'aria-selected': selected });
export const ariaDisabled = (disabled: boolean) => ({ 'aria-disabled': disabled });
export const ariaPressed = (pressed: boolean) => ({ 'aria-pressed': pressed });
export const ariaChecked = (checked: boolean) => ({ 'aria-checked': checked });
export const ariaCurrent = (current: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false') => ({ 'aria-current': current });

// Role helpers
export const role = (role: string) => ({ role });
export const roleButton = () => role('button');
export const roleDialog = () => role('dialog');
export const roleAlert = () => role('alert');
export const roleStatus = () => role('status');
export const roleProgressbar = () => role('progressbar');
export const roleListbox = () => role('listbox');
export const roleOption = () => role('option');

// Keyboard navigation helpers
export function handleArrowNavigation(
  e: React.KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onSelect: (index: number) => void
): void {
  let newIndex = currentIndex;
  
  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      e.preventDefault();
      newIndex = (currentIndex + 1) % items.length;
      break;
    case 'ArrowUp':
    case 'ArrowLeft':
      e.preventDefault();
      newIndex = (currentIndex - 1 + items.length) % items.length;
      break;
    case 'Home':
      e.preventDefault();
      newIndex = 0;
      break;
    case 'End':
      e.preventDefault();
      newIndex = items.length - 1;
      break;
    default:
      return;
  }
  
  onSelect(newIndex);
  items[newIndex]?.focus();
}

// Skip link for keyboard users
export function createSkipLink(targetId: string, text: string = 'Skip to main content'): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.textContent = text;
  link.className = 'skip-link';
  link.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: #6366f1;
    color: white;
    padding: 8px 16px;
    z-index: 10000;
    transition: top 0.2s;
  `;
  
  link.addEventListener('focus', () => {
    link.style.top = '0';
  });
  
  link.addEventListener('blur', () => {
    link.style.top = '-40px';
  });
  
  return link;
}

export default {
  announce,
  focusFirst,
  focusLast,
  trapFocus,
  getFocusableElements,
  handleArrowNavigation,
  createSkipLink,
  ariaLabel,
  ariaDescribedBy,
  ariaLabelledBy,
  ariaHidden,
  ariaExpanded,
  ariaSelected,
  ariaDisabled,
  ariaPressed,
  ariaChecked,
  ariaCurrent,
  role,
};

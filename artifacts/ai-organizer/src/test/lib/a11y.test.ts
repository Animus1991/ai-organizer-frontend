import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  announce, 
  focusFirst, 
  focusLast, 
  getFocusableElements,
  ariaLabel,
  ariaExpanded,
  ariaDisabled
} from '../../lib/a11y';

describe('a11y utilities', () => {
  describe('ARIA helpers', () => {
    it('ariaLabel returns correct object', () => {
      expect(ariaLabel('Close dialog')).toEqual({ 'aria-label': 'Close dialog' });
    });

    it('ariaExpanded returns correct object', () => {
      expect(ariaExpanded(true)).toEqual({ 'aria-expanded': true });
      expect(ariaExpanded(false)).toEqual({ 'aria-expanded': false });
    });

    it('ariaDisabled returns correct object', () => {
      expect(ariaDisabled(true)).toEqual({ 'aria-disabled': true });
      expect(ariaDisabled(false)).toEqual({ 'aria-disabled': false });
    });
  });

  describe('getFocusableElements', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.innerHTML = `
        <button>Button 1</button>
        <input type="text" />
        <button disabled>Disabled</button>
        <a href="#">Link</a>
        <div tabindex="0">Focusable div</div>
        <div tabindex="-1">Not focusable</div>
      `;
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('returns only focusable elements', () => {
      const focusable = getFocusableElements(container);
      expect(focusable.length).toBe(4); // button, input, link, div[tabindex=0]
    });

    it('excludes disabled elements', () => {
      const focusable = getFocusableElements(container);
      const hasDisabled = focusable.some(el => el.hasAttribute('disabled'));
      expect(hasDisabled).toBe(false);
    });
  });

  describe('focusFirst and focusLast', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.innerHTML = `
        <button id="first">First</button>
        <button id="middle">Middle</button>
        <button id="last">Last</button>
      `;
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('focusFirst focuses the first focusable element', () => {
      focusFirst(container);
      expect(document.activeElement?.id).toBe('first');
    });

    it('focusLast focuses the last focusable element', () => {
      focusLast(container);
      expect(document.activeElement?.id).toBe('last');
    });
  });

  describe('announce', () => {
    it('creates announcer element if not exists', () => {
      announce('Test message');
      const announcer = document.querySelector('[aria-live]');
      expect(announcer).not.toBeNull();
    });
  });
});

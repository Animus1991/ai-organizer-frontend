/**
 * Home Hooks
 * 
 * Centralized exports for home page-related hooks.
 * 
 * @module hooks/home
 */

export { useHomeState } from './useHomeState';
export type { SegmentRow, SegSummaryRow } from './useHomeState';

export { useHomeOperations } from './useHomeOperations';
export type { HomeOperations, HomeState } from './useHomeOperations';

export { useIdentitySyncStatus, CONNECTOR_META } from './useIdentitySyncStatus';

export { useHomeModals } from './useHomeModals';
export { useHomeKeyboard } from './useHomeKeyboard';

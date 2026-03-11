/**
 * Segmentation Index
 * Central exports for segmentation functionality
 */

export { TimeBasedSegmentation } from './TimeBasedSegmentation';
export type { Segment, SegmentationStrategy } from './TimeBasedSegmentation';
export { TopicBasedSegmentation } from './TopicBasedSegmentation';
export { QueryResponseSegmentation } from './QueryResponseSegmentation';
export { SegmentationEngine, segmentationEngine } from './SegmentationEngine';
export type { SegmentationMethod, SegmentationOptions } from './SegmentationEngine';

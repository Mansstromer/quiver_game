import { SKUConfig, DemandSegment } from './types';

/**
 * Get the demand rate for a SKU at a specific time
 * Supports both new DemandSegment format and legacy demandRates array
 */
export function getDemandRate(sku: SKUConfig, time: number, gameDuration: number): number {
  // Use new demandSegments if available
  if (sku.demandSegments && sku.demandSegments.length > 0) {
    for (const segment of sku.demandSegments) {
      if (time >= segment.startTime && time < segment.endTime) {
        return segment.baseRate;
      }
    }
    // If past all segments, return the last segment's rate
    const lastSegment = sku.demandSegments[sku.demandSegments.length - 1];
    if (time >= lastSegment.endTime) {
      return lastSegment.baseRate;
    }
    return 0;
  }

  // Legacy fallback for demandRates array (will be removed after migration)
  const demandRates = (sku as any).demandRates as number[] | undefined;
  if (demandRates && demandRates.length > 0) {
    const segmentDuration = gameDuration / demandRates.length;
    const segmentIndex = Math.floor(time / segmentDuration);

    if (segmentIndex < 0 || segmentIndex >= demandRates.length) {
      return 0;
    }

    return demandRates[segmentIndex];
  }

  return 0;
}

/**
 * Calculate total demand between two time points for a SKU
 */
export function getDemandBetween(
  sku: SKUConfig,
  startTime: number,
  endTime: number,
  gameDuration: number
): number {
  // Use new demandSegments if available
  if (sku.demandSegments && sku.demandSegments.length > 0) {
    let totalDemand = 0;

    for (const segment of sku.demandSegments) {
      const overlapStart = Math.max(startTime, segment.startTime);
      const overlapEnd = Math.min(endTime, segment.endTime);

      if (overlapStart < overlapEnd) {
        totalDemand += (overlapEnd - overlapStart) * segment.baseRate;
      }
    }

    return totalDemand;
  }

  // Legacy fallback for demandRates array
  const demandRates = (sku as any).demandRates as number[] | undefined;
  if (demandRates && demandRates.length > 0) {
    const segmentDuration = gameDuration / demandRates.length;
    let totalDemand = 0;

    for (let i = 0; i < demandRates.length; i++) {
      const segmentStart = i * segmentDuration;
      const segmentEnd = (i + 1) * segmentDuration;
      const rate = demandRates[i];

      const overlapStart = Math.max(startTime, segmentStart);
      const overlapEnd = Math.min(endTime, segmentEnd);

      if (overlapStart < overlapEnd) {
        totalDemand += (overlapEnd - overlapStart) * rate;
      }
    }

    return totalDemand;
  }

  return 0;
}

/**
 * Calculate the total demand for a full level run
 */
export function getTotalLevelDemand(segments: DemandSegment[]): number {
  return segments.reduce((total, segment) => {
    const duration = segment.endTime - segment.startTime;
    return total + duration * segment.baseRate;
  }, 0);
}

/**
 * Get demand rate at a specific time from segments array
 */
export function getDemandRateFromSegments(segments: DemandSegment[], time: number): number {
  for (const segment of segments) {
    if (time >= segment.startTime && time < segment.endTime) {
      return segment.baseRate;
    }
  }
  return segments.length > 0 ? segments[segments.length - 1].baseRate : 0;
}

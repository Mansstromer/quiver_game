import { GameState, LevelConfig, SKUConfig, SKUState } from './types';
import { BASE_LEAD_TIME } from './constants';

function isPlayingStatus(status: string): boolean {
  return status === 'level-1' || status === 'level-2' || status === 'level-3' || status === 'quiver-demo';
}

/**
 * Forecast-Aware Supply Chain Engine
 *
 * Quiver uses a forward-looking inventory projection:
 *
 * 1. Predicted Demand = forecast demand from now to (now + leadTime)
 *    → uses actual demand segments + marketing event multipliers
 * 2. Arriving Orders = pending orders arriving before (now + leadTime)
 * 3. Predicted Inventory = on-hand - predicted demand + arriving orders
 * 4. Safety Stock = z × σ × √(lead_time)  where z = 1.65 (95% service level)
 * 5. Reorder Point = Lead Time Demand + Safety Stock
 *
 * Order when: Predicted Inventory ≤ Reorder Point
 */

// Get the effective demand rate for a segment, splitting it into sub-intervals
// based on whether a marketing event overlaps with the segment window.
function getEffectiveRateParts(
  baseRate: number,
  segStart: number,
  segEnd: number,
  skuConfig: SKUConfig,
  level: LevelConfig
): { rate: number; duration: number }[] {
  // If this SKU has no marketing event, return the base rate for the whole segment
  if (skuConfig.marketingEventIndex == null) {
    return [{ rate: baseRate, duration: segEnd - segStart }];
  }

  const event = level.marketingEvents[skuConfig.marketingEventIndex];
  if (!event) {
    return [{ rate: baseRate, duration: segEnd - segStart }];
  }

  const evStart = event.triggerTime;
  const evEnd = event.triggerTime + event.duration;

  // No overlap between segment and event
  if (evEnd <= segStart || evStart >= segEnd) {
    return [{ rate: baseRate, duration: segEnd - segStart }];
  }

  const parts: { rate: number; duration: number }[] = [];
  const overlapStart = Math.max(segStart, evStart);
  const overlapEnd = Math.min(segEnd, evEnd);

  // Before event
  if (overlapStart > segStart) {
    parts.push({ rate: baseRate, duration: overlapStart - segStart });
  }
  // During event
  parts.push({ rate: baseRate * event.demandMultiplier, duration: overlapEnd - overlapStart });
  // After event
  if (overlapEnd < segEnd) {
    parts.push({ rate: baseRate, duration: segEnd - overlapEnd });
  }

  return parts;
}

// Calculate average demand rate for a SKU based on its demand segments,
// accounting for marketing event multipliers on affected time windows.
function calculateAverageDemandRate(skuConfig: SKUConfig, level: LevelConfig): number {
  let totalDemand = 0;
  const gameDuration = level.duration;

  for (const segment of skuConfig.demandSegments) {
    const segEnd = Math.min(segment.endTime, gameDuration);
    if (segEnd > segment.startTime) {
      const parts = getEffectiveRateParts(segment.baseRate, segment.startTime, segEnd, skuConfig, level);
      for (const part of parts) {
        totalDemand += part.rate * part.duration;
      }
    }
  }

  return totalDemand / gameDuration;
}

// Calculate standard deviation of demand rates across all segments,
// accounting for marketing event multipliers on affected time windows.
function calculateDemandStdDev(skuConfig: SKUConfig, level: LevelConfig): number {
  const avgRate = calculateAverageDemandRate(skuConfig, level);
  const gameDuration = level.duration;

  let sumSquaredDiff = 0;
  let totalWeight = 0;

  for (const segment of skuConfig.demandSegments) {
    const segEnd = Math.min(segment.endTime, gameDuration);
    if (segEnd > segment.startTime) {
      const parts = getEffectiveRateParts(segment.baseRate, segment.startTime, segEnd, skuConfig, level);
      for (const part of parts) {
        const diff = part.rate - avgRate;
        sumSquaredDiff += diff * diff * part.duration;
        totalWeight += part.duration;
      }
    }
  }

  return totalWeight > 0 ? Math.sqrt(sumSquaredDiff / totalWeight) : 0;
}

// Calculate safety stock: z × σ × √(lead_time)
// z = 1.65 for 95% service level
function calculateSafetyStock(stdDev: number, effectiveLeadTime: number): number {
  const z = 1.65;
  return z * stdDev * Math.sqrt(effectiveLeadTime);
}

// Predict total demand between two time points using the actual demand forecast
// (demand segments + marketing event multipliers) instead of a flat average.
function predictDemandBetween(
  skuConfig: SKUConfig,
  level: LevelConfig,
  fromTime: number,
  toTime: number
): number {
  let totalDemand = 0;

  for (const segment of skuConfig.demandSegments) {
    // Clamp segment to the [fromTime, toTime] window
    const overlapStart = Math.max(segment.startTime, fromTime);
    const overlapEnd = Math.min(segment.endTime, toTime);
    if (overlapEnd <= overlapStart) continue;

    // Use getEffectiveRateParts to account for marketing event multipliers
    const parts = getEffectiveRateParts(segment.baseRate, overlapStart, overlapEnd, skuConfig, level);
    for (const part of parts) {
      totalDemand += part.rate * part.duration;
    }
  }

  return totalDemand;
}

// Predict inventory at a future time by projecting current on-hand,
// subtracting forecast demand, and adding arriving pending orders.
function predictInventoryAtTime(
  skuState: SKUState,
  skuConfig: SKUConfig,
  level: LevelConfig,
  currentTime: number,
  targetTime: number
): number {
  const forecastDemand = predictDemandBetween(skuConfig, level, currentTime, targetTime);
  const arrivingOrders = skuState.pendingOrders
    .filter(order => order.arrivalTime <= targetTime)
    .reduce((sum, order) => sum + order.quantity, 0);

  return Math.max(0, skuState.inventory - forecastDemand + arrivingOrders);
}

// Calculate inventory position (on-hand + on-order)
// This is what we compare against the reorder point
function calculateInventoryPosition(skuState: SKUState): number {
  const onHand = skuState.inventory;
  const onOrder = skuState.pendingOrders.reduce((sum, order) => sum + order.quantity, 0);
  return onHand + onOrder;
}

// Determine if Quiver should place an order for a specific SKU
export function shouldQuiverOrderForSKU(
  state: GameState,
  skuState: SKUState,
  skuConfig: SKUConfig,
  level: LevelConfig
): boolean {
  // Don't order if game not playing
  if (!isPlayingStatus(state.status)) return false;

  // Don't order too close to end of game (order won't arrive in time)
  const baseLeadTime = skuConfig.leadTime ?? BASE_LEAD_TIME;
  const effectiveLeadTime = baseLeadTime * level.leadTimeMultiplier;
  if (state.time + effectiveLeadTime > level.duration) return false;

  // Calculate safety stock and reorder point
  const stdDev = calculateDemandStdDev(skuConfig, level);
  const safetyStock = calculateSafetyStock(stdDev, effectiveLeadTime);
  const avgDemandRate = calculateAverageDemandRate(skuConfig, level);
  const leadTimeDemand = avgDemandRate * effectiveLeadTime;
  const reorderPoint = (leadTimeDemand + safetyStock) * 0.25;

  // Predict inventory at the time an order placed now would arrive
  const predictedInventory = predictInventoryAtTime(
    skuState, skuConfig, level, state.time, state.time + effectiveLeadTime
  );

  // Order when predicted inventory at arrival time would be at or below reorder point
  return predictedInventory <= reorderPoint;
}

// Expose Quiver's internal metrics for UI display (Level 4 demo)
export interface QuiverMetrics {
  safetyStock: number;
  leadTimeDemand: number;
  reorderPoint: number;
  inventoryPosition: number;
  predictedInventory: number;
  shouldOrder: boolean;
}

export function getQuiverMetricsForSKU(
  state: GameState,
  skuState: SKUState,
  skuConfig: SKUConfig,
  level: LevelConfig
): QuiverMetrics {
  const baseLeadTime = skuConfig.leadTime ?? BASE_LEAD_TIME;
  const effectiveLeadTime = baseLeadTime * level.leadTimeMultiplier;
  const stdDev = calculateDemandStdDev(skuConfig, level);

  const safetyStock = calculateSafetyStock(stdDev, effectiveLeadTime);
  const avgDemandRate = calculateAverageDemandRate(skuConfig, level);
  const leadTimeDemand = avgDemandRate * effectiveLeadTime;
  const reorderPoint = (leadTimeDemand + safetyStock) * 0.25;
  const inventoryPosition = calculateInventoryPosition(skuState);
  const predictedInventory = predictInventoryAtTime(
    skuState, skuConfig, level, state.time, state.time + effectiveLeadTime
  );

  return {
    safetyStock,
    leadTimeDemand,
    reorderPoint,
    inventoryPosition,
    predictedInventory,
    shouldOrder: shouldQuiverOrderForSKU(state, skuState, skuConfig, level),
  };
}

// Determine which SKUs need orders (returns array of SKU IDs)
export function getQuiverOrders(state: GameState, level: LevelConfig): string[] {
  if (!isPlayingStatus(state.status)) return [];

  const ordersToPlace: string[] = [];

  state.skuStates.forEach((skuState, index) => {
    const skuConfig = level.skus[index];
    if (shouldQuiverOrderForSKU(state, skuState, skuConfig, level)) {
      ordersToPlace.push(skuState.skuId);
    }
  });

  return ordersToPlace;
}

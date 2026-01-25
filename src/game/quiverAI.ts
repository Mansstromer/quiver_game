import { GameState, LevelConfig, SKUConfig, SKUState } from './types';
import { SECONDS_PER_MONTH, BASE_LEAD_TIME } from './constants';

function isPlayingStatus(status: string): boolean {
  return status === 'level-1' || status === 'level-2' || status === 'level-3' || status === 'quiver-demo';
}

/**
 * Supply Chain Best Practices Implementation
 *
 * Quiver uses standard inventory management formulas:
 *
 * 1. Average Demand Rate = Total demand / Duration (from historical data)
 * 2. Safety Stock = Half month's worth of demand (buffer for variability)
 * 3. Lead Time Demand = Average Demand Rate × Lead Time
 * 4. Reorder Point (ROP) = Lead Time Demand + Safety Stock
 *
 * Order when: Inventory Position (on-hand + on-order) ≤ Reorder Point
 *
 * This approach is realistic because:
 * - It doesn't "look ahead" at future demand curves
 * - It uses average/historical data like real inventory systems
 * - Marketing events cause unexpected spikes that safety stock can't fully cover
 */

// Calculate average demand rate for a SKU based on its demand segments
// This simulates calculating average from historical data
function calculateAverageDemandRate(skuConfig: SKUConfig, gameDuration: number): number {
  let totalDemand = 0;

  for (const segment of skuConfig.demandSegments) {
    const segmentDuration = Math.min(segment.endTime, gameDuration) - segment.startTime;
    if (segmentDuration > 0) {
      totalDemand += segment.baseRate * segmentDuration;
    }
  }

  return totalDemand / gameDuration;
}

// Calculate safety stock as half a month's worth of demand
// This provides a buffer against demand variability
function calculateSafetyStock(averageDemandRate: number): number {
  const halfMonth = SECONDS_PER_MONTH / 2; // 6 seconds = half a month
  return averageDemandRate * halfMonth;
}

// Calculate reorder point using supply chain formula
// ROP = Lead Time Demand + Safety Stock
function calculateReorderPoint(
  skuConfig: SKUConfig,
  level: LevelConfig
): number {
  // Use SKU-specific lead time, or fall back to base lead time from constants
  const baseLeadTime = skuConfig.leadTime ?? BASE_LEAD_TIME;
  const effectiveLeadTime = baseLeadTime * level.leadTimeMultiplier;
  const averageDemandRate = calculateAverageDemandRate(skuConfig, level.duration);

  // Lead time demand = demand expected during the lead time period
  const leadTimeDemand = averageDemandRate * effectiveLeadTime;

  // Safety stock = half a month's demand as buffer
  const safetyStock = calculateSafetyStock(averageDemandRate);

  // Reorder Point = Lead Time Demand + Safety Stock
  // Order when inventory drops to this level to ensure stock arrives before hitting safety stock
  const reorderPoint = leadTimeDemand + safetyStock;

  return reorderPoint;
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

  // Calculate reorder point using supply chain best practices
  const reorderPoint = calculateReorderPoint(skuConfig, level);

  // Calculate inventory position (on-hand + pending orders)
  const inventoryPosition = calculateInventoryPosition(skuState);

  // Minimum time between orders to prevent over-ordering
  const minTimeBetweenOrders = 2;

  // Order when inventory position falls to or below the reorder point
  // This ensures new stock arrives before we dip into safety stock
  return (
    inventoryPosition <= reorderPoint &&
    state.time - skuState.lastOrderTime >= minTimeBetweenOrders
  );
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

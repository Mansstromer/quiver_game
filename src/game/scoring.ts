import { ProductConfig, LevelScore, SKUState } from './types';
import { getHoldingCostPerSecond, getMargin } from './products';
import { BASE_SCORE, GRADE_THRESHOLDS } from './constants';

export interface TickCostResult {
  holdingCost: number;
  stockoutCost: number;
  newInventory: number;
  unmetDemand: number;
}

/**
 * Calculate costs for a single game tick
 * Uses product-specific holding cost rate and margin for stockout cost
 */
export function calculateTickCosts(
  inventory: number,
  demandRate: number,
  deltaTime: number,
  product: ProductConfig
): TickCostResult {
  const demand = demandRate * deltaTime;
  const holdingCostPerSecond = getHoldingCostPerSecond(product);
  const stockoutCostPerUnit = getMargin(product);  // Lost margin

  if (inventory >= demand) {
    // Normal operation: deduct demand, charge holding cost
    return {
      holdingCost: inventory * holdingCostPerSecond * deltaTime,
      stockoutCost: 0,
      newInventory: inventory - demand,
      unmetDemand: 0,
    };
  } else {
    // Stockout: deplete to 0, charge for unmet demand
    const unmetDemand = demand - inventory;
    return {
      holdingCost: (inventory / 2) * holdingCostPerSecond * deltaTime,
      stockoutCost: unmetDemand * stockoutCostPerUnit,
      newInventory: 0,
      unmetDemand,
    };
  }
}

/**
 * Calculate grade based on total cost, level, and product
 */
export function calculateGrade(totalCost: number, levelId: string, productId?: string): 'A' | 'B' | 'C' | 'D' | 'F' {
  // Default to protein-bar thresholds if no product specified
  const productThresholds = GRADE_THRESHOLDS[productId || 'protein-bar'] || GRADE_THRESHOLDS['protein-bar'];
  const thresholds = productThresholds[levelId] || productThresholds['level-1'];
  if (totalCost <= thresholds.A) return 'A';
  if (totalCost <= thresholds.B) return 'B';
  if (totalCost <= thresholds.C) return 'C';
  if (totalCost <= thresholds.D) return 'D';
  return 'F';
}

/**
 * Calculate score from total cost
 */
export function calculateScore(totalCost: number): number {
  return Math.max(0, BASE_SCORE - totalCost);
}

/**
 * Calculate level score from all SKU states
 */
export function calculateLevelScore(
  levelId: string,
  skuStates: SKUState[],
  productId?: string
): LevelScore {
  const totalHoldingCost = skuStates.reduce((sum, sku) => sum + sku.totalHoldingCost, 0);
  const totalStockoutCost = skuStates.reduce((sum, sku) => sum + sku.totalStockoutCost, 0);
  const totalOrderingCost = skuStates.reduce((sum, sku) => sum + sku.totalOrderingCost, 0);
  const totalCost = totalHoldingCost + totalStockoutCost + totalOrderingCost;

  return {
    levelId,
    totalHoldingCost,
    totalStockoutCost,
    totalOrderingCost,
    totalCost,
    score: calculateScore(totalCost),
    grade: calculateGrade(totalCost, levelId, productId),
  };
}

/**
 * Format cost for display (€ with appropriate precision)
 */
export function formatCost(cost: number): string {
  if (cost >= 1000) {
    return `€${(cost / 1000).toFixed(1)}k`;
  }
  if (cost >= 100) {
    return `€${cost.toFixed(0)}`;
  }
  return `€${cost.toFixed(2)}`;
}

/**
 * Format large numbers for inventory display
 */
export function formatInventory(inventory: number): string {
  if (inventory >= 1000) {
    return `${(inventory / 1000).toFixed(1)}k`;
  }
  return inventory.toFixed(0);
}

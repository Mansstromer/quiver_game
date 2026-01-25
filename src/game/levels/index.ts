import { LevelConfig, ProductConfig, DemandSegment, SKUConfig } from '../types';
import {
  GAME_DURATION,
  SECONDS_PER_MONTH,
  LEVEL_2_LEAD_TIME_MULTIPLIER,
  MARKETING_EVENT_DURATION,
  MARKETING_EVENT_DEMAND_MULTIPLIER,
  LEVEL_2_MARKETING_EVENT_TIME,
  LEVEL_3_MARKETING_EVENT_TIMES,
} from '../constants';

/**
 * Generate demand segments for a level
 * Creates 3 segments (one per month) with varying demand rates
 * Sharper curves require more active inventory management
 */
function generateDemandSegments(
  baseRate: number,
  pattern: 'stable' | 'increasing' | 'variable'
): DemandSegment[] {
  switch (pattern) {
    case 'stable':
      // More variation even in "stable" pattern - requires ~6-7 orders for protein bars
      return [
        { startTime: 0, endTime: SECONDS_PER_MONTH, baseRate: baseRate * 2.03 },
        { startTime: SECONDS_PER_MONTH, endTime: SECONDS_PER_MONTH * 2, baseRate: baseRate * 3.04 },
        { startTime: SECONDS_PER_MONTH * 2, endTime: GAME_DURATION, baseRate: baseRate * 1.69 },
      ];
    case 'increasing':
      // Steep ramp-up pattern
      return [
        { startTime: 0, endTime: SECONDS_PER_MONTH, baseRate: baseRate * 1.35 },
        { startTime: SECONDS_PER_MONTH, endTime: SECONDS_PER_MONTH * 2, baseRate: baseRate * 2.54 },
        { startTime: SECONDS_PER_MONTH * 2, endTime: GAME_DURATION, baseRate: baseRate * 3.72 },
      ];
    case 'variable':
    default:
      // High variability - challenging pattern
      return [
        { startTime: 0, endTime: SECONDS_PER_MONTH, baseRate: baseRate * 2.37 },
        { startTime: SECONDS_PER_MONTH, endTime: SECONDS_PER_MONTH * 2, baseRate: baseRate * 3.38 },
        { startTime: SECONDS_PER_MONTH * 2, endTime: GAME_DURATION, baseRate: baseRate * 1.35 },
      ];
  }
}

/**
 * Create Level 1 configuration for a product
 * - Single SKU
 * - Forecast visible
 * - No marketing events
 * - Normal lead time
 */
export function createLevel1(product: ProductConfig): LevelConfig {
  const baseRate = product.demandScale;

  return {
    id: 'level-1',
    name: 'Level 1',
    description: 'Learn the basics with predictable demand',
    duration: GAME_DURATION,
    showForecast: true,
    leadTimeMultiplier: 1.0,
    marketingEvents: [],
    quiverEnabled: false,
    skus: [
      {
        id: 'sku-1',
        name: product.name,
        demandSegments: generateDemandSegments(baseRate, 'stable'),
        initialInventory: product.baseInitialInventory,
        orderQuantity: product.baseOrderQuantity,
      },
    ],
  };
}

/**
 * Create Level 2 configuration for a product
 * - Single SKU
 * - NO forecast (hidden)
 * - Marketing event at 4 seconds (doubles demand for 7 seconds)
 * - 50% longer lead time
 */
export function createLevel2(product: ProductConfig): LevelConfig {
  const baseRate = product.demandScale;

  return {
    id: 'level-2',
    name: 'Level 2',
    description: 'Handle unexpected demand spikes',
    duration: GAME_DURATION,
    showForecast: false,
    leadTimeMultiplier: LEVEL_2_LEAD_TIME_MULTIPLIER,
    marketingEvents: [
      {
        triggerTime: LEVEL_2_MARKETING_EVENT_TIME,
        duration: MARKETING_EVENT_DURATION,
        demandMultiplier: MARKETING_EVENT_DEMAND_MULTIPLIER,
        label: 'Marketing Campaign Begins!',
      },
    ],
    quiverEnabled: false,
    skus: [
      {
        id: 'sku-1',
        name: product.name,
        demandSegments: generateDemandSegments(baseRate, 'variable'),
        initialInventory: product.baseInitialInventory,
        orderQuantity: product.baseOrderQuantity,
        marketingEventIndex: 0,  // Affected by the marketing event
      },
    ],
  };
}

/**
 * Create Level 3 configuration for a product
 * - 6 SKUs (variants)
 * - NO forecast
 * - 2 marketing events affecting different SKUs
 * - Normal lead time
 */
export function createLevel3(product: ProductConfig): LevelConfig {
  const baseRate = product.demandScale;
  const variants = product.skuVariants;

  // Generate slightly different demand patterns for each SKU
  const demandPatterns: Array<'stable' | 'increasing' | 'variable'> = [
    'stable', 'variable', 'increasing', 'variable', 'stable', 'increasing'
  ];

  // Generate SKU configs
  const skus: SKUConfig[] = variants.map((variant, index) => {
    // Vary the base rate slightly for each SKU (80% to 120%)
    const skuBaseRate = baseRate * (0.8 + (index * 0.08));

    return {
      id: `sku-${index + 1}`,
      name: `${product.name}`,
      variant: variant,
      demandSegments: generateDemandSegments(skuBaseRate, demandPatterns[index]),
      initialInventory: product.baseInitialInventory,
      orderQuantity: product.baseOrderQuantity,
      // SKU 1 (index 0, top-left) gets event at 4s, SKU 5 (index 4, bottom-middle) gets event at 14s
      marketingEventIndex: index === 0 ? 0 : index === 4 ? 1 : undefined,
    };
  });

  return {
    id: 'level-3',
    name: 'Level 3',
    description: 'Manage 6 SKUs simultaneously',
    duration: GAME_DURATION,
    showForecast: false,
    leadTimeMultiplier: 1.0,  // Normal 4-second lead time
    marketingEvents: [
      {
        triggerTime: LEVEL_3_MARKETING_EVENT_TIMES[0],  // 4 seconds
        duration: MARKETING_EVENT_DURATION,
        demandMultiplier: MARKETING_EVENT_DEMAND_MULTIPLIER,
        label: 'Marketing Campaign Begins!',
      },
      {
        triggerTime: LEVEL_3_MARKETING_EVENT_TIMES[1],  // 14 seconds
        duration: MARKETING_EVENT_DURATION,
        demandMultiplier: MARKETING_EVENT_DEMAND_MULTIPLIER,
        label: 'Marketing Campaign Begins!',
      },
    ],
    quiverEnabled: false,
    skus,
  };
}

/**
 * Create Level 3 with Quiver Engine enabled (demo mode)
 */
export function createLevel3QuiverDemo(product: ProductConfig): LevelConfig {
  const level3 = createLevel3(product);
  return {
    ...level3,
    id: 'level-3-quiver',
    name: 'Level 3 - Quiver Demo',
    description: 'Watch Quiver Engine manage 6 SKUs',
    quiverEnabled: true,
    quiverAutoPlay: true,
  };
}

// Legacy export for backwards compatibility during transition
export const LEVEL_1: LevelConfig = {
  id: 'level-1',
  name: 'Level 1',
  duration: GAME_DURATION,
  showForecast: true,
  leadTimeMultiplier: 1.0,
  marketingEvents: [],
  quiverEnabled: false,
  skus: [
    {
      id: 'sku-1',
      name: 'Product',
      demandSegments: [
        { startTime: 0, endTime: 12, baseRate: 5 },
        { startTime: 12, endTime: 24, baseRate: 12 },
        { startTime: 24, endTime: 36, baseRate: 6 },
      ],
      initialInventory: 80,
      orderQuantity: 50,
    },
  ],
};

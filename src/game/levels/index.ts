import { LevelConfig, ProductConfig, DemandSegment, SKUConfig } from '../types';
import {
  GAME_DURATION,
  LEVEL_2_LEAD_TIME_MULTIPLIER,
  MARKETING_EVENT_DURATION,
  MARKETING_EVENT_DEMAND_MULTIPLIER,
  LEVEL_2_MARKETING_EVENT_TIME,
  LEVEL_3_MARKETING_EVENT_TIMES,
} from '../constants';

/**
 * Seeded PRNG (mulberry32) for deterministic demand generation
 */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Band level type for demand generation
 */
type BandLevel = 'high' | 'medium' | 'low';

/**
 * Band multiplier ranges: center value range and per-second swing range
 */
const BAND_CONFIG: Record<BandLevel, { minCenter: number; maxCenter: number; swing: number }> = {
  high:   { minCenter: 3.5, maxCenter: 5.5, swing: 6.0 },
  medium: { minCenter: 1.8, maxCenter: 3.0, swing: 4.2 },
  low:    { minCenter: 0.4, maxCenter: 1.0, swing: 2.4 },
};

/**
 * Band sequences per pattern type (7 bands)
 */
const BAND_PATTERNS: Record<'stable' | 'increasing' | 'variable', BandLevel[]> = {
  stable:     ['medium', 'high', 'low', 'medium', 'high', 'low', 'medium'],
  variable:   ['low', 'high', 'low', 'high', 'low', 'high', 'low'],
  increasing: ['low', 'low', 'medium', 'medium', 'high', 'high', 'high'],
};

/**
 * Generate demand segments for a level
 * Creates 36 one-second segments using 5-second bands with dramatic per-second variation.
 * 7 bands of 5 seconds each (last band gets 6 seconds to fill 36s).
 * Each band is tagged high/medium/low with large per-second swings.
 * No smooth interpolation between bands — jumps are part of the challenge.
 * Uses seeded PRNG for reproducibility.
 */
function generateDemandSegments(
  baseRate: number,
  pattern: 'stable' | 'increasing' | 'variable',
  seed: number = 42
): DemandSegment[] {
  const rng = mulberry32(seed);
  const bands = BAND_PATTERNS[pattern];

  // 7 bands: first 6 are 5 seconds, last is 6 seconds (5*6 + 6 = 36)
  const bandDurations = [5, 5, 5, 5, 5, 5, 6];

  // Pick a fixed center for each band using the RNG
  const bandCenters = bands.map((level) => {
    const config = BAND_CONFIG[level];
    return config.minCenter + rng() * (config.maxCenter - config.minCenter);
  });

  const segments: DemandSegment[] = [];
  let t = 0;

  for (let b = 0; b < bands.length; b++) {
    const bandLevel = bands[b];
    const config = BAND_CONFIG[bandLevel];
    const center = bandCenters[b];
    const duration = bandDurations[b];

    for (let s = 0; s < duration; s++) {
      // Per-second swing: random offset around the band center
      const swing = (rng() * 2 - 1) * config.swing;
      const multiplier = Math.max(0.3, center + swing);

      segments.push({
        startTime: t,
        endTime: t + 1,
        baseRate: baseRate * multiplier,
      });
      t++;
    }
  }

  return segments;
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
    showForecast: true,
    leadTimeMultiplier: LEVEL_2_LEAD_TIME_MULTIPLIER,
    marketingEvents: [
      {
        triggerTime: LEVEL_2_MARKETING_EVENT_TIME,
        duration: MARKETING_EVENT_DURATION,
        demandMultiplier: MARKETING_EVENT_DEMAND_MULTIPLIER,
        label: 'Marketing Campaign',
        notifyTime: LEVEL_2_MARKETING_EVENT_TIME - 6,  // Visible when popup shows (4 weeks before)
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
 * - 4 SKUs (variants) in 2x2 grid
 * - NO forecast
 * - 2 marketing events: SKU 0 (top-left) at 7s, SKU 3 (bottom-right) at 20s
 * - Normal lead time
 */
export function createLevel3(product: ProductConfig): LevelConfig {
  const baseRate = product.demandScale;
  const variants = product.skuVariants;

  // Generate slightly different demand patterns for each SKU
  const demandPatterns: Array<'stable' | 'increasing' | 'variable'> = [
    'stable', 'variable', 'increasing', 'stable'
  ];

  // Generate SKU configs for 4 SKUs
  const skus: SKUConfig[] = variants.slice(0, 4).map((variant, index) => {
    // Vary the base rate slightly for each SKU (90% to 110%)
    const skuBaseRate = baseRate * (0.9 + (index * 0.05));

    return {
      id: `sku-${index + 1}`,
      name: `${product.name}`,
      variant: variant,
      demandSegments: generateDemandSegments(skuBaseRate, demandPatterns[index % demandPatterns.length], 42 + index * 17),
      initialInventory: product.baseInitialInventory,
      orderQuantity: product.baseOrderQuantity,
      // SKU 0 (top-left) gets event at 7s, SKU 3 (bottom-right) gets event at 20s
      marketingEventIndex: index === 0 ? 0 : index === 3 ? 1 : undefined,
    };
  });

  return {
    id: 'level-3',
    name: 'Level 3',
    description: 'Manage 4 SKUs simultaneously',
    duration: GAME_DURATION,
    showForecast: true,
    leadTimeMultiplier: 1.0,  // Normal 4-second lead time
    marketingEvents: [
      {
        triggerTime: LEVEL_3_MARKETING_EVENT_TIMES[0],  // 7 seconds
        duration: MARKETING_EVENT_DURATION,
        demandMultiplier: MARKETING_EVENT_DEMAND_MULTIPLIER,
        label: 'Marketing Campaign',
      },
      {
        triggerTime: LEVEL_3_MARKETING_EVENT_TIMES[1],  // 20 seconds
        duration: MARKETING_EVENT_DURATION,
        demandMultiplier: MARKETING_EVENT_DEMAND_MULTIPLIER,
        label: 'Marketing Campaign',
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
      initialInventory: 112,
      orderQuantity: 50,
    },
  ],
};

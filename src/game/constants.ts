// Inventory limits
export const MAX_INVENTORY = 150;

// Time scaling: 36 seconds = 3 months
export const GAME_DURATION = 36;           // Total game duration in seconds
export const SECONDS_PER_MONTH = 12;       // 12 seconds per month
export const MONTHS_COUNT = 3;             // 3 months total

// Lead time
export const BASE_LEAD_TIME = 4;           // ~1.5 weeks in game time
export const LEVEL_2_LEAD_TIME_MULTIPLIER = 1.5;  // 50% longer lead time

// Marketing event
export const MARKETING_EVENT_DURATION = 12;       // 12 seconds (longer duration)
export const MARKETING_EVENT_DEMAND_MULTIPLIER = 2.2;  // 120% increase
export const LEVEL_2_MARKETING_EVENT_TIME = 4;    // Triggers at 4 seconds
export const LEVEL_3_MARKETING_EVENT_TIMES = [4, 14];  // Two events at different times

// Graph dimensions
export const GRAPH_WIDTH = 700;
export const GRAPH_HEIGHT = 350;

// Multi-SKU graph dimensions (for Level 3)
export const MULTI_SKU_GRAPH_MIN_WIDTH = 300;
export const MULTI_SKU_GRAPH_MIN_HEIGHT = 150;
export const MULTI_SKU_GRAPH_MAX_WIDTH = 450;
export const MULTI_SKU_GRAPH_MAX_HEIGHT = 225;

// Scoring thresholds (based on total cost) - per product and level
export const GRADE_THRESHOLDS: Record<string, Record<string, { A: number; B: number; C: number; D: number }>> = {
  'protein-bar': {
    'level-1': { A: 800, B: 1000, C: 1200, D: 1500 },
    'level-2': { A: 1200, B: 1500, C: 1800, D: 2100 },
    'level-3': { A: 8000, B: 10000, C: 13000, D: 17000 },
    'level-3-quiver': { A: 8000, B: 10000, C: 13000, D: 17000 },
  },
  'medicine': {
    'level-1': { A: 1200, B: 1400, C: 1700, D: 2000 },
    'level-2': { A: 1600, B: 1900, C: 2200, D: 2600 },
    'level-3': { A: 10000, B: 13000, C: 17000, D: 22000 },
    'level-3-quiver': { A: 10000, B: 13000, C: 17000, D: 22000 },
  },
  'sofa': {
    'level-1': { A: 1500, B: 1700, C: 1900, D: 2200 },
    'level-2': { A: 2000, B: 2300, C: 2700, D: 3200 },
    'level-3': { A: 18000, B: 20000, C: 22000, D: 24000 },
    'level-3-quiver': { A: 18000, B: 20000, C: 22000, D: 24000 },
  },
};

export const BASE_SCORE = 1000;

// Colors
export const COLORS = {
  background: '#1a1a2e',
  grid: '#2a2a4e',
  inventoryLine: '#4ecdc4',
  projectionLine: '#ffd93d',
  stockoutLine: '#ff6b6b',
  zeroLine: '#ff6b6b33',
  timeMarker: '#ffffff',
  text: '#ffffff',
  textSecondary: '#888899',
  orderBar: '#3B82F6',
  orderPlaceholder: '#3B82F633',
  demandProjection: '#4ecdc499',
  monthDivider: '#ffffff44',
  marketingEventLine: '#ff4444',
  marketingEventBg: '#ff444433',
};

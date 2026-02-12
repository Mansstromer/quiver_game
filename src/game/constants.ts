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
export const LEVEL_2_MARKETING_EVENT_TIME = 14;   // Triggers at 14 seconds
export const LEVEL_3_MARKETING_EVENT_TIMES = [7, 20];  // Two events at different times

// Scoring thresholds (based on total cost) - per product and level
export const GRADE_THRESHOLDS: Record<string, Record<string, { A: number; B: number; C: number; D: number }>> = {
  'protein-bar': {
    'level-1': { A: 950, B: 1150, C: 1350, D: 1550 },
    'level-2': { A: 1100, B: 1300, C: 1500, D: 1700 },
    'level-3': { A: 8600, B: 9000, C: 10000, D: 11000 },
    'level-3-quiver': { A: 8600, B: 9000, C: 10000, D: 11000 },
  },
  'medicine': {
    'level-1': { A: 2100, B: 2300, C: 2500, D: 2700 },
    'level-2': { A: 2500, B: 2700, C: 2900, D: 3100 },
    'level-3': { A: 16000, B: 17200, C: 18400, D: 20600 },
    'level-3-quiver': { A: 16000, B: 17200, C: 18400, D: 20600 },
  },
  'sofa': {
    'level-1': { A: 1400, B: 1600, C: 1800, D: 2000 },
    'level-2': { A: 1500, B: 1700, C: 1900, D: 2100 },
    'level-3': { A: 11700, B: 12900, C: 13100, D: 13300 },
    'level-3-quiver': { A: 11700, B: 12900, C: 13100, D: 13300 },
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
  marketingEventLine: '#fbbf24',
  marketingEventBg: '#fbbf241a',
};

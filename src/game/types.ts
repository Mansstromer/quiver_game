export interface Point {
  time: number;
  inventory: number;
}

export interface PendingOrder {
  id: number;
  quantity: number;
  arrivalTime: number;
  placedAt: number;
}

// Product configuration for product selection screen
export interface ProductConfig {
  id: string;
  name: string;
  icon: string;  // Emoji or image
  cogsPerUnit: number;           // Cost of goods sold (€)
  revenuePerUnit: number;        // Selling price (€)
  annualHoldingRate: number;     // e.g., 0.16 for 16% annual
  orderingCost: number;          // Fixed cost per order placed (€)
  demandScale: number;           // Multiplier for demand curve
  baseOrderQuantity: number;     // Units per order
  baseInitialInventory: number;  // Starting inventory
  maxInventory: number;          // Maximum inventory for Y-axis scaling
  skuVariants: string[];         // Names of 6 SKU variants for Level 3
}

// Marketing event configuration
export interface MarketingEvent {
  triggerTime: number;      // When event starts (in game seconds)
  duration: number;         // How long it lasts (seconds)
  demandMultiplier: number; // e.g., 2.0 for 100% increase
  label: string;            // "Marketing Campaign"
  notifyTime?: number;      // When the zone becomes visible on the graph (defaults to triggerTime)
}

// Demand segment for more flexible demand curves
export interface DemandSegment {
  startTime: number;
  endTime: number;
  baseRate: number;
}

// Level and SKU configuration types
export interface SKUConfig {
  id: string;
  name: string;
  variant?: string;                   // e.g., "Chocolate Chip", "Grey 2-seater"
  demandSegments: DemandSegment[];    // Demand curve segments
  initialInventory: number;
  orderQuantity: number;
  leadTime?: number;                  // Lead time in seconds (uses BASE_LEAD_TIME if not set)
  marketingEventIndex?: number;       // Which marketing event affects this SKU (if any)
}

export interface LevelConfig {
  id: string;
  name: string;
  description?: string;              // Level description for UI
  duration: number;                  // Total game duration in seconds
  skus: SKUConfig[];                 // Array of SKUs (1 for level 1-2, 6 for level 3)
  showForecast: boolean;             // Whether to show demand projection line
  leadTimeMultiplier: number;        // 1.0 = normal, 1.5 = 50% longer
  marketingEvents: MarketingEvent[]; // Marketing events that can affect SKUs
  quiverEnabled: boolean;            // Whether Quiver AI is enabled for this level
  quiverAutoPlay?: boolean;          // Whether Quiver plays automatically (demo mode)
}

// Per-SKU runtime state
export interface SKUState {
  skuId: string;
  inventory: number;
  pendingOrders: PendingOrder[];
  inventoryHistory: Point[];
  totalHoldingCost: number;
  totalStockoutCost: number;
  totalOrderingCost: number;      // Track ordering costs
  orderCount: number;             // Number of orders placed
  lastOrderTime: number;
  orderId: number;
  isStockout: boolean;
  marketingEventActive: boolean;  // Whether marketing event is currently affecting this SKU
}

// Game status for screen flow
export type GameStatus =
  | 'start'           // Title screen with intro slides
  | 'product-select'  // Choose product
  | 'rules'           // Rules/formulas screen
  | 'level-1'         // Playing Level 1
  | 'level-1-end'     // Level 1 results
  | 'level-2-info'    // Pre-Level 2 info screen
  | 'level-2'         // Playing Level 2
  | 'level-2-end'     // Level 2 results
  | 'level-3-info'    // Pre-Level 3 info screen
  | 'level-3'         // Playing Level 3
  | 'level-3-end'     // Level 3 results
  | 'quiver-demo'     // Watching Quiver play Level 3
  | 'educational';    // Outro slides

export interface IntroSlide {
  id: string;
  title?: string;
  text: string;
  subtext?: string;
  image?: string;
  imagePosition?: 'left' | 'right' | 'center';
}

// Score results for a level
export interface LevelScore {
  levelId: string;
  totalHoldingCost: number;
  totalStockoutCost: number;
  totalOrderingCost: number;
  totalCost: number;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface GameState {
  status: GameStatus;
  currentLevel: 1 | 2 | 3;
  time: number;
  levelConfig: LevelConfig | null;
  skuStates: SKUState[];
  quiverEnabled: boolean;
  selectedProduct: ProductConfig | null;
  levelScores: LevelScore[];         // Scores for completed levels
  activeMarketingEvents: number[];   // Indices of currently active marketing events
}

export type GameAction =
  | { type: 'START_GAME'; level: LevelConfig }
  | { type: 'TICK'; deltaTime: number; level: LevelConfig; product: ProductConfig }
  | { type: 'PLACE_ORDER'; skuId: string; product: ProductConfig }
  | { type: 'ENABLE_QUIVER' }
  | { type: 'RESET_GAME' }
  | { type: 'GO_TO_START' }
  | { type: 'COMPLETE_INTRO' }
  | { type: 'SELECT_PRODUCT'; product: ProductConfig }
  | { type: 'START_RULES' }
  | { type: 'START_LEVEL'; levelNumber: 1 | 2 | 3; level: LevelConfig }
  | { type: 'END_LEVEL'; score: LevelScore }
  | { type: 'CONTINUE_TO_NEXT_LEVEL' }
  | { type: 'START_LEVEL_2_INFO' }
  | { type: 'START_QUIVER_DEMO'; level: LevelConfig }
  | { type: 'GO_TO_EDUCATIONAL' }
  | { type: 'TRIGGER_MARKETING_EVENT'; eventIndex: number }
  | { type: 'RETRY_LEVEL' };

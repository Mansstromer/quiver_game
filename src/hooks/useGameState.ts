import { useReducer, useCallback } from 'react';
import {
  GameState,
  GameAction,
  PendingOrder,
  LevelConfig,
  SKUState,
  SKUConfig,
  ProductConfig,
} from '../game/types';
import { getDemandRate } from '../game/demandEngine';
import { calculateTickCosts, calculateLevelScore } from '../game/scoring';

const initialState: GameState = {
  status: 'start',
  currentLevel: 1,
  time: 0,
  levelConfig: null,
  skuStates: [],
  quiverEnabled: false,
  selectedProduct: null,
  levelScores: [],
  activeMarketingEvents: [],
};

function createInitialSKUState(sku: SKUConfig): SKUState {
  return {
    skuId: sku.id,
    inventory: sku.initialInventory,
    pendingOrders: [],
    inventoryHistory: [{ time: 0, inventory: sku.initialInventory }],
    totalHoldingCost: 0,
    totalStockoutCost: 0,
    totalOrderingCost: 0,
    orderCount: 0,
    lastOrderTime: -10,
    orderId: 0,
    isStockout: false,
    marketingEventActive: false,
  };
}

function processSKUTick(
  skuState: SKUState,
  skuConfig: SKUConfig,
  level: LevelConfig,
  product: ProductConfig,
  newTime: number,
  deltaTime: number,
  gameDuration: number
): SKUState {
  // Process arriving orders
  let newInventory = skuState.inventory;
  const arrivedOrders: PendingOrder[] = [];
  const remainingOrders = skuState.pendingOrders.filter((order) => {
    if (order.arrivalTime <= newTime) {
      arrivedOrders.push(order);
      return false;
    }
    return true;
  });

  arrivedOrders.forEach((order) => {
    newInventory = Math.min(newInventory + order.quantity, product.maxInventory);
  });

  // Get base demand rate
  let demandRate = getDemandRate(skuConfig, newTime, gameDuration);

  // Check if a marketing event affects this SKU
  let marketingEventActive = false;
  if (skuConfig.marketingEventIndex !== undefined) {
    const event = level.marketingEvents[skuConfig.marketingEventIndex];
    if (event && newTime >= event.triggerTime && newTime < event.triggerTime + event.duration) {
      demandRate *= event.demandMultiplier;
      marketingEventActive = true;
    }
  }

  // Calculate costs for this tick using product-specific costs
  const tickResult = calculateTickCosts(newInventory, demandRate, deltaTime, product);

  // Update inventory history (sample every ~0.1s to avoid too many points)
  let newHistory = skuState.inventoryHistory;
  const lastPoint = newHistory[newHistory.length - 1];
  if (newTime - lastPoint.time >= 0.1) {
    newHistory = [
      ...newHistory,
      { time: newTime, inventory: tickResult.newInventory },
    ];
  }

  return {
    ...skuState,
    inventory: tickResult.newInventory,
    pendingOrders: remainingOrders,
    inventoryHistory: newHistory,
    totalHoldingCost: skuState.totalHoldingCost + tickResult.holdingCost,
    totalStockoutCost: skuState.totalStockoutCost + tickResult.stockoutCost,
    isStockout: tickResult.newInventory === 0 && demandRate > 0,
    marketingEventActive,
  };
}

function getPlayingStatus(levelNumber: 1 | 2 | 3): 'level-1' | 'level-2' | 'level-3' {
  switch (levelNumber) {
    case 1: return 'level-1';
    case 2: return 'level-2';
    case 3: return 'level-3';
  }
}

function getEndStatus(levelNumber: 1 | 2 | 3): 'level-1-end' | 'level-2-end' | 'level-3-end' {
  switch (levelNumber) {
    case 1: return 'level-1-end';
    case 2: return 'level-2-end';
    case 3: return 'level-3-end';
  }
}

function isPlayingStatus(status: string): boolean {
  return status === 'level-1' || status === 'level-2' || status === 'level-3' || status === 'quiver-demo';
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'GO_TO_START':
      return {
        ...initialState,
      };

    case 'COMPLETE_INTRO':
      return {
        ...state,
        status: 'product-select',
      };

    case 'SELECT_PRODUCT':
      return {
        ...state,
        selectedProduct: action.product,
        status: 'rules',
      };

    case 'START_RULES':
      return {
        ...state,
        status: 'rules',
      };

    case 'START_LEVEL': {
      const level = action.level;
      const levelNumber = action.levelNumber;
      return {
        ...state,
        status: getPlayingStatus(levelNumber),
        currentLevel: levelNumber,
        time: 0,
        levelConfig: level,
        skuStates: level.skus.map(createInitialSKUState),
        activeMarketingEvents: [],
      };
    }

    case 'START_GAME': {
      // Legacy support - starts Level 1
      const level = action.level;
      return {
        ...state,
        status: 'level-1',
        currentLevel: 1,
        time: 0,
        levelConfig: level,
        skuStates: level.skus.map(createInitialSKUState),
        quiverEnabled: state.quiverEnabled,
        activeMarketingEvents: [],
      };
    }

    case 'TICK': {
      if (!isPlayingStatus(state.status) || !state.levelConfig || !action.product) return state;

      const level = action.level;
      const product = action.product;
      const newTime = state.time + action.deltaTime;

      // Check for game end
      if (newTime >= level.duration) {
        const finalSkuStates = state.skuStates;
        const score = calculateLevelScore(level.id, finalSkuStates, product.id);

        // Add score to levelScores
        const newLevelScores = [...state.levelScores, score];

        return {
          ...state,
          time: level.duration,
          status: state.status === 'quiver-demo' ? 'educational' : getEndStatus(state.currentLevel),
          levelScores: newLevelScores,
        };
      }

      // Process tick for each SKU
      const newSkuStates = state.skuStates.map((skuState, index) => {
        const skuConfig = level.skus[index];
        return processSKUTick(
          skuState,
          skuConfig,
          level,
          product,
          newTime,
          action.deltaTime,
          level.duration
        );
      });

      return {
        ...state,
        time: newTime,
        skuStates: newSkuStates,
      };
    }

    case 'PLACE_ORDER': {
      if (!isPlayingStatus(state.status) || !state.levelConfig || !action.product) return state;

      const skuIndex = state.skuStates.findIndex((s) => s.skuId === action.skuId);
      if (skuIndex === -1) return state;

      const skuState = state.skuStates[skuIndex];
      const skuConfig = state.levelConfig.skus[skuIndex];

      // Calculate effective lead time with multiplier
      const effectiveLeadTime = (skuConfig.leadTime ?? 4) * state.levelConfig.leadTimeMultiplier;

      // Allow ordering up to 50% above maxInventory to give players flexibility
      // The graph won't show above max, but orders are still allowed
      const totalPendingQuantity = skuState.pendingOrders.reduce(
        (sum, order) => sum + order.quantity,
        0
      );
      const projectedMax = skuState.inventory + totalPendingQuantity + skuConfig.orderQuantity;
      const orderLimit = action.product.maxInventory * 1.5;
      if (projectedMax > orderLimit) return state;

      const newOrder: PendingOrder = {
        id: skuState.orderId + 1,
        quantity: skuConfig.orderQuantity,
        arrivalTime: state.time + effectiveLeadTime,
        placedAt: state.time,
      };

      const newSkuState: SKUState = {
        ...skuState,
        pendingOrders: [...skuState.pendingOrders, newOrder],
        lastOrderTime: state.time,
        orderId: skuState.orderId + 1,
        orderCount: skuState.orderCount + 1,
        totalOrderingCost: skuState.totalOrderingCost + action.product.orderingCost,
      };

      const newSkuStates = [...state.skuStates];
      newSkuStates[skuIndex] = newSkuState;

      return {
        ...state,
        skuStates: newSkuStates,
      };
    }

    case 'END_LEVEL': {
      const newLevelScores = [...state.levelScores, action.score];
      return {
        ...state,
        status: getEndStatus(state.currentLevel),
        levelScores: newLevelScores,
      };
    }

    case 'CONTINUE_TO_NEXT_LEVEL': {
      if (state.currentLevel === 1) {
        return {
          ...state,
          status: 'level-2-info',
        };
      } else if (state.currentLevel === 2) {
        // Will need to start level 3
        return {
          ...state,
          status: 'level-3',
          currentLevel: 3,
        };
      }
      return state;
    }

    case 'START_LEVEL_2_INFO':
      return {
        ...state,
        status: 'level-2-info',
      };

    case 'START_QUIVER_DEMO': {
      const level = action.level;
      return {
        ...state,
        status: 'quiver-demo',
        time: 0,
        levelConfig: level,
        skuStates: level.skus.map(createInitialSKUState),
        quiverEnabled: true,
        activeMarketingEvents: [],
      };
    }

    case 'GO_TO_EDUCATIONAL':
      return {
        ...state,
        status: 'educational',
      };

    case 'GO_TO_CTA':
      return {
        ...state,
        status: 'cta',
      };

    case 'ENABLE_QUIVER':
      return {
        ...state,
        quiverEnabled: true,
      };

    case 'RESET_GAME':
      return {
        ...initialState,
        status: 'product-select',
        selectedProduct: state.selectedProduct,
      };

    case 'TRIGGER_MARKETING_EVENT': {
      const newActiveEvents = [...state.activeMarketingEvents, action.eventIndex];
      return {
        ...state,
        activeMarketingEvents: newActiveEvents,
      };
    }

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const goToStart = useCallback(() => dispatch({ type: 'GO_TO_START' }), []);
  const completeIntro = useCallback(() => dispatch({ type: 'COMPLETE_INTRO' }), []);
  const selectProduct = useCallback(
    (product: ProductConfig) => dispatch({ type: 'SELECT_PRODUCT', product }),
    []
  );
  const startRules = useCallback(() => dispatch({ type: 'START_RULES' }), []);
  const startLevel = useCallback(
    (levelNumber: 1 | 2 | 3, level: LevelConfig) =>
      dispatch({ type: 'START_LEVEL', levelNumber, level }),
    []
  );
  const startGame = useCallback(
    (level: LevelConfig) => dispatch({ type: 'START_GAME', level }),
    []
  );
  const placeOrder = useCallback(
    (skuId: string, product: ProductConfig) =>
      dispatch({ type: 'PLACE_ORDER', skuId, product }),
    []
  );
  const enableQuiver = useCallback(() => dispatch({ type: 'ENABLE_QUIVER' }), []);
  const tick = useCallback(
    (deltaTime: number, level: LevelConfig, product: ProductConfig) =>
      dispatch({ type: 'TICK', deltaTime, level, product }),
    []
  );
  const continueToNextLevel = useCallback(
    () => dispatch({ type: 'CONTINUE_TO_NEXT_LEVEL' }),
    []
  );
  const startLevel2Info = useCallback(
    () => dispatch({ type: 'START_LEVEL_2_INFO' }),
    []
  );
  const startQuiverDemo = useCallback(
    (level: LevelConfig) => dispatch({ type: 'START_QUIVER_DEMO', level }),
    []
  );
  const goToEducational = useCallback(
    () => dispatch({ type: 'GO_TO_EDUCATIONAL' }),
    []
  );
  const goToCTA = useCallback(() => dispatch({ type: 'GO_TO_CTA' }), []);
  const resetGame = useCallback(() => dispatch({ type: 'RESET_GAME' }), []);

  return {
    state,
    dispatch,
    goToStart,
    completeIntro,
    selectProduct,
    startRules,
    startLevel,
    startGame,
    placeOrder,
    enableQuiver,
    tick,
    continueToNextLevel,
    startLevel2Info,
    startQuiverDemo,
    goToEducational,
    goToCTA,
    resetGame,
  };
}

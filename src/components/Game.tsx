import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useGameLoop } from '../hooks/useGameLoop';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { InventoryGraph } from './InventoryGraph';
import { GameControls } from './GameControls';
import { ScoreDisplay } from './ScoreDisplay';
import { StartScreen } from './StartScreen';
import { ProductSelect } from './ProductSelect';
import { RulesScreen } from './RulesScreen';
import { Level2InfoScreen } from './Level2InfoScreen';
import { MultiSKUGame } from './MultiSKUGame';
import { EndScreen } from './EndScreen';
import { EducationalScreen } from './EducationalScreen';
import { CTAScreen } from './CTAScreen';
import { OfficeDesk } from './OfficeDesk';
import { GRAPH_WIDTH, GRAPH_HEIGHT } from '../game/constants';
import { createLevel1, createLevel2, createLevel3, createLevel3QuiverDemo } from '../game/levels';
import { ProductConfig } from '../game/types';

export function Game() {
  const {
    state,
    completeIntro,
    selectProduct,
    startLevel,
    placeOrder,
    enableQuiver,
    tick,
    continueToNextLevel,
    startQuiverDemo,
    goToCTA,
    goToStart,
  } = useGameState();
  const { playSound, initialize } = useSoundEffects();
  const prevStockoutRef = useRef(false);
  const prevOrderCountRef = useRef(0);

  // Create level configs based on selected product
  const level1 = useMemo(
    () => state.selectedProduct ? createLevel1(state.selectedProduct) : null,
    [state.selectedProduct]
  );
  const level2 = useMemo(
    () => state.selectedProduct ? createLevel2(state.selectedProduct) : null,
    [state.selectedProduct]
  );
  const level3 = useMemo(
    () => state.selectedProduct ? createLevel3(state.selectedProduct) : null,
    [state.selectedProduct]
  );
  const level3Quiver = useMemo(
    () => state.selectedProduct ? createLevel3QuiverDemo(state.selectedProduct) : null,
    [state.selectedProduct]
  );

  // Determine current level config based on status
  const currentLevel = useMemo(() => {
    switch (state.status) {
      case 'level-1':
      case 'level-1-end':
        return level1;
      case 'level-2':
      case 'level-2-end':
        return level2;
      case 'level-3':
      case 'level-3-end':
        return level3;
      case 'quiver-demo':
        return level3Quiver;
      default:
        return level1;
    }
  }, [state.status, level1, level2, level3, level3Quiver]);

  // Get the first SKU state for single-SKU display (Level 1 & 2)
  const firstSkuState = state.skuStates[0];
  const firstSkuConfig = currentLevel?.skus[0];

  // Check if any marketing event is currently active (for single-SKU games)
  const activeMarketingEvent = useMemo(() => {
    if (!currentLevel) return null;
    return currentLevel.marketingEvents.find((event) => {
      const isActive = state.time >= event.triggerTime &&
                       state.time < event.triggerTime + event.duration;
      return isActive;
    });
  }, [currentLevel, state.time]);

  // Set up game loop
  useGameLoop({
    state,
    tick: (deltaTime) => {
      if (currentLevel && state.selectedProduct) {
        tick(deltaTime, currentLevel, state.selectedProduct);
      }
    },
    placeOrder: (skuId) => {
      if (state.selectedProduct) {
        placeOrder(skuId, state.selectedProduct);
      }
    },
    level: currentLevel,
  });

  // Sound effects triggers
  useEffect(() => {
    if (!firstSkuState) return;

    // Stockout alarm
    if (firstSkuState.isStockout && !prevStockoutRef.current) {
      playSound('stockoutAlarm');
    }
    prevStockoutRef.current = firstSkuState.isStockout;

    // Order arrived sound
    if (firstSkuState.pendingOrders.length < prevOrderCountRef.current) {
      playSound('orderArrived');
    }
    prevOrderCountRef.current = firstSkuState.pendingOrders.length;
  }, [firstSkuState?.isStockout, firstSkuState?.pendingOrders.length, playSound]);

  const handleIntroComplete = () => {
    initialize();
    completeIntro();
  };

  const handleProductSelect = (product: ProductConfig) => {
    playSound('click');
    selectProduct(product);
  };

  const handleStartLevel1 = () => {
    if (!level1) return;
    playSound('click');
    startLevel(1, level1);
  };

  const handleStartLevel2 = () => {
    if (!level2) return;
    playSound('click');
    startLevel(2, level2);
  };

  const handleStartLevel3 = () => {
    if (!level3) return;
    playSound('click');
    startLevel(3, level3);
  };

  const handlePlaceOrder = useCallback(() => {
    if (!firstSkuConfig || !state.selectedProduct) return;
    playSound('orderPlaced');
    placeOrder(firstSkuConfig.id, state.selectedProduct);
  }, [firstSkuConfig, state.selectedProduct, playSound, placeOrder]);

  const handlePlaceOrderForSku = (skuId: string) => {
    if (!state.selectedProduct) return;
    playSound('orderPlaced');
    placeOrder(skuId, state.selectedProduct);
  };

  const handleContinueToNextLevel = () => {
    playSound('click');
    continueToNextLevel();
  };

  const handleStartQuiverDemo = () => {
    if (!level3Quiver) return;
    playSound('click');
    startQuiverDemo(level3Quiver);
  };

  const handleGoToCTA = () => {
    playSound('click');
    goToCTA();
  };

  const handlePlayAgain = () => {
    playSound('click');
    goToStart();
  };

  const handlePlayClick = () => {
    playSound('click');
  };

  // Determine if we're in a playing state for single-SKU games
  const isSingleSkuPlaying = state.status === 'level-1' || state.status === 'level-2';
  const isMultiSkuPlaying = state.status === 'level-3' || state.status === 'quiver-demo';

  // Keyboard shortcut: Spacebar to place order (single-SKU only)
  useEffect(() => {
    if (!isSingleSkuPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        handlePlaceOrder();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSingleSkuPlaying, handlePlaceOrder]);

  // Get player score for Level 3 (to compare with Quiver)
  const level3PlayerScore = state.levelScores.find(s => s.levelId === 'level-3');
  const quiverScore = state.levelScores.find(s => s.levelId === 'level-3-quiver');

  return (
    <div className="game-container">
      <header className="game-header">
        <h1 className="game-title-main">Demand Planner Simulator 2026</h1>
      </header>

      {/* Single SKU Game View (Level 1 & 2) */}
      {isSingleSkuPlaying && currentLevel && (
        <OfficeDesk>
          <div className="screen-content">
            {/* Marketing event notification */}
            {activeMarketingEvent && (
              <div className="marketing-event-notification">
                <span className="notification-icon">📢</span>
                <span className="notification-text">{activeMarketingEvent.label}</span>
              </div>
            )}
            <ScoreDisplay state={state} level={currentLevel} />
            <InventoryGraph
              state={state}
              skuState={firstSkuState}
              skuConfig={firstSkuConfig}
              level={currentLevel}
              width={GRAPH_WIDTH}
              height={GRAPH_HEIGHT}
              maxInventory={state.selectedProduct?.maxInventory ?? 150}
            />
            <GameControls
              state={state}
              skuState={firstSkuState}
              skuConfig={firstSkuConfig}
              levelQuiverEnabled={currentLevel.quiverEnabled}
              onPlaceOrder={handlePlaceOrder}
              onEnableQuiver={enableQuiver}
              onPlayClick={handlePlayClick}
            />
          </div>
        </OfficeDesk>
      )}

      {/* Multi-SKU Game View (Level 3 & Quiver Demo) */}
      {isMultiSkuPlaying && currentLevel && state.selectedProduct && (
        <MultiSKUGame
          state={state}
          level={currentLevel}
          product={state.selectedProduct}
          onPlaceOrder={handlePlaceOrderForSku}
          quiverAutoPlay={state.status === 'quiver-demo'}
        />
      )}

      {/* Overlays */}
      {state.status === 'start' && (
        <StartScreen onComplete={handleIntroComplete} />
      )}

      {state.status === 'product-select' && (
        <ProductSelect onSelect={handleProductSelect} />
      )}

      {state.status === 'rules' && state.selectedProduct && (
        <RulesScreen
          product={state.selectedProduct}
          onStart={handleStartLevel1}
        />
      )}

      {state.status === 'level-1-end' && (
        <EndScreen
          state={state}
          levelNumber={1}
          productId={state.selectedProduct?.id}
          onContinue={handleContinueToNextLevel}
          continueText="Continue to Level 2"
        />
      )}

      {state.status === 'level-2-info' && (
        <Level2InfoScreen onStart={handleStartLevel2} />
      )}

      {state.status === 'level-2-end' && (
        <EndScreen
          state={state}
          levelNumber={2}
          productId={state.selectedProduct?.id}
          onContinue={handleStartLevel3}
          continueText="Continue to Level 3"
        />
      )}

      {state.status === 'level-3-end' && (
        <EndScreen
          state={state}
          levelNumber={3}
          productId={state.selectedProduct?.id}
          onContinue={handleStartQuiverDemo}
          continueText="Try Level 3 with Quiver Engine"
          showQuiverButton
        />
      )}

      {state.status === 'educational' && (
        <EducationalScreen
          playerScore={level3PlayerScore}
          quiverScore={quiverScore}
          onContinue={handleGoToCTA}
        />
      )}

      {state.status === 'cta' && (
        <CTAScreen onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
}

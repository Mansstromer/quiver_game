import { useEffect, useRef, useState } from 'react';
import { GameState, LevelConfig, ProductConfig } from '../game/types';
import { InventoryGraph } from './InventoryGraph';
import { formatCost } from '../game/scoring';

interface MultiSKUGameProps {
  state: GameState;
  level: LevelConfig;
  product: ProductConfig;
  onPlaceOrder: (skuId: string) => void;
  quiverAutoPlay?: boolean;
}

export function MultiSKUGame({
  state,
  level,
  product,
  onPlaceOrder,
  quiverAutoPlay = false,
}: MultiSKUGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphSize, setGraphSize] = useState({ width: 350, height: 175 });

  // Calculate graph size based on container width - smaller to fit all 6 visible
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // 3 columns with gaps (16px gaps)
        const availableWidth = containerWidth - 32; // 2 gaps
        const graphWidth = Math.min(320, Math.max(240, Math.floor(availableWidth / 3)));
        const graphHeight = Math.floor(graphWidth * 0.45);
        setGraphSize({ width: graphWidth, height: graphHeight });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Get total costs across all SKUs
  const totalHoldingCost = state.skuStates.reduce((sum, sku) => sum + sku.totalHoldingCost, 0);
  const totalStockoutCost = state.skuStates.reduce((sum, sku) => sum + sku.totalStockoutCost, 0);
  const totalOrderingCost = state.skuStates.reduce((sum, sku) => sum + sku.totalOrderingCost, 0);
  const totalCost = totalHoldingCost + totalStockoutCost + totalOrderingCost;

  // Check if any marketing event is currently active
  const activeMarketingEvent = level.marketingEvents.find((event) => {
    const isActive = state.time >= event.triggerTime &&
                     state.time < event.triggerTime + event.duration;
    return isActive;
  });

  return (
    <div className="multi-sku-container" ref={containerRef}>
      {/* Marketing event notification */}
      {activeMarketingEvent && (
        <div className="marketing-event-notification">
          <span className="notification-icon">📢</span>
          <span className="notification-text">{activeMarketingEvent.label}</span>
        </div>
      )}

      {/* Header with total costs */}
      <div className="multi-sku-header">
        <div className="multi-sku-title">
          <span className="product-icon">{product.icon}</span>
          <span>{product.name} - 6 SKU Management</span>
          {quiverAutoPlay && (
            <span className="quiver-badge">Quiver Engine Active</span>
          )}
        </div>
        <div className="multi-sku-totals">
          <div className="total-item">
            <span className="total-label">Holding</span>
            <span className="total-value">{formatCost(totalHoldingCost)}</span>
          </div>
          <div className="total-item stockout">
            <span className="total-label">Stockout</span>
            <span className="total-value">{formatCost(totalStockoutCost)}</span>
          </div>
          <div className="total-item">
            <span className="total-label">Orders</span>
            <span className="total-value">{formatCost(totalOrderingCost)}</span>
          </div>
          <div className="total-divider" />
          <div className="total-item total">
            <span className="total-label">Total</span>
            <span className="total-value">{formatCost(totalCost)}</span>
          </div>
        </div>
      </div>

      {/* SKU Grid */}
      <div className="multi-sku-grid">
        {level.skus.map((skuConfig, index) => {
          const skuState = state.skuStates.find(s => s.skuId === skuConfig.id);
          const isStockout = skuState?.isStockout || false;

          // Check if this SKU's marketing event is currently active
          const marketingEvent = skuConfig.marketingEventIndex !== undefined
            ? level.marketingEvents[skuConfig.marketingEventIndex]
            : null;
          const isEventActive = marketingEvent &&
            state.time >= marketingEvent.triggerTime &&
            state.time < marketingEvent.triggerTime + marketingEvent.duration;

          return (
            <div
              key={skuConfig.id}
              className={`sku-card ${isStockout ? 'stockout' : ''} ${isEventActive ? 'has-event' : ''}`}
            >
              <div className="sku-header">
                <span className="sku-name">{skuConfig.variant || `SKU ${index + 1}`}</span>
                <span className="sku-inventory">
                  {skuState ? Math.floor(skuState.inventory) : 0} units
                </span>
              </div>

              <InventoryGraph
                state={state}
                skuState={skuState}
                skuConfig={skuConfig}
                level={level}
                width={graphSize.width}
                height={graphSize.height}
                maxInventory={product.maxInventory}
                compact={true}
              />

              <div className="sku-controls">
                <button
                  className={`sku-order-button ${quiverAutoPlay ? 'disabled' : ''}`}
                  onClick={() => !quiverAutoPlay && onPlaceOrder(skuConfig.id)}
                  disabled={quiverAutoPlay}
                >
                  Order +{skuConfig.orderQuantity}
                </button>
                {skuState && skuState.pendingOrders.length > 0 && (
                  <span className="sku-pending">
                    {skuState.pendingOrders.length} pending
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time display */}
      <div className="multi-sku-time">
        <span className="time-label">Time:</span>
        <span className="time-value">{state.time.toFixed(1)}s</span>
        <span className="time-separator">/</span>
        <span className="time-total">{level.duration}s</span>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { GameState, LevelConfig, ProductConfig, SKUConfig, SKUState } from '../game/types';
import { InventoryGraph } from './InventoryGraph';
import { formatCost } from '../game/scoring';
import { getQuiverMetricsForSKU, QuiverMetrics } from '../game/quiverAI';

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
  const [graphSize, setGraphSize] = useState({ width: 450, height: 200 });

  // Calculate graph size based on container width for 3 SKU layout
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // Bottom row: 2 graphs side by side
        const bottomGraphWidth = Math.min(Math.floor(window.innerWidth * 0.32), Math.floor((containerWidth - 60) / 2));
        const graphHeight = Math.floor(bottomGraphWidth * 0.42);
        setGraphSize({ width: bottomGraphWidth, height: graphHeight });
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

  // Get SKU configs and states
  const skuCount = level.skus.length;

  return (
    <div className="multi-sku-container multi-sku-4" ref={containerRef}>
      {/* Header with total costs */}
      <div className="multi-sku-header">
        <div className="multi-sku-title">
          <span className="product-icon">{product.icon}</span>
          <span>{product.name} - {skuCount} SKU Management</span>
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

      {/* 2x2 grid of 4 SKUs */}
      <div className="multi-sku-grid">
        {level.skus.slice(0, 4).map((skuConfig, index) => {
          const skuState = state.skuStates.find(s => s.skuId === skuConfig.id);
          if (!skuState) return null;
          return renderSkuCard(skuConfig, skuState, index, level, state, product, onPlaceOrder, quiverAutoPlay, graphSize);
        })}
      </div>

      {/* Time display in weeks */}
      <div className="multi-sku-time">
        <span className="time-label">Time:</span>
        <span className="time-value">{(state.time / 3).toFixed(1)}</span>
        <span className="time-separator">/</span>
        <span className="time-total">12 weeks</span>
      </div>
    </div>
  );
}

function renderSkuCard(
  skuConfig: SKUConfig,
  skuState: SKUState,
  index: number,
  level: LevelConfig,
  state: GameState,
  product: ProductConfig,
  onPlaceOrder: (skuId: string) => void,
  quiverAutoPlay: boolean,
  graphSize: { width: number; height: number }
) {
  const isStockout = skuState?.isStockout || false;

  // Check if this SKU's marketing event is currently active
  const marketingEvent = skuConfig.marketingEventIndex !== undefined
    ? level.marketingEvents[skuConfig.marketingEventIndex]
    : null;
  const isEventActive = marketingEvent &&
    state.time >= marketingEvent.triggerTime &&
    state.time < marketingEvent.triggerTime + marketingEvent.duration;

  // Compute Quiver metrics for display in demo mode
  const metrics: QuiverMetrics | null = quiverAutoPlay
    ? getQuiverMetricsForSKU(state, skuState, skuConfig, level)
    : null;

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

      <div
        style={!quiverAutoPlay ? { cursor: 'pointer' } : undefined}
        onClick={!quiverAutoPlay ? () => skuState.pendingOrders.length < 5 && onPlaceOrder(skuConfig.id) : undefined}
      >
        <InventoryGraph
          state={state}
          skuState={skuState}
          skuConfig={skuConfig}
          level={level}
          width={graphSize.width}
          height={graphSize.height}
          maxInventory={product.maxInventory * 0.6}
          compact={true}
          reorderPoint={quiverAutoPlay && metrics ? metrics.reorderPoint : undefined}
        />
      </div>

      {quiverAutoPlay && metrics ? (
        <div className={`quiver-metrics-panel ${metrics.shouldOrder ? 'quiver-metrics-ordering' : ''}`}>
          <div className="quiver-metrics-decision">
            <span className="quiver-metrics-values">
              <span title="Inventory Position (on-hand + on-order)" className={`quiver-metrics-ip ${metrics.shouldOrder ? 'ordering' : ''}`}>
                IP {Math.floor(metrics.inventoryPosition)}
              </span>
              <span className="quiver-metrics-compare">
                {metrics.inventoryPosition <= metrics.reorderPoint ? '≤' : '>'}
              </span>
              <span title="Reorder Point">ROP {Math.floor(metrics.reorderPoint)}</span>
            </span>
            {metrics.shouldOrder && (
              <span className="quiver-metrics-order-signal">ORDER</span>
            )}
          </div>
          <div className="quiver-metrics-breakdown">
            <span title="Safety Stock">SS {Math.floor(metrics.safetyStock)}</span>
            <span className="quiver-metrics-op">+</span>
            <span title="Lead Time Demand">LTD {Math.floor(metrics.leadTimeDemand)}</span>
            <span className="quiver-metrics-op">× ¼ =</span>
            <span title="Reorder Point">ROP {Math.floor(metrics.reorderPoint)}</span>
          </div>
        </div>
      ) : (
        <div className="sku-controls">
          <button
            className={`sku-order-button ${skuState.pendingOrders.length >= 5 ? 'disabled' : ''}`}
            onClick={() => skuState.pendingOrders.length < 5 && onPlaceOrder(skuConfig.id)}
          >
            Order +{skuConfig.orderQuantity}
          </button>
          {skuState && skuState.pendingOrders.length > 0 && (
            <span className="sku-pending">
              {skuState.pendingOrders.length} pending
            </span>
          )}
        </div>
      )}
    </div>
  );
}

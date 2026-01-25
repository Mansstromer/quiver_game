import { GameState, LevelConfig } from '../game/types';
import { formatCost } from '../game/scoring';

interface ScoreDisplayProps {
  state: GameState;
  level: LevelConfig;
}

// Convert game time to month (3 months over game duration)
function getMonth(time: number, duration: number): number {
  const monthDuration = duration / 3;
  return Math.min(3, Math.floor(time / monthDuration) + 1);
}

export function ScoreDisplay({ state, level }: ScoreDisplayProps) {
  // Sum costs from all SKU states
  const totalHoldingCost = state.skuStates.reduce((sum, sku) => sum + sku.totalHoldingCost, 0);
  const totalStockoutCost = state.skuStates.reduce((sum, sku) => sum + sku.totalStockoutCost, 0);
  const totalOrderingCost = state.skuStates.reduce((sum, sku) => sum + sku.totalOrderingCost, 0);
  const totalCost = totalHoldingCost + totalStockoutCost + totalOrderingCost;

  // Get inventory from first SKU (for single-SKU levels)
  const firstSku = state.skuStates[0];
  const inventory = firstSku?.inventory ?? 0;
  const isStockout = firstSku?.isStockout ?? false;

  const currentMonth = getMonth(state.time, level.duration);

  return (
    <div className="score-display">
      <div className="score-item time">
        <span className="score-label">Time</span>
        <span className="score-value">Month {currentMonth}</span>
      </div>

      <div className="score-item inventory">
        <span className="score-label">Inventory</span>
        <span className={`score-value ${isStockout ? 'stockout' : ''}`}>
          {Math.round(inventory)}
        </span>
      </div>

      <div className="score-divider" />

      <div className="score-item holding">
        <span className="score-label">Holding</span>
        <span className="score-value">{formatCost(totalHoldingCost)}</span>
      </div>

      <div className="score-item stockout">
        <span className="score-label">Stockout</span>
        <span className={`score-value ${totalStockoutCost > 0 ? 'penalty' : ''}`}>
          {formatCost(totalStockoutCost)}
        </span>
      </div>

      {totalOrderingCost > 0 && (
        <div className="score-item orders">
          <span className="score-label">Orders</span>
          <span className="score-value">{formatCost(totalOrderingCost)}</span>
        </div>
      )}

      <div className="score-divider" />

      <div className="score-item total">
        <span className="score-label">Total</span>
        <span className="score-value total-value">{formatCost(totalCost)}</span>
      </div>
    </div>
  );
}

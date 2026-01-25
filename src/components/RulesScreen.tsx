import { ProductConfig } from '../game/types';
import { getMargin } from '../game/products';
import { GAME_DURATION, BASE_LEAD_TIME } from '../game/constants';

interface RulesScreenProps {
  product: ProductConfig;
  onStart: () => void;
}

export function RulesScreen({ product, onStart }: RulesScreenProps) {
  const margin = getMargin(product);

  // Calculate monthly holding cost: (product cost × annual rate) / 12 months
  const monthlyHoldingCost = (product.cogsPerUnit * product.annualHoldingRate) / 12;
  const holdingCostDisplay = monthlyHoldingCost.toFixed(2);

  return (
    <div className="overlay rules-screen">
      <div className="rules-content">
        <h1>Game Rules</h1>
        <p className="rules-subtitle">
          Managing <span className="highlight">{product.name}</span> inventory for 3 months
        </p>

        <div className="rules-section">
          <h2>Your Costs</h2>
          <div className="cost-cards">
            <div className="cost-card">
              <div className="cost-icon">📦</div>
              <div className="cost-name">Holding Cost</div>
              <div className="cost-formula">
                <span className="cost-value">{product.annualHoldingRate * 100}%</span> of product value per year
              </div>
              <div className="cost-detail">
                ~€{holdingCostDisplay}/unit/month
              </div>
            </div>

            <div className="cost-card stockout-card">
              <div className="cost-icon">⚠️</div>
              <div className="cost-name">Stockout Cost</div>
              <div className="cost-formula">
                Lost margin per unit
              </div>
              <div className="cost-detail">
                €{margin.toFixed(2)}/unit
              </div>
            </div>

            <div className="cost-card">
              <div className="cost-icon">🚚</div>
              <div className="cost-name">Order Cost</div>
              <div className="cost-formula">
                Fixed cost per order
              </div>
              <div className="cost-detail">
                €{product.orderingCost}/order
              </div>
            </div>
          </div>
        </div>

        <div className="rules-section">
          <h2>Game Parameters</h2>
          <div className="params-grid">
            <div className="param-item">
              <span className="param-label">Duration</span>
              <span className="param-value">{GAME_DURATION}s (3 months)</span>
            </div>
            <div className="param-item">
              <span className="param-label">Lead Time</span>
              <span className="param-value">{BASE_LEAD_TIME}s (~1.5 weeks)</span>
            </div>
            <div className="param-item">
              <span className="param-label">Order Quantity</span>
              <span className="param-value">{product.baseOrderQuantity} units</span>
            </div>
            <div className="param-item">
              <span className="param-label">Starting Inventory</span>
              <span className="param-value">{product.baseInitialInventory} units</span>
            </div>
          </div>
        </div>

        <div className="rules-goal">
          <div className="goal-icon">🎯</div>
          <div className="goal-text">
            <strong>Goal:</strong> Minimize total costs while avoiding stockouts
          </div>
        </div>

        <div className="rules-tip">
          <span className="tip-key">SPACE</span> Press spacebar to quickly place orders
        </div>

        <button className="start-button" onClick={onStart}>
          Start Level 1
        </button>
      </div>
    </div>
  );
}

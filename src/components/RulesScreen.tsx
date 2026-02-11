import { ProductConfig } from '../game/types';
import { getMargin } from '../game/products';

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
          <div className="cost-cards-with-operators">
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

            <div className="cost-operator">+</div>

            <div className="cost-card">
              <div className="cost-icon">⚠️</div>
              <div className="cost-name">Stockout Cost</div>
              <div className="cost-formula">
                Lost margin per unit
              </div>
              <div className="cost-detail">
                €{margin.toFixed(2)}/unit
              </div>
            </div>

            <div className="cost-operator">+</div>

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

        <div className="cost-total-section">
          <div className="cost-equals">=</div>
          <div className="cost-card cost-total-card">
            <div className="cost-name">Total Cost</div>
            <div className="cost-total-goal">GOAL: Minimize this!</div>
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

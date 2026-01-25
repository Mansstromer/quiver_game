import { ProductConfig } from '../game/types';
import { getMargin } from '../game/products';

interface TutorialOverlayProps {
  onStart: () => void;
  product: ProductConfig | null;
}

export function TutorialOverlay({ onStart, product }: TutorialOverlayProps) {
  const stockoutCost = product ? getMargin(product) : 10;

  return (
    <div className="overlay tutorial-overlay">
      <div className="overlay-content tutorial-content">
        {product && (
          <h2 className="tutorial-product">
            You're managing: {product.name} {product.icon}
          </h2>
        )}

        <div className="tutorial-rules">
          <p className="tutorial-rule">
            <span className="rule-icon">📦</span>
            <span>Order {product?.name || 'products'} to keep inventory stocked.</span>
          </p>
          <p className="tutorial-rule">
            <span className="rule-icon">⏱️</span>
            <span>Orders take time to arrive.</span>
          </p>
          <p className="tutorial-rule">
            <span className="rule-icon">⚠️</span>
            <span>Avoid stockouts - they cost €{stockoutCost.toFixed(2)}/unit missed!</span>
          </p>
          <p className="tutorial-rule">
            <span className="rule-icon">💰</span>
            <span>Keep inventory low - holding costs {product ? (product.annualHoldingRate * 100).toFixed(0) : '10'}% of value/year.</span>
          </p>
        </div>

        <div className="tutorial-goal">
          <strong>Goal: Minimize total cost (Stockout + Holding costs)</strong>
        </div>

        <button className="start-button" onClick={onStart}>
          Start Game
        </button>
      </div>
    </div>
  );
}

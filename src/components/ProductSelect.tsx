import { useState } from 'react';
import { ProductConfig } from '../game/types';
import { PRODUCTS } from '../game/products';

interface ProductSelectProps {
  onSelect: (product: ProductConfig) => void;
}

interface TooltipInfo {
  id: string;
  text: string;
}

const TOOLTIPS: Record<string, string> = {
  holdingCost: "Annual cost of storing inventory as a percentage of product value. Includes warehousing, insurance, and obsolescence risk.",
  orderingCost: "Fixed cost incurred each time you place an order. Covers processing, shipping, and handling.",
  revenue: "Price received per unit sold to customers.",
  margin: "Profit per unit: Revenue minus Cost of Goods Sold. This is what you lose during stockouts.",
};

function calculateMargin(product: ProductConfig): number {
  return ((product.revenuePerUnit - product.cogsPerUnit) / product.revenuePerUnit) * 100;
}

function calculateMarginAmount(product: ProductConfig): number {
  return product.revenuePerUnit - product.cogsPerUnit;
}

export function ProductSelect({ onSelect }: ProductSelectProps) {
  const [activeTooltip, setActiveTooltip] = useState<TooltipInfo | null>(null);

  const handleMouseEnter = (productId: string, tooltipKey: string) => {
    setActiveTooltip({ id: `${productId}-${tooltipKey}`, text: TOOLTIPS[tooltipKey] });
  };

  const handleMouseLeave = () => {
    setActiveTooltip(null);
  };

  return (
    <div className="overlay product-select-overlay">
      <div className="product-select-content">
        <h1>Choose Your Product</h1>
        <p className="subtitle">Select a product to manage</p>

        <div className="product-grid">
          {PRODUCTS.map((product) => (
            <button
              key={product.id}
              className="product-card product-card-large"
              onClick={() => onSelect(product)}
            >
              <div className="product-icon">{product.icon}</div>
              <h2 className="product-name">{product.name}</h2>

              <div className="product-details">
                {/* Group 1: Costs */}
                <div className="product-detail-group">
                  <div className="group-label">Costs</div>
                  <div
                    className="product-detail with-tooltip"
                    onMouseEnter={() => handleMouseEnter(product.id, 'holdingCost')}
                    onMouseLeave={handleMouseLeave}
                  >
                    <span className="detail-label">Holding Cost</span>
                    <span className="detail-value">{(product.annualHoldingRate * 100).toFixed(0)}%/year</span>
                    {activeTooltip?.id === `${product.id}-holdingCost` && (
                      <div className="tooltip">{activeTooltip.text}</div>
                    )}
                  </div>
                  <div
                    className="product-detail with-tooltip"
                    onMouseEnter={() => handleMouseEnter(product.id, 'orderingCost')}
                    onMouseLeave={handleMouseLeave}
                  >
                    <span className="detail-label">Ordering Cost</span>
                    <span className="detail-value">€{product.orderingCost}/order</span>
                    {activeTooltip?.id === `${product.id}-orderingCost` && (
                      <div className="tooltip">{activeTooltip.text}</div>
                    )}
                  </div>
                </div>

                {/* Group 2: Revenue */}
                <div className="product-detail-group">
                  <div className="group-label">Revenue</div>
                  <div
                    className="product-detail with-tooltip"
                    onMouseEnter={() => handleMouseEnter(product.id, 'revenue')}
                    onMouseLeave={handleMouseLeave}
                  >
                    <span className="detail-label">Revenue</span>
                    <span className="detail-value">€{product.revenuePerUnit.toFixed(2)}/unit</span>
                    {activeTooltip?.id === `${product.id}-revenue` && (
                      <div className="tooltip">{activeTooltip.text}</div>
                    )}
                  </div>
                  <div
                    className="product-detail highlight with-tooltip"
                    onMouseEnter={() => handleMouseEnter(product.id, 'margin')}
                    onMouseLeave={handleMouseLeave}
                  >
                    <span className="detail-label">Margin</span>
                    <span className="detail-value">€{calculateMarginAmount(product).toFixed(2)} ({calculateMargin(product).toFixed(0)}%)</span>
                    {activeTooltip?.id === `${product.id}-margin` && (
                      <div className="tooltip">{activeTooltip.text}</div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

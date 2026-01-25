import { ProductConfig } from '../game/types';
import { PRODUCTS } from '../game/products';

interface ProductSelectProps {
  onSelect: (product: ProductConfig) => void;
}

function calculateMargin(product: ProductConfig): number {
  return ((product.revenuePerUnit - product.cogsPerUnit) / product.revenuePerUnit) * 100;
}

export function ProductSelect({ onSelect }: ProductSelectProps) {
  return (
    <div className="overlay product-select-overlay">
      <div className="product-select-content">
        <h1>Choose Your Product</h1>
        <p className="subtitle">Select a product to manage</p>

        <div className="product-grid">
          {PRODUCTS.map((product) => (
            <button
              key={product.id}
              className="product-card"
              onClick={() => onSelect(product)}
            >
              <div className="product-icon">{product.icon}</div>
              <h2 className="product-name">{product.name}</h2>

              <div className="product-details">
                <div className="product-detail">
                  <span className="detail-label">Holding Cost</span>
                  <span className="detail-value">{(product.annualHoldingRate * 100).toFixed(0)}%/year</span>
                </div>
                <div className="product-detail">
                  <span className="detail-label">COGS</span>
                  <span className="detail-value">€{product.cogsPerUnit.toFixed(2)}/unit</span>
                </div>
                <div className="product-detail">
                  <span className="detail-label">Revenue</span>
                  <span className="detail-value">€{product.revenuePerUnit.toFixed(2)}/unit</span>
                </div>
                <div className="product-detail highlight">
                  <span className="detail-label">Margin</span>
                  <span className="detail-value">{calculateMargin(product).toFixed(0)}%</span>
                </div>
                <div className="product-detail">
                  <span className="detail-label">Order Cost</span>
                  <span className="detail-value">€{product.orderingCost}/order</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import { LevelScore } from '../game/types';
import { formatCost } from '../game/scoring';

interface EducationalScreenProps {
  playerScore?: LevelScore;
  quiverScore?: LevelScore;
  onContinue: () => void;
}

export function EducationalScreen({ playerScore, quiverScore, onContinue }: EducationalScreenProps) {
  return (
    <div className="overlay educational-screen">
      <div className="educational-content">
        <h1>How Quiver Works</h1>
        <p className="educational-subtitle">
          AI-powered demand planning that scales to thousands of SKUs
        </p>

        {playerScore && quiverScore && (
          <div className="score-comparison">
            <div className="score-comparison-item player">
              <div className="score-comparison-label">Your Score</div>
              <div className="score-comparison-value">{playerScore.grade}</div>
              <div className="score-comparison-cost">{formatCost(playerScore.totalCost)}</div>
            </div>
            <div className="score-comparison-item quiver">
              <div className="score-comparison-label">Quiver Engine</div>
              <div className="score-comparison-value">{quiverScore.grade}</div>
              <div className="score-comparison-cost">{formatCost(quiverScore.totalCost)}</div>
            </div>
          </div>
        )}

        {/* Visual explanation cards */}
        <div className="educational-cards">
          {/* Card 1: Data Integration */}
          <div className="edu-card">
            <div className="edu-card-image">
              {/* Placeholder for image */}
              <div className="edu-image-placeholder">
                <span className="placeholder-icon">📊</span>
                <span className="placeholder-text">Data Integration Visual</span>
              </div>
            </div>
            <div className="edu-card-content">
              <h3>1. Connect Your Data</h3>
              <p>
                Quiver integrates with your ERP, POS, and warehouse systems to get real-time
                inventory levels, sales data, and supplier information.
              </p>
            </div>
          </div>

          {/* Card 2: ML Forecasting */}
          <div className="edu-card">
            <div className="edu-card-image">
              {/* Placeholder for image */}
              <div className="edu-image-placeholder">
                <span className="placeholder-icon">🤖</span>
                <span className="placeholder-text">ML Forecasting Visual</span>
              </div>
            </div>
            <div className="edu-card-content">
              <h3>2. Predict Demand</h3>
              <p>
                Machine learning models analyze historical patterns, seasonality, promotions,
                and external factors to forecast demand for each SKU.
              </p>
            </div>
          </div>

          {/* Card 3: Automated Ordering */}
          <div className="edu-card">
            <div className="edu-card-image">
              {/* Placeholder for image */}
              <div className="edu-image-placeholder">
                <span className="placeholder-icon">🚀</span>
                <span className="placeholder-text">Auto-Ordering Visual</span>
              </div>
            </div>
            <div className="edu-card-content">
              <h3>3. Optimize & Order</h3>
              <p>
                Quiver calculates optimal reorder points and safety stock levels, then
                automatically generates purchase orders to maintain ideal inventory.
              </p>
            </div>
          </div>
        </div>

        {/* Results highlight */}
        <div className="edu-results">
          <div className="edu-result-item">
            <span className="result-number">30-50%</span>
            <span className="result-label">Fewer Stockouts</span>
          </div>
          <div className="edu-result-divider" />
          <div className="edu-result-item">
            <span className="result-number">15-25%</span>
            <span className="result-label">Lower Holding Costs</span>
          </div>
          <div className="edu-result-divider" />
          <div className="edu-result-item">
            <span className="result-number">1000s</span>
            <span className="result-label">SKUs Managed</span>
          </div>
        </div>

        <button className="start-button" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}

import { GameState } from '../game/types';
import { formatCost, calculateGrade } from '../game/scoring';

interface EndScreenProps {
  state: GameState;
  levelNumber: 1 | 2 | 3;
  productId?: string;
  onContinue: () => void;
  continueText?: string;
  showQuiverButton?: boolean;
}

const GRADES = [
  { letter: 'F', color: '#ef4444' },  // Red
  { letter: 'D', color: '#f97316' },  // Orange
  { letter: 'C', color: '#fbbf24' },  // Yellow
  { letter: 'B', color: '#84cc16' },  // Lime
  { letter: 'A', color: '#22c55e' },  // Green
];

function getMessage(grade: string, levelNumber: number): string {
  if (levelNumber === 2) {
    if (grade === 'A' || grade === 'B') {
      return 'Impressive! You handled the chaos well.';
    } else if (grade === 'C') {
      return 'Not bad for a tough level! Marketing events are tricky.';
    } else {
      return 'That marketing campaign really hurt. The increased lead time made it nearly impossible!';
    }
  } else if (levelNumber === 3) {
    if (grade === 'A' || grade === 'B') {
      return 'Incredible! Managing multiple SKUs is no easy feat.';
    } else if (grade === 'C') {
      return 'Managing multiple SKUs at once is incredibly difficult.';
    } else {
      return 'Don\'t worry - this level is designed to be nearly impossible for humans. Let\'s see how Quiver handles it!';
    }
  } else {
    // Level 1
    if (grade === 'A') {
      return 'Excellent! You have a knack for demand planning!';
    } else if (grade === 'B') {
      return 'Great job! Just a bit of fine-tuning needed.';
    } else if (grade === 'C') {
      return 'Good effort! There\'s room for improvement.';
    } else if (grade === 'D') {
      return 'Not bad, but stockouts hurt your score.';
    } else {
      return 'Ouch! Those stockouts were costly.';
    }
  }
}

export function EndScreen({
  state,
  levelNumber,
  productId,
  onContinue,
  continueText = 'Continue',
  showQuiverButton = false,
}: EndScreenProps) {
  // Sum costs from all SKU states
  const totalHoldingCost = state.skuStates.reduce((sum, sku) => sum + sku.totalHoldingCost, 0);
  const totalStockoutCost = state.skuStates.reduce((sum, sku) => sum + sku.totalStockoutCost, 0);
  const totalOrderingCost = state.skuStates.reduce((sum, sku) => sum + sku.totalOrderingCost, 0);
  const totalCost = totalHoldingCost + totalStockoutCost + totalOrderingCost;
  const levelId = `level-${levelNumber}`;
  const grade = calculateGrade(totalCost, levelId, productId);
  const message = getMessage(grade, levelNumber);

  return (
    <div className="overlay end-overlay">
      <div className="overlay-content">
        <h1>Level {levelNumber} Complete!</h1>

        <div className="final-score">
          <div className="grade-scale">
            {GRADES.map(({ letter, color }) => (
              <div
                key={letter}
                className={`grade-item ${letter === grade ? 'active' : ''}`}
                style={{ color }}
              >
                {letter}
                {letter === grade && <div className="grade-arrow">▲</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="cost-addition-table">
          <div className="cost-row">
            <span className="cost-label">Holding Costs:</span>
            <span className="cost-value">{formatCost(totalHoldingCost)}</span>
          </div>
          <div className="cost-row">
            <span className="cost-label">Ordering Costs:</span>
            <span className="cost-value">{formatCost(totalOrderingCost)}</span>
          </div>
          <div className="cost-row stockout">
            <span className="cost-label">Stockout Penalties:</span>
            <span className="cost-value-plus">+ {formatCost(totalStockoutCost)}</span>
          </div>
          <div className="cost-divider"></div>
          <div className="cost-row total">
            <span className="cost-label">Total Cost:</span>
            <span className="cost-value-total">{formatCost(totalCost)}</span>
          </div>
        </div>

        <p className="score-message">{message}</p>

        <div className="end-buttons">
          <button
            className={showQuiverButton ? 'try-quiver-button' : 'start-button'}
            onClick={onContinue}
          >
            {showQuiverButton && <span className="quiver-icon">⚡</span>}
            {continueText}
          </button>
        </div>
      </div>
    </div>
  );
}

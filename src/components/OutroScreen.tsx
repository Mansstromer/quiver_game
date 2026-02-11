import { useState } from 'react';
import { LevelScore } from '../game/types';
import { formatCost } from '../game/scoring';

interface OutroScreenProps {
  playerScore?: LevelScore;
  quiverScore?: LevelScore;
  onPlayAgain: () => void;
}

export function OutroScreen({ playerScore, quiverScore, onPlayAgain }: OutroScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const totalSlides = 4;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setIsFading(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide + 1);
        setIsFading(false);
      }, 300);
    }
  };

  return (
    <div className="overlay outro-screen">
      <div className={`outro-slide ${isFading ? 'fading' : ''}`}>
        {/* Slide 1: Score Comparison */}
        {currentSlide === 0 && (
          <div className="outro-content">
            {playerScore && quiverScore && (
              <div className="score-comparison">
                <div className="score-comparison-item quiver">
                  <div className="score-comparison-label">Quiver Engine</div>
                  <div className="score-comparison-value">{quiverScore.grade}</div>
                  <div className="score-comparison-cost">{formatCost(quiverScore.totalCost)}</div>
                </div>
                <div className="score-comparison-item player">
                  <div className="score-comparison-label">Your Score</div>
                  <div className={`score-comparison-value grade-${playerScore.grade}`}>{playerScore.grade}</div>
                  <div className="score-comparison-cost">{formatCost(playerScore.totalCost)}</div>
                </div>
              </div>
            )}
            <p className="outro-text">You just managed 4 products for 3 months.</p>
            <button className="start-button" onClick={handleNext}>Next</button>
          </div>
        )}

        {/* Slide 2: Scale Message */}
        {currentSlide === 1 && (
          <div className="outro-content">
            <h1 className="outro-headline">Now imagine 400 SKUs. Across 12 warehouses. Every single day.</h1>
            <p className="outro-subtext">That's the reality for most supply chain teams.</p>
            <button className="start-button" onClick={handleNext}>Next</button>
          </div>
        )}

        {/* Slide 3: Product Pitch */}
        {currentSlide === 2 && (
          <div className="outro-content">
            <h1 className="outro-headline">Quiver makes those ordering decisions for you. Automatically.</h1>
            <p className="outro-subtext">
              It connects to your ERP, reads your demand signals, and places the right orders at the right time — so your team doesn't have to.
            </p>
            <button className="start-button" onClick={handleNext}>Next</button>
          </div>
        )}

        {/* Slide 4: Thank You */}
        {currentSlide === 3 && (
          <div className="outro-content">
            <h1 className="outro-headline">Want to see what Quiver can do with your data?</h1>
            <p className="outro-subtext">
              Book a demo and we'll show you — or play again and try to beat Quiver's score.
            </p>
            <div className="outro-buttons">
              <a
                href="https://quiver.dk"
                target="_blank"
                rel="noopener noreferrer"
                className="start-button outro-link-button"
              >
                Book a Demo
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://quiver.dk')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-linkedin-button"
                onClick={(e) => e.stopPropagation()}
              >
                Share on LinkedIn
              </a>
              <button className="start-button outro-play-again" onClick={onPlayAgain}>
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="intro-progress">
        {Array.from({ length: totalSlides }, (_, index) => (
          <div
            key={index}
            className={`intro-progress-dot ${
              index === currentSlide ? 'active' : index < currentSlide ? 'completed' : ''
            }`}
          />
        ))}
      </div>
    </div>
  );
}

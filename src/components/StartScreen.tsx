import { useState } from 'react';
import { IntroSlide } from '../game/types';

const INTRO_SLIDES: IntroSlide[] = [
  {
    id: 'welcome',
    title: 'Supply Demand Planner',
    text: 'Simulator 2026',
    subtext: 'Experience the challenge of inventory management',
  },
  {
    id: 'role',
    text: 'You are a demand planner',
    subtext: 'Your job is to keep products in stock for customers',
  },
  {
    id: 'buying',
    text: 'You buy products',
    subtext: 'Place orders to replenish inventory before it runs out',
  },
  {
    id: 'stockouts',
    text: 'Prevent stock-outs',
    subtext: 'Empty shelves mean lost sales and unhappy customers',
  },
  {
    id: 'costs',
    text: 'Minimize inventory costs',
    subtext: 'Too much inventory ties up capital and costs money to store',
  },
];

interface StartScreenProps {
  onComplete: () => void;
}

export function StartScreen({ onComplete }: StartScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const handleNext = () => {
    if (currentSlide < INTRO_SLIDES.length - 1) {
      setIsFading(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide + 1);
        setIsFading(false);
      }, 300);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slide = INTRO_SLIDES[currentSlide];
  const isLastSlide = currentSlide === INTRO_SLIDES.length - 1;
  const isFirstSlide = currentSlide === 0;

  return (
    <div className="intro-overlay start-screen" onClick={handleNext}>
      <button className="intro-skip-button" onClick={(e) => { e.stopPropagation(); handleSkip(); }}>
        Skip
      </button>

      <div className={`intro-slide ${isFading ? 'fading' : ''}`}>
        <div className="intro-text-container">
          {slide.title && (
            <div className="start-screen-title">{slide.title}</div>
          )}
          <div className={isFirstSlide ? 'start-screen-subtitle' : 'intro-text'}>
            {slide.text}
          </div>
          {slide.subtext && (
            <div className="intro-subtext">{slide.subtext}</div>
          )}
        </div>
      </div>

      <button
        className="intro-continue-button"
        onClick={(e) => { e.stopPropagation(); handleNext(); }}
      >
        {isLastSlide ? 'Continue' : 'Next'}
      </button>

      <div className="intro-progress">
        {INTRO_SLIDES.map((_, index) => (
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

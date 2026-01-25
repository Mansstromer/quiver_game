interface IntroOverlayProps {
  onComplete: () => void;
}

export function IntroOverlay({ onComplete }: IntroOverlayProps) {
  return (
    <div className="intro-overlay intro-simple">
      <div className="intro-simple-content">
        <div className="intro-logo">
          <span className="intro-logo-icon">⚡</span>
          <span className="intro-logo-text">Quiver</span>
        </div>
        <h1 className="intro-title">Demand Planning Challenge</h1>
        <button className="intro-start-button" onClick={onComplete}>
          Start
        </button>
      </div>
    </div>
  );
}

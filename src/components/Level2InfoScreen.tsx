interface Level2InfoScreenProps {
  onStart: () => void;
}

export function Level2InfoScreen({ onStart }: Level2InfoScreenProps) {
  return (
    <div className="overlay level2-simple-screen">
      <div className="level2-simple-content">
        <p className="level2-message">
          Your supplier calls: They are having delays in production.
        </p>
        <p className="level2-highlight">
          Lead time increased from 2 weeks to 3 weeks.
        </p>

        <button className="start-button" onClick={onStart}>
          Continue
        </button>
      </div>
    </div>
  );
}

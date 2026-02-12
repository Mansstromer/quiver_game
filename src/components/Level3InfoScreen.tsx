interface Level3InfoScreenProps {
  onStart: () => void;
}

export function Level3InfoScreen({ onStart }: Level3InfoScreenProps) {
  return (
    <div className="overlay level2-simple-screen">
      <div className="level2-simple-content">
        <p className="level2-message">
          Let's make it a little bit harder...
        </p>

        <button className="start-button" onClick={onStart}>
          Continue
        </button>
      </div>
    </div>
  );
}

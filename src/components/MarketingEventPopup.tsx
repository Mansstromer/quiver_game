interface MarketingEventPopupProps {
  onDismiss: () => void;
}

export function MarketingEventPopup({ onDismiss }: MarketingEventPopupProps) {
  return (
    <div className="overlay marketing-popup-overlay">
      <div className="marketing-popup-content">
        <div className="marketing-popup-icon">📢</div>
        <h2 className="marketing-popup-title">Heads Up!</h2>
        <p className="marketing-popup-message">
          A marketing campaign starts in 2 weeks. Expect increased demand!
        </p>
        <button className="start-button" onClick={onDismiss}>
          Continue
        </button>
      </div>
    </div>
  );
}

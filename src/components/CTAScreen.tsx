interface CTAScreenProps {
  onPlayAgain?: () => void;
}

export function CTAScreen({ onPlayAgain }: CTAScreenProps) {
  return (
    <div className="overlay cta-screen">
      <div className="cta-content">
        <h1>Ready to Optimize Your Supply Chain?</h1>
        <p className="cta-subtitle">
          Let's discuss how Quiver can help your business
        </p>

        <div className="cta-profile">
          <div className="cta-photo">
            {/* Placeholder - replace with actual photo */}
            <span>MS</span>
          </div>
          <div className="cta-name">Morten Sønderlyng</div>
          <div className="cta-title">CEO, Quiver</div>
        </div>

        <div className="cta-contact">
          <a href="mailto:morten@quiver.dk" className="cta-contact-item">
            <span className="cta-contact-icon">📧</span>
            <span>morten@quiver.dk</span>
          </a>
          <a href="tel:+4512345678" className="cta-contact-item">
            <span className="cta-contact-icon">📞</span>
            <span>+45 12 34 56 78</span>
          </a>
        </div>

        <div className="cta-criteria">
          <div className="cta-criteria-title">Best fit for companies with</div>
          <div className="cta-criteria-item">10M+ DKK in inventory</div>
        </div>

        <button
          className="cta-button"
          onClick={() => window.open('mailto:morten@quiver.dk?subject=Quiver%20Demo%20Request', '_blank')}
        >
          Schedule a Conversation
        </button>

        {onPlayAgain && (
          <button
            className="play-again-link"
            onClick={onPlayAgain}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              marginTop: '24px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Play again
          </button>
        )}
      </div>
    </div>
  );
}

import { BASE_LEAD_TIME, LEVEL_2_LEAD_TIME_MULTIPLIER } from '../game/constants';

interface Level2InfoScreenProps {
  onStart: () => void;
}

export function Level2InfoScreen({ onStart }: Level2InfoScreenProps) {
  const normalLeadTime = BASE_LEAD_TIME;
  const increasedLeadTime = BASE_LEAD_TIME * LEVEL_2_LEAD_TIME_MULTIPLIER;

  return (
    <div className="overlay level-info-screen">
      <div className="level-info-content">
        <h1>Level 2</h1>
        <p className="level-info-subtitle">Things are about to get harder...</p>

        <div className="level-info-warning">
          <div className="warning-item">
            <div className="warning-icon">⏱️</div>
            <div className="warning-text">
              <div className="warning-title">Lead Time Increased by 50%</div>
              <div className="warning-detail">
                Your suppliers are experiencing delays. Orders will take longer to arrive.
              </div>
            </div>
          </div>

          <div className="warning-item">
            <div className="warning-icon">📊</div>
            <div className="warning-text">
              <div className="warning-title">No Demand Forecast</div>
              <div className="warning-detail">
                The forecast line has been removed. You'll need to react to demand as it happens.
              </div>
            </div>
          </div>

          <div className="warning-item">
            <div className="warning-icon">📢</div>
            <div className="warning-text">
              <div className="warning-title">Unexpected Events</div>
              <div className="warning-detail">
                Marketing campaigns can cause sudden demand spikes. Stay alert!
              </div>
            </div>
          </div>
        </div>

        <div className="lead-time-comparison">
          <div className="lead-time-box before">
            <div className="lead-time-label">Level 1</div>
            <div className="lead-time-value">{normalLeadTime}s</div>
          </div>
          <div className="lead-time-arrow">→</div>
          <div className="lead-time-box after">
            <div className="lead-time-label">Level 2</div>
            <div className="lead-time-value">{increasedLeadTime}s</div>
          </div>
        </div>

        <button className="start-button" onClick={onStart}>
          Start Level 2
        </button>
      </div>
    </div>
  );
}

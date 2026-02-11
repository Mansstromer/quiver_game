import { GameState, SKUState, SKUConfig } from '../game/types';

interface GameControlsProps {
  state: GameState;
  skuState: SKUState | undefined;
  skuConfig: SKUConfig | undefined;
  levelQuiverEnabled: boolean;
  onPlaceOrder: () => void;
  onEnableQuiver: () => void;
  onPlayClick: () => void;
}

function isPlayingStatus(status: string): boolean {
  return status === 'level-1' || status === 'level-2' || status === 'level-3' || status === 'quiver-demo';
}

export function GameControls({
  state,
  skuState,
  skuConfig,
  levelQuiverEnabled,
  onPlaceOrder,
  onEnableQuiver,
  onPlayClick,
}: GameControlsProps) {
  const isPlaying = isPlayingStatus(state.status);
  const canOrder =
    isPlaying &&
    skuState &&
    state.time - skuState.lastOrderTime >= 1 &&
    skuState.pendingOrders.length < 5;
  const hasPendingOrders = skuState && skuState.pendingOrders.length > 0;
  const orderQuantity = skuConfig?.orderQuantity ?? 50;

  return (
    <div className="game-controls">
      <div className="controls-left">
        <button
          className={`order-button ${!canOrder ? 'disabled' : ''}`}
          onClick={() => {
            onPlayClick();
            if (canOrder) onPlaceOrder();
          }}
          disabled={!isPlaying}
        >
          <span className="order-icon">📦</span>
          <span className="order-text">
            ORDER
            <span className="order-quantity">+{orderQuantity} units</span>
          </span>
        </button>

        {hasPendingOrders && skuState && (
          <div className="pending-orders">
            {skuState.pendingOrders.map((order) => {
              const timeLeft = Math.max(0, order.arrivalTime - state.time);
              return (
                <div key={order.id} className="pending-order">
                  <span className="pending-icon">🚚</span>
                  <span className="pending-time">{timeLeft.toFixed(1)}s</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="controls-right">
        {levelQuiverEnabled && !state.quiverEnabled && isPlaying && (
          <button
            className="quiver-button"
            onClick={() => {
              onPlayClick();
              onEnableQuiver();
            }}
          >
            <span className="quiver-icon">⚡</span>
            Enable Quiver
          </button>
        )}

        {(state.quiverEnabled || state.status === 'quiver-demo') && (
          <div className="quiver-active">
            <span className="quiver-icon">⚡</span>
            Quiver Active
          </div>
        )}
      </div>
    </div>
  );
}

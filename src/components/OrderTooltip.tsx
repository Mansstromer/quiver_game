import { useEffect } from 'react';

interface OrderTooltipProps {
  show: boolean;
  onDismiss: () => void;
}

export function OrderTooltip({ show, onDismiss }: OrderTooltipProps) {
  useEffect(() => {
    if (!show) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div className="order-tooltip">
      <div className="order-tooltip-content">
        <span className="tooltip-text">press space to order stock</span>
      </div>
    </div>
  );
}

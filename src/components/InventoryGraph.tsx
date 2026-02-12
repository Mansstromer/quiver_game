import { useRef, useEffect } from 'react';
import { GameState, PendingOrder, SKUState, SKUConfig, LevelConfig, MarketingEvent } from '../game/types';
import { COLORS, SECONDS_PER_MONTH } from '../game/constants';
import { getDemandBetween } from '../game/demandEngine';

interface InventoryGraphProps {
  state: GameState;
  skuState: SKUState | undefined;
  skuConfig: SKUConfig | undefined;
  level: LevelConfig;
  width: number;
  height: number;
  maxInventory: number;  // Y-axis maximum (product-specific)
  compact?: boolean;  // For multi-SKU display
  reorderPoint?: number;  // Optional ROP line for quiver-demo
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gameDuration: number,
  maxInventory: number
) {
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;

  // Vertical lines (time)
  for (let t = 0; t <= gameDuration; t += 5) {
    const x = (t / gameDuration) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines (inventory) - show ~5 lines regardless of max value
  const targetGridLines = 5;
  const rawGridStep = maxInventory / targetGridLines;
  const gridMagnitude = Math.pow(10, Math.floor(Math.log10(rawGridStep)));
  const gridMultiples = [1, 2, 2.5, 5, 10];
  const gridStep = gridMultiples
    .map(m => m * gridMagnitude)
    .find(step => maxInventory / step <= targetGridLines + 1) || rawGridStep;

  for (let inv = 0; inv <= maxInventory; inv += gridStep) {
    const y = height - (inv / maxInventory) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawMonthDividers(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gameDuration: number
) {
  ctx.strokeStyle = COLORS.monthDivider;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);

  // Draw dividers at month boundaries (12s and 24s for 36s game)
  for (let month = 1; month < 3; month++) {
    const t = month * SECONDS_PER_MONTH;
    const x = (t / gameDuration) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  ctx.setLineDash([]);
}

function drawMarketingEventLine(
  ctx: CanvasRenderingContext2D,
  event: MarketingEvent,
  currentTime: number,
  gameDuration: number,
  width: number,
  height: number,
  compact: boolean
) {
  // Show zone once the notification time is reached (or triggerTime if no notifyTime)
  const visibleFrom = event.notifyTime ?? event.triggerTime;
  if (currentTime < visibleFrom) return;

  const x = (event.triggerTime / gameDuration) * width;

  // Draw red vertical line
  ctx.strokeStyle = COLORS.marketingEventLine;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();

  // Draw semi-transparent background for the event duration
  const endTime = Math.min(event.triggerTime + event.duration, gameDuration);
  const endX = (endTime / gameDuration) * width;
  ctx.fillStyle = COLORS.marketingEventBg;
  ctx.fillRect(x, 0, endX - x, height);

  // Draw corner label (unless compact mode)
  if (!compact) {
    ctx.fillStyle = COLORS.marketingEventLine;
    ctx.font = 'bold 14px DM Sans, sans-serif';
    ctx.textAlign = 'left';
    ctx.save();
    ctx.translate(x + 5, 22);
    ctx.fillText(event.label, 0, 0);
    ctx.restore();
  } else {
    // In compact mode, just show a small indicator
    ctx.fillStyle = COLORS.marketingEventLine;
    ctx.font = 'bold 9px DM Sans, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('!', x + 3, 12);
  }
}

/**
 * Wraps getDemandBetween to apply marketing event multipliers for overlapping time ranges.
 * This ensures the forecast projection line accounts for demand spikes during marketing events.
 */
function getDemandBetweenWithEvents(
  skuConfig: SKUConfig,
  startTime: number,
  endTime: number,
  gameDuration: number,
  level: LevelConfig
): number {
  const baseDemand = getDemandBetween(skuConfig, startTime, endTime, gameDuration);

  if (skuConfig.marketingEventIndex === undefined) {
    return baseDemand;
  }

  const event = level.marketingEvents[skuConfig.marketingEventIndex];
  if (!event) return baseDemand;

  const eventEnd = event.triggerTime + event.duration;

  // Calculate overlap between [startTime, endTime] and [triggerTime, eventEnd]
  const overlapStart = Math.max(startTime, event.triggerTime);
  const overlapEnd = Math.min(endTime, eventEnd);

  if (overlapStart >= overlapEnd) {
    // No overlap with marketing event
    return baseDemand;
  }

  // Get the demand specifically in the overlap window
  const overlapDemand = getDemandBetween(skuConfig, overlapStart, overlapEnd, gameDuration);

  // The overlap demand is already counted in baseDemand at 1x.
  // We need to add (multiplier - 1) * overlapDemand to get the full multiplied effect.
  return baseDemand + overlapDemand * (event.demandMultiplier - 1);
}

function drawInventoryHistory(
  ctx: CanvasRenderingContext2D,
  skuState: SKUState,
  width: number,
  height: number,
  gameDuration: number,
  maxInventory: number
) {
  if (skuState.inventoryHistory.length < 2) return;

  ctx.strokeStyle = COLORS.inventoryLine;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  skuState.inventoryHistory.forEach((point, i) => {
    const x = (point.time / gameDuration) * width;
    const y = height - (point.inventory / maxInventory) * height;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
}

function drawDemandProjection(
  ctx: CanvasRenderingContext2D,
  currentTime: number,
  currentInventory: number,
  skuConfig: SKUConfig,
  pendingOrders: PendingOrder[],
  gameDuration: number,
  width: number,
  height: number,
  maxInventory: number,
  level: LevelConfig
) {
  // Projection shows future inventory: declining lines for demand, vertical jumps for orders
  const lookaheadTime = Math.min(10, gameDuration - currentTime);
  if (lookaheadTime <= 0) return;

  const endTime = currentTime + lookaheadTime;

  // Helper to convert time/inventory to canvas coordinates
  const toX = (t: number) => (t / gameDuration) * width;
  const toY = (inv: number) => height - (Math.max(0, inv) / maxInventory) * height;

  // Get orders within lookahead window, sorted by arrival time
  const relevantOrders = pendingOrders
    .filter(o => o.arrivalTime > currentTime && o.arrivalTime <= endTime)
    .sort((a, b) => a.arrivalTime - b.arrivalTime);

  // Build timeline of key points: start, each order arrival, and end
  // Between these points, inventory just declines due to demand
  const keyTimes: number[] = [currentTime];
  relevantOrders.forEach(o => keyTimes.push(o.arrivalTime));
  keyTimes.push(endTime);

  ctx.strokeStyle = COLORS.demandProjection;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(toX(currentTime), toY(currentInventory));

  let inventory = currentInventory;

  for (let i = 0; i < keyTimes.length - 1; i++) {
    const segmentStart = keyTimes[i];
    const segmentEnd = keyTimes[i + 1];

    // Draw smooth curve for this segment (demand consumption only)
    // Use small steps for smooth appearance
    const steps = Math.max(1, Math.ceil((segmentEnd - segmentStart) * 2));
    const dt = (segmentEnd - segmentStart) / steps;

    for (let j = 1; j <= steps; j++) {
      const t = segmentStart + j * dt;
      const demand = getDemandBetweenWithEvents(skuConfig, segmentStart + (j - 1) * dt, t, gameDuration, level);
      inventory = Math.max(0, inventory - demand);
      ctx.lineTo(toX(t), toY(inventory));
    }

    // If an order arrives at segmentEnd, add its quantity (vertical jump up)
    const arrivingOrder = relevantOrders.find(o => o.arrivalTime === segmentEnd);
    if (arrivingOrder) {
      inventory = Math.min(inventory + arrivingOrder.quantity, maxInventory);
      ctx.lineTo(toX(segmentEnd), toY(inventory));
    }
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

function drawOrderBars(
  ctx: CanvasRenderingContext2D,
  pendingOrders: PendingOrder[],
  gameDuration: number,
  width: number,
  height: number,
  maxInventory: number
) {
  // Draw blue vertical bars at the x-axis for each pending order
  const barWidth = 6;

  pendingOrders.forEach((order) => {
    const x = (order.arrivalTime / gameDuration) * width;
    // Bar height proportional to order quantity
    const barHeight = (order.quantity / maxInventory) * height;

    ctx.fillStyle = COLORS.orderBar;
    ctx.fillRect(x - barWidth / 2, height - barHeight, barWidth, barHeight);
  });
}

function drawOrderPlaceholder(
  ctx: CanvasRenderingContext2D,
  currentTime: number,
  leadTime: number,
  orderQuantity: number,
  gameDuration: number,
  width: number,
  height: number,
  maxInventory: number
) {
  // Draw a hollow/dashed placeholder showing where the next order would arrive
  const arrivalTime = currentTime + leadTime;
  if (arrivalTime > gameDuration) return;

  const barWidth = 6;
  const x = (arrivalTime / gameDuration) * width;
  const barHeight = (orderQuantity / maxInventory) * height;

  ctx.strokeStyle = COLORS.orderBar;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);

  ctx.strokeRect(x - barWidth / 2, height - barHeight, barWidth, barHeight);

  ctx.setLineDash([]);
}

function drawTimeMarker(
  ctx: CanvasRenderingContext2D,
  time: number,
  gameDuration: number,
  width: number,
  height: number
) {
  const x = (time / gameDuration) * width;

  ctx.strokeStyle = COLORS.timeMarker;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;

  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

function drawLabels(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gameDuration: number,
  compact: boolean,
  maxInventory: number
) {
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = compact ? '9px DM Sans, sans-serif' : '11px DM Sans, sans-serif';

  // Y-axis labels - show only 4-5 labels regardless of max value
  ctx.textAlign = 'right';
  const targetLabels = compact ? 3 : 4;
  // Round step to a nice number (multiples of 100, 250, 500, 1000, etc.)
  const rawStep = maxInventory / targetLabels;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const niceMultiples = [1, 2, 2.5, 5, 10];
  const invStep = niceMultiples
    .map(m => m * magnitude)
    .find(step => maxInventory / step <= targetLabels + 1) || rawStep;

  for (let inv = invStep; inv <= maxInventory; inv += invStep) {
    const y = height - (inv / maxInventory) * height;
    // Skip labels too close to the top edge (would get cut off)
    if (y < 12) continue;
    ctx.fillText(inv.toString(), compact ? 24 : 30, y + 4);
  }

  // X-axis labels: Month 1, Month 2, Month 3
  ctx.textAlign = 'center';
  const monthDuration = gameDuration / 3;
  for (let month = 1; month <= 3; month++) {
    // Position labels in the middle of each month
    const t = (month - 0.5) * monthDuration;
    const x = (t / gameDuration) * width;
    ctx.fillText(compact ? `M${month}` : `Month ${month}`, x, height - 5);
  }
}

function drawReorderPointLine(
  ctx: CanvasRenderingContext2D,
  reorderPoint: number,
  width: number,
  height: number,
  maxInventory: number
) {
  // Skip if ROP is above visible range
  if (reorderPoint > maxInventory) return;

  const y = height - (reorderPoint / maxInventory) * height;

  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);

  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw "ROP" label on the right side
  ctx.fillStyle = '#8b5cf6';
  ctx.font = 'bold 9px DM Sans, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Reorder Point', width - 4, y - 4);
}

export function InventoryGraph({
  state,
  skuState,
  skuConfig,
  level,
  width,
  height,
  maxInventory,
  compact = false,
  reorderPoint,
}: InventoryGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Determine effective lead time (with multiplier)
  const effectiveLeadTime = skuConfig
    ? (skuConfig.leadTime ?? 4) * level.leadTimeMultiplier
    : 4;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameDuration = level.duration;

    // Handle device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    // Draw layers
    drawGrid(ctx, width, height, gameDuration, maxInventory);
    drawMonthDividers(ctx, width, height, gameDuration);
    // Zero line removed per design update
    drawLabels(ctx, width, height, gameDuration, compact, maxInventory);

    // Draw marketing event lines (if any affect this SKU)
    if (skuConfig && level.marketingEvents.length > 0) {
      level.marketingEvents.forEach((event, eventIndex) => {
        // Check if this SKU is affected by this event
        if (skuConfig.marketingEventIndex === eventIndex) {
          drawMarketingEventLine(ctx, event, state.time, gameDuration, width, height, compact);
        }
      });
    }

    // Draw ROP line for quiver-demo mode
    if (reorderPoint !== undefined) {
      drawReorderPointLine(ctx, reorderPoint, width, height, maxInventory);
    }

    // Draw SKU-specific elements if available
    if (skuState && skuConfig) {
      // Draw order bars for pending orders (blue bars at x-axis)
      drawOrderBars(ctx, skuState.pendingOrders, gameDuration, width, height, maxInventory);

      // Draw order placeholder (hollow bar showing where next order would arrive)
      if (state.status === 'level-1' || state.status === 'level-2' || state.status === 'level-3' || state.status === 'quiver-demo') {
        drawOrderPlaceholder(
          ctx,
          state.time,
          effectiveLeadTime,
          skuConfig.orderQuantity,
          gameDuration,
          width,
          height,
          maxInventory
        );
      }

      // Draw demand projection line only if showForecast is true
      if ((state.status === 'level-1' || state.status === 'level-2' || state.status === 'level-3' || state.status === 'quiver-demo') && level.showForecast) {
        drawDemandProjection(
          ctx,
          state.time,
          skuState.inventory,
          skuConfig,
          skuState.pendingOrders,
          gameDuration,
          width,
          height,
          maxInventory,
          level
        );
      }

      // Draw inventory history
      drawInventoryHistory(ctx, skuState, width, height, gameDuration, maxInventory);
    }

    // Draw time marker
    if (state.status === 'level-1' || state.status === 'level-2' || state.status === 'level-3' || state.status === 'quiver-demo') {
      drawTimeMarker(ctx, state.time, gameDuration, width, height);
    }
  }, [state, skuState, skuConfig, level, width, height, maxInventory, compact, effectiveLeadTime, reorderPoint]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        borderRadius: '4px',
      }}
    />
  );
}

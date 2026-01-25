import { useEffect, useRef } from 'react';
import { GameState, LevelConfig } from '../game/types';
import { getQuiverOrders } from '../game/quiverAI';

interface UseGameLoopProps {
  state: GameState;
  tick: (deltaTime: number) => void;
  placeOrder: (skuId: string) => void;
  level: LevelConfig | null;
}

function isPlayingStatus(status: string): boolean {
  return status === 'level-1' || status === 'level-2' || status === 'level-3' || status === 'quiver-demo';
}

export function useGameLoop({ state, tick, placeOrder, level }: UseGameLoopProps) {
  const lastTimeRef = useRef<number>(0);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlayingStatus(state.status) || !level) {
      lastTimeRef.current = 0;
      return;
    }

    const loop = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }

      const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;

      // Update game state
      tick(deltaTime);

      // Quiver AI ordering (for quiver-demo mode or if manually enabled)
      if (state.quiverEnabled || state.status === 'quiver-demo') {
        const skuIdsToOrder = getQuiverOrders(state, level);
        skuIdsToOrder.forEach((skuId) => placeOrder(skuId));
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [state.status, state.quiverEnabled, tick, placeOrder, level]);

  // Separate effect for Quiver AI to check more frequently
  useEffect(() => {
    if (!isPlayingStatus(state.status) || !level) return;
    if (!state.quiverEnabled && state.status !== 'quiver-demo') return;

    const skuIdsToOrder = getQuiverOrders(state, level);
    skuIdsToOrder.forEach((skuId) => placeOrder(skuId));
  }, [state.time, state.quiverEnabled, state.status, placeOrder, level]);
}

import { useRef, useCallback, useEffect } from 'react';

type SoundType = 'click' | 'orderPlaced' | 'orderArrived' | 'stockoutAlarm';

// Create audio context lazily to comply with browser autoplay policies
function createAudioContext() {
  return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
}

// Generate simple synthesized sounds
function generateBeep(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  _type: OscillatorType = 'sine',
  volume: number = 0.3
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const envelope = Math.min(1, 10 * t) * Math.max(0, 1 - t / duration);
    data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * volume;
  }

  return buffer;
}

function generateClick(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.05;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 50);
    data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
  }

  return buffer;
}

function generateAlarm(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.4;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const frequency = 400 + 200 * Math.sin(2 * Math.PI * 8 * t);
    const envelope = Math.min(1, 20 * t) * Math.max(0, 1 - t / duration);
    data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.4;
  }

  return buffer;
}

export function useSoundEffects() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundsRef = useRef<Map<SoundType, AudioBuffer>>(new Map());
  const initializedRef = useRef(false);

  const initialize = useCallback(() => {
    if (initializedRef.current) return;

    try {
      const ctx = createAudioContext();
      audioCtxRef.current = ctx;

      // Generate sounds
      soundsRef.current.set('click', generateClick(ctx));
      soundsRef.current.set('orderPlaced', generateBeep(ctx, 880, 0.1, 'sine', 0.3));
      soundsRef.current.set('orderArrived', generateBeep(ctx, 523, 0.15, 'sine', 0.4));
      soundsRef.current.set('stockoutAlarm', generateAlarm(ctx));

      initializedRef.current = true;
    } catch (e) {
      console.warn('Audio not available:', e);
    }
  }, []);

  const playSound = useCallback((sound: SoundType) => {
    if (!audioCtxRef.current || !soundsRef.current.has(sound)) return;

    const ctx = audioCtxRef.current;

    // Resume context if suspended (autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const buffer = soundsRef.current.get(sound)!;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  }, []);

  // Initialize on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      initialize();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [initialize]);

  return { playSound, initialize };
}

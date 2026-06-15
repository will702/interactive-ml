import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function useSimulationTimer(timescale: number = 1.0) {
  const stateRef = useRef({
    elapsed: 0,
    lastTime: 0
  });

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (stateRef.current.lastTime === 0) {
      stateRef.current.lastTime = time;
    }
    const delta = time - stateRef.current.lastTime;
    stateRef.current.elapsed += delta * timescale;
    stateRef.current.lastTime = time;
  });

  return useMemo(() => ({
    getElapsed: () => stateRef.current.elapsed,
    reset: () => {
      stateRef.current.elapsed = 0;
      stateRef.current.lastTime = 0;
    }
  }), []);
}

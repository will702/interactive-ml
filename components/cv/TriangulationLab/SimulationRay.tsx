'use client';
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

interface SimulationRayProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  progress: number;
  color?: string;
  lineWidth?: number;
}

/**
 * Renders a line from start to a point between start and end defined by progress.
 */
export function SimulationRay({ start, end, progress, color = "white", lineWidth = 1 }: SimulationRayProps) {
  const currentEnd = useMemo(() => {
    return new THREE.Vector3().lerpVectors(start, end, Math.max(0, Math.min(1, progress)));
  }, [start, end, progress]);

  const points = useMemo(() => [start, currentEnd], [start, currentEnd]);

  // Don't render if progress is basically 0 to avoid tiny line segments
  if (progress <= 0.001) return null;

  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={0.5}
    />
  );
}

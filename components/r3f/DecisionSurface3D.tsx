'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMemo } from 'react';

function decisionFunc(x: number, y: number): number {
  // Simplified tree-like decision boundary
  if (x > 0) {
    return y > 0.3 ? 1 : 0;
  } else {
    return y > -0.3 ? 1 : 0;
  }
}

export default function DecisionSurface3D() {
  const cells = useMemo(() => {
    const grid: { x: number; y: number; cls: number }[] = [];
    const N = 20;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const x = (i / N) * 4 - 2;
        const y = (j / N) * 4 - 2;
        grid.push({ x, y, cls: decisionFunc(x, y) });
      }
    }
    return grid;
  }, []);

  return (
    <div style={{ width: '100%', height: 320, borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--rule)' }}>
      <Canvas camera={{ position: [5, 4, 5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={0.8} />
        {cells.map((c, i) => (
          <mesh key={i} position={[c.x, c.cls * 0.5, c.y]}>
            <boxGeometry args={[0.18, 0.5, 0.18]} />
            <meshStandardMaterial
              color={c.cls === 1 ? '#4a90d9' : '#e07b54'}
              transparent
              opacity={0.7}
            />
          </mesh>
        ))}
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}

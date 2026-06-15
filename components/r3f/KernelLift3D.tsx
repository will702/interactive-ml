'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useState } from 'react';
import * as THREE from 'three';

// Generate data: inner circle (class 0) + outer ring (class 1)
function generateData() {
  const points: { x: number; y: number; label: number }[] = [];
  // class 0: inner circle r < 1.2
  for (let i = 0; i < 20; i++) {
    const r = Math.random() * 1.0;
    const a = Math.random() * Math.PI * 2;
    points.push({ x: r * Math.cos(a), y: r * Math.sin(a), label: 0 });
  }
  // class 1: outer ring 1.5 < r < 2.5
  for (let i = 0; i < 20; i++) {
    const r = 1.5 + Math.random() * 1.0;
    const a = Math.random() * Math.PI * 2;
    points.push({ x: r * Math.cos(a), y: r * Math.sin(a), label: 1 });
  }
  return points;
}

const DATA = generateData();

function Points({ lifted }: { lifted: number }) {
  return (
    <>
      {DATA.map((p, i) => {
        const z = lifted * (p.x * p.x + p.y * p.y) * 0.5;
        return (
          <mesh key={i} position={[p.x, p.y, z]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color={p.label === 0 ? '#e07b54' : '#4a90d9'} />
          </mesh>
        );
      })}
    </>
  );
}

function SeparatingPlane({ visible }: { visible: boolean }) {
  if (!visible) return null;
  const avgZ = DATA.reduce((s, p) => s + (p.x * p.x + p.y * p.y) * 0.5, 0) / DATA.length;
  return (
    <mesh position={[0, 0, avgZ * 0.6]} rotation={[0, 0, 0]}>
      <planeGeometry args={[6, 6]} />
      <meshStandardMaterial color="#aaaaaa" transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function KernelLift3D() {
  const [lifted, setLifted] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  function toggle() {
    const target = lifted === 0 ? 1 : 0;
    if (reducedMotion) {
      setLifted(target);
      return;
    }
    const start = lifted;
    const duration = 800;
    const startTime = performance.now();
    function step(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setLifted(start + (target - start) * eased);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ width: '100%', height: 320, borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--rule)' }}>
        <Canvas camera={{ position: [4, 3, 4], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} intensity={1} />
          <Points lifted={lifted} />
          <SeparatingPlane visible={lifted > 0.5} />
          <OrbitControls enablePan={false} />
        </Canvas>
      </div>
      <button
        onClick={toggle}
        style={{
          alignSelf: 'flex-start',
          padding: '0.4em 1em',
          border: '1px solid var(--rule)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--paper)',
          color: 'var(--ink)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--step--1)',
          cursor: 'pointer',
        }}
      >
        {lifted > 0.5 ? 'Flatten to 2D' : 'Lift to 3D'}
      </button>
    </div>
  );
}

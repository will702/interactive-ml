'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';
import type { Mesh } from 'three';

function Icosahedron({ scrollY }: { scrollY: number }) {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = scrollY * 0.002;
    meshRef.current.rotation.x = scrollY * 0.001;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.5, 1]} />
      <meshStandardMaterial color="#1e2533" wireframe />
    </mesh>
  );
}

export default function AmbientHero() {
  const [scrollY, setScrollY] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqHandler = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', mqHandler);

    const scrollHandler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', scrollHandler, { passive: true });

    return () => {
      mq.removeEventListener('change', mqHandler);
      window.removeEventListener('scroll', scrollHandler);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: 300 }}>
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1} />
        <Icosahedron scrollY={reducedMotion ? 0 : scrollY} />
      </Canvas>
    </div>
  );
}

'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

function generateClusters() {
  const points: { pos: [number, number, number]; cluster: number }[] = [];
  const centers = [[1, 1, 1], [-1, -1, 0], [0, 1, -1]] as const;
  for (let c = 0; c < 3; c++) {
    for (let i = 0; i < 20; i++) {
      points.push({
        pos: [
          centers[c][0] + (Math.random() - 0.5) * 1.2,
          centers[c][1] + (Math.random() - 0.5) * 1.2,
          centers[c][2] + (Math.random() - 0.5) * 1.2,
        ],
        cluster: c,
      });
    }
  }
  return points;
}

const POINTS = generateClusters();
const COLORS = ['#e07b54', '#4a90d9', '#6abf69'];

// Arrow using thin cylinder + cone
function Arrow({ dir, color }: { dir: [number, number, number]; color: string }) {
  const len = Math.sqrt(dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2);
  const direction = new THREE.Vector3(...dir).normalize();

  // Compute rotation to align cylinder with direction
  const axis = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);

  const shaftLen = len * 0.8;
  const headLen = len * 0.2;
  const shaftMid = direction.clone().multiplyScalar(shaftLen / 2);
  const headPos = direction.clone().multiplyScalar(shaftLen + headLen / 2);

  return (
    <>
      {/* Shaft */}
      <mesh position={[shaftMid.x, shaftMid.y, shaftMid.z]} quaternion={quaternion}>
        <cylinderGeometry args={[0.03, 0.03, shaftLen, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Head */}
      <mesh position={[headPos.x, headPos.y, headPos.z]} quaternion={quaternion}>
        <coneGeometry args={[0.08, headLen, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </>
  );
}

export default function PointCloud3D() {
  const points = useMemo(() => POINTS, []);
  return (
    <div style={{ width: '100%', height: 320, borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--rule)' }}>
      <Canvas camera={{ position: [4, 3, 4], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[5, 5, 5]} />
        {points.map((p, i) => (
          <mesh key={i} position={p.pos}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={COLORS[p.cluster]} />
          </mesh>
        ))}
        {/* Principal component arrows */}
        <Arrow dir={[2, 0, 0]} color="#e07b54" />
        <Arrow dir={[0, 2, 0]} color="#4a90d9" />
        <Arrow dir={[0, 0, 2]} color="#6abf69" />
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}

'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Line } from '@react-three/drei';
import * as THREE from 'three';

interface ThreeSceneProps {
  rx: number;
  ry: number;
  rz: number;
  tx: number;
  ty: number;
  tz: number;
}

function Axes() {
  return (
    <group>
      <Line points={[[0, 0, 0], [2, 0, 0]]} color="#94a3b8" lineWidth={1} transparent opacity={0.5} />
      <Line points={[[0, 0, 0], [0, 2, 0]]} color="#94a3b8" lineWidth={1} transparent opacity={0.5} />
      <Line points={[[0, 0, 0], [0, 0, 2]]} color="#94a3b8" lineWidth={1} transparent opacity={0.5} />
    </group>
  );
}

export function ThreeScene({ rx, ry, rz, tx, ty, tz }: ThreeSceneProps) {
  // To visualize the camera extrinsics:
  const rMat = new THREE.Euler(rx, ry, rz, 'XYZ');
  const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(rMat);

  const tVec = new THREE.Vector3(tx, ty, tz);
  const rotMatrixInv = rotMatrix.clone().transpose();

  const camPosWorld = tVec.clone().negate().applyMatrix4(rotMatrixInv);

  return (
    <div className="w-full h-full min-h-0 bg-background rounded-sm overflow-hidden relative border border-slate-100 shadow-inner">
      <Canvas camera={{ position: [5, 5, 5], fov: 45 }} gl={{ alpha: true }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />

        <Axes />

        <Box args={[1, 1, 1]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#1e3a8a" wireframe opacity={0.3} transparent />
          <meshStandardMaterial color="#1e3a8a" transparent opacity={0.05} />
        </Box>

        <group position={camPosWorld} setRotationFromMatrix={rotMatrixInv}>
          <Box args={[0.4, 0.3, 0.6]} position={[0, 0, 0.3]}>
            <meshStandardMaterial color="#475569" />
          </Box>
          <Box args={[0.2, 0.2, 0.4]} position={[0, 0, 0.8]}>
            <meshStandardMaterial color="#1e3a8a" />
          </Box>
        </group>

        <OrbitControls makeDefault />
      </Canvas>
      <p className="absolute bottom-4 left-0 right-0 text-center text-[10px] font-sans font-bold text-slate-300 uppercase tracking-widest pointer-events-none italic">
        Fig. 3.A — Volumetric Cartesian Projection
      </p>
    </div>
  );
}

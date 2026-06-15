'use client';
import React, { useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSimulationTimer } from './SimulationTimer';
import { VirtualCamera } from './VirtualCamera';
import { SimulationRay } from './SimulationRay';
import { Box } from '@react-three/drei';
import * as THREE from 'three';

const CAM1_POS: [number, number, number] = [-3, 1.5, 5];
const CAM1_ROT: [number, number, number] = [0, -0.5, 0];
const CAM2_POS: [number, number, number] = [3, 1.5, 5];
const CAM2_ROT: [number, number, number] = [0, 0.5, 0];

interface SimulationSceneProps {
  mode: string;
  timescale: number;
}

export function SimulationScene({ timescale }: SimulationSceneProps) {
  const { getElapsed } = useSimulationTimer(timescale);
  const [progress, setProgress] = useState(0);

  useFrame(() => {
    // 4 second animation loop
    setProgress((getElapsed() % 4) / 4);
  });

  const cubePoints = useMemo(() => {
    const pts = [];
    for(let x=-0.5; x<=0.5; x+=1)
      for(let y=-0.5; y<=0.5; y+=1)
        for(let z=-0.5; z<=0.5; z+=1)
          pts.push(new THREE.Vector3(x, y, z));
    return pts;
  }, []);

  const rays = useMemo(() => {
    // Create temporary objects for transform logic
    const cam1Obj = new THREE.Object3D();
    cam1Obj.position.set(...CAM1_POS);
    cam1Obj.rotation.set(...CAM1_ROT);
    cam1Obj.updateMatrixWorld();

    const cam2Obj = new THREE.Object3D();
    cam2Obj.position.set(...CAM2_POS);
    cam2Obj.rotation.set(...CAM2_ROT);
    cam2Obj.updateMatrixWorld();

    return cubePoints.map(pt => {
      // Camera 1: Project point onto image plane at z=1 (local)
      const p1Local = pt.clone().applyMatrix4(cam1Obj.matrixWorld.clone().invert());
      // In pinhole model, projection is (x/z, y/z, 1)
      const pixel1Local = new THREE.Vector3(p1Local.x / p1Local.z, p1Local.y / p1Local.z, 1);
      const pixel1World = pixel1Local.clone().applyMatrix4(cam1Obj.matrixWorld);

      // Camera 2
      const p2Local = pt.clone().applyMatrix4(cam2Obj.matrixWorld.clone().invert());
      const pixel2Local = new THREE.Vector3(p2Local.x / p2Local.z, p2Local.y / p2Local.z, 1);
      const pixel2World = pixel2Local.clone().applyMatrix4(cam2Obj.matrixWorld);

      return {
        cam1Pos: new THREE.Vector3(...CAM1_POS),
        pixel1Pos: pixel1World,
        cam2Pos: new THREE.Vector3(...CAM2_POS),
        pixel2Pos: pixel2World,
        target: pt.clone()
      };
    });
  }, [cubePoints]);

  // Phase calculations
  const phase1Progress = Math.min(1, Math.max(0, progress / 0.4));
  const phase2Progress = Math.min(1, Math.max(0, (progress - 0.4) / 0.4));
  const phase3Opacity = Math.min(1, Math.max(0, (progress - 0.8) / 0.2));

  return (
    <group>
      <Box args={[1.05, 1.05, 1.05]} position={[0, 0, 0]}>
        <meshBasicMaterial color="white" wireframe opacity={0.05} transparent />
      </Box>

      <VirtualCamera position={CAM1_POS} rotation={CAM1_ROT} color="#ef4444" />
      <VirtualCamera position={CAM2_POS} rotation={CAM2_ROT} color="#3b82f6" />

      {rays.map((ray, i) => (
        <group key={i}>
          {/* Camera 1 Rays */}
          <SimulationRay
            start={ray.cam1Pos}
            end={ray.pixel1Pos}
            progress={phase1Progress}
            color="#ef4444"
          />
          <SimulationRay
            start={ray.pixel1Pos}
            end={ray.target}
            progress={phase2Progress}
            color="#ef4444"
          />

          {/* Camera 2 Rays */}
          <SimulationRay
            start={ray.cam2Pos}
            end={ray.pixel2Pos}
            progress={phase1Progress}
            color="#3b82f6"
          />
          <SimulationRay
            start={ray.pixel2Pos}
            end={ray.target}
            progress={phase2Progress}
            color="#3b82f6"
          />

          {/* Resultant 3D Point */}
          {phase3Opacity > 0 && (
            <mesh position={ray.target}>
              <sphereGeometry args={[0.04]} />
              <meshBasicMaterial color="white" transparent opacity={phase3Opacity} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

import React from 'react';
import { Box } from '@react-three/drei';

interface VirtualCameraProps {
  position: [number, number, number];
  rotation: [number, number, number];
  color?: string;
}

export function VirtualCamera({ position, rotation, color = "cyan" }: VirtualCameraProps) {
  return (
    <group position={position} rotation={rotation}>
      <Box args={[0.4, 0.3, 0.5]} position={[0, 0, 0.25]}>
        <meshStandardMaterial color="#222" />
      </Box>
      <Box args={[0.2, 0.2, 0.2]} position={[0, 0, 0.6]}>
        <meshStandardMaterial color="#444" />
      </Box>
      <mesh position={[0, 0, 1]}>
        <planeGeometry args={[1, 0.75]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} wireframe />
      </mesh>
    </group>
  );
}

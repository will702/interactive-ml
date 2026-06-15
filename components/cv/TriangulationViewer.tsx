'use client';

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder } from '@react-three/drei';
import { ImageUploader } from './ImageUploader';
import { computeTriangulation } from '@/lib/cv/api';
import { Box as BoxIcon, Loader2, Globe, Video } from 'lucide-react';

export function TriangulationViewer() {
  const [image1, setImage1] = useState<string | null>('/left01.jpg');
  const [image2, setImage2] = useState<string | null>('/right01.jpg');
  const [points3D, setPoints3D] = useState<number[][] | null>(null);
  const [cam2Pos, setCam2Pos] = useState<number[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTriangulate = async () => {
    if (!image1 || !image2) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await computeTriangulation(image1, image2, 3000, 0.75, 1.0);
      setPoints3D(res.points_3d);
      setCam2Pos(res.cam2_pos);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <ImageUploader label="Stereo Primary" currentImage={image1} onImageUpload={setImage1} />
        <ImageUploader label="Stereo Secondary" currentImage={image2} onImageUpload={setImage2} />
      </div>

      <div className="flex flex-col items-center">
        <button
          onClick={handleTriangulate}
          disabled={isProcessing || !image1 || !image2}
          className="group relative flex items-center gap-3 px-10 py-4 bg-indigo-900 hover:bg-indigo-950 text-white font-sans font-bold uppercase tracking-[0.2em] text-[10px] rounded-sm transition-all shadow-md active:scale-95 disabled:opacity-30"
        >
          {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <Video size={14} />}
          {isProcessing ? 'Processing Reconstruction...' : 'Initiate 3D Triangulation'}
        </button>
        {error && <p className="text-rose-900 mt-6 font-sans font-bold text-[10px] bg-rose-50 px-6 py-3 border border-rose-100 uppercase tracking-widest">{error}</p>}
      </div>

      {points3D && cam2Pos ? (() => {
        const pts = points3D.map(([x, y, z]) => [x, -y, z]);
        const c2 = [cam2Pos[0], -cam2Pos[1], cam2Pos[2]];

        const centroid = pts.length > 0
          ? pts.reduce((a, p) => [a[0]+p[0], a[1]+p[1], a[2]+p[2]], [0,0,0])
              .map(v => v / pts.length)
          : [0, 0, 5];
        const extent = pts.length > 0
          ? Math.max(2, ...pts.map(p =>
              Math.hypot(p[0]-centroid[0], p[1]-centroid[1], p[2]-centroid[2])))
          : 5;

        const camScale = Math.max(0.2, extent * 0.05);

        const camPos: [number,number,number] = [
          centroid[0],
          centroid[1] + extent * 0.8,
          centroid[2] - extent * 2,
        ];

        return (
          <div className="w-full h-[600px] bg-[#FDFCFB] rounded-sm relative overflow-hidden border border-slate-100 shadow-inner group">
            <Canvas camera={{ position: camPos, fov: 50 }} gl={{ alpha: true }}>
              <ambientLight intensity={1.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <pointLight position={[-10, -10, -10]} intensity={0.5} />

              {pts.length > 0 && (
                <points>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      args={[new Float32Array(pts.flat()), 3]}
                    />
                  </bufferGeometry>
                  <pointsMaterial size={2} color="#1e3a8a" sizeAttenuation={false} transparent opacity={0.4} />
                </points>
              )}

              {/* Camera 1 — origin */}
              <group position={[0, 0, 0]}>
                <Box args={[camScale, camScale * 0.6, camScale * 0.8]}>
                  <meshStandardMaterial color="#94a3b8" />
                </Box>
                <Cylinder args={[camScale * 0.3, camScale * 0.3, camScale * 0.4, 32]} rotation={[Math.PI/2, 0, 0]} position={[0, 0, camScale * 0.5]}>
                  <meshStandardMaterial color="#94a3b8" />
                </Cylinder>
              </group>

              {/* Camera 2 — estimated */}
              <group position={[c2[0], c2[1], c2[2]]}>
                <Box args={[camScale, camScale * 0.6, camScale * 0.8]}>
                  <meshStandardMaterial color="#1e3a8a" />
                </Box>
                <Cylinder args={[camScale * 0.3, camScale * 0.3, camScale * 0.4, 32]} rotation={[Math.PI/2, 0, 0]} position={[0, 0, camScale * 0.5]}>
                  <meshStandardMaterial color="#1e3a8a" />
                </Cylinder>
              </group>

              <OrbitControls makeDefault target={centroid as [number,number,number]} />
            </Canvas>

            <div className="absolute top-8 left-8 flex flex-col gap-3 pointer-events-none">
              <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-md rounded-sm border border-slate-100 text-[9px] font-sans font-bold uppercase tracking-widest text-slate-400 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                Reference Pose
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-md rounded-sm border border-slate-100 text-[9px] font-sans font-bold uppercase tracking-widest text-indigo-900 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-900" />
                Recovered Pose
              </div>
            </div>

            <div className="absolute bottom-8 left-0 w-full flex justify-center pointer-events-none px-8 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="bg-white/90 backdrop-blur-2xl px-8 py-4 rounded-full border border-slate-100 flex items-center gap-6 text-slate-400 shadow-xl">
                 <div className="flex items-center gap-3">
                   <Globe size={14} className="text-indigo-900/40" />
                   <span className="text-[10px] font-sans font-bold uppercase tracking-widest">{pts.length} Point Cloud Correspondences</span>
                 </div>
                 <div className="w-px h-4 bg-slate-200" />
                 <span className="text-[8px] font-sans font-bold tracking-widest italic uppercase">Rotate · Zoom · Pan</span>
               </div>
            </div>

            <div className="absolute bottom-8 right-8 text-[9px] font-sans font-bold text-slate-200 uppercase tracking-widest pointer-events-none italic">
              Fig. 4.C — Epipolar Point Reconstruction
            </div>
          </div>
        );
      })() : (
        <div className="w-full h-[600px] bg-[#F9F8F6] rounded-sm border border-slate-100 flex flex-col items-center justify-center gap-8 text-slate-300 shadow-inner relative overflow-hidden">
           <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none grayscale"
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
           <div className="relative z-10 flex flex-col items-center gap-6">
             <BoxIcon size={64} strokeWidth={0.5} className="opacity-10" />
             {isProcessing && (
               <div className="absolute inset-0 flex items-center justify-center">
                 <Loader2 className="animate-spin text-indigo-900/20" size={32} />
               </div>
             )}
             <p className="font-sans font-bold uppercase tracking-[0.4em] text-[9px] opacity-40 italic">Awaiting Stereo Epipolar Geometry</p>
           </div>
        </div>
      )}
    </div>
  );
}

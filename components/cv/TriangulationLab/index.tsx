'use client';

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { SimulationScene } from './SimulationScene';

export function TriangulationLab() {
  const [mode, setMode] = useState<'synthetic' | 'real'>('synthetic');
  const [timescale, setTimescale] = useState(1.0);

  return (
    <div className="flex flex-col h-[600px] w-full bg-white border border-slate-100 shadow-sm rounded-sm overflow-hidden relative group">
      <div className="flex items-center justify-between p-6 border-b border-slate-50 bg-[#FDFCFB]">
        <div className="flex gap-4">
          <button
            onClick={() => setMode('synthetic')}
            className={`px-4 py-1.5 rounded-sm text-[10px] font-sans font-bold uppercase tracking-[0.2em] transition-all ${mode === 'synthetic' ? 'bg-indigo-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Synthetic
          </button>
          <button
            onClick={() => setMode('real')}
            className={`px-4 py-1.5 rounded-sm text-[10px] font-sans font-bold uppercase tracking-[0.2em] transition-all ${mode === 'real' ? 'bg-indigo-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Empirical
          </button>
        </div>
        <div className="flex items-center gap-6">
          <label className="text-[10px] font-sans font-bold text-slate-300 uppercase tracking-widest italic">Temporal Scale: {timescale.toFixed(1)}x</label>
          <input
            type="range" min="0" max="2" step="0.1" value={timescale}
            onChange={(e) => setTimescale(parseFloat(e.target.value))}
            className="w-32 h-px bg-slate-200 appearance-none cursor-pointer accent-indigo-900"
          />
        </div>
      </div>

      <div className="flex-1 relative">
        <Canvas camera={{ position: [5, 5, 5], fov: 50 }} gl={{ alpha: true }}>
          <ambientLight intensity={1} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <Grid infiniteGrid fadeDistance={20} cellColor="#e2e8f0" sectionColor="#cbd5e1" />

          <SimulationScene mode={mode} timescale={timescale} />

          <OrbitControls makeDefault />
        </Canvas>
        <div className="absolute bottom-6 left-6 text-slate-300 text-[9px] font-sans font-bold uppercase tracking-[0.3em] pointer-events-none italic">
          Fig. 4.B — Ray-Intersection Simulation
        </div>
      </div>
    </div>
  );
}

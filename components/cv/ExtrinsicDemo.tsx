'use client';

import React, { useState, useEffect } from 'react';
import katex from 'katex';
import { SliderPanel } from './SliderPanel';
import { ProjectionCanvas } from './ProjectionCanvas';
import { ThreeScene } from './ThreeScene';
import { useCvStore } from '@/lib/cv/cvStore';
import { Rotate3d, Play, Pause } from 'lucide-react';

export function ExtrinsicDemo() {
  const extrinsic = useCvStore(state => state.extrinsic);
  const setExtrinsic = useCvStore(state => state.setExtrinsic);
  const { rx, ry, rz, tx, ty, tz } = extrinsic;
  const [autoOrbit, setAutoOrbit] = useState(false);

  // Fixed intrinsic for extrinsic demo
  const fx = 400, fy = 400, cx = 320, cy = 240;

  useEffect(() => {
    let frameId: number;
    if (autoOrbit) {
      const update = () => {
        setExtrinsic(prev => ({ ry: (prev.ry + 0.02) % (Math.PI * 2) }));
        frameId = requestAnimationFrame(update);
      };
      frameId = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(frameId);
  }, [autoOrbit, setExtrinsic]);

  const extrinsicLatex = `t = \\begin{bmatrix} \\color{#1E3A8A}{${tx.toFixed(1)}} \\\\ \\color{#1E3A8A}{${ty.toFixed(1)}} \\\\ \\color{#1E3A8A}{${tz.toFixed(1)}} \\end{bmatrix}`;

  return (
    <div className="space-y-4">
      {/* Dual simulation — full width, hero focus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-sm overflow-hidden border border-slate-200 shadow-xl bg-white relative group w-full aspect-[4/3] md:aspect-[16/10] min-h-[360px]">
           <ThreeScene rx={rx} ry={ry} rz={rz} tx={tx} ty={ty} tz={tz} />
           <div className="absolute top-4 left-4 font-sans text-[8px] font-bold text-slate-300 uppercase tracking-widest pointer-events-none z-10">
             Euclidean Space // View A
           </div>
        </div>
        <div className="relative flex items-center justify-center bg-white rounded-sm border border-slate-200 p-4 sm:p-6 overflow-hidden shadow-xl w-full aspect-[4/3] md:aspect-[16/10] min-h-[360px]">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none grayscale"
               style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
          <ProjectionCanvas
            fx={fx} fy={fy} cx={cx} cy={cy}
            rx={rx} ry={ry} rz={rz} tx={tx} ty={ty} tz={tz}
          />
          <div className="absolute top-4 left-4 font-sans text-[8px] font-bold text-slate-300 uppercase tracking-widest pointer-events-none z-10">
             Image Plane // View B
           </div>
        </div>
      </div>

      {/* Controls — compact strip below */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        <div className="p-3 bg-white border border-slate-100 shadow-sm rounded-sm relative overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-[0.01] pointer-events-none grayscale"
               style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
          <h4 className="relative z-10 text-[8px] font-sans font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Translation Vector</h4>
          <div className="relative z-10 flex justify-center p-1.5 bg-[#F9F8F6] border border-slate-50 rounded-sm [&_.katex]:text-[0.5rem] [&_.katex-display]:my-0">
            <div dangerouslySetInnerHTML={{ __html: katex.renderToString(extrinsicLatex, { throwOnError: false, displayMode: true }) }} />
          </div>
          <button
            onClick={() => setAutoOrbit(!autoOrbit)}
            aria-label={autoOrbit ? 'Pause auto-orbit' : 'Start auto-orbit'}
            className={`w-full mt-3 min-h-9 px-3 py-2 rounded-sm font-sans font-bold uppercase tracking-[0.14em] text-[8px] leading-tight text-center flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer
              ${autoOrbit
                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                : 'bg-indigo-900 text-white hover:bg-indigo-950'}`}
          >
            {autoOrbit ? <Pause size={12} /> : <Play size={12} />}
            {autoOrbit ? 'Pause' : 'Auto-Orbit'}
            <Rotate3d size={12} className={autoOrbit ? 'animate-spin' : ''} />
          </button>
        </div>

        <SliderPanel
          title="Rotation [R]"
          compact
          sliders={[
            { label: 'Pitch (Rx)', min: -Math.PI, max: Math.PI, step: 0.1, value: rx, onChange: (v) => setExtrinsic({ rx: v }) },
            { label: 'Yaw (Ry)', min: -Math.PI, max: Math.PI, step: 0.1, value: ry, onChange: (v) => setExtrinsic({ ry: v }) },
            { label: 'Roll (Rz)', min: -Math.PI, max: Math.PI, step: 0.1, value: rz, onChange: (v) => setExtrinsic({ rz: v }) },
          ]}
        />
        <SliderPanel
          title="Translation [t]"
          compact
          sliders={[
            { label: 'X Position', min: -5, max: 5, step: 0.1, value: tx, onChange: (v) => setExtrinsic({ tx: v }) },
            { label: 'Y Position', min: -5, max: 5, step: 0.1, value: ty, onChange: (v) => setExtrinsic({ ty: v }) },
            { label: 'Z Position', min: 1, max: 10, step: 0.1, value: tz, onChange: (v) => setExtrinsic({ tz: v }) },
          ]}
        />
      </div>

      <p className="text-[10px] text-center font-sans font-bold text-slate-300 uppercase tracking-widest pt-2">
        Plate 3.2 — Spatial Rigid Body Transformation and Euclidean Projections
      </p>
    </div>
  );
}

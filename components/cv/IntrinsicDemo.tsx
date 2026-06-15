'use client';

import React from 'react';
import katex from 'katex';
import { SliderPanel } from './SliderPanel';
import { ProjectionCanvas } from './ProjectionCanvas';
import { useCvStore } from '@/lib/cv/cvStore';

export function IntrinsicDemo() {
  const intrinsic = useCvStore(state => state.intrinsic);
  const setIntrinsic = useCvStore(state => state.setIntrinsic);
  const { fx, fy, cx, cy, skew } = intrinsic ?? { fx: 400, fy: 400, cx: 320, cy: 240, skew: 0 };

  // Fixed extrinsic for the intrinsic demo
  const rx = 0.5, ry = 0.5, rz = 0;
  const tx = 0, ty = 0, tz = 3;

  const kMatrixLatex = `K = \\begin{bmatrix} \\color{#1E3A8A}{${fx.toFixed(1)}} & ${skew.toFixed(1)} & ${cx.toFixed(1)} \\\\ 0 & \\color{#1E3A8A}{${fy.toFixed(1)}} & ${cy.toFixed(1)} \\\\ 0 & 0 & 1 \\end{bmatrix}`;

  return (
    <div className="space-y-4">
      {/* Simulation — full width, hero focus */}
      <div className="relative flex justify-center bg-white rounded-sm p-6 sm:p-10 border border-slate-200 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] min-h-[520px] lg:min-h-[620px]">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none grayscale"
             style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
        <ProjectionCanvas
          fx={fx} fy={fy} cx={cx} cy={cy} skew={skew}
          rx={rx} ry={ry} rz={rz} tx={tx} ty={ty} tz={tz}
        />
      </div>

      {/* Controls — compact strip below */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="p-3 bg-white border border-slate-100 shadow-sm rounded-sm relative overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-[0.01] pointer-events-none grayscale"
               style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
          <h4 className="relative z-10 text-[8px] font-sans font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Matrix K</h4>
          <div className="relative z-10 flex justify-center p-1.5 bg-[#F9F8F6] border border-slate-50 rounded-sm overflow-x-auto [&_.katex]:text-[0.5rem] [&_.katex-display]:my-0">
            <div dangerouslySetInnerHTML={{ __html: katex.renderToString(kMatrixLatex, { throwOnError: false, displayMode: true }) }} />
          </div>
        </div>

        <SliderPanel
          title="Projection Control"
          compact
          sliders={[
            { label: 'Focal X (fx)', min: 100, max: 1000, step: 10, value: fx, onChange: (v) => setIntrinsic({ fx: v }) },
            { label: 'Focal Y (fy)', min: 100, max: 1000, step: 10, value: fy, onChange: (v) => setIntrinsic({ fy: v }) },
            { label: 'Center X (cx)', min: 0, max: 640, step: 10, value: cx, onChange: (v) => setIntrinsic({ cx: v }) },
            { label: 'Center Y (cy)', min: 0, max: 480, step: 10, value: cy, onChange: (v) => setIntrinsic({ cy: v }) },
            { label: 'Skew', min: -5, max: 5, step: 0.1, value: skew, onChange: (v) => setIntrinsic({ skew: v }) },
          ]}
        />

        <div className="p-3 rounded-sm bg-indigo-50 border border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none grayscale"
               style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
          <p className="relative z-10 text-[8px] font-sans font-bold uppercase tracking-widest text-indigo-900/60 mb-2 italic">Geometric Note</p>
          <p className="relative z-10 text-xs text-slate-700 font-serif leading-relaxed italic">
            The intrinsic matrix defines the mapping between camera-centric rays and the discretized pixel grid.
          </p>
        </div>
      </div>

      <p className="text-[10px] text-center font-sans font-bold text-slate-300 uppercase tracking-widest pt-2">
        Plate 3.1 — Variations in Intrinsic Scale and Perspective
      </p>
    </div>
  );
}

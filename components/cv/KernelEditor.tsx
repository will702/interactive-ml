'use client';

import React, { useState } from 'react';
import { KERNELS, KernelMatrix } from '@/lib/cv/kernels';
import { ChevronDown } from 'lucide-react';

interface KernelEditorProps {
  kernel: KernelMatrix;
  onChange: (kernel: KernelMatrix) => void;
}

export function KernelEditor({ kernel, onChange }: KernelEditorProps) {
  const [preset, setPreset] = useState<string>('Custom');

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setPreset(name);
    if (KERNELS[name]) {
      onChange(KERNELS[name]);
    }
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const parsed = parseFloat(value);
    const val = isNaN(parsed) ? 0 : parsed;

    const newKernel = kernel.map((row, r) =>
      row.map((cell, c) => (r === rowIndex && c === colIndex ? val : cell))
    );

    setPreset('Custom');
    onChange(newKernel);
  };

  return (
    <div className="bg-[#F9F8F6] border border-slate-200 p-8 rounded-sm flex flex-col items-center shadow-sm w-full relative overflow-hidden">
      {/* Texture Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none grayscale"
           style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />

      <div className="mb-8 w-full relative z-10">
        <label className="block text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Operator Preset</label>
        <div className="relative">
          <select
            value={preset}
            onChange={handlePresetChange}
            className="w-full p-3 pr-10 border border-slate-200 rounded-sm bg-white text-slate-900 font-sans font-bold text-[10px] uppercase tracking-[0.2em] appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-900 transition-all shadow-sm"
          >
            <option value="Custom">Custom Operator</option>
            {Object.keys(KERNELS).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
        </div>
      </div>

      <div className="relative z-10 inline-block bg-white p-2 rounded-sm shadow-sm border border-slate-100">
        <div className="flex flex-col gap-2">
          {kernel.map((row, r) => (
            <div key={r} className="flex gap-2">
              {row.map((cell, c) => (
                <input
                  key={`${r}-${c}`}
                  type="number"
                  step="any"
                  value={Number(cell.toFixed(4))}
                  onChange={(e) => handleCellChange(r, c, e.target.value)}
                  className="w-14 h-14 md:w-16 md:h-14 text-center rounded-sm bg-[#FDFCFB] text-slate-900 font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-900 transition-all border border-slate-100 hover:border-slate-300"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="relative z-10 mt-6 text-[9px] font-sans font-bold text-slate-300 uppercase tracking-widest italic">Linear Transformation Grid</p>
    </div>
  );
}

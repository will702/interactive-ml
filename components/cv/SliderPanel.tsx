'use client';

import React, { useId } from 'react';

export interface SliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
}

interface SliderPanelProps {
  sliders: SliderProps[];
  title?: string;
  compact?: boolean;
}

export function SliderPanel({ sliders, title, compact }: SliderPanelProps) {
  const baseId = useId();

  return (
    <div className={`${compact ? 'p-3 space-y-3' : 'p-8 space-y-8'} bg-white border border-slate-100 shadow-sm rounded-sm relative overflow-hidden`}>
      {/* Texture Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.01] pointer-events-none grayscale"
           style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />

      {title && (
        <h3 className={`relative z-10 font-serif text-slate-900 font-medium italic tracking-tight border-b border-slate-50 ${compact ? 'text-sm pb-2' : 'text-lg pb-4'}`}>
          {title}
        </h3>
      )}
      <div className={`relative z-10 ${compact ? 'space-y-3' : 'space-y-8'}`}>
        {sliders.map((slider, idx) => {
          const id = `${baseId}-${idx}`;
          return (
            <div key={slider.label} className={`flex flex-col ${compact ? 'space-y-1.5' : 'space-y-4'}`}>
              <div className="flex justify-between items-center px-1">
                <label
                  htmlFor={id}
                  className={`font-sans font-bold text-slate-400 uppercase cursor-pointer ${compact ? 'text-[8px] tracking-[0.15em]' : 'text-[10px] tracking-[0.2em]'}`}
                >
                  {slider.label}
                </label>
                <span className={`font-mono font-bold bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-sm ${compact ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-3 py-1'}`}>
                  {slider.value.toFixed(slider.step && slider.step < 1 ? 2 : 1)}
                </span>
              </div>
              <div className={`relative flex items-center px-1 ${compact ? 'h-4' : 'h-6'}`}>
                <input
                  id={id}
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  step={slider.step || 1}
                  value={slider.value}
                  aria-label={slider.label}
                  onChange={(e) => slider.onChange(parseFloat(e.target.value))}
                  className="w-full h-px bg-slate-200 appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                            [&::-webkit-slider-thumb]:bg-indigo-900 [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md
                            [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform
                            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                            [&::-moz-range-thumb]:bg-indigo-900 [&::-moz-range-thumb]:rounded-full
                            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md
                            [&::-moz-range-thumb]:hover:scale-125 [&::-moz-range-thumb]:transition-transform"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

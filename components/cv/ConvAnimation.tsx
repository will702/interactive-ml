'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, Settings2 } from 'lucide-react';
import { KERNELS } from '@/lib/cv/kernels';

const INPUT_SIZE = 6;

const INITIAL_IMAGE = [
  [0, 0, 0, 0, 0, 0],
  [0, 255, 255, 255, 0, 0],
  [0, 255, 0, 255, 0, 0],
  [0, 255, 255, 255, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
];

export function ConvAnimation() {
  const [kernelName, setKernelName] = useState('Sobel X');
  const kernel = useMemo(() => KERNELS[kernelName], [kernelName]);
  const kernelSize = kernel.length;
  const radius = Math.floor(kernelSize / 2);

  const [stepX, setStepX] = useState(0);
  const [stepY, setStepY] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [output, setOutput] = useState<number[][]>(Array(INPUT_SIZE).fill(0).map(() => Array(INPUT_SIZE).fill(0)));

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const calculateStep = React.useCallback(() => {
    let sum = 0;
    for (let ky = 0; ky < kernelSize; ky++) {
      for (let kx = 0; kx < kernelSize; kx++) {
        const iy = stepY + ky - radius;
        const ix = stepX + kx - radius;

        const val = (iy >= 0 && iy < INPUT_SIZE && ix >= 0 && ix < INPUT_SIZE)
            ? INITIAL_IMAGE[iy][ix]
            : 0;
        sum += val * kernel[ky][kx];
      }
    }

    const kernelSum = kernel.flat().reduce((a, b) => a + b, 0);
    const delta = Math.abs(kernelSum) < 0.01 ? 128 : 0;

    setOutput(prev => {
      const next = prev.map(row => [...row]);
      next[stepY][stepX] = Math.min(255, Math.max(0, sum + delta));
      return next;
    });
  }, [stepX, stepY, kernel, kernelSize, radius]);

  const nextStep = React.useCallback(() => {
    calculateStep();
    setStepX(prev => {
      if (prev + 1 >= INPUT_SIZE) {
        setStepY(py => {
          if (py + 1 >= INPUT_SIZE) {
            setIsPlaying(false);
            return 0;
          }
          return py + 1;
        });
        return 0;
      }
      return prev + 1;
    });
  }, [calculateStep]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        nextStep();
      }, 400);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, nextStep]);

  const reset = () => {
    setIsPlaying(false);
    setStepX(0);
    setStepY(0);
    setOutput(Array(INPUT_SIZE).fill(0).map(() => Array(INPUT_SIZE).fill(0)));
  };

  const handleKernelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setKernelName(e.target.value);
    reset();
  };

  const getCellColor = (val: number) => `rgb(${val}, ${val}, ${val})`;
  const getCellTextColor = (val: number) => val > 128 ? 'text-slate-900' : 'text-white';

  return (
    <div className="flex flex-col items-center space-y-10 p-10 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Settings2 size={120} strokeWidth={1} />
      </div>

      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 z-10">
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
           <span className="pl-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Selected Kernel</span>
           <select
             value={kernelName}
             onChange={handleKernelChange}
             className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
           >
             {Object.keys(KERNELS).map(name => (
               <option key={name} value={name}>{name}</option>
             ))}
           </select>
        </div>

        <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all duration-200 shadow-md
              ${isPlaying
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'}`}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={nextStep}
            disabled={isPlaying}
            className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 border border-slate-200 dark:border-slate-700 transition-all shadow-sm"
          >
            <ChevronRight size={14} />
            Step
          </button>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1" />
          <button
            onClick={reset}
            className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
            title="Reset Animation"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-start justify-center w-full relative">
        {/* Input Matrix */}
        <div className="flex flex-col items-center">
          <h3 className="mb-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Input Image</h3>
          <div className="grid grid-cols-6 gap-px bg-slate-200 dark:bg-slate-700 p-1.5 rounded-[2rem] overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800">
            {INITIAL_IMAGE.map((row, y) =>
              row.map((val, x) => {
                const isUnderKernel =
                  y >= stepY - radius && y <= stepY + radius &&
                  x >= stepX - radius && x <= stepX + radius;

                return (
                  <div
                    key={`${y}-${x}`}
                    className={`w-12 h-12 flex items-center justify-center text-[10px] font-mono transition-all duration-300
                      ${isUnderKernel ? 'ring-2 ring-indigo-500 ring-inset z-10 bg-indigo-50/50' : ''}`}
                    style={{ backgroundColor: getCellColor(val) }}
                  >
                    <span className={`${getCellTextColor(val)} ${isUnderKernel ? 'font-black scale-125' : 'opacity-40'}`}>{val}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Kernel */}
        <div className="flex flex-col items-center justify-center lg:h-[320px]">
          <h3 className="mb-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Kernel</h3>
          <div
            className="grid gap-1 bg-slate-100 dark:bg-slate-800 p-3 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 shadow-xl"
            style={{ gridTemplateColumns: `repeat(${kernelSize}, minmax(0, 1fr))` }}
          >
            {kernel.map((row, y) =>
              row.map((val, x) => (
                <div key={`${y}-${x}`} className="w-10 h-10 flex items-center justify-center text-[10px] font-mono font-black border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg shadow-sm">
                  {val % 1 === 0 ? val : val.toFixed(2)}
                </div>
              ))
            )}
          </div>
          <div className="mt-6 text-slate-300 dark:text-slate-700 animate-bounce">
            <ChevronRight size={32} className="rotate-90 lg:rotate-0" />
          </div>
        </div>

        {/* Output Matrix */}
        <div className="flex flex-col items-center">
          <h3 className="mb-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Feature Map</h3>
          <div className="grid grid-cols-6 gap-px bg-slate-200 dark:bg-slate-700 p-1.5 rounded-[2rem] overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800">
            {output.map((row, y) =>
              row.map((val, x) => {
                const isActive = y === stepY && x === stepX;
                const isComputed = y < stepY || (y === stepY && x < stepX);

                return (
                  <div
                    key={`${y}-${x}`}
                    className={`w-12 h-12 flex items-center justify-center text-[10px] font-mono transition-all duration-300
                      ${isActive ? 'ring-2 ring-cyan-500 ring-inset z-10 bg-cyan-50/50' : ''}`}
                    style={{ backgroundColor: isComputed || isActive ? getCellColor(val) : 'transparent' }}
                  >
                    <span className={isComputed || isActive ? getCellTextColor(val) : 'text-slate-300 dark:text-slate-700 opacity-20'}>
                      {isComputed || isActive ? Math.round(val) : '·'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="w-full bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
               State: {isPlaying ? 'Sliding Window...' : 'Engine Paused'}
            </span>
         </div>
         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Scanning Pixel ({stepX}, {stepY})
         </div>
      </div>
    </div>
  );
}

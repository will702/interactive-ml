'use client';

import React from 'react';
import katex from 'katex';

interface Props {
  latex: string;
  title?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function FloatingFormula({ latex, title, position = 'top-right' }: Props) {
  const positionClasses = {
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} glass p-5 rounded-[2rem] w-[280px] max-w-[calc(100%-3rem)] z-10 shadow-2xl pointer-events-none select-none hidden md:block border border-white/20 dark:border-white/10`}
      aria-live="polite"
      role="region"
      aria-label={title || "Mathematical formula"}
    >
      {title && (
        <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 text-indigo-600 dark:text-indigo-400 opacity-80">
          {title}
        </h4>
      )}
      <div className="text-lg flex justify-center items-center min-h-[60px] bg-slate-900/5 dark:bg-white/5 rounded-2xl p-3 overflow-x-auto">
        <span dangerouslySetInnerHTML={{ __html: katex.renderToString(latex, { throwOnError: false }) }} />
      </div>
    </div>
  );
}

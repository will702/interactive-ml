import React from 'react';
import { BookMarked, Info, AlertCircle } from 'lucide-react';

interface Props {
  title: string;
  children: React.ReactNode;
  type?: 'tip' | 'info' | 'warning';
}

export function Callout({ title, children, type = 'tip' }: Props) {
  const styles = {
    tip: 'bg-[#F9F7F2] border-t border-t-[#B45309] text-slate-800',
    info: 'bg-[#F0F4F8] border-t border-t-[#3B82F6] text-slate-800',
    warning: 'bg-[#FFF0F0] border-t border-t-rose-600 text-slate-800',
  };

  const Icons = {
    tip: BookMarked,
    info: Info,
    warning: AlertCircle,
  };

  const Icon = Icons[type];

  return (
    <div className={`p-8 rounded-sm ${styles[type]} space-y-4 my-12 shadow-[0_4px_12px_rgba(0,0,0,0.02)] relative overflow-hidden`}>
      <div className="flex items-center gap-3 font-sans font-bold uppercase tracking-[0.2em] text-[10px] opacity-60">
        <Icon size={14} className="shrink-0" />
        <span>Annotation // {title}</span>
      </div>
      <div className="text-base leading-relaxed font-serif italic text-slate-700">
        {children}
      </div>
      {/* Decorative texture overlay for callout */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none grayscale"
           style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
    </div>
  );
}

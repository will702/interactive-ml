import React from 'react';

interface LessonSectionProps {
  title?: React.ReactNode;
  children: React.ReactNode;
}

export function LessonSection({ title, children }: LessonSectionProps) {
  return (
    <section className="mb-24 max-w-4xl">
      {title && (
        <div className="mb-10">
          <h2 className="text-4xl font-serif font-medium tracking-tight text-slate-900 italic leading-tight [text-wrap:balance]">
            {title}
          </h2>
          <div className="h-px w-full bg-slate-200 mt-8" />
        </div>
      )}
      <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-lg font-serif selection:bg-indigo-100">
        {children}
      </div>
    </section>
  );
}

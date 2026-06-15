'use client';
import { ReactNode } from 'react';

interface SandboxPanelProps {
  title?: string;
  controls: ReactNode;
  viz: ReactNode;
}

export default function SandboxPanel({ title = 'Try it yourself', controls, viz }: SandboxPanelProps) {
  return (
    <div style={{
      border: '1px solid var(--rule)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      margin: '2rem 0',
    }}>
      {title && (
        <div style={{
          padding: '0.6rem 1rem',
          borderBottom: '1px solid var(--rule)',
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--step--1)',
          color: 'var(--ink-soft)',
        }}>
          {title}
        </div>
      )}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(180px, 240px) 1fr',
        minHeight: 280,
      }}>
        <div style={{
          borderRight: '1px solid var(--rule)',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          {controls}
        </div>
        <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {viz}
        </div>
      </div>
    </div>
  );
}

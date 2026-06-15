'use client';

interface SelectProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}

export default function Select({ label, options, value, onChange }: SelectProps) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: 'var(--step--1)', fontFamily: 'var(--font-body)', color: 'var(--ink-soft)' }}>
      <span>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          border: '1px solid var(--rule)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.3em 0.5em',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--step--1)',
          background: 'var(--paper)',
          color: 'var(--ink)',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

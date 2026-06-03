import { ReactNode, useState } from 'react'

interface PlaygroundProps {
  children: (reset: number) => ReactNode
  label?: string
}

export default function Playground({ children, label = 'Playground' }: PlaygroundProps) {
  const [resetKey, setResetKey] = useState(0)

  return (
    <div style={{ margin: '2rem 0', border: '1px solid var(--rule)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 1rem', borderBottom: '1px solid var(--rule)', fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)' }}>
        <span>{label}</span>
        <button
          onClick={() => setResetKey(k => k + 1)}
          style={{ background: 'none', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.6rem', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', transition: 'border-color 0.15s' }}
        >
          Reset
        </button>
      </div>
      <div style={{ padding: '1.5rem' }}>
        {children(resetKey)}
      </div>
    </div>
  )
}

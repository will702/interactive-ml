'use client'

interface CodeDrawerProps {
  code: string
  label?: string
}

export default function CodeDrawer({ code, label = 'Python (sklearn)' }: CodeDrawerProps) {
  return (
    <details style={{ margin: '1.5rem 0', border: '1px solid var(--rule)', borderRadius: 'var(--radius)' }}>
      <summary style={{ padding: '0.625rem 1rem', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ transition: 'transform 0.2s' }}>&#9654;</span>
        {label}
      </summary>
      <pre style={{ margin: 0, padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', lineHeight: 1.6, overflowX: 'auto', borderTop: '1px solid var(--rule)', background: 'var(--rule)' }}>
        <code>{code}</code>
      </pre>
    </details>
  )
}

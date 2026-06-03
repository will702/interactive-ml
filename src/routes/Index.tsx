import { Link } from 'react-router-dom'
import Chapter from '../components/Chapter'

export default function Index() {
  return (
    <Chapter title="ML Study" subtitle="Sessions 15–22 · BINUS University">
      <nav style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
        {[
          { to: '/trees', label: 'Decision Tree & Ensemble Learning', sessions: '15–16' },
          { to: '/svm', label: 'Support Vector Machine', sessions: '17–18' },
          { to: '/clustering', label: 'Clustering', sessions: '19–20' },
          { to: '/dimred', label: 'Dimensionality Reduction', sessions: '21–22' },
        ].map(ch => (
          <Link key={ch.to} to={ch.to} style={{ display: 'block', padding: '1.25rem 1.5rem', border: '1px solid var(--rule)', borderRadius: 'var(--radius)', textDecoration: 'none', fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            <div style={{ fontSize: 'var(--step--1)', color: 'var(--ink-soft)', marginBottom: '0.25rem' }}>Sessions {ch.sessions}</div>
            <div style={{ fontSize: 'var(--step-1)', fontWeight: 500 }}>{ch.label}</div>
          </Link>
        ))}
      </nav>
    </Chapter>
  )
}

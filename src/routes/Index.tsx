import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

// ─── Completion Ring ─────────────────────────────────────────────────────────

function CompletionRing({ route }: { route: string }) {
  const [pct, setPct] = useState(() => {
    const stored = localStorage.getItem(`progress:${route}`)
    return stored ? Math.min(1, parseFloat(stored)) : 0
  })

  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem(`progress:${route}`)
      setPct(stored ? Math.min(1, parseFloat(stored)) : 0)
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [route])

  const R = 14, CX = 16, CY = 16
  const circ = 2 * Math.PI * R
  const dash = pct * circ

  return (
    <svg
      width={32}
      height={32}
      aria-label={`${Math.round(pct * 100)}% complete`}
      style={{ display: 'block' }}
    >
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--rule)" strokeWidth={2} />
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke={pct > 0 ? 'var(--accent)' : 'transparent'}
        strokeWidth={2}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${CX} ${CY})`}
      />
    </svg>
  )
}

// ─── Chapter Icons ────────────────────────────────────────────────────────────

function TreeIcon() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* root node */}
      <circle cx={16} cy={6} r={3} stroke="var(--ink-soft)" strokeWidth={1.5} />
      {/* left branch + leaf */}
      <line x1={16} y1={9} x2={9} y2={20} stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={9} cy={23} r={2.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
      {/* right branch + leaf */}
      <line x1={16} y1={9} x2={23} y2={20} stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={23} cy={23} r={2.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
    </svg>
  )
}

function SVMIcon() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* margin dashes */}
      <line x1={4} y1={22} x2={14} y2={10} stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="2 3" />
      {/* decision boundary */}
      <line x1={9} y1={26} x2={23} y2={6} stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" />
      {/* margin dashes right */}
      <line x1={18} y1={22} x2={28} y2={10} stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="2 3" />
      {/* class A dots */}
      <circle cx={7} cy={20} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={5} cy={14} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      {/* class B dots */}
      <circle cx={25} cy={18} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={27} cy={12} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
    </svg>
  )
}

function ClusterIcon() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* cluster A — top-left */}
      <circle cx={8} cy={9} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={12} cy={7} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={10} cy={13} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      {/* cluster B — top-right */}
      <circle cx={22} cy={8} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={26} cy={11} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={23} cy={14} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      {/* cluster C — bottom */}
      <circle cx={13} cy={24} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={17} cy={22} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={21} cy={25} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
    </svg>
  )
}

function DimRedIcon() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* 2D scatter points */}
      <circle cx={8} cy={8} r={1.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={10} cy={14} r={1.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={6} cy={20} r={1.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={14} cy={10} r={1.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={16} cy={18} r={1.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
      {/* arrow pointing right — projection */}
      <line x1={20} y1={14} x2={28} y2={14} stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" />
      <polyline points="25,11 28,14 25,17" stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* 1D projected points */}
      <line x1={28} y1={8} x2={28} y2={22} stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={28} cy={10} r={1.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={28} cy={14} r={1.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={28} cy={20} r={1.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
    </svg>
  )
}

// ─── Chapter data ─────────────────────────────────────────────────────────────

const CHAPTERS = [
  {
    route: '/trees',
    sessions: '15–16',
    title: 'Decision Tree & Ensemble',
    desc: 'Recursive splits, bagging, boosting, random forests, and stacking.',
    icon: <TreeIcon />,
  },
  {
    route: '/svm',
    sessions: '17–18',
    title: 'Support Vector Machine',
    desc: 'Maximum margin classifiers, soft margins, and the kernel trick.',
    icon: <SVMIcon />,
  },
  {
    route: '/clustering',
    sessions: '19–20',
    title: 'Clustering',
    desc: 'K-Means, hierarchical agglomeration, and density-based DBSCAN.',
    icon: <ClusterIcon />,
  },
  {
    route: '/dimred',
    sessions: '21–22',
    title: 'Dimensionality Reduction',
    desc: 'PCA, LDA, and t-SNE for compression and visualization.',
    icon: <DimRedIcon />,
  },
] as const

// ─── Index ────────────────────────────────────────────────────────────────────

export default function Index() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--paper)', color: 'var(--ink)' }}>
      {/* ── Hero block ── */}
      <header style={{ padding: '4rem 2rem 2rem', maxWidth: '56rem', margin: '0 auto' }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--step--1)',
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          color: 'var(--ink-soft)',
          marginBottom: '0.75rem',
        }}>
          Sessions 15–22 · BINUS University
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--step-4)',
          fontWeight: 600,
          lineHeight: 1.1,
          color: 'var(--ink)',
          marginBottom: '1.25rem',
        }}>
          Machine Learning
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--step-0)',
          color: 'var(--ink-soft)',
          lineHeight: 1.6,
          maxWidth: '52ch',
        }}>
          An interactive textbook covering decision trees, SVMs, clustering, and dimensionality reduction.
        </p>
      </header>

      {/* ── Divider ── */}
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0 2rem' }}>
        <hr style={{ border: 'none', borderTop: '1px solid var(--rule)', margin: '0 0 2.5rem' }} />
      </div>

      {/* ── Chapter grid ── */}
      <main style={{ maxWidth: '56rem', margin: '0 auto', padding: '0 2rem 4rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {CHAPTERS.map(ch => (
            <ChapterCard key={ch.route} {...ch} />
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--rule)',
        padding: '1.5rem 2rem',
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--step--1)',
        color: 'var(--ink-soft)',
        letterSpacing: '.06em',
      }}>
        BINUS University · Sessions 15–22
      </footer>
    </div>
  )
}

// ─── Chapter Card ─────────────────────────────────────────────────────────────

interface CardProps {
  route: string
  sessions: string
  title: string
  desc: string
  icon: React.ReactNode
}

function ChapterCard({ route, sessions, title, desc, icon }: CardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      to={route}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        position: 'relative',
        background: 'var(--paper)',
        border: `1px solid ${hovered ? 'var(--ink-soft)' : 'var(--rule)'}`,
        borderRadius: '8px',
        padding: '1.5rem',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        boxShadow: hovered ? '0 4px 16px oklch(0 0 0 / 0.06)' : 'none',
      }}>
        {/* Completion ring — top-right */}
        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          <CompletionRing route={route} />
        </div>

        {/* Icon */}
        <div style={{ marginBottom: '1rem' }}>
          {icon}
        </div>

        {/* Text body */}
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--step--1)',
          color: 'var(--ink-soft)',
          marginBottom: '0.25rem',
          letterSpacing: '.04em',
        }}>
          Session {sessions}
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--step-1)',
          fontWeight: 600,
          color: 'var(--ink)',
          marginBottom: '0.5rem',
          lineHeight: 1.2,
        }}>
          {title}
        </h2>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--step--1)',
          color: 'var(--ink-soft)',
          lineHeight: 1.55,
          margin: 0,
        }}>
          {desc}
        </p>
      </div>
    </Link>
  )
}

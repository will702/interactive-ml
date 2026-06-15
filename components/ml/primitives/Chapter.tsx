'use client'
import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ProgressBar from './ProgressBar'

const NAV = [
  { to: '/ml', label: 'ML Study' },
  { to: '/ml/trees', label: 'Trees' },
  { to: '/ml/svm', label: 'SVM' },
  { to: '/ml/clustering', label: 'Clustering' },
  { to: '/ml/dimred', label: 'Dim Reduction' },
]

interface ChapterProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function Chapter({ title, subtitle, children }: ChapterProps) {
  const pathname = usePathname()

  return (
    <div style={{ minHeight: '100dvh' }}>
      {/* Sticky nav */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'var(--paper)',
        borderBottom: '1px solid var(--rule)',
        display: 'flex',
        gap: '0',
        alignItems: 'center',
        padding: '0 1.5rem',
        height: 'var(--nav-height)',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--step--1)',
      }}>
        {NAV.map(item => (
          <Link
            key={item.to}
            href={item.to}
            aria-current={pathname === item.to ? 'page' : undefined}
            style={{
              padding: '0 0.875rem',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: pathname === item.to ? 'var(--accent)' : 'var(--ink-soft)',
              fontWeight: pathname === item.to ? 600 : 400,
              borderBottom: pathname === item.to ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {item.label}
          </Link>
        ))}
        <ProgressBar />
      </nav>

      {/* Page header */}
      <header style={{ padding: '4rem 1.5rem 2rem', maxWidth: '52rem', margin: '0 auto' }}>
        {subtitle && (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
            {subtitle}
          </div>
        )}
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step-4)', fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {title}
        </h1>
      </header>

      {/* Content */}
      <main style={{ padding: '0 1.5rem 6rem', maxWidth: '52rem', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}

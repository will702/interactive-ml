'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const AmbientHero = dynamic(() => import('@/components/r3f/AmbientHero'), { ssr: false });

// ─── Completion Ring ──────────────────────────────────────────────────────────

function CompletionRing({ storageKey }: { storageKey: string }) {
  const [pct, setPct] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const stored = localStorage.getItem(`progress:${storageKey}`);
    return stored ? Math.min(1, parseFloat(stored)) : 0;
  });

  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem(`progress:${storageKey}`);
      setPct(stored ? Math.min(1, parseFloat(stored)) : 0);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [storageKey]);

  const R = 14, CX = 16, CY = 16;
  const circ = 2 * Math.PI * R;
  const dash = pct * circ;

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
  );
}

// ─── Chapter Icons ────────────────────────────────────────────────────────────

function TreeIcon() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx={16} cy={6} r={3} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <line x1={16} y1={9} x2={9} y2={20} stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={9} cy={23} r={2.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <line x1={16} y1={9} x2={23} y2={20} stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={23} cy={23} r={2.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
    </svg>
  );
}

function SVMIcon() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <line x1={4} y1={22} x2={14} y2={10} stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="2 3" />
      <line x1={9} y1={26} x2={23} y2={6} stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" />
      <line x1={18} y1={22} x2={28} y2={10} stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="2 3" />
      <circle cx={7} cy={20} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={5} cy={14} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={25} cy={18} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={27} cy={12} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
    </svg>
  );
}

function ClusterIcon() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx={8} cy={9} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={12} cy={7} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={10} cy={13} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={22} cy={8} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={26} cy={11} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={23} cy={14} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={13} cy={24} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={17} cy={22} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={21} cy={25} r={2} stroke="var(--ink-soft)" strokeWidth={1.5} />
    </svg>
  );
}

function DimRedIcon() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx={8} cy={8} r={1.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={10} cy={14} r={1.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={6} cy={20} r={1.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={14} cy={10} r={1.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={16} cy={18} r={1.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <line x1={20} y1={14} x2={28} y2={14} stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" />
      <polyline points="25,11 28,14 25,17" stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1={28} y1={8} x2={28} y2={22} stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={28} cy={10} r={1.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={28} cy={14} r={1.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={28} cy={20} r={1.5} stroke="var(--ink-soft)" strokeWidth={1.5} />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x={3} y={9} width={26} height={18} rx={3} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <circle cx={16} cy={18} r={5} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <path d="M11 9 L13.5 5 H18.5 L21 9" stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={25} cy={13} r={1.5} fill="var(--ink-soft)" />
    </svg>
  );
}

// ─── Card Components ──────────────────────────────────────────────────────────

interface MLCardProps {
  href: string;
  storageKey: string;
  sessions: string;
  label: string;
  desc: string;
  Icon: () => React.ReactElement;
}

function MLCard({ href, storageKey, sessions, label, desc, Icon }: MLCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        position: 'relative',
        background: 'var(--paper)',
        border: `1px solid ${hovered ? 'var(--ink-soft)' : 'var(--rule)'}`,
        borderRadius: 'var(--radius)',
        padding: '1.5rem',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        boxShadow: hovered ? '0 4px 16px oklch(0 0 0 / 0.06)' : 'none',
        height: '100%',
      }}>
        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          <CompletionRing storageKey={storageKey} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <Icon />
        </div>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--step--1)',
          color: 'var(--ink-soft)',
          marginBottom: '0.25rem',
          letterSpacing: '.04em',
        }}>
          Session {sessions}
        </p>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--step-1)',
          fontWeight: 600,
          color: 'var(--ink)',
          marginBottom: '0.5rem',
          lineHeight: 1.2,
        }}>
          {label}
        </h3>
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
  );
}

interface CVCardProps {
  href: string;
  vol: string;
  label: string;
  desc: string;
}

function CVCard({ href, vol, label, desc }: CVCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        position: 'relative',
        background: 'var(--paper)',
        border: `1px solid ${hovered ? 'var(--ink-soft)' : 'var(--rule)'}`,
        borderRadius: 'var(--radius)',
        padding: '1.5rem',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        boxShadow: hovered ? '0 4px 16px oklch(0 0 0 / 0.06)' : 'none',
        height: '100%',
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <CameraIcon />
        </div>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--step--1)',
          color: 'var(--ink-soft)',
          marginBottom: '0.25rem',
          letterSpacing: '.04em',
        }}>
          {vol}
        </p>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--step-1)',
          fontWeight: 600,
          color: 'var(--ink)',
          marginBottom: '0.5rem',
          lineHeight: 1.2,
        }}>
          {label}
        </h3>
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
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ML_CHAPTERS = [
  {
    href: '/ml/trees',
    storageKey: 'ml:trees',
    sessions: '15–16',
    label: 'Decision Trees & Ensembles',
    desc: 'Decision trees, bagging, boosting, random forests, stacking.',
    Icon: TreeIcon,
  },
  {
    href: '/ml/svm',
    storageKey: 'ml:svm',
    sessions: '17–18',
    label: 'Support Vector Machines',
    desc: 'Maximal margin classifier, kernel trick, RBF and polynomial kernels.',
    Icon: SVMIcon,
  },
  {
    href: '/ml/clustering',
    storageKey: 'ml:clustering',
    sessions: '19–20',
    label: 'Clustering',
    desc: 'K-means, hierarchical clustering, DBSCAN.',
    Icon: ClusterIcon,
  },
  {
    href: '/ml/dimred',
    storageKey: 'ml:dimred',
    sessions: '21–22',
    label: 'Dimensionality Reduction',
    desc: 'PCA, LDA, t-SNE — comparing linear and nonlinear methods.',
    Icon: DimRedIcon,
  },
] as const;

const CV_MODULES = [
  {
    href: '/cv/filtering',
    vol: 'Vol I · Part 01',
    label: 'Image Filtering',
    desc: 'Spatial convolution, kernel design, edge detection.',
  },
  {
    href: '/cv/features',
    vol: 'Vol I · Part 02',
    label: 'Feature Detection',
    desc: 'Harris corners, ORB matching, homography estimation.',
  },
  {
    href: '/cv/camera-model',
    vol: 'Vol I · Part 03',
    label: 'Camera Geometry',
    desc: 'Pinhole model, intrinsic and extrinsic parameters.',
  },
  {
    href: '/cv/epipolar',
    vol: 'Vol I · Part 04',
    label: 'Epipolar Geometry',
    desc: 'Fundamental matrix, epipolar lines, triangulation.',
  },
] as const;

// ─── Grid style ───────────────────────────────────────────────────────────────

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '1.25rem',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--paper)', color: 'var(--ink)' }}>

      {/* ── Hero ── */}
      <header style={{ padding: '4rem 2rem 0', maxWidth: '56rem', margin: '0 auto' }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--step--1)',
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          color: 'var(--ink-soft)',
          marginBottom: '0.75rem',
        }}>
          Interactive Portfolio
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--step-4)',
          fontWeight: 600,
          lineHeight: 1.1,
          color: 'var(--ink)',
          marginBottom: '1rem',
        }}>
          Machine Learning &amp; Computer Vision
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--step-0)',
          color: 'var(--ink-soft)',
          lineHeight: 1.6,
          maxWidth: '52ch',
        }}>
          Interactive study guides — built for understanding, not reading.
        </p>
      </header>

      {/* ── R3F scene ── */}
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 0 0' }}>
        <AmbientHero />
      </div>

      {/* ── Machine Learning section ── */}
      <section style={{ maxWidth: '56rem', margin: '0 auto', padding: '3rem 2rem 0' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--step-3)',
            fontWeight: 600,
            color: 'var(--ink)',
            marginBottom: '0.25rem',
          }}>
            Machine Learning
          </h2>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--step--1)',
            color: 'var(--ink-soft)',
            letterSpacing: '.04em',
          }}>
            Sessions 15–22 · BINUS University
          </p>
        </div>

        <div style={gridStyle}>
          {ML_CHAPTERS.map(ch => (
            <MLCard key={ch.href} {...ch} />
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div style={{ maxWidth: '56rem', margin: '3rem auto 0', padding: '0 2rem' }}>
        <hr style={{ border: 'none', borderTop: '1px solid var(--rule)' }} />
      </div>

      {/* ── Computer Vision section ── */}
      <section style={{ maxWidth: '56rem', margin: '0 auto', padding: '3rem 2rem 4rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--step-3)',
            fontWeight: 600,
            color: 'var(--ink)',
            marginBottom: '0.25rem',
          }}>
            Computer Vision
          </h2>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--step--1)',
            color: 'var(--ink-soft)',
            letterSpacing: '.04em',
          }}>
            Interactive Lab · Vol I
          </p>
        </div>

        <div style={gridStyle}>
          {CV_MODULES.map(mod => (
            <CVCard key={mod.href} {...mod} />
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--rule)',
        padding: '1.5rem 2rem',
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--step--1)',
        color: 'var(--ink-soft)',
        letterSpacing: '.06em',
        maxWidth: '100%',
      }}>
        Machine Learning · Sessions 15–22 &nbsp;·&nbsp; Computer Vision · Vol I
      </footer>
    </div>
  );
}

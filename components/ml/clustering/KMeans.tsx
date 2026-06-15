'use client'
import { useMemo, useState } from 'react'
import * as d3 from 'd3'
import { gaussianBlobs, twoMoons } from '@/lib/data/synthetic'
import { runKMeans, elbowData } from '@/lib/algorithms/kmeans'
import { classColor } from '@/lib/scales'

const W = 320, H = 280
const MARGIN = { top: 16, right: 16, bottom: 28, left: 32 }
const INNER_W = W - MARGIN.left - MARGIN.right
const INNER_H = H - MARGIN.top - MARGIN.bottom

interface Props {
  progress?: number
  k?: number
  dataset?: 'blobs' | 'moons'
}

function StarPath(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 - Math.PI / 2
    const ri = i % 2 === 0 ? r : r * 0.45
    pts.push(`${cx + ri * Math.cos(angle)},${cy + ri * Math.sin(angle)}`)
  }
  return `M${pts.join('L')}Z`
}

export default function KMeans({ progress, k: kProp, dataset: datasetProp }: Props) {
  const isScene = progress !== undefined

  const [playK, setPlayK] = useState(3)
  const [playDataset, setPlayDataset] = useState<'blobs' | 'moons'>('blobs')
  const [playStep, setPlayStep] = useState(0)
  const [stepKey, setStepKey] = useState(0)

  const activeK = isScene ? (kProp ?? 3) : playK
  const activeDataset = isScene ? (datasetProp ?? 'blobs') : playDataset

  const sceneStep = isScene ? Math.min(3, Math.floor((progress ?? 0) * 4)) : undefined

  const rawData = useMemo(
    () => activeDataset === 'blobs' ? gaussianBlobs(3, 60, 0.9, 42) : twoMoons(80, 0.15, 42),
    [activeDataset]
  )

  const points = useMemo<[number, number][]>(
    () => rawData.map(p => [p.x, p.y]),
    [rawData]
  )

  const { xScale, yScale } = useMemo(() => {
    const xExtent = d3.extent(points, p => p[0]) as [number, number]
    const yExtent = d3.extent(points, p => p[1]) as [number, number]
    const pad = 0.4
    return {
      xScale: d3.scaleLinear().domain([xExtent[0] - pad, xExtent[1] + pad]).range([0, INNER_W]),
      yScale: d3.scaleLinear().domain([yExtent[0] - pad, yExtent[1] + pad]).range([INNER_H, 0]),
    }
  }, [points])

  const allStates = useMemo(
    () => runKMeans(points, activeK, 20, 42),
    [points, activeK, stepKey] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const maxStep = allStates.length - 1

  const activeStep = isScene
    ? Math.min(maxStep, sceneStep ?? 0)
    : Math.min(maxStep, playStep)

  const state = allStates[activeStep]

  const elbow = useMemo(
    () => isScene ? null : elbowData(points, 6),
    [isScene, points]
  )

  const elbowMax = elbow ? Math.max(...elbow) : 1

  return (
    <div>
      {!isScene && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '0.75rem', fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            k
            <input
              type="range" min={2} max={5} value={playK}
              onChange={e => { setPlayK(+e.target.value); setPlayStep(0); setStepKey(k => k + 1) }}
              style={{ width: '70px' }}
            />
            <span style={{ minWidth: '1.5ch' }}>{playK}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            Dataset
            <select
              value={playDataset}
              onChange={e => { setPlayDataset(e.target.value as 'blobs' | 'moons'); setPlayStep(0); setStepKey(k => k + 1) }}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', border: '1px solid var(--rule)', borderRadius: '4px', padding: '0.1rem 0.3rem' }}
            >
              <option value="blobs">Gaussian blobs</option>
              <option value="moons">Two moons</option>
            </select>
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setPlayStep(s => Math.min(maxStep, s + 1))}
              disabled={playStep >= maxStep}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', padding: '0.2rem 0.6rem', border: '1px solid var(--rule)', borderRadius: '4px', cursor: playStep >= maxStep ? 'default' : 'pointer', opacity: playStep >= maxStep ? 0.4 : 1 }}
            >
              Step →
            </button>
            <button
              onClick={() => { setPlayStep(0); setStepKey(k => k + 1) }}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', padding: '0.2rem 0.6rem', border: '1px solid var(--rule)', borderRadius: '4px', cursor: 'pointer' }}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      <svg width={W} height={H} role="img" aria-label="K-Means clustering visualization">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          <line x1={0} y1={INNER_H} x2={INNER_W} y2={INNER_H} stroke="var(--rule)" />
          <line x1={0} y1={0} x2={0} y2={INNER_H} stroke="var(--rule)" />

          {points.map((pt, i) => {
            const assigned = isScene && activeStep === 0 ? -1 : state.assignments[i]
            return (
              <circle
                key={i}
                cx={xScale(pt[0])}
                cy={yScale(pt[1])}
                r={4}
                fill={assigned === -1 ? 'var(--ink-soft)' : classColor(assigned)}
                fillOpacity={0.75}
                stroke="white"
                strokeWidth={0.8}
              />
            )
          })}

          {state.centroids.map((c, i) => (
            <path
              key={i}
              d={StarPath(xScale(c[0]), yScale(c[1]), 8)}
              fill={classColor(i)}
              stroke="var(--ink)"
              strokeWidth={1.5}
            />
          ))}
        </g>
      </svg>

      <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', display: 'flex', gap: '1rem' }}>
        <span>WCSS: {state.wcss.toFixed(2)}</span>
        <span>Iter: {activeStep}/{maxStep}</span>
        {state.converged && <span style={{ color: 'var(--accent)' }}>Converged</span>}
      </div>

      {!isScene && elbow && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', marginBottom: '0.25rem' }}>Elbow (WCSS by k)</div>
          <svg width={W} height={60} role="img" aria-label="Elbow chart">
            {elbow.map((wcss, i) => {
              const bw = 28, gap = 8
              const x = MARGIN.left + i * (bw + gap)
              const bh = (wcss / elbowMax) * 44
              return (
                <g key={i}>
                  <rect
                    x={x} y={56 - bh} width={bw} height={bh}
                    fill={i + 1 === playK ? 'var(--accent)' : 'var(--rule)'}
                    rx={2}
                  />
                  <text x={x + bw / 2} y={56 + 10} textAnchor="middle" fontSize={9} fill="var(--ink-soft)" fontFamily="var(--font-mono)">
                    {i + 1}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}
    </div>
  )
}

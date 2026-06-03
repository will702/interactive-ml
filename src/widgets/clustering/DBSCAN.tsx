import { useMemo, useState } from 'react'
import * as d3 from 'd3'
import { gaussianBlobs } from '../../data/synthetic'
import { runDBSCAN } from '../../lib/algorithms/dbscan'
import { classColor } from '../../lib/scales'

const W = 320, H = 280
const MARGIN = { top: 16, right: 16, bottom: 28, left: 32 }
const INNER_W = W - MARGIN.left - MARGIN.right
const INNER_H = H - MARGIN.top - MARGIN.bottom

function mulberry32(seed: number) {
  let s = seed
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

interface Props {
  progress?: number
  eps?: number
  minPts?: number
}

export default function DBSCAN({ progress, eps: epsProp, minPts: minPtsProp }: Props) {
  const isScene = progress !== undefined

  const [playEps, setPlayEps] = useState(0.6)
  const [playMinPts, setPlayMinPts] = useState(4)

  const activeEps = isScene ? (epsProp ?? 0.6) : playEps
  const activeMinPts = isScene ? (minPtsProp ?? 4) : playMinPts

  const sceneStep = isScene ? Math.min(3, Math.floor((progress ?? 0) * 4)) : 3

  const points = useMemo<[number, number][]>(() => {
    const blobs = gaussianBlobs(3, 60, 0.9, 42)
    const pts: [number, number][] = blobs.map(p => [p.x, p.y])
    const rng = mulberry32(99)
    for (let i = 0; i < 5; i++) {
      pts.push([(rng() - 0.5) * 8, (rng() - 0.5) * 8])
    }
    return pts
  }, [])

  const { xScale, yScale } = useMemo(() => {
    const xExtent = d3.extent(points, p => p[0]) as [number, number]
    const yExtent = d3.extent(points, p => p[1]) as [number, number]
    const pad = 0.5
    return {
      xScale: d3.scaleLinear().domain([xExtent[0] - pad, xExtent[1] + pad]).range([0, INNER_W]),
      yScale: d3.scaleLinear().domain([yExtent[0] - pad, yExtent[1] + pad]).range([INNER_H, 0]),
    }
  }, [points])

  const result = useMemo(
    () => runDBSCAN(points, activeEps, activeMinPts),
    [points, activeEps, activeMinPts]
  )

  const getPointFill = (i: number) => {
    const { assignments } = result
    if (sceneStep === 0) return 'var(--ink-soft)'
    if (assignments[i] === -1) return '#aaa'
    return classColor(assignments[i])
  }

  const getPointOpacity = (i: number) => {
    if (sceneStep === 0) return 0.5
    if (result.pointTypes[i] === 'border') return 0.6
    return 0.85
  }

  const getPointRadius = (i: number) => {
    if (sceneStep < 1) return 4
    const t = result.pointTypes[i]
    if (t === 'core') return 5
    if (t === 'border') return 4
    return 3
  }

  const showLabels = sceneStep >= 3
  const showColors = sceneStep >= 1

  return (
    <div>
      {!isScene && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '0.75rem', fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            ε
            <input
              type="range" min={0.2} max={1.5} step={0.05} value={playEps}
              onChange={e => setPlayEps(+e.target.value)}
              style={{ width: '80px' }}
            />
            <span style={{ minWidth: '3ch' }}>{playEps.toFixed(2)}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            MinPts
            <input
              type="range" min={2} max={8} step={1} value={playMinPts}
              onChange={e => setPlayMinPts(+e.target.value)}
              style={{ width: '70px' }}
            />
            <span style={{ minWidth: '1.5ch' }}>{playMinPts}</span>
          </label>
        </div>
      )}

      {isScene && sceneStep === 0 && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
          ε = {activeEps.toFixed(2)} &nbsp;|&nbsp; MinPts = {activeMinPts}
        </div>
      )}

      <svg width={W} height={H} role="img" aria-label="DBSCAN clustering visualization">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          <line x1={0} y1={INNER_H} x2={INNER_W} y2={INNER_H} stroke="var(--rule)" />
          <line x1={0} y1={0} x2={0} y2={INNER_H} stroke="var(--rule)" />

          {points.map((pt, i) => {
            const isNoise = result.assignments[i] === -1
            const showNoiseDot = showLabels && isNoise
            return (
              <g key={i}>
                <circle
                  cx={xScale(pt[0])}
                  cy={yScale(pt[1])}
                  r={getPointRadius(i)}
                  fill={showColors ? getPointFill(i) : 'var(--ink-soft)'}
                  fillOpacity={getPointOpacity(i)}
                  stroke="white"
                  strokeWidth={0.8}
                />
                {showNoiseDot && (
                  <text
                    x={xScale(pt[0]) + 5}
                    y={yScale(pt[1]) - 5}
                    fontSize={8}
                    fill="#aaa"
                    fontFamily="var(--font-mono)"
                  >
                    ×
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', display: 'flex', gap: '1rem' }}>
        {!isScene || sceneStep >= 1 ? (
          <>
            <span>Clusters: {Math.max(0, Math.max(...result.assignments) + 1)}</span>
            <span>Noise: {result.assignments.filter(a => a === -1).length}</span>
          </>
        ) : (
          <span>ε = {activeEps.toFixed(2)}, MinPts = {activeMinPts}</span>
        )}
      </div>
    </div>
  )
}

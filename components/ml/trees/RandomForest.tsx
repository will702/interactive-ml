'use client'
import { useMemo, useState } from 'react'
import * as d3 from 'd3'
import { gaussianBlobs } from '@/lib/data/synthetic'
import { trainRandomForest, predictBagging, oobAccuracy } from '@/lib/algorithms/ensemble'
import { classColor } from '@/lib/scales'
import type { Point } from '@/lib/data/synthetic'

const W = 320, H = 280
const MARGIN = { top: 16, right: 16, bottom: 28, left: 32 }
const INNER_W = W - MARGIN.left - MARGIN.right
const INNER_H = H - MARGIN.top - MARGIN.bottom
const GRID = 36

interface Props {
  progress?: number
  k?: number
  mTry?: number
}

function sceneK(progress: number): number {
  if (progress < 0.25) return 1
  if (progress < 0.5) return 3
  if (progress < 0.75) return 10
  return 15
}

export default function RandomForest({ progress, k: kOverride, mTry: mTryOverride }: Props) {
  const isScene = progress !== undefined
  const [playK, setPlayK] = useState(10)
  const [playMTry, setPlayMTry] = useState(1)

  const activeK = isScene ? sceneK(progress) : (kOverride ?? playK)
  const activeMTry = isScene ? 1 : (mTryOverride ?? playMTry)

  const data: Point[] = useMemo(() => gaussianBlobs(2, 40, 0.8, 42), [])
  const xs = useMemo(() => data.map(p => [p.x, p.y]), [data])
  const labels = useMemo(() => data.map(p => p.label), [data])

  const xExtent = d3.extent(data, p => p.x) as [number, number]
  const yExtent = d3.extent(data, p => p.y) as [number, number]
  const pad = 0.4
  const xDom: [number, number] = [xExtent[0] - pad, xExtent[1] + pad]
  const yDom: [number, number] = [yExtent[0] - pad, yExtent[1] + pad]
  const xScale = d3.scaleLinear().domain(xDom).range([0, INNER_W])
  const yScale = d3.scaleLinear().domain(yDom).range([INNER_H, 0])

  const model = useMemo(
    () => trainRandomForest(xs, labels, activeK, activeMTry, 3, 42),
    [xs, labels, activeK, activeMTry]
  )

  const oob = useMemo(() => oobAccuracy(model, xs, labels), [model, xs, labels])

  const stepX = (xDom[1] - xDom[0]) / GRID
  const stepY = (yDom[1] - yDom[0]) / GRID

  const boundaryCells = useMemo(() => {
    const cells: { x: number; y: number; w: number; h: number; label: number }[] = []
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const cx = xDom[0] + (i + 0.5) * stepX
        const cy = yDom[0] + (j + 0.5) * stepY
        const pred = predictBagging(model, [cx, cy])
        cells.push({
          x: xScale(cx - stepX / 2),
          y: yScale(cy + stepY / 2),
          w: xScale(cx + stepX / 2) - xScale(cx - stepX / 2),
          h: yScale(cy - stepY / 2) - yScale(cy + stepY / 2),
          label: pred,
        })
      }
    }
    return cells
  }, [model, xDom, yDom, xScale, yScale, stepX, stepY])

  const showOob = isScene ? progress >= 0.75 : true

  return (
    <div>
      {!isScene && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '0.75rem', fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            Trees k
            <input
              type="range" min={1} max={20} value={playK}
              onChange={e => setPlayK(+e.target.value)}
              style={{ width: '80px' }}
            />
            <span style={{ minWidth: '2ch' }}>{playK}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            mTry
            <input
              type="range" min={1} max={2} step={1} value={playMTry}
              onChange={e => setPlayMTry(+e.target.value)}
              style={{ width: '60px' }}
            />
            <span style={{ minWidth: '1ch' }}>{playMTry}</span>
          </label>
        </div>
      )}

      {isScene && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
          {activeK} tree{activeK !== 1 ? 's' : ''} · mTry={activeMTry}
        </div>
      )}

      <svg width={W} height={H} role="img" aria-label="Random Forest boundary">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {boundaryCells.map((cell, i) => (
            <rect
              key={i}
              x={cell.x} y={cell.y} width={cell.w} height={cell.h}
              fill={classColor(cell.label)}
              opacity={0.13}
            />
          ))}

          <line x1={0} y1={INNER_H} x2={INNER_W} y2={INNER_H} stroke="var(--rule)" />
          <line x1={0} y1={0} x2={0} y2={INNER_H} stroke="var(--rule)" />

          {data.map((pt, i) => (
            <circle
              key={i}
              cx={xScale(pt.x)}
              cy={yScale(pt.y)}
              r={4}
              fill={classColor(pt.label)}
              fillOpacity={0.8}
              stroke="white"
              strokeWidth={1}
            />
          ))}
        </g>
      </svg>

      <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)' }}>
        {showOob ? `OOB accuracy: ${(oob * 100).toFixed(1)}%` : `k=${activeK} trees`}
      </div>
    </div>
  )
}

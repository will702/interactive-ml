'use client'
import { useMemo, useState } from 'react'
import * as d3 from 'd3'
import { gaussianBlobs } from '@/lib/data/synthetic'
import { trainStacking, predictStacking, trainBagging, predictBagging } from '@/lib/algorithms/ensemble'
import { classColor, CLASS_COLORS } from '@/lib/scales'
import type { Point } from '@/lib/data/synthetic'

const W = 320, H = 280
const MARGIN = { top: 16, right: 16, bottom: 28, left: 32 }
const INNER_W = W - MARGIN.left - MARGIN.right
const INNER_H = H - MARGIN.top - MARGIN.bottom
const GRID = 36

interface Props {
  progress?: number
  baseLearners?: number
}

function sceneStep(progress: number): number {
  if (progress < 0.25) return 0
  if (progress < 0.5) return 1
  if (progress < 0.75) return 2
  return 3
}

export default function Stacking({ progress, baseLearners: blOverride }: Props) {
  const isScene = progress !== undefined
  const [playBL, setPlayBL] = useState(3)

  const activeBL = isScene ? 3 : (blOverride ?? playBL)
  const step = isScene ? sceneStep(progress) : 3

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

  const stackModel = useMemo(
    () => trainStacking(xs, labels, activeBL),
    [xs, labels, activeBL]
  )

  const baseModels = useMemo(
    () => Array.from({ length: activeBL }, (_, i) =>
      trainBagging(xs, labels, 1, i + 1, 42 + i)
    ),
    [xs, labels, activeBL]
  )

  const stepX = (xDom[1] - xDom[0]) / GRID
  const stepY = (yDom[1] - yDom[0]) / GRID

  const stackedCells = useMemo(() => {
    if (step < 3) return []
    const cells: { x: number; y: number; w: number; h: number; label: number }[] = []
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const cx = xDom[0] + (i + 0.5) * stepX
        const cy = yDom[0] + (j + 0.5) * stepY
        const pred = predictStacking(stackModel, [cx, cy])
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
  }, [stackModel, step, xDom, yDom, xScale, yScale, stepX, stepY])

  const baseCellSets = useMemo(() => {
    if (step < 1) return []
    return baseModels.map(bm => {
      const cells: { x: number; y: number; w: number; h: number; label: number }[] = []
      for (let i = 0; i < GRID; i++) {
        for (let j = 0; j < GRID; j++) {
          const cx = xDom[0] + (i + 0.5) * stepX
          const cy = yDom[0] + (j + 0.5) * stepY
          const pred = predictBagging(bm, [cx, cy])
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
    })
  }, [baseModels, step, xDom, yDom, xScale, yScale, stepX, stepY])

  const baseColors = [CLASS_COLORS[0], CLASS_COLORS[1], CLASS_COLORS[2], 'oklch(0.55 0.14 80)']

  const stepLabels = [
    'Base learners (depth 1–3)',
    'Base predictions → meta features',
    'Meta-learner trains on base outputs',
    'Stacked boundary (meta-learner)',
  ]

  return (
    <div>
      {!isScene && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '0.75rem', fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            Base learners
            <input
              type="range" min={2} max={4} step={1} value={playBL}
              onChange={e => setPlayBL(+e.target.value)}
              style={{ width: '60px' }}
            />
            <span style={{ minWidth: '1ch' }}>{playBL}</span>
          </label>
        </div>
      )}

      {isScene && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
          {stepLabels[step]}
        </div>
      )}

      <svg width={W} height={H} role="img" aria-label="Stacking ensemble boundary">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {baseCellSets.map((cells, bi) =>
            cells.map((cell, i) => (
              <rect
                key={`b${bi}-${i}`}
                x={cell.x} y={cell.y} width={cell.w} height={cell.h}
                fill={baseColors[bi % baseColors.length]}
                opacity={step < 3 ? 0.07 : 0.04}
              />
            ))
          )}

          {stackedCells.map((cell, i) => (
            <rect
              key={`s${i}`}
              x={cell.x} y={cell.y} width={cell.w} height={cell.h}
              fill={classColor(cell.label)}
              opacity={0.15}
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
        {activeBL} base learners + 1 meta-learner
      </div>
    </div>
  )
}

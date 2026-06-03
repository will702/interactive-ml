import { useMemo, useState } from 'react'
import * as d3 from 'd3'
import { gaussianBlobs } from '../../data/synthetic'
import { trainGradientBoosting, predictGradientBoosting } from '../../lib/algorithms/ensemble'
import { classColor } from '../../lib/scales'
import type { Point } from '../../data/synthetic'

const W = 320, H = 280
const MARGIN = { top: 16, right: 16, bottom: 28, left: 32 }
const INNER_W = W - MARGIN.left - MARGIN.right
const INNER_H = H - MARGIN.top - MARGIN.bottom
const GRID = 36

interface Props {
  progress?: number
  rounds?: number
  eta?: number
}

function sceneRounds(progress: number): number {
  if (progress < 0.25) return 0
  if (progress < 0.5) return 1
  if (progress < 0.75) return 3
  return 10
}

export default function GradientBoosting({ progress, rounds: roundsOverride, eta: etaOverride }: Props) {
  const isScene = progress !== undefined
  const [playRounds, setPlayRounds] = useState(5)
  const [playEta, setPlayEta] = useState(0.3)

  const activeRounds = isScene ? sceneRounds(progress) : (roundsOverride ?? playRounds)
  const activeEta = isScene ? 0.3 : (etaOverride ?? playEta)

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

  const gbModel = useMemo(
    () => trainGradientBoosting(xs, labels, Math.max(1, activeRounds === 0 ? 1 : activeRounds), activeEta),
    [xs, labels, activeRounds, activeEta]
  )

  const stepX = (xDom[1] - xDom[0]) / GRID
  const stepY = (yDom[1] - yDom[0]) / GRID

  const boundaryCells = useMemo(() => {
    const cells: { x: number; y: number; w: number; h: number; label: number }[] = []
    const tParam = activeRounds === 0 ? 0 : undefined
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const cx = xDom[0] + (i + 0.5) * stepX
        const cy = yDom[0] + (j + 0.5) * stepY
        const pred = predictGradientBoosting(gbModel, [cx, cy], tParam)
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
  }, [gbModel, activeRounds, xDom, yDom, xScale, yScale, stepX, stepY])

  return (
    <div>
      {!isScene && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '0.75rem', fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            Rounds T
            <input
              type="range" min={1} max={20} value={playRounds}
              onChange={e => setPlayRounds(+e.target.value)}
              style={{ width: '80px' }}
            />
            <span style={{ minWidth: '2ch' }}>{playRounds}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            η
            <input
              type="range" min={0.1} max={1.0} step={0.1} value={playEta}
              onChange={e => setPlayEta(+e.target.value)}
              style={{ width: '80px' }}
            />
            <span style={{ minWidth: '3ch' }}>{playEta.toFixed(1)}</span>
          </label>
        </div>
      )}

      {isScene && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
          {activeRounds === 0 ? 'Constant prediction f₀' : `Rounds: ${activeRounds}`}
        </div>
      )}

      <svg width={W} height={H} role="img" aria-label="Gradient Boosting boundary">
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
        {activeRounds === 0 ? 'f₀ = log-odds baseline' : `T=${activeRounds} · η=${activeEta.toFixed(1)}`}
      </div>
    </div>
  )
}

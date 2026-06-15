'use client'
import { useMemo, useState } from 'react'
import * as d3 from 'd3'
import { gaussianBlobs } from '@/lib/data/synthetic'
import { irisData as irisPoints } from '@/lib/data/real'
import { buildTree, predict } from '@/lib/algorithms/tree'
import { classColor } from '@/lib/scales'
import type { Point } from '@/lib/data/synthetic'

const W = 320, H = 280
const MARGIN = { top: 16, right: 16, bottom: 28, left: 32 }
const INNER_W = W - MARGIN.left - MARGIN.right
const INNER_H = H - MARGIN.top - MARGIN.bottom

interface Props {
  progress?: number          // 0→1 for scene mode
  dataset?: 'blobs' | 'iris'
  maxDepth?: number          // override for playground
}

export default function DecisionTreeSplit({ progress, dataset = 'blobs', maxDepth: depthOverride }: Props) {
  const isScene = progress !== undefined

  // Scene: map progress to depth 0→3
  const sceneDepth = isScene ? Math.floor(progress * 4) : undefined

  const [playDepth, setPlayDepth] = useState(2)
  const [playDataset, setPlayDataset] = useState<'blobs' | 'iris'>('blobs')

  const activeDataset = isScene ? dataset : playDataset
  const activeDepth = isScene ? (sceneDepth ?? 0) : depthOverride ?? playDepth

  const data: Point[] = useMemo(
    () => activeDataset === 'iris' ? irisPoints : gaussianBlobs(2, 40, 0.8, 42),
    [activeDataset]
  )

  const xs = useMemo(() => data.map(p => [p.x, p.y]), [data])
  const labels = useMemo(() => data.map(p => p.label), [data])

  const { xDom, yDom, xScale, yScale } = useMemo(() => {
    const xExtent = d3.extent(data, p => p.x) as [number, number]
    const yExtent = d3.extent(data, p => p.y) as [number, number]
    const pad = 0.4
    const xDom: [number, number] = [xExtent[0] - pad, xExtent[1] + pad]
    const yDom: [number, number] = [yExtent[0] - pad, yExtent[1] + pad]
    return {
      xDom,
      yDom,
      xScale: d3.scaleLinear().domain(xDom).range([0, INNER_W]),
      yScale: d3.scaleLinear().domain(yDom).range([INNER_H, 0]),
    }
  }, [data])

  const tree = useMemo(() => {
    if (activeDepth === 0) return null
    return buildTree(xs, labels, activeDepth)
  }, [xs, labels, activeDepth])

  // Generate background regions (grid of predictions)
  const GRID = 40
  const backgroundCells = useMemo(() => {
    if (!tree) return []
    const cells: { x: number; y: number; w: number; h: number; label: number }[] = []
    const stepX = (xDom[1] - xDom[0]) / GRID
    const stepY = (yDom[1] - yDom[0]) / GRID
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const cx = xDom[0] + (i + 0.5) * stepX
        const cy = yDom[0] + (j + 0.5) * stepY
        const pred = predict(tree, [cx, cy])
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
  }, [tree, xDom, yDom, xScale, yScale])

  return (
    <div>
      {/* Controls (playground only) */}
      {!isScene && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '0.75rem', fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            Depth
            <input
              type="range" min={0} max={5} value={playDepth}
              onChange={e => setPlayDepth(+e.target.value)}
              style={{ width: '80px' }}
            />
            <span style={{ minWidth: '1.5ch' }}>{playDepth}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            Dataset
            <select
              value={playDataset}
              onChange={e => setPlayDataset(e.target.value as 'blobs' | 'iris')}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', border: '1px solid var(--rule)', borderRadius: '4px', padding: '0.1rem 0.3rem' }}
            >
              <option value="blobs">Gaussian blobs</option>
              <option value="iris">Iris (setosa vs versicolor)</option>
            </select>
          </label>
        </div>
      )}

      {/* Depth label in scene mode */}
      {isScene && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
          Max depth: {activeDepth}
        </div>
      )}

      <svg width={W} height={H} role="img" aria-label="Decision tree boundary visualization">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Background region cells */}
          {backgroundCells.map((cell, i) => (
            <rect
              key={i}
              x={cell.x} y={cell.y} width={cell.w} height={cell.h}
              fill={classColor(cell.label)}
              opacity={0.12}
            />
          ))}

          {/* Axes */}
          <line x1={0} y1={INNER_H} x2={INNER_W} y2={INNER_H} stroke="var(--rule)" />
          <line x1={0} y1={0} x2={0} y2={INNER_H} stroke="var(--rule)" />

          {/* Data points */}
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

      {/* Gini readout */}
      {tree && (
        <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)' }}>
          Root gini: {(tree.gini ?? 0).toFixed(3)} &nbsp;|&nbsp; Samples: {tree.samples}
        </div>
      )}
    </div>
  )
}

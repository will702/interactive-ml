'use client'
import { useMemo, useState } from 'react'
import * as d3 from 'd3'
import { irisData } from '@/lib/data/real'
import { gaussianBlobs } from '@/lib/data/synthetic'
import { runPCA } from '@/lib/algorithms/pca'
import { runLDA } from '@/lib/algorithms/lda'
import { runTSNE } from '@/lib/algorithms/tsne'
import { classColor } from '@/lib/scales'
import type { Point } from '@/lib/data/synthetic'

const W = 320
const H = 280

// Three panels: 0–94, 103–197, 206–300 (but SVG W=320 so scale to fit)
const PANEL_W = 88
const GAP = 8
const PANEL_H_INNER = H - 48  // room for label below + margin top

const PANELS = [
  { x: 0, label: 'PCA' },
  { x: PANEL_W + GAP, label: 'LDA' },
  { x: (PANEL_W + GAP) * 2, label: 't-SNE' },
]

interface Props {
  progress?: number
  dataset?: 'iris' | 'blobs'
}

function makePanelScales(projections: [number, number][]) {
  if (projections.length === 0) {
    return {
      xScale: d3.scaleLinear().domain([-1, 1]).range([0, PANEL_W]),
      yScale: d3.scaleLinear().domain([-1, 1]).range([PANEL_H_INNER, 0]),
    }
  }
  const xs = projections.map(p => p[0])
  const ys = projections.map(p => p[1])
  const xMin = Math.min(...xs), xMax = Math.max(...xs)
  const yMin = Math.min(...ys), yMax = Math.max(...ys)
  const padX = (xMax - xMin) * 0.12 || 0.1
  const padY = (yMax - yMin) * 0.12 || 0.1
  return {
    xScale: d3.scaleLinear().domain([xMin - padX, xMax + padX]).range([0, PANEL_W]),
    yScale: d3.scaleLinear().domain([yMin - padY, yMax + padY]).range([PANEL_H_INNER, 0]),
  }
}

interface SinglePanelProps {
  projections: [number, number][]
  labels: number[]
  offsetX: number
  panelLabel: string
  visible: boolean
  datasetLabel?: string
  showDatasetLabel?: boolean
}

function SinglePanel({ projections, labels, offsetX, panelLabel, visible, datasetLabel, showDatasetLabel }: SinglePanelProps) {
  const { xScale, yScale } = useMemo(() => makePanelScales(projections), [projections])

  return (
    <g transform={`translate(${offsetX}, 16)`} opacity={visible ? 1 : 0.15}>
      {/* Border */}
      <rect
        x={0} y={0}
        width={PANEL_W} height={PANEL_H_INNER}
        fill="none"
        stroke="var(--rule)"
        strokeWidth={0.8}
        rx={3}
      />

      {/* Points */}
      {projections.map(([x, y], i) => (
        <circle
          key={i}
          cx={xScale(x)}
          cy={yScale(y)}
          r={2.8}
          fill={classColor(labels[i])}
          fillOpacity={0.75}
          stroke="white"
          strokeWidth={0.5}
        />
      ))}

      {/* Panel label */}
      <text
        x={PANEL_W / 2}
        y={PANEL_H_INNER + 14}
        textAnchor="middle"
        fontSize={10}
        fontFamily="var(--font-display)"
        fill="var(--ink-soft)"
      >
        {panelLabel}
      </text>

      {/* Dataset label (step 3) */}
      {showDatasetLabel && datasetLabel && (
        <text
          x={PANEL_W / 2}
          y={PANEL_H_INNER + 26}
          textAnchor="middle"
          fontSize={8}
          fontFamily="var(--font-display)"
          fill="var(--ink-soft)"
        >
          {datasetLabel}
        </text>
      )}
    </g>
  )
}

export default function Comparison({ progress, dataset = 'iris' }: Props) {
  const isScene = progress !== undefined
  const step = isScene ? Math.min(3, Math.floor((progress ?? 0) * 4)) : 3

  const [playDataset, setPlayDataset] = useState<'iris' | 'blobs'>('iris')
  const activeDataset = isScene ? dataset : playDataset

  const data: Point[] = useMemo(
    () => activeDataset === 'iris' ? irisData : gaussianBlobs(3, 60, 1.0, 42),
    [activeDataset]
  )

  const pts = useMemo(() => data.map(p => [p.x, p.y] as [number, number]), [data])
  const labels = useMemo(() => data.map(p => p.label), [data])

  const pca = useMemo(() => runPCA(pts), [pts])
  const lda = useMemo(() => runLDA(pts, labels), [pts, labels])
  const tsneStates = useMemo(() => runTSNE(pts, 15, 50, 5, 42), [pts])

  const tsneProj: [number, number][] = useMemo(() => {
    if (tsneStates.length === 0) return []
    return tsneStates[tsneStates.length - 1].projections
  }, [tsneStates])

  // Step visibility
  const pcaVisible = true
  const ldaVisible = isScene ? step >= 1 : true
  const tsneVisible = isScene ? step >= 2 : true
  const showDatasetLabel = step >= 3

  const datasetLabel = activeDataset === 'iris' ? 'Iris dataset' : 'Gaussian blobs'

  return (
    <div>
      {!isScene && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '0.75rem', fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            Dataset
            <select
              value={playDataset}
              onChange={e => setPlayDataset(e.target.value as 'iris' | 'blobs')}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', border: '1px solid var(--rule)', borderRadius: '4px', padding: '0.1rem 0.3rem' }}
            >
              <option value="iris">Iris</option>
              <option value="blobs">Gaussian blobs</option>
            </select>
          </label>
        </div>
      )}

      <svg width={W} height={H} role="img" aria-label="PCA, LDA, and t-SNE comparison">
        {PANELS.map((panel, idx) => {
          const projections = idx === 0 ? pca.projections : idx === 1 ? lda.projections : tsneProj
          const visible = idx === 0 ? pcaVisible : idx === 1 ? ldaVisible : tsneVisible
          return (
            <SinglePanel
              key={panel.label}
              projections={projections}
              labels={labels}
              offsetX={panel.x}
              panelLabel={panel.label}
              visible={visible}
              datasetLabel={datasetLabel}
              showDatasetLabel={showDatasetLabel}
            />
          )
        })}
      </svg>
    </div>
  )
}

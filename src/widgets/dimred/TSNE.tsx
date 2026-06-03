import { useMemo, useState } from 'react'
import * as d3 from 'd3'
import { irisData } from '../../data/real'
import { gaussianBlobs } from '../../data/synthetic'
import { runTSNE } from '../../lib/algorithms/tsne'
import { classColor } from '../../lib/scales'
import type { Point } from '../../data/synthetic'

const W = 320
const H = 280
const MARGIN = { top: 16, right: 16, bottom: 16, left: 16 }
const INNER_W = W - MARGIN.left - MARGIN.right
const INNER_H = H - MARGIN.top - MARGIN.bottom

interface Props {
  progress?: number
  perplexity?: number
  dataset?: 'blobs' | 'iris'
}

export default function TSNE({ progress, perplexity: perplexityProp, dataset: datasetProp = 'blobs' }: Props) {
  const isScene = progress !== undefined
  const step = isScene ? Math.min(3, Math.floor((progress ?? 0) * 4)) : 3

  const [playDataset, setPlayDataset] = useState<'blobs' | 'iris'>('blobs')
  const [playPerplexity, setPlayPerplexity] = useState(15)

  const activeDataset = isScene ? datasetProp : playDataset
  const activePerplexity = isScene ? (perplexityProp ?? 15) : playPerplexity

  const data: Point[] = useMemo(
    () => activeDataset === 'iris' ? irisData : gaussianBlobs(3, 60, 1.0, 42),
    [activeDataset]
  )

  const pts = useMemo(() => data.map(p => [p.x, p.y] as [number, number]), [data])

  const states = useMemo(
    () => runTSNE(pts, activePerplexity, 50, 5, 42),
    [pts, activePerplexity]
  )

  const frameIndex = useMemo(() => {
    if (states.length === 0) return 0
    if (step === 0) return 0
    if (step === 1) return Math.floor(states.length * 0.3)
    if (step === 2) return Math.floor(states.length * 0.7)
    return states.length - 1
  }, [step, states.length])

  const currentState = states[frameIndex]

  const { xScale, yScale } = useMemo(() => {
    if (!currentState || currentState.projections.length === 0) {
      return {
        xScale: d3.scaleLinear().domain([-1, 1]).range([0, INNER_W]),
        yScale: d3.scaleLinear().domain([-1, 1]).range([INNER_H, 0]),
      }
    }
    const xs = currentState.projections.map(p => p[0])
    const ys = currentState.projections.map(p => p[1])
    const xMin = Math.min(...xs), xMax = Math.max(...xs)
    const yMin = Math.min(...ys), yMax = Math.max(...ys)
    const padX = (xMax - xMin) * 0.12 || 0.1
    const padY = (yMax - yMin) * 0.12 || 0.1
    return {
      xScale: d3.scaleLinear().domain([xMin - padX, xMax + padX]).range([0, INNER_W]),
      yScale: d3.scaleLinear().domain([yMin - padY, yMax + padY]).range([INNER_H, 0]),
    }
  }, [currentState])

  const iterLabel = currentState ? `iter ${currentState.iteration}` : 'init'
  const klLabel = currentState ? `KL = ${currentState.kl_divergence.toFixed(3)}` : ''

  return (
    <div>
      {!isScene && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '0.75rem', fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            Dataset
            <select
              value={playDataset}
              onChange={e => setPlayDataset(e.target.value as 'blobs' | 'iris')}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', border: '1px solid var(--rule)', borderRadius: '4px', padding: '0.1rem 0.3rem' }}
            >
              <option value="blobs">Gaussian blobs</option>
              <option value="iris">Iris</option>
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            Perplexity {playPerplexity}
            <input
              type="range"
              min={5}
              max={30}
              step={5}
              value={playPerplexity}
              onChange={e => setPlayPerplexity(Number(e.target.value))}
              style={{ width: '80px' }}
            />
          </label>
        </div>
      )}

      <svg width={W} height={H} role="img" aria-label="t-SNE visualization">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {currentState && currentState.projections.map(([x, y], i) => (
            <circle
              key={i}
              cx={xScale(x)}
              cy={yScale(y)}
              r={3.5}
              fill={classColor(data[i].label)}
              fillOpacity={0.78}
              stroke="white"
              strokeWidth={0.7}
            />
          ))}
        </g>
      </svg>

      <div style={{ marginTop: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', display: 'flex', gap: '1rem' }}>
        <span>{iterLabel}</span>
        {klLabel && <span>{klLabel}</span>}
      </div>
    </div>
  )
}

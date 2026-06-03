import { useMemo, useState } from 'react'
import * as d3 from 'd3'
import { irisData } from '../../data/real'
import { gaussianBlobs } from '../../data/synthetic'
import { runPCA } from '../../lib/algorithms/pca'
import { classColor } from '../../lib/scales'
import type { Point } from '../../data/synthetic'

const W = 320, H = 280
const MARGIN = { top: 16, right: 16, bottom: 48, left: 32 }
const INNER_W = W - MARGIN.left - MARGIN.right
const INNER_H = H - MARGIN.top - MARGIN.bottom - 32
const STRIP_Y = MARGIN.top + INNER_H + 16
const STRIP_H = 16

interface Props {
  progress?: number
  showPC2?: boolean
  dataset?: 'iris' | 'blobs'
}

export default function PCA({ progress, showPC2: showPC2Prop, dataset = 'iris' }: Props) {
  const isScene = progress !== undefined
  const step = isScene ? Math.min(3, Math.floor((progress ?? 0) * 4)) : undefined

  const [playDataset, setPlayDataset] = useState<'iris' | 'blobs'>('iris')
  const [playShowPC2, setPlayShowPC2] = useState(false)

  const activeDataset = isScene ? dataset : playDataset
  const activeShowPC2 = isScene ? (showPC2Prop ?? (step !== undefined && step >= 2)) : playShowPC2
  const showProjection = isScene ? (step !== undefined && step >= 3) : true
  const showPC1 = isScene ? (step !== undefined && step >= 1) : true

  const data: Point[] = useMemo(
    () => activeDataset === 'iris' ? irisData : gaussianBlobs(2, 50, 0.8, 42),
    [activeDataset]
  )

  const pts = useMemo(() => data.map(p => [p.x, p.y] as [number, number]), [data])

  const pca = useMemo(() => runPCA(pts), [pts])

  const { xScale, yScale } = useMemo(() => {
    const xExtent = d3.extent(data, p => p.x) as [number, number]
    const yExtent = d3.extent(data, p => p.y) as [number, number]
    const padX = (xExtent[1] - xExtent[0]) * 0.15
    const padY = (yExtent[1] - yExtent[0]) * 0.15
    return {
      xScale: d3.scaleLinear().domain([xExtent[0] - padX, xExtent[1] + padX]).range([0, INNER_W]),
      yScale: d3.scaleLinear().domain([yExtent[0] - padY, yExtent[1] + padY]).range([INNER_H, 0]),
    }
  }, [data])

  const projScale = useMemo(() => {
    const ext = d3.extent(pca.projections, p => p[0]) as [number, number]
    const pad = (ext[1] - ext[0]) * 0.1
    return d3.scaleLinear().domain([ext[0] - pad, ext[1] + pad]).range([0, INNER_W])
  }, [pca])

  const [mx, my] = pca.mean
  const [v1, v2] = pca.eigenvectors
  const [l1, l2] = pca.eigenvalues
  const scale1 = Math.sqrt(Math.max(0, l1)) * 1.8
  const scale2 = Math.sqrt(Math.max(0, l2)) * 1.8

  const cx = xScale(mx), cy = yScale(my)

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
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            <input type="checkbox" checked={playShowPC2} onChange={e => setPlayShowPC2(e.target.checked)} />
            Show PC2
          </label>
        </div>
      )}

      <svg width={W} height={H} role="img" aria-label="PCA visualization">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          <line x1={0} y1={INNER_H} x2={INNER_W} y2={INNER_H} stroke="var(--rule)" />
          <line x1={0} y1={0} x2={0} y2={INNER_H} stroke="var(--rule)" />

          {data.map((pt, i) => (
            <circle
              key={i}
              cx={xScale(pt.x)} cy={yScale(pt.y)}
              r={3.5}
              fill={classColor(pt.label)}
              fillOpacity={0.75}
              stroke="white" strokeWidth={0.8}
            />
          ))}

          {showPC1 && (
            <g>
              <line
                x1={cx - v1[0] * scale1 * (INNER_W / (xScale.domain()[1] - xScale.domain()[0]))}
                y1={cy + v1[1] * scale1 * (INNER_H / (yScale.domain()[1] - yScale.domain()[0]))}
                x2={cx + v1[0] * scale1 * (INNER_W / (xScale.domain()[1] - xScale.domain()[0]))}
                y2={cy - v1[1] * scale1 * (INNER_H / (yScale.domain()[1] - yScale.domain()[0]))}
                stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round"
              />
              <text
                x={cx + v1[0] * scale1 * (INNER_W / (xScale.domain()[1] - xScale.domain()[0])) + 6}
                y={cy - v1[1] * scale1 * (INNER_H / (yScale.domain()[1] - yScale.domain()[0])) + 4}
                fontSize={10} fill="var(--accent)" fontFamily="var(--font-display)"
              >PC1</text>
            </g>
          )}

          {activeShowPC2 && (
            <g>
              <line
                x1={cx - v2[0] * scale2 * (INNER_W / (xScale.domain()[1] - xScale.domain()[0]))}
                y1={cy + v2[1] * scale2 * (INNER_H / (yScale.domain()[1] - yScale.domain()[0]))}
                x2={cx + v2[0] * scale2 * (INNER_W / (xScale.domain()[1] - xScale.domain()[0]))}
                y2={cy - v2[1] * scale2 * (INNER_H / (yScale.domain()[1] - yScale.domain()[0]))}
                stroke="oklch(0.5 0.15 220)" strokeWidth={2} strokeLinecap="round" strokeDasharray="4 3"
              />
              <text
                x={cx + v2[0] * scale2 * (INNER_W / (xScale.domain()[1] - xScale.domain()[0])) + 6}
                y={cy - v2[1] * scale2 * (INNER_H / (yScale.domain()[1] - yScale.domain()[0])) + 4}
                fontSize={10} fill="oklch(0.5 0.15 220)" fontFamily="var(--font-display)"
              >PC2</text>
            </g>
          )}

          {showProjection && (
            <g transform={`translate(0,${STRIP_Y - MARGIN.top})`}>
              <rect x={0} y={0} width={INNER_W} height={STRIP_H} fill="var(--rule)" rx={2} />
              {pca.projections.map(([p1], i) => (
                <circle
                  key={i}
                  cx={projScale(p1)} cy={STRIP_H / 2}
                  r={3}
                  fill={classColor(data[i].label)}
                  fillOpacity={0.7}
                />
              ))}
              <text x={0} y={STRIP_H + 12} fontSize={9} fill="var(--ink-soft)" fontFamily="var(--font-display)">
                PC1 projection
              </text>
            </g>
          )}
        </g>
      </svg>

      {showProjection && (
        <div style={{ marginTop: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)' }}>
          PC1: {(pca.explainedVariance[0] * 100).toFixed(1)}% variance &nbsp;|&nbsp;
          PC2: {(pca.explainedVariance[1] * 100).toFixed(1)}%
        </div>
      )}
    </div>
  )
}

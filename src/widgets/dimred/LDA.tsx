import { useMemo, useState } from 'react'
import * as d3 from 'd3'
import { irisData } from '../../data/real'
import { gaussianBlobs } from '../../data/synthetic'
import { runPCA } from '../../lib/algorithms/pca'
import { runLDA } from '../../lib/algorithms/lda'
import { classColor } from '../../lib/scales'
import type { Point } from '../../data/synthetic'

const W = 320
const H = 280

// Panel layout: left=PCA (0–144px), right=LDA (176–320px)
const PANEL_W = 144
const PANEL_GAP = 32
const RIGHT_X = PANEL_W + PANEL_GAP

const MARGIN = { top: 20, right: 8, bottom: 44, left: 8 }
const INNER_W = PANEL_W - MARGIN.left - MARGIN.right
const INNER_H = H - MARGIN.top - MARGIN.bottom - 16
const STRIP_Y = MARGIN.top + INNER_H + 8
const STRIP_H = 12

interface Props {
  progress?: number
  dataset?: 'iris' | 'blobs'
}

function buildScales(data: Point[]) {
  const xExtent = d3.extent(data, p => p.x) as [number, number]
  const yExtent = d3.extent(data, p => p.y) as [number, number]
  const padX = (xExtent[1] - xExtent[0]) * 0.15
  const padY = (yExtent[1] - yExtent[0]) * 0.15
  return {
    xScale: d3.scaleLinear().domain([xExtent[0] - padX, xExtent[1] + padX]).range([0, INNER_W]),
    yScale: d3.scaleLinear().domain([yExtent[0] - padY, yExtent[1] + padY]).range([INNER_H, 0]),
  }
}

interface PanelProps {
  data: Point[]
  projections: [number, number][]
  axisVec: [number, number]
  mean: [number, number]
  xScale: d3.ScaleLinear<number, number>
  yScale: d3.ScaleLinear<number, number>
  showAxis: boolean
  showStrip: boolean
  showAnnotation: boolean
  label: string
  annotation: string
  offsetX: number
}

function Panel({
  data, projections, axisVec, mean, xScale, yScale,
  showAxis, showStrip, showAnnotation, label, annotation, offsetX,
}: PanelProps) {
  const projScale = useMemo(() => {
    const ext = d3.extent(projections, p => p[0]) as [number, number]
    const pad = Math.max((ext[1] - ext[0]) * 0.1, 0.01)
    return d3.scaleLinear().domain([ext[0] - pad, ext[1] + pad]).range([0, INNER_W])
  }, [projections])

  const cx = xScale(mean[0])
  const cy = yScale(mean[1])
  const scaleX = INNER_W / (xScale.domain()[1] - xScale.domain()[0])
  const scaleY = INNER_H / (yScale.domain()[1] - yScale.domain()[0])
  const axLen = Math.sqrt(
    (INNER_W * axisVec[0] * 0.45) ** 2 + (INNER_H * axisVec[1] * 0.45) ** 2
  )
  const normLen = axLen > 0 ? axLen : 1

  return (
    <g transform={`translate(${offsetX + MARGIN.left}, ${MARGIN.top})`}>
      {/* Axes */}
      <line x1={0} y1={INNER_H} x2={INNER_W} y2={INNER_H} stroke="var(--rule)" strokeWidth={0.8} />
      <line x1={0} y1={0} x2={0} y2={INNER_H} stroke="var(--rule)" strokeWidth={0.8} />

      {/* Scatter */}
      {data.map((pt, i) => (
        <circle
          key={i}
          cx={xScale(pt.x)}
          cy={yScale(pt.y)}
          r={3}
          fill={classColor(pt.label)}
          fillOpacity={0.75}
          stroke="white"
          strokeWidth={0.6}
        />
      ))}

      {/* Discriminant / component axis */}
      {showAxis && (
        <g>
          <line
            x1={cx - axisVec[0] * scaleX * normLen * 0.45}
            y1={cy + axisVec[1] * scaleY * normLen * 0.45}
            x2={cx + axisVec[0] * scaleX * normLen * 0.45}
            y2={cy - axisVec[1] * scaleY * normLen * 0.45}
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </g>
      )}

      {/* 1D projection strip */}
      {showStrip && (
        <g transform={`translate(0, ${STRIP_Y - MARGIN.top})`}>
          <rect x={0} y={0} width={INNER_W} height={STRIP_H} fill="var(--rule)" rx={2} />
          {projections.map(([p1], i) => (
            <circle
              key={i}
              cx={projScale(p1)}
              cy={STRIP_H / 2}
              r={2.5}
              fill={classColor(data[i].label)}
              fillOpacity={0.75}
            />
          ))}
        </g>
      )}

      {/* Panel label */}
      <text
        x={INNER_W / 2}
        y={-8}
        textAnchor="middle"
        fontSize={10}
        fontFamily="var(--font-display)"
        fill="var(--ink-soft)"
      >
        {label}
      </text>

      {/* Annotation */}
      {showAnnotation && (
        <text
          x={INNER_W / 2}
          y={STRIP_Y - MARGIN.top + STRIP_H + 12}
          textAnchor="middle"
          fontSize={8}
          fontFamily="var(--font-display)"
          fill="var(--accent)"
        >
          {annotation}
        </text>
      )}
    </g>
  )
}

export default function LDA({ progress, dataset = 'iris' }: Props) {
  const isScene = progress !== undefined
  const step = isScene ? Math.min(3, Math.floor((progress ?? 0) * 4)) : 3

  const [playDataset, setPlayDataset] = useState<'iris' | 'blobs'>('iris')
  const activeDataset = isScene ? dataset : playDataset

  const data: Point[] = useMemo(
    () => activeDataset === 'iris' ? irisData : gaussianBlobs(3, 60, 1.2, 42),
    [activeDataset]
  )

  const pts = useMemo(() => data.map(p => [p.x, p.y] as [number, number]), [data])
  const labels = useMemo(() => data.map(p => p.label), [data])

  const pca = useMemo(() => runPCA(pts), [pts])
  const lda = useMemo(() => runLDA(pts, labels), [pts, labels])

  const { xScale, yScale } = useMemo(() => buildScales(data), [data])

  const pcaMean: [number, number] = [pca.mean[0], pca.mean[1]]
  const pcaAxis = pca.eigenvectors[0] as [number, number]

  const globalMeanX = pts.reduce((s, p) => s + p[0], 0) / pts.length
  const globalMeanY = pts.reduce((s, p) => s + p[1], 0) / pts.length
  const ldaMean: [number, number] = [globalMeanX, globalMeanY]
  const ldaAxis = lda.discriminantAxes[0] as [number, number]

  const pcaProj1D: [number, number][] = pca.projections.map(([p1]) => [p1, 0])
  const ldaProj1D: [number, number][] = lda.projections.map(([p1]) => [p1, 0])

  const showAxes = step >= 1
  const showStrips = step >= 2
  const showAnnotations = step >= 3

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

      <svg width={W} height={H} role="img" aria-label="PCA vs LDA comparison">
        <Panel
          data={data}
          projections={pcaProj1D}
          axisVec={pcaAxis}
          mean={pcaMean}
          xScale={xScale}
          yScale={yScale}
          showAxis={showAxes}
          showStrip={showStrips}
          showAnnotation={showAnnotations}
          label="PCA"
          annotation="max variance"
          offsetX={0}
        />
        <Panel
          data={data}
          projections={ldaProj1D}
          axisVec={ldaAxis}
          mean={ldaMean}
          xScale={xScale}
          yScale={yScale}
          showAxis={showAxes}
          showStrip={showStrips}
          showAnnotation={showAnnotations}
          label="LDA"
          annotation="max separation"
          offsetX={RIGHT_X}
        />

        {/* Center divider */}
        <line
          x1={PANEL_W + MARGIN.left + PANEL_GAP / 2}
          y1={MARGIN.top}
          x2={PANEL_W + MARGIN.left + PANEL_GAP / 2}
          y2={H - 20}
          stroke="var(--rule)"
          strokeWidth={0.5}
          strokeDasharray="3 3"
        />
      </svg>
    </div>
  )
}

import { useMemo, useState } from 'react'
import * as d3 from 'd3'
import { gaussianBlobs } from '../../data/synthetic'
import { trainLinearSVM, predictSVM, marginWidth } from '../../lib/algorithms/svm-smo'
import { classColor } from '../../lib/scales'

const W = 320, H = 280
const MARGIN = { top: 16, right: 16, bottom: 28, left: 32 }
const INNER_W = W - MARGIN.left - MARGIN.right
const INNER_H = H - MARGIN.top - MARGIN.bottom
const GRID = 30

interface Props {
  progress?: number
  C?: number
}

function getIter(progress: number): number {
  if (progress < 0.25) return 0
  if (progress < 0.5) return 50
  if (progress < 0.75) return 200
  return 500
}

export default function MaxMargin({ progress, C: cProp }: Props) {
  const isScene = progress !== undefined
  const [playC, setPlayC] = useState(1.0)
  const activeC = isScene ? 1.0 : (cProp ?? playC)

  const sceneIter = isScene ? getIter(progress!) : 500
  const showMargin = !isScene || progress! >= 0.25
  const showSVRings = !isScene || progress! >= 0.5
  const showReadout = !isScene || progress! >= 0.75

  const data = useMemo(() => gaussianBlobs(2, 40, 1.5, 7), [])
  const xs = useMemo(() => data.map(p => [p.x, p.y]), [data])
  const labels = useMemo(() => data.map(p => p.label === 0 ? -1 : 1), [data])

  const { xDom, yDom, xScale, yScale } = useMemo(() => {
    const xExt = d3.extent(data, p => p.x) as [number, number]
    const yExt = d3.extent(data, p => p.y) as [number, number]
    const pad = 0.5
    const xDom: [number, number] = [xExt[0] - pad, xExt[1] + pad]
    const yDom: [number, number] = [yExt[0] - pad, yExt[1] + pad]
    return {
      xDom,
      yDom,
      xScale: d3.scaleLinear().domain(xDom).range([0, INNER_W]),
      yScale: d3.scaleLinear().domain(yDom).range([INNER_H, 0]),
    }
  }, [data])

  const model = useMemo(() => {
    if (sceneIter === 0) return null
    return trainLinearSVM(xs, labels, activeC, sceneIter)
  }, [xs, labels, activeC, sceneIter])

  const initialModel = useMemo(() => {
    return { w: [1, 0] as number[], b: 0 }
  }, [])

  const activeW = model?.w ?? initialModel.w
  const activeB = model?.b ?? initialModel.b

  const backgroundCells = useMemo(() => {
    if (!model) return []
    const stepX = (xDom[1] - xDom[0]) / GRID
    const stepY = (yDom[1] - yDom[0]) / GRID
    return Array.from({ length: GRID * GRID }, (_, idx) => {
      const i = idx % GRID, j = Math.floor(idx / GRID)
      const cx = xDom[0] + (i + 0.5) * stepX
      const cy = yDom[0] + (j + 0.5) * stepY
      const pred = predictSVM(model, [cx, cy])
      return {
        x: xScale(cx - stepX / 2),
        y: yScale(cy + stepY / 2),
        w: xScale(cx + stepX / 2) - xScale(cx - stepX / 2),
        h: yScale(cy - stepY / 2) - yScale(cy + stepY / 2),
        label: pred,
      }
    })
  }, [model, xDom, yDom, xScale, yScale])

  const boundaryLine = useMemo(() => {
    const [w0, w1] = activeW
    const norm = Math.sqrt(w0 * w0 + w1 * w1)
    if (norm < 1e-9) return null
    const x1 = xDom[0]
    const x2 = xDom[1]
    const y1 = -(w0 * x1 + activeB) / (w1 || 1e-9)
    const y2 = -(w0 * x2 + activeB) / (w1 || 1e-9)
    return {
      x1: xScale(x1), y1: yScale(y1),
      x2: xScale(x2), y2: yScale(y2),
    }
  }, [activeW, activeB, xDom, xScale, yScale])

  const marginLines = useMemo(() => {
    if (!showMargin) return null
    const [w0, w1] = activeW
    const norm = Math.sqrt(w0 * w0 + w1 * w1)
    if (norm < 1e-9) return null
    const offset = 1 / norm
    const x1 = xDom[0], x2 = xDom[1]

    const mkLine = (sign: number) => {
      const y1 = -(w0 * x1 + activeB - sign) / (w1 || 1e-9)
      const y2 = -(w0 * x2 + activeB - sign) / (w1 || 1e-9)
      return { x1: xScale(x1), y1: yScale(y1), x2: xScale(x2), y2: yScale(y2), offset }
    }
    return [mkLine(1), mkLine(-1)]
  }, [showMargin, activeW, activeB, xDom, xScale, yScale])

  const mw = model ? marginWidth(model) : null

  const svSet = useMemo(() => {
    if (!model || !showSVRings) return new Set<string>()
    return new Set(model.supportVectors.map(sv => `${sv[0].toFixed(4)},${sv[1].toFixed(4)}`))
  }, [model, showSVRings])

  return (
    <div>
      {!isScene && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '0.75rem', fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            C
            <input
              type="range" min={-2} max={1} step={0.1}
              value={Math.log10(playC)}
              onChange={e => setPlayC(10 ** +e.target.value)}
              style={{ width: '80px' }}
            />
            <span style={{ minWidth: '3.5ch' }}>{playC.toFixed(2)}</span>
          </label>
        </div>
      )}

      <svg width={W} height={H} role="img" aria-label="Maximal margin classifier visualization">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {backgroundCells.map((cell, i) => (
            <rect key={i} x={cell.x} y={cell.y} width={cell.w} height={cell.h}
              fill={classColor(cell.label)} opacity={0.12} />
          ))}

          <line x1={0} y1={INNER_H} x2={INNER_W} y2={INNER_H} stroke="var(--rule)" />
          <line x1={0} y1={0} x2={0} y2={INNER_H} stroke="var(--rule)" />

          {marginLines && marginLines.map((ml, i) => (
            <line key={i} x1={ml.x1} y1={ml.y1} x2={ml.x2} y2={ml.y2}
              stroke="var(--ink-soft)" strokeWidth={1} strokeDasharray="4 3" />
          ))}

          {boundaryLine && (
            <line x1={boundaryLine.x1} y1={boundaryLine.y1}
              x2={boundaryLine.x2} y2={boundaryLine.y2}
              stroke="var(--ink)" strokeWidth={2} />
          )}

          {data.map((pt, i) => {
            const key = `${pt.x.toFixed(4)},${pt.y.toFixed(4)}`
            const isSV = svSet.has(key)
            return (
              <g key={i}>
                {isSV && (
                  <circle cx={xScale(pt.x)} cy={yScale(pt.y)} r={7}
                    fill="none" stroke="var(--accent)" strokeWidth={2} />
                )}
                <circle cx={xScale(pt.x)} cy={yScale(pt.y)} r={4}
                  fill={classColor(pt.label)} fillOpacity={0.85}
                  stroke="white" strokeWidth={1} />
              </g>
            )
          })}
        </g>
      </svg>

      {showReadout && mw !== null && (
        <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)' }}>
          margin width: {isFinite(mw) ? mw.toFixed(3) : '∞'}
          {model && (
            <span> &nbsp;|&nbsp; SVs: {model.supportVectors.length}</span>
          )}
        </div>
      )}
    </div>
  )
}

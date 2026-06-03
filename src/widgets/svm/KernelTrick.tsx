import { useMemo, useState } from 'react'
import * as d3 from 'd3'
import { twoMoons } from '../../data/synthetic'
import {
  trainLinearSVM, predictSVM,
  trainKernelSVM, predictKernelSVM,
} from '../../lib/algorithms/svm-smo'
import { classColor } from '../../lib/scales'

const W = 320, H = 280
const MARGIN = { top: 16, right: 16, bottom: 28, left: 32 }
const INNER_W = W - MARGIN.left - MARGIN.right
const INNER_H = H - MARGIN.top - MARGIN.bottom
const GRID = 28

type KernelType = 'linear' | 'rbf' | 'poly'

interface Props {
  progress?: number
  kernel?: KernelType
  gamma?: number
  degree?: number
}

interface SceneConfig {
  kernel: KernelType
  gamma: number
  degree: number
  label: string
}

function getSceneConfig(progress: number): SceneConfig {
  if (progress < 0.25) return { kernel: 'linear', gamma: 0.5, degree: 3, label: 'linear' }
  if (progress < 0.5) return { kernel: 'rbf', gamma: 0.5, degree: 3, label: 'rbf γ=0.5' }
  if (progress < 0.75) return { kernel: 'rbf', gamma: 2.0, degree: 3, label: 'rbf γ=2.0' }
  return { kernel: 'poly', gamma: 1.0, degree: 3, label: 'poly d=3' }
}

export default function KernelTrick({ progress, kernel: kProp, gamma: gProp, degree: dProp }: Props) {
  const isScene = progress !== undefined

  const [playKernel, setPlayKernel] = useState<KernelType>('rbf')
  const [playGamma, setPlayGamma] = useState(1.0)
  const [playDegree, setPlayDegree] = useState(3)

  const sceneConf = isScene ? getSceneConfig(progress!) : null

  const activeKernel: KernelType = isScene ? sceneConf!.kernel : (kProp ?? playKernel)
  const activeGamma = isScene ? sceneConf!.gamma : (gProp ?? playGamma)
  const activeDegree = isScene ? sceneConf!.degree : (dProp ?? playDegree)

  const data = useMemo(() => twoMoons(60, 0.12, 99), [])
  const xs = useMemo(() => data.map(p => [p.x, p.y]), [data])
  const labels = useMemo(() => data.map(p => p.label === 0 ? -1 : 1), [data])

  const { xDom, yDom, xScale, yScale } = useMemo(() => {
    const xExt = d3.extent(data, p => p.x) as [number, number]
    const yExt = d3.extent(data, p => p.y) as [number, number]
    const pad = 0.3
    const xDom: [number, number] = [xExt[0] - pad, xExt[1] + pad]
    const yDom: [number, number] = [yExt[0] - pad, yExt[1] + pad]
    return {
      xDom,
      yDom,
      xScale: d3.scaleLinear().domain(xDom).range([0, INNER_W]),
      yScale: d3.scaleLinear().domain(yDom).range([INNER_H, 0]),
    }
  }, [data])

  const linearModel = useMemo(() => {
    if (activeKernel !== 'linear') return null
    return trainLinearSVM(xs, labels, 1.0, 500)
  }, [xs, labels, activeKernel])

  const kernelModel = useMemo(() => {
    if (activeKernel === 'linear') return null
    return trainKernelSVM(xs, labels, activeKernel as 'rbf' | 'poly', activeGamma, activeDegree, 2.0)
  }, [xs, labels, activeKernel, activeGamma, activeDegree])

  const backgroundCells = useMemo(() => {
    const stepX = (xDom[1] - xDom[0]) / GRID
    const stepY = (yDom[1] - yDom[0]) / GRID
    return Array.from({ length: GRID * GRID }, (_, idx) => {
      const i = idx % GRID, j = Math.floor(idx / GRID)
      const cx = xDom[0] + (i + 0.5) * stepX
      const cy = yDom[0] + (j + 0.5) * stepY
      let pred: number
      if (linearModel) {
        pred = predictSVM(linearModel, [cx, cy])
      } else if (kernelModel) {
        pred = predictKernelSVM(kernelModel, [cx, cy])
      } else {
        pred = 0
      }
      return {
        x: xScale(cx - stepX / 2),
        y: yScale(cy + stepY / 2),
        w: xScale(cx + stepX / 2) - xScale(cx - stepX / 2),
        h: yScale(cy - stepY / 2) - yScale(cy + stepY / 2),
        label: pred,
      }
    })
  }, [linearModel, kernelModel, xDom, yDom, xScale, yScale])

  const linearBoundary = useMemo(() => {
    if (!linearModel) return null
    const [w0, w1] = linearModel.w
    const norm = Math.sqrt(w0 * w0 + w1 * w1)
    if (norm < 1e-9) return null
    const x1 = xDom[0], x2 = xDom[1]
    const y1 = -(w0 * x1 + linearModel.b) / (w1 || 1e-9)
    const y2 = -(w0 * x2 + linearModel.b) / (w1 || 1e-9)
    return { x1: xScale(x1), y1: yScale(y1), x2: xScale(x2), y2: yScale(y2) }
  }, [linearModel, xDom, xScale, yScale])

  const configLabel = isScene ? sceneConf!.label : `${activeKernel}${activeKernel !== 'linear' ? ` γ=${activeGamma.toFixed(1)}` : ''}${activeKernel === 'poly' ? ` d=${activeDegree}` : ''}`

  return (
    <div>
      {!isScene && (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem', fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            Kernel
            <select
              value={playKernel}
              onChange={e => setPlayKernel(e.target.value as KernelType)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', border: '1px solid var(--rule)', borderRadius: '4px', padding: '0.1rem 0.3rem' }}
            >
              <option value="linear">linear</option>
              <option value="rbf">rbf</option>
              <option value="poly">poly</option>
            </select>
          </label>
          {playKernel !== 'linear' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
              γ
              <input type="range" min={0.1} max={5} step={0.1}
                value={playGamma}
                onChange={e => setPlayGamma(+e.target.value)}
                style={{ width: '70px' }} />
              <span style={{ minWidth: '2.5ch' }}>{playGamma.toFixed(1)}</span>
            </label>
          )}
          {playKernel === 'poly' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
              d
              <input type="range" min={2} max={5} step={1}
                value={playDegree}
                onChange={e => setPlayDegree(+e.target.value)}
                style={{ width: '60px' }} />
              <span>{playDegree}</span>
            </label>
          )}
        </div>
      )}

      {isScene && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
          kernel: {configLabel}
        </div>
      )}

      <svg width={W} height={H} role="img" aria-label="Kernel SVM decision boundary">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {backgroundCells.map((cell, i) => (
            <rect key={i} x={cell.x} y={cell.y} width={cell.w} height={cell.h}
              fill={classColor(cell.label)} opacity={0.15} />
          ))}

          <line x1={0} y1={INNER_H} x2={INNER_W} y2={INNER_H} stroke="var(--rule)" />
          <line x1={0} y1={0} x2={0} y2={INNER_H} stroke="var(--rule)" />

          {linearBoundary && (
            <line x1={linearBoundary.x1} y1={linearBoundary.y1}
              x2={linearBoundary.x2} y2={linearBoundary.y2}
              stroke="var(--ink)" strokeWidth={2} />
          )}

          {data.map((pt, i) => (
            <circle key={i}
              cx={xScale(pt.x)} cy={yScale(pt.y)} r={4}
              fill={classColor(pt.label)} fillOpacity={0.85}
              stroke="white" strokeWidth={1} />
          ))}
        </g>
      </svg>

      {!isScene && kernelModel && (
        <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)' }}>
          SVs: {kernelModel.supportVectors.length}
        </div>
      )}
    </div>
  )
}

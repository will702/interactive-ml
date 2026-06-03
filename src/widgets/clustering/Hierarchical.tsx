import { useMemo, useState } from 'react'
import * as d3 from 'd3'
import { gaussianBlobs } from '../../data/synthetic'
import { buildDendrogram, cutDendrogram, getMergeSequence } from '../../lib/algorithms/hierarchical'
import { classColor } from '../../lib/scales'
import type { Linkage } from '../../lib/algorithms/hierarchical'

const W = 320, H = 280
const MARGIN = { top: 16, right: 16, bottom: 28, left: 32 }
const SCATTER_W = 180
const DENDRO_X = MARGIN.left + SCATTER_W + 8
const DENDRO_W = W - DENDRO_X - MARGIN.right
const INNER_H = H - MARGIN.top - MARGIN.bottom

interface Props {
  progress?: number
  linkage?: Linkage
}

export default function Hierarchical({ progress, linkage: linkageProp }: Props) {
  const isScene = progress !== undefined

  const [playLinkage, setPlayLinkage] = useState<Linkage>('average')
  const [playCutRatio, setPlayCutRatio] = useState(0.5)

  const activeLinkage = isScene ? (linkageProp ?? 'average') : playLinkage

  const sceneStep = isScene ? Math.min(3, Math.floor((progress ?? 0) * 4)) : undefined

  const rawData = useMemo(() => gaussianBlobs(4, 40, 0.7, 99), [])

  const points = useMemo<[number, number][]>(
    () => rawData.map(p => [p.x, p.y]),
    [rawData]
  )

  const { xScale, yScale } = useMemo(() => {
    const xExtent = d3.extent(points, p => p[0]) as [number, number]
    const yExtent = d3.extent(points, p => p[1]) as [number, number]
    const pad = 0.4
    return {
      xScale: d3.scaleLinear().domain([xExtent[0] - pad, xExtent[1] + pad]).range([0, SCATTER_W]),
      yScale: d3.scaleLinear().domain([yExtent[0] - pad, yExtent[1] + pad]).range([INNER_H, 0]),
    }
  }, [points])

  const dendrogram = useMemo(
    () => buildDendrogram(points, activeLinkage),
    [points, activeLinkage]
  )

  const maxHeight = dendrogram.height

  const mergeSeq = useMemo(() => getMergeSequence(dendrogram), [dendrogram])

  const cutHeight = useMemo(() => {
    if (isScene) {
      const step = sceneStep ?? 0
      if (step === 0) return 0
      if (step === 1) return maxHeight * 0.25
      if (step === 2) return maxHeight * 0.5
      return maxHeight * 0.75
    }
    return playCutRatio * maxHeight
  }, [isScene, sceneStep, maxHeight, playCutRatio])

  const assignments = useMemo(
    () => cutDendrogram(dendrogram, cutHeight),
    [dendrogram, cutHeight]
  )

  const heightScale = d3.scaleLinear().domain([0, maxHeight]).range([INNER_H, 0])

  const leafPositions = useMemo(() => {
    const n = points.length
    const leaves: number[] = []
    const collectLeaves = (node: typeof dendrogram) => {
      if (!node.left && !node.right) { leaves.push(node.id); return }
      collectLeaves(node.left!)
      collectLeaves(node.right!)
    }
    collectLeaves(dendrogram)

    const positions = new Map<number, number>()
    const step = DENDRO_W / (n + 1)
    leaves.forEach((id, i) => positions.set(id, (i + 1) * step))
    return positions
  }, [dendrogram, points.length])

  const dendroLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; height: number }[] = []

    const nodeX = new Map<number, number>()
    const nodeY = new Map<number, number>()

    const layoutNode = (node: typeof dendrogram): number => {
      if (!node.left || !node.right) {
        const x = leafPositions.get(node.id) ?? 0
        nodeX.set(node.id, x)
        nodeY.set(node.id, INNER_H)
        return x
      }
      const lx = layoutNode(node.left)
      const rx = layoutNode(node.right)
      const cx = (lx + rx) / 2
      const cy = heightScale(node.height)

      nodeX.set(node.id, cx)
      nodeY.set(node.id, cy)

      const lcy = nodeY.get(node.left.id) ?? INNER_H
      const rcy = nodeY.get(node.right.id) ?? INNER_H

      lines.push({ x1: lx, y1: lcy, x2: lx, y2: cy, height: node.height })
      lines.push({ x1: rx, y1: rcy, x2: rx, y2: cy, height: node.height })
      lines.push({ x1: lx, y1: cy, x2: rx, y2: cy, height: node.height })

      return cx
    }

    layoutNode(dendrogram)
    return lines
  }, [dendrogram, heightScale, leafPositions])

  const leafPositionsList = useMemo(() => {
    const result: { id: number; x: number }[] = []
    leafPositions.forEach((x, id) => result.push({ id, x }))
    return result
  }, [leafPositions])

  return (
    <div>
      {!isScene && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '0.75rem', fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            Linkage
            <select
              value={playLinkage}
              onChange={e => setPlayLinkage(e.target.value as Linkage)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', border: '1px solid var(--rule)', borderRadius: '4px', padding: '0.1rem 0.3rem' }}
            >
              <option value="single">Single</option>
              <option value="complete">Complete</option>
              <option value="average">Average</option>
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)' }}>
            Cut height
            <input
              type="range" min={0} max={1} step={0.01} value={playCutRatio}
              onChange={e => setPlayCutRatio(+e.target.value)}
              style={{ width: '80px' }}
            />
            <span style={{ minWidth: '4ch' }}>{(playCutRatio * maxHeight).toFixed(2)}</span>
          </label>
        </div>
      )}

      <svg width={W} height={H} role="img" aria-label="Hierarchical clustering visualization">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          <line x1={0} y1={INNER_H} x2={SCATTER_W} y2={INNER_H} stroke="var(--rule)" />
          <line x1={0} y1={0} x2={0} y2={INNER_H} stroke="var(--rule)" />

          {points.map((pt, i) => (
            <circle
              key={i}
              cx={xScale(pt[0])}
              cy={yScale(pt[1])}
              r={4}
              fill={sceneStep === 0 ? 'var(--ink-soft)' : classColor(assignments[i])}
              fillOpacity={0.8}
              stroke="white"
              strokeWidth={0.8}
            />
          ))}
        </g>

        <g transform={`translate(${DENDRO_X},${MARGIN.top})`}>
          <line x1={0} y1={INNER_H} x2={DENDRO_W} y2={INNER_H} stroke="var(--rule)" />
          <line x1={0} y1={0} x2={0} y2={INNER_H} stroke="var(--rule)" />

          {dendroLines.map((line, i) => (
            <line
              key={i}
              x1={line.x1} y1={line.y1}
              x2={line.x2} y2={line.y2}
              stroke={line.height <= cutHeight ? 'var(--rule)' : 'var(--ink)'}
              strokeWidth={1.5}
              opacity={line.height <= cutHeight ? 0.4 : 1}
            />
          ))}

          {leafPositionsList.map(({ id, x }) => (
            <circle
              key={id}
              cx={x}
              cy={INNER_H}
              r={2.5}
              fill={sceneStep === 0 ? 'var(--ink-soft)' : classColor(assignments[id])}
            />
          ))}

          <line
            x1={0} y1={heightScale(cutHeight)}
            x2={DENDRO_W} y2={heightScale(cutHeight)}
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        </g>
      </svg>

      <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', display: 'flex', gap: '1rem' }}>
        <span>Clusters: {new Set(assignments).size}</span>
        <span>Cut: {cutHeight.toFixed(2)}</span>
        {!isScene && <span>Merges: {mergeSeq.length}</span>}
      </div>
    </div>
  )
}

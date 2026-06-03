export type Linkage = 'single' | 'complete' | 'average'

export interface DendrogramNode {
  id: number
  left?: DendrogramNode
  right?: DendrogramNode
  height: number
  size: number
}

export interface Merge {
  left: number[]
  right: number[]
  height: number
}

function dist(a: [number, number], b: [number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)
}

function clusterDist(
  aIdxs: number[],
  bIdxs: number[],
  points: [number, number][],
  linkage: Linkage
): number {
  const dists: number[] = []
  for (const i of aIdxs) {
    for (const j of bIdxs) {
      dists.push(dist(points[i], points[j]))
    }
  }
  if (linkage === 'single') return Math.min(...dists)
  if (linkage === 'complete') return Math.max(...dists)
  return dists.reduce((s, d) => s + d, 0) / dists.length
}

function getLeaves(node: DendrogramNode): number[] {
  if (!node.left && !node.right) return [node.id]
  return [...getLeaves(node.left!), ...getLeaves(node.right!)]
}

export function buildDendrogram(
  points: [number, number][],
  linkage: Linkage = 'average'
): DendrogramNode {
  const nodes: DendrogramNode[] = points.map((_, i) => ({ id: i, height: 0, size: 1 }))
  const clusters: number[][] = points.map((_, i) => [i])
  let nextId = -1

  while (nodes.length > 1) {
    let bestI = 0, bestJ = 1, bestDist = Infinity

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = clusterDist(clusters[i], clusters[j], points, linkage)
        if (d < bestDist) {
          bestDist = d
          bestI = i
          bestJ = j
        }
      }
    }

    const merged: DendrogramNode = {
      id: nextId--,
      left: nodes[bestI],
      right: nodes[bestJ],
      height: bestDist,
      size: nodes[bestI].size + nodes[bestJ].size,
    }

    const mergedCluster = [...clusters[bestI], ...clusters[bestJ]]

    const newNodes = nodes.filter((_, i) => i !== bestI && i !== bestJ)
    const newClusters = clusters.filter((_, i) => i !== bestI && i !== bestJ)

    newNodes.push(merged)
    newClusters.push(mergedCluster)

    nodes.length = 0
    clusters.length = 0
    for (const n of newNodes) nodes.push(n)
    for (const c of newClusters) clusters.push(c)
  }

  return nodes[0]
}

function collectClusters(node: DendrogramNode, cutHeight: number, nextClusterId: { val: number }): Map<number, number> {
  const result = new Map<number, number>()

  const assign = (n: DendrogramNode, clusterId: number) => {
    if (!n.left && !n.right) {
      result.set(n.id, clusterId)
      return
    }
    if (n.height <= cutHeight) {
      const leaves = getLeaves(n)
      for (const l of leaves) result.set(l, clusterId)
      return
    }
    assign(n.left!, nextClusterId.val++)
    assign(n.right!, nextClusterId.val++)
  }

  assign(node, nextClusterId.val++)
  return result
}

export function cutDendrogram(root: DendrogramNode, cutHeight: number): number[] {
  const n = root.size
  const assignments = new Array<number>(n).fill(-1)
  const nextClusterId = { val: 0 }
  const map = collectClusters(root, cutHeight, nextClusterId)
  for (const [leafId, clusterId] of map.entries()) {
    assignments[leafId] = clusterId
  }

  const uniqueIds = [...new Set(assignments)].sort((a, b) => a - b)
  const remap = new Map(uniqueIds.map((id, i) => [id, i]))
  return assignments.map(a => remap.get(a) ?? 0)
}

export function getMergeSequence(root: DendrogramNode): Merge[] {
  const merges: Merge[] = []

  const traverse = (node: DendrogramNode) => {
    if (!node.left || !node.right) return
    traverse(node.left)
    traverse(node.right)
    merges.push({
      left: getLeaves(node.left),
      right: getLeaves(node.right),
      height: node.height,
    })
  }

  traverse(root)
  return merges
}

export interface TreeNode {
  feature?: number       // split feature index
  threshold?: number     // split threshold
  left?: TreeNode
  right?: TreeNode
  prediction?: number    // leaf prediction (class label)
  gini?: number          // impurity at this node
  samples?: number       // number of samples
}

export interface Split {
  feature: number
  threshold: number
  gini: number
  leftIndices: number[]
  rightIndices: number[]
}

export function giniImpurity(labels: number[]): number {
  if (labels.length === 0) return 0
  const counts = new Map<number, number>()
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1)
  const n = labels.length
  let g = 1
  counts.forEach(c => { g -= (c / n) ** 2 })
  return g
}

export function entropy(labels: number[]): number {
  if (labels.length === 0) return 0
  const counts = new Map<number, number>()
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1)
  const n = labels.length
  let e = 0
  counts.forEach(c => { const p = c / n; if (p > 0) e -= p * Math.log2(p) })
  return e
}

export function weightedGini(left: number[], right: number[]): number {
  const n = left.length + right.length
  return (left.length / n) * giniImpurity(left) + (right.length / n) * giniImpurity(right)
}

function plurality(labels: number[]): number {
  const counts = new Map<number, number>()
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1)
  let best = -1, bestCount = -1
  counts.forEach((c, k) => { if (c > bestCount) { bestCount = c; best = k } })
  return best
}

export function findBestSplit(
  xs: number[][], labels: number[], featureIndices?: number[]
): Split | null {
  const nFeatures = xs[0]?.length ?? 0
  const features = featureIndices ?? Array.from({ length: nFeatures }, (_, i) => i)
  let best: Split | null = null
  let bestGini = Infinity

  for (const f of features) {
    const values = xs.map(x => x[f]).sort((a, b) => a - b)
    const thresholds = values.slice(0, -1).map((v, i) => (v + values[i + 1]) / 2)

    for (const t of thresholds) {
      const leftIndices: number[] = [], rightIndices: number[] = []
      xs.forEach((x, i) => {
        if (x[f] <= t) leftIndices.push(i)
        else rightIndices.push(i)
      })
      if (leftIndices.length === 0 || rightIndices.length === 0) continue
      const g = weightedGini(leftIndices.map(i => labels[i]), rightIndices.map(i => labels[i]))
      if (g < bestGini) {
        bestGini = g
        best = { feature: f, threshold: t, gini: g, leftIndices, rightIndices }
      }
    }
  }
  return best
}

export function buildTree(
  xs: number[][], labels: number[], maxDepth = 3, depth = 0
): TreeNode {
  const g = giniImpurity(labels)
  const node: TreeNode = { gini: g, samples: labels.length }

  if (depth >= maxDepth || g < 1e-6 || labels.length < 4) {
    node.prediction = plurality(labels)
    return node
  }

  const split = findBestSplit(xs, labels)
  if (!split) {
    node.prediction = plurality(labels)
    return node
  }

  node.feature = split.feature
  node.threshold = split.threshold

  const leftXs = split.leftIndices.map(i => xs[i])
  const leftL = split.leftIndices.map(i => labels[i])
  const rightXs = split.rightIndices.map(i => xs[i])
  const rightL = split.rightIndices.map(i => labels[i])

  node.left = buildTree(leftXs, leftL, maxDepth, depth + 1)
  node.right = buildTree(rightXs, rightL, maxDepth, depth + 1)
  return node
}

export function predict(node: TreeNode, x: number[]): number {
  if (node.prediction !== undefined) return node.prediction
  if (node.feature === undefined || node.threshold === undefined) return 0
  return x[node.feature] <= node.threshold
    ? predict(node.left!, x)
    : predict(node.right!, x)
}

// Get all internal nodes in BFS order (for animation)
export function getNodesByDepth(root: TreeNode): TreeNode[][] {
  const levels: TreeNode[][] = []
  const queue: { node: TreeNode; depth: number }[] = [{ node: root, depth: 0 }]
  while (queue.length) {
    const { node, depth } = queue.shift()!
    if (!levels[depth]) levels[depth] = []
    levels[depth].push(node)
    if (node.left) queue.push({ node: node.left, depth: depth + 1 })
    if (node.right) queue.push({ node: node.right, depth: depth + 1 })
  }
  return levels
}

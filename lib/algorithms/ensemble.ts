import { buildTree, predict, findBestSplit } from './tree'
import type { TreeNode } from './tree'

export type { TreeNode }

export function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export function bootstrapSample(n: number, rng: () => number): number[] {
  return Array.from({ length: n }, () => Math.floor(rng() * n))
}

export interface BaggingModel {
  trees: TreeNode[]
  oobIndices: number[][]
}

export function trainBagging(
  xs: number[][],
  labels: number[],
  k: number,
  maxDepth = 3,
  seed = 42
): BaggingModel {
  const rng = mulberry32(seed)
  const n = xs.length
  const trees: TreeNode[] = []
  const oobIndices: number[][] = []

  for (let i = 0; i < k; i++) {
    const bag = bootstrapSample(n, rng)
    const bagSet = new Set(bag)
    const oob = Array.from({ length: n }, (_, j) => j).filter(j => !bagSet.has(j))
    oobIndices.push(oob)
    const bXs = bag.map(j => xs[j])
    const bL = bag.map(j => labels[j])
    trees.push(buildTree(bXs, bL, maxDepth))
  }
  return { trees, oobIndices }
}

export function predictBagging(model: BaggingModel, x: number[]): number {
  const votes = new Map<number, number>()
  for (const tree of model.trees) {
    const p = predict(tree, x)
    votes.set(p, (votes.get(p) ?? 0) + 1)
  }
  let best = 0, bestCount = -1
  votes.forEach((c, k) => { if (c > bestCount) { bestCount = c; best = k } })
  return best
}

export function oobAccuracy(model: BaggingModel, xs: number[][], labels: number[]): number {
  let correct = 0, total = 0
  const n = xs.length
  for (let i = 0; i < n; i++) {
    const relevantTrees = model.trees.filter((_, ti) => model.oobIndices[ti].includes(i))
    if (relevantTrees.length === 0) continue
    const votes = new Map<number, number>()
    for (const tree of relevantTrees) {
      const p = predict(tree, xs[i])
      votes.set(p, (votes.get(p) ?? 0) + 1)
    }
    let best = 0, bestCount = -1
    votes.forEach((c, k) => { if (c > bestCount) { bestCount = c; best = k } })
    if (best === labels[i]) correct++
    total++
  }
  return total === 0 ? 0 : correct / total
}

export interface AdaBoostRound {
  stump: TreeNode
  alpha: number
  weights: number[]
}

export function trainAdaBoost(
  xs: number[][],
  labels: number[],
  T: number
): AdaBoostRound[] {
  const n = xs.length
  const y = labels.map(l => (l === 0 ? -1 : 1))
  let weights = Array(n).fill(1 / n)
  const rounds: AdaBoostRound[] = []

  for (let t = 0; t < T; t++) {
    const stump = buildTree(xs, labels, 1)
    let err = 0
    const preds = xs.map(x => {
      const p = predict(stump, x)
      return p === 0 ? -1 : 1
    })
    for (let i = 0; i < n; i++) {
      if (preds[i] !== y[i]) err += weights[i]
    }
    err = Math.max(1e-10, Math.min(1 - 1e-10, err))
    const alpha = 0.5 * Math.log((1 - err) / err)
    const newWeights = weights.map((w, i) => w * Math.exp(-alpha * y[i] * preds[i]))
    const sum = newWeights.reduce((a, b) => a + b, 0)
    weights = newWeights.map(w => w / sum)
    rounds.push({ stump, alpha, weights: [...weights] })
  }
  return rounds
}

export function predictAdaBoost(rounds: AdaBoostRound[], x: number[]): number {
  let score = 0
  for (const { stump, alpha } of rounds) {
    const p = predict(stump, x)
    score += alpha * (p === 0 ? -1 : 1)
  }
  return score >= 0 ? 1 : 0
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z))
}

export interface GBRound {
  stump: TreeNode
  gamma: number
}

export function trainGradientBoosting(
  xs: number[][],
  labels: number[],
  T: number,
  eta = 0.1
): { rounds: GBRound[]; f0: number; eta: number } {
  const n = xs.length
  const pos = labels.filter(l => l === 1).length
  const p0 = Math.max(1e-6, Math.min(1 - 1e-6, pos / n))
  const f0 = Math.log(p0 / (1 - p0))
  const F = Array(n).fill(f0)
  const rounds: GBRound[] = []

  for (let t = 0; t < T; t++) {
    const negGrad = F.map((f, i) => labels[i] - sigmoid(f))
    const stump = buildTree(xs, negGrad.map(g => (g >= 0 ? 1 : 0)), 1)
    let sumNum = 0, sumDen = 0
    for (let i = 0; i < n; i++) {
      sumNum += negGrad[i]
      const pHat = sigmoid(F[i])
      sumDen += pHat * (1 - pHat)
    }
    const gamma = sumDen > 1e-10 ? sumNum / sumDen : 0
    for (let i = 0; i < n; i++) F[i] += eta * gamma * (predict(stump, xs[i]) === 1 ? 1 : -1)
    rounds.push({ stump, gamma })
  }
  return { rounds, f0, eta }
}

export function predictGradientBoosting(
  model: { rounds: GBRound[]; f0: number; eta: number },
  x: number[],
  t?: number
): number {
  const useRounds = t !== undefined ? model.rounds.slice(0, t) : model.rounds
  let f = model.f0
  for (const { stump, gamma } of useRounds) {
    f += model.eta * gamma * (predict(stump, x) === 1 ? 1 : -1)
  }
  return sigmoid(f) >= 0.5 ? 1 : 0
}

function buildTreeWithFeatureSubset(
  xs: number[][],
  labels: number[],
  maxDepth: number,
  mTry: number,
  rng: () => number,
  depth = 0
): TreeNode {
  const nFeatures = xs[0]?.length ?? 0
  const g = giniImpurityLocal(labels)
  const node: TreeNode = { gini: g, samples: labels.length }

  if (depth >= maxDepth || g < 1e-6 || labels.length < 4) {
    node.prediction = pluralityLocal(labels)
    return node
  }

  const shuffled = Array.from({ length: nFeatures }, (_, i) => i)
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const featureIndices = shuffled.slice(0, Math.max(1, mTry))
  const split = findBestSplit(xs, labels, featureIndices)
  if (!split) {
    node.prediction = pluralityLocal(labels)
    return node
  }

  node.feature = split.feature
  node.threshold = split.threshold

  const leftXs = split.leftIndices.map(i => xs[i])
  const leftL = split.leftIndices.map(i => labels[i])
  const rightXs = split.rightIndices.map(i => xs[i])
  const rightL = split.rightIndices.map(i => labels[i])

  node.left = buildTreeWithFeatureSubset(leftXs, leftL, maxDepth, mTry, rng, depth + 1)
  node.right = buildTreeWithFeatureSubset(rightXs, rightL, maxDepth, mTry, rng, depth + 1)
  return node
}

function giniImpurityLocal(labels: number[]): number {
  if (labels.length === 0) return 0
  const counts = new Map<number, number>()
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1)
  const n = labels.length
  let g = 1
  counts.forEach(c => { g -= (c / n) ** 2 })
  return g
}

function pluralityLocal(labels: number[]): number {
  const counts = new Map<number, number>()
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1)
  let best = -1, bestCount = -1
  counts.forEach((c, k) => { if (c > bestCount) { bestCount = c; best = k } })
  return best
}

export function trainRandomForest(
  xs: number[][],
  labels: number[],
  k: number,
  mTry?: number,
  maxDepth = 3,
  seed = 42
): BaggingModel {
  const rng = mulberry32(seed)
  const n = xs.length
  const nFeatures = xs[0]?.length ?? 2
  const m = mTry ?? Math.max(1, Math.floor(Math.sqrt(nFeatures)))
  const trees: TreeNode[] = []
  const oobIndices: number[][] = []

  for (let i = 0; i < k; i++) {
    const bag = bootstrapSample(n, rng)
    const bagSet = new Set(bag)
    const oob = Array.from({ length: n }, (_, j) => j).filter(j => !bagSet.has(j))
    oobIndices.push(oob)
    const bXs = bag.map(j => xs[j])
    const bL = bag.map(j => labels[j])
    trees.push(buildTreeWithFeatureSubset(bXs, bL, maxDepth, m, rng))
  }
  return { trees, oobIndices }
}

export interface StackingModel {
  bases: TreeNode[]
  meta: TreeNode
}

export function trainStacking(
  xs: number[][],
  labels: number[],
  baseLearners = 3
): StackingModel {
  const n = xs.length
  const splitAt = Math.floor(n * 0.7)
  const trainXs = xs.slice(0, splitAt)
  const trainL = labels.slice(0, splitAt)
  const testXs = xs.slice(splitAt)
  const testL = labels.slice(splitAt)

  const depths = [1, 2, 3, 4]
  const bases: TreeNode[] = []
  for (let i = 0; i < baseLearners; i++) {
    bases.push(buildTree(trainXs, trainL, depths[i % depths.length]))
  }

  const metaXs = testXs.map(x => bases.map(tree => predict(tree, x)))
  const meta = buildTree(metaXs, testL, 2)

  return { bases, meta }
}

export function predictStacking(model: StackingModel, x: number[]): number {
  const baseFeats = model.bases.map(tree => predict(tree, x))
  return predict(model.meta, baseFeats)
}

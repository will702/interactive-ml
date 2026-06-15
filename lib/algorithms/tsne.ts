export interface TSNEState {
  projections: [number, number][]
  kl_divergence: number
  iteration: number
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function pairwiseDist2(pts: [number, number][]): number[][] {
  const n = pts.length
  const d = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = pts[i][0] - pts[j][0]
      const dy = pts[i][1] - pts[j][1]
      const dist2 = dx * dx + dy * dy
      d[i][j] = dist2
      d[j][i] = dist2
    }
  }
  return d
}

function computeConditionalP(dist2Row: number[], sigma2: number, i: number): number[] {
  const n = dist2Row.length
  const p = new Array(n).fill(0)
  let sum = 0
  for (let j = 0; j < n; j++) {
    if (j === i) continue
    const val = Math.exp(-dist2Row[j] / (2 * sigma2))
    p[j] = val
    sum += val
  }
  if (sum < 1e-12) sum = 1e-12
  for (let j = 0; j < n; j++) p[j] /= sum
  return p
}

function binarySearchSigma(dist2Row: number[], targetPerplexity: number, i: number): number[] {
  let sigmaLow = 1e-10, sigmaHigh = 1e10, sigma2 = 1.0
  for (let iter = 0; iter < 50; iter++) {
    const p = computeConditionalP(dist2Row, sigma2, i)
    let H = 0
    for (let j = 0; j < p.length; j++) {
      if (p[j] > 1e-12) H -= p[j] * Math.log2(p[j])
    }
    const perp = Math.pow(2, H)
    if (Math.abs(perp - targetPerplexity) < 1e-5) break
    if (perp < targetPerplexity) {
      sigmaLow = sigma2
      sigma2 = sigma2 < 1e9 ? (sigma2 + sigmaHigh) / 2 : sigma2 * 2
    } else {
      sigmaHigh = sigma2
      sigma2 = (sigmaLow + sigma2) / 2
    }
  }
  return computeConditionalP(dist2Row, sigma2, i)
}

function computeKL(P: number[][], Q: number[][]): number {
  const n = P.length
  let kl = 0
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue
      if (P[i][j] > 1e-12) {
        kl += P[i][j] * Math.log(P[i][j] / Math.max(Q[i][j], 1e-12))
      }
    }
  }
  return kl
}

export function runTSNE(
  points: [number, number][],
  perplexity = 15,
  maxIter = 50,
  recordEvery = 5,
  seed = 42
): TSNEState[] {
  const n = points.length
  if (n < 3) return []

  const rng = mulberry32(seed)

  const dist2 = pairwiseDist2(points)

  // Compute joint P with binary search for sigma
  const Pcond: number[][] = []
  for (let i = 0; i < n; i++) {
    Pcond.push(binarySearchSigma(dist2[i], perplexity, i))
  }

  // Symmetrize
  const P: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      P[i][j] = (Pcond[i][j] + Pcond[j][i]) / (2 * n)
    }
  }
  // Early exaggeration
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) P[i][j] = Math.max(P[i][j] * 4, 1e-12)

  // Initialize Y randomly
  let Y: [number, number][] = Array.from({ length: n }, () => [
    (rng() - 0.5) * 0.02,
    (rng() - 0.5) * 0.02,
  ])

  const learningRate = 200
  const momentum = 0.8
  let prevGrad: [number, number][] = Array.from({ length: n }, () => [0, 0])

  const states: TSNEState[] = []

  for (let iter = 0; iter <= maxIter; iter++) {
    // Remove early exaggeration after iter 10
    if (iter === 10) {
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) P[i][j] /= 4
    }

    // Compute Q
    const dist2Y = pairwiseDist2(Y)
    const kernel: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
    let qSum = 0
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue
        const k = 1 / (1 + dist2Y[i][j])
        kernel[i][j] = k
        qSum += k
      }
    }
    if (qSum < 1e-12) qSum = 1e-12

    const Q: number[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => i === j ? 0 : Math.max(kernel[i][j] / qSum, 1e-12))
    )

    if (iter % recordEvery === 0) {
      states.push({
        projections: Y.map(([x, y]) => [x, y]),
        kl_divergence: computeKL(P, Q),
        iteration: iter,
      })
    }

    // Gradient
    const grad: [number, number][] = Array.from({ length: n }, () => [0, 0])
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue
        const factor = 4 * (P[i][j] - Q[i][j]) * kernel[i][j]
        grad[i][0] += factor * (Y[i][0] - Y[j][0])
        grad[i][1] += factor * (Y[i][1] - Y[j][1])
      }
    }

    const newY: [number, number][] = Y.map((yi, i) => [
      yi[0] - learningRate * grad[i][0] + momentum * prevGrad[i][0],
      yi[1] - learningRate * grad[i][1] + momentum * prevGrad[i][1],
    ])

    prevGrad = Y.map((_yi, i) => [
      -learningRate * grad[i][0] + momentum * prevGrad[i][0],
      -learningRate * grad[i][1] + momentum * prevGrad[i][1],
    ])

    Y = newY
  }

  return states
}

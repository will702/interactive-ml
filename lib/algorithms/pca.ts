export interface PCAResult {
  projections: [number, number][]
  explainedVariance: [number, number]
  eigenvalues: number[]
  eigenvectors: number[][]
  mean: number[]
}

export function runPCA(points: [number, number][]): PCAResult {
  const n = points.length
  if (n === 0) return { projections: [], explainedVariance: [1, 0], eigenvalues: [1, 0], eigenvectors: [[1, 0], [0, 1]], mean: [0, 0] }

  const meanX = points.reduce((s, p) => s + p[0], 0) / n
  const meanY = points.reduce((s, p) => s + p[1], 0) / n
  const mean = [meanX, meanY]

  const centered = points.map(p => [p[0] - meanX, p[1] - meanY] as [number, number])

  let cxx = 0, cxy = 0, cyy = 0
  for (const [x, y] of centered) {
    cxx += x * x
    cxy += x * y
    cyy += y * y
  }
  cxx /= n; cxy /= n; cyy /= n

  // Analytical eigendecomposition for 2x2 symmetric matrix
  const trace = cxx + cyy
  const det = cxx * cyy - cxy * cxy
  const disc = Math.sqrt(Math.max(0, (trace / 2) * (trace / 2) - det))
  const lambda1 = trace / 2 + disc
  const lambda2 = trace / 2 - disc

  let v1: [number, number], v2: [number, number]
  if (Math.abs(cxy) > 1e-10) {
    const norm1 = Math.sqrt((lambda1 - cyy) ** 2 + cxy ** 2)
    v1 = norm1 > 1e-12 ? [(lambda1 - cyy) / norm1, cxy / norm1] : [1, 0]
    const norm2 = Math.sqrt((lambda2 - cyy) ** 2 + cxy ** 2)
    v2 = norm2 > 1e-12 ? [(lambda2 - cyy) / norm2, cxy / norm2] : [0, 1]
  } else {
    v1 = cxx >= cyy ? [1, 0] : [0, 1]
    v2 = cxx >= cyy ? [0, 1] : [1, 0]
  }

  const sumEig = lambda1 + lambda2
  const ev1 = sumEig > 1e-12 ? lambda1 / sumEig : 1
  const ev2 = sumEig > 1e-12 ? lambda2 / sumEig : 0

  const projections: [number, number][] = centered.map(([x, y]) => [
    x * v1[0] + y * v1[1],
    x * v2[0] + y * v2[1],
  ])

  return {
    projections,
    explainedVariance: [ev1, ev2],
    eigenvalues: [lambda1, lambda2],
    eigenvectors: [v1, v2],
    mean,
  }
}

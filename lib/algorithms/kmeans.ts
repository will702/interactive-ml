export interface KMeansState {
  centroids: [number, number][]
  assignments: number[]
  wcss: number
  converged: boolean
}

function mulberry32(seed: number) {
  let s = seed
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function dist2(a: [number, number], b: [number, number]): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2
}

function computeAssignments(points: [number, number][], centroids: [number, number][]): number[] {
  return points.map(p => {
    let best = 0, bestD = Infinity
    for (let c = 0; c < centroids.length; c++) {
      const d = dist2(p, centroids[c])
      if (d < bestD) { bestD = d; best = c }
    }
    return best
  })
}

function computeCentroids(
  points: [number, number][],
  assignments: number[],
  k: number,
  prev: [number, number][]
): [number, number][] {
  const sums: [number, number][] = Array.from({ length: k }, () => [0, 0])
  const counts = new Array(k).fill(0)
  for (let i = 0; i < points.length; i++) {
    const c = assignments[i]
    sums[c][0] += points[i][0]
    sums[c][1] += points[i][1]
    counts[c]++
  }
  return sums.map(([sx, sy], c) =>
    counts[c] > 0 ? [sx / counts[c], sy / counts[c]] : prev[c]
  )
}

function computeWCSS(points: [number, number][], assignments: number[], centroids: [number, number][]): number {
  let total = 0
  for (let i = 0; i < points.length; i++) {
    total += dist2(points[i], centroids[assignments[i]])
  }
  return total
}

export function runKMeans(
  points: [number, number][],
  k: number,
  steps: number,
  seed = 42
): KMeansState[] {
  const rng = mulberry32(seed)
  const shuffled = [...Array(points.length).keys()].sort(() => rng() - 0.5)
  let centroids: [number, number][] = shuffled.slice(0, k).map(i => [points[i][0], points[i][1]])

  const states: KMeansState[] = []
  let prevAssignments: number[] | null = null

  for (let step = 0; step <= steps; step++) {
    const assignments = computeAssignments(points, centroids)
    const wcss = computeWCSS(points, assignments, centroids)
    const converged = prevAssignments !== null && prevAssignments.every((a, i) => a === assignments[i])

    states.push({ centroids: centroids.map(c => [c[0], c[1]] as [number, number]), assignments: [...assignments], wcss, converged })

    if (converged || step === steps) break

    centroids = computeCentroids(points, assignments, k, centroids)
    prevAssignments = assignments
  }

  return states
}

export function elbowData(points: [number, number][], maxK = 6): number[] {
  const result: number[] = []
  for (let k = 1; k <= maxK; k++) {
    const states = runKMeans(points, k, 20, 42 + k)
    result.push(states[states.length - 1].wcss)
  }
  return result
}

export function silhouetteScore(points: [number, number][], assignments: number[]): number {
  const n = points.length
  if (n < 2) return 0

  const scores: number[] = []

  for (let i = 0; i < n; i++) {
    const ci = assignments[i]
    const sameCluster = points.filter((_, j) => j !== i && assignments[j] === ci)

    if (sameCluster.length === 0) {
      scores.push(0)
      continue
    }

    const a = sameCluster.reduce((sum, p) => sum + Math.sqrt(dist2(points[i], p)), 0) / sameCluster.length

    const clusters = [...new Set(assignments)].filter(c => c !== ci)
    let b = Infinity
    for (const c of clusters) {
      const otherCluster = points.filter((_, j) => assignments[j] === c)
      const avgDist = otherCluster.reduce((sum, p) => sum + Math.sqrt(dist2(points[i], p)), 0) / otherCluster.length
      if (avgDist < b) b = avgDist
    }

    if (b === Infinity) { scores.push(0); continue }
    scores.push((b - a) / Math.max(a, b))
  }

  return scores.reduce((s, v) => s + v, 0) / scores.length
}

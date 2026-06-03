export interface LDAResult {
  projections: [number, number][]
  classProjections: Record<number, [number, number]>
  discriminantAxes: number[][]
}

function inv2x2(m: number[][]): number[][] | null {
  const det = m[0][0] * m[1][1] - m[0][1] * m[1][0]
  if (Math.abs(det) < 1e-12) return null
  return [
    [m[1][1] / det, -m[0][1] / det],
    [-m[1][0] / det, m[0][0] / det],
  ]
}

function matMul2x2(a: number[][], b: number[][]): number[][] {
  return [
    [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
    [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
  ]
}

function eigenDecomp2x2Sym(m: number[][]): { values: [number, number]; vectors: [[number, number], [number, number]] } {
  const a = m[0][0], b = m[0][1], d = m[1][1]
  const trace = a + d
  const disc = Math.sqrt(Math.max(0, ((a - d) / 2) ** 2 + b * b))
  const l1 = trace / 2 + disc
  const l2 = trace / 2 - disc

  let v1: [number, number], v2: [number, number]
  if (Math.abs(b) > 1e-10) {
    const n1 = Math.sqrt((l1 - d) ** 2 + b * b)
    v1 = n1 > 1e-12 ? [(l1 - d) / n1, b / n1] : [1, 0]
    const n2 = Math.sqrt((l2 - d) ** 2 + b * b)
    v2 = n2 > 1e-12 ? [(l2 - d) / n2, b / n2] : [0, 1]
  } else {
    v1 = a >= d ? [1, 0] : [0, 1]
    v2 = a >= d ? [0, 1] : [1, 0]
  }
  return { values: [l1, l2], vectors: [v1, v2] }
}

export function runLDA(points: [number, number][], labels: number[]): LDAResult {
  const n = points.length
  const classes = [...new Set(labels)].sort()

  const globalMean = [
    points.reduce((s, p) => s + p[0], 0) / n,
    points.reduce((s, p) => s + p[1], 0) / n,
  ]

  const classMeans: Record<number, [number, number]> = {}
  const classCounts: Record<number, number> = {}
  for (const c of classes) {
    const pts = points.filter((_, i) => labels[i] === c)
    classCounts[c] = pts.length
    classMeans[c] = [
      pts.reduce((s, p) => s + p[0], 0) / pts.length,
      pts.reduce((s, p) => s + p[1], 0) / pts.length,
    ]
  }

  // Within-class scatter Sw
  let sw = [[0, 0], [0, 0]]
  for (let i = 0; i < n; i++) {
    const c = labels[i]
    const dx = points[i][0] - classMeans[c][0]
    const dy = points[i][1] - classMeans[c][1]
    sw[0][0] += dx * dx; sw[0][1] += dx * dy
    sw[1][0] += dy * dx; sw[1][1] += dy * dy
  }

  // Between-class scatter Sb
  let sb = [[0, 0], [0, 0]]
  for (const c of classes) {
    const dx = classMeans[c][0] - globalMean[0]
    const dy = classMeans[c][1] - globalMean[1]
    const nk = classCounts[c]
    sb[0][0] += nk * dx * dx; sb[0][1] += nk * dx * dy
    sb[1][0] += nk * dy * dx; sb[1][1] += nk * dy * dy
  }

  // Regularize Sw slightly
  sw[0][0] += 1e-6; sw[1][1] += 1e-6

  const swInv = inv2x2(sw)
  let discriminantAxes: [[number, number], [number, number]]

  if (swInv) {
    const product = matMul2x2(swInv, sb)
    const { vectors } = eigenDecomp2x2Sym(product)
    discriminantAxes = vectors
  } else {
    discriminantAxes = [[1, 0], [0, 1]]
  }

  const [ax1, ax2] = discriminantAxes
  const projections: [number, number][] = points.map(([x, y]) => {
    const cx = x - globalMean[0], cy = y - globalMean[1]
    return [cx * ax1[0] + cy * ax1[1], cx * ax2[0] + cy * ax2[1]]
  })

  const classProjections: Record<number, [number, number]> = {}
  for (const c of classes) {
    const dx = classMeans[c][0] - globalMean[0]
    const dy = classMeans[c][1] - globalMean[1]
    classProjections[c] = [dx * ax1[0] + dy * ax1[1], dx * ax2[0] + dy * ax2[1]]
  }

  return { projections, classProjections, discriminantAxes }
}

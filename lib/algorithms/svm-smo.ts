export interface SVMModel {
  w: number[]
  b: number
  supportVectors: number[][]
  kernel: 'linear' | 'rbf' | 'poly'
  gamma: number
  degree: number
}

export function trainLinearSVM(
  xs: number[][], labels: number[], C = 1.0, maxIter = 500
): SVMModel {
  const n = xs.length
  const d = xs[0].length
  let w = new Array(d).fill(0)
  let b = 0

  for (let t = 0; t < maxIter; t++) {
    const idx = t % n
    const x = xs[idx]
    const y = labels[idx]
    const eta = 1.0 / (0.01 * (t + 1))
    const decision = dot(w, x) + b

    const scale = 1 - eta * 0.01
    if (y * decision < 1) {
      w = w.map((wi, j) => wi * scale + eta * C * y * x[j])
      b = b + eta * C * y
    } else {
      w = w.map(wi => wi * scale)
    }
  }

  const supportVectors = xs.filter((x, i) => {
    const margin = labels[i] * (dot(w, x) + b)
    return margin <= 1.05
  })

  return { w, b, supportVectors, kernel: 'linear', gamma: 0.5, degree: 3 }
}

export function predictSVM(model: SVMModel, x: number[]): number {
  return dot(model.w, x) + model.b >= 0 ? 1 : 0
}

export function marginWidth(model: SVMModel): number {
  const norm = Math.sqrt(model.w.reduce((s, wi) => s + wi * wi, 0))
  return norm > 1e-9 ? 2 / norm : Infinity
}

export function rbfKernel(x: number[], y: number[], gamma: number): number {
  let sq = 0
  for (let i = 0; i < x.length; i++) sq += (x[i] - y[i]) ** 2
  return Math.exp(-gamma * sq)
}

export function polyKernel(x: number[], y: number[], gamma: number, degree: number): number {
  return (gamma * dot(x, y) + 1) ** degree
}

export function kernelDecisionValue(
  x: number[],
  supportVectors: number[][],
  alphas: number[],
  svLabels: number[],
  b: number,
  kernel: 'rbf' | 'poly',
  gamma: number,
  degree: number
): number {
  let sum = 0
  for (let i = 0; i < supportVectors.length; i++) {
    const k = kernel === 'rbf'
      ? rbfKernel(x, supportVectors[i], gamma)
      : polyKernel(x, supportVectors[i], gamma, degree)
    sum += alphas[i] * svLabels[i] * k
  }
  return sum + b
}

export interface KernelSVMModel {
  alphas: number[]
  supportVectors: number[][]
  svLabels: number[]
  b: number
  kernel: 'rbf' | 'poly'
  gamma: number
  degree: number
}

export function trainKernelSVM(
  xs: number[][], labels: number[], kernel: 'rbf' | 'poly' = 'rbf',
  gamma = 0.5, degree = 3, C = 1.0
): KernelSVMModel {
  const n = xs.length
  const alphas = new Array(n).fill(0)
  let b = 0
  const maxIter = 100

  const K: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) =>
      kernel === 'rbf'
        ? rbfKernel(xs[i], xs[j], gamma)
        : polyKernel(xs[i], xs[j], gamma, degree)
    )
  )

  for (let iter = 0; iter < maxIter; iter++) {
    for (let i = 0; i < n; i++) {
      const fi = decisionAt(i, alphas, labels, K, b)
      const yi = labels[i]

      if (yi * fi < 1 - 1e-4 && alphas[i] < C) {
        const grad = 1 - yi * fi
        const denom = K[i][i] || 1e-9
        const delta = Math.min(grad / denom, C - alphas[i])
        alphas[i] += delta
        b += 0.01 * yi * (1 - yi * fi)
      } else if (yi * fi > 1 + 1e-4 && alphas[i] > 0) {
        const delta = Math.min(alphas[i], 0.01 * (yi * fi - 1))
        alphas[i] -= delta
      }
    }
  }

  const threshold = 1e-4
  const svIndices = alphas.map((_, i) => i).filter(i => alphas[i] > threshold)

  let bSum = 0
  let bCount = 0
  for (const i of svIndices) {
    let sum = 0
    for (const j of svIndices) {
      sum += alphas[j] * labels[j] * K[i][j]
    }
    bSum += labels[i] - sum
    bCount++
  }
  const finalB = bCount > 0 ? bSum / bCount : b

  return {
    alphas: svIndices.map(i => alphas[i]),
    supportVectors: svIndices.map(i => xs[i]),
    svLabels: svIndices.map(i => labels[i]),
    b: finalB,
    kernel,
    gamma,
    degree,
  }
}

export function predictKernelSVM(model: KernelSVMModel, x: number[]): number {
  const val = kernelDecisionValue(
    x, model.supportVectors, model.alphas, model.svLabels,
    model.b, model.kernel, model.gamma, model.degree
  )
  return val >= 0 ? 1 : 0
}

function dot(a: number[], b: number[]): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

function decisionAt(
  i: number, alphas: number[], labels: number[], K: number[][], b: number
): number {
  let sum = 0
  for (let j = 0; j < alphas.length; j++) {
    sum += alphas[j] * labels[j] * K[j][i]
  }
  return sum + b
}

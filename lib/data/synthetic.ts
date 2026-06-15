import * as d3 from 'd3'

export interface Point { x: number; y: number; label: number }

// Suppress unused import warning — d3 used for future extensions
void d3

// Seeded random using mulberry32
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// Gaussian blobs: k classes, n points per class
export function gaussianBlobs(
  k = 2, n = 40, spread = 0.8, seed = 42
): Point[] {
  const rng = mulberry32(seed)
  const centers = Array.from({ length: k }, (_, i) => ({
    cx: Math.cos((i / k) * Math.PI * 2) * 2,
    cy: Math.sin((i / k) * Math.PI * 2) * 2,
  }))
  const pts: Point[] = []
  centers.forEach(({ cx, cy }, label) => {
    for (let i = 0; i < n; i++) {
      // Box-Muller for normal distribution
      const u1 = rng() || 1e-10, u2 = rng()
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2)
      pts.push({ x: cx + z0 * spread, y: cy + z1 * spread, label })
    }
  })
  return pts
}

// Two moons
export function twoMoons(n = 80, noise = 0.15, seed = 42): Point[] {
  const rng = mulberry32(seed)
  const pts: Point[] = []
  for (let i = 0; i < n; i++) {
    const label = i < n / 2 ? 0 : 1
    const theta = (Math.PI * (i % (n / 2))) / (n / 2)
    const cx = label === 0 ? 0 : 1
    const cy = label === 0 ? 0 : -0.3
    const nx = (rng() - 0.5) * 2 * noise
    const ny = (rng() - 0.5) * 2 * noise
    pts.push({
      x: cx + Math.cos(theta) + nx,
      y: cy + Math.sin(theta) + ny,
      label,
    })
  }
  return pts
}

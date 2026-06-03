export type PointType = 'core' | 'border' | 'noise'

export interface DBSCANResult {
  assignments: number[]
  pointTypes: PointType[]
}

function dist(a: [number, number], b: [number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)
}

export function runDBSCAN(
  points: [number, number][],
  eps: number,
  minPts: number
): DBSCANResult {
  const n = points.length
  const assignments = new Array<number>(n).fill(-1)
  const pointTypes = new Array<PointType>(n).fill('noise')
  const visited = new Array<boolean>(n).fill(false)

  const neighbors = (idx: number): number[] => {
    const result: number[] = []
    for (let j = 0; j < n; j++) {
      if (dist(points[idx], points[j]) <= eps) result.push(j)
    }
    return result
  }

  let clusterId = 0

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue
    visited[i] = true

    const nbrs = neighbors(i)

    if (nbrs.length < minPts) {
      continue
    }

    pointTypes[i] = 'core'
    assignments[i] = clusterId

    const queue = [...nbrs.filter(j => j !== i)]

    while (queue.length > 0) {
      const q = queue.shift()!

      if (!visited[q]) {
        visited[q] = true
        const qNbrs = neighbors(q)
        if (qNbrs.length >= minPts) {
          pointTypes[q] = 'core'
          for (const qn of qNbrs) {
            if (!queue.includes(qn) && !visited[qn]) queue.push(qn)
          }
        } else {
          pointTypes[q] = 'border'
        }
      }

      if (assignments[q] === -1) {
        assignments[q] = clusterId
        if (pointTypes[q] === 'noise') pointTypes[q] = 'border'
      }
    }

    clusterId++
  }

  return { assignments, pointTypes }
}

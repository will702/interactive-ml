import * as d3 from 'd3'

// Class color scale — warm rust accent + complementary teal
export const CLASS_COLORS = ['oklch(0.55 0.18 25)', 'oklch(0.5 0.15 220)', 'oklch(0.55 0.16 140)']

export function classColor(label: number): string {
  return CLASS_COLORS[label % CLASS_COLORS.length]
}

// Linear scale helper
export function linearScale(domain: [number, number], range: [number, number]) {
  return d3.scaleLinear().domain(domain).range(range)
}

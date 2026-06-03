import { ReactNode, useRef, useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

interface ScrollyProps {
  frames: ReactNode[]    // narrative text frames (right side)
  scene: (progress: number) => ReactNode  // widget scene (left side)
  frameHeight?: string   // height of each frame (default: '80vh')
}

export default function Scrolly({ frames, scene, frameHeight = '80vh' }: ScrollyProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    if (prefersReduced) return

    const onScroll = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = el.offsetHeight - window.innerHeight
      const scrolled = -rect.top
      setProgress(Math.min(1, Math.max(0, scrolled / total)))
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [prefersReduced])

  if (prefersReduced) {
    // Reduced motion: show all frames statically
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {frames.map((frame, i) => (
          <div key={i} style={{ padding: '1.5rem', background: 'var(--accent-soft)', borderRadius: 'var(--radius)' }}>
            {frame}
          </div>
        ))}
        {scene(1)}
      </div>
    )
  }

  // frameHeight must be a vh value (e.g. '80vh')
  const totalHeight = `${frames.length * parseFloat(frameHeight)}vh`
  const frameIndex = Math.min(frames.length - 1, Math.floor(progress * frames.length))

  return (
    <div ref={containerRef} style={{ height: totalHeight, position: 'relative' }}>
      {/* Sticky container */}
      <div style={{ position: 'sticky', top: '52px', height: 'calc(100vh - 52px)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start', padding: '2rem 0' }}>
        {/* Left: widget scene */}
        <div style={{ position: 'sticky', top: '52px', padding: '1rem 0' }}>
          {scene(progress)}
        </div>
        {/* Right: narrative frame */}
        <div className="prose" style={{ paddingTop: '2rem' }}>
          {frames[frameIndex]}
        </div>
      </div>
    </div>
  )
}

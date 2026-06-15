'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function ProgressBar() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(() => {
    if (typeof window === 'undefined') return 0
    return parseFloat(localStorage.getItem(`progress:${pathname}`) ?? '0')
  })

  useEffect(() => {
    const key = `progress:${pathname}`
    const saved = parseFloat(localStorage.getItem(key) ?? '0')

    const onScroll = () => {
      const el = document.documentElement
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight)
      const val = isNaN(pct) ? 0 : Math.min(1, Math.max(0, pct))
      setProgress(val)
      if (val > saved) localStorage.setItem(key, String(val))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  return (
    <div style={{ marginLeft: 'auto', width: '120px', height: '3px', background: 'var(--rule)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${progress * 100}%`, background: 'var(--accent)', transition: 'width 0.1s linear' }} />
    </div>
  )
}

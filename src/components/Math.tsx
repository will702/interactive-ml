import { useEffect, useRef } from 'react'
import katex from 'katex'

interface MathProps {
  children: string
  block?: boolean
}

export default function Math({ children, block = false }: MathProps) {
  const ref = useRef<HTMLSpanElement | HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    katex.render(children, ref.current, {
      displayMode: block,
      throwOnError: false,
    })
  }, [children, block])

  return block
    ? <div ref={ref as React.RefObject<HTMLDivElement>} className="katex-block" />
    : <span ref={ref as React.RefObject<HTMLSpanElement>} />
}

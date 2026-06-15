'use client'
import { ReactNode } from 'react'

interface FigureProps {
  number?: number
  caption: string
  children: ReactNode
}

export default function Figure({ caption, children }: FigureProps) {
  return (
    <figure style={{ margin: '2rem 0' }}>
      {children}
      <figcaption style={{ marginTop: '0.5rem', fontFamily: 'var(--font-display)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', fontStyle: 'italic' }}>
        {caption}
      </figcaption>
    </figure>
  )
}

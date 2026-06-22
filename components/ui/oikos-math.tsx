'use client'
import { InlineMath, BlockMath } from 'react-katex'
import type { ReactNode } from 'react'

interface OikosMathProps {
  latex: string
  block?: boolean
}

function Fallback({ latex }: { latex: string }) {
  return (
    <span className="font-mono text-xs text-red-400/70 bg-red-500/5 px-1 rounded">
      {latex}
    </span>
  )
}

function renderError(latex: string) {
  return (error: Error): ReactNode => {
    console.error('[OikosMath] LaTeX inválido:', latex, error)
    return <Fallback latex={latex} />
  }
}

export function OikosMath({ latex, block = false }: OikosMathProps) {
  if (!latex?.trim()) return null
  try {
    return block
      ? <BlockMath math={latex} renderError={renderError(latex)} />
      : <InlineMath math={latex} renderError={renderError(latex)} />
  } catch (e) {
    console.error('[OikosMath]', e)
    return <Fallback latex={latex} />
  }
}

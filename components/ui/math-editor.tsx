'use client'
import { useEffect, useRef, useState } from 'react'

interface MathEditorProps {
  value: string
  onChange: (latex: string, texto: string) => void
  placeholder?: string
}

const TEMPLATES = [
  { label: 'Fração',    latex: '\\frac{#0}{#1}',     display: '□/□' },
  { label: 'Potência',  latex: '{#0}^{#1}',           display: 'x²' },
  { label: 'Subscrito', latex: '{#0}_{#1}',           display: 'x₁' },
  { label: 'Raiz',      latex: '\\sqrt{#0}',          display: '√□' },
  { label: 'Raiz n',    latex: '\\sqrt[#1]{#0}',      display: 'ⁿ√□' },
  { label: 'Somatório', latex: '\\sum_{#0}^{#1}',     display: '∑' },
  { label: 'Integral',  latex: '\\int_{#0}^{#1}',     display: '∫' },
  { label: 'Limite',    latex: '\\lim_{#0 \\to #1}',  display: 'lim' },
  { label: 'Absoluto',  latex: '\\left|#0\\right|',   display: '|x|' },
  { label: 'Parêntese', latex: '\\left(#0\\right)',   display: '(x)' },
  { label: 'Colchete',  latex: '\\left[#0\\right]',   display: '[x]' },
  { label: 'Chave',     latex: '\\left\\{#0\\right\\}', display: '{x}' },
]

const SIMBOLOS_GRID = [
  ['α','β','γ','δ','ε','ζ','η','θ'],
  ['ι','κ','λ','μ','ν','ξ','π','ρ'],
  ['σ','τ','υ','φ','χ','ψ','ω','∂'],
  ['Γ','Δ','Θ','Λ','Ξ','Π','Σ','Φ'],
  ['Ψ','Ω','∞','≈','≠','≤','≥','∈'],
  ['∑','∏','∫','∮','∇','∀','∃','∄'],
  ['→','←','↑','↓','↔','⇒','⇔','∝'],
]

export function MathEditor({ value, onChange, placeholder }: MathEditorProps) {
  const mfRef    = useRef<any>(null)
  const wrapRef  = useRef<HTMLDivElement>(null)
  const [modo,   setModo]   = useState<'visual' | 'texto'>('visual')
  const [texto,  setTexto]  = useState(value || '')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function init() {
      const { MathfieldElement } = await import('mathlive')
      if (!wrapRef.current || mfRef.current) return

      const mf = new MathfieldElement()
      mf.style.cssText = `
        width: 100%;
        min-height: 56px;
        font-size: 1.2rem;
        background: transparent;
        color: white;
        border: none;
        outline: none;
        padding: 8px 4px;
        --keyboard-toggle-glyph-color: #6b7280;
        --caret-color: #60a5fa;
        --selection-background-color: rgba(96,165,250,0.3);
        --placeholder-color: #4b5563;
      `
      mf.setAttribute('placeholder', placeholder || 'Digite a equação...')
      mf.value = value || ''
      mf.addEventListener('input', () => {
        const latex = mf.value
        const ascii = latex
          .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)')
          .replace(/\{([^}]*)\}\^?\{([^}]*)\}/g, '$1**$2')
          .replace(/\\sqrt\{([^}]*)\}/g, 'sqrt($1)')
          .replace(/\\cdot/g, '*')
          .replace(/\\times/g, '*')
          .replace(/\\div/g, '/')
          .replace(/\\left\(/g, '(').replace(/\\right\)/g, ')')
          .replace(/\\left\[/g, '[').replace(/\\right\]/g, ']')
          .replace(/[{}\\]/g, '')
          .trim()
        onChange(latex, ascii)
        setTexto(ascii)
      })
      wrapRef.current.appendChild(mf)
      mfRef.current = mf
      setLoaded(true)
    }
    init()
    return () => {
      if (mfRef.current && wrapRef.current) {
        wrapRef.current.removeChild(mfRef.current)
        mfRef.current = null
      }
    }
  }, [])

  function inserirTemplate(latex: string) {
    if (!mfRef.current) return
    mfRef.current.executeCommand(['insert', latex])
    mfRef.current.focus()
  }

  function inserirSimbolo(s: string) {
    if (!mfRef.current) return
    mfRef.current.executeCommand(['insert', s])
    mfRef.current.focus()
  }

  function aplicarTexto() {
    if (!mfRef.current) return
    mfRef.current.value = texto
    onChange(texto, texto)
  }

  return (
    <div className="space-y-3">

      {/* TOOLBAR DE TEMPLATES */}
      <div className="flex items-center gap-1 flex-wrap p-2 bg-white/5 border border-white/10 rounded-xl">
        <span className="text-xs text-gray-600 mr-1">Inserir:</span>
        {TEMPLATES.map(t => (
          <button key={t.label} type="button" onClick={() => inserirTemplate(t.latex)}
            title={t.label}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-gray-300 hover:bg-white/15 hover:text-white transition font-mono">
            {t.display}
          </button>
        ))}
        <div className="w-px h-5 bg-white/10 mx-1" />
        <span className="text-xs text-gray-600 mr-1">Modo:</span>
        <button type="button" onClick={() => setModo('visual')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${modo === 'visual' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-gray-500 hover:text-white border border-white/10'}`}>
          Visual
        </button>
        <button type="button" onClick={() => setModo('texto')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${modo === 'texto' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-gray-500 hover:text-white border border-white/10'}`}>
          Texto
        </button>
      </div>

      {/* SÍMBOLOS */}
      <div className="p-2 bg-white/5 border border-white/10 rounded-xl">
        {SIMBOLOS_GRID.map((linha, i) => (
          <div key={i} className="flex gap-1 mb-1">
            {linha.map(s => (
              <button key={s} type="button" onClick={() => inserirSimbolo(s)}
                className="w-8 h-7 rounded-md bg-white/5 text-xs font-mono text-gray-400 hover:bg-white/15 hover:text-white transition">
                {s}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* EDITOR VISUAL */}
      {modo === 'visual' && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-h-16">
          <div ref={wrapRef} className="mathlive-container" />
          {!loaded && <p className="text-xs text-gray-600 italic">Carregando editor...</p>}
        </div>
      )}

      {/* EDITOR TEXTO */}
      {modo === 'texto' && (
        <div className="space-y-2">
          <input value={texto} onChange={e => setTexto(e.target.value)}
            placeholder="Ex: (1/(1-(1-m)*(c*(1-t)+h)))*Z"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-700" />
          <button type="button" onClick={aplicarTexto}
            className="text-xs text-blue-400 hover:underline">
            Aplicar no editor visual
          </button>
        </div>
      )}

      <style>{`
        math-field { --text-font-family: 'Montserrat', sans-serif; }
        math-field::part(container) { background: transparent; }
        math-field::part(virtual-keyboard-toggle) { display: none; }
      `}</style>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import dynamic from 'next/dynamic'
import { RichEditor } from '@/components/ui/rich-editor'
import { MathEditor } from '@/components/ui/math-editor'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Parametro = { id: string; nome: string; valor: number; descricao: string }
type Equacao   = { id: string; numero: number; nome: string; variavel: string; expressao: string; latex: string; descricao: string; valida: boolean | null }
type Secao     = { id: string; titulo: string; conteudo: string }
type Referencia = { id: string; autor: string; ano: string; titulo: string; publicacao: string }
type Sensibilidade = { id: string; nome: string; min: number; max: number; mostrar: string }

function uid() { return Math.random().toString(36).slice(2) }

export default function ConstrutorPage() {
  const params   = useParams()
  const router   = useRouter()
  const supabase = createClient()

  const [projeto,    setProjeto]    = useState<any>(null)
  const [loading,    setLoading]    = useState(true)
  const [salvando,   setSalvando]   = useState(false)
  const [calculando, setCalculando] = useState(false)
  const [resultado,  setResultado]  = useState<any>(null)
  const [aba,        setAba]        = useState<'modelo' | 'notas' | 'analise' | 'exportar'>('modelo')
  const [blocos,     setBlocos]     = useState<any>(null)
  const [mostrarBlocos, setMostrarBlocos] = useState(false)

  const [tituloModelo, setTituloModelo] = useState('')
  const [parametros,   setParametros]   = useState<Parametro[]>([
    { id: uid(), nome: 'a', valor: 100,  descricao: 'Consumo autônomo' },
    { id: uid(), nome: 'c', valor: 0.75, descricao: 'Propensão a consumir' },
    { id: uid(), nome: 'T', valor: 200,  descricao: 'Impostos' },
    { id: uid(), nome: 'I0', valor: 200, descricao: 'Investimento autônomo' },
    { id: uid(), nome: 'G0', valor: 300, descricao: 'Gastos do governo' },
  ])
  const [equacoes,    setEquacoes]    = useState<Equacao[]>([
    { id: uid(), numero: 1, nome: 'Consumo', variavel: 'C', expressao: 'a + c*(Y - T)', latex: '', descricao: 'Função consumo keynesiana', valida: null },
    { id: uid(), numero: 2, nome: 'Investimento', variavel: 'I', expressao: 'I0', latex: '', descricao: 'Investimento autônomo', valida: null },
    { id: uid(), numero: 3, nome: 'Governo', variavel: 'G', expressao: 'G0', latex: '', descricao: 'Gasto público', valida: null },
    { id: uid(), numero: 4, nome: 'Produto', variavel: 'Y', expressao: 'C + I + G', latex: '', descricao: 'Demanda agregada', valida: null },
  ])
  const [sensibilidades, setSensibilidades] = useState<Sensibilidade[]>([])

  const [secoes,      setSecoes]      = useState<Secao[]>([
    { id: uid(), titulo: 'Introdução', conteudo: '' },
    { id: uid(), titulo: 'Modelo Teórico', conteudo: '' },
    { id: uid(), titulo: 'Resultados', conteudo: '' },
  ])
  const [referencias, setReferencias] = useState<Referencia[]>([])

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase.from('projetos').select('*').eq('id', params.id).single()
      if (!data) { router.push('/projetos'); return }
      setProjeto(data)
      setTituloModelo(data.titulo)
      if (data.configuracao?.parametros) setParametros(data.configuracao.parametros)
      if (data.configuracao?.equacoes)   setEquacoes(data.configuracao.equacoes)
      if (data.configuracao?.sensibilidades) setSensibilidades(data.configuracao.sensibilidades)
      if (data.configuracao?.secoes)     setSecoes(data.configuracao.secoes)
      if (data.configuracao?.referencias) setReferencias(data.configuracao.referencias)
      setLoading(false)
    }
    carregar()
    fetch(`${API_URL}/modelo-proprio/blocos`).then(r => r.json()).then(setBlocos).catch(() => {})
  }, [params.id])

  async function adicionarModeloPronto(modeloId: string) {
    try {
      const res = await fetch(`${API_URL}/modelo-proprio/modelos/${modeloId}`)
      const m = await res.json()
      setParametros(m.parametros.map((p: any) => ({ id: uid(), ...p })))
      setEquacoes(m.equacoes.map((e: any, i: number) => ({
        id: uid(), numero: i + 1, nome: e.nome || '', variavel: e.variavel,
        expressao: e.expressao, latex: '', descricao: '', valida: null,
      })))
      setTituloModelo(m.nome)
      setMostrarBlocos(false)
    } catch (e) { console.error(e) }
  }

  async function adicionarBloco(blocoId: string) {
    try {
      const res = await fetch(`${API_URL}/modelo-proprio/blocos/${blocoId}`)
      const b = await res.json()
      setEquacoes(prev => [...prev, {
        id: uid(), numero: prev.length + 1, nome: b.equacao.nome || '',
        variavel: b.equacao.variavel, expressao: b.equacao.expressao,
        latex: '', descricao: '', valida: null,
      }])
      setParametros(prev => {
        const nomes = new Set(prev.map(p => p.nome))
        const novos = b.parametros.filter((p: any) => !nomes.has(p.nome)).map((p: any) => ({ id: uid(), ...p }))
        return [...prev, ...novos]
      })
      setMostrarBlocos(false)
    } catch (e) { console.error(e) }
  }

  async function calcular() {
    setCalculando(true)
    setResultado(null)
    try {
      const parametrosValidos = parametros.filter(p => p.nome.trim() !== '')
      const equacoesValidas = equacoes.filter(e => e.variavel.trim() !== '' && e.expressao.trim() !== '')
      const res = await api.modelo.resolver({
        parametros: parametrosValidos.map(p => ({ nome: p.nome.trim(), valor: p.valor, descricao: p.descricao })),
        equacoes: equacoesValidas.map(e => ({ nome: e.nome, variavel: e.variavel.trim(), expressao: e.expressao.trim() })),
        sensibilidades: sensibilidades.map(s => ({
          nome: s.nome, min: s.min, max: s.max, pontos: 200,
          mostrar: s.mostrar.split(',').map(x => x.trim()).filter(Boolean),
        })),
      })
      setResultado(res)
      setAba('analise')
    } catch (e: any) {
      setResultado({ valores: {}, series: null, erros: [e.message], latex: {}, dependencias: [], elasticidades: {} })
      setAba('analise')
    }
    setCalculando(false)
  }

  async function salvar() {
    if (!projeto) return
    setSalvando(true)
    await supabase.from('projetos').update({
      configuracao: { parametros, equacoes, sensibilidades, secoes, referencias },
      updated_at: new Date().toISOString(),
    }).eq('id', projeto.id)
    setSalvando(false)
  }

  async function exportarPDF() {
    const { default: jsPDF } = await import('jspdf')
    const { default: html2canvas } = await import('html2canvas')
    const el = document.getElementById('exportar-conteudo')
    if (!el) return
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#0b0f19' })
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const w = pdf.internal.pageSize.getWidth()
    const h = (canvas.height * w) / canvas.width
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h)
    pdf.save(`${tituloModelo.replace(/\s+/g, '_')}.pdf`)
  }

  if (loading) return (
    <main className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
      <p className="text-gray-400 text-sm">Carregando construtor...</p>
    </main>
  )

  const endogenasResolvidas = resultado ? Object.keys(resultado.valores || {}) : []

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white flex flex-col">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0f19]/90 backdrop-blur-xl border-b border-white/10 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projetos/${params.id}`} className="text-sm text-gray-400 hover:text-white transition">← Voltar</Link>
          <span className="text-white/20">|</span>
          <span className="text-sm font-semibold text-white">{tituloModelo}</span>
          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Construtor de Funções</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {[{ id: 'modelo', label: 'Modelo' }, { id: 'notas', label: 'Notas' }, { id: 'analise', label: 'Análise' }, { id: 'exportar', label: 'Exportar' }].map(a => (
              <button key={a.id} onClick={() => setAba(a.id as any)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${aba === a.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {a.label}
              </button>
            ))}
          </div>
          <button onClick={salvar} disabled={salvando}
            className="bg-white/5 border border-white/10 text-gray-300 px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-white/10 transition disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={calcular} disabled={calculando}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50">
            {calculando ? 'Calculando...' : 'Calcular'}
          </button>
        </div>
      </header>

      <div className="pt-14 flex flex-1">

        {/* ═══════════════ ABA MODELO ═══════════════ */}
        {aba === 'modelo' && (
          <div className="flex w-full">

            {/* PAINEL ESQUERDO */}
            <div className="w-80 border-r border-white/10 overflow-y-auto h-[calc(100vh-56px)] flex flex-col">

              {/* PARÂMETROS */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Parâmetros</p>
                  <button onClick={() => setParametros(p => [...p, { id: uid(), nome: '', valor: 0, descricao: '' }])}
                    className="text-xs text-blue-400 hover:underline">+ Add</button>
                </div>
                {endogenasResolvidas.length > 0 && (
                  <p className="text-[10px] text-gray-600 mb-2 leading-relaxed">
                    Variáveis endógenas (resolvidas automaticamente): {endogenasResolvidas.join(', ')} — não precisam ser cadastradas.
                  </p>
                )}
                <div className="space-y-2">
                  {parametros.map((p, i) => (
                    <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <input value={p.nome}
                          onChange={e => { const n=[...parametros]; n[i].nome=e.target.value; setParametros(n) }}
                          placeholder="nome" className="w-14 bg-transparent border-b border-white/20 text-xs font-mono text-white focus:outline-none focus:border-blue-500 pb-0.5" />
                        <span className="text-gray-600 text-xs">=</span>
                        <input type="number" value={p.valor}
                          onChange={e => { const n=[...parametros]; n[i].valor=parseFloat(e.target.value)||0; setParametros(n) }}
                          className="flex-1 bg-transparent border-b border-white/20 text-xs text-blue-300 focus:outline-none focus:border-blue-500 pb-0.5" />
                        <button onClick={() => setParametros(parametros.filter((_,j)=>j!==i))}
                          className="text-gray-600 hover:text-red-400 text-xs transition">×</button>
                      </div>
                      <input value={p.descricao}
                        onChange={e => { const n=[...parametros]; n[i].descricao=e.target.value; setParametros(n) }}
                        placeholder="descrição..." className="w-full bg-transparent text-xs text-gray-500 focus:outline-none placeholder:text-gray-700" />
                    </div>
                  ))}
                </div>
              </div>

              {/* SENSIBILIDADE */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Sensibilidade</p>
                  <button onClick={() => setSensibilidades(s => [...s, { id: uid(), nome: 'G0', min: 0, max: 500, mostrar: 'Y' }])}
                    className="text-xs text-blue-400 hover:underline">+ Add</button>
                </div>
                <p className="text-[10px] text-gray-600 mb-2 leading-relaxed">
                  Varie um parâmetro e veja o efeito sobre as endógenas (ex: variar G0, mostrar Y).
                </p>
                <div className="space-y-2">
                  {sensibilidades.map((s, i) => (
                    <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input value={s.nome} onChange={e => { const n=[...sensibilidades]; n[i].nome=e.target.value; setSensibilidades(n) }}
                          placeholder="param" className="w-16 bg-transparent border-b border-white/20 text-xs font-mono text-white focus:outline-none focus:border-blue-500 pb-0.5" />
                        <span className="text-[10px] text-gray-600">→ mostrar</span>
                        <input value={s.mostrar} onChange={e => { const n=[...sensibilidades]; n[i].mostrar=e.target.value; setSensibilidades(n) }}
                          placeholder="Y" className="flex-1 bg-transparent border-b border-white/20 text-xs font-mono text-white focus:outline-none focus:border-blue-500 pb-0.5" />
                        <button onClick={() => setSensibilidades(sensibilidades.filter((_,j)=>j!==i))}
                          className="text-gray-600 hover:text-red-400 text-xs transition">×</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-600">min</span>
                        <input type="number" value={s.min} onChange={e => { const n=[...sensibilidades]; n[i].min=parseFloat(e.target.value)||0; setSensibilidades(n) }}
                          className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
                        <span className="text-[10px] text-gray-600">max</span>
                        <input type="number" value={s.max} onChange={e => { const n=[...sensibilidades]; n[i].max=parseFloat(e.target.value)||0; setSensibilidades(n) }}
                          className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PROJETO */}
              <div className="p-4 border-t border-white/10 mt-auto">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Projeto</p>
                <div className="space-y-1">
                  <button onClick={() => {
                    const novo = prompt('Novo nome do projeto:', tituloModelo)
                    if (novo && novo.trim()) { setTituloModelo(novo.trim()); supabase.from('projetos').update({ titulo: novo.trim() }).eq('id', params.id as string) }
                  }} className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/10 transition">
                    Renomear projeto
                  </button>
                  <Link href="/projetos" className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/10 transition block">
                    Meus projetos
                  </Link>
                  <button onClick={async () => {
                    if (!confirm('Tem certeza que deseja excluir este projeto?')) return
                    await supabase.from('projetos').delete().eq('id', params.id as string)
                    window.location.href = '/projetos'
                  }} className="w-full text-left px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition">
                    Excluir projeto
                  </button>
                </div>
              </div>
            </div>

            {/* PAINEL DIREITO — EQUAÇÕES */}
            <div className="flex-1 overflow-y-auto h-[calc(100vh-56px)] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Equações do Modelo</h2>
                <div className="flex items-center gap-3">
                  <button onClick={() => setMostrarBlocos(!mostrarBlocos)}
                    className="text-sm text-purple-300 hover:underline">+ Bloco pronto</button>
                  <button onClick={() => setEquacoes(e => [...e, { id: uid(), numero: e.length+1, nome: '', variavel: '', expressao: '', latex: '', descricao: '', valida: null }])}
                    className="text-sm text-blue-400 hover:underline">+ Nova equação</button>
                </div>
              </div>

              {/* SELETOR DE BLOCOS */}
              {mostrarBlocos && blocos && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Modelos completos</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {blocos.modelos?.map((m: any) => (
                      <button key={m.id} onClick={() => adicionarModeloPronto(m.id)}
                        className="bg-purple-500/10 border border-purple-500/30 text-purple-200 rounded-lg px-3 py-1.5 text-xs hover:bg-purple-500/20 transition" title={m.descricao}>
                        {m.nome}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Blocos individuais</p>
                  <div className="flex flex-wrap gap-2">
                    {blocos.blocos?.map((b: any) => (
                      <button key={b.id} onClick={() => adicionarBloco(b.id)}
                        className="bg-white/5 border border-white/10 text-gray-300 rounded-lg px-3 py-1.5 text-xs hover:border-blue-500/40 hover:text-blue-300 transition">
                        + {b.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {equacoes.map((eq, i) => (
                  <div key={eq.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0 mt-1">
                        ({i+1})
                      </div>
                      <div className="flex-1 space-y-3">
                        <input value={eq.nome}
                          onChange={e => { const n=[...equacoes]; n[i].nome=e.target.value; setEquacoes(n) }}
                          placeholder="Nome da equação (ex: Consumo Keynesiano)"
                          className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none placeholder:text-gray-600 border-b border-transparent focus:border-white/20 pb-1" />
                        <div className="flex items-start gap-3">
                          <input value={eq.variavel}
                            onChange={e => { const n=[...equacoes]; n[i].variavel=e.target.value; setEquacoes(n) }}
                            placeholder="Y"
                            className="w-12 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500 text-center mt-1" />
                          <span className="text-gray-500 font-mono text-lg mt-2">=</span>
                          <div className="flex-1">
                            <MathEditor value={eq.expressao}
                              onChange={(latex, ascii) => { const n=[...equacoes]; n[i].expressao=ascii; n[i].latex=latex; setEquacoes(n) }}
                              placeholder="Monte sua equação..." />
                          </div>
                          <button onClick={() => setEquacoes(equacoes.filter((_,j)=>j!==i))}
                            className="text-gray-600 hover:text-red-400 transition text-lg mt-2">×</button>
                        </div>
                        <input value={eq.descricao}
                          onChange={e => { const n=[...equacoes]; n[i].descricao=e.target.value; setEquacoes(n) }}
                          placeholder="Descrição teórica desta equação..."
                          className="w-full bg-transparent text-xs text-gray-500 focus:outline-none placeholder:text-gray-700 italic" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ ABA NOTAS ═══════════════ */}
        {aba === 'notas' && (
          <div className="flex w-full">
            <div className="w-56 border-r border-white/10 overflow-y-auto h-[calc(100vh-56px)] p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Seções</p>
                <button onClick={() => setSecoes(s => [...s, { id: uid(), titulo: 'Nova Seção', conteudo: '' }])}
                  className="text-xs text-blue-400 hover:underline">+</button>
              </div>
              <div className="space-y-1">
                {secoes.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2 group">
                    <button className="flex-1 text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/10 transition truncate">
                      {s.titulo || 'Seção sem título'}
                    </button>
                    <button onClick={() => setSecoes(secoes.filter((_,j)=>j!==i))}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-xs transition">×</button>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Referências</p>
                <button onClick={() => setReferencias(r => [...r, { id: uid(), autor: '', ano: '', titulo: '', publicacao: '' }])}
                  className="text-xs text-blue-400 hover:underline">+ Adicionar</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto h-[calc(100vh-56px)] p-8 max-w-4xl">
              <div className="space-y-8">
                {secoes.map((s, i) => (
                  <div key={s.id}>
                    <input value={s.titulo}
                      onChange={e => { const n=[...secoes]; n[i].titulo=e.target.value; setSecoes(n) }}
                      className="w-full bg-transparent text-xl font-bold text-white focus:outline-none border-b border-transparent focus:border-white/20 pb-1 mb-4" />
                    <RichEditor content={s.conteudo}
                      onChange={v => { const n=[...secoes]; n[i].conteudo=v; setSecoes(n) }}
                      placeholder={`Escreva o conteúdo de "${s.titulo}" aqui...`} />
                  </div>
                ))}
                {referencias.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Referências</h3>
                    <div className="space-y-3">
                      {referencias.map((r, i) => (
                        <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4 grid grid-cols-2 gap-3">
                          {[
                            { label: 'Autor(es)', key: 'autor', placeholder: 'Silva, J.' },
                            { label: 'Ano', key: 'ano', placeholder: '2024' },
                            { label: 'Título', key: 'titulo', placeholder: 'Título do trabalho' },
                            { label: 'Publicação', key: 'publicacao', placeholder: 'Revista Economia, v.1' },
                          ].map(f => (
                            <div key={f.key}>
                              <label className="text-xs text-gray-500 block mb-1">{f.label}</label>
                              <input value={(r as any)[f.key]}
                                onChange={e => { const n=[...referencias]; (n[i] as any)[f.key]=e.target.value; setReferencias(n) }}
                                placeholder={f.placeholder}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" />
                            </div>
                          ))}
                          <div className="col-span-2 text-right">
                            <button onClick={() => setReferencias(referencias.filter((_,j)=>j!==i))}
                              className="text-xs text-red-400 hover:underline">Remover</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ ABA ANÁLISE ═══════════════ */}
        {aba === 'analise' && (
          <div className="flex-1 overflow-y-auto h-[calc(100vh-56px)] p-8">
            {resultado ? (
              <div className="space-y-6 max-w-5xl mx-auto">

                {resultado.erros?.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <p className="text-xs font-semibold text-red-400 mb-2">Avisos:</p>
                    {resultado.erros.map((e: string, i: number) => (
                      <p key={i} className="text-xs text-red-300 font-mono">{e}</p>
                    ))}
                  </div>
                )}

                {/* Valores resolvidos */}
                {Object.keys(resultado.valores || {}).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Variáveis resolvidas (endógenas)</p>
                    <div className="grid grid-cols-5 gap-3">
                      {Object.entries(resultado.valores).map(([k, v]) => (
                        <div key={k} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                          <p className="text-xs font-mono text-gray-500 mb-1">{k}</p>
                          <p className="text-xl font-bold text-white">
                            {typeof v === 'number' ? (v as number).toFixed(2) : String(v)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Painel de relações / dependências */}
                {resultado.dependencias?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Relações econômicas</p>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-wrap gap-2">
                      {resultado.dependencias.map((d: string, i: number) => (
                        <span key={i} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-gray-300">{d}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Elasticidades / multiplicadores */}
                {resultado.elasticidades && Object.keys(resultado.elasticidades).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Multiplicadores (derivadas analíticas)</p>
                    <div className="space-y-3">
                      {Object.entries(resultado.elasticidades).map(([endog, derivs]: any) => (
                        <div key={endog} className="bg-white/5 border border-white/10 rounded-xl p-4">
                          <p className="text-sm font-semibold text-white mb-2">{endog}</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(derivs).map(([param, val]: any) => (
                              <span key={param} className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 text-xs font-mono text-blue-200">
                                ∂{endog}/∂{param} = {(val as number).toFixed(3)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* LaTeX */}
                {resultado.latex && Object.keys(resultado.latex).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Equações</p>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3">
                      {Object.entries(resultado.latex).map(([k, v], i) => (
                        <div key={k} className="flex items-center gap-4">
                          <span className="text-xs text-gray-600 w-6 flex-shrink-0">({i+1})</span>
                          <p className="text-sm font-mono text-gray-300">{v as string}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gráficos de sensibilidade */}
                {resultado.series && Object.keys(resultado.series).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Análise de sensibilidade</p>
                    {Object.keys(resultado.series).filter(k => k.includes('_vs_')).length > 0 ? (
                      Array.from(new Set(Object.keys(resultado.series).filter(k => k.includes('_vs_')).map(k => k.split('_vs_')[1]))).map(eixoX => (
                        <div key={eixoX} className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
                          <Plot
                            data={Object.keys(resultado.series)
                              .filter(k => k.endsWith(`_vs_${eixoX}`))
                              .map((k, i) => ({
                                x: resultado.series[eixoX], y: resultado.series[k],
                                type: 'scatter' as const, mode: 'lines' as const,
                                name: k.split('_vs_')[0],
                                line: { width: 2.5, color: ['#60a5fa','#f87171','#4ade80','#c084fc','#fb923c'][i%5] },
                              })) as any}
                            layout={{
                              title: { text: `Sensibilidade a ${eixoX}`, font: { color: '#e5e7eb' } },
                              paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                              font: { family: 'Montserrat', color: '#9ca3af', size: 11 },
                              xaxis: { title: eixoX, gridcolor: 'rgba(255,255,255,0.05)', color: '#6b7280' },
                              yaxis: { title: 'Valor', gridcolor: 'rgba(255,255,255,0.05)', color: '#6b7280' },
                              legend: { orientation: 'h', y: -0.2, font: { color: '#9ca3af' } },
                              margin: { t: 40, b: 60, l: 50, r: 20 }, height: 360,
                            } as any}
                            useResizeHandler style={{ width: '100%' }} config={{ displayModeBar: false }} />
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Adicione uma análise de sensibilidade no painel do modelo.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-semibold text-white mb-2">Nenhuma análise ainda</p>
                  <p className="text-sm text-gray-500 mb-6">Configure o modelo e clique em Calcular.</p>
                  <button onClick={() => setAba('modelo')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition">
                    Ir para o modelo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ ABA EXPORTAR ═══════════════ */}
        {aba === 'exportar' && (
          <div className="flex-1 overflow-y-auto h-[calc(100vh-56px)] p-8">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-xl font-bold text-white">Exportar</h2>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={exportarPDF}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl p-6 text-left transition group">
                  <p className="text-2xl mb-3">📄</p>
                  <p className="font-semibold text-white mb-1">PDF Acadêmico</p>
                  <p className="text-xs text-gray-500">Exporta notas, equações e resultados em formato de artigo</p>
                </button>
                <button onClick={exportarPDF}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl p-6 text-left transition group">
                  <p className="text-2xl mb-3">📊</p>
                  <p className="font-semibold text-white mb-1">Dashboard Visual</p>
                  <p className="text-xs text-gray-500">Exporta gráficos e resultados em formato visual</p>
                </button>
              </div>
              <div id="exportar-conteudo" className="bg-[#0b0f19] border border-white/10 rounded-2xl p-8">
                <div className="mb-6 pb-6 border-b border-white/10">
                  <h1 className="text-2xl font-bold text-white mb-2">{tituloModelo}</h1>
                  <p className="text-sm text-gray-500">OikosLab · {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
                {secoes.filter(s => s.conteudo).map(s => (
                  <div key={s.id} className="mb-6">
                    <h2 className="text-lg font-semibold text-white mb-3">{s.titulo}</h2>
                    <div className="text-sm text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: s.conteudo }} />
                  </div>
                ))}
                {equacoes.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-white mb-3">Modelo</h2>
                    {equacoes.map((eq, i) => (
                      <div key={eq.id} className="flex items-center gap-4 mb-2">
                        <span className="text-gray-600 text-sm">({i+1})</span>
                        <span className="font-mono text-sm text-gray-300">{eq.variavel} = {eq.expressao}</span>
                        {eq.descricao && <span className="text-xs text-gray-600 italic">{eq.descricao}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {referencias.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-3">Referências</h2>
                    {referencias.map(r => (
                      <p key={r.id} className="text-sm text-gray-400 mb-1">
                        {r.autor} ({r.ano}). <em>{r.titulo}</em>. {r.publicacao}.
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
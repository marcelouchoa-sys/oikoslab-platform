'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'
import {
  Save, Zap, Code2, Hash, TrendingUp, Users,
  Database, Plus, GitBranch, BarChart2,
} from 'lucide-react'
import { RichEditor } from '@/components/ui/rich-editor'
import { MathEditor } from '@/components/ui/math-editor'
import { OikosMath } from '@/components/ui/oikos-math'
import { ProjectSidebar, type LabSection } from '@/components/lab/ProjectSidebar'
import { MetricCard } from '@/components/lab/MetricCard'
import { SectionCard } from '@/components/lab/SectionCard'
import { ActivityFeed } from '@/components/lab/ActivityFeed'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })
const CanvasContainer = dynamic(
  () => import('@/components/lab/CanvasContainer').then(m => m.CanvasContainer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#0B0F19]">
        <p className="text-sm text-gray-600">Carregando canvas...</p>
      </div>
    ),
  },
)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Parametro    = { id: string; nome: string; valor: number; descricao: string }
type Equacao      = { id: string; numero: number; nome: string; variavel: string; expressao: string; latex: string; descricao: string; valida: boolean | null }
type NotaSecao    = { id: string; titulo: string; conteudo: string }
type Referencia   = { id: string; autor: string; ano: string; titulo: string; publicacao: string }
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
  const [secao,      setSecao]      = useState<LabSection>('visao-geral')
  const [blocos,     setBlocos]     = useState<any>(null)
  const [mostrarBlocos, setMostrarBlocos] = useState(false)

  const [tituloModelo, setTituloModelo] = useState('')
  const [parametros,   setParametros]   = useState<Parametro[]>([
    { id: uid(), nome: 'a',  valor: 100,  descricao: 'Consumo autônomo' },
    { id: uid(), nome: 'c',  valor: 0.75, descricao: 'Propensão a consumir' },
    { id: uid(), nome: 'T',  valor: 200,  descricao: 'Impostos' },
    { id: uid(), nome: 'I0', valor: 200,  descricao: 'Investimento autônomo' },
    { id: uid(), nome: 'G0', valor: 300,  descricao: 'Gastos do governo' },
  ])
  const [equacoes, setEquacoes] = useState<Equacao[]>([
    { id: uid(), numero: 1, nome: 'Consumo',     variavel: 'C', expressao: 'a + c*(Y - T)', latex: '', descricao: 'Função consumo keynesiana', valida: null },
    { id: uid(), numero: 2, nome: 'Investimento', variavel: 'I', expressao: 'I0',            latex: '', descricao: 'Investimento autônomo',      valida: null },
    { id: uid(), numero: 3, nome: 'Governo',      variavel: 'G', expressao: 'G0',            latex: '', descricao: 'Gasto público',              valida: null },
    { id: uid(), numero: 4, nome: 'Produto',      variavel: 'Y', expressao: 'C + I + G',     latex: '', descricao: 'Demanda agregada',           valida: null },
  ])
  const [sensibilidades, setSensibilidades] = useState<Sensibilidade[]>([])
  const [secoes,      setSecoes]     = useState<NotaSecao[]>([
    { id: uid(), titulo: 'Introdução',    conteudo: '' },
    { id: uid(), titulo: 'Modelo Teórico', conteudo: '' },
    { id: uid(), titulo: 'Resultados',    conteudo: '' },
  ])
  const [referencias, setReferencias] = useState<Referencia[]>([])

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase.from('projetos').select('*').eq('id', params.id).single()
      if (!data) { router.push('/projetos'); return }
      setProjeto(data)
      setTituloModelo(data.titulo)
      if (data.configuracao?.parametros)     setParametros(data.configuracao.parametros)
      if (data.configuracao?.equacoes)       setEquacoes(data.configuracao.equacoes)
      if (data.configuracao?.sensibilidades) setSensibilidades(data.configuracao.sensibilidades)
      if (data.configuracao?.secoes)         setSecoes(data.configuracao.secoes)
      if (data.configuracao?.referencias)    setReferencias(data.configuracao.referencias)
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
      const equacoesValidas   = equacoes.filter(e => e.variavel.trim() !== '' && e.expressao.trim() !== '')
      const res = await api.modelo.resolver({
        parametros:    parametrosValidos.map(p => ({ nome: p.nome.trim(), valor: p.valor, descricao: p.descricao })),
        equacoes:      equacoesValidas.map(e => ({ nome: e.nome, variavel: e.variavel.trim(), expressao: e.expressao.trim() })),
        sensibilidades: sensibilidades.map(s => ({
          nome: s.nome, min: s.min, max: s.max, pontos: 200,
          mostrar: s.mostrar.split(',').map(x => x.trim()).filter(Boolean),
        })),
      })
      setResultado(res)
      setSecao('resultados')
    } catch (e: any) {
      setResultado({ valores: {}, series: null, erros: [e.message], latex: {}, dependencias: [], elasticidades: {} })
      setSecao('resultados')
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
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
      <p className="text-gray-500 text-sm">Carregando laboratório...</p>
    </div>
  )

  const nEq  = equacoes.filter(e => e.variavel.trim()).length
  const nPar = parametros.filter(p => p.nome.trim()).length

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0F19] text-white">
      <ProjectSidebar active={secao} onChange={setSecao} projectId={params.id as string} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Top Bar ── */}
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 border-b border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl z-30">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm font-semibold text-white truncate max-w-[260px]">{tituloModelo}</span>
            <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
              Laboratório
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={salvar} disabled={salvando}
              className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white/10 transition disabled:opacity-50">
              <Save size={13} />
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={calcular} disabled={calculando}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50">
              <Zap size={13} />
              {calculando ? 'Calculando...' : 'Calcular'}
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto">

          {/* ═══ VISÃO GERAL ═══ */}
          {secao === 'visao-geral' && (
            <div className="p-8 max-w-5xl mx-auto space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">{tituloModelo}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full">
                    Construtor de Funções
                  </span>
                  <span className="text-xs text-gray-600">Laboratório Econômico</span>
                  <span className="text-xs text-gray-700">·</span>
                  <span className="text-xs text-gray-600">
                    Atualizado em {new Date().toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricCard
                  icon={<Code2 size={18} />}
                  label="Equações"
                  value={nEq}
                  color="purple"
                  onClick={() => setSecao('modelos')}
                />
                <MetricCard
                  icon={<Hash size={18} />}
                  label="Parâmetros"
                  value={nPar}
                  color="blue"
                  onClick={() => setSecao('modelos')}
                />
                <MetricCard
                  icon={<TrendingUp size={18} />}
                  label="Sensibilidades"
                  value={sensibilidades.length}
                  color="cyan"
                  onClick={() => setSecao('modelos')}
                />
                <MetricCard
                  icon={<Users size={18} />}
                  label="Membros"
                  value={1}
                  description="Apenas você"
                  color="green"
                  onClick={() => setSecao('equipe')}
                />
              </div>

              {/* Ações rápidas */}
              <div className="grid grid-cols-3 gap-4">
                <button onClick={() => setSecao('modelos')}
                  className="bg-[#111827] border border-white/10 rounded-2xl p-5 text-left hover:border-purple-500/30 hover:bg-purple-500/5 transition">
                  <Code2 size={20} className="text-purple-400 mb-3" />
                  <p className="text-sm font-semibold text-white mb-1">Modelos</p>
                  <p className="text-xs text-gray-500">Adicionar equações e parâmetros</p>
                </button>
                <button onClick={calcular} disabled={calculando}
                  className="bg-[#111827] border border-white/10 rounded-2xl p-5 text-left hover:border-blue-500/30 hover:bg-blue-500/5 transition disabled:opacity-50">
                  <Zap size={20} className="text-blue-400 mb-3" />
                  <p className="text-sm font-semibold text-white mb-1">Calcular</p>
                  <p className="text-xs text-gray-500">Resolver o sistema de equações</p>
                </button>
                <button onClick={() => setSecao('canvas')}
                  className="bg-[#111827] border border-white/10 rounded-2xl p-5 text-left hover:border-cyan-500/30 hover:bg-cyan-500/5 transition">
                  <GitBranch size={20} className="text-cyan-400 mb-3" />
                  <p className="text-sm font-semibold text-white mb-1">Canvas</p>
                  <p className="text-xs text-gray-500">Visualizar relações do modelo</p>
                </button>
              </div>

              {/* Atividade + Último resultado */}
              <div className="grid grid-cols-2 gap-6">
                <SectionCard title="Atividade Recente">
                  <ActivityFeed />
                </SectionCard>

                <SectionCard
                  title="Último Resultado"
                  action={resultado ? (
                    <button onClick={() => setSecao('resultados')}
                      className="text-xs text-blue-400 hover:underline">
                      Ver análise →
                    </button>
                  ) : undefined}
                >
                  {resultado ? (
                    <div className="space-y-0">
                      {Object.entries(resultado.valores || {}).slice(0, 4).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                          <span className="text-xs font-mono text-gray-500">{k}</span>
                          <span className="text-sm font-bold text-white">
                            {typeof v === 'number' ? (v as number).toFixed(2) : String(v)}
                          </span>
                        </div>
                      ))}
                      {Object.keys(resultado.valores || {}).length > 4 && (
                        <p className="text-xs text-gray-600 text-center pt-2">
                          +{Object.keys(resultado.valores).length - 4} variáveis
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-3">Nenhuma análise executada ainda</p>
                      <button onClick={calcular} disabled={calculando}
                        className="text-xs text-blue-400 hover:underline disabled:opacity-50">
                        Calcular agora →
                      </button>
                    </div>
                  )}
                </SectionCard>
              </div>

              {/* Biblioteca de modelos */}
              {blocos?.modelos?.length > 0 && (
                <SectionCard
                  title="Biblioteca de Modelos"
                  description="Carregar um modelo pré-configurado"
                  action={
                    <button onClick={() => setSecao('modelos')} className="text-xs text-purple-400 hover:underline">
                      Ver no construtor →
                    </button>
                  }
                >
                  <div className="flex flex-wrap gap-2">
                    {blocos.modelos.slice(0, 8).map((m: any) => (
                      <button key={m.id}
                        onClick={() => { adicionarModeloPronto(m.id); setSecao('modelos') }}
                        className="bg-purple-500/10 border border-purple-500/20 text-purple-200 rounded-lg px-3 py-1.5 text-xs hover:bg-purple-500/20 transition"
                        title={m.descricao}>
                        {m.nome}
                      </button>
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>
          )}

          {/* ═══ CANVAS ECONÔMICO ═══ */}
          {secao === 'canvas' && (
            <div className="relative" style={{ height: 'calc(100vh - 57px)' }}>
              <div className="absolute top-4 left-4 z-10 bg-[#111827]/90 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2 pointer-events-none">
                <GitBranch size={13} className="text-cyan-400" />
                <p className="text-xs text-gray-400">Canvas Econômico — arraste nós e conecte relações</p>
              </div>
              <CanvasContainer />
            </div>
          )}

          {/* ═══ MODELOS ═══ */}
          {secao === 'modelos' && (
            <div className="flex" style={{ height: 'calc(100vh - 57px)' }}>

              {/* Painel esquerdo */}
              <div className="w-80 border-r border-white/10 overflow-y-auto flex flex-col flex-shrink-0">

                {/* Parâmetros */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Parâmetros</p>
                    <button onClick={() => setParametros(p => [...p, { id: uid(), nome: '', valor: 0, descricao: '' }])}
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                      <Plus size={11} /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {parametros.map((p, i) => (
                      <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <input value={p.nome}
                            onChange={e => { const n = [...parametros]; n[i].nome = e.target.value; setParametros(n) }}
                            placeholder="nome"
                            className="w-14 bg-transparent border-b border-white/20 text-xs font-mono text-white focus:outline-none focus:border-blue-500 pb-0.5" />
                          <span className="text-gray-600 text-xs">=</span>
                          <input type="number" value={p.valor}
                            onChange={e => { const n = [...parametros]; n[i].valor = parseFloat(e.target.value) || 0; setParametros(n) }}
                            className="flex-1 bg-transparent border-b border-white/20 text-xs text-blue-300 focus:outline-none focus:border-blue-500 pb-0.5" />
                          <button onClick={() => setParametros(parametros.filter((_, j) => j !== i))}
                            className="text-gray-600 hover:text-red-400 text-xs transition">×</button>
                        </div>
                        <input value={p.descricao}
                          onChange={e => { const n = [...parametros]; n[i].descricao = e.target.value; setParametros(n) }}
                          placeholder="descrição..."
                          className="w-full bg-transparent text-xs text-gray-500 focus:outline-none placeholder:text-gray-700" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sensibilidade */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Sensibilidade</p>
                    <button onClick={() => setSensibilidades(s => [...s, { id: uid(), nome: 'G0', min: 0, max: 500, mostrar: 'Y' }])}
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                      <Plus size={11} /> Add
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-600 mb-2 leading-relaxed">
                    Varie um parâmetro e veja o efeito sobre as endógenas.
                  </p>
                  <div className="space-y-2">
                    {sensibilidades.map((s, i) => (
                      <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <input value={s.nome}
                            onChange={e => { const n = [...sensibilidades]; n[i].nome = e.target.value; setSensibilidades(n) }}
                            placeholder="param"
                            className="w-16 bg-transparent border-b border-white/20 text-xs font-mono text-white focus:outline-none focus:border-blue-500 pb-0.5" />
                          <span className="text-[10px] text-gray-600">→</span>
                          <input value={s.mostrar}
                            onChange={e => { const n = [...sensibilidades]; n[i].mostrar = e.target.value; setSensibilidades(n) }}
                            placeholder="Y"
                            className="flex-1 bg-transparent border-b border-white/20 text-xs font-mono text-white focus:outline-none focus:border-blue-500 pb-0.5" />
                          <button onClick={() => setSensibilidades(sensibilidades.filter((_, j) => j !== i))}
                            className="text-gray-600 hover:text-red-400 text-xs transition">×</button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-600">min</span>
                          <input type="number" value={s.min}
                            onChange={e => { const n = [...sensibilidades]; n[i].min = parseFloat(e.target.value) || 0; setSensibilidades(n) }}
                            className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none" />
                          <span className="text-[10px] text-gray-600">max</span>
                          <input type="number" value={s.max}
                            onChange={e => { const n = [...sensibilidades]; n[i].max = parseFloat(e.target.value) || 0; setSensibilidades(n) }}
                            className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Painel direito — Equações */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-bold text-white">Equações do Modelo</h2>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setMostrarBlocos(!mostrarBlocos)}
                      className="text-xs text-purple-300 hover:underline">+ Bloco pronto</button>
                    <button onClick={() => setEquacoes(e => [...e, { id: uid(), numero: e.length + 1, nome: '', variavel: '', expressao: '', latex: '', descricao: '', valida: null }])}
                      className="text-xs text-blue-400 hover:underline">+ Nova equação</button>
                  </div>
                </div>

                {mostrarBlocos && blocos && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Modelos completos</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {blocos.modelos?.map((m: any) => (
                        <button key={m.id} onClick={() => adicionarModeloPronto(m.id)}
                          className="bg-purple-500/10 border border-purple-500/30 text-purple-200 rounded-lg px-3 py-1.5 text-xs hover:bg-purple-500/20 transition"
                          title={m.descricao}>
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
                          ({i + 1})
                        </div>
                        <div className="flex-1 space-y-3">
                          <input value={eq.nome}
                            onChange={e => { const n = [...equacoes]; n[i].nome = e.target.value; setEquacoes(n) }}
                            placeholder="Nome da equação (ex: Consumo Keynesiano)"
                            className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none placeholder:text-gray-600 border-b border-transparent focus:border-white/20 pb-1" />
                          <div className="flex items-start gap-3">
                            <input value={eq.variavel}
                              onChange={e => { const n = [...equacoes]; n[i].variavel = e.target.value; setEquacoes(n) }}
                              placeholder="Y"
                              className="w-12 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500 text-center mt-1" />
                            <span className="text-gray-500 font-mono text-lg mt-2">=</span>
                            <div className="flex-1">
                              <MathEditor
                                value={eq.expressao}
                                onChange={(latex, ascii) => { const n = [...equacoes]; n[i].expressao = ascii; n[i].latex = latex; setEquacoes(n) }}
                                placeholder="Monte sua equação..." />
                            </div>
                            <button onClick={() => setEquacoes(equacoes.filter((_, j) => j !== i))}
                              className="text-gray-600 hover:text-red-400 transition text-lg mt-2">×</button>
                          </div>
                          <input value={eq.descricao}
                            onChange={e => { const n = [...equacoes]; n[i].descricao = e.target.value; setEquacoes(n) }}
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

          {/* ═══ DADOS ═══ */}
          {secao === 'dados' && (
            <div className="p-8 max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Fontes de Dados</h2>
                <p className="text-sm text-gray-500">Conecte dados econômicos ao seu modelo</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { nome: 'Brasil — IBGE',    icon: '🇧🇷', desc: 'PIB, inflação, emprego',      color: 'green',  status: 'em breve' },
                  { nome: 'Banco Mundial',     icon: '🌍', desc: 'Indicadores internacionais',   color: 'blue',   status: 'em breve' },
                  { nome: 'FMI',              icon: '📊', desc: 'WEO, perspectivas globais',    color: 'cyan',   status: 'em breve' },
                  { nome: 'BCB',              icon: '🏦', desc: 'Selic, câmbio, reservas',      color: 'orange', status: 'em breve' },
                  { nome: 'OCDE',             icon: '🔬', desc: 'Países desenvolvidos',         color: 'purple', status: 'em breve' },
                  { nome: 'Personalizado',    icon: '📁', desc: 'Upload CSV/JSON',              color: 'blue',   status: 'em breve' },
                ].map(src => (
                  <div key={src.nome}
                    className="bg-[#111827] border border-white/10 rounded-2xl p-5 opacity-60 cursor-not-allowed">
                    <p className="text-2xl mb-3">{src.icon}</p>
                    <p className="text-sm font-semibold text-white mb-1">{src.nome}</p>
                    <p className="text-xs text-gray-500 mb-3">{src.desc}</p>
                    <span className="text-[10px] bg-white/5 text-gray-600 px-2 py-0.5 rounded-full border border-white/10">
                      {src.status}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 text-center">
                <Database size={24} className="text-blue-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-white mb-1">Integração de dados em desenvolvimento</p>
                <p className="text-xs text-gray-500">
                  Em breve você poderá calibrar seus modelos diretamente com dados do IBGE, Banco Mundial e outras fontes.
                </p>
              </div>
            </div>
          )}

          {/* ═══ CENÁRIOS ═══ */}
          {secao === 'cenarios' && (
            <div className="p-8 max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Cenários Econômicos</h2>
                <p className="text-sm text-gray-500">Simule diferentes configurações do modelo</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { nome: 'Cenário Base',       desc: 'Parâmetros atuais do modelo',     cor: 'blue' },
                  { nome: 'Choque de Demanda',  desc: 'Variação em G0 ou I0',            cor: 'orange' },
                  { nome: 'Choque de Oferta',   desc: 'Mudança na função de produção',   cor: 'red' },
                  { nome: 'Política Fiscal',    desc: 'Variação de T e G simultaneamente', cor: 'purple' },
                ].map(cen => (
                  <div key={cen.nome}
                    className="bg-[#111827] border border-white/10 rounded-2xl p-5 opacity-60 cursor-not-allowed">
                    <p className="text-sm font-semibold text-white mb-1">{cen.nome}</p>
                    <p className="text-xs text-gray-500 mb-3">{cen.desc}</p>
                    <span className="text-[10px] bg-white/5 text-gray-600 px-2 py-0.5 rounded-full border border-white/10">
                      em breve
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-6 text-center">
                <TrendingUp size={24} className="text-cyan-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-white mb-1">Cenários em desenvolvimento</p>
                <p className="text-xs text-gray-500">
                  Em breve você poderá salvar e comparar diferentes cenários do mesmo modelo.
                </p>
              </div>
            </div>
          )}

          {/* ═══ RESULTADOS ═══ */}
          {secao === 'resultados' && (
            <div className="p-8">
              {resultado ? (
                <div className="space-y-6 max-w-5xl mx-auto">

                  {resultado.erros?.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                      <p className="text-xs font-semibold text-red-400 mb-2">Avisos:</p>
                      {resultado.erros.map((e: string, i: number) => (
                        <p key={i} className="text-xs text-red-300 font-mono">{e}</p>
                      ))}
                    </div>
                  )}

                  {/* Solução Numérica */}
                  {Object.keys(resultado.valores || {}).length > 0 && (
                    <SectionCard title="Solução Numérica" description="Variáveis endógenas resolvidas">
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
                    </SectionCard>
                  )}

                  {/* Relações econômicas */}
                  {resultado.dependencias?.length > 0 && (
                    <SectionCard title="Relações Econômicas" description="Dependências detectadas no sistema">
                      <div className="flex flex-wrap gap-2">
                        {resultado.dependencias.map((d: string, i: number) => (
                          <span key={i} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-gray-300">
                            {d}
                          </span>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* Multiplicadores */}
                  {resultado.elasticidades && Object.keys(resultado.elasticidades).length > 0 && (
                    <SectionCard title="Multiplicadores" description="Derivadas analíticas ∂endógena/∂parâmetro">
                      <div className="space-y-4">
                        {Object.entries(resultado.elasticidades).map(([endog, derivs]: any) => (
                          <div key={endog}>
                            <p className="text-xs font-semibold text-white mb-2">{endog}</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(derivs).map(([param, val]: any) => (
                                <span key={param}
                                  className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 text-xs font-mono text-blue-200">
                                  ∂{endog}/∂{param} = {(val as number).toFixed(3)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* Equações (LaTeX) */}
                  {resultado.latex && Object.keys(resultado.latex).length > 0 && (
                    <SectionCard title="Equações Simbólicas" description="Expressões analíticas do sistema resolvido">
                      <div className="space-y-4">
                        {Object.entries(resultado.latex).map(([k, v], i) => (
                          <div key={k} className="flex items-start gap-4">
                            <span className="text-xs text-gray-600 w-6 flex-shrink-0 mt-1">({i + 1})</span>
                            <div className="flex-1 text-white overflow-x-auto [&_.katex]:text-white [&_.katex-display]:my-0">
                              <OikosMath latex={`${k} = ${v as string}`} block />
                            </div>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* Sensibilidade */}
                  {resultado.series && Object.keys(resultado.series).length > 0 && (
                    <SectionCard title="Análise de Sensibilidade" description="Variação das endógenas em função dos parâmetros">
                      {Object.keys(resultado.series).filter(k => k.includes('_vs_')).length > 0 ? (
                        Array.from(new Set(
                          Object.keys(resultado.series)
                            .filter(k => k.includes('_vs_'))
                            .map(k => k.split('_vs_')[1]),
                        )).map(eixoX => (
                          <div key={eixoX} className="mb-4 last:mb-0">
                            <Plot
                              data={Object.keys(resultado.series)
                                .filter(k => k.endsWith(`_vs_${eixoX}`))
                                .map((k, i) => ({
                                  x: resultado.series[eixoX], y: resultado.series[k],
                                  type: 'scatter' as const, mode: 'lines' as const,
                                  name: k.split('_vs_')[0],
                                  line: { width: 2.5, color: ['#60a5fa', '#f87171', '#4ade80', '#c084fc', '#fb923c'][i % 5] },
                                })) as any}
                              layout={{
                                title: { text: `Sensibilidade a ${eixoX}`, font: { color: '#e5e7eb' } },
                                paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                                font: { family: 'Montserrat', color: '#9ca3af', size: 11 },
                                xaxis: { title: eixoX, gridcolor: 'rgba(255,255,255,0.05)', color: '#6b7280' },
                                yaxis: { title: 'Valor', gridcolor: 'rgba(255,255,255,0.05)', color: '#6b7280' },
                                legend: { orientation: 'h', y: -0.2, font: { color: '#9ca3af' } },
                                margin: { t: 40, b: 60, l: 50, r: 20 }, height: 340,
                              } as any}
                              useResizeHandler
                              style={{ width: '100%' }}
                              config={{ displayModeBar: false }}
                            />
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Configure análise de sensibilidade na aba Modelos.</p>
                      )}
                    </SectionCard>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 200px)' }}>
                  <div className="text-center">
                    <BarChart2 size={40} className="text-gray-700 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-white mb-2">Nenhuma análise executada</p>
                    <p className="text-sm text-gray-500 mb-6">Configure o modelo e clique em Calcular.</p>
                    <button onClick={calcular} disabled={calculando}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2 mx-auto">
                      <Zap size={15} />
                      {calculando ? 'Calculando...' : 'Calcular agora'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ NOTAS ═══ */}
          {secao === 'notas' && (
            <div className="flex" style={{ height: 'calc(100vh - 57px)' }}>
              <div className="w-56 border-r border-white/10 overflow-y-auto p-4 flex-shrink-0">
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
                      <button onClick={() => setSecoes(secoes.filter((_, j) => j !== i))}
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

              <div className="flex-1 overflow-y-auto p-8 max-w-4xl">
                <div className="space-y-8">
                  {secoes.map((s, i) => (
                    <div key={s.id}>
                      <input value={s.titulo}
                        onChange={e => { const n = [...secoes]; n[i].titulo = e.target.value; setSecoes(n) }}
                        className="w-full bg-transparent text-xl font-bold text-white focus:outline-none border-b border-transparent focus:border-white/20 pb-1 mb-4" />
                      <RichEditor content={s.conteudo}
                        onChange={v => { const n = [...secoes]; n[i].conteudo = v; setSecoes(n) }}
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
                                  onChange={e => { const n = [...referencias]; (n[i] as any)[f.key] = e.target.value; setReferencias(n) }}
                                  placeholder={f.placeholder}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" />
                              </div>
                            ))}
                            <div className="col-span-2 text-right">
                              <button onClick={() => setReferencias(referencias.filter((_, j) => j !== i))}
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

          {/* ═══ EQUIPE ═══ */}
          {secao === 'equipe' && (
            <div className="p-8 max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Equipe</h2>
                <p className="text-sm text-gray-500">Gerencie membros e permissões do projeto</p>
              </div>
              <SectionCard title="Membros">
                <div className="flex items-center gap-4 py-2">
                  <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-300">
                    M
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Você</p>
                    <p className="text-xs text-gray-500">Proprietário</p>
                  </div>
                  <span className="ml-auto text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Admin</span>
                </div>
              </SectionCard>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Users size={24} className="text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-white mb-1">Colaboração em breve</p>
                <p className="text-xs text-gray-500">
                  Em breve você poderá convidar economistas e pesquisadores para colaborar neste projeto.
                </p>
              </div>
            </div>
          )}

          {/* ═══ CONFIGURAÇÕES ═══ */}
          {secao === 'configuracoes' && (
            <div className="p-8 max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Configurações</h2>
                <p className="text-sm text-gray-500">Gerencie as configurações deste projeto</p>
              </div>

              <SectionCard title="Informações do Projeto">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Nome do projeto</label>
                    <div className="flex gap-2">
                      <input
                        defaultValue={tituloModelo}
                        id="titulo-input"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => {
                          const el = document.getElementById('titulo-input') as HTMLInputElement
                          const novo = el?.value.trim()
                          if (novo && novo !== tituloModelo) {
                            setTituloModelo(novo)
                            supabase.from('projetos').update({ titulo: novo }).eq('id', params.id as string)
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
                        Salvar
                      </button>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Exportar">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={exportarPDF}
                    className="bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl p-4 text-left transition">
                    <p className="text-xl mb-2">📄</p>
                    <p className="text-sm font-semibold text-white mb-0.5">PDF Acadêmico</p>
                    <p className="text-xs text-gray-500">Exportar como artigo</p>
                  </button>
                  <button onClick={exportarPDF}
                    className="bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl p-4 text-left transition">
                    <p className="text-xl mb-2">📊</p>
                    <p className="text-sm font-semibold text-white mb-0.5">Dashboard Visual</p>
                    <p className="text-xs text-gray-500">Exportar gráficos e resultados</p>
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Zona de Risco">
                <button
                  onClick={async () => {
                    if (!confirm('Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.')) return
                    await supabase.from('projetos').delete().eq('id', params.id as string)
                    window.location.href = '/projetos'
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm text-red-400 bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition">
                  Excluir projeto permanentemente
                </button>
              </SectionCard>

              {/* Invisible export div */}
              <div id="exportar-conteudo" style={{ display: 'none' }}
                className="bg-[#0b0f19] p-8">
                <h1 className="text-2xl font-bold text-white mb-2">{tituloModelo}</h1>
                <p className="text-sm text-gray-500 mb-6">OikosLab · {new Date().toLocaleDateString('pt-BR')}</p>
                {equacoes.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-white mb-3">Modelo</h2>
                    {equacoes.map((eq, i) => (
                      <div key={eq.id} className="flex items-center gap-4 mb-2">
                        <span className="text-gray-600 text-sm">({i + 1})</span>
                        <span className="font-mono text-sm text-gray-300">{eq.variavel} = {eq.expressao}</span>
                        {eq.descricao && <span className="text-xs text-gray-600 italic">{eq.descricao}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

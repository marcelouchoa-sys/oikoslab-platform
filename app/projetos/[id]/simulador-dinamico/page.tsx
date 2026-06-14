'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const CHOQUES_PREDEFINIDOS = [
  { id: 'teto_gastos',    nome: 'Teto de Gastos',        dG: -50,  dT: 0,   dM: 0,   d_salario: 0,  d_credito: 0,  dYn: 0,   dPe: 0   },
  { id: 'bolsa_familia',  nome: 'Bolsa Familia',          dG: 30,   dT: 0,   dM: 0,   d_salario: 0,  d_credito: 0,  dYn: 0,   dPe: 0   },
  { id: 'salario_minimo', nome: 'Aumento Salario Min.',   dG: 0,    dT: 0,   dM: 0,   d_salario: 20, d_credito: 0,  dYn: 0,   dPe: 0   },
  { id: 'exp_fiscal',     nome: 'Expansao Fiscal',        dG: 100,  dT: 0,   dM: 0,   d_salario: 0,  d_credito: 0,  dYn: 0,   dPe: 0   },
  { id: 'cont_fiscal',    nome: 'Austeridade Fiscal',     dG: -100, dT: 50,  dM: 0,   d_salario: 0,  d_credito: 0,  dYn: 0,   dPe: 0   },
  { id: 'exp_monetaria',  nome: 'Expansao Monetaria',     dG: 0,    dT: 0,   dM: 200, d_salario: 0,  d_credito: 0,  dYn: 0,   dPe: 0   },
  { id: 'choque_petroleo',nome: 'Choque do Petroleo',     dG: 0,    dT: 0,   dM: 0,   d_salario: 0,  d_credito: 0,  dYn: -50, dPe: 0.1 },
  { id: 'crise_financ',   nome: 'Crise Financeira',       dG: 0,    dT: 0,   dM: 0,   d_salario: 0,  d_credito: -0.2, dYn: 0, dPe: 0   },
  { id: 'inovacao_tecno', nome: 'Choque Tecnologico',     dG: 0,    dT: 0,   dM: 0,   d_salario: 0,  d_credito: 0,  dYn: 100, dPe: 0   },
]

type Choque = {
  id: string; nome: string; ano_inicio: number; duracao: number; magnitude: number
  dG: number; dT: number; dM: number; d_salario: number; d_credito: number; dYn: number; dPe: number
}

export default function SimuladorDinamicoPage() {
  const params   = useParams()
  const router   = useRouter()
  const supabase = createClient()

  const [projeto,    setProjeto]    = useState<any>(null)
  const [simulando,  setSimulando]  = useState(false)
  const [resultado,  setResultado]  = useState<any>(null)
  const [aba,        setAba]        = useState<'config' | 'choques' | 'resultado'>('config')

  // Configuracao da economia
  const [tipo,    setTipo]    = useState('emergente')
  const [escola,  setEscola]  = useState('keynesiana')
  const [aberta,  setAberta]  = useState(true)
  const [periodos,setPeriodos] = useState(20)

  // Parametros estruturais
  const [salario,       setSalario]       = useState(100)
  const [informalidade, setInformalidade] = useState(0.30)
  const [setorPub,      setSetorPub]      = useState(0.20)
  const [aberturaCom,   setAberturaCom]   = useState(0.25)
  const [tecnologia,    setTecnologia]    = useState(0.50)
  const [cargaTrib,     setCargaTrib]     = useState(0.30)
  const [desigualdade,  setDesigualdade]  = useState(0.45)
  const [credito,       setCredito]       = useState(0.50)

  // Choques
  const [choquesSel, setChoquesSel] = useState<Choque[]>([])

  useEffect(() => {
    async function init() {
      const { data } = await supabase.from('projetos').select('*').eq('id', params.id).single()
      if (!data) { router.push('/projetos'); return }
      setProjeto(data)
    }
    init()
  }, [params.id])

  function adicionarChoque(predefinido: any) {
    const novo: Choque = {
      ...predefinido,
      ano_inicio: 3,
      duracao:    2,
      magnitude:  1.0,
    }
    setChoquesSel(prev => [...prev, novo])
  }

  async function simular() {
    setSimulando(true)
    try {
      const res = await fetch(`${API_URL}/simulador-dinamico/simular`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          economia: {
            tipo, escola, aberta,
            c0: 100, c1: 0.75, I0: 200, b: 50,
            G: 300, T: 200, M: 1000, Yn: 1200, Pe: 1.0,
            r_star: 0.03, kf: 200,
            salario_minimo:    salario,
            informalidade,
            tamanho_setor_pub: setorPub,
            abertura_comercial:aberturaCom,
            nivel_tecnologico: tecnologia,
            carga_tributaria:  cargaTrib,
            desigualdade,
            credito_privado:   credito,
            u_natural: tipo === 'desenvolvida' ? 0.04 : tipo === 'subdesenvolvida' ? 0.15 : 0.08,
          },
          choques: choquesSel.map(c => ({
            tipo:       c.id,
            nome:       c.nome,
            magnitude:  c.magnitude,
            ano_inicio: c.ano_inicio,
            duracao:    c.duracao,
            dG:         c.dG,
            dT:         c.dT,
            dM:         c.dM,
            dYn:        c.dYn,
            dPe:        c.dPe,
            d_salario:  c.d_salario,
            d_credito:  c.d_credito,
          })),
          periodos,
        })
      })
      const data = await res.json()
      setResultado(data)
      setAba('resultado')

      // Salvar
      await supabase.from('projetos').update({
        configuracao: { tipo, escola, choques: choquesSel, resultado: data },
        updated_at: new Date().toISOString(),
      }).eq('id', params.id)
    } catch (e) {
      console.error(e)
    }
    setSimulando(false)
  }

  const Slider = ({ label, value, onChange, min, max, step, fmt }: any) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1.5">
        <label className="text-xs text-gray-400">{label}</label>
        <span className="text-xs font-semibold text-white font-mono">
          {fmt ? fmt(value) : value}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-500" />
    </div>
  )

  const plotlyLayoutBase = {
    font: { family: 'DM Sans, sans-serif', color: '#9ca3af' },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    xaxis: { gridcolor: 'rgba(255,255,255,0.06)', zerolinecolor: 'rgba(255,255,255,0.1)', color: '#9ca3af' },
    yaxis: { gridcolor: 'rgba(255,255,255,0.06)', zerolinecolor: 'rgba(255,255,255,0.1)', color: '#9ca3af' },
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0f19]/80 backdrop-blur-xl border-b border-white/10 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projetos" className="text-sm text-gray-400 hover:text-blue-400 transition-colors">
            ← Voltar
          </Link>
          <span className="text-white/10">|</span>
          <span className="text-sm font-semibold text-white">{projeto?.titulo} — Simulador Dinâmico</span>
          <div className="relative group">
            <button className="text-gray-500 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition text-xs">
              ⋯
            </button>
            <div className="absolute top-8 left-0 bg-[#11162a] border border-white/10 rounded-xl p-1 hidden group-hover:block w-44 z-50">
              <button onClick={() => {
                const novo = prompt('Novo nome:', projeto?.titulo)
                if (novo?.trim()) supabase.from('projetos').update({ titulo: novo.trim() }).eq('id', params.id as string)
              }} className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/10 transition block">
                Renomear
              </button>
              <Link href="/projetos" className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/10 transition block">
                Meus projetos
              </Link>
              <button onClick={async () => {
                if (!confirm('Excluir projeto?')) return
                await supabase.from('projetos').delete().eq('id', params.id as string)
                window.location.href = '/projetos'
              }} className="w-full text-left px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition block">
                Excluir
              </button>
            </div>
          </div>
        </div>
        <button onClick={simular} disabled={simulando}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
          {simulando ? 'Simulando...' : 'Simular'}
        </button>
      </header>

      <div className="pt-14 flex h-[calc(100vh-56px)]">

        {/* PAINEL ESQUERDO */}
        <div className="w-72 border-r border-white/10 overflow-y-auto flex flex-col bg-white/[0.02]">

          {/* ABAS */}
          <div className="flex border-b border-white/10">
            {[
              { id: 'config',    label: 'Economia' },
              { id: 'choques',   label: 'Choques' },
              { id: 'resultado', label: 'Resultado' },
            ].map(a => (
              <button key={a.id} onClick={() => setAba(a.id as any)}
                className={`flex-1 py-3 text-xs font-medium transition-colors ${aba === a.id ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
                {a.label}
              </button>
            ))}
          </div>

          {/* ABA CONFIG */}
          {aba === 'config' && (
            <div className="p-4 space-y-4 flex-1">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Tipo de Economia</p>
                <select value={tipo} onChange={e => setTipo(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                  <option className="bg-[#11162a]" value="desenvolvida">Desenvolvida</option>
                  <option className="bg-[#11162a]" value="emergente">Emergente</option>
                  <option className="bg-[#11162a]" value="em_desenvolvimento">Em Desenvolvimento</option>
                  <option className="bg-[#11162a]" value="subdesenvolvida">Subdesenvolvida</option>
                </select>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Escola Econômica</p>
                <select value={escola} onChange={e => setEscola(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                  <option className="bg-[#11162a]" value="classica">Clássica</option>
                  <option className="bg-[#11162a]" value="keynesiana">Keynesiana</option>
                  <option className="bg-[#11162a]" value="monetarista">Monetarista</option>
                  <option className="bg-[#11162a]" value="pos_keynesiana">Pós-Keynesiana</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={aberta} onChange={e => setAberta(e.target.checked)}
                  className="w-4 h-4 accent-blue-500" />
                <label className="text-sm text-gray-300">Economia aberta</label>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Parâmetros Estruturais</p>
                <Slider label="Salário Mínimo" value={salario} onChange={setSalario} min={0} max={500} step={10} />
                <Slider label="Informalidade" value={informalidade} onChange={setInformalidade} min={0} max={0.8} step={0.05} fmt={(v: number) => `${(v*100).toFixed(0)}%`} />
                <Slider label="Setor Público" value={setorPub} onChange={setSetorPub} min={0.05} max={0.5} step={0.05} fmt={(v: number) => `${(v*100).toFixed(0)}%`} />
                <Slider label="Abertura Comercial" value={aberturaCom} onChange={setAberturaCom} min={0.05} max={0.8} step={0.05} fmt={(v: number) => `${(v*100).toFixed(0)}%`} />
                <Slider label="Nível Tecnológico" value={tecnologia} onChange={setTecnologia} min={0} max={1} step={0.1} fmt={(v: number) => `${(v*100).toFixed(0)}%`} />
                <Slider label="Carga Tributária" value={cargaTrib} onChange={setCargaTrib} min={0.1} max={0.6} step={0.05} fmt={(v: number) => `${(v*100).toFixed(0)}%`} />
                <Slider label="Desigualdade (Gini)" value={desigualdade} onChange={setDesigualdade} min={0.2} max={0.7} step={0.05} fmt={(v: number) => v.toFixed(2)} />
                <Slider label="Crédito Privado/PIB" value={credito} onChange={setCredito} min={0.1} max={1.5} step={0.1} fmt={(v: number) => `${(v*100).toFixed(0)}%`} />
                <Slider label="Períodos (anos)" value={periodos} onChange={setPeriodos} min={5} max={50} step={5} />
              </div>
            </div>
          )}

          {/* ABA CHOQUES */}
          {aba === 'choques' && (
            <div className="p-4 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Choques Predefinidos</p>
              <div className="space-y-2 mb-4">
                {CHOQUES_PREDEFINIDOS.map(c => (
                  <button key={c.id} onClick={() => adicionarChoque(c)}
                    className="w-full text-left bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-gray-300 hover:border-blue-500/40 hover:text-blue-300 transition-colors">
                    + {c.nome}
                  </button>
                ))}
              </div>

              {choquesSel.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Choques Ativos</p>
                  <div className="space-y-3">
                    {choquesSel.map((c, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-white">{c.nome}</p>
                          <button onClick={() => setChoquesSel(prev => prev.filter((_, j) => j !== i))}
                            className="text-xs text-gray-500 hover:text-red-400 transition-colors">×</button>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-16">Ano início</span>
                            <input type="number" value={c.ano_inicio} min={1} max={periodos}
                              onChange={e => { const n=[...choquesSel]; n[i].ano_inicio=parseInt(e.target.value); setChoquesSel(n) }}
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-16">Duração</span>
                            <input type="number" value={c.duracao} min={1} max={periodos}
                              onChange={e => { const n=[...choquesSel]; n[i].duracao=parseInt(e.target.value); setChoquesSel(n) }}
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-16">Magnitude</span>
                            <input type="number" value={c.magnitude} min={0.1} max={5} step={0.1}
                              onChange={e => { const n=[...choquesSel]; n[i].magnitude=parseFloat(e.target.value); setChoquesSel(n) }}
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ABA RESULTADO LATERAL */}
          {aba === 'resultado' && resultado && (
            <div className="p-4 flex-1 space-y-4">
              {['curto_prazo', 'medio_prazo', 'longo_prazo'].map(prazo => {
                const dados = resultado.analise[prazo]
                const label = prazo === 'curto_prazo' ? 'Curto Prazo' : prazo === 'medio_prazo' ? 'Médio Prazo' : 'Longo Prazo'
                const cor   = prazo === 'curto_prazo' ? 'border-blue-500' : prazo === 'medio_prazo' ? 'border-purple-500' : 'border-green-500'
                return (
                  <div key={prazo} className={`bg-white/5 border border-white/10 border-l-4 ${cor} rounded-xl p-4`}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">{label}</p>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Y</p>
                        <p className="text-sm font-bold text-white">{dados.Y}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">u%</p>
                        <p className="text-sm font-bold text-white">{dados.u}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">P</p>
                        <p className="text-sm font-bold text-white">{dados.P}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{dados.descricao}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* PAINEL DIREITO — GRAFICOS */}
        <div className="flex-1 overflow-y-auto p-6">
          {resultado ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Simulação — {resultado.tipo} · {resultado.escola}</h2>
                  <p className="text-sm text-gray-500">{periodos} períodos simulados</p>
                </div>
              </div>

              {/* Grafico principal — Y, C, I ao longo do tempo */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <Plot
                  data={[
                    { x: resultado.periodos.map((p: any) => p.ano), y: resultado.periodos.map((p: any) => p.Y), type: 'scatter' as const, mode: 'lines' as const, name: 'Produto (Y)', line: { color: '#3b82f6', width: 2.5 } },
                    { x: resultado.periodos.map((p: any) => p.ano), y: resultado.periodos.map((p: any) => p.C), type: 'scatter' as const, mode: 'lines' as const, name: 'Consumo (C)', line: { color: '#34d399', width: 2, dash: 'dash' } },
                    { x: resultado.periodos.map((p: any) => p.ano), y: resultado.periodos.map((p: any) => p.I), type: 'scatter' as const, mode: 'lines' as const, name: 'Investimento (I)', line: { color: '#a78bfa', width: 2, dash: 'dot' } },
                  ] as any}
                  layout={{ ...plotlyLayoutBase, title: { text: 'Produto, Consumo e Investimento', font: { color: '#e5e7eb' } }, height: 300, legend: { orientation: 'h' as const, y: -0.2, font: { color: '#9ca3af' } }, margin: { t: 40, b: 60 }, xaxis: { ...plotlyLayoutBase.xaxis, title: 'Ano' }, yaxis: { ...plotlyLayoutBase.yaxis, title: 'Valor' } } as any}
                  useResizeHandler style={{ width: '100%' }}
                  config={{ displayModeBar: false }}
                />
              </div>

              {/* Grafico desemprego e inflacao */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <Plot
                    data={[{ x: resultado.periodos.map((p: any) => p.ano), y: resultado.periodos.map((p: any) => p.u), type: 'scatter' as const, mode: 'lines' as const, name: 'Desemprego (%)', line: { color: '#f87171', width: 2.5 } }] as any}
                    layout={{ ...plotlyLayoutBase, title: { text: 'Desemprego (%)', font: { color: '#e5e7eb' } }, height: 220, margin: { t: 40, b: 40 }, showlegend: false, xaxis: { ...plotlyLayoutBase.xaxis, title: 'Ano' } } as any}
                    useResizeHandler style={{ width: '100%' }}
                    config={{ displayModeBar: false }}
                  />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <Plot
                    data={[{ x: resultado.periodos.map((p: any) => p.ano), y: resultado.periodos.map((p: any) => p.P), type: 'scatter' as const, mode: 'lines' as const, name: 'Nível de Preços', line: { color: '#fb923c', width: 2.5 } }] as any}
                    layout={{ ...plotlyLayoutBase, title: { text: 'Nível de Preços', font: { color: '#e5e7eb' } }, height: 220, margin: { t: 40, b: 40 }, showlegend: false, xaxis: { ...plotlyLayoutBase.xaxis, title: 'Ano' } } as any}
                    useResizeHandler style={{ width: '100%' }}
                    config={{ displayModeBar: false }}
                  />
                </div>
              </div>

              {/* Choques no tempo */}
              {resultado.periodos.some((p: any) => p.choques_ativos.length > 0) && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-white mb-3">Choques aplicados por período</p>
                  <div className="flex flex-wrap gap-2">
                    {resultado.periodos.filter((p: any) => p.choques_ativos.length > 0).map((p: any) => (
                      <div key={p.ano} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                        <span className="text-xs font-semibold text-white">Ano {p.ano}: </span>
                        <span className="text-xs text-gray-400">{p.choques_ativos.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <h2 className="text-xl font-bold text-white mb-3">Simulador Dinâmico</h2>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                  Configure a economia no painel esquerdo, adicione choques e clique em Simular
                  para ver a evolução das variáveis ao longo do tempo com análise de curto, médio e longo prazo.
                </p>
                <button onClick={() => setAba('config')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  Configurar economia
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
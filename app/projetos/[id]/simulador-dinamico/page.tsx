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
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <label className="text-xs text-oikos-muted">{label}</label>
        <span className="text-xs font-semibold text-oikos-text font-mono">
          {fmt ? fmt(value) : value}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-oikos-blue" />
    </div>
  )

  return (
    <main className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-oikos-border px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projetos/${params.id}`} className="text-sm text-oikos-muted hover:text-oikos-blue transition-colors">
            ← Voltar
          </Link>
          <span className="text-oikos-border">|</span>
          <span className="text-sm font-semibold text-oikos-text">{projeto?.titulo} — Simulador Dinamico</span>
        </div>
        <button onClick={simular} disabled={simulando}
          className="bg-oikos-blue text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
          {simulando ? 'Simulando...' : 'Simular'}
        </button>
      </header>

      <div className="pt-14 flex h-[calc(100vh-56px)]">

        {/* PAINEL ESQUERDO */}
        <div className="w-72 border-r border-oikos-border overflow-y-auto flex flex-col">

          {/* ABAS */}
          <div className="flex border-b border-oikos-border">
            {[
              { id: 'config',    label: 'Economia' },
              { id: 'choques',   label: 'Choques' },
              { id: 'resultado', label: 'Resultado' },
            ].map(a => (
              <button key={a.id} onClick={() => setAba(a.id as any)}
                className={`flex-1 py-3 text-xs font-medium transition-colors ${aba === a.id ? 'border-b-2 border-oikos-blue text-oikos-blue' : 'text-oikos-muted'}`}>
                {a.label}
              </button>
            ))}
          </div>

          {/* ABA CONFIG */}
          {aba === 'config' && (
            <div className="p-4 space-y-4 flex-1">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-oikos-muted mb-2">Tipo de Economia</p>
                <select value={tipo} onChange={e => setTipo(e.target.value)}
                  className="w-full border border-oikos-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-oikos-blue">
                  <option value="desenvolvida">Desenvolvida</option>
                  <option value="emergente">Emergente</option>
                  <option value="em_desenvolvimento">Em Desenvolvimento</option>
                  <option value="subdesenvolvida">Subdesenvolvida</option>
                </select>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-oikos-muted mb-2">Escola Economica</p>
                <select value={escola} onChange={e => setEscola(e.target.value)}
                  className="w-full border border-oikos-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-oikos-blue">
                  <option value="classica">Classica</option>
                  <option value="keynesiana">Keynesiana</option>
                  <option value="monetarista">Monetarista</option>
                  <option value="pos_keynesiana">Pos-Keynesiana</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={aberta} onChange={e => setAberta(e.target.checked)}
                  className="w-4 h-4 accent-oikos-blue" />
                <label className="text-sm text-oikos-text">Economia aberta</label>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-oikos-muted mb-3">Parametros Estruturais</p>
                <Slider label="Salario Minimo" value={salario} onChange={setSalario} min={0} max={500} step={10} />
                <Slider label="Informalidade" value={informalidade} onChange={setInformalidade} min={0} max={0.8} step={0.05} fmt={(v: number) => `${(v*100).toFixed(0)}%`} />
                <Slider label="Setor Publico" value={setorPub} onChange={setSetorPub} min={0.05} max={0.5} step={0.05} fmt={(v: number) => `${(v*100).toFixed(0)}%`} />
                <Slider label="Abertura Comercial" value={aberturaCom} onChange={setAberturaCom} min={0.05} max={0.8} step={0.05} fmt={(v: number) => `${(v*100).toFixed(0)}%`} />
                <Slider label="Nivel Tecnologico" value={tecnologia} onChange={setTecnologia} min={0} max={1} step={0.1} fmt={(v: number) => `${(v*100).toFixed(0)}%`} />
                <Slider label="Carga Tributaria" value={cargaTrib} onChange={setCargaTrib} min={0.1} max={0.6} step={0.05} fmt={(v: number) => `${(v*100).toFixed(0)}%`} />
                <Slider label="Desigualdade (Gini)" value={desigualdade} onChange={setDesigualdade} min={0.2} max={0.7} step={0.05} fmt={(v: number) => v.toFixed(2)} />
                <Slider label="Credito Privado/PIB" value={credito} onChange={setCredito} min={0.1} max={1.5} step={0.1} fmt={(v: number) => `${(v*100).toFixed(0)}%`} />
                <Slider label="Periodos (anos)" value={periodos} onChange={setPeriodos} min={5} max={50} step={5} />
              </div>
            </div>
          )}

          {/* ABA CHOQUES */}
          {aba === 'choques' && (
            <div className="p-4 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-oikos-muted mb-3">Choques Predefinidos</p>
              <div className="space-y-2 mb-4">
                {CHOQUES_PREDEFINIDOS.map(c => (
                  <button key={c.id} onClick={() => adicionarChoque(c)}
                    className="w-full text-left bg-oikos-surface border border-oikos-border rounded-xl px-3 py-2 text-xs font-medium text-oikos-text hover:border-oikos-blue hover:text-oikos-blue transition-colors">
                    + {c.nome}
                  </button>
                ))}
              </div>

              {choquesSel.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest text-oikos-muted mb-2">Choques Ativos</p>
                  <div className="space-y-3">
                    {choquesSel.map((c, i) => (
                      <div key={i} className="bg-oikos-surface border border-oikos-border rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-oikos-text">{c.nome}</p>
                          <button onClick={() => setChoquesSel(prev => prev.filter((_, j) => j !== i))}
                            className="text-xs text-oikos-muted hover:text-red-500 transition-colors">×</button>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-oikos-muted w-16">Ano inicio</span>
                            <input type="number" value={c.ano_inicio} min={1} max={periodos}
                              onChange={e => { const n=[...choquesSel]; n[i].ano_inicio=parseInt(e.target.value); setChoquesSel(n) }}
                              className="flex-1 border border-oikos-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-oikos-blue" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-oikos-muted w-16">Duracao</span>
                            <input type="number" value={c.duracao} min={1} max={periodos}
                              onChange={e => { const n=[...choquesSel]; n[i].duracao=parseInt(e.target.value); setChoquesSel(n) }}
                              className="flex-1 border border-oikos-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-oikos-blue" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-oikos-muted w-16">Magnitude</span>
                            <input type="number" value={c.magnitude} min={0.1} max={5} step={0.1}
                              onChange={e => { const n=[...choquesSel]; n[i].magnitude=parseFloat(e.target.value); setChoquesSel(n) }}
                              className="flex-1 border border-oikos-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-oikos-blue" />
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
                const label = prazo === 'curto_prazo' ? 'Curto Prazo' : prazo === 'medio_prazo' ? 'Medio Prazo' : 'Longo Prazo'
                const cor   = prazo === 'curto_prazo' ? 'border-oikos-blue' : prazo === 'medio_prazo' ? 'border-oikos-purple' : 'border-oikos-green'
                return (
                  <div key={prazo} className={`bg-oikos-surface border-l-4 ${cor} rounded-xl p-4`}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-oikos-muted mb-2">{label}</p>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="text-center">
                        <p className="text-xs text-oikos-muted">Y</p>
                        <p className="text-sm font-bold text-oikos-text">{dados.Y}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-oikos-muted">u%</p>
                        <p className="text-sm font-bold text-oikos-text">{dados.u}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-oikos-muted">P</p>
                        <p className="text-sm font-bold text-oikos-text">{dados.P}</p>
                      </div>
                    </div>
                    <p className="text-xs text-oikos-muted leading-relaxed">{dados.descricao}</p>
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
                  <h2 className="text-xl font-bold text-oikos-text">Simulacao — {resultado.tipo} · {resultado.escola}</h2>
                  <p className="text-sm text-oikos-muted">{periodos} periodos simulados</p>
                </div>
              </div>

              {/* Grafico principal — Y, C, I ao longo do tempo */}
              <div className="bg-white border border-oikos-border rounded-2xl p-4">
                <Plot
                  data={[
                    { x: resultado.periodos.map((p: any) => p.ano), y: resultado.periodos.map((p: any) => p.Y), type: 'scatter' as const, mode: 'lines' as const, name: 'Produto (Y)', line: { color: '#0066CC', width: 2.5 } },
                    { x: resultado.periodos.map((p: any) => p.ano), y: resultado.periodos.map((p: any) => p.C), type: 'scatter' as const, mode: 'lines' as const, name: 'Consumo (C)', line: { color: '#1D7A4F', width: 2, dash: 'dash' } },
                    { x: resultado.periodos.map((p: any) => p.ano), y: resultado.periodos.map((p: any) => p.I), type: 'scatter' as const, mode: 'lines' as const, name: 'Investimento (I)', line: { color: '#6E3B9E', width: 2, dash: 'dot' } },
                  ] as any}
                  layout={{ title: 'Produto, Consumo e Investimento', height: 300, font: { family: 'DM Sans' }, paper_bgcolor: 'white', plot_bgcolor: 'white', legend: { orientation: 'h' as const, y: -0.2 }, margin: { t: 40, b: 60 }, xaxis: { title: 'Ano' }, yaxis: { title: 'Valor' } } as any}
                  useResizeHandler style={{ width: '100%' }}
                />
              </div>

              {/* Grafico desemprego e inflacao */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-oikos-border rounded-2xl p-4">
                  <Plot
                    data={[{ x: resultado.periodos.map((p: any) => p.ano), y: resultado.periodos.map((p: any) => p.u), type: 'scatter' as const, mode: 'lines' as const, name: 'Desemprego (%)', line: { color: '#C0392B', width: 2.5 } }] as any}
                    layout={{ title: 'Desemprego (%)', height: 220, font: { family: 'DM Sans' }, paper_bgcolor: 'white', plot_bgcolor: 'white', margin: { t: 40, b: 40 }, showlegend: false, xaxis: { title: 'Ano' } } as any}
                    useResizeHandler style={{ width: '100%' }}
                  />
                </div>
                <div className="bg-white border border-oikos-border rounded-2xl p-4">
                  <Plot
                    data={[{ x: resultado.periodos.map((p: any) => p.ano), y: resultado.periodos.map((p: any) => p.P), type: 'scatter' as const, mode: 'lines' as const, name: 'Nivel de Precos', line: { color: '#FF9800', width: 2.5 } }] as any}
                    layout={{ title: 'Nivel de Precos', height: 220, font: { family: 'DM Sans' }, paper_bgcolor: 'white', plot_bgcolor: 'white', margin: { t: 40, b: 40 }, showlegend: false, xaxis: { title: 'Ano' } } as any}
                    useResizeHandler style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Choques no tempo */}
              {resultado.periodos.some((p: any) => p.choques_ativos.length > 0) && (
                <div className="bg-oikos-surface border border-oikos-border rounded-2xl p-4">
                  <p className="text-sm font-semibold text-oikos-text mb-3">Choques aplicados por periodo</p>
                  <div className="flex flex-wrap gap-2">
                    {resultado.periodos.filter((p: any) => p.choques_ativos.length > 0).map((p: any) => (
                      <div key={p.ano} className="bg-white border border-oikos-border rounded-lg px-3 py-1.5">
                        <span className="text-xs font-semibold text-oikos-text">Ano {p.ano}: </span>
                        <span className="text-xs text-oikos-muted">{p.choques_ativos.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <h2 className="text-xl font-bold text-oikos-text mb-3">Simulador Dinamico</h2>
                <p className="text-sm text-oikos-muted mb-6 leading-relaxed">
                  Configure a economia no painel esquerdo, adicione choques e clique em Simular
                  para ver a evolucao das variaveis ao longo do tempo com analise de curto, medio e longo prazo.
                </p>
                <button onClick={() => setAba('config')}
                  className="bg-oikos-blue text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
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

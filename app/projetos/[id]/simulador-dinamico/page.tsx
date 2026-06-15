'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const CHOQUES_PREDEFINIDOS = [
  { id: 'exp_fiscal',      nome: 'Expansao Fiscal',      eps_demanda: 2.0,  eps_oferta: 0,   d_r_natural: 0,    d_pi_meta: 0  },
  { id: 'cont_fiscal',     nome: 'Austeridade Fiscal',   eps_demanda: -2.0, eps_oferta: 0,   d_r_natural: 0,    d_pi_meta: 0  },
  { id: 'exp_monetaria',   nome: 'Expansao Monetaria',   eps_demanda: 0,    eps_oferta: 0,   d_r_natural: -1.0, d_pi_meta: 0  },
  { id: 'choque_petroleo', nome: 'Choque do Petroleo',   eps_demanda: 0,    eps_oferta: 3.0, d_r_natural: 0,    d_pi_meta: 0  },
  { id: 'choque_demanda',  nome: 'Boom de Demanda',      eps_demanda: 3.0,  eps_oferta: 0,   d_r_natural: 0,    d_pi_meta: 0  },
  { id: 'crise_financ',    nome: 'Crise Financeira',     eps_demanda: -4.0, eps_oferta: 0,   d_r_natural: 0,    d_pi_meta: 0  },
  { id: 'desinflacao',     nome: 'Reducao da Meta',      eps_demanda: 0,    eps_oferta: 0,   d_r_natural: 0,    d_pi_meta: -2.0 },
  { id: 'salario_minimo',  nome: 'Aumento Salario Min.', eps_demanda: 1.0,  eps_oferta: 0.5, d_r_natural: 0,    d_pi_meta: 0  },
  { id: 'inovacao_tecno',  nome: 'Choque Tecnologico',   eps_demanda: 0,    eps_oferta: -2.0,d_r_natural: 0.5,  d_pi_meta: 0  },
]

type Choque = {
  id: string; nome: string; ano_inicio: number; duracao: number; magnitude: number
  eps_demanda: number; eps_oferta: number; d_r_natural: number; d_pi_meta: number
}

const CORES_ESCOLA: Record<string, string> = {
  classica: '#f87171', keynesiana: '#3b82f6', monetarista: '#fb923c', pos_keynesiana: '#a78bfa',
}

export default function SimuladorDinamicoPage() {
  const params   = useParams()
  const router   = useRouter()
  const supabase = createClient()

  const [projeto,    setProjeto]    = useState<any>(null)
  const [simulando,  setSimulando]  = useState(false)
  const [resultado,  setResultado]  = useState<any>(null)
  const [irf,        setIrf]        = useState<any>(null)
  const [comparacao, setComparacao] = useState<any>(null)
  const [aba,        setAba]        = useState<'config' | 'choques' | 'resultado'>('config')
  const [vista,      setVista]      = useState<'trajetoria' | 'irf' | 'comparar'>('trajetoria')

  // Configuracao
  const [tipo,       setTipo]       = useState('emergente')
  const [escola,     setEscola]     = useState('keynesiana')
  const [aberta,     setAberta]     = useState(true)
  const [periodos,   setPeriodos]   = useState(20)

  // Metas / naturais
  const [piMeta,     setPiMeta]     = useState(2.0)
  const [rNatural,   setRNatural]   = useState(2.0)
  const [uNatural,   setUNatural]   = useState(6.0)

  // Estruturais
  const [salario,       setSalario]       = useState(100)
  const [informalidade, setInformalidade] = useState(0.30)
  const [setorPub,      setSetorPub]      = useState(0.20)
  const [aberturaCom,   setAberturaCom]   = useState(0.25)
  const [tecnologia,    setTecnologia]    = useState(0.50)
  const [cargaTrib,     setCargaTrib]     = useState(0.30)
  const [desigualdade,  setDesigualdade]  = useState(0.45)
  const [credito,       setCredito]       = useState(0.50)

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
    setChoquesSel(prev => [...prev, { ...predefinido, ano_inicio: 3, duracao: 2, magnitude: 1.0 }])
  }

  function payload(comparar = false) {
    return {
      economia: {
        tipo, escola, aberta,
        pi_meta: piMeta, r_natural: rNatural, u_natural: uNatural,
        salario_minimo: salario, informalidade, tamanho_setor_pub: setorPub,
        abertura_comercial: aberturaCom, nivel_tecnologico: tecnologia,
        carga_tributaria: cargaTrib, desigualdade, credito_privado: credito,
        y_gap_inicial: 0, pi_inicial: piMeta,
      },
      choques: choquesSel.map(c => ({
        tipo: c.id, nome: c.nome, magnitude: c.magnitude,
        ano_inicio: c.ano_inicio, duracao: c.duracao,
        eps_demanda: c.eps_demanda, eps_oferta: c.eps_oferta,
        d_r_natural: c.d_r_natural, d_pi_meta: c.d_pi_meta,
      })),
      periodos,
      comparar_escolas: comparar,
    }
  }

  async function simular() {
    setSimulando(true)
    try {
      // trajetoria principal
      const res = await fetch(`${API_URL}/simulador-dinamico/simular`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload(false)),
      })
      const data = await res.json()
      setResultado(data)

      // IRF (se houver choques)
      if (choquesSel.length > 0) {
        const resIrf = await fetch(`${API_URL}/simulador-dinamico/irf`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload(false)),
        })
        setIrf(await resIrf.json())
      } else { setIrf(null) }

      // comparacao de escolas
      const resCmp = await fetch(`${API_URL}/simulador-dinamico/simular`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload(true)),
      })
      setComparacao(await resCmp.json())

      setAba('resultado')
      setVista('trajetoria')

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
        <span className="text-xs font-semibold text-white font-mono">{fmt ? fmt(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-500" />
    </div>
  )

  const layoutBase = {
    font: { family: 'DM Sans, sans-serif', color: '#9ca3af' },
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
    xaxis: { gridcolor: 'rgba(255,255,255,0.06)', zerolinecolor: 'rgba(255,255,255,0.15)', color: '#9ca3af' },
    yaxis: { gridcolor: 'rgba(255,255,255,0.06)', zerolinecolor: 'rgba(255,255,255,0.15)', color: '#9ca3af' },
  }

  const anos = resultado?.periodos?.map((p: any) => p.ano) || []

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0f19]/80 backdrop-blur-xl border-b border-white/10 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projetos" className="text-sm text-gray-400 hover:text-blue-400 transition-colors">← Voltar</Link>
          <span className="text-white/10">|</span>
          <span className="text-sm font-semibold text-white">{projeto?.titulo} — Simulador Dinâmico</span>
        </div>
        <button onClick={simular} disabled={simulando}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
          {simulando ? 'Simulando...' : 'Simular'}
        </button>
      </header>

      <div className="pt-14 flex h-[calc(100vh-56px)]">

        {/* PAINEL ESQUERDO */}
        <div className="w-72 border-r border-white/10 overflow-y-auto flex flex-col bg-white/[0.02]">
          <div className="flex border-b border-white/10">
            {[{ id: 'config', label: 'Economia' }, { id: 'choques', label: 'Choques' }, { id: 'resultado', label: 'Resultado' }].map(a => (
              <button key={a.id} onClick={() => setAba(a.id as any)}
                className={`flex-1 py-3 text-xs font-medium transition-colors ${aba === a.id ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
                {a.label}
              </button>
            ))}
          </div>

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
                  <option className="bg-[#11162a]" value="classica">Novo-Clássica</option>
                  <option className="bg-[#11162a]" value="keynesiana">Keynesiana</option>
                  <option className="bg-[#11162a]" value="monetarista">Monetarista</option>
                  <option className="bg-[#11162a]" value="pos_keynesiana">Pós-Keynesiana</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={aberta} onChange={e => setAberta(e.target.checked)} className="w-4 h-4 accent-blue-500" />
                <label className="text-sm text-gray-300">Economia aberta</label>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Metas e Equilíbrio</p>
                <Slider label="Meta de Inflação" value={piMeta} onChange={setPiMeta} min={0} max={8} step={0.5} fmt={(v: number) => `${v.toFixed(1)}%`} />
                <Slider label="Juro Natural (real)" value={rNatural} onChange={setRNatural} min={-1} max={8} step={0.5} fmt={(v: number) => `${v.toFixed(1)}%`} />
                <Slider label="Desemprego Natural" value={uNatural} onChange={setUNatural} min={2} max={20} step={0.5} fmt={(v: number) => `${v.toFixed(1)}%`} />
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
                          {[
                            { lbl: 'Ano início', key: 'ano_inicio', min: 1, step: 1 },
                            { lbl: 'Duração',    key: 'duracao',    min: 1, step: 1 },
                            { lbl: 'Magnitude',  key: 'magnitude',  min: 0.1, step: 0.1 },
                          ].map(f => (
                            <div key={f.key} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-16">{f.lbl}</span>
                              <input type="number" value={(c as any)[f.key]} min={f.min} step={f.step}
                                onChange={e => { const n=[...choquesSel]; (n[i] as any)[f.key]= f.step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value); setChoquesSel(n) }}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {aba === 'resultado' && resultado && (
            <div className="p-4 flex-1 space-y-4">
              {['curto_prazo', 'medio_prazo', 'longo_prazo'].map(prazo => {
                const d = resultado.analise[prazo]
                const label = prazo === 'curto_prazo' ? 'Curto Prazo' : prazo === 'medio_prazo' ? 'Médio Prazo' : 'Longo Prazo'
                const cor = prazo === 'curto_prazo' ? 'border-blue-500' : prazo === 'medio_prazo' ? 'border-purple-500' : 'border-green-500'
                return (
                  <div key={prazo} className={`bg-white/5 border border-white/10 border-l-4 ${cor} rounded-xl p-4`}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">{label}</p>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="text-center"><p className="text-xs text-gray-500">hiato</p><p className="text-sm font-bold text-white">{d.y_gap}%</p></div>
                      <div className="text-center"><p className="text-xs text-gray-500">π</p><p className="text-sm font-bold text-white">{d.pi}%</p></div>
                      <div className="text-center"><p className="text-xs text-gray-500">u</p><p className="text-sm font-bold text-white">{d.u}%</p></div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{d.descricao}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* PAINEL DIREITO */}
        <div className="flex-1 overflow-y-auto p-6">
          {resultado ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Simulação — {resultado.escola_nome} · {resultado.tipo}</h2>
                  <p className="text-sm text-gray-500">Modelo Novo-Keynesiano de 3 equações · {periodos} períodos</p>
                </div>
                {/* Seletor de vista */}
                <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                  {[
                    { id: 'trajetoria', label: 'Trajetória' },
                    { id: 'irf',        label: 'Resposta a Impulso' },
                    { id: 'comparar',   label: 'Comparar Escolas' },
                  ].map(v => (
                    <button key={v.id} onClick={() => setVista(v.id as any)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${vista === v.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* VISTA: TRAJETORIA */}
              {vista === 'trajetoria' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <Plot
                        data={[
                          { x: anos, y: resultado.periodos.map((p: any) => p.y_gap), type: 'scatter', mode: 'lines', name: 'Hiato do Produto', line: { color: '#3b82f6', width: 2.5 } },
                        ] as any}
                        layout={{ ...layoutBase, title: { text: 'Hiato do Produto (%)', font: { color: '#e5e7eb' } }, height: 240, margin: { t: 40, b: 40 }, showlegend: false } as any}
                        useResizeHandler style={{ width: '100%' }} config={{ displayModeBar: false }} />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <Plot
                        data={[
                          { x: anos, y: resultado.periodos.map((p: any) => p.pi), type: 'scatter', mode: 'lines', name: 'Inflação', line: { color: '#fb923c', width: 2.5 } },
                          { x: anos, y: resultado.periodos.map((p: any) => p.pi_meta), type: 'scatter', mode: 'lines', name: 'Meta', line: { color: '#6b7280', width: 1.5, dash: 'dash' } },
                        ] as any}
                        layout={{ ...layoutBase, title: { text: 'Inflação vs Meta (%)', font: { color: '#e5e7eb' } }, height: 240, margin: { t: 40, b: 40 }, legend: { orientation: 'h', y: -0.2, font: { color: '#9ca3af' } } } as any}
                        useResizeHandler style={{ width: '100%' }} config={{ displayModeBar: false }} />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <Plot
                        data={[
                          { x: anos, y: resultado.periodos.map((p: any) => p.r), type: 'scatter', mode: 'lines', name: 'Juro Nominal (Taylor)', line: { color: '#34d399', width: 2.5 } },
                          { x: anos, y: resultado.periodos.map((p: any) => p.r_real), type: 'scatter', mode: 'lines', name: 'Juro Real', line: { color: '#a78bfa', width: 2, dash: 'dot' } },
                        ] as any}
                        layout={{ ...layoutBase, title: { text: 'Taxa de Juros (%)', font: { color: '#e5e7eb' } }, height: 240, margin: { t: 40, b: 40 }, legend: { orientation: 'h', y: -0.2, font: { color: '#9ca3af' } } } as any}
                        useResizeHandler style={{ width: '100%' }} config={{ displayModeBar: false }} />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <Plot
                        data={[
                          { x: anos, y: resultado.periodos.map((p: any) => p.u), type: 'scatter', mode: 'lines', name: 'Desemprego', line: { color: '#f87171', width: 2.5 } },
                          { x: anos, y: resultado.periodos.map((p: any) => p.u_natural), type: 'scatter', mode: 'lines', name: 'Natural (NAIRU)', line: { color: '#6b7280', width: 1.5, dash: 'dash' } },
                        ] as any}
                        layout={{ ...layoutBase, title: { text: 'Desemprego vs NAIRU (%)', font: { color: '#e5e7eb' } }, height: 240, margin: { t: 40, b: 40 }, legend: { orientation: 'h', y: -0.2, font: { color: '#9ca3af' } } } as any}
                        useResizeHandler style={{ width: '100%' }} config={{ displayModeBar: false }} />
                    </div>
                  </div>

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
              )}

              {/* VISTA: IRF */}
              {vista === 'irf' && (
                irf ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                      Resposta a impulso: desvio de cada variável em relação ao cenário sem choque.
                      É o gráfico padrão de bancos centrais para isolar o efeito puro de um choque.
                    </p>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <Plot
                        data={[
                          { x: irf.irf.map((d: any) => d.ano), y: irf.irf.map((d: any) => d.y_gap), type: 'scatter', mode: 'lines', name: 'Hiato', line: { color: '#3b82f6', width: 2.5 } },
                          { x: irf.irf.map((d: any) => d.ano), y: irf.irf.map((d: any) => d.pi), type: 'scatter', mode: 'lines', name: 'Inflação', line: { color: '#fb923c', width: 2.5 } },
                          { x: irf.irf.map((d: any) => d.ano), y: irf.irf.map((d: any) => d.r), type: 'scatter', mode: 'lines', name: 'Juro', line: { color: '#34d399', width: 2.5 } },
                          { x: irf.irf.map((d: any) => d.ano), y: irf.irf.map((d: any) => d.u), type: 'scatter', mode: 'lines', name: 'Desemprego', line: { color: '#f87171', width: 2.5 } },
                        ] as any}
                        layout={{ ...layoutBase, title: { text: `Funções de Resposta a Impulso — ${irf.escola_nome}`, font: { color: '#e5e7eb' } }, height: 420, margin: { t: 50, b: 50 }, legend: { orientation: 'h', y: -0.15, font: { color: '#9ca3af' } } } as any}
                        useResizeHandler style={{ width: '100%' }} config={{ displayModeBar: false }} />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
                    <p className="text-sm text-gray-400">Adicione pelo menos um choque para visualizar a resposta a impulso.</p>
                  </div>
                )
              )}

              {/* VISTA: COMPARAR ESCOLAS */}
              {vista === 'comparar' && comparacao?.comparacao && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    Mesmo choque, mesma economia — quatro escolas. As diferenças vêm das parametrizações
                    (rigidez da Phillips, eficácia monetária, expectativas, regra de Taylor).
                  </p>
                  {[
                    { key: 'y_gap', titulo: 'Hiato do Produto (%)' },
                    { key: 'pi',    titulo: 'Inflação (%)' },
                    { key: 'u',     titulo: 'Desemprego (%)' },
                  ].map(metr => (
                    <div key={metr.key} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <Plot
                        data={Object.entries(comparacao.comparacao).map(([esc, d]: any) => ({
                          x: d.periodos.map((p: any) => p.ano),
                          y: d.periodos.map((p: any) => p[metr.key]),
                          type: 'scatter', mode: 'lines', name: d.nome,
                          line: { color: CORES_ESCOLA[esc] || '#9ca3af', width: 2.5 },
                        })) as any}
                        layout={{ ...layoutBase, title: { text: metr.titulo, font: { color: '#e5e7eb' } }, height: 280, margin: { t: 40, b: 50 }, legend: { orientation: 'h', y: -0.2, font: { color: '#9ca3af' } } } as any}
                        useResizeHandler style={{ width: '100%' }} config={{ displayModeBar: false }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <h2 className="text-xl font-bold text-white mb-3">Simulador Dinâmico</h2>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                  Modelo Novo-Keynesiano de 3 equações (IS dinâmica, Curva de Phillips e Regra de Taylor).
                  Configure a economia, adicione choques e veja trajetórias, resposta a impulso e a
                  comparação entre escolas de pensamento.
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
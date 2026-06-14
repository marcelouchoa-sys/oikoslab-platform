'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Pais = { codigo: string; nome: string; regiao: string }
type DadoSerie = { ano: number; valor: number }

export default function EconomiaRealPage() {
  const params   = useParams()
  const router   = useRouter()
  const supabase = createClient()

  const [projeto,    setProjeto]    = useState<any>(null)
  const [paises,     setPaises]     = useState<Pais[]>([])
  const [paisSel,    setPaisSel]    = useState('BR')
  const [anoIni,     setAnoIni]     = useState(2010)
  const [anoFim,     setAnoFim]     = useState(2023)
  const [loading,    setLoading]    = useState(false)
  const [dados,      setDados]      = useState<any>(null)
  const [calibrado,  setCalibrado]  = useState<any>(null)
  const [aba,        setAba]        = useState<'dados' | 'calibrado' | 'series'>('dados')

  useEffect(() => {
    async function init() {
      const { data } = await supabase.from('projetos').select('*').eq('id', params.id).single()
      if (!data) { router.push('/projetos'); return }
      setProjeto(data)
      if (data.configuracao?.pais)   setPaisSel(data.configuracao.pais)
      if (data.configuracao?.anoIni) setAnoIni(data.configuracao.anoIni)
      if (data.configuracao?.anoFim) setAnoFim(data.configuracao.anoFim)
      if (data.configuracao?.dados)  setDados(data.configuracao.dados)
      if (data.configuracao?.calibrado) setCalibrado(data.configuracao.calibrado)
    }
    init()

    // Buscar lista de paises
    fetch(`${API_URL}/economia-real/paises`)
      .then(r => r.json())
      .then(setPaises)
      .catch(() => {})
  }, [params.id])

  async function buscarDados() {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/economia-real/calibrar/${paisSel}/${anoIni}/${anoFim}`)
      const data = await res.json()
      setDados(data.dados_resumo)
      setCalibrado(data)

      // Salvar no projeto
      await supabase.from('projetos').update({
        configuracao: { pais: paisSel, anoIni, anoFim, dados: data.dados_resumo, calibrado: data },
        updated_at: new Date().toISOString(),
      }).eq('id', params.id)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const INDICADORES_LABEL: Record<string, string> = {
    pib_medio_usd:    'PIB Médio (USD)',
    consumo_pct_pib:  'Consumo (% PIB)',
    invest_pct_pib:   'Investimento (% PIB)',
    gov_pct_pib:      'Gasto Governo (% PIB)',
    inflacao_media:   'Inflação Média (%)',
    desemprego_medio: 'Desemprego Médio (%)',
    juros_real_medio: 'Juros Real Médio (%)',
    exportacoes_pct:  'Exportações (% PIB)',
    importacoes_pct:  'Importações (% PIB)',
  }

  const plotlyLayoutBase = {
    font: { family: 'DM Sans, sans-serif', color: '#9ca3af', size: 11 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    xaxis: { gridcolor: 'rgba(255,255,255,0.06)', zerolinecolor: 'rgba(255,255,255,0.1)', color: '#9ca3af' },
    yaxis: { gridcolor: 'rgba(255,255,255,0.06)', zerolinecolor: 'rgba(255,255,255,0.1)', color: '#9ca3af' },
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0f19]/80 backdrop-blur-xl border-b border-white/10 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projetos" className="text-sm text-gray-400 hover:text-blue-400 transition-colors">
            ← Voltar
          </Link>
          <span className="text-white/10">|</span>
          <span className="text-sm font-semibold text-white">{projeto?.titulo} — Economia Real</span>
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
      </header>

      <div className="pt-20 px-12 pb-16 max-w-6xl mx-auto">

        {/* CONFIGURACAO */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Configuração</p>
          <div className="grid grid-cols-4 gap-4 items-end">
            <div className="col-span-2">
              <label className="text-sm font-medium text-white block mb-1.5">País</label>
              <select value={paisSel} onChange={e => setPaisSel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                {paises.length > 0 ? (
                  paises.map(p => (
                    <option className="bg-[#11162a]" key={p.codigo} value={p.codigo}>{p.nome}</option>
                  ))
                ) : (
                  <>
                    <option className="bg-[#11162a]" value="BR">Brasil</option>
                    <option className="bg-[#11162a]" value="AR">Argentina</option>
                    <option className="bg-[#11162a]" value="US">Estados Unidos</option>
                    <option className="bg-[#11162a]" value="CN">China</option>
                    <option className="bg-[#11162a]" value="DE">Alemanha</option>
                    <option className="bg-[#11162a]" value="JP">Japão</option>
                    <option className="bg-[#11162a]" value="MX">México</option>
                    <option className="bg-[#11162a]" value="CL">Chile</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-white block mb-1.5">Ano inicial</label>
              <input type="number" value={anoIni} onChange={e => setAnoIni(parseInt(e.target.value))}
                min={1960} max={2023}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-sm font-medium text-white block mb-1.5">Ano final</label>
              <input type="number" value={anoFim} onChange={e => setAnoFim(parseInt(e.target.value))}
                min={1960} max={2023}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
          </div>
          <button onClick={buscarDados} disabled={loading}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
            {loading ? 'Buscando dados...' : 'Buscar e Calibrar'}
          </button>
        </div>

        {/* RESULTADOS */}
        {calibrado && (
          <>
            {/* ABAS */}
            <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-6 w-fit">
              {[
                { id: 'dados',     label: 'Indicadores' },
                { id: 'calibrado', label: 'Parâmetros Calibrados' },
                { id: 'series',    label: 'Séries Históricas' },
              ].map(a => (
                <button key={a.id} onClick={() => setAba(a.id as any)}
                  className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${aba === a.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                  {a.label}
                </button>
              ))}
            </div>

            {/* ABA INDICADORES */}
            {aba === 'dados' && dados && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
                  {calibrado.pais} · {calibrado.periodo}
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(dados).map(([k, v]) => (
                    v !== null && (
                      <div key={k} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-xs font-medium uppercase tracking-widest text-gray-500 mb-1">
                          {INDICADORES_LABEL[k] || k}
                        </p>
                        <p className="text-xl font-bold text-white">
                          {typeof v === 'number' ? (
                            k === 'pib_medio_usd'
                              ? `$${(v / 1e9).toFixed(1)}B`
                              : `${(v as number).toFixed(2)}%`
                          ) : String(v)}
                        </p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* ABA PARAMETROS CALIBRADOS */}
            {aba === 'calibrado' && calibrado.parametros_calibrados && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
                  Parâmetros IS-LM calibrados para {calibrado.pais} ({calibrado.periodo})
                </p>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {Object.entries(calibrado.parametros_calibrados).map(([k, v]) => (
                    typeof v === 'number' && (
                      <div key={k} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-xs font-mono font-medium text-gray-500 mb-1">{k}</p>
                        <p className="text-xl font-bold text-blue-400">{(v as number).toFixed(3)}</p>
                      </div>
                    )
                  ))}
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-sm font-medium text-blue-300 mb-1">Como usar estes parâmetros</p>
                  <p className="text-sm text-gray-400">
                    Estes parâmetros foram calibrados com dados reais do World Bank para {calibrado.pais}
                    no período {calibrado.periodo}. Use-os como ponto de partida no editor de modelos
                    para simular políticas econômicas com base na realidade deste país.
                  </p>
                </div>
              </div>
            )}

            {/* ABA SERIES HISTORICAS */}
            {aba === 'series' && calibrado.series_historicas && (
              <div className="space-y-6">
                {Object.entries(calibrado.series_historicas).map(([nome, serie]: any) => (
                  serie.length > 0 && (
                    <div key={nome} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <p className="text-sm font-semibold text-white mb-4">
                        {INDICADORES_LABEL[nome] || nome}
                      </p>
                      <Plot
                        data={[{
                          x: serie.map((d: DadoSerie) => d.ano),
                          y: serie.map((d: DadoSerie) => d.valor),
                          type: 'scatter' as const,
                          mode: 'lines+markers' as const,
                          line: { color: '#3b82f6', width: 2 },
                          marker: { size: 4, color: '#3b82f6' },
                        }] as any}
                        layout={{
                          ...plotlyLayoutBase,
                          height: 200,
                          margin: { t: 10, b: 40, l: 50, r: 20 },
                          xaxis: { ...plotlyLayoutBase.xaxis, title: 'Ano' },
                          yaxis: { ...plotlyLayoutBase.yaxis, title: INDICADORES_LABEL[nome] || nome },
                        } as any}
                        useResizeHandler
                        style={{ width: '100%' }}
                        config={{ displayModeBar: false }}
                      />
                    </div>
                  )
                ))}
              </div>
            )}
          </>
        )}

        {!calibrado && !loading && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
            <p className="text-lg font-semibold text-white mb-2">Selecione um país e período</p>
            <p className="text-sm text-gray-400">
              O sistema vai buscar dados reais do World Bank e calibrar automaticamente os parâmetros do modelo.
            </p>
          </div>
        )}

        {loading && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
            <p className="text-sm text-gray-400">Buscando dados do World Bank...</p>
          </div>
        )}

      </div>
    </main>
  )
}
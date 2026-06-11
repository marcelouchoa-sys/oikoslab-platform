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
    pib_medio_usd:    'PIB Medio (USD)',
    consumo_pct_pib:  'Consumo (% PIB)',
    invest_pct_pib:   'Investimento (% PIB)',
    gov_pct_pib:      'Gasto Governo (% PIB)',
    inflacao_media:   'Inflacao Media (%)',
    desemprego_medio: 'Desemprego Medio (%)',
    juros_real_medio: 'Juros Real Medio (%)',
    exportacoes_pct:  'Exportacoes (% PIB)',
    importacoes_pct:  'Importacoes (% PIB)',
  }

  return (
    <main className="min-h-screen bg-white">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-oikos-border px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projetos/${params.id}`} className="text-sm text-oikos-muted hover:text-oikos-blue transition-colors">
            ← Voltar
          </Link>
          <span className="text-oikos-border">|</span>
          <span className="text-sm font-semibold text-oikos-text">{projeto?.titulo} — Economia Real</span>
        </div>
      </header>

      <div className="pt-20 px-12 pb-16 max-w-6xl mx-auto">

        {/* CONFIGURACAO */}
        <div className="bg-oikos-surface border border-oikos-border rounded-2xl p-6 mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-oikos-muted mb-4">Configuracao</p>
          <div className="grid grid-cols-4 gap-4 items-end">
            <div className="col-span-2">
              <label className="text-sm font-medium text-oikos-text block mb-1.5">Pais</label>
              <select value={paisSel} onChange={e => setPaisSel(e.target.value)}
                className="w-full border border-oikos-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-oikos-blue bg-white">
                {paises.length > 0 ? (
                  paises.map(p => (
                    <option key={p.codigo} value={p.codigo}>{p.nome}</option>
                  ))
                ) : (
                  <>
                    <option value="BR">Brasil</option>
                    <option value="AR">Argentina</option>
                    <option value="US">Estados Unidos</option>
                    <option value="CN">China</option>
                    <option value="DE">Alemanha</option>
                    <option value="JP">Japão</option>
                    <option value="MX">Mexico</option>
                    <option value="CL">Chile</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-oikos-text block mb-1.5">Ano inicial</label>
              <input type="number" value={anoIni} onChange={e => setAnoIni(parseInt(e.target.value))}
                min={1960} max={2023}
                className="w-full border border-oikos-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-oikos-blue" />
            </div>
            <div>
              <label className="text-sm font-medium text-oikos-text block mb-1.5">Ano final</label>
              <input type="number" value={anoFim} onChange={e => setAnoFim(parseInt(e.target.value))}
                min={1960} max={2023}
                className="w-full border border-oikos-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-oikos-blue" />
            </div>
          </div>
          <button onClick={buscarDados} disabled={loading}
            className="mt-4 bg-oikos-blue text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loading ? 'Buscando dados...' : 'Buscar e Calibrar'}
          </button>
        </div>

        {/* RESULTADOS */}
        {calibrado && (
          <>
            {/* ABAS */}
            <div className="flex gap-1 bg-oikos-surface rounded-xl p-1 mb-6 w-fit">
              {[
                { id: 'dados',     label: 'Indicadores' },
                { id: 'calibrado', label: 'Parametros Calibrados' },
                { id: 'series',    label: 'Series Historicas' },
              ].map(a => (
                <button key={a.id} onClick={() => setAba(a.id as any)}
                  className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${aba === a.id ? 'bg-white text-oikos-text shadow-sm' : 'text-oikos-muted'}`}>
                  {a.label}
                </button>
              ))}
            </div>

            {/* ABA INDICADORES */}
            {aba === 'dados' && dados && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-oikos-muted mb-4">
                  {calibrado.pais} · {calibrado.periodo}
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(dados).map(([k, v]) => (
                    v !== null && (
                      <div key={k} className="bg-oikos-surface border border-oikos-border rounded-xl p-4">
                        <p className="text-xs font-medium uppercase tracking-widest text-oikos-muted mb-1">
                          {INDICADORES_LABEL[k] || k}
                        </p>
                        <p className="text-xl font-bold text-oikos-text">
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
                <p className="text-xs font-semibold uppercase tracking-widest text-oikos-muted mb-4">
                  Parametros IS-LM calibrados para {calibrado.pais} ({calibrado.periodo})
                </p>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {Object.entries(calibrado.parametros_calibrados).map(([k, v]) => (
                    typeof v === 'number' && (
                      <div key={k} className="bg-oikos-surface border border-oikos-border rounded-xl p-4">
                        <p className="text-xs font-mono font-medium text-oikos-muted mb-1">{k}</p>
                        <p className="text-xl font-bold text-oikos-blue">{(v as number).toFixed(3)}</p>
                      </div>
                    )
                  ))}
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm font-medium text-oikos-blue mb-1">Como usar estes parametros</p>
                  <p className="text-sm text-oikos-muted">
                    Estes parametros foram calibrados com dados reais do World Bank para {calibrado.pais}
                    no periodo {calibrado.periodo}. Use-os como ponto de partida no editor de modelos
                    para simular politicas economicas com base na realidade deste pais.
                  </p>
                </div>
              </div>
            )}

            {/* ABA SERIES HISTORICAS */}
            {aba === 'series' && calibrado.series_historicas && (
              <div className="space-y-6">
                {Object.entries(calibrado.series_historicas).map(([nome, serie]: any) => (
                  serie.length > 0 && (
                    <div key={nome} className="bg-white border border-oikos-border rounded-2xl p-6">
                      <p className="text-sm font-semibold text-oikos-text mb-4">
                        {INDICADORES_LABEL[nome] || nome}
                      </p>
                      <Plot
                        data={[{
                          x: serie.map((d: DadoSerie) => d.ano),
                          y: serie.map((d: DadoSerie) => d.valor),
                          type: 'scatter' as const,
                          mode: 'lines+markers' as const,
                          line: { color: '#0066CC', width: 2 },
                          marker: { size: 4 },
                        }] as any}
                        layout={{
                          height: 200,
                          margin: { t: 10, b: 40, l: 50, r: 20 },
                          xaxis: { title: 'Ano' },
                          yaxis: { title: INDICADORES_LABEL[nome] || nome },
                          paper_bgcolor: 'white',
                          plot_bgcolor:  'white',
                          font: { family: 'DM Sans', size: 11 },
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
          <div className="bg-oikos-surface border border-oikos-border rounded-2xl p-16 text-center">
            <p className="text-lg font-semibold text-oikos-text mb-2">Selecione um pais e periodo</p>
            <p className="text-sm text-oikos-muted">
              O sistema vai buscar dados reais do World Bank e calibrar automaticamente os parametros do modelo.
            </p>
          </div>
        )}

        {loading && (
          <div className="bg-oikos-surface border border-oikos-border rounded-2xl p-16 text-center">
            <p className="text-sm text-oikos-muted">Buscando dados do World Bank...</p>
          </div>
        )}

      </div>
    </main>
  )
}

'use client'

// app/projetos/[id]/editor/page.tsx
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import 'katex/dist/katex.min.css'
import { BlockMath } from 'react-katex'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

// ── Tipos ─────────────────────────────────────────────────────────
type Parametro  = { id: string; nome: string; valor: number; descricao: string }
type Equacao    = { id: string; nome: string; variavel: string; expressao: string; valida: boolean }
type Resultado  = { valores: Record<string, number>; series: Record<string, number[]> | null; erros: string[]; latex: Record<string, string> }
type NotaBloco  = { id: string; conteudo: string }

function uid() { return Math.random().toString(36).slice(2) }

// ── Componente ────────────────────────────────────────────────────
export default function EditorPage() {
  const params   = useParams()
  const router   = useRouter()
  const supabase = createClient()

  const [projeto,    setProjeto]    = useState<any>(null)
  const [loading,    setLoading]    = useState(true)
  const [calculando, setCalculando] = useState(false)
  const [salvando,   setSalvando]   = useState(false)
  const [resultado,  setResultado]  = useState<Resultado | null>(null)
  const [aba,        setAba]        = useState<'editor' | 'notas' | 'historico'>('editor')

  // Estado do modelo
  const [parametros, setParametros] = useState<Parametro[]>([
    { id: uid(), nome: 'c0', valor: 100,  descricao: 'Consumo autonomo' },
    { id: uid(), nome: 'c1', valor: 0.75, descricao: 'Propensao a consumir' },
    { id: uid(), nome: 'T',  valor: 200,  descricao: 'Impostos' },
    { id: uid(), nome: 'G',  valor: 300,  descricao: 'Gastos do governo' },
    { id: uid(), nome: 'I0', valor: 200,  descricao: 'Investimento autonomo' },
  ])

  const [equacoes, setEquacoes] = useState<Equacao[]>([
    { id: uid(), nome: 'Consumo',     variavel: 'C', expressao: 'c0 + c1*(Y - T)', valida: true },
    { id: uid(), nome: 'Investimento',variavel: 'I', expressao: 'I0',              valida: true },
    { id: uid(), nome: 'Produto',     variavel: 'Y', expressao: 'C + I + G',       valida: true },
  ])

  const [varLivre, setVarLivre] = useState({ nome: 'Y', min: 0, max: 2000, ativo: false })
  const [notas,    setNotas]    = useState<NotaBloco[]>([{ id: uid(), conteudo: '' }])
  const [tituloModelo, setTituloModelo] = useState('Meu Modelo')
  const [validacoes, setValidacoes] = useState<Record<string, boolean | null>>({})

  // Carregar projeto
  useEffect(() => {
    async function carregar() {
      const { data } = await supabase.from('projetos').select('*').eq('id', params.id).single()
      if (!data) { router.push('/projetos'); return }
      setProjeto(data)
      setTituloModelo(data.titulo)

      // Restaurar configuração salva
      if (data.configuracao?.parametros) setParametros(data.configuracao.parametros)
      if (data.configuracao?.equacoes)   setEquacoes(data.configuracao.equacoes)
      if (data.configuracao?.varLivre)   setVarLivre(data.configuracao.varLivre)
      if (data.configuracao?.notas)      setNotas(data.configuracao.notas)
      setLoading(false)
    }
    carregar()
  }, [params.id])

  // Calcular modelo
  async function calcular() {
    setCalculando(true)
    setResultado(null)
    try {
      const res = await api.modelo.resolver({
        parametros: parametros.map(p => ({ nome: p.nome, valor: p.valor, descricao: p.descricao })),
        equacoes:   equacoes.map(e => ({ nome: e.nome, variavel: e.variavel, expressao: e.expressao })),
        variavel_livre: varLivre.ativo ? { nome: varLivre.nome, min: varLivre.min, max: varLivre.max, pontos: 200 } : null,
      })
      setResultado(res)
    } catch (e: any) {
      setResultado({ valores: {}, series: null, erros: [e.message], latex: {} })
    }
    setCalculando(false)
  }

  // Salvar configuração
  async function salvar() {
    if (!projeto) return
    setSalvando(true)
    await supabase.from('projetos').update({
      configuracao: { parametros, equacoes, varLivre, notas },
      updated_at: new Date().toISOString(),
    }).eq('id', projeto.id)
    setSalvando(false)
  }

  // Salvar simulação no histórico
  async function salvarSimulacao() {
    if (!resultado || !projeto) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('simulacoes').insert({
      user_id:    user.id,
      projeto_id: projeto.id,
      modulo:     'modelo_proprio',
      parametros: Object.fromEntries(parametros.map(p => [p.nome, p.valor])),
      resultado:  resultado.valores,
    })
    alert('Simulação salva no histórico!')
  }

  async function validarExpressao(id: string, expressao: string) {
    if (!expressao.trim()) return
    try {
      const res = await api.modelo.validar({
        expressao,
        parametros: Object.fromEntries(parametros.map(p => [p.nome, p.valor]))
      })
      setValidacoes(prev => ({ ...prev, [id]: res.valido }))
    } catch {
      setValidacoes(prev => ({ ...prev, [id]: false }))
    }
  }

  if (loading) return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-sm text-oikos-muted">Carregando editor...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-white flex flex-col">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-oikos-border px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projetos/${params.id}`} className="text-sm text-oikos-muted hover:text-oikos-blue transition-colors">
            ← Voltar
          </Link>
          <span className="text-oikos-border">|</span>
          <span className="text-sm font-semibold text-oikos-text">{tituloModelo}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-oikos-surface rounded-lg p-1">
            {(['editor', 'notas', 'historico'] as const).map(a => (
              <button key={a} onClick={() => setAba(a)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${aba === a ? 'bg-white text-oikos-text shadow-sm' : 'text-oikos-muted'}`}>
                {a === 'editor' ? 'Editor' : a === 'notas' ? 'Notas' : 'Historico'}
              </button>
            ))}
          </div>
          <button onClick={salvar} disabled={salvando}
            className="bg-oikos-surface border border-oikos-border text-oikos-text px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={calcular} disabled={calculando}
            className="bg-oikos-blue text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
            {calculando ? 'Calculando...' : 'Calcular'}
          </button>
        </div>
      </header>

      <div className="pt-14 flex flex-1">

        {/* ABA EDITOR */}
        {aba === 'editor' && (
          <>
            {/* PAINEL ESQUERDO — parâmetros e equações */}
            <div className="w-80 border-r border-oikos-border overflow-y-auto h-[calc(100vh-56px)] flex flex-col">

              {/* PARÂMETROS */}
              <div className="p-4 border-b border-oikos-border">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-oikos-muted">Parametros</p>
                  <button onClick={() => setParametros(p => [...p, { id: uid(), nome: '', valor: 0, descricao: '' }])}
                    className="text-xs text-oikos-blue hover:underline">+ Adicionar</button>
                </div>
                <div className="space-y-2">
                  {parametros.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <input value={p.nome} onChange={e => {
                          const novo = [...parametros]; novo[i].nome = e.target.value; setParametros(novo)
                        }}
                        placeholder="nome"
                        className="w-16 border border-oikos-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-oikos-blue font-mono" />
                      <span className="text-xs text-oikos-muted">=</span>
                      <input type="number" value={p.valor} onChange={e => {
                          const novo = [...parametros]; novo[i].valor = parseFloat(e.target.value) || 0; setParametros(novo)
                        }}
                        className="flex-1 border border-oikos-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-oikos-blue" />
                      <button onClick={() => setParametros(parametros.filter((_, j) => j !== i))}
                        className="text-oikos-muted hover:text-red-500 text-xs transition-colors">×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* EQUAÇÕES */}
              <div className="p-4 border-b border-oikos-border flex-1">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-oikos-muted">Equacoes</p>
                  <button onClick={() => setEquacoes(e => [...e, { id: uid(), nome: '', variavel: '', expressao: '', valida: true }])}
                    className="text-xs text-oikos-blue hover:underline">+ Adicionar</button>
                </div>
                <div className="space-y-3">
                  {equacoes.map((eq, i) => (
                    <div key={eq.id} className="bg-oikos-surface rounded-xl p-3 border border-oikos-border">
                      <div className="flex items-center gap-2 mb-2">
                        <input value={eq.nome} onChange={e => {
                            const novo = [...equacoes]; novo[i].nome = e.target.value; setEquacoes(novo)
                          }}
                          placeholder="Nome da equacao"
                          className="flex-1 bg-transparent text-xs font-medium text-oikos-text focus:outline-none placeholder:text-oikos-muted" />
                        <button onClick={() => setEquacoes(equacoes.filter((_, j) => j !== i))}
                          className="text-oikos-muted hover:text-red-500 text-xs transition-colors">×</button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input value={eq.variavel} onChange={e => {
                            const novo = [...equacoes]; novo[i].variavel = e.target.value; setEquacoes(novo)
                          }}
                          placeholder="var"
                          className="w-10 border border-oikos-border rounded-md px-1.5 py-1 text-xs font-mono focus:outline-none focus:border-oikos-blue bg-white" />
                        <span className="text-xs text-oikos-muted font-mono">=</span>
                        <input value={eq.expressao} onChange={e => {
                            const novo = [...equacoes]; novo[i].expressao = e.target.value; setEquacoes(novo)
                            clearTimeout((window as any)[`timer_${eq.id}`])
                            ;(window as any)[`timer_${eq.id}`] = setTimeout(() => validarExpressao(eq.id, e.target.value), 500)
                          }}
                          placeholder="expressao..."
                          className={`flex-1 border rounded-md px-2 py-1 text-xs font-mono focus:outline-none bg-white transition-colors ${
                            validacoes[eq.id] === true  ? 'border-green-400 focus:border-green-500' :
                            validacoes[eq.id] === false ? 'border-red-400 focus:border-red-500' :
                            'border-oikos-border focus:border-oikos-blue'
                          }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* VARIÁVEL LIVRE */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <input type="checkbox" checked={varLivre.ativo} onChange={e => setVarLivre(v => ({ ...v, ativo: e.target.checked }))}
                    className="w-3.5 h-3.5 accent-oikos-blue" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-oikos-muted">Variavel livre (grafico)</p>
                </div>
                {varLivre.ativo && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-oikos-muted w-8">Var:</span>
                      <input value={varLivre.nome} onChange={e => setVarLivre(v => ({ ...v, nome: e.target.value }))}
                        className="flex-1 border border-oikos-border rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-oikos-blue" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-oikos-muted w-8">Min:</span>
                      <input type="number" value={varLivre.min} onChange={e => setVarLivre(v => ({ ...v, min: parseFloat(e.target.value) || 0 }))}
                        className="flex-1 border border-oikos-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-oikos-blue" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-oikos-muted w-8">Max:</span>
                      <input type="number" value={varLivre.max} onChange={e => setVarLivre(v => ({ ...v, max: parseFloat(e.target.value) || 2000 }))}
                        className="flex-1 border border-oikos-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-oikos-blue" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PAINEL DIREITO — resultado */}
            <div className="flex-1 overflow-y-auto h-[calc(100vh-56px)] p-6">
              {resultado ? (
                <div className="space-y-6">

                  {/* Erros */}
                  {resultado.erros.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-red-700 mb-2">Avisos:</p>
                      {resultado.erros.map((e, i) => (
                        <p key={i} className="text-xs text-red-600 font-mono">{e}</p>
                      ))}
                    </div>
                  )}

                  {/* Valores */}
                  {Object.keys(resultado.valores).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-oikos-muted mb-3">Resultado</p>
                      <div className="grid grid-cols-4 gap-3">
                        {Object.entries(resultado.valores).map(([k, v]) => (
                          <div key={k} className="bg-oikos-surface border border-oikos-border rounded-xl p-4">
                            <p className="text-xs font-mono font-medium text-oikos-muted mb-1">{k}</p>
                            <p className="text-xl font-bold text-oikos-text tracking-tight">
                              {typeof v === 'number' ? v.toFixed(2) : v}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LaTeX */}
                  {Object.keys(resultado.latex).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-oikos-muted mb-3">Equacoes</p>
                      <div className="bg-oikos-surface border border-oikos-border rounded-xl p-6 space-y-4">
                        {Object.entries(resultado.latex).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-4">
                            <span className="text-xs font-mono text-oikos-muted w-6">{k}</span>
                            <div className="flex-1">
                              <BlockMath math={v.replace(`${k} = `, '')} errorColor="#C0392B" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gráfico */}
                  {resultado.series && Object.keys(resultado.series).length > 1 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-oikos-muted mb-3">Grafico</p>
                      <div className="bg-white border border-oikos-border rounded-2xl p-4">
                        <Plot
                          data={Object.entries(resultado.series)
                            .filter(([k]) => k !== varLivre.nome)
                            .map(([k, vals], i) => ({
                              x:    resultado.series![varLivre.nome] as number[],
                              y:    vals as number[],
                              type: 'scatter' as const,
                              mode: 'lines' as const,
                              name: String(k),
                              line: { width: 2.5, color: ['#0066CC', '#C0392B', '#1D7A4F', '#6E3B9E', '#3A4D6B'][i % 5] },
                            })) as any}
                          layout={{
                            xaxis: { title: varLivre.nome },
                            yaxis: { title: 'Valor' },
                            height: 380,
                            font:   { family: 'DM Sans' },
                            paper_bgcolor: 'white',
                            plot_bgcolor:  'white',
                            legend: { orientation: 'h', y: -0.2 },
                            margin: { t: 20, b: 60, l: 50, r: 20 },
                          } as any}
                          useResizeHandler style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Salvar simulação */}
                  <button onClick={salvarSimulacao}
                    className="bg-oikos-surface border border-oikos-border text-oikos-text px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
                    Salvar no historico
                  </button>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-oikos-text mb-2">Configure o modelo e calcule</p>
                    <p className="text-sm text-oikos-muted mb-6 max-w-sm">
                      Defina os parametros e equacoes no painel esquerdo,
                      depois clique em Calcular.
                    </p>
                    <button onClick={calcular}
                      className="bg-oikos-blue text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                      Calcular agora
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ABA NOTAS */}
        {aba === 'notas' && (
          <div className="flex-1 p-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-oikos-text">Bloco de Notas</h2>
              <button onClick={() => setNotas(n => [...n, { id: uid(), conteudo: '' }])}
                className="text-sm text-oikos-blue hover:underline">+ Nova nota</button>
            </div>
            <div className="space-y-4">
              {notas.map((nota, i) => (
                <div key={nota.id} className="bg-oikos-surface border border-oikos-border rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs font-medium text-oikos-muted">Nota {i + 1}</p>
                    <button onClick={() => setNotas(notas.filter((_, j) => j !== i))}
                      className="text-xs text-oikos-muted hover:text-red-500 transition-colors">Remover</button>
                  </div>
                  <textarea value={nota.conteudo}
                    onChange={e => {
                      const novo = [...notas]; novo[i].conteudo = e.target.value; setNotas(novo)
                    }}
                    placeholder="Escreva suas notas, hipoteses, referencias..."
                    rows={5}
                    className="w-full bg-transparent text-sm text-oikos-text resize-none focus:outline-none placeholder:text-oikos-muted leading-relaxed" />
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button onClick={salvar} disabled={salvando}
                className="bg-oikos-blue text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                {salvando ? 'Salvando...' : 'Salvar notas'}
              </button>
            </div>
          </div>
        )}

        {/* ABA HISTÓRICO */}
        {aba === 'historico' && (
          <div className="flex-1 p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-oikos-text mb-6">Historico de Simulacoes</h2>
            <HistoricoSimulacoes projetoId={params.id as string} supabase={supabase} />
          </div>
        )}

      </div>
    </main>
  )
}

// ── Componente de histórico ───────────────────────────────────────
function HistoricoSimulacoes({ projetoId, supabase }: { projetoId: string; supabase: any }) {
  const [sims, setSims] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('simulacoes')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('created_at', { ascending: false })
      .then(({ data }: any) => setSims(data || []))
  }, [projetoId])

  if (sims.length === 0) return (
    <div className="bg-oikos-surface border border-oikos-border rounded-2xl p-10 text-center">
      <p className="text-sm text-oikos-muted">Nenhuma simulacao salva ainda.</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {sims.map(s => (
        <div key={s.id} className="bg-oikos-surface border border-oikos-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-oikos-muted">
              {new Date(s.created_at).toLocaleString('pt-BR')}
            </p>
            <span className="text-xs bg-blue-50 text-oikos-blue px-2 py-0.5 rounded-full">{s.modulo}</span>
          </div>
          <div className="flex gap-4 flex-wrap">
            {Object.entries(s.resultado || {}).map(([k, v]) => (
              <span key={k} className="text-xs font-mono text-oikos-text">
                <span className="text-oikos-muted">{k}=</span>{String(v)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
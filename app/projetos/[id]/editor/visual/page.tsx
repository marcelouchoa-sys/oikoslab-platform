'use client'

import { useCallback, useState, useEffect } from 'react'
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// ── Tipos de nós ─────────────────────────────────────────────────

function ParametroNode({ data, selected }: any) {
  return (
    <div className={`bg-white border-2 rounded-xl p-3 min-w-32 shadow-sm transition-all ${selected ? 'border-oikos-blue' : 'border-oikos-border'}`}>
      <div className="text-xs font-semibold uppercase tracking-widest text-oikos-muted mb-1">Parametro</div>
      <div className="flex items-center gap-1">
        <span className="text-sm font-mono font-bold text-oikos-text">{data.nome}</span>
        <span className="text-xs text-oikos-muted">=</span>
        <span className="text-sm font-mono text-oikos-blue">{data.valor}</span>
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-oikos-blue border-0" />
    </div>
  )
}

function EquacaoNode({ data, selected }: any) {
  return (
    <div className={`bg-white border-2 rounded-xl p-3 min-w-40 shadow-sm transition-all ${selected ? 'border-oikos-purple' : 'border-oikos-border'}`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-oikos-purple border-0" />
      <div className="text-xs font-semibold uppercase tracking-widest text-oikos-muted mb-1">{data.nome || 'Equacao'}</div>
      <div className="text-sm font-mono font-bold text-oikos-text">{data.variavel}</div>
      <div className="text-xs font-mono text-oikos-muted mt-0.5">= {data.expressao}</div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-oikos-green border-0" />
    </div>
  )
}

function ResultadoNode({ data, selected }: any) {
  return (
    <div className={`bg-white border-2 rounded-xl p-3 min-w-32 shadow-sm transition-all ${selected ? 'border-oikos-green' : 'border-oikos-border'}`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-oikos-green border-0" />
      <div className="text-xs font-semibold uppercase tracking-widest text-oikos-muted mb-1">Resultado</div>
      <div className="text-sm font-mono font-bold text-oikos-text">{data.variavel}</div>
      {data.valor !== undefined && (
        <div className="text-lg font-bold text-oikos-green mt-1">{Number(data.valor).toFixed(2)}</div>
      )}
    </div>
  )
}

const nodeTypes = {
  parametro: ParametroNode,
  equacao:   EquacaoNode,
  resultado: ResultadoNode,
}

// ── Página principal ──────────────────────────────────────────────
export default function EditorVisualPage() {
  const params   = useParams()
  const router   = useRouter()
  const supabase = createClient()

  const [projeto,      setProjeto]      = useState<any>(null)
  const [nodes,        setNodes,        onNodesChange] = useNodesState<Node>([])
  const [edges,        setEdges,        onEdgesChange] = useEdgesState<Edge>([])
  const [salvando,     setSalvando]     = useState(false)
  const [calculando,   setCalculando]   = useState(false)
  const [painelAberto, setPainelAberto] = useState<'add' | null>(null)
  const [novoNome,     setNovoNome]     = useState('')
  const [novoValor,    setNovoValor]    = useState('')
  const [novoTipo,     setNovoTipo]     = useState<'parametro' | 'equacao' | 'resultado'>('parametro')
  const [novaVar,      setNovaVar]      = useState('')
  const [novaExpr,     setNovaExpr]     = useState('')

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase.from('projetos').select('*').eq('id', params.id).single()
      if (!data) { router.push('/projetos'); return }
      setProjeto(data)
      if (data.configuracao?.visual_nodes) setNodes(data.configuracao.visual_nodes)
      if (data.configuracao?.visual_edges) setEdges(data.configuracao.visual_edges)
    }
    carregar()
  }, [params.id])

  const onConnect = useCallback(
    (connection: Connection) => setEdges(eds => addEdge({ ...connection, animated: true, style: { stroke: '#0066CC' } }, eds)),
    [setEdges]
  )

  function adicionarNo() {
    console.log('[adicionarNo] chamada', { novoTipo, novoNome, novoValor, novaVar, novaExpr })

    if (!novoNome.trim()) {
      console.warn('[adicionarNo] nome vazio, abortando')
      return
    }

    const id  = Math.random().toString(36).slice(2)
    const pos = { x: 150 + nodes.length * 60, y: 100 + nodes.length * 40 }

    let novoNo: Node

    if (novoTipo === 'parametro') {
      novoNo = { id, type: 'parametro', position: pos, data: { nome: novoNome, valor: parseFloat(novoValor) || 0 } }
    } else if (novoTipo === 'equacao') {
      novoNo = { id, type: 'equacao', position: pos, data: { nome: novoNome, variavel: novaVar, expressao: novaExpr } }
    } else {
      novoNo = { id, type: 'resultado', position: pos, data: { nome: novoNome, variavel: novaVar, valor: undefined } }
    }

    console.log('[adicionarNo] adicionando nó', novoNo)
    setNodes(prev => [...prev, novoNo])

    setNovoNome(''); setNovoValor(''); setNovaVar(''); setNovaExpr('')
    setPainelAberto(null)
  }

  async function salvar() {
    if (!projeto) return
    setSalvando(true)
    await supabase.from('projetos').update({
      configuracao: {
        ...projeto.configuracao,
        visual_nodes: nodes,
        visual_edges: edges,
      },
      updated_at: new Date().toISOString(),
    }).eq('id', projeto.id)
    setSalvando(false)
  }

  async function calcular() {
    setCalculando(true)
    try {
      const parametros = nodes
        .filter(n => n.type === 'parametro')
        .map(n => ({ nome: n.data.nome as string, valor: n.data.valor as number, descricao: '' }))

      const equacoes = nodes
        .filter(n => n.type === 'equacao')
        .map(n => ({ nome: n.data.nome as string, variavel: n.data.variavel as string, expressao: n.data.expressao as string }))

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${API_URL}/modelo/resolver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parametros, equacoes }),
      })
      const data = await res.json()

      if (data.valores) {
        setNodes(prev => prev.map(n => {
          if (n.type === 'resultado' && data.valores[n.data.variavel as string] !== undefined) {
            return { ...n, data: { ...n.data, valor: data.valores[n.data.variavel as string] } }
          }
          return n
        }))
      }
    } catch (e) {
      console.error(e)
    }
    setCalculando(false)
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-oikos-border px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projetos/${params.id}/editor`} className="text-sm text-oikos-muted hover:text-oikos-blue transition-colors">
            ← Editor texto
          </Link>
          <span className="text-oikos-border">|</span>
          <span className="text-sm font-semibold text-oikos-text">{projeto?.titulo} — Editor Visual</span>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setPainelAberto('add')}
            className="bg-oikos-surface border border-oikos-border text-oikos-text px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors">
            + Adicionar bloco
          </button>
          <button type="button" onClick={calcular} disabled={calculando}
            className="bg-oikos-green text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-colors disabled:opacity-50">
            {calculando ? 'Calculando...' : 'Calcular'}
          </button>
          <button type="button" onClick={salvar} disabled={salvando}
            className="bg-oikos-blue text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </header>

      {/* CANVAS */}
      <div className="pt-14 flex-1 h-[calc(100vh-56px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-oikos-surface"
        >
          <Background color="#D2D2D7" gap={20} />
          <Controls />
          <MiniMap nodeColor="#0066CC" maskColor="rgba(245,245,247,0.8)" />
        </ReactFlow>
      </div>

      {/* PAINEL ADICIONAR BLOCO */}
      {painelAberto === 'add' && (
        <div
          className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"
          onClick={() => setPainelAberto(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-96 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-oikos-text mb-4">Adicionar bloco</h3>

            <div className="flex gap-2 mb-4">
              {([
                { id: 'parametro', label: 'Parametro' },
                { id: 'equacao',   label: 'Equacao' },
                { id: 'resultado', label: 'Resultado' },
              ] as const).map(t => (
                <button type="button" key={t.id} onClick={() => setNovoTipo(t.id)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${novoTipo === t.id ? 'bg-oikos-blue text-white border-oikos-blue' : 'border-oikos-border text-oikos-muted hover:border-oikos-blue'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-oikos-muted block mb-1">Nome</label>
                <input
                  value={novoNome}
                  onChange={e => setNovoNome(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && adicionarNo()}
                  placeholder="Ex: Consumo, c0, Produto..."
                  className="w-full border border-oikos-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-oikos-blue"
                />
              </div>

              {novoTipo === 'parametro' && (
                <div>
                  <label className="text-xs font-medium text-oikos-muted block mb-1">Valor</label>
                  <input
                    type="number"
                    value={novoValor}
                    onChange={e => setNovoValor(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && adicionarNo()}
                    placeholder="Ex: 100"
                    className="w-full border border-oikos-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-oikos-blue"
                  />
                </div>
              )}

              {(novoTipo === 'equacao' || novoTipo === 'resultado') && (
                <div>
                  <label className="text-xs font-medium text-oikos-muted block mb-1">Variavel</label>
                  <input
                    value={novaVar}
                    onChange={e => setNovaVar(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && adicionarNo()}
                    placeholder="Ex: C, Y, I..."
                    className="w-full border border-oikos-border rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-oikos-blue"
                  />
                </div>
              )}

              {novoTipo === 'equacao' && (
                <div>
                  <label className="text-xs font-medium text-oikos-muted block mb-1">Expressao</label>
                  <input
                    value={novaExpr}
                    onChange={e => setNovaExpr(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && adicionarNo()}
                    placeholder="Ex: c0 + c1*(Y-T)"
                    className="w-full border border-oikos-border rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-oikos-blue"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={adicionarNo}
                className="flex-1 bg-oikos-blue text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => setPainelAberto(null)}
                className="flex-1 bg-oikos-surface border border-oikos-border text-oikos-text py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}
